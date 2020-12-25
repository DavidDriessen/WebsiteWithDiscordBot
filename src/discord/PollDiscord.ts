import {ArgsOf, Command, Description, Discord, Guard, On} from '@typeit/discord';
import {MessageAttachment, MessageEmbed, TextChannel} from 'discord.js';
import {Op} from 'sequelize';
import Poll from '../database/models/Poll';
import * as discordConfig from '../config/discord.json';
import * as moment from 'moment';
import {client} from '../start';
import {Order} from 'sequelize/types/lib/model';
import {BallotDiscord} from './BallotDiscord';
import {CheckRole} from './Guards';
import Ballot from '../database/models/Ballot';
import User from '../database/models/User';
import {DiscordHelper} from '../helpers/Discord';
import * as Jimp from 'jimp';
import PollOption from '../database/models/PollOption';

@Discord('!')
export class PollDiscord {

  public static getChannel() {
    return client.channels.cache.get(discordConfig.channel.poll) as TextChannel;
  }

  @Command('forceupdate')
  @Description('Force update bot channels')
  @Guard(CheckRole('Admin'))
  private forceupdate() {
    PollDiscord.updateChannel();
  }

  @On('ready')
  public static async updateChannel() {
    await PollDiscord.getChannel().messages.fetch();
    const order: Order = ['end', ['options', 'order', 'asc']];
    for (const poll of await Poll.findAll({
      where: {end: {[Op.gte]: moment()}},
      include: ['options'], order,
    })) {
      poll.save();
    }
    for (const poll of await Poll.findAll({
      where: {messageID: {[Op.ne]: null, [Op.ne]: ''}, end: {[Op.lt]: moment()}},
    })) {
      PollDiscord.removePoll(poll);
    }
  }

  @On('messageReactionAdd')
  public async getBallot([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (user.bot) {
      return;
    }
    const dbUser = (await User.get(user))[0];
    const poll = await Poll.findOne({
      where: {messageID: messageReaction.message.id},
      include: ['options'],
    });
    if (dbUser && poll) {
      const ballot = (await Ballot.findOrCreate({
        where: {userId: dbUser.id, pollId: poll.id},
      }))[0];
      // @ts-ignore
      ballot.user = await ballot.$get('user');
      // @ts-ignore
      ballot.poll = await ballot.$get('poll', {include: ['options'], order: [['options', 'order', 'asc']]});
      messageReaction.users.remove(user.id).then();
      if (messageReaction.emoji.name === '📝') {
        BallotDiscord.updateBallot(ballot, true);
        PollDiscord.updatePoll(poll);
      } else {
        const option = BallotDiscord.options.indexOf(messageReaction.emoji.name);
        if (option > -1) {
          if (await BallotDiscord.changeVote(user, option, ballot)) {
            BallotDiscord.updateBallot(ballot);
          }
        }
      }
    }
  }

  public static async appendImage(poll: Poll, embed: MessageEmbed) {
    let image;
    const path = (process.env.NODE_ENV === 'production') ? './public' : './client/public';
    if (poll.discordImage) {
      image = await DiscordHelper.renderImage([path + poll.discordImage]);
    } else {
      if (poll.options.some((o) => o.media && o.media.image)) {
        image = await DiscordHelper.renderImage(
          poll.options.filter((option: PollOption) =>
            option.media && option.media.image)
            .map((option: PollOption) => option.media?.image || '')
            .map((mImage: string) => mImage.startsWith('/') ?
              (discordConfig.callbackHost + mImage) : mImage));
      }
    }
    if (image) {
      embed.attachFiles([
        new MessageAttachment(await image.getBufferAsync(Jimp.MIME_PNG), 'image.png')]);
    }
  }

  private static async renderMessage(poll: Poll) {
    const pollRole = this.getChannel().guild.roles.cache.find((role) => role.name === 'Polls');
    const embed = new MessageEmbed();
    await this.appendImage(poll, embed);
    embed.setURL(discordConfig.callbackHost + '/polls');
    embed.setTitle(poll.title);
    let description = '<@&' + pollRole?.id + '> ' + poll.description || '';
    for (const [i, option] of poll.options.entries()) {
      description += '\n' + BallotDiscord.options[i] + ' ';
      option.media = await option.$get('media') || undefined;
      if (option.media) {
        const title = '**[' + option.media.title + '](' +
          discordConfig.callbackHost + '/media/' + option.media.id + ')** ';
        const genres = '(' + option.media.genres.join(', ') + ')';
        description += title + genres;
      }
      if (option.content) {
        description += (option.media ? '\n' : '') + option.content;
      }
    }
    embed.setDescription(description);
    embed.addField('Voters', (await poll.$get('ballots')).length);
    return embed;
  }

  public static async updatePoll(poll: Poll, force = false) {
    if (poll.messageID) {
      const msg = PollDiscord.getChannel().messages.cache.get(poll.messageID);
      if (msg) {
        if (force) {
          await msg.delete();
        } else {
          try {
            await msg.edit(await PollDiscord.renderMessage(poll));
          } catch (e) {
            // tslint:disable-next-line:no-console
            console.error('Error editing message for Poll: ' + poll.id + '\n', e);
          }
          return;
        }
      }
    }
    await PollDiscord.addPoll(poll);
  }

  public static async addPoll(poll: Poll) {
    try {
      const msg = await PollDiscord.getChannel()
        .send(await PollDiscord.renderMessage(poll));
      poll.messageID = msg.id;
      await msg.react('📝');
      BallotDiscord.addReactions(msg, poll.options.length);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error('Error adding message for Poll: ' + poll.id + '\n', e);
    }
  }

  public static async removePoll(poll: Poll) {
    if (poll.messageID) {
      const msg = PollDiscord.getChannel().messages.cache.get(poll.messageID);
      if (msg) {
        await msg.delete();
      }
      poll.messageID = '';
    }
  }
}

import {ArgsOf, Command, Description, Discord, Guard, On} from '@typeit/discord';
import {MessageEmbed, TextChannel} from 'discord.js';
import {Op} from 'sequelize';
import Poll from '../database/models/Poll';
import * as discordConfig from '../config/discord.json';
import * as moment from 'moment';
import {client} from '../start';
import {Order} from 'sequelize/types/lib/model';
import {DiscordHelper} from '../helpers/Discord';
import {BallotDiscord} from './BallotDiscord';
import {CheckRole} from './Guards';
import Ballot from '../database/models/Ballot';
import User from '../database/models/User';

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
      ballot.user = dbUser;
      ballot.poll = poll;
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

  private static async renderMessage(poll: Poll) {
    const pollRole = this.getChannel().guild.roles.cache.find((role) => role.name === 'Polls');
    await poll.fetchSeries();
    const embed = new MessageEmbed();
    embed.setURL(discordConfig.callbackHost + '/polls');
    embed.setTitle(poll.title);
    let description = '<@&' + pollRole?.id + '> ' + poll.description || '';

    let limit = Math.ceil((6000 - poll.title.length - poll.description?.length)
      / poll.options.length);
    if (limit > 1024) {
      limit = 1024;
    }

    for (const [i, option] of poll.options.entries()) {
      switch (option.type) {
        case 'Series':
          if (option.details) {
            const title = '**[' + (option.details.title.english ?
              option.details.title.english : option.details.title.romaji) +
              '](' + option.details.siteUrl + ')** ';
            // const description = DiscordHelper.wrapText(option.details.description,
            //   limit - title.length);
            const genres = '(' + option.details.genres.join(', ') + ')';
            description += '\n' + BallotDiscord.options[i] + ' ' + title + genres;
          }
          break;
        case 'Time':
          embed.addField(BallotDiscord.options[i], '```md\n' + moment(option.content).utc().format('< HH:mm >') + ' UTC \n```');
          break;
        case 'WeekTime':
          embed.addField(BallotDiscord.options[i], '```md\n' + moment(option.content).utc().format('< ddd [at] HH:mm >') + ' UTC \n```');
          break;
        case 'DateTime':
          embed.addField(BallotDiscord.options[i], '```md\n' + moment(option.content).utc()
            .format('< ddd DD of MMM [at] HH:mm >') + ' UTC \n```');
          break;
        case 'Date':
          embed.addField(BallotDiscord.options[i], '```md\n' + moment(option.content).utc().format('< ddd DD of MMM >') + ' UTC \n```');
          break;
        case 'General':
        default:
          embed.addField(BallotDiscord.options[i], DiscordHelper.wrapText(option.content, limit));
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
      // BallotDiscord.addReactions(msg, poll.options.length);
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

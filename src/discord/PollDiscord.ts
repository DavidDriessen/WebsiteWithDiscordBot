import {ArgsOf, Discord, On} from '@typeit/discord';
import {MessageEmbed, TextChannel, User as DiscordUser} from 'discord.js';
import {Op} from 'sequelize';
import Poll from '../models/Poll';
import * as TurndownService from 'turndown';
import * as discordConfig from '../config/discord.json';
import * as moment from 'moment';
import {client} from '../start';
import User, {IUser} from '../models/User';

@Discord()
export class PollDiscord {

  public static readonly options = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬'];

  public static getChannel() {
    return client.channels.cache.get(discordConfig.channel.poll) as TextChannel;
  }

  @On('ready')
  public async init() {
    await PollDiscord.getChannel().messages.fetch();
    const polls = await Poll.findAll({
      where: {messageID: {[Op.or]: [null, '']}},
      include: ['options'],
    });
    for (const poll of polls) {
      this.addPoll(poll);
    }
  }

  @On('messageReactionAdd')
  public async addVote([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (user.bot) {
      return;
    }
    const option = PollDiscord.options.indexOf(messageReaction.emoji.name);
    if (option > -1) {
      await PollDiscord.changeVote(messageReaction.message.id, option, user as DiscordUser);
    }
  }

  @On('messageReactionRemove')
  public async removeVote([messageReaction, user]: ArgsOf<'messageReactionRemove'>) {
    if (user.bot) {
      return;
    }
    const option = PollDiscord.options.indexOf(messageReaction.emoji.name);
    if (option > -1) {
      await PollDiscord.changeVote(
        messageReaction.message.id, option, user as DiscordUser, true);
    }
  }

  private static async changeVote(msgId: string, option: number,
                                  user: DiscordUser, remove = false) {
    const poll = await Poll.findOne({
      where: {messageID: msgId},
      include: ['options'],
    });
    if (poll && poll.options.length > option) {
      const u = await User.get(user as unknown as IUser);
      if (u) {
        if (remove) {
          poll.options[option].$remove('users', u[0]);
        } else {
          poll.options[option].$add('users', u[0]);
        }
      }
    }
  }


  private static async renderMessage(poll: Poll) {
    await poll.fetchSeries();
    const service = new TurndownService();
    const embed = new MessageEmbed();
    embed.setURL(discordConfig.callbackHost + '/polls');
    embed.setTitle(poll.title);
    embed.setDescription(poll.description);

    for (const [i, option] of poll.options.entries()) {
      let content = '-';
      if (option.type === 'Series') {
        if (option.details) {
          content = '**[' + option.details.title.english + '](' + option.details.siteUrl + ')**\n' +
            service.turndown(option.details.description).split(/\n( *)\n/)[0];
        }
      } else if (option.type === 'Time') {
        content = '```md\n' + moment(option.content).utc().format('< HH:mm >') + ' UTC \n```';
      } else if (option.type === 'WeekTime') {
        content = '```md\n' + moment(option.content).utc().format('< ddd [at] HH:mm >') + ' UTC \n```';
      } else if (option.type === 'DateTime') {
        content = '```md\n' + moment(option.content).utc().format('< ddd DD of MMM [at] HH:mm >') + ' UTC \n```';
      } else if (option.type === 'Date') {
        content = '```md\n' + moment(option.content).utc().format('< ddd DD of MMM >') + ' UTC \n```';
      } else {
        content = service.turndown(option.content);
      }
      embed.addField(this.options[i], content);
    }
    return embed;
  }

  public async addPoll(poll: Poll) {
    const msg = await PollDiscord.getChannel()
      .send(await PollDiscord.renderMessage(poll));
    poll.messageID = msg.id;
    for (let i = 0; i < poll.options.length; i++) {
      await msg.react(PollDiscord.options[i]);
    }
    poll.save();
  }

  public async removePoll(poll: Poll) {
    if (poll.messageID) {
      const msg = PollDiscord.getChannel().messages.cache.get(poll.messageID);
      if (msg) {
        await msg.delete();
        poll.messageID = '';
        poll.save();
      }
    }
  }
}

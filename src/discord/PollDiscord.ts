import {ArgsOf, Discord, On} from '@typeit/discord';
import {Message, MessageEmbed, TextChannel, User as DiscordUser} from 'discord.js';
import {Op} from 'sequelize';
import Poll from '../models/Poll';
import * as discordConfig from '../config/discord.json';
import * as moment from 'moment';
import {client} from '../start';
import User, {IUser} from '../models/User';
import {Order} from 'sequelize/types/lib/model';
import {DiscordHelper} from '../helpers/Discord';

@Discord()
export class PollDiscord {

  public static readonly options = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬'];

  public static getChannel() {
    return client.channels.cache.get(discordConfig.channel.poll) as TextChannel;
  }

  @On('ready')
  public async init() {
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
      poll.save();
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
      order: ['end', ['options', 'order', 'asc']],
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
    const embed = new MessageEmbed();
    embed.setURL(discordConfig.callbackHost + '/polls');
    embed.setTitle(poll.title);
    embed.setDescription(poll.description);

    let limit = Math.ceil((6000 - poll.title.length - poll.description.length)
      / poll.options.length);
    if (limit > 1024) {
      limit = 1024;
    }

    for (const [i, option] of poll.options.entries()) {
      let content = '-';
      switch (option.type) {
        case 'Series':
          if (option.details) {
            const title = '**[' + (option.details.title.english ?
              option.details.title.english : option.details.title.romaji) +
              '](' + option.details.siteUrl + ')**\n';
            const description = DiscordHelper.wrapText(option.details.description,
              limit - title.length);
            content = title + description;
          }
          break;
        case 'Time':
          content = '```md\n' + moment(option.content).utc().format('< HH:mm >') + ' UTC \n```';
          break;
        case 'WeekTime':
          content = '```md\n' + moment(option.content).utc().format('< ddd [at] HH:mm >') + ' UTC \n```';
          break;
        case 'DateTime':
          content = '```md\n' + moment(option.content).utc()
            .format('< ddd DD of MMM [at] HH:mm >') + ' UTC \n```';
          break;
        case 'Date':
          content = '```md\n' + moment(option.content).utc().format('< ddd DD of MMM >') + ' UTC \n```';
          break;
        case 'General':
        default:
          content = DiscordHelper.wrapText(option.content, limit);
      }
      embed.addField(PollDiscord.options[i], content);
    }
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
            console.error('Error editing Poll: ' + poll.id + '\n', e);
          }
          return;
        }
      }
    }
    await PollDiscord.addPoll(poll);
  }

  private static async addReactions(msg: Message, count: number) {
    for (let i = 0; i < count; i++) {
      await msg.react(PollDiscord.options[i]);
    }
  }

  public static async addPoll(poll: Poll) {
    try {
      const msg = await PollDiscord.getChannel()
        .send(await PollDiscord.renderMessage(poll));
      poll.messageID = msg.id;
      this.addReactions(msg, poll.options.length);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error('Error adding Poll: ' + poll.id + '\n', e);
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

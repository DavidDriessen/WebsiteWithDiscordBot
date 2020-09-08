import {Discord, On} from '@typeit/discord';
import {MessageEmbed, TextChannel} from 'discord.js';
import {Op} from 'sequelize';
import Poll from '../models/Poll';
import * as discordConfig from '../config/discord.json';
import * as moment from 'moment';
import {client} from '../start';
import {Order} from 'sequelize/types/lib/model';
import {DiscordHelper} from '../helpers/Discord';
import {VoteDiscord} from './VoteDiscord';

@Discord()
export class PollDiscord {

  public static getChannel() {
    return client.channels.cache.get(discordConfig.channel.poll) as TextChannel;
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

  private static async renderMessage(poll: Poll) {
    await poll.fetchSeries();
    const embed = new MessageEmbed();
    embed.setURL(discordConfig.callbackHost + '/polls');
    embed.setTitle(poll.title);
    if (poll.description) {
      embed.setDescription(poll.description);
    }

    let limit = Math.ceil((6000 - poll.title.length - poll.description?.length)
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
            // const description = DiscordHelper.wrapText(option.details.description,
            //   limit - title.length);
            const genres = '(' + option.details.genres.join(', ') + ')';
            content = title + genres;
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
      embed.addField(VoteDiscord.options[i], content);
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
      VoteDiscord.addReactions(msg, poll.options.length);
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

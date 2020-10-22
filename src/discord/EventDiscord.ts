import {MessageAttachment, Message, MessageEmbed, TextChannel} from 'discord.js';
import Event from '../database/models/Event';
import {client} from '../start';
import * as discordConfig from '../config/discord.json';
import * as Jimp from 'jimp';
import * as moment from 'moment';
import {AttendanceDiscord} from './AttendanceDiscord';
import {Op} from 'sequelize';
import Attendee from '../database/models/Attendee';
import SeriesEvent from '../database/models/SeriesEvent';
import {Command, Description, Discord, Guard, On} from '@typeit/discord';
import {CheckRole} from './Guards';
import {Order} from 'sequelize/types/lib/model';
import {DiscordHelper} from '../helpers/Discord';

@Discord('!')
export class EventDiscord {

  @Command('forceupdate')
  @Description('Force update bot channels')
  @Guard(CheckRole('Admin'))
  private forceupdate() {
    EventDiscord.updateChannel();
  }

  @On('ready')
  public static async updateChannel() {
    const channel = await EventDiscord.getChannel();
    const msgs = await channel.messages.fetch();
    const order: Order = ['start', ['series', 'order', 'asc']];
    let events = await Event.findAll({
      where: {
        start: {[Op.lte]: moment().add(1, 'week').add(12, 'hours').toDate()},
        end: {[Op.gt]: moment().toDate()},
      }, order,
      include: ['series', 'streamer', 'attendees'],
    });
    for (const event of events) {
      let msg;
      if (event.messageID) {
        msg = msgs.get(event.messageID);
      }
      if (!msg) {
        event.save();
      }
    }
    events = await Event.findAll({
      where: {
        end: {[Op.lt]: moment().toDate()},
        messageID: {[Op.ne]: null, [Op.ne]: ''},
      },
    });
    for (const event of events) {
      event.save();
    }
  }

  public static async getChannel() {
    return (await client.channels.fetch(discordConfig.channel.event)) as TextChannel;
  }

  private static async renderMessage(event: Event) {
    const series = await event.getSeries();
    let path;
    if (process.env.NODE_ENV === 'production') {
      path = './public';
    } else {
      path = './client/public';
    }
    const image = await DiscordHelper.renderImage(
      event.image ? [path + event.image] : series.map((media: SeriesEvent) =>
        media.details ? media.details.image : ''));

    const embed = new MessageEmbed();
    embed.setURL(discordConfig.callbackHost + '/schedule');
    embed.setTitle(event.title);
    embed.attachFiles([
      new MessageAttachment(await image.getBufferAsync(Jimp.MIME_PNG), 'image.png')]);
    embed.addField('Time', '```md\n' + moment(event.start).utc()
        .format('< ddd DD of MMM [at] HH:mm')
      + moment(event.end).utc().format(' — HH:mm > UTC') + '\n```');
    const streamer = await event.$get('streamer');
    if (streamer) {
      embed.addField('Streamer', '<@' + streamer.discordId + '>');
    }
    if (event.description) {
      embed.setDescription((event.description || ''));
    }

    let limit = Math.floor((6000 - event.title.length - event.description?.length) / series.length);
    if (limit > 1024) {
      limit = 1024;
    }

    for (const media of series) {
      if (media.details) {
        const title = '**[' + media.details.title + '](' + media.details.siteUrl + '): Ep ' +
          media.episode + (media.episodes > 1 ? '-' + (media.episode + media.episodes - 1) : '') + '**\n';
        const description = DiscordHelper.wrapText(media.details.description, limit - title.length);
        embed.addField('-', title + description);
      }
    }

    embed.addField('Attending', '```md\n- <Yes ' +
      await Attendee.count({where: {event: event.id, decision: 1}}) +
      '> <No  ' +
      await Attendee.count({where: {event: event.id, decision: 0}}) +
      '> <Undecided ' +
      await Attendee.count({where: {event: event.id, decision: 2}}) +
      '>\n```');

    if (event.roomcode) {
      embed.addField('Roomcode', '```md\n- < ' + event.roomcode + ' >\n```');
    }

    return embed;
  }

  public static async update(event: Event, force = false) {
    if (event.messageID) {
      const m = (await this.getChannel()).messages.cache.get(event.messageID);
      if (!moment().isBetween(
        moment(event.start).subtract(1, 'week').subtract(12, 'hours'),
        moment(event.end))) {
        if (m) {
          m.delete().then();
        }
        event.messageID = '';
        return;
      }
      if (m) {
        if (force) {
          m.delete().then();
          event.messageID = '';
        } else {
          m.edit(await this.renderMessage(event)).catch((e) => {
            // tslint:disable-next-line:no-console
            console.error('Error editing message for Event: ', event.id, '\n', e);
          });
          return;
        }
      }
    }
    if (!moment().isBetween(
      moment(event.start).subtract(1, 'week').subtract(12, 'hours'),
      moment(event.end))) {
      return;
    }
    try {
      const message: Message = await (await this.getChannel())
        .send(await this.renderMessage(event));
      event.messageID = message.id;
      if (!event.roomcode) {
        await message.react(AttendanceDiscord.options[1]);
        await message.react(AttendanceDiscord.options[0]);
        await message.react(AttendanceDiscord.options[2]);
      }
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error('Error adding message for Event: ', event.id, '\n', e);
    }
  }

  public static async removeEvent(event: Event) {
    if (event.messageID) {
      const m = (await this.getChannel()).messages.cache.get(event.messageID);
      if (m) {
        m.delete().then();
      }
    }
  }
}

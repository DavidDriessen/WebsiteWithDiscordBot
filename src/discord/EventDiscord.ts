import {MessageAttachment, Message, MessageEmbed, TextChannel} from 'discord.js';
import Event from '../models/Event';
import {client} from '../start';
import * as discordConfig from '../config/discord.json';
import * as Jimp from 'jimp';
import * as moment from 'moment';
import {AttendanceDiscord} from './AttendanceDiscord';
import {Op} from 'sequelize';
import * as TurndownService from 'turndown';
import Attendee from '../models/Attendee';
import SeriesEvent from '../models/SeriesEvent';
import {Command, Description, Discord, Guard} from '@typeit/discord';
import {CheckRole} from './Guards';

@Discord('!')
export class EventDiscord {

  @Command('forceupdate')
  @Description('Force update bot channels')
  @Guard(CheckRole('Admin'))
  private forceupdate() {
    EventDiscord.updateChannel();
  }

  public static async updateChannel() {
    const channel = await EventDiscord.getChannel();
    const msgs = await channel.messages.fetch();
    let events = await Event.findAll({
      where: {
        start: {[Op.lte]: moment().add(1, 'week').add(12, 'hours').toDate()},
        end: {[Op.gt]: moment().toDate()},
      },
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

  public static renderImage(urls: string[]) {
    return Promise.all(urls.map((url) => Jimp.read(url)))
      .then((images) => {
        const h = Math.min(...images.map((j) => j.getHeight()));
        // tslint:disable-next-line:no-shadowed-variable
        for (const image of images) {
          image.scale(h / image.getHeight());
        }
        const widths = images.map((j) => j.getWidth());
        const image = new Jimp(widths.reduce((a, b) => a + b), h);
        for (let i = 0; i < images.length; i++) {
          image.composite(images[i], widths.slice(0, i).reduce((a, b) => a + b, 0), 0);
        }
        return image;
      });
  }

  private static async renderMessage(event: Event) {
    const series = await event.getSeries();
    const image = await EventDiscord.renderImage(series.map((media: SeriesEvent) =>
      media.details ? media.details.coverImage.extraLarge : ''));
    const service = new TurndownService();

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
    embed.setDescription((event.description || ''));

    for (const media of series) {
      if (media.details) {
        embed.addField('-',
          '**[' + media.details.title.userPreferred + '](' + media.details.siteUrl + '): Ep ' +
          media.episode +
          (media.episodes > 1 ? '-' + (media.episode + media.episodes - 1) : '') +
          '**\n' + (media.details.description ?
          service.turndown(media.details.description).split(/\n( *)\n/)[0] : 'No description.'));
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
          m.edit(await this.renderMessage(event)).then();
          return;
        }
      }
    }
    if (!moment().isBetween(
      moment(event.start).subtract(1, 'week').subtract(12, 'hours'),
      moment(event.end))) {
      return;
    }
    const message: Message = await (await this.getChannel()).send(await this.renderMessage(event));
    event.messageID = message.id;
    if (!event.roomcode) {
      await message.react(AttendanceDiscord.options[1]);
      await message.react(AttendanceDiscord.options[0]);
      await message.react(AttendanceDiscord.options[2]);
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

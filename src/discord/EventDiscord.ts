import {Discord, On} from '@typeit/discord';
import {Attachment, Message, RichEmbed, TextChannel} from 'discord.js';
import Event from '../models/Event';
import {client} from '../start';
import * as discordConfig from '../config/discord.json';
import * as Jimp from 'jimp';
import {SeriesController} from '../controllers';
import * as moment from 'moment';
import {AttendanceDiscord} from './AttendanceDiscord';
import {Op} from 'sequelize';
import * as TurndownService from 'turndown';
import Attendee from '../models/Attendee';

@Discord()
export class EventDiscord {

    @On('ready')
    public static async updateChannel() {
        const channel = EventDiscord.getChannel();
        const msgs = await channel.fetchMessages();
        let events = await Event.findAll({
            where: {
                start:
                    {
                        [Op.gte]: moment().toDate(),
                        [Op.lte]: moment().add(1, 'week').toDate(),
                    },
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
                start:
                    {
                        [Op.or]: {
                            [Op.lt]: moment().toDate(),
                            [Op.gt]: moment().add(1, 'week').toDate(),
                        },
                    },
                messageID: {[Op.ne]: null, [Op.ne]: ''},
            },
        });
        for (const event of events) {
            event.save();
        }
    }

    private static getChannel() {
        return client.channels.get(discordConfig.channel.event) as TextChannel;
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
        const seriesDB = await event.$get('series');
        const order = seriesDB.sort((a, b) => {
            return a.order - b.order;
        }).map((s) => s.seriesId);
        const series = (await SeriesController
            .getSeriesById(seriesDB.map((seriesEvent) => seriesEvent.seriesId)) || [])
            .sort((a: { id: number; }, b: { id: number; }) => {
                return order.indexOf(a.id) - order.indexOf(b.id);
            });

        const image = await EventDiscord.renderImage(
            series.map((media: { coverImage: { extraLarge: string; }; }) =>
                media.coverImage.extraLarge));
        const service = new TurndownService();

        const embed = new RichEmbed();
        embed.setURL(discordConfig.callbackHost + '/schedule');
        embed.setTitle(event.title);
        embed.attachFile(new Attachment(await image.getBufferAsync(Jimp.MIME_PNG), 'image.png'));
        embed.addField('Time', '```md\n' + moment(event.start).utc().format('< ddd DD of MMM [at] HH:mm')
            + moment(event.end).utc().format(' — HH:mm > UTC') + '\n```');
        embed.setDescription((event.description || ''));

        for (const media of series) {
            embed.addField('-',
                '**[' + media.title.english + '](' + media.siteUrl + ')**\n' +
                service.turndown(media.description));
        }

        embed.addField('Attending', '```md\n- <Yes ' +
            await Attendee.count({where: {event: event.id, decision: 1}}) +
            '> <No  ' +
            await Attendee.count({where: {event: event.id, decision: 0}}) +
            '> <Undecided ' +
            await Attendee.count({where: {event: event.id, decision: 2}}) +
            '>\n```');

        return embed;
    }

    public static async update(event: Event) {
        if (event.messageID) {
            const m = this.getChannel().messages.get(event.messageID);
            if (event.roomcode ||
                !moment(event.start).isBetween(moment(), moment().add(1, 'week'))) {
                if (m) {
                    m.delete().then();
                }
                event.messageID = '';
                return;
            }
            if (m) {
                const series = await event.$get('series');
                const time = Math.max(...series.map((s) => s.updatedAt));
                if (moment(time).isSameOrAfter(event.updatedAt)) {
                    m.delete().then();
                    event.messageID = '';
                } else {
                    m.edit(await this.renderMessage(event)).then();
                    return;
                }
            }
        }
        if (event.roomcode || !moment(event.start).isBetween(moment(), moment().add(1, 'week'))) {
            return;
        }
        const message: Message = await this.getChannel().send(await this.renderMessage(event));
        event.messageID = message.id;
        await message.react(AttendanceDiscord.options[1]);
        await message.react(AttendanceDiscord.options[0]);
        await message.react(AttendanceDiscord.options[2]);
    }
}

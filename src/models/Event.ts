import {
    BelongsToMany,
    Column,
    Model,
    Table,
    HasMany,
    BelongsTo, HasOne, BeforeCreate, BeforeUpdate,
} from 'sequelize-typescript';
import User from './User';
import Attendee from './Attendee';
import SeriesEvent from './SeriesEvent';
import {client} from '../start';
import {TextChannel, Message, RichEmbed, Attachment} from 'discord.js';
import * as discordConfig from '../config/discord.json';
import {SeriesController} from '../controllers';
import {AttendanceDiscord} from '../discord/AttendanceDiscord';
import * as moment from 'moment';
import * as Jimp from 'jimp';

@Table
export class Event extends Model<Event> {
    @Column
    public title!: string;

    @Column
    public description!: string;

    @Column
    public image!: string;

    @BelongsTo(() => User, 'streamerId')
    public streamer!: User;
    public streaming?: boolean;

    @HasOne(() => Attendee, 'event')
    public attending!: Attendee;

    // @ts-ignore
    @HasMany(() => SeriesEvent)
    public series!: SeriesEvent[];

    // @ts-ignore
    @BelongsToMany(() => User, () => Attendee)
    public attendees!: User[];

    @Column
    public start!: Date;

    @Column
    public end!: Date;

    @Column
    public roomcode?: string;

    @Column
    public messageID?: string;

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
        const order = event.series.sort((a, b) => {
            return a.order - b.order;
        }).map((s) => s.seriesId);
        const series = (await SeriesController
            .getSeriesById(event.series.map((seriesEvent) => seriesEvent.seriesId)) || [])
            .sort((a: { id: number; }, b: { id: number; }) => {
                return order.indexOf(a.id) - order.indexOf(b.id);
            });
        const image = await Event
            .renderImage(series
                .map((media: { coverImage: { extraLarge: string; }; }) =>
                    media.coverImage.extraLarge));
        const embed = new RichEmbed();
        embed.setTitle(event.title);
        embed.attachFile(new Attachment(await image.getBufferAsync(Jimp.MIME_PNG), 'image.png'));
        embed.addField('Time', '```md\n' + moment(event.start).utc().format('< MMM DD, HH:mm')
            + moment(event.end).utc().format(' — HH:mm >') + '\n```');
        embed.setDescription(event.description || '');
        for (const media of series) {
            embed.addField('```' + media.title.english + ' ```',
                media.description.replace('<br>', '\n').replace(/<[^>]+>/g, ''));
        }
        return embed;
    }

    @BeforeCreate
    public static async postMessage(event: Event) {
        if (moment(event.start).isAfter(moment()) &&
            moment().add(1, 'week').isAfter(moment(event.start))) {
            const message: Message = await this.getChannel().send(await this.renderMessage(event));
            event.messageID = message.id;
            await message.react(AttendanceDiscord.options[1]);
            await message.react(AttendanceDiscord.options[0]);
            await message.react(AttendanceDiscord.options[2]);
        }
    }

    @BeforeUpdate
    public static async updateMessage(event: Event) {
        if (!event.roomcode) {
            if (event.messageID) {
                const message = await this.getChannel().fetchMessages()
                    // @ts-ignore
                    .then((msgs) => msgs.get(event.messageID));
                if (message) {
                    await message.delete();
                } else {
                    // tslint:disable-next-line:no-console
                    console.error('Can\'t find message: ' + event.messageID);
                }
                await Event.postMessage(event);
            } else {
                await Event.postMessage(event);
            }
        }
    }
}

export default Event;

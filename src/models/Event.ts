import {
    BelongsToMany,
    Column,
    Model,
    Table,
    HasMany,
    BelongsTo, HasOne, BeforeCreate, AfterUpdate,
} from 'sequelize-typescript';
import User from './User';
import Attendee from './Attendee';
import SeriesEvent from './SeriesEvent';
import {client} from '../start';
import { TextChannel, Message, RichEmbed } from 'discord.js';
import * as discordConfig from '../config/discord.json';
import {SeriesController} from '../controllers';
import {AttendanceDiscord} from '../discord/AttendanceDiscord';
import * as moment from 'moment';

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

    private static async renderMessage(event: Event) {
        const series = await SeriesController
            // tslint:disable-next-line:no-shadowed-variable
            .getSeriesById(event.series.map((series) => series.seriesId)) || [];
        const embed = new RichEmbed();
        embed.setTitle(event.title);
        embed.addField('Time', moment(event.start).format('MMM dd, hh:mm'));
        embed.setDescription((event.description || ''));
        for (const media of series) {
            embed.addField('*' + media.title.english + '*',
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

    @AfterUpdate
    public static async updateMessage(event: Event) {
        if (event.messageID) {
            const message = await this.getChannel().fetchMessages()
                // @ts-ignore
                .then((msgs) => msgs.get(event.messageID));
            if (message) {
                message.edit(await this.renderMessage(event));
            } else {
                // tslint:disable-next-line:no-console
                console.error('Can\'t find message: ' + event.messageID);
            }
        } else {
            await Event.postMessage(event);
        }
    }
}

export default Event;

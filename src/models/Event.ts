import {
    BelongsToMany,
    Column,
    Model,
    Table,
    HasMany,
    BelongsTo, HasOne, BeforeCreate,
} from 'sequelize-typescript';
import User from './User';
import Attendee from './Attendee';
import SeriesEvent from './SeriesEvent';
import {client} from '../start';
import { TextChannel, Message, RichEmbed } from 'discord.js';
import * as discordConfig from '../config/discord.json';
import {SeriesController} from '../controllers';

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

    @BeforeCreate
    public static async postMessage(event: Event) {
        const controller = new SeriesController();
        // tslint:disable-next-line:no-shadowed-variable
        const series = await controller
            // tslint:disable-next-line:no-shadowed-variable
            .getSeriesById(event.series.map((series) => series.seriesId)) || [];
        const channel = client.channels.get(process.env.NODE_ENV === 'production' ?
            discordConfig.production.channelId :
            discordConfig.development.channelId) as TextChannel;
        const embed = new RichEmbed();
        embed.setTitle(event.title);
        embed.setDescription((event.description || '') + '\n' +
            series.map((media: { title: { english: string; }; description: string; }) => {
            return media.title.english + '\n' +  media.description.replace('<br>', '\n').replace(/<[^>]+>/g, '');
        }).join('\n'));
        const message: Message = await channel.send(embed);
        event.messageID = message.id;
    }

}

export default Event;

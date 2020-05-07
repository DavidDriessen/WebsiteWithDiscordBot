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
import {EventDiscord} from '../discord/EventDiscord';

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


    @BeforeCreate
    public static async postMessage(event: Event) {
        await EventDiscord.update(event);
    }

    @BeforeUpdate
    public static async updateMessage(event: Event) {
        await EventDiscord.update(event);
    }
}

export default Event;

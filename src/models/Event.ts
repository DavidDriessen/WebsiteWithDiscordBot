import {
    BelongsToMany,
    Column,
    Model,
    Table,
    HasMany,
    BelongsTo, ForeignKey, HasOne,
} from 'sequelize-typescript';
import User from './User';
import Attendee from './Attendee';
import SeriesEvent from './SeriesEvent';

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

}

export default Event;

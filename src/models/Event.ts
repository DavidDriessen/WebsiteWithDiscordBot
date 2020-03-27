import {BelongsToMany, Column, ForeignKey, Model, Table,} from 'sequelize-typescript';
import User from './User';
import Attendee from './Attendee';
import Series from './Series';
import SeriesEvent from './SeriesEvent';

@Table
export class Event extends Model<Event> {
    @Column
    public title!: string;

    @Column
    public description!: string;

    @Column
    public image!: string;

    @ForeignKey(() => User)
    public streamer!: User;

    // @ts-ignore
    @BelongsToMany(() => Series, () => SeriesEvent)
    public series!: Array<Series & {SeriesEvent: SeriesEvent}>;

    // @ts-ignore
    @BelongsToMany(() => User, () => Attendee)
    public attendees!: User[];

    @Column
    public start!: Date;

    @Column
    public end!: Date;

}

export default Event;

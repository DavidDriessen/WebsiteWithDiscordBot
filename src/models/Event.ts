import {BelongsToMany, Column, Model, Table} from 'sequelize-typescript';
import User from './User';
import Attendee from './Attendee';

@Table
export class Event extends Model<Event> {

    @Column
    public title!: string;

    @Column
    public description!: string;

    @Column
    public start!: Date;

    @Column
    public end!: Date;

    // @ts-ignore
    @BelongsToMany(() => User, () => Attendee)
    public attendees!: User[];
}

export default Event;

import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import User from './User';
import Event from './Event';

@Table
export class Attendee extends Model<Event> {

    // @ts-ignore
    @ForeignKey(() => User)
    public user!: User;

    // @ts-ignore
    @ForeignKey(() => Event)
    public event!: Event;

    @Column
    public decision!: number;
}

export default Attendee;

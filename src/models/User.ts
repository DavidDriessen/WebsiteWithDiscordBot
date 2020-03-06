import {BelongsToMany, Column, Model, Table} from 'sequelize-typescript';
import Attendee from './Attendee';
import Event from './Event';

@Table
export class User extends Model<User> {

    @Column
    public name!: string;

    @Column
    public discordId!: string;

    // @ts-ignore
    @BelongsToMany(() => Event, () => Attendee)
    public events!: Event[];
}

export default User;

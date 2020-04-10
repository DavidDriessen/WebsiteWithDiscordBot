import {BelongsToMany, Column, HasMany, Model, Table} from 'sequelize-typescript';
import Attendee from './Attendee';
import Event from './Event';

@Table
export class User extends Model<User> {

    @Column
    public name!: string;

    @Column
    public avatar!: string;

    @Column
    public discordId!: string;

    @Column
    public role!: string;

    @HasMany(() => Event, 'streamerId')
    public streams!: Event[];

    @BelongsToMany(() => Event, () => Attendee)
    public events!: Event[];
}

export default User;

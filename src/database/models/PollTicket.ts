import {BelongsToMany, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript';
import User from './User';
import PollOption from './PollOption';
import Poll from './Poll';
import PollVote from './PollVote';

@Table
export class PollTicket extends Model<PollTicket> {

    // @ts-ignore
    @ForeignKey(() => User)
    @Column({primaryKey: true, type: DataType.INTEGER})
    public user!: number;

    // @ts-ignore
    @ForeignKey(() => Poll)
    @Column({primaryKey: true, type: DataType.INTEGER})
    public poll!: number;

    @BelongsToMany(() => PollOption, () => PollVote)
    public options!: PollOption[];

    @Column
    public discordMessageID!: string;

}

export default PollTicket;

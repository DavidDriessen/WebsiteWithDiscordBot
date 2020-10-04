import {ForeignKey, Model, Table} from 'sequelize-typescript';
import PollOption from './PollOption';
import PollTicket from './PollTicket';
import User from './User';

@Table
export class PollVote extends Model<PollVote> {

    // @ts-ignore
    @ForeignKey(() => User, () => PollTicket)
    public user!: User;

    // @ts-ignore
    @ForeignKey(() => PollTicket)
    public ticket!: PollTicket;

    // @ts-ignore
    @ForeignKey(() => PollOption)
    public option!: PollOption;

}

export default PollVote;

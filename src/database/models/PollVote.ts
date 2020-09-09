import {ForeignKey, Model, Table} from 'sequelize-typescript';
import User from './User';
import PollOption from './PollOption';

@Table
export class PollVote extends Model<PollVote> {

    // @ts-ignore
    @ForeignKey(() => User)
    public user!: User;

    // @ts-ignore
    @ForeignKey(() => PollOption)
    public option!: PollOption;

}

export default PollVote;

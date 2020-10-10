import {ForeignKey, Model, Table} from 'sequelize-typescript';
import PollOption from './PollOption';
import Ballot from './Ballot';
import User from './User';
import PollOption from './PollOption';

@Table
export class PollVote extends Model<PollVote> {

    // @ts-ignore
    @ForeignKey(() => User, () => Ballot)
    public user!: User;

    // @ts-ignore
    @ForeignKey(() => Ballot)
    public ballot!: Ballot;

    // @ts-ignore
    @ForeignKey(() => PollOption)
    public option!: PollOption;

}

export default PollVote;

import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import PollOption from './PollOption';
import Ballot from './Ballot';

@Table
export class PollVote extends Model<PollVote> {

  // @ts-ignore
  @ForeignKey(() => Ballot)
  public ballot!: Ballot;

  // @ts-ignore
  @ForeignKey(() => PollOption)
  public option!: PollOption;

  @Column
  public choice!: number;

}

export default PollVote;

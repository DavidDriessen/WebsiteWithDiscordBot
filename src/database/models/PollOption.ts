import {
  BelongsTo,
  BelongsToMany,
  Column,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';
import Poll from './Poll';
import PollVote from './PollVote';
import {DataTypes} from 'sequelize';
import Ballot from './Ballot';
import Media from './Media';

export type PollOptionTypes = 'Series' | 'Time' | 'Date' | 'DateTime' | 'WeekTime' | 'General';

@Table
export class PollOption extends Model<PollOption> {

  @BelongsTo(() => Poll, 'pollId')
  public poll!: Poll;

  @Default('General')
  @Column(DataTypes.ENUM('Series', 'Time', 'Date', 'DateTime', 'WeekTime', 'General'))
  public type!: PollOptionTypes;

  @Column
  public content!: string;

  @Column
  public order!: number;

  @BelongsToMany(() => Ballot, () => PollVote)
  public ballots!: Ballot[];

  public voted?: boolean;

  public details?: Media;

  // tslint:disable-next-line:variable-name
  public PollVote?: PollVote;

}

export default PollOption;

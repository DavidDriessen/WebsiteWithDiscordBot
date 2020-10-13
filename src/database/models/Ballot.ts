import {
  BelongsTo,
  BelongsToMany,
  Column,
  Model,
  Table,
} from 'sequelize-typescript';
import User from './User';
import PollOption from './PollOption';
import Poll from './Poll';
import PollVote from './PollVote';

@Table
export class Ballot extends Model<Ballot> {

  @BelongsTo(() => User, 'userId')
  public user!: User;

  @BelongsTo(() => Poll, 'pollId')
  public poll!: Poll;

  @BelongsToMany(() => PollOption, () => PollVote)
  public options!: PollOption[];

  @Column
  public discordMessageID!: string;

  // tslint:disable-next-line:variable-name
  public PollVote?: PollVote;

}

export default Ballot;

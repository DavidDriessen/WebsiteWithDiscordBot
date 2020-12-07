import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column, ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import Poll from './Poll';
import PollVote from './PollVote';
import {DataTypes} from 'sequelize';
import Ballot from './Ballot';
import Media from './Media';

@Table
export class PollOption extends Model<PollOption> {

  @BelongsTo(() => Poll, 'pollId')
  public poll!: Poll;

  @BelongsTo(() => Media, 'mediaId')
  public media?: Media;

  @AllowNull
  @Column(DataTypes.TIME)
  public time?: Date;

  @AllowNull
  @Column
  public weekDay?: number;

  @AllowNull
  @Column(DataTypes.DATE)
  public date?: Date;

  @Column
  public content!: string;

  @Column
  public order!: number;

  @BelongsToMany(() => Ballot, () => PollVote)
  public ballots!: Ballot[];

  public voted?: boolean;

  // tslint:disable-next-line:variable-name
  public PollVote?: PollVote;

}

export default PollOption;

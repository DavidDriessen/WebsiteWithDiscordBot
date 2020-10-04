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
import PollTicket from './PollTicket';

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

  @BelongsToMany(() => PollTicket, () => PollVote)
  public tickets!: PollTicket[];

  public voted?: boolean;

  public details?: {
    title: { english: string; romaji: string; userPreferred: string };
    coverImage: { extraLarge: string; };
    description: string;
    siteUrl: string;
    genres: string[];
  };

}

export default PollOption;

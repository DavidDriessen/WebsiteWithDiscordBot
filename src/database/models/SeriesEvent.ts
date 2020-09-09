import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import Event from './Event';

@Table
export class SeriesEvent extends Model<SeriesEvent> {

  // @ts-ignore
  @ForeignKey(() => Event)
  public event!: Event;

  @Column({primaryKey: true, field: 'event'})
  public eventId!: number;

  @Column({primaryKey: true})
  public seriesId!: number;

  @Column
  public order!: number;

  @Column
  public episode!: number;

  @Column
  public episodes!: number;

  public details?: {
    title: { english: string; romaji: string; userPreferred: string };
    coverImage: { extraLarge: string; };
    description: string;
    siteUrl: string;
  };
}

export default SeriesEvent;

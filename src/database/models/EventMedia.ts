import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import Event from './Event';
import Media from './Media';

@Table
export class EventMedia extends Model<EventMedia> {

  @ForeignKey(() => Event)
  public event!: Event;

  @ForeignKey(() => Media)
  public media!: Media;

  @Column
  public order!: number;

  @Column
  public episode!: number;

  @Column
  public episodes!: number;
}

export default EventMedia;

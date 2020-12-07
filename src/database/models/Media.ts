import {
  Column, DataType, HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import EventMedia from './EventMedia';
import MediaReference from './MediaReference';

@Table
export class Media extends Model<Media> {

  @Column
  public title!: string;

  @Column(DataType.TEXT)
  public description!: string;

  @Column
  public image!: string;

  @Column(DataType.JSON)
  public genres!: string[];

  @Column
  public duration!: number;

  @Column
  public episodes!: number;

  // tslint:disable-next-line:variable-name
  public EventMedia!: EventMedia;

  @HasMany(() => MediaReference)
  public references!: MediaReference[];
}

export default Media;

import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import Media from './Media';

@Table
export class MediaReference extends Model<MediaReference> {

  @ForeignKey(() => Media)
  public media!: Media;

  @Column
  public name!: string;

  @Column
  public type!: string;

  @Column
  public apiID!: string;

  @Column
  public url!: string;
}

export default MediaReference;

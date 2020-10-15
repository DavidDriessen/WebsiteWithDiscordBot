import {
  Column, DataType,
  Model,
  Table,
} from 'sequelize-typescript';


export interface IAPIMedia {
  id: number;
  idMal: number;
  title: { english: string; romaji: string; userPreferred: string };
  description: string;
  siteUrl: string;
  coverImage: { extraLarge: string; medium: string };
  genres: string[];
  episodes: number;
  duration: number;
}

@Table
export class Media extends Model<Media> {

  @Column
  public aniId!: number;

  @Column
  public malId!: number;

  @Column
  public title!: string;

  @Column(DataType.TEXT)
  public get description() {
    return this.getDataValue('description');
  }

  public set description(description: string) {
    this.setDataValue('description', this.sequelize.escape(description));
  }

  @Column
  public image!: string;

  @Column
  public siteUrl!: string;

  @Column(DataType.JSON)
  public genres!: string[];

  @Column
  public duration!: number;

  @Column
  public episodes!: number;

  public static parse(media: IAPIMedia) {
    return Media.build({
      aniId: media.id,
      malId: media.idMal,
      title: media.title.english || media.title.romaji || media.title.userPreferred,
      description: media.description,
      image: media.coverImage.extraLarge,
      siteUrl: media.siteUrl,
      genres: media.genres,
      duration: media.duration,
      episodes: media.episodes,
    });
  }

}

export default Media;

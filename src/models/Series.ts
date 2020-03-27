import {BelongsToMany, Column, Model, Table} from 'sequelize-typescript';
import SeriesEvent from './SeriesEvent';
import Event from './Event';
import axios from 'axios';

export interface ISeries {
    title: string;
    description: string;
    image: string;
    episodes: number;
    episodeLength: number;
}

@Table
export class Series extends Model<Series> implements ISeries {

    @Column
    public title!: string;

    @Column
    public description!: string;

    @Column
    public image!: string;

    @Column
    public episodes!: number;

    @Column
    public episodeLength!: number;

    // @ts-ignore
    @BelongsToMany(() => Event, () => SeriesEvent)
    public events!: Array<Event & { SeriesEvent: SeriesEvent }>;

    @Column
    public start!: Date;

    @Column
    public end!: Date;

    public static async search(name: string) {
        let series: ISeries[] = [];
        series = series.concat(await Series.findAll({where: {title: '*' + name + '*'}}));
        series = series.concat(await axios.post('https://anilist-graphql.p.rapidapi.com/',
            {
                query: `{
Page{
  media(search: "bookworm"){
  site
    siteUrl
    title{english romaji  userPreferred}
    description
    status
    season
    episodes
    coverImage {
      medium
    }
  }
}
}`,
            },
            {
                headers: {
                    'content-type': 'application/json',
                    'x-rapidapi-host': 'anilist-graphql.p.rapidapi.com',
                    'x-rapidapi-key': '7312ba6a87mshd90faca3bd5b364p160c8bjsn42e2ef6a0aa4',
                    'accept': 'application/json',
                },
            }));
        return series;
    }
}

export default Series;

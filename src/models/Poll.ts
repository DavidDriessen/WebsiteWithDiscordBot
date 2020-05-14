import {Column, HasMany, Model, Table} from 'sequelize-typescript';
import PollOption from './PollOption';
import {SeriesController} from '../controllers';

@Table
export class Poll extends Model<Poll> {

    @Column
    public title!: string;

    @Column
    public description!: string;

    @Column
    public messageID?: string;

    @Column
    public end!: Date;

    @HasMany(() => PollOption, 'pollId')
    public options!: PollOption[];

    public async fetchSeries() {
        const series = await SeriesController
            .getSeriesById(this.options.filter((o) => o.type === 'Series')
                .map((o) => Number(o.content)) || []);
        if (series.length === 0) {
            return false;
        }
        for (const option of this.options) {
            if (option.type === 'Series') {
                option.details = series
                    .find((m: { id: number; }) => m.id === Number(option.content));
            }
        }
        return true;
    }

}

export default Poll;

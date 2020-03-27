import {Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import Event from './Event';
import Series from './Series';

@Table
export class SeriesEvent extends Model<SeriesEvent> {

    // @ts-ignore
    @ForeignKey(() => Series)
    public series!: Series;

    // @ts-ignore
    @ForeignKey(() => Event)
    public event!: Event;

    @Column
    public episode!: number;

    @Column
    public episodes!: number;
}

export default SeriesEvent;

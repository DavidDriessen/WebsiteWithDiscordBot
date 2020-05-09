import {
    BelongsToMany,
    Column,
    Model,
    Table,
    HasMany,
    BelongsTo, HasOne, BeforeCreate, BeforeUpdate,
} from 'sequelize-typescript';
import User from './User';
import Attendee from './Attendee';
import SeriesEvent from './SeriesEvent';
import {EventDiscord} from '../discord/EventDiscord';
import {SeriesController} from '../controllers';

@Table
export class Event extends Model<Event> {
    @Column
    public title!: string;

    @Column
    public description!: string;

    @Column
    public image!: string;

    @BelongsTo(() => User, 'streamerId')
    public streamer!: User;
    public streaming?: boolean;

    @HasOne(() => Attendee, 'event')
    public attending!: Attendee;

    // @ts-ignore
    @HasMany(() => SeriesEvent)
    public series!: SeriesEvent[];

    // @ts-ignore
    @BelongsToMany(() => User, () => Attendee)
    public attendees!: User[];

    @Column
    public start!: Date;

    @Column
    public end!: Date;

    @Column
    public roomcode?: string;

    @Column
    public messageID?: string;

    public async getSeries() {
        const series = await SeriesController
            .getSeriesById(this.series.map((seriesEvent) => seriesEvent.seriesId)) || [];
        return this.series.map((s) => {
            s.details = series.find((m: { id: number; }) => m.id === s.seriesId);
            return s;
        }).sort((a, b) => {
            return a.order - b.order;
        });
    }

    @BeforeCreate
    public static async postMessage(event: Event) {
        await EventDiscord.update(event);
    }

    @BeforeUpdate
    public static async updateMessage(event: Event) {
        const dbSeries = await SeriesEvent.findAll({where: {event: event.id}});
        if (event.series === undefined) {
            event.series = dbSeries;
        }
        if (dbSeries.length === event.series.length) {
            if (event.series.filter((s) => !s.changed()).length === event.series.length) {
                await EventDiscord.update(event);
                return;
            }
        } else {
            // @ts-ignore
            const ids = dbSeries.map((series) => series.seriesId);
            for (const series of event.series) {
                if (ids.indexOf(series.seriesId) === -1) {
                    series.destroy();
                }
            }
        }
        for (const series of event.series) {
            series.save();
        }
        await EventDiscord.update(event, true);
    }
}

export default Event;

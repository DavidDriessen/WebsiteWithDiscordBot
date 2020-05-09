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
        const db = this.series || await this.$get('series');
        if (!db) {
            return [];
        }
        const series = await SeriesController
            .getSeriesById(db.map((seriesEvent) => seriesEvent.seriesId)) || [];
        return db.map((s) => {
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
        await EventDiscord.update(event);
    }
}

export default Event;

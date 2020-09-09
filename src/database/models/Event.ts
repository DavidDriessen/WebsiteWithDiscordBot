import {
  BelongsToMany,
  Column,
  Model,
  Table,
  HasMany,
  BelongsTo, HasOne, BeforeCreate, BeforeUpdate, BeforeDestroy,
} from 'sequelize-typescript';
import User from './User';
import Attendee from './Attendee';
import SeriesEvent from './SeriesEvent';
import {EventDiscord} from '../../discord/EventDiscord';
import {SeriesController} from '../../controllers';

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
    const deleted = dbSeries.filter((db) =>
      event.series.filter((s) =>
        s.seriesId === db.seriesId).length === 0);
    const changed = event.series.filter((s) => s.changed());
    if (deleted.length === 0 && changed.length === 0) {
      await EventDiscord.update(event);
    } else {
      for (const series of deleted) {
        series.destroy();
      }
      for (const series of changed) {
        series.save();
      }
      await EventDiscord.update(event, true);
    }
  }

  @BeforeDestroy
  public static async removeEvent(event: Event) {
    EventDiscord.removeEvent(event);
  }
}

export default Event;

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
// @ts-ignore
import * as Serializer from 'sequelize-to-json/index.js';
import Media from './Media';

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
      s.details = series.find((m: Media) => m.aniId === s.seriesId);
      return s;
    }).sort((a, b) => {
      return a.order - b.order;
    });
  }

  public serialize(user: User | null) {
    const scheme = {
      include: ['@pk', 'title', 'description', 'start', 'end', 'image', 'roomcode', 'series', 'streamer', 'attending', 'attendees'],
      assoc: {
        series: {
          include: ['seriesId', 'episode', 'episodes'],
          exclude: ['@fk', '@auto'],
        },
        streamer: {
          include: ['@pk', 'name', 'avatar'],
        },
        attending: {
          postSerialize: (serialized: Attendee, original: Attendee) => {
            return original.decision;
          },
        },
        attendees: {
          include: ['name', 'avatar'],
          exclude: ['@fk', '@auto'],
          postSerialize: (serialized: { attending: number }, original: { Attendee: Attendee }) => {
            serialized.attending = original.Attendee.decision;
            return serialized;
          },
        },
      },
      postSerialize: (serialized: { streaming: boolean }, original: { streamer: User }) => {
        if (user) {
          serialized.streaming = original.streamer.id === user.id;
        }
        return serialized;
      },
    };
    const options = {};
    return (new Serializer(Event, scheme, options)).serialize(this);
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

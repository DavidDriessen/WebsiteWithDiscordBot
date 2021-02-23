import {
  BelongsToMany,
  Column,
  Model,
  Table,
  BelongsTo, HasOne, BeforeCreate, BeforeUpdate, BeforeDestroy,
} from 'sequelize-typescript';
import User from './User';
import Media from './Media';
import Attendee from './Attendee';
import EventMedia from './EventMedia';
import {EventDiscord} from '../../discord/EventDiscord';
// @ts-ignore
import Serializer from 'sequelize-to-json/index.js';

@Table
export class Event extends Model<Event> {
  @Column
  public title!: string;

  @Column
  public description!: string;

  @Column
  public image?: string;

  @Column
  public discordImage?: string;

  public streamerId!: number;

  @BelongsTo(() => User, 'streamerId')
  public streamer!: User;

  @HasOne(() => Attendee, 'event')
  public attending!: Attendee;

  // @ts-ignore
  @BelongsToMany(() => Media, () => EventMedia)
  public media!: Media[];

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

  public serialize(user: User | null) {
    const scheme = {
      include: ['@pk', 'title', 'description', 'start', 'end', 'image', 'discordImage', 'roomcode', 'media', 'streamer', 'attending', 'attendees'],
      assoc: {
        media: {
          include: ['id', 'title', 'image', 'description', 'episodes', 'EventMedia'],
          assoc: {
            EventMedia: {
              include: ['episode', 'episodes'],
              exclude: ['@fk', '@auto'],
            },
          },
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
    const force = event.media.length !== event.previous('media').length || event.media.map((m) => {
      if (m.EventMedia.changed) {
        const c = m.EventMedia.changed();
        if (c) {
          return c.some((p) => p === 'order');
        }
        return c;
      }
      return true;
    }).some((m) => m);
    await EventDiscord.update(event, force);
  }

  @BeforeDestroy
  public static async removeEvent(event: Event) {
    EventDiscord.removeEvent(event);
  }
}

export default Event;

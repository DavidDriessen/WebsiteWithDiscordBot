import {
  BeforeCreate,
  BeforeDestroy,
  BeforeUpdate,
  Column,
  HasMany,
  Model,
  Table
} from 'sequelize-typescript';
import PollOption from './PollOption';
import {SeriesController} from '../controllers';
// @ts-ignore
import * as Serializer from '../../node_modules/sequelize-to-json/index';
import User from './User';
import {EventDiscord} from '../discord/EventDiscord';
import SeriesEvent from './SeriesEvent';

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

  public serialize(user: User | undefined) {
    const scheme = {
      include: ['@all', 'options'],
      exclude: ['@pk', '@fk', '@auto'],
      assoc: {
        options: {
          exclude: ['@fk', '@auto'],
          postSerialize: (serialized: PollOption, original: PollOption) => {
            if (user) {
              serialized.voted = original.users.some((u) => u.id === user.id);
            }
            return serialized;
          },
        },
      },
    };
    if (user?.role === 'Admin') {
      scheme.exclude = ['@fk', '@auto'];
    }
    const options = {};
    return (new Serializer(Poll, scheme, options)).serialize(this);
  }


  @BeforeCreate
  public static async postMessage(poll: Poll) {
    return;
  }

  @BeforeUpdate
  public static async updateMessage(poll: Poll) {
    const options = await PollOption.findAll({where: {pollId: poll.id}});
    if (poll.options === undefined) {
      poll.options = options;
    }
    const deleted = options.filter((db) =>
      poll.options.filter((option) => option.id === db.id).length === 0);
    const changed = poll.options.filter((s) => s.changed());
    if (deleted.length === 0 && changed.length === 0) {
      return;
    } else {
      for (const option of deleted) {
        option.destroy();
      }
      for (const option of changed) {
        option.save();
      }
    }
  }

  @BeforeDestroy
  public static async removeEvent(poll: Poll) {
    return;
  }
}

export default Poll;

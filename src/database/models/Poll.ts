import {
  BeforeCreate,
  BeforeDestroy,
  BeforeUpdate,
  Column,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import PollOption from './PollOption';
import {SeriesController} from '../../controllers';
// @ts-ignore
import * as Serializer from 'sequelize-to-json/index.js';
import User from './User';
import {PollDiscord} from '../../discord/PollDiscord';
import {Order} from 'sequelize/types/lib/model';
import Ballot from './Ballot';
import {BallotDiscord} from '../../discord/BallotDiscord';

@Table
export class Poll extends Model<Poll> {

  @Column
  public title!: string;

  @Column
  public description!: string;

  @Column({allowNull: true})
  public messageID?: string;

  @Column
  public end!: Date;

  @HasMany(() => PollOption, 'pollId')
  public options!: PollOption[];

  @HasMany(() => Ballot)
  public ballots!: Ballot[];

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
      include: ['title', 'description', 'end', 'options'],
      exclude: ['@fk', '@auto'],
      assoc: {
        options: {
          include: ['@all'],
          exclude: ['@fk', '@auto'],
          postSerialize:
            (serialized: { id: number, votes: number, voted: boolean }, original: PollOption) => {
              if (user) {
                if (user.role === 'Admin') {
                  serialized.id = original.id;
                  if (original.ballots) {
                    serialized.votes = original.ballots.length;
                  }
                }
                if (original.ballots) {
                  serialized.voted = original.ballots.some((t) => t.user === user.id);
                }
              }
              return serialized;
            },
        },
      },
      postSerialize: (serialized: PollOption, original: PollOption) => {
        if (user && user.role === 'Admin') {
          serialized.id = original.id;
        }
        return serialized;
      },
    };
    if (user?.role === 'Admin') {
      scheme.assoc.options.include.push('users');
    }
    const options = {};
    return (new Serializer(Poll, scheme, options)).serialize(this);
  }


  @BeforeCreate
  public static postMessage(poll: Poll) {
    PollDiscord.addPoll(poll);
  }

  @BeforeUpdate
  public static async updateMessage(poll: Poll) {
    const order: Order = [['order', 'asc']];
    const options = await PollOption.findAll({where: {pollId: poll.id}, order});
    if (poll.options === undefined) {
      poll.options = options;
    }
    const deleted = options.filter((db) =>
      poll.options.filter((option) => option.id === db.id).length === 0);
    const changed = poll.options.filter((s) => s.changed());
    if (deleted.length === 0 && changed.length === 0) {
      await PollDiscord.updatePoll(poll);
    } else {
      for (const option of deleted) {
        option.destroy();
      }
      for (const option of changed) {
        option.save();
      }
      await PollDiscord.updatePoll(poll, true);
    }
    for (const ballot of await poll.$get('ballots')) {
      BallotDiscord.updateBallot(ballot, true);
    }
  }

  @BeforeDestroy
  public static removeEvent(poll: Poll) {
    PollDiscord.removePoll(poll);
  }
}

export default Poll;

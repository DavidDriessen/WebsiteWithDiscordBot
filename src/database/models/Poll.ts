import {
  BeforeDestroy,
  BeforeUpdate,
  Column,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import PollOption from './PollOption';
// @ts-ignore
import * as Serializer from 'sequelize-to-json/index.js';
import User from './User';
import {PollDiscord} from '../../discord/PollDiscord';
import {Order} from 'sequelize/types/lib/model';
import Ballot from './Ballot';

@Table
export class Poll extends Model<Poll> {

  @Column
  public title!: string;

  @Column
  public image!: string;

  @Column
  public discordImage!: string;

  @Column
  public description!: string;

  @Column({allowNull: true})
  public messageID?: string;

  @Column
  public end!: Date;

  @HasMany(() => PollOption, 'pollId')
  public options!: PollOption[];

  @HasMany(() => Ballot, 'pollId')
  public ballots!: Ballot[];

  public serialize(user: User | undefined) {
    const scheme = {
      include: ['title', 'description', 'end', 'options', 'image'],
      exclude: ['@fk', '@auto'],
      assoc: {
        options: {
          include: ['@all', 'media'],
          exclude: ['@fk', '@auto'],
          assoc: {
            media: {
              include: ['@all'],
              exclude: ['@fk', '@auto'],
            },
          },
          postSerialize:
            (serialized: {
               id: number,
               votes: Array<{ userId: number, user: string, choice: number }>, voted: number,
             },
             original: PollOption) => {
              if (user) {
                if (user.role === 'Admin') {
                  serialized.id = original.id;
                  if (original.ballots) {
                    serialized.votes = original.ballots.map((b: Ballot) => {
                      return {
                        userId: b.user.id,
                        user: b.user.name,
                        choice: b.PollVote ? b.PollVote.choice : 0,
                      };
                    });
                  }
                }
                if (original.ballots) {
                  const ballot = original.ballots.find((b) => b.user.id === user.id);
                  if (ballot && ballot.PollVote) {
                    serialized.voted = ballot.PollVote.choice;
                  }
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
  }

  @BeforeDestroy
  public static removeEvent(poll: Poll) {
    PollDiscord.removePoll(poll);
  }
}

export default Poll;

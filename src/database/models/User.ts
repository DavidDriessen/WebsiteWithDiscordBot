import {BelongsToMany, Column, DataType, HasMany, Model, Table} from 'sequelize-typescript';
import {PartialUser, User as DiscordUser} from 'discord.js';
import Attendee from './Attendee';
import Event from './Event';
import Ballot from './Ballot';

export interface IUser {
  id: string;
  avatar: string | null | undefined;
  username: string;
  discriminator: string;

  bot?: boolean;
  email?: string;
  flags?: number;
  locale?: string;
  verified?: boolean;
  mfa_enabled?: string;
  premium_type?: number;
}

@Table
export class User extends Model<User> {

  @Column
  public name!: string;

  @Column
  public email!: string;

  @Column
  public avatar!: string;

  @Column
  public discordId!: string;

  @Column
  public role!: string;

  @HasMany(() => Ballot, 'userId')
  public ballots!: Ballot[];

  @HasMany(() => Event, 'streamerId')
  public streams!: Event[];

  @BelongsToMany(() => Event, () => Attendee)
  public events!: Event[];

  @Column(DataType.JSON)
  public permissions!: string[];

  public static async get(discordUser: IUser | DiscordUser | PartialUser) {
    const res = await User.findOrCreate({
      where: {discordId: discordUser.id}, defaults: {
        name: discordUser.username,
        avatar: 'https://cdn.discordapp.com/avatars/' + discordUser.id +
          '/' + discordUser.avatar + '.jpg',
      },
    });

    const email = (discordUser as IUser).email;
    if (!res[0].email && email) {
      res[0].email = email;
      res[0].save();
    }

    return res;
  }
}

export default User;

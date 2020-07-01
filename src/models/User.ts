import {BelongsToMany, Column, HasMany, Model, Table} from 'sequelize-typescript';
import Attendee from './Attendee';
import Event from './Event';

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

  @HasMany(() => Event, 'streamerId')
  public streams!: Event[];

  @BelongsToMany(() => Event, () => Attendee)
  public events!: Event[];

  public static async get(discordUser: IUser) {
    const res = await User.findOrCreate({
      where: {discordId: discordUser.id}, defaults: {
        name: discordUser.username,
        email: discordUser.email,
        avatar: 'https://cdn.discordapp.com/avatars/' + discordUser.id +
          '/' + discordUser.avatar + '.jpg',
      },
    });

    if (!res[0].email && discordUser.email) {
      res[0].email = discordUser.email;
      res[0].save();
    }

    return res;
  }
}

export default User;

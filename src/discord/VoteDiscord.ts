import {ArgsOf, Discord, On} from '@typeit/discord';
import {Message, TextChannel, User as DiscordUser} from 'discord.js';
import {Op} from 'sequelize';
import Poll from '../database/models/Poll';
import * as discordConfig from '../config/discord.json';
import {client} from '../start';
import User, {IUser} from '../database/models/User';
import {PollDiscord} from './PollDiscord';

@Discord()
export class VoteDiscord {

  public static readonly options = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬'];

  public static getChannel() {
    return client.channels.cache.get(discordConfig.channel.poll) as TextChannel;
  }

  @On('ready')
  public async init() {
    const msgs = await (await PollDiscord.getChannel()).messages.fetch();
    const polls = await Poll.findAll({
      where: {messageID: {[Op.in]: msgs.keyArray()}},
      include: [{association: 'options', include: ['users']}],
    });
    for (const poll of polls) {
      if (poll.messageID) {
        const msg = msgs.get(poll.messageID);
        if (msg) {
          for (const messageReaction of msg.reactions.cache.array()) {
            const users = await messageReaction.users.fetch();
            for (const [, user] of users) {
              await this.addVote([messageReaction, user]);
            }
            // -- Not practical
            // const option = this.options.indexOf(messageReaction.emoji.name);
            // if (option > -1) {
            //   for (const user of poll.options[option].users) {
            //     if (!users.has(user.discordId)) {
            //       await this.removeVote([messageReaction,
            //         await client.users.fetch(user.discordId)]);
            //     }
            //   }
            // }
          }
        }
      }
    }
  }

  @On('messageReactionAdd')
  public async addVote([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (user.bot) {
      return;
    }
    const option = VoteDiscord.options.indexOf(messageReaction.emoji.name);
    if (option > -1) {
      await VoteDiscord.changeVote(messageReaction.message.id, option, user as DiscordUser);
    }
  }

  @On('messageReactionRemove')
  public async removeVote([messageReaction, user]: ArgsOf<'messageReactionRemove'>) {
    if (user.bot) {
      return;
    }
    const option = VoteDiscord.options.indexOf(messageReaction.emoji.name);
    if (option > -1) {
      await VoteDiscord.changeVote(
        messageReaction.message.id, option, user as DiscordUser, true);
    }
  }

  private static async changeVote(msgId: string, option: number,
                                  user: DiscordUser, remove = false) {
    const poll = await Poll.findOne({
      where: {messageID: msgId},
      include: ['options'],
      order: ['end', ['options', 'order', 'asc']],
    });
    if (poll && poll.options.length > option) {
      const u = await User.get(user as unknown as IUser);
      if (u) {
        if (remove) {
          poll.options[option].$remove('users', u[0]);
        } else {
          poll.options[option].$add('users', u[0]);
        }
      }
    }
  }

  public static async addReactions(msg: Message, count: number) {
    for (let i = 0; i < count; i++) {
      await msg.react(this.options[i]);
    }
  }
}

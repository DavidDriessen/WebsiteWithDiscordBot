import {ArgsOf, Discord, On} from '@typeit/discord';
import {User as DiscordUser, Message, MessageEmbed, PartialUser} from 'discord.js';
import * as discordConfig from '../config/discord.json';
import {client} from '../start';
import Ballot from '../database/models/Ballot';
import User from '../database/models/User';
import Poll from '../database/models/Poll';
import PollOption from '../database/models/PollOption';
import PollVote from '../database/models/PollVote';
import {PollDiscord} from './PollDiscord';

@Discord()
export class BallotDiscord {

  public static readonly options = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬'];

  @On('ready')
  public async init() {
    const ballots = await Ballot.findAll({
      include: ['user'],
    });
    for (const ballot of ballots) {
      if (ballot.discordMessageID) {
        const dbUser = await User.findByPk(ballot.user.id);
        if (dbUser) {
          const user = await client.users.fetch(dbUser.discordId);
          const dm = user.dmChannel || await user.createDM();
          try {
            const msg = await dm.messages.fetch(ballot.discordMessageID);
            if (msg) {
              for (const messageReaction of msg.reactions.cache
                .filter((r) => !!r.count && r.count > 1).array()) {
                for (const ruser of (await messageReaction.users.fetch()).array()) {
                  BallotDiscord.receiveVote([messageReaction, ruser]);
                }
              }
            }
          } catch (e) {
            // tslint:disable-next-line:no-console
            console.log('DM message \'' + ballot.discordMessageID + '\' not found');
            ballot.discordMessageID = '';
            ballot.save();
          }
        }
      }
    }
  }

  public static async voteChoice(user: DiscordUser | PartialUser, option: PollOption) {
    const choices = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    let content = '';
    option.media = await option.$get('media') || undefined;
    if (option.media) {
      content += option.media.title;
    }
    if (option.content) {
      content += (option.media ? '\n' : '') + option.content;
    }

    const dm = user.dmChannel || await user.createDM();
    const m = await dm.send('Voting for option: ' + content);
    for (const choice of choices) {
      await m.react(choice);
    }
    try {
      const reactions = await m.awaitReactions((r, u) => {
        return !u.bot;
      }, {max: 1, time: 20000, errors: ['time']});
      m.delete().catch(() => {
        return;
      });
      const reaction = reactions.first();
      if (reaction) {
        const choice = choices.indexOf(reaction.emoji.name);
        if (choice >= 0) {
          return choice;
        }
      }
    } catch (e) {
      m.delete().catch(() => {
        return;
      });
    }
  }

  private static async renderMessage(ballot: Ballot) {
    const poll = await Poll.findByPk(ballot.poll.id, {
      include: [{association: 'options', include: ['media']}], order: [['options', 'order', 'asc']],
    });
    if (poll) {
      const embed = new MessageEmbed();
      await PollDiscord.appendImage(poll, embed);
      embed.setURL(discordConfig.callbackHost + '/polls');
      embed.setTitle(poll.title);
      let description = poll.description || '';
      for (const [i, option] of poll.options.entries()) {
        description += '\n' + BallotDiscord.options[i] + ' ';
        option.media = await option.$get('media') || undefined;
        const choice = this.options[
        ballot.options.find((o) => o.id === option.id)?.PollVote?.choice || 0];
        if (option.media) {
          const title = '**[' + option.media.title + '](' +
            discordConfig.callbackHost + '/media/' + option.media.id + ')** ';
          const genres = '(' + option.media.genres.join(', ') + ')';
          description += title + (option.content ? '\n' + option.content : '')
            + genres + ' ' + choice;
        }
        if (!option.media && option.content) {
          description += option.content + ' ' + choice;
        }
      }
      embed.setDescription(description);
      const votes = poll.options
        .map((o, key) => ballot.options.indexOf(o) >= 0 ? BallotDiscord.options[key] : false)
        .filter((v) => v);
      if (votes.length > 0) {
        embed.addField('Votes', votes.join(' '));
      }
      return embed;
    }
    return '';
  }

  @On('messageReactionAdd')
  public static async receiveVote([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (user.bot) {
      return;
    }
    const option = BallotDiscord.options.indexOf(messageReaction.emoji.name);
    if (option > -1) {
      const ballot = await Ballot.findOne({
        where: {discordMessageID: messageReaction.message.id},
        include: ['user', {
          association: 'poll', include: ['options'],
        }],
        order: [['poll', 'options', 'order', 'asc']],
      });
      if (ballot) {
        await BallotDiscord.changeVote(user, option, ballot);
        BallotDiscord.updateBallot(ballot, true);
      }
    }
  }

  public static async changeVote(user: DiscordUser | PartialUser, option: number, ballot: Ballot) {
    if (ballot.poll && ballot.poll.options.length > option) {
      const choice = await this.voteChoice(user, ballot.poll.options[option]);
      if (typeof choice !== 'undefined') {
        const vote = await PollVote.findOrCreate({
          where: {ballot: ballot.id, option: ballot.poll.options[option].id},
          defaults: {choice},
        });
        if (!vote[1]) {
          vote[0].choice = choice;
          vote[0].save();
        }
        return true;
      }
    }
    return false;
  }

  public static async addReactions(msg: Message, count: number) {
    for (let i = 0; i < count; i++) {
      await msg.react(this.options[i]);
    }
  }

  public static async updateBallot(ballot: Ballot, force = false) {
    let msg;
    const user = await client.users.fetch(ballot.user.discordId);
    const dm = user.dmChannel || await user.createDM();
    if (ballot.discordMessageID) {
      try {
        msg = await dm.messages.fetch(ballot.discordMessageID);
        if (msg) {
          if (force) {
            await msg.delete();
          } else {
            try {
              ballot.options = await ballot.$get('options');
              await msg.edit(await BallotDiscord.renderMessage(ballot));
            } catch (e) {
              // tslint:disable-next-line:no-console
              console.error('Error editing message for Ballot: ' + ballot.id + '\n', e);
            }
            return;
          }
        }
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.log('DM message \'' + ballot.discordMessageID + '\' not found');
      }
    }
    ballot.options = await ballot.$get('options');
    msg = await dm.send(await BallotDiscord.renderMessage(ballot));
    ballot.discordMessageID = msg.id;
    ballot.save();
    const poll = await Poll.findByPk(ballot.poll.id, {include: ['options']});
    if (poll) {
      await this.addReactions(msg, poll.options.length);
    }
  }
}

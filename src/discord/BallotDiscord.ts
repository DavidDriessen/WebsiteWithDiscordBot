import {ArgsOf, Discord, On} from '@typeit/discord';
import {User as DiscordUser, Message, MessageEmbed, PartialUser} from 'discord.js';
import * as discordConfig from '../config/discord.json';
import {client} from '../start';
import Ballot from '../database/models/Ballot';
import * as moment from 'moment';
import {DiscordHelper} from '../helpers/Discord';
import User from '../database/models/User';
import Poll from '../database/models/Poll';
import PollOption from '../database/models/PollOption';
import {SeriesController} from '../controllers';
import PollVote from '../database/models/PollVote';

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
                  this.receiveVote([messageReaction, ruser]);
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

  @On('message')
  private voteCommand([message]: ArgsOf<'message'>) {
    if (message.content.toLowerCase().startsWith('vote ')) {
      const options = message.content.split(' ');
      options.splice(0, 1);
      if (options.length > 0) {
        for (const option of options) {
          if (isNaN(Number(option))) {
            message.reply('Invalid option: ' + option)
              .then((d) => d.delete({timeout: 5000})
                .catch(() => {
                  return;
                }));
            return;
          }
        }
        message.delete().catch(() => {
          return;
        });
      }
    }
    // else if (message.channel.id === discordConfig.channel.poll && !message.author.bot) {
    //   message.delete();
    // }
  }

  public static async voteChoice(user: DiscordUser | PartialUser, option: PollOption) {
    const choices = ['💖', '❤️', '🤷', '🚫'];
    let content;
    if (option.type === 'Series') {
      // @ts-ignore
      content = (await SeriesController.getSeriesById([option.content]))[0].title.userPreferred;
    } else {
      content = option.content;
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
        return choices.length - choices.indexOf(reaction.emoji.name) - 1;
      }
    } catch (e) {
      m.delete().catch(() => {
        return;
      });
    }
  }

  private static getVoteText(option: PollOption | undefined) {
    if (!option || !option.PollVote) {
      return '';
    }
    switch (option.PollVote.choice) {
      case 3:
        return '[Must watch]';
      case 2:
        return '[Is ok]';
      case 1:
        return '[Don\'t mind]';
      case 0:
        return '[No interest]';
      default:
        return '';
    }
  }

  private static async renderMessage(ballot: Ballot) {
    const poll = await Poll.findByPk(ballot.poll.id, {
      include: ['options'], order: [['options', 'order', 'asc']],
    });
    if (poll) {
      await poll.fetchSeries();
      const embed = new MessageEmbed();
      embed.setURL(discordConfig.callbackHost + '/polls');
      embed.setTitle(poll.title);
      let description = poll.description || '';

      let limit = Math.ceil((6000 - poll.title.length - poll.description?.length)
        / poll.options.length);
      if (limit > 1024) {
        limit = 1024;
      }

      for (const [i, option] of poll.options.entries()) {
        switch (option.type) {
          case 'Series':
            if (option.details) {
              const title = '**[' + (option.details.title.english ?
                option.details.title.english : option.details.title.romaji) +
                '](' + option.details.siteUrl + ')** ';
              // const description = DiscordHelper.wrapText(option.details.description,
              //   limit - title.length);
              const genres = '(' + option.details.genres.join(', ') + ')';
              description += '\n' + BallotDiscord.options[i] + ' ' + title
                + '```CSS\n' + genres
                + this.getVoteText(ballot.options.find((o) => o.id === option.id)) + '```';
            }
            break;
          case 'Time':
            embed.addField(BallotDiscord.options[i], '```md\n' + moment(option.content).utc()
              .format('< HH:mm >') + ' UTC \n```');
            break;
          case 'WeekTime':
            embed.addField(BallotDiscord.options[i], '```md\n' + moment(option.content).utc()
              .format('< ddd [at] HH:mm >') + ' UTC \n```');
            break;
          case 'DateTime':
            embed.addField(BallotDiscord.options[i], '```md\n' + moment(option.content).utc()
              .format('< ddd DD of MMM [at] HH:mm >') + ' UTC \n```');
            break;
          case 'Date':
            embed.addField(BallotDiscord.options[i], '```md\n' + moment(option.content).utc()
              .format('< ddd DD of MMM >') + ' UTC \n```');
            break;
          case 'General':
          default:
            embed.addField(BallotDiscord.options[i], DiscordHelper.wrapText(option.content, limit));
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
  }

  @On('messageReactionAdd')
  public async receiveVote([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (user.bot) {
      return;
    }
    const option = BallotDiscord.options.indexOf(messageReaction.emoji.name);
    if (option > -1) {
      const ballot = await Ballot.findOne({
        where: {discordMessageID: messageReaction.message.id},
        include: ['user', {
          association: 'poll', include: ['options'], order: [['options', 'order', 'asc']],
        }],
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

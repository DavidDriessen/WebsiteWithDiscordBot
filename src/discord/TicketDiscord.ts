import {ArgsOf, Discord, On} from '@typeit/discord';
import {Message, MessageEmbed} from 'discord.js';
import * as discordConfig from '../config/discord.json';
import {client} from '../start';
import PollTicket from '../database/models/PollTicket';
import * as moment from 'moment';
import {DiscordHelper} from '../helpers/Discord';
import User from '../database/models/User';
import Poll from '../database/models/Poll';

@Discord()
export class TicketDiscord {

  public static readonly options = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬'];

  @On('ready')
  public async init() {
    const tickets = await PollTicket.findAll({
      include: [{association: 'options', include: ['poll']}],
    });
    for (const ticket of tickets) {
      if (ticket.discordMessageID) {
        const dbUser = await User.findByPk(ticket.user as number);
        if (dbUser) {
          const user = await client.users.fetch(dbUser.discordId);
          const dm = user.dmChannel || await user.createDM();
          const msg = await dm.messages.fetch(ticket.discordMessageID);
          if (msg) {
            for (const messageReaction of msg.reactions.cache.array()) {
              if (messageReaction.users.cache.size > 1) {
                this.addVote([messageReaction, user]);
              }
              if (messageReaction.users.cache.size < 1) {
                this.removeVote([messageReaction, user]);
              }
            }
          }
        }
      }
    }
  }

  private static async renderMessage(ticket: PollTicket) {
    const poll = await Poll.findByPk(ticket.poll, {include: ['options']});
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
              description += '\n\n' + TicketDiscord.options[i] + ' ' + title + genres;
            }
            break;
          case 'Time':
            embed.addField(TicketDiscord.options[i], '```md\n' + moment(option.content).utc()
              .format('< HH:mm >') + ' UTC \n```');
            break;
          case 'WeekTime':
            embed.addField(TicketDiscord.options[i], '```md\n' + moment(option.content).utc()
              .format('< ddd [at] HH:mm >') + ' UTC \n```');
            break;
          case 'DateTime':
            embed.addField(TicketDiscord.options[i], '```md\n' + moment(option.content).utc()
              .format('< ddd DD of MMM [at] HH:mm >') + ' UTC \n```');
            break;
          case 'Date':
            embed.addField(TicketDiscord.options[i], '```md\n' + moment(option.content).utc()
              .format('< ddd DD of MMM >') + ' UTC \n```');
            break;
          case 'General':
          default:
            embed.addField(TicketDiscord.options[i], DiscordHelper.wrapText(option.content, limit));
        }
      }
      embed.setDescription(description);
      const votes = poll.options
        .map((o, key) => ticket.options.indexOf(o) >= 0 ? TicketDiscord.options[key] : false)
        .filter((v) => v);
      if (votes.length > 0) {
        embed.addField('Votes', votes.join(' '));
      }
      return embed;
    }
  }

  @On('messageReactionAdd')
  public async addVote([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (user.bot) {
      return;
    }
    const option = TicketDiscord.options.indexOf(messageReaction.emoji.name);
    if (option > -1) {
      messageReaction.remove();
      const ticket = await PollTicket.findOne({
        where: {discordMessageID: messageReaction.message.id},
      });
      if (ticket) {
        await TicketDiscord.changeVote(option, ticket);
      }
    }
  }

  @On('messageReactionRemove')
  public async removeVote([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (user.bot) {
      return;
    }
    const option = TicketDiscord.options.indexOf(messageReaction.emoji.name);
    if (option > -1) {
      messageReaction.message.react(TicketDiscord.options[option]);
      const ticket = await PollTicket.findOne({
        where: {discordMessageID: messageReaction.message.id},
      });
      if (ticket) {
        await TicketDiscord.changeVote(option, ticket);
      }
    }
  }

  private static async changeVote(option: number, ticket: PollTicket) {
    const poll = await Poll.findByPk(ticket.poll, {
      include: [{association: 'options', order: ['order', 'asc']}],
    });
    if (poll && poll.options.length > option) {
      if (poll.options[option].$has('tickets', ticket)) {
        poll.options[option].$remove('tickets', ticket);
      } else {
        poll.options[option].$add('tickets', ticket);
      }
    }
  }

  public static async addReactions(msg: Message, count: number) {
    for (let i = 0; i < count; i++) {
      await msg.react(this.options[i]);
    }
  }

  public static async updateTicket(ticket: PollTicket, force = false) {
    const u = await User.findByPk(ticket.user);
    let msg;
    if (u) {
      const user = await client.users.fetch(u.discordId);
      const dm = user.dmChannel || await user.createDM();
      if (ticket.discordMessageID) {
        msg = await dm.messages.fetch(ticket.discordMessageID);
        if (msg) {
          if (force) {
            await msg.delete();
          } else {
            try {
              ticket.options = await ticket.$get('options');
              await msg.edit(await TicketDiscord.renderMessage(ticket));
            } catch (e) {
              // tslint:disable-next-line:no-console
              console.error('Error editing message for Ticket: ' + ticket.id + '\n', e);
            }
            return;
          }
        }
      }
      ticket.options = await ticket.$get('options');
      msg = await dm.send(await TicketDiscord.renderMessage(ticket));
      const poll = await Poll.findByPk(ticket.poll, {include: ['options']});
      if (poll) {
        this.addReactions(msg, poll.options.length);
      }
      ticket.discordMessageID = msg.id;
      ticket.save();
    }
  }
}

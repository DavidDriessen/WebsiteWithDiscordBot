import {Command, CommandMessage, Discord, Guard, On} from '@typeit/discord';
import {MessageReaction} from 'discord.js';
import Event from '../database/models/Event';
import User, {IUser} from '../database/models/User';
import Attendee from '../database/models/Attendee';
import {EventDiscord} from './EventDiscord';
import {Op} from 'sequelize';
import {CheckRole} from './Guards';
import {EventWorker} from '../workers/EventWorker';
import * as moment from 'moment';

@Discord('!')
export class AttendanceDiscord {

  public static readonly options = ['❌', '✅', '❔'];

  @On('ready')
  public async init() {
    const msgs = await (await EventDiscord.getChannel()).messages.fetch();
    const events = await Event.findAll({
      where: {messageID: {[Op.in]: msgs.keyArray()}},
      include: ['series'],
    });
    for (const event of events) {
      if (event.messageID) {
        const msg = msgs.get(event.messageID);
        if (msg) {
          for (const messageReaction of msg.reactions.cache.array()) {
            await messageReaction.users.fetch();
            await this.attending([messageReaction]);
          }
        }
      }
    }
  }

  @Command('attending')
  @Guard(CheckRole('Admin'))
  public async getAttending(message: CommandMessage) {
    const events: Event[] = await Event.findAll({
      where: {
        start: {[Op.lte]: moment().add(1, 'week').add(12, 'hours').toDate()},
        end: {[Op.gt]: moment().toDate()},
      },
      order: ['start'],
      include: ['attendees', {
        model: User,
        as: 'streamer',
        where: {discordId: message.author.id},
      }],
    });
    if (events.length > 0) {
      message.channel.send(events.map((event) =>
        event.title +
        EventWorker.getAttendees(event.attendees, 1) +
        EventWorker.getAttendees(event.attendees, 2)).join('\n\n'));
    } else {
      message.channel.send('No events for you this week');
    }
  }

  @On('messageReactionAdd')
  public async attending([messageReaction]: MessageReaction[]) {
    if (messageReaction.count == null || messageReaction.count <= 1) {
      return;
    }
    const event = await Event.findOne({
      where: {messageID: messageReaction.message.id},
      include: ['series'],
    });
    if (!event) {
      return;
    }
    const users = messageReaction.users.cache.filter((user) => !user.bot);
    const dbUsers = await Promise.all(users.map((discordUser) => {
      return User.get(discordUser as unknown as IUser).then((u) => {
        messageReaction.users.remove(discordUser).then();
        return u[0];
      });
    }));
    for (const user of dbUsers) {
      const attendee = await Attendee.findOrBuild({
        where: {user: user.id, event: event.id},
      });
      if (attendee) {
        attendee[0].decision = AttendanceDiscord.options
          .indexOf(messageReaction.emoji.name);
        attendee[0].save();
      }
    }
    await EventDiscord.update(event);
  }
}

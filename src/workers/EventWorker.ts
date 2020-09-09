import {Cron, CronController} from 'cron-decorators/lib';
import {TextChannel} from 'discord.js';
import moment = require('moment');
import Event from '../database/models/Event';
import {Op} from 'sequelize';
import {client} from '../start';
import * as discordConfig from '../config/discord.json';
import User from '../database/models/User';
import {EventDiscord} from '../discord/EventDiscord';

@CronController('jobs')
export class EventWorker {

  private static getChannel() {
    return client.channels.cache.get(discordConfig.channel.notify) as TextChannel;
  }

  public static getAttendees(attendees: User[], decision: number) {
    if (attendees.length === 0) {
      return '';
    }
    const filteredDiscord = attendees.filter((user) => user.discordId);
    if (filteredDiscord.length === 0) {
      return '';
    }
    const filteredDecision = filteredDiscord
      // @ts-ignore
      .filter((user) => user.Attendee.decision === decision);
    if (filteredDecision.length === 0) {
      return '';
    }
    const parsed = filteredDecision.map((user) => '<@' + user.discordId + '>').join(', ');
    if (decision === 1) {
      return '\nAttending: ' + parsed;
    }
    if (decision === 2) {
      return '\nUndecided: ' + parsed;
    }
    if (decision === 0) {
      return '\nNot attending: ' + parsed;
    }
    return '';
  }

  @Cron('eventReminder', '0 */10 * * * *')
  public async eventReminder() {
    const now = moment();
    const nowPlus = now.clone().add(35, 'minutes');
    const nowMinus = now.clone().add(25, 'minutes');
    const events = await Event.findAll({
      where: {start: {[Op.gt]: nowMinus, [Op.lte]: nowPlus}},
      include: ['series', 'streamer', 'attendees'],
    });
    for (const event of events) {
      EventWorker.sendNotification(event).then();
    }
  }

  @Cron('updateEventChannel', '0 0 */4 * * *')
  public updateEventChannel() {
    EventDiscord.updateChannel().then();
  }

  public static async sendNotification(event: Event) {
    try {
      const attendees = await event.$get('attendees');
      EventWorker.getChannel()
        .send('Reminder: ' + event.title + ' will be starting **' +
          (moment().isAfter(event.start) ? 'Soon' : moment(event.start).fromNow()) + '**.' +
          '\nStreamer: <@' + event.streamer.discordId + '>' +
          EventWorker.getAttendees(attendees, 1) +
          EventWorker.getAttendees(attendees, 2) +
          (event.roomcode ? '\nRoom code: ' + event.roomcode : ''))
        .then(() => {
          if (event.roomcode && event.messageID) {
            this.getChannel().messages.fetch()
              .then((msgs) => {
                if (event.messageID) {
                  const msg = msgs.get(event.messageID);
                  if (msg) {
                    msg.delete().then(() => {
                      event.messageID = '';
                      event.save({fields: ['messageID']});
                    });
                  }
                }
              });
          }
        });
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error('Error sending notification for event: ', event.id, '\n', e);
    }
  }
}

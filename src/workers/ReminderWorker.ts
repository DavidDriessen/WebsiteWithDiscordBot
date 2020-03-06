import {Cron, CronController} from 'cron-decorators/lib';
import {DMChannel, TextChannel, User} from 'discord.js';
import moment = require('moment');

interface IReminder {
    users: User[];
    channel: TextChannel | DMChannel;
    time: moment.Moment;
}

const reminders: IReminder[] = [];

@CronController('jobs')
export class ReminderWorker {

    @Cron('reminder', '0 * * * * *')
    public remindMe() {
        const now = moment();
        for (let i = 0; i < reminders.length; i++) {
            if (reminders[i].time <= now) {
                // noinspection JSIgnoredPromiseFromCall
                reminders[i].channel.send('Reminder');
                reminders.splice(i);
                i--;
            }
        }
    }

    public static async setReminder(me: User, time: moment.Moment) {
        const reminder: IReminder = {users: [me], time, channel: await me.createDM()};
        reminders.push(reminder);
        return reminder;
    }
}

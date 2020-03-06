import {Client, Discord} from '@typeit/discord';
import {Message} from 'discord.js';
import {help, OnCommand, stringType} from '../helpers/CommandHelpers';
import {ReminderWorker} from '../workers/ReminderWorker';
import moment = require('moment');

@Discord
export class ExampleDiscord {

    // noinspection SpellCheckingInspection
    @OnCommand('remindme')
    // tslint:disable-next-line:no-shadowed-variable
    public remindMe(message: Message, client: Client) {
        ReminderWorker.setReminder(message.author, moment().add(1, 'm'))
            .then((r) => {
                message.reply('I\'ll remind you ' + r.time.fromNow())
                    .then((m) => m.delete({timeout: 10000}));
            });
    }

    @OnCommand('ping')
    // tslint:disable-next-line:no-shadowed-variable
    public ping(message: Message, client: Client) {
        message.channel.send('Pong!').then(async (r) => {
            await r.delete({timeout: 1000});
        });
    }

    @help('say :msg:')
    @OnCommand('say')
    // tslint:disable-next-line:no-shadowed-variable
    public say(@stringType() msg: string, message: Message, client: Client) {
        message.channel.send(msg).then(async (r) => {
            await r.delete({timeout: 1000});
        });
    }

    @OnCommand('clear')
    public clear(message: Message) {
        message.channel.messages.fetch().then((msgs) => msgs.forEach((msg) => {
            if (!msg.deleted) {
                // tslint:disable-next-line:no-console
                msg.delete().catch((e) => console.error(e));
            }
        }));
        return true;
    }
}

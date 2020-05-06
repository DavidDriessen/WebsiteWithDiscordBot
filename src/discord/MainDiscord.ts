import {Client, Command, CommandMessage, Discord, Guard} from '@typeit/discord';
import {ReminderWorker} from '../workers/ReminderWorker';
import moment = require('moment');

function checkRemindMeRole(message: CommandMessage) {
    const remindMeRole = message.guild.roles.find('name', 'RemindMe');
    return message.member.roles.has(remindMeRole.id);
}

@Discord({prefix: '!'})
export class MainDiscord {

    @Command('remindMe')
    @Guard(checkRemindMeRole)
    public remindMe(message: CommandMessage) {
        ReminderWorker.setReminder(message.author, moment().add(1, 'm'))
            .then((r) => {
                message.reply('I\'ll remind you ' + r.time.fromNow());
            });
    }

    @Command('ping')
    public ping(message: CommandMessage) {
        message.channel.send('Pong!').then(async (r) => {
            await r.delete(1000);
        });
    }

    @Command('say', {description: 'say :msg:'})
    public say(message: CommandMessage) {
        if (message.params.length >= 1) {
            message.channel.send(message.params[0]).then(async (r) => {
                await r.delete(1000);
            });
        } else {
            message.channel.send('Not enough arguments.');
        }
    }

    @Command('help')
    public help(message: CommandMessage) {
        const commands = Client.getCommands();
        message.channel.send(commands.map((command) => {
            return command.prefix + command.commandName + ': ' + command.description;
        }).join('\n'));
    }

    // @Command('clear')
    // public clear(message: CommandMessage) {
    //     message.channel.fetchMessages().then((msgs) => msgs.deleteAll());
    // }
}

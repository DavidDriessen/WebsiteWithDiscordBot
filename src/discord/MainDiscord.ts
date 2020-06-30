import {Client, Command, CommandMessage, Discord, Guard} from '@typeit/discord';
import {ReminderWorker} from '../workers/ReminderWorker';
import moment = require('moment');
import {CheckRole} from './Guards';

@Discord('!')
export class MainDiscord {

  @Command('remindMe')
  @Guard(CheckRole('RemindMe'))
  public remindMe(message: CommandMessage) {
    ReminderWorker.setReminder(message.author, moment().add(1, 'm'))
      .then((r) => {
        message.reply('I\'ll remind you ' + r.time.fromNow());
      });
  }

  @Command('ping')
  public ping(message: CommandMessage) {
    message.channel.send('Pong!').then(async (r) => {
      await r.delete({timeout: 1000});
    });
  }

  @Command('say :say')
  public say(message: CommandMessage) {
    if (message.args.say) {
      message.channel.send(message.args.say).then(async (r) => {
        await r.delete({timeout: 1000});
      });
    } else {
      message.channel.send('Not enough arguments.');
    }
  }

  @Command('help')
  public help(message: CommandMessage) {
    const commands = Client.getCommands();
    message.channel.send(commands.map((command) => {
      return command.prefix as string + command.commandName as string +
        (command.description ? ': ' + command.description : '');
    }).join('\n'));
  }

  @Command('clear')
  @Guard(CheckRole('Admin'))
  public clear(message: CommandMessage) {
    message.channel.messages.fetch().then((msgs) =>
      msgs.forEach((msg) => msg.delete()));
  }
}

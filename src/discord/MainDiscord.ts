import {Client, Command, CommandMessage, Discord, Guard} from '@typeit/discord';
import {ReminderWorker} from '../workers/ReminderWorker';
import moment = require('moment');

function checkRemindMeRole(message: CommandMessage) {
  if (message.guild) {
    const role = message.guild.roles.cache.find((r) => r.name === 'RemindMe');
    if (role && message.member) {
      return message.member.roles.cache.has(role.id);
    }
  }
  return false;
}

function checkAdminRole(message: CommandMessage) {
  if (message.guild) {
    const role = message.guild.roles.cache.find((r) => r.name === 'Admin');
    if (role && message.member) {
      return message.member.roles.cache.has(role.id);
    }
  }
  return false;
}

@Discord('!')
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
      await r.delete({timeout: 1000});
    });
  }

  @Command('say')
  public say(message: CommandMessage) {
    if (message.args.length >= 1) {
      message.channel.send(message.args[0]).then(async (r) => {
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
      return command.prefix as string + command.commandName as string + ': ' + command.description;
    }).join('\n'));
  }

  @Command('clear')
  @Guard(checkAdminRole)
  public clear(message: CommandMessage) {
    message.channel.messages.fetch().then((msgs) =>
      msgs.forEach((msg) => msg.delete()));
  }
}

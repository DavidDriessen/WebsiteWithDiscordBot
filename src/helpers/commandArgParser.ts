import moment from 'moment';
import {Client} from '@typeit/discord';
import { RichEmbed, Message, TextChannel } from 'discord.js';

const dateTimeFormats: string[] = ['H:mm', 'h:mm a',
    'dd H:mm', 'dd h:mm a', 'ddd H:mm', 'ddd h:mm a',
    'DD H:mm', 'DD h:mm a'];

function getMomentFromString(string: string) {
    function checkFormat(format: string) {
        return moment(string, format, true).isValid();
    }

    for (const [key, value] of dateTimeFormats.entries()) {
        if (value) {
            if (checkFormat(value)) {
                const date = moment(string, value);
                switch (key) {
                    case 0:
                    case 1:
                        if (date < moment()) {
                            date.add(1, 'day');
                        }
                        break;
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                        if (date.isoWeekday() < moment().isoWeekday()) {
                            date.add(1, 'week');
                        }
                        break;
                    case 6:
                        if (date.date() < moment().date()) {
                            date.add(1, 'month');
                        }
                        break;
                    default:
                }
                return date;
            }
        }
    }
}

async function parseArg(arg: string, types: string[], client: Client) {
    let temp;
    for (const type of types) {
        switch (type) {
            case'string':
                return arg;
            case 'moment':
                temp = getMomentFromString(arg);
                if (temp) { return temp; }
                break;
            case 'float':
                temp = +arg;
                if (!isNaN(temp)) { return temp; }
                break;
            case 'mention':
                // The id is the first and only match found by the RegEx.
                const mentionMatches = arg.match(/^<@!?(\d+)>$/);
                // If supplied variable was not a mention, matches will be null instead of an array.
                if (!mentionMatches) { break; }
                // However the first element in the matches array will be the entire mention,
                // not just the ID,
                // so use index 1.
                const user = client.users.get(mentionMatches[1]);
                if (!user) { break; }
                return user;
            case 'channel':
                // The id is the first and only match found by the RegEx.
                const channelMatches = arg.match(/^<#?(\d+)>$/);
                // If supplied variable was not a mention, matches will be null instead of an array.
                if (!channelMatches) { break; }
                // However the first element in the matches array will be the entire mention,
                // not just the ID,
                // so use index 1.
                const channel = client.channels.get(channelMatches[1]);
                if (!channel) { break; }
                return channel;
            default:
                return undefined;
        }
    }
    switch (types[0]) {
        case 'moment':
            throw new CommandError(arg + ' is not a valid format');
        case 'channel':
            throw new CommandError(arg + ' not a channel');
    }
}


class CommandError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'Error:';
    }

    public handle(channel: TextChannel) {
        channel.send(new RichEmbed().setTitle(this.name)
            .setDescription(this.message)).then((r: Message) => r.delete(6000));
    }
}

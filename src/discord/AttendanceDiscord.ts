import {Discord, On} from '@typeit/discord';
import {MessageReaction, TextChannel} from 'discord.js';
import Event from '../models/Event';
import User from '../models/User';
import Attendee from '../models/Attendee';
import {client} from '../start';
import * as discordConfig from '../config/discord.json';

@Discord()
export class AttendanceDiscord {

    public static readonly options = ['❌', '✅', '❔'];

    @On('ready')
    public init() {
        (client.channels.get(discordConfig.channel.event) as TextChannel).fetchMessages().then();
    }

    @On('messageReactionAdd')
    public async attending(messageReaction: MessageReaction) {
        if (messageReaction.count <= 1) {
            return;
        }
        const event = await Event.findOne({where: {messageID: messageReaction.message.id}});
        if (!event) {
            return;
        }
        const users = messageReaction.users.filter((user) => !user.bot);
        const dbUsers = await Promise.all(users.map((discordUser) => {
            return User.get(discordUser).then((u) => {
                messageReaction.remove(discordUser).then();
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
    }
}

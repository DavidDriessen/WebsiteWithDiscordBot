import {Discord, On} from '@typeit/discord';
import {MessageReaction} from 'discord.js';
import Event from '../models/Event';
import User from '../models/User';
import Attendee from '../models/Attendee';

@Discord()
export class AttendanceDiscord {

    public static readonly options = ['❌', '✅', '❔'];

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

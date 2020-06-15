import * as discordConfig from '../config/discord.json';
import {GuildMember, TextChannel} from 'discord.js';
import {Discord, On} from '@typeit/discord';
import {client} from '../start';
import User from '../models/User';

@Discord()
export class LobbyDiscord {

    public static getChannel() {
        return client.channels.get(discordConfig.channel.event) as TextChannel;
    }

    @On('guildMemberAdd')
    public async newMember(member: GuildMember) {
        let msg = '<@' + member.id + '> has joined!';
        if (!await User.findOne({where: {discordId: member.user.id}})) {
            msg += ' Checkout the website at ' + discordConfig.callbackHost + '.';
        }
        await LobbyDiscord.getChannel().send(msg);
    }

}

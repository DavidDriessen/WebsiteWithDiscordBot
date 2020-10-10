import {GuardFunction} from '@typeit/discord';
import {Role} from 'discord.js';


export function AllowDM() {
  const check: GuardFunction<'commandMessage'> =
    async ([message]: any, client: any, next: () => any, guardDatas: any) => {
        if (message.channel.type === 'dm') {
          guardDatas.DM = true;
          await next();
        }
    };
  return check;
}

export function CheckRole(role: string) {
  const check: GuardFunction<'commandMessage'> =
    async ([message]: any, client: any, next: () => any, guardDatas: any) => {
      if (message.guild) {
        const roleOb = message.guild.roles.cache.find((r: Role) => r.name === role);
        if (roleOb && message.member) {
          if (message.member.roles.cache.has(roleOb.id)) {
            await next();
          }
        }
      } else {
        if (guardDatas.DM) {
          await next();
        }
      }
    };
  return check;
}

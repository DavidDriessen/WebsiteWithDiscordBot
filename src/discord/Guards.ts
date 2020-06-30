import {GuardFunction} from '@typeit/discord';
import {Role} from 'discord.js';

export function CheckRole(role: string) {
  const check: GuardFunction<'commandMessage'> =
    async ([message]: any, client: any, next: () => any) => {
      if (message.guild) {
        const roleOb = message.guild.roles.cache.find((r: Role) => r.name === role);
        if (roleOb && message.member) {
          if (message.member.roles.cache.has(roleOb.id)) {
            await next();
          }
        }
      }
    };
  return check;
}

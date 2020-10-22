import {GuardFunction} from '@typeit/discord';
import User from '../database/models/User';


export function AllowDM() {
  const check: GuardFunction<'commandMessage'> =
    async ([message]: any, client: any, next: () => any, guardDatas: any) => {
      if (message.channel.type === 'dm') {
        guardDatas.DM = true;
      }
      await next();
    };
  return check;
}

export function CheckRole(role: string) {
  const check: GuardFunction<'commandMessage'> =
    async ([message]: any, client: any, next: () => any, guardDatas: any) => {
      if (message.guild && !message.author.bot) {
        const user = await User.get(message.author);
        if (user[0].role === role) {
          await next();
        }
      } else {
        if (guardDatas.DM) {
          await next();
        }
      }
    };
  return check;
}

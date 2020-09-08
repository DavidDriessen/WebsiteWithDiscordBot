import {Cron, CronController} from 'cron-decorators/lib';
import {PollDiscord} from '../discord/PollDiscord';

@CronController('jobs')
export class PollWorker {

  @Cron('updatePollChannel', '0 */12 * * * *')
  public updateEventChannel() {
    PollDiscord.updateChannel().then();
  }
}

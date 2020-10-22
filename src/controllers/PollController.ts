import {Controller, Delete, Get, Middleware, Post, Put} from '@overnightjs/core';
import {ISecureRequest} from '@overnightjs/jwt';
import {Order, WhereOptions} from 'sequelize/types/lib/model';
import {Response} from 'express';
import * as moment from 'moment';
import {Op} from 'sequelize';
import Poll from '../database/models/Poll';
import PollOption from '../database/models/PollOption';
import Ballot from '../database/models/Ballot';
import {BallotDiscord} from '../discord/BallotDiscord';
import {JWT} from '../helpers/Website';
import PollVote from '../database/models/PollVote';

function isAdmin(target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = (req: ISecureRequest, res: Response) => {
    if (req.payload.user.role !== 'Admin') {
      return res.status(403).json({message: 'Permission denied'});
    }
    return method(req, res);
  };
}

@Controller('api/polls')
export class PollController {

  @Get('')
  @Middleware(JWT(false))
  private async getPolls(req: ISecureRequest, res: Response) {
    let where: WhereOptions = {end: {[Op.gte]: moment().toISOString()}};
    let order: Order = ['end', ['options', 'order', 'asc']];
    if (req.query.history) {
      where = {end: {[Op.lte]: moment().toISOString()}};
      order = [['end', 'desc'], ['options', 'order', 'asc']];
    }
    const polls = await Poll.findAll({
      include: [{
        association: 'options',
        include: [{association: 'ballots', include: ['user']}],
      }],
      where, order,
    });
    // res.status(200).json(polls);
    res.status(200).json(polls.map((poll) => poll.serialize(req.payload?.user)));
  }

  @Post('vote')
  @Middleware(JWT())
  private async vote(req: ISecureRequest, res: Response) {
    const option = await PollOption.findByPk(req.body.option, {include: ['poll']});
    if (option) {
      const ballot = (await Ballot.findOrCreate({
        where: {userId: req.payload.user.id, pollId: option.poll.id},
      }))[0];
      if (ballot) {
        const vote = await PollVote.findOrCreate({
          where: {ballot: ballot.id, option: option.id},
          defaults: {choice: req.body.choice},
        });
        if (!vote[1]) {
          vote[0].choice = req.body.choice;
          vote[0].save();
        }
        if (ballot.discordMessageID) {
          BallotDiscord.updateBallot(ballot);
        }
        return res.status(200).json({message: 'ok'});
      }
    }
    return res.status(404).json({message: 'Option of user not found.'});
  }

  @Put('')
  @Middleware(JWT())
  @isAdmin
  private async addPoll(req: ISecureRequest, res: Response) {
    if (req.body.options) {
      req.body.options = req.body.options.map((option: PollOption, index: number) => {
        option.order = index;
        return option;
      });
    }
    const poll = await Poll.create(req.body, {
      include: [{association: 'options', include: ['ballots']}],
    });
    return res.status(200).json(poll.serialize(req.payload?.user));
  }

  @Post('')
  @Middleware(JWT())
  @isAdmin
  private async editPoll(req: ISecureRequest, res: Response) {
    // tslint:disable-next-line:max-line-length
    if (!req.body.title || !req.body.end || !req.body.options) {
      return res.status(401).send('');
    }
    const poll = await Poll.findByPk(req.body.id, {
      include: [{
        association: 'options',
        include: ['ballots'],
      }],
    });
    if (!poll) {
      return res.status(200).json({message: 'Event not found'});
    }
    poll.title = req.body.title;
    poll.end = req.body.end;
    poll.description = req.body.description;
    if (req.body.options) {
      poll.options = req.body.options
        .map((s: PollOption, i: number) => {
          const option = poll.options.find((m) => m.id === s.id);
          if (option) {
            option.order = i;
            return option;
          } else {
            return new PollOption(Object.assign({pollId: poll.id, order: i}, s));
          }
        });
    }
    await poll.save();
    for (const ballot of await poll.$get('ballots')) {
      BallotDiscord.updateBallot(ballot, true);
    }
    return res.status(200).json(poll.serialize(req.payload?.user));
  }

  @Delete(':id')
  @Middleware(JWT())
  @isAdmin
  private async removePoll(req: ISecureRequest, res: Response) {
    const poll = await Poll.findByPk(req.params.id);
    if (poll) {
      poll.destroy();
      return res.status(200).json({msg: 'ok'});
    } else {
      return res.status(404).json({msg: 'Event not found!'});
    }
  }
}

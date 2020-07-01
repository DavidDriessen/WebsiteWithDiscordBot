import {Controller, Delete, Get, Middleware, Post, Put} from '@overnightjs/core';
import {ISecureRequest, JwtManager} from '@overnightjs/jwt';
import {Order, WhereOptions} from 'sequelize/types/lib/model';
import * as expressJwt from 'express-jwt';
import Event from '../models/Event';
import {Response} from 'express';
import * as moment from 'moment';
import {Op} from 'sequelize';
import SeriesEvent from '../models/SeriesEvent';
import User from '../models/User';
import Poll from '../models/Poll';
import PollOption from '../models/PollOption';

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
  @Middleware(expressJwt({
    // @ts-ignore
    secret: JwtManager.SECRET,
    userProperty: 'payload',
    credentialsRequired: false,
  }))
  private async getPolls(req: ISecureRequest, res: Response) {
    let where: WhereOptions = {end: {[Op.gte]: moment().toISOString()}};
    let order: Order = ['end'];
    if (req.query.history) {
      where = {end: {[Op.lte]: moment().toISOString()}};
      order = [['end', 'desc'], ['series', 'order', 'asc']];
    }
    const polls = await Poll.findAll({
      include: [{association: 'options', include: ['users']}], where, order,
    });
    if (req.payload.user.role === 'Admin') {
      res.status(200).json(polls);
    } else {
      res.status(200).json(polls.map((poll) => poll.serialize(req.payload?.user)));
    }
  }

  @Put('')
  @Middleware(JwtManager.middleware)
  @isAdmin
  private async addPoll(req: ISecureRequest, res: Response) {
    const streamer = await User.findByPk(req.body.streamer.id);
    if (!streamer) {
      return res.status(404).json({msg: 'Streamer not found!'});
    }
    const data = {
      title: req.body.title,
      description: req.body.description,
      streamerId: streamer.id,
      start: req.body.start,
      end: req.body.end,
    };
    if (req.body.series) {
      // @ts-ignore
      data.series = req.body.series.map((series, index) => {
        return {
          seriesId: series.details.id,
          episode: series.episode,
          episodes: series.episodes,
          order: index,
        };
      });
    }
    const event = await Event.create(data, {
      include: ['series', 'streamer', 'attendees'],
    });
    event.streamer = streamer;
    return res.status(200).json(PollController.renderResponse(event, req.payload.user));
  }

  @Post('')
  @Middleware(JwtManager.middleware)
  @isAdmin
  private async editPoll(req: ISecureRequest, res: Response) {
    // tslint:disable-next-line:max-line-length
    if (!req.body.title || !req.body.end || !req.body.options) {
      return res.status(401).send('');
    }
    const poll = await Poll.findByPk(req.body.id, {include: ['options']});
    if (!poll) {
      return res.status(200).json({message: 'Event not found'});
    }
    poll.title = req.body.title;
    poll.end = req.body.end;
    poll.description = req.body.description;
    if (req.body.options) {
      // const ids: number[] = req.body.options.filter((option: PollOption) => !!option.id)
      //   .map((option: PollOption) => option.id);
      // for (const option of poll.options) {
      //   if (!ids.indexOf(option.id)) {
      //     option.destroy();
      //   }
      // }
      // for (const option: PollOption of req.body.options) {
      //   if (option.id) {
      //     PollOption(option).save
      //   } else {
      //     poll.$add('options', option);
      //   }
      // }
      poll.options = req.body.options
        .map((s: PollOption, i: number) => {
          return poll.options.find(
            (m) => m.poll === poll.id && m.id === s.id) ||
            new PollOption(Object.assign({pollId: poll.id}, s));
        });
    }
    return res.status(200).json(await poll.save());
  }

  @Delete(':id')
  @Middleware(JwtManager.middleware)
  @isAdmin
  private async removePoll(req: ISecureRequest, res: Response) {
    const event = await Event.findByPk(req.params.id);
    if (event) {
      event.destroy();
      return res.status(200).json({msg: 'ok'});
    } else {
      return res.status(404).json({msg: 'Event not found!'});
    }
  }

  private static renderResponse(event: Event, user: User) {
    const admin = user.role === 'Admin';
    const response: Event = {
      title: event.title,
      description: event.description,
      image: event.image,
      start: event.start,
      end: event.end,
      roomcode: event.roomcode,
      // @ts-ignore
      attending: event.attending?.decision,
      streaming: event.streamer.id === user.id,
      series: [] as SeriesEvent[],
      attendees: [] as User[],
      streamer: {name: event.streamer.name, avatar: event.streamer.avatar} as User,
    };
    // Format series
    if (event.series) {
      response.series = event.series.map((series) => {
        return {
          seriesId: series.seriesId,
          episode: series.episode,
          episodes: series.episodes,
        } as SeriesEvent;
      });
    }
    // Format attendees
    if (event.attendees) {
      // @ts-ignore
      if (response.streaming || admin) {
        response.attendees = event.attendees.map((attendee) => {
          return {name: attendee.name, avatar: attendee.avatar} as User;
        });
      } else {
        delete response.attendees;
      }
    }
    if (admin) {
      response.id = event.id;
      response.streamer.id = event.streamer.id;
    }
    return response;
  }
}

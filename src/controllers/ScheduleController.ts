import {Controller, Delete, Get, Middleware, Post, Put} from '@overnightjs/core';
import {ISecureRequest, JwtManager} from '@overnightjs/jwt';
import {Order, WhereOptions} from 'sequelize/types/lib/model';
import * as expressJwt from 'express-jwt';
import Attendee from '../models/Attendee';
import Event from '../models/Event';
import {Response} from 'express';
import * as moment from 'moment';
import {Op} from 'sequelize';
import SeriesEvent from '../models/SeriesEvent';
import User from '../models/User';
import {EventWorker} from '../workers/EventWorker';

function isAdmin(target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = (req: ISecureRequest, res: Response) => {
    if (req.payload.user.role !== 'Admin') {
      return res.status(403).json({message: 'Permission denied'});
    }
    return method(req, res);
  };
}

@Controller('api/schedule')
export class ScheduleController {

  @Get('')
  @Middleware(expressJwt({
    // @ts-ignore
    secret: JwtManager.SECRET,
    userProperty: 'payload',
    credentialsRequired: false,
  }))
  private async getEvents(req: ISecureRequest, res: Response) {
    let where: WhereOptions = {end: {[Op.gte]: moment().toISOString()}};
    let order: Order = ['start', ['series', 'order', 'asc']];
    if (req.query.history) {
      where = {end: {[Op.lte]: moment().toISOString()}};
      order = [['start', 'desc'], ['series', 'order', 'asc']];
    }
    if (req.payload) {
      const events: Event[] = await Event.findAll({
        include: [
          {association: 'series', attributes: ['seriesId', 'episode', 'episodes']},
          {association: 'streamer', attributes: ['id', 'name', 'avatar']},
          {
            association: 'attendees', attributes: ['name', 'avatar'],
            through: {attributes: ['decision']},
          },
          {
            association: 'attending', attributes: ['decision'], required: false,
            where: {user: req.payload.user.id},
          },
        ], where, order,
        attributes: ['id', 'title', 'description', 'image', 'start', 'end', 'roomcode'],
      });
      res.status(200).json(events.map((event) =>
        ScheduleController.renderResponse(event, req.payload.user)));
    } else {
      res.status(200).json(await Event.findAll({
        include: [
          {association: 'series', attributes: ['seriesId', 'episode', 'episodes']},
          {association: 'streamer', attributes: ['name', 'avatar']},
        ], where, order,
        attributes: ['title', 'description', 'image', 'start', 'end', 'roomcode'],
      }));
    }
  }

  @Post('attending')
  @Middleware(JwtManager.middleware)
  private async setAttending(req: ISecureRequest, res: Response) {
    const attendee = await Attendee.findOrBuild({
      where: {user: req.payload.user.id, event: req.body.id},
    });
    if (attendee) {
      attendee[0].decision = req.body.decision;
      attendee[0].save();
    }
    res.status(200).json({message: 'ok'});
  }

  @Post('streaming')
  @Middleware(JwtManager.middleware)
  private async setRoomCode(req: ISecureRequest, res: Response) {
    const event = await Event.findOne({
      where: {id: req.body.event, streamerId: req.payload.user.id},
    });
    if (event) {
      event.roomcode = req.body.code;
      event.save();
      EventWorker.sendNotification(event);
      res.status(200).json({message: 'ok'});
    } else {
      res.status(403).json({message: 'Not the streamer'});
    }
  }

  @Put('')
  @Middleware(JwtManager.middleware)
  @isAdmin
  private async addEvent(req: ISecureRequest, res: Response) {
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
    return res.status(200).json(ScheduleController.renderResponse(event, req.payload.user));
  }

  @Post('')
  @Middleware(JwtManager.middleware)
  @isAdmin
  private async editEvent(req: ISecureRequest, res: Response) {
    // tslint:disable-next-line:max-line-length
    if (!req.body.title || !req.body.start || !req.body.end) {
      return res.status(401).send('');
    }
    const streamer = await User.findByPk(req.body.streamer.id);
    if (!streamer) {
      return res.status(404).json({msg: 'Streamer not found!'});
    }
    const event = await Event.findByPk(req.body.id, {include: ['series', 'streamer', 'attendees']});
    if (!event) {
      return res.status(200).json({message: 'Event not found'});
    }
    event.title = req.body.title;
    event.start = req.body.start;
    event.end = req.body.end;
    event.description = req.body.description;
    event.streamer = streamer;
    if (req.body.series) {
      event.series = req.body.series
        .map((s: { details: { id: any; }; episode: any; episodes: any; }, i: number) => {
          const ss = event.series.find(
            (m) => m.event === event.id && m.seriesId === s.details.id) ||
            new SeriesEvent({event: event.id, seriesId: s.details.id});
          ss.order = i;
          ss.episode = req.body.series[i].episode;
          ss.episodes = req.body.series[i].episodes;
          return ss;
        });
    }
    await event.$set('streamer', streamer);
    return res.status(200)
      .json(ScheduleController.renderResponse(await event.save(), req.payload.user));
  }

  @Delete(':id')
  @Middleware(JwtManager.middleware)
  @isAdmin
  private async removeEvent(req: ISecureRequest, res: Response) {
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

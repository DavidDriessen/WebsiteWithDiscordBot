import {Controller, Delete, Get, Middleware, Post, Put} from '@overnightjs/core';
import {ISecureRequest} from '@overnightjs/jwt';
import {Order, WhereOptions} from 'sequelize/types/lib/model';
import Attendee from '../database/models/Attendee';
import Event from '../database/models/Event';
import {Response} from 'express';
import * as moment from 'moment';
import {Op} from 'sequelize';
import SeriesEvent from '../database/models/SeriesEvent';
import User from '../database/models/User';
import {EventWorker} from '../workers/EventWorker';
import {JWT} from '../helpers/Website';
import * as multer from 'multer';

function isAdmin(target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = (req: ISecureRequest, res: Response) => {
    if (req.payload.user.role !== 'Admin') {
      return res.status(403).json({message: 'Permission denied'});
    }
    return method(req, res);
  };
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    let path;
    if (process.env.NODE_ENV === 'production') {
      path = 'public/images/';
    } else {
      path = 'client/public/images/';
    }
    cb(null, path);
  },
  filename(req, file, cb) {
    const f = file.originalname.split('.');
    cb(null, Math.round(Math.random() * 1E9) + '.' + f[f.length - 1]);
  },
});
const upload = multer({storage});

// tslint:disable-next-line:no-var-requires
const guard = require('express-jwt-permissions')({
  requestProperty: 'payload.user',
  permissionsProperty: 'permissions',
});

@Controller('api/schedule')
export class ScheduleController {

  @Get('')
  @Middleware(JWT(false))
  private async getEvents(req: ISecureRequest, res: Response) {
    let where: WhereOptions = {end: {[Op.gte]: moment().toISOString()}};
    let order: Order = ['start', ['series', 'order', 'asc']];
    if (req.query.history) {
      where = {end: {[Op.lte]: moment().toISOString()}};
      order = [['start', 'desc'], ['series', 'order', 'asc']];
    }
    const user = req.payload ? req.payload.user : null;
    const userId = user ? user.id : null;

    const events2: Event[] = await Event.findAll({
      include: ['series', 'streamer',
        {association: 'attendees', through: {attributes: ['decision']}},
        {
          association: 'attending', attributes: ['decision'], required: false,
          where: {user: userId},
        }], where, order,
    });
    res.status(200).json(events2.map((event) => event.serialize(user)));
  }

  @Post('attending')
  @Middleware(JWT())
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
  @Middleware(JWT())
  private async setRoomCode(req: ISecureRequest, res: Response) {
    const event = await Event.findOne({
      where: {id: req.body.event, streamerId: req.payload.user.id},
      include: ['series', 'streamer', 'attendees'],
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
  @Middleware(JWT())
  @isAdmin
  @Middleware(upload.fields([{name: 'image', maxCount: 1}, {name: 'discordImage', maxCount: 1}]))
  private async addEvent(req: ISecureRequest, res: Response) {
    if (req.body.json) {
      req.body = JSON.parse(req.body.json);
    }
    try {
      const streamer = await User.findByPk(req.body.streamer.id);
      if (!streamer) {
        return res.status(404).json({msg: 'Streamer not found!'});
      }
      const data: Event = {
        title: req.body.title,
        description: req.body.description,
        streamerId: streamer.id,
        start: req.body.start,
        end: req.body.end,
        image: req.body.image,
        discordImage: req.body.discordImage,
      } as Event;
      const files = req.files as unknown as { [fieldName: string]: Express.Multer.File[] };
      if (files.image && files.image.length > 0) {
        data.image = '/images/' + files.image[0].filename;
      }
      if (files.discordImage && files.discordImage.length > 0) {
        data.discordImage = '/images/' + files.discordImage[0].filename;
      }
      if (req.body.series) {
        data.series = req.body.series.map((series: SeriesEvent, index: number) => {
          return {
            seriesId: series.details?.aniId,
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
      return res.status(200).json(event.serialize(req.payload.user));
    } catch (e) {
      return res.status(500).json({error: 'error', message: 'Please try again later.'});
    }
  }

  @Post('')
  @Middleware(JWT())
  @Middleware(guard.check('admin'))
  // @isAdmin
  @Middleware(upload.fields([{name: 'image', maxCount: 1}, {name: 'discordImage', maxCount: 1}]))
  private async editEvent(req: ISecureRequest, res: Response) {
    if (req.body.json) {
      req.body = JSON.parse(req.body.json);
    }
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
    event.image = req.body.image;
    event.discordImage = req.body.discordImage;
    event.title = req.body.title;
    event.start = req.body.start;
    event.end = req.body.end;
    event.description = req.body.description;
    event.streamer = streamer;
    if (req.body.series) {
      event.series = req.body.series
        .map((s: { details: { aniId: any; }; episode: any; episodes: any; }, i: number) => {
          const ss = event.series.find(
            (m) => m.event === event.id && m.seriesId === s.details.aniId) ||
            new SeriesEvent({event: event.id, seriesId: s.details.aniId});
          ss.order = i;
          ss.episode = req.body.series[i].episode;
          ss.episodes = req.body.series[i].episodes;
          return ss;
        });
    }
    const files = req.files as unknown as { [fieldName: string]: Express.Multer.File[] };
    if (files.image && files.image.length > 0) {
      event.image = '/images/' + files.image[0].filename;
    }
    if (files.discordImage && files.discordImage.length > 0) {
      event.discordImage = '/images/' + files.discordImage[0].filename;
    }
    await event.$set('streamer', streamer);
    return res.status(200)
      .json((await event.save()).serialize(req.payload.user));
  }

  @Delete(':id')
  @Middleware(JWT())
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
}

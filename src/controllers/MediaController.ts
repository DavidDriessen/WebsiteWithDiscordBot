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
import Media from '../database/models/Media';

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

@Controller('api/media')
export class MediaController {

  @Get('')
  @Middleware(JWT(false))
  private async getMedias(req: ISecureRequest, res: Response) {
    res.status(200).json(await Media.findAll());
  }

  @Put('')
  @Middleware(JWT())
  @isAdmin
  @Middleware(upload.fields([{name: 'image', maxCount: 1}, {name: 'discordImage', maxCount: 1}]))
  private async addMedia(req: ISecureRequest, res: Response) {
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
  @isAdmin
  @Middleware(upload.fields([{name: 'image', maxCount: 1}, {name: 'discordImage', maxCount: 1}]))
  private async editMedia(req: ISecureRequest, res: Response) {
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
  private async removeMedia(req: ISecureRequest, res: Response) {
    const media = await Media.findByPk(req.params.id);
    if (media) {
      media.destroy();
      return res.status(200).json({msg: 'ok'});
    } else {
      return res.status(404).json({msg: 'Media not found!'});
    }
  }
}

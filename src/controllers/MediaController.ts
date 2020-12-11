import {Controller, Delete, Get, Middleware, Post, Put} from '@overnightjs/core';
import {ISecureRequest} from '@overnightjs/jwt';
import {Response} from 'express';
import {isAdmin, JWT, upload} from '../helpers/Website';
import Media from '../database/models/Media';
import {Sequelize} from 'sequelize-typescript';
import MediaReference from '../database/models/MediaReference';

@Controller('api/media')
export class MediaController {

  @Get('')
  @Middleware(JWT(false))
  private async getMedias(req: ISecureRequest, res: Response) {
    let where;
    if (req.query.search) {
      where = Sequelize.literal('(lower(`Media`.`title`) LIKE \'%' + req.query.search + '%\' OR lower(`Media`.`description`) LIKE \'%' + req.query.search + '%\')');
    }
    res.status(200).json(await Media.findAll({
      where,
      include: ['references'],
      order: [['createdAt', 'DESC']],
      offset: req.query.full ? 0 : (parseInt(req.query.page as string, 10) || 0) * 16,
      limit: req.query.full ? (parseInt(req.query.page as string, 10) + 1 || 1) * 16 : 16,
    }));
  }

  @Get(':id')
  @Middleware(JWT(false))
  private getMedia(req: ISecureRequest, res: Response) {
    Media.findByPk(req.params.id).then((media) => res.status(200).json(media));
  }

  @Get('search/:search')
  @Middleware(JWT(false))
  private searchMedia(req: ISecureRequest, res: Response) {
    Media.findAll({
      where: Sequelize.literal('(lower(`Media`.`title`) LIKE \'%' + req.params.search + '%\' OR lower(`Media`.`description`) LIKE \'%' + req.params.search + '%\')'),
      limit: 5,
    }).then((media) => res.status(200).json(media));
  }

  @Get('refs/:type')
  @Middleware(JWT(false))
  private getRefs(req: ISecureRequest, res: Response) {
    MediaReference.findAll({where: {type: req.params.type}})
      .then((refs) => res.status(200).json(refs));
  }

  @Put('')
  @Middleware(JWT())
  @isAdmin
  @Middleware(upload.fields([{name: 'image', maxCount: 1}]))
  private async addMedia(req: ISecureRequest, res: Response) {
    if (req.body.json) {
      req.body = JSON.parse(req.body.json);
    }
    try {
      const data: Media = {
        title: req.body.title,
        description: req.body.description,
        episodes: req.body.episodes,
        image: req.body.image,
        references: req.body.references,
      } as Media;
      const files = req.files as unknown as { [fieldName: string]: Express.Multer.File[] };
      if (files && files.image && files.image.length > 0) {
        data.image = '/images/' + files.image[0].filename;
      }
      const media = await Media.create(data, {include: ['references']});
      return res.status(200).json(media);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(e);
      return res.status(500).json({error: 'error', message: 'Please try again later.'});
    }
  }

  @Post('')
  @Middleware(JWT())
  @isAdmin
  @Middleware(upload.fields([{name: 'image', maxCount: 1}]))
  private async editMedia(req: ISecureRequest, res: Response) {
    if (req.body.json) {
      req.body = JSON.parse(req.body.json);
    }
    // tslint:disable-next-line:max-line-length
    if (!req.body.title) {
      return res.status(401).send('');
    }
    const media = await Media.findByPk(req.body.id);
    if (!media) {
      return res.status(200).json({message: 'Media not found'});
    }
    media.image = req.body.image;
    media.title = req.body.title;
    media.description = req.body.description;
    media.episodes = req.body.episodes;
    const files = req.files as unknown as { [fieldName: string]: Express.Multer.File[] };
    if (files.image && files.image.length > 0) {
      media.image = '/images/' + files.image[0].filename;
    }
    return res.status(200).json(await media.save());
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

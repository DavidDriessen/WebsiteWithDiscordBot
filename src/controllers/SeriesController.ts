/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Request, Response} from 'express';
import {Controller, Get} from '@overnightjs/core';
import axios from 'axios';
import Media from '../database/models/Media';
import {Op} from 'sequelize';
import MediaReference from '../database/models/MediaReference';

@Controller('api/series')
export class SeriesController {

  private static readonly media = `id
                    idMal
                    title { english romaji  userPreferred }
                    description
                    synonyms
                    siteUrl
                    status
                    season
                    duration
                    genres
                    trailer { site }
                    episodes
                    coverImage { extraLarge large medium }`;

  public static getSeriesById(ids: number[]): Promise<Media[]> {
    return new Promise(async (resolve) => {
      let media = await Media.findAll({where: {aniId: {[Op.in]: ids}}});
      // tslint:disable-next-line:triple-equals
      // ids = ids.filter((id) => !media.some((m) => m.aniId == id));
      if (ids.length > 0) {
        media = media.concat(await axios
          .post(
            'https://anilist-graphql.p.rapidapi.com/',
            {
              // tslint:disable-next-line:max-line-length
              query: 'query ($ids: [Int]!) { Page { media(id_in: $ids, type: ANIME){ ' + SeriesController.media + ' }}}',
              variables: {ids},
            },
            {
              headers: {
                'content-type': 'application/json',
                'x-rapidapi-host': 'anilist-graphql.p.rapidapi.com',
                'x-rapidapi-key':
                  '7312ba6a87mshd90faca3bd5b364p160c8bjsn42e2ef6a0aa4',
                'accept': 'application/json',
              },
            },
          )
          .then(async (response) => {
            return await Promise.all(response.data.data.Page.media
              // tslint:disable-next-line:no-shadowed-variable
              .map((media: any) => {
                const m = Media.build({
                  title: media.title.english || media.title.romaji || media.title.userPreferred,
                  description: media.description,
                  image: media.coverImage.extraLarge,
                  genres: media.genres,
                  duration: media.duration,
                  episodes: media.episodes,
                });
                m.references = [MediaReference.build({
                  name: media.title.english || media.title.romaji || media.title.userPreferred,
                  type: 'anidb',
                  apiID: media.id,
                  url: media.siteUrl,
                }),
                  MediaReference.build({
                    name: media.title.english || media.title.romaji || media.title.userPreferred,
                    type: 'mal',
                    apiID: media.idMal,
                    url: '',
                  })];
                return m.save();
              }));
          }));
      }
      resolve(media);
    });
  }

  @Get('get')
  public getSeries(req: Request, res: Response) {
    if (!req.query.ids) {
      return res.status(200).json([]);
    }
    return SeriesController.getSeriesById(req.query.ids as unknown as number[])
      .then((media) => {
        res.status(200).json(media);
      }).catch((error) => {
        if (error.response) {
          // tslint:disable-next-line:no-console
          console.error(error.response.data);
          res.status(error.response.status).json(error.response.data);
        } else {
          // tslint:disable-next-line:no-console
          console.error(error);
          res.status(500).json(error);
        }
      });
  }

  @Get('search/:name')
  private async search(req: Request, res: Response) {
    try {
      const response = await axios.post('https://anilist-graphql.p.rapidapi.com/',
        {
          query: 'query ($search: String) { Page{ media(search: $search, type: ANIME){ ' +
            SeriesController.media
            + ' }}}',
          variables: {search: req.params.name},
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-rapidapi-host': 'anilist-graphql.p.rapidapi.com',
            'x-rapidapi-key': '7312ba6a87mshd90faca3bd5b364p160c8bjsn42e2ef6a0aa4',
            'accept': 'application/json',
          },
        });
      res.status(response.status).json(
        response.data.data.Page.media.map((media: any) => {
          const m = Media.build({
            title: media.title.english || media.title.romaji || media.title.userPreferred,
            description: media.description,
            image: media.coverImage.extraLarge,
            genres: media.genres,
            duration: media.duration,
            episodes: media.episodes,
          });
          m.references = [MediaReference.build({
            name: media.title.english || media.title.romaji || media.title.userPreferred,
            type: 'anidb',
            apiID: media.id,
            url: media.siteUrl,
          }),
            MediaReference.build({
              name: media.title.english || media.title.romaji || media.title.userPreferred,
              type: 'mal',
              apiID: media.idMal,
              url: '',
            })];
          return m;
        }));
    } catch (e) {
      if (e.response) {
        res.status(e.response.status).json(e.response.data);
      } else {
        // tslint:disable-next-line:no-console
        console.log(e);
        res.status(500).send('Error');
      }
    }
  }
}

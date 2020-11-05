/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Request, Response} from 'express';
import {Controller, Get} from '@overnightjs/core';
import axios from 'axios';
import Media, {IAPIMedia} from '../database/models/Media';
import {Op} from 'sequelize';

interface TVDBMediaLang {
  deu: string;
  eng: string;
  fra: string;
  jpn: string;
}

interface TVDBMedia {
  id: number;
  objectID: string;
  name: string;
  slug: string;
  translations: TVDBMediaLang;
  overviews: TVDBMediaLang;
  aliases: string[];
  banner: string;
  poster: string;
  image: string;
  first_aired: string;
  network: string;
  released: string;
  status: string;
  type: string;
  url: string;
}

@Controller('api/tvdb')
export class TvDbController {

  @Get('search/:name')
  private async search(req: Request, res: Response) {
    try {
      const response = await axios.post('https://tvshowtime-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%20(lite)%203.32.0%3Binstantsearch.js%20(3.5.3)%3BJS%20Helper%20(2.28.0)&x-algolia-application-id=tvshowtime&x-algolia-api-key=c9d5ec1316cec12f093754c69dd879d3',
        {requests: [{indexName: 'TVDB', params: 'query=' + encodeURI(req.params.name)}]},
        {
          headers: {
            'accept': 'application/json',
            'accept-language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7,cs;q=0.6',
            'content-type': 'application/x-www-form-urlencoded',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
          },
        });
      res.status(response.status).json((response.data.results[0].hits[0] as TVDBMedia).objectID);
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

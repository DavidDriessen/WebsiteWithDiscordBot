/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Request, Response} from 'express';
import {Controller, Get} from '@overnightjs/core';
import axios from 'axios';

@Controller('api/series')
export class SeriesController {

    @Get('search/:name')
    private async search(req: Request, res: Response) {
        const response = await axios.post('https://anilist-graphql.p.rapidapi.com/',
            {
                query: `{
Page{
  media(search: "bookworm"){
    id
    siteUrl
    title{english romaji  userPreferred}
    description
    status
    season
    episodes
    coverImage {
      medium
    }
  }
}
}`,
            },
            {
                headers: {
                    'content-type': 'application/json',
                    'x-rapidapi-host': 'anilist-graphql.p.rapidapi.com',
                    'x-rapidapi-key': '7312ba6a87mshd90faca3bd5b364p160c8bjsn42e2ef6a0aa4',
                    'accept': 'application/json',
                },
            });
        res.status(response.status).json(response.data);
    }
}

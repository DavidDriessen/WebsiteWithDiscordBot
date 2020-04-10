/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Request, Response} from 'express';
import {Controller, Get, Post} from '@overnightjs/core';
import axios from 'axios';

@Controller('api/series')
export class SeriesController {

    private media = `id
                    title { english romaji  userPreferred }
                    description
                    siteUrl
                    status
                    season
                    episodes
                    coverImage { extraLarge large medium }`;

    @Get('get')
    public getSeries(req: Request, res: Response) {
        if (!req.query.ids) { return res.status(200).json([]); }
        return axios
            .post(
                'https://anilist-graphql.p.rapidapi.com/',
                {
                    // tslint:disable-next-line:max-line-length
                    query: 'query ($ids: [Int]!) { Page { media(id_in: $ids, type: ANIME){ ' + this.media + ' }}}',
                    variables: { ids: req.query.ids },
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
            .then((response) => {
                res.status(200).json(response.data.data.Page.media);
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
                        this.media
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
            res.status(response.status).json(response.data.data.Page);
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

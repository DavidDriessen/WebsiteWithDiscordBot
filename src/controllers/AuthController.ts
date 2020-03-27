/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

// @ts-ignore
import * as DiscordOauth2 from 'discord-oauth2';
import {Controller, Get, Post} from '@overnightjs/core';
import {JwtManager} from '@overnightjs/jwt';
import {Request, Response} from 'express';
import User from '../models/User';
import * as discordConfig from '../../config/discord.json';
import * as url from 'url';

// tslint:disable-next-line:max-line-length
const conf = process.env.NODE_ENV === 'production' ? discordConfig.production : discordConfig.development;

@Controller('api/auth')
export class AuthController {
    @Get('discord')
    private redirectToDiscord(req: Request, res: Response) {
    res.redirect(url.format({
        protocol: 'https',
        hostname: 'discordapp.com',
        pathname: 'api/oauth2/authorize',
        query: {
            client_id: conf.clientId,
            redirect_uri: conf.callbackHost + '/login/discord',
            response_type: 'code',
            scope: conf.scope,
        },
    }));
    }
    @Post('discord')
    private loginDiscord(req: Request, res: Response) {
        const accessCode = req.body.code;
        const redirect = req.body.redirect;
        const oauth = new DiscordOauth2();
        oauth.tokenRequest({
            clientId: conf.clientId,
            clientSecret: conf.clientSecret,

            code: accessCode,
            scope: conf.scope,
            grantType: 'authorization_code',

            redirectUri: redirect,
        }).then((token) => {
            oauth.getUser(token.access_token).then(async (discordUser) => {
                try {
                    const user = await User.findOrCreate({
                        where: {discordId: discordUser.id}, defaults: {
                            name: discordUser.username,
                            // avatar: 'https://cdn.discordapp.com/avatars/' + discordUser.id +
                            //     '/' + discordUser.avatar + '.jpg',
                        },
                    });
                    const jwtStr = JwtManager.jwt({
                        user: user[0],
                        discord: {
                            token,
                            user: discordUser,
                        },
                    });
                    res.status(200).json({
                        jwt: jwtStr,
                        user: user[0],
                        newUser: user[1],
                    });
                } catch (e) {
                    res.status(500).send('Database error');
                }
            });
        }).catch((e) => {
            res.status(500).send('Error communicating with discord');
            // tslint:disable-next-line:no-console
            console.error(e.response);
        });
    }
}

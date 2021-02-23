/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

// @ts-ignore
import DiscordOauth2 from 'discord-oauth2';
import {Controller, Get, Post} from '@overnightjs/core';
import {JwtManager} from '@overnightjs/jwt';
import {Request, Response} from 'express';
import User from '../database/models/User';
import discordConfig from '../config/discord.json';
import url from 'url';

@Controller('api/auth')
export class AuthController {
    @Get('discord')
    private redirectToDiscord(_req: Request, res: Response) {
    res.redirect(url.format({
        protocol: 'https',
        hostname: 'discordapp.com',
        pathname: 'api/oauth2/authorize',
        query: {
            client_id: discordConfig.clientId,
            redirect_uri: discordConfig.callbackHost + '/login/discord',
            response_type: 'code',
            scope: discordConfig.scope,
        },
    }));
    }
    @Post('discord')
    private loginDiscord(req: Request, res: Response) {
        const accessCode = req.body.code;
        const redirect = req.body.redirect;
        const oauth = new DiscordOauth2();
        oauth.tokenRequest({
            clientId: discordConfig.clientId,
            clientSecret: discordConfig.clientSecret,

            code: accessCode,
            scope: discordConfig.scope,
            grantType: 'authorization_code',

            redirectUri: redirect,
        }).then((token) => {
            oauth.getUser(token.access_token).then(async (discordUser) => {
                try {
                    const user = await User.get(discordUser);
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
                    // tslint:disable-next-line:no-console
                    console.error(e);
                }
            });
        }).catch((e) => {
            res.status(500).send('Error communicating with discord');
            // tslint:disable-next-line:no-console
            console.error(e.response);
        });
    }
}

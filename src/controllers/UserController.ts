/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Response} from 'express';
import User from '../models/User';
import {ISecureRequest, JwtManager} from '@overnightjs/jwt';
import {Controller, Get, Middleware} from '@overnightjs/core';

@Controller('api/user')
export class UserController {
    @Get('')
    @Middleware(JwtManager.middleware)
    private async getUser(req: ISecureRequest, res: Response) {
        const user = await User.findByPk(req.payload.id);
        res.status(200).json(user);
    }
}

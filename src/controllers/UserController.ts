/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Response} from 'express';
import User from '../models/User';
import {ISecureRequest, JwtManager} from '@overnightjs/jwt';
import {Controller, Get, Middleware, Post} from '@overnightjs/core';

@Controller('api/user')
export class UserController {
  @Get('')
  @Middleware(JwtManager.middleware)
  private async getUser(req: ISecureRequest, res: Response) {
    const user = await User.findByPk(req.payload.user.id, {attributes: ['name', 'avatar', 'email', 'role']});
    res.status(200).json(user);
  }

  @Post('')
  @Middleware(JwtManager.middleware)
  private async updateUser(req: ISecureRequest, res: Response) {
    const user = await User.findByPk(req.payload.user.id);
    if (user) {
      user.name = req.body.name;
      user.email = req.body.email;
      user.save();
      res.status(200).json(user);
    } else {
      res.status(404).send('User not found.');
    }
  }

  @Get('streamers')
  @Middleware(JwtManager.middleware)
  private async getStreamers(_req: ISecureRequest, res: Response) {
    res.status(200).json(await User.findAll({
      where: {role: 'Admin'},
      attributes: ['id', 'name', 'avatar'],
    }));
  }
}

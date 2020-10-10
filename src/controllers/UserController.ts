/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Response} from 'express';
import User from '../database/models/User';
import {ISecureRequest} from '@overnightjs/jwt';
import {Controller, Get, Middleware, Post} from '@overnightjs/core';
import {JWT} from '../helpers/Website';

@Controller('api/user')
export class UserController {
  @Get('')
  @Middleware(JWT())
  private async getUser(req: ISecureRequest, res: Response) {
    const user = await User.findByPk(req.payload.user.id, {attributes: ['name', 'avatar', 'email', 'role']});
    res.status(200).json(user);
  }

  @Post('')
  @Middleware(JWT())
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
  @Middleware(JWT())
  private async getStreamers(_req: ISecureRequest, res: Response) {
    res.status(200).json(await User.findAll({
      where: {role: 'Admin'},
      attributes: ['id', 'name', 'avatar'],
    }));
  }
}

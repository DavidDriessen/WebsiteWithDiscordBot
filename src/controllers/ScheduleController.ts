/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Request, Response} from 'express';
import {Controller, Get, Middleware, Post, Put} from '@overnightjs/core';
import Event from '../models/Event';
import {ISecureRequest, JwtManager} from '@overnightjs/jwt';
import Series from '../models/Series';


function isAdmin(target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = (req: ISecureRequest, res: Response) => {
        if (req.payload.user.role !== 'admin') {
            return res.status(403).json({message: 'Permission denied'});
        }
        return method(req, res);
    };
}


@Controller('api/schedule')
export class ScheduleController {

    @Get('')
    private async getMessage(req: Request, res: Response) {
        res.status(200).json(await Event.findAll({include: ['series', 'attendees']}));
    }


    @Put('')
    @Middleware(JwtManager.middleware)
    @isAdmin
    private async addEvent(req: ISecureRequest, res: Response) {
        const event = await Event.create(req.body);
        if (req.body.title) {
            event.title = req.body.title;
        }
        if (req.body.description) {
            event.description = req.body.description;
        }
        if (req.body.image) {
            event.image = req.body.image;
        }
        if (req.body.series) {
            for (const {seriesId, episode, episodes} of req.body.series) {
                const series = await Series.findByPk(seriesId);
                if (series) {
                    event.$add('series', series, {through: {episode, episodes}});
                }
            }
        }
        event.save();
        return res.status(200).json(event);
    }

    @Post('')
    @Middleware(JwtManager.middleware)
    @isAdmin
    private async editEvent(req: ISecureRequest, res: Response) {
        const event = await Event.findByPk(req.body.id);
        if (!event) {
            return res.status(200).json({message: 'Event not found'});
        }
        if (req.body.title) {
            event.title = req.body.title;
        }
        if (req.body.description) {
            event.description = req.body.description;
        }
        if (req.body.image) {
            event.image = req.body.image;
        }
        event.save();
        return res.status(200).json(event);
    }
}

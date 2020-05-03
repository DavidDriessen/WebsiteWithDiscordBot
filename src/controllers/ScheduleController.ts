import {Controller, Get, Middleware, Post, Put} from '@overnightjs/core';
import {ISecureRequest, JwtManager} from '@overnightjs/jwt';
import {Includeable} from 'sequelize/types/lib/model';
import * as expressJwt from 'express-jwt';
import Attendee from '../models/Attendee';
import Event from '../models/Event';
import {Response} from 'express';
import * as moment from 'moment';
import {Op} from 'sequelize';
import SeriesEvent from '../models/SeriesEvent';
import User from '../models/User';
import {EventWorker} from '../workers/EventWorker';

function isAdmin(target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = (req: ISecureRequest, res: Response) => {
        if (req.payload.user.role !== 'Admin') {
            return res.status(403).json({message: 'Permission denied'});
        }
        return method(req, res);
    };
}

@Controller('api/schedule')
export class ScheduleController {

    @Get('')
    @Middleware(expressJwt({
        // @ts-ignore
        secret: JwtManager.SECRET,
        userProperty: 'payload',
        credentialsRequired: false,
    }))
    private async getEvents(req: ISecureRequest, res: Response) {
        const include: Includeable[] = [
            {association: 'series', attributes: ['seriesId', 'episode', 'episodes']},
            {association: 'streamer', attributes: ['id', 'name', 'avatar']},
        ];
        if (req.payload) {
            include.push({association: 'attendees', attributes: ['id', 'name', 'avatar']});
            include.push({
                association: 'attending', attributes: ['decision'], required: false,
                where: {user: req.payload.user.id},
            });
        }
        const events: Event[] = await Event.findAll({
            include,
            attributes: ['id', 'title', 'description', 'image', 'start', 'end', 'roomcode'],
            where: {end: {[Op.gte]: moment().toISOString()}},
            order: ['start', ['series', 'order', 'asc']],
        });
        if (req.payload) {
            res.status(200).json(events.map((event) => {
                // @ts-ignore
                event = event.toJSON();
                if (event.streamer.id !== req.payload.user.id) {
                    delete event.attendees;
                }
                return event;
            }));
        } else {
            res.status(200).json(events);
        }
    }

    @Post('attending')
    @Middleware(JwtManager.middleware)
    private async setAttending(req: ISecureRequest, res: Response) {
        const attendee = await Attendee.findOrBuild({
            where: {user: req.payload.user.id, event: req.body.id},
        });
        if (attendee) {
            attendee[0].decision = req.body.decision;
            attendee[0].save();
        }
        res.status(200).json({message: 'ok'});
    }

    @Post('streaming')
    @Middleware(JwtManager.middleware)
    private async setRoomCode(req: ISecureRequest, res: Response) {
        const event = await Event.findOne({
            where: {id: req.body.event, streamerId: req.payload.user.id},
        });
        if (event) {
            event.roomcode = req.body.code;
            event.save();
            EventWorker.sendNotification(event);
            res.status(200).json({message: 'ok'});
        } else {
            res.status(403).json({message: 'Not the streamer'});
        }
    }

    @Put('')
    @Middleware(JwtManager.middleware)
    @isAdmin
    private async addEvent(req: ISecureRequest, res: Response) {
        const data = {
            title: req.body.title,
            description: req.body.description,
            streamerId: req.payload.user.id,
            start: req.body.start,
            end: req.body.end,
        };
        if (req.body.series) {
            // @ts-ignore
            data.series = req.body.series.map((series, index) => {
                return {
                    seriesId: series.details.id,
                    episode: series.episode,
                    episodes: series.episodes,
                    order: index,
                };
            });
        }
        const event = await Event.create(data, {
            include: [
                'series',
                'streamer',
                'attendees',
                {
                    association: 'attending', attributes: ['decision'], required: false,
                    where: {user: req.payload.user.id},
                }],
        });
        return res.status(200).json(ScheduleController.renderResponse(event));
    }

    @Post('')
    @Middleware(JwtManager.middleware)
    @isAdmin
    private async editEvent(req: ISecureRequest, res: Response) {
        // tslint:disable-next-line:max-line-length
        if (!req.body.title || !req.body.start || !req.body.end) {
            return res.status(401).send('');
        }
        const include: Includeable[] = ['series', 'streamer', 'attendees',
            {
                association: 'attending', attributes: ['decision'], required: false,
                where: {user: req.payload.user.id},
            }];
        const event = await Event.findByPk(req.body.id, {include});
        if (!event) {
            return res.status(200).json({message: 'Event not found'});
        }
        event.title = req.body.title;
        event.start = req.body.start;
        event.end = req.body.end;
        event.description = req.body.description;
        if (req.body.series) {
            // @ts-ignore
            const ids = req.body.series.map((series) => series.details.id);
            for (const series of event.series) {
                if (ids.indexOf(series.seriesId) === -1) {
                    series.destroy();
                }
            }
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < req.body.series.length; i++) {
                await SeriesEvent.findOrBuild({
                    where: {
                        event: event.id,
                        seriesId: req.body.series[i].details.id,
                    },
                }).then((db) => {
                    db[0].order = i;
                    db[0].episode = req.body.series[i].episode;
                    db[0].episodes = req.body.series[i].episodes;
                    db[0].save();
                });
            }
        }
        event.save();
        return res.status(200).json(ScheduleController.renderResponse(event));
    }

    private static renderResponse(event: Event) {
        // @ts-ignore
        const response: Event = {
            id: event.id,
            title: event.title,
            description: event.description,
            image: event.image,
            start: event.start,
            end: event.end,
            roomcode: event.roomcode,
        };
        if (event.series) {
            response.series = event.series.map((series) => {
                return {
                    seriesId: series.seriesId,
                    episode: series.episode,
                    episodes: series.episodes,
                } as SeriesEvent;
            });
        }
        if (event.attendees) {
            response.attendees = event.attendees.map((attendee) => {
                return {name: attendee.name, avatar: attendee.avatar} as User;
            });
        }
        if (event.streamer) {
            response.streamer = {name: event.streamer.name, avatar: event.streamer.avatar} as User;
        }
        return response;
    }
}

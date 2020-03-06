/**
 * Example controller
 *
 * created by Sean Maxwell Apr 14, 2019
 */

import {Request, Response} from 'express';
import {Controller, Delete, Get, Post, Put} from '@overnightjs/core';
import {Logger} from '@overnightjs/logger';
import Event from '../models/Event';


@Controller('api/schedule')
export class ScheduleController {


    @Get('')
    private async getMessage(req: Request, res: Response) {
        res.status(200).json(await Event.findAll({include: ['attendees']}));
    }


    @Put(':msg')
    private putMessage(req: Request, res: Response) {
        Logger.Info(req.params.msg);
        return res.status(400).json({
            error: req.params.msg,
        });
    }


    @Post(':msg')
    private postMessage(req: Request, res: Response) {
        Logger.Info(req.params.msg);
        return res.status(400).json({
            error: req.params.msg,
        });
    }


    @Delete(':msg')
    private delMessage(req: Request, res: Response) {
        try {
            throw new Error(req.params.msg);
        } catch (err) {
            Logger.Err(err, true);
            return res.status(400).json({
                error: req.params.msg,
            });
        }
    }
}

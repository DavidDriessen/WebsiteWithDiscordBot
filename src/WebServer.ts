/**
 * Server file for ExpressJS
 *
 * created by Sean Maxwell April 14, 2019
 */

import * as bodyParser from 'body-parser';
import * as controllers from './controllers';

import {Server} from '@overnightjs/core';
import {Logger} from '@overnightjs/logger';
import * as express from 'express';


class WebServer extends Server {

    private readonly SERVER_STARTED = 'Server started on port: ';

    constructor() {
        super(false);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.setupControllers();
    }

    private setupControllers(): void {
        const ctlrInstances = [];
        for (const name in controllers) {
            if (controllers.hasOwnProperty(name)) {
                const controller = (controllers as any)[name];
                ctlrInstances.push(new controller());
            }
        }
        super.addControllers(ctlrInstances);
    }

    public start(port: number): void {
        this.app.use(express.static(__dirname + '/public/'));
        this.app.get('*', (req, res) => {
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                res.status(404).json({status: 'error', type: 'route', message: 'Page not found'});
            }
            res.sendFile(__dirname + '/public/index.html');
        });
        this.app.listen(port, () => {
            Logger.Imp(this.SERVER_STARTED + port);
        });
    }
}

export default WebServer;

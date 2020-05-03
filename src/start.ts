/**
 * Start the Express Web-Server
 *
 * created by Sean Maxwell Apr 14, 2019
 */
import 'reflect-metadata';
import * as dbConfig from './config/database.json';
import * as discordConfig from './config/discord.json';
import {Sequelize} from 'sequelize-typescript';
import WebServer from './WebServer';
import {Client} from '@typeit/discord';
import {registerController} from 'cron-decorators/lib';

// @ts-ignore
// tslint:disable-next-line:max-line-length
const sequelize = process.env.NODE_ENV === 'production' ? new Sequelize(dbConfig.production) : new Sequelize(dbConfig.development);
const webServer = new WebServer();
export const client = new Client();

registerController([__dirname + '/workers/**/*.ts']);
sequelize.addModels([__dirname + '/models']);
client.silent = true;
// tslint:disable-next-line:max-line-length
client.login(discordConfig.token,
    `${__dirname}/discord/*Discord.ts`);
webServer.start(3000);

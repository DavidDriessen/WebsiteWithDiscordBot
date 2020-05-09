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
import {EventDiscord} from './discord/EventDiscord';

const sequelize = process.env.NODE_ENV === 'production' ?
    // @ts-ignore
    new Sequelize(dbConfig.production) : new Sequelize(dbConfig.development);
const webServer = new WebServer();
export const client = new Client();

registerController([__dirname + '/workers/**/*Worker.*']);
sequelize.addModels([__dirname + '/models']);
client.silent = true;
client.login(discordConfig.token, `${__dirname}/discord/*Discord.*`).then(() => {
    EventDiscord.updateChannel().then();
});
webServer.start(3000);

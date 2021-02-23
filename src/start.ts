import 'reflect-metadata';
import dbConfig from './config/database.json';
import discordConfig from './config/discord.json';
import {Sequelize} from 'sequelize-typescript';
import WebServer from './WebServer';
import {Client} from '@typeit/discord';
import {registerController} from 'cron-decorators/lib';
import {migrate} from './database/migrate';
// @ts-ignore
import SequelizeGuard from 'sequelize-guard';
import User from './database/models/User';

const sequelize = process.env.NODE_ENV === 'production' ?
  // @ts-ignore
  new Sequelize(dbConfig.production) : new Sequelize(dbConfig.development);

const webServer = new WebServer();
export const client = new Client();
sequelize.addModels([__dirname + '/database/models']);
const guard = new SequelizeGuard(sequelize, {UserModel: User});

migrate(sequelize).then(() => {
  registerController([__dirname + '/workers/**/*Worker.*']);
  client.silent = true;
  client.login(discordConfig.token, `${__dirname}/discord/*Discord.*`).then();
  webServer.start(3000);
}).catch((e) => {
  // tslint:disable-next-line:no-console
  console.error(e);
  process.exit(1);
});

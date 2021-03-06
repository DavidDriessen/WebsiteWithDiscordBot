import 'reflect-metadata';
import * as dbConfig from './config/database.json';
import * as discordConfig from './config/discord.json';
import {Sequelize} from 'sequelize-typescript';
import WebServer from './WebServer';
import {Client} from '@typeit/discord';
import {registerController} from 'cron-decorators/lib';
import {migrate} from './database/migrate';

const sequelize = process.env.NODE_ENV === 'production' ?
  // @ts-ignore
  new Sequelize(dbConfig.production) : new Sequelize(dbConfig.development);

const webServer = new WebServer();
export const client = new Client();

migrate(sequelize).then(() => {
  registerController([__dirname + '/workers/**/*Worker.*']);
  sequelize.addModels([__dirname + '/database/models']);
  client.silent = true;
  client.login(discordConfig.token, `${__dirname}/discord/*Discord.*`).then();
  webServer.start(3000);
}).catch((e) => {
  // tslint:disable-next-line:no-console
  console.error(e);
  process.exit(1);
});

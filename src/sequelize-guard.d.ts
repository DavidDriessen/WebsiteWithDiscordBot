declare module 'sequelize-guard' {

  import {Sequelize} from 'sequelize-typescript';

  // tslint:disable-next-line:max-classes-per-file
  export class GuardControl {
    public allow(role: string): GuardControl;

    public to(action: string): GuardControl;

    public on(resource: string): GuardControl;

    public commit(): Promise<object>;
  }

  // tslint:disable-next-line:max-classes-per-file
  export class SequelizeGuard<T> {
    constructor(seql: Sequelize, options: { UserModel: T | null, timestamps?: boolean });

    public init(): GuardControl;

  }

  export default SequelizeGuard;
}

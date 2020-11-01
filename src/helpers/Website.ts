import * as expressJwt from 'express-jwt';
import {ISecureRequest, JwtManager} from '@overnightjs/jwt';
import {Response} from 'express';


export function JWT(credentialsRequired = true) {
  return expressJwt({
    // @ts-ignore
    secret: JwtManager.SECRET,
    userProperty: 'payload',
    credentialsRequired,
    algorithms: ['sha1', 'RS256', 'HS256'],
  });
}

export class Guard {

  public static check(permissions: string | string[]) {
    if (typeof permissions === 'string') {
      permissions = [permissions];
    }

    return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      descriptor.value = (req: ISecureRequest, res: Response) => {
        if (req.payload.user.role !== 'Admin') {
          return res.status(403).json({message: 'Permission denied'});
        }
        return method(req, res);
      };
    };
  }

}

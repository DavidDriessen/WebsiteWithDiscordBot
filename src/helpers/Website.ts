import * as expressJwt from 'express-jwt';
import {JwtManager} from '@overnightjs/jwt';


export function JWT(credentialsRequired = true) {
  return expressJwt({
    // @ts-ignore
    secret: JwtManager.SECRET,
    userProperty: 'payload',
    credentialsRequired,
    algorithms: ['sha1', 'RS256', 'HS256'],
  });
}

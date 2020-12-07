import * as expressJwt from 'express-jwt';
import {ISecureRequest, JwtManager} from '@overnightjs/jwt';
import {Response} from 'express';
import * as multer from 'multer';


export function JWT(credentialsRequired = true) {
  return expressJwt({
    // @ts-ignore
    secret: JwtManager.SECRET,
    userProperty: 'payload',
    credentialsRequired,
    algorithms: ['sha1', 'RS256', 'HS256'],
  });
}

export function isAdmin(target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = (req: ISecureRequest, res: Response) => {
    if (req.payload.user.role !== 'Admin') {
      return res.status(403).json({message: 'Permission denied'});
    }
    return method(req, res);
  };
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    let path;
    if (process.env.NODE_ENV === 'production') {
      path = 'public/images/';
    } else {
      path = 'client/public/images/';
    }
    cb(null, path);
  },
  filename(req, file, cb) {
    const f = file.originalname.split('.');
    cb(null, Math.round(Math.random() * 1E9) + '.' + f[f.length - 1]);
  },
});
export const upload = multer({storage});

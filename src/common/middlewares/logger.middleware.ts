import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {

        //console.log('middleware logger');

        const authorization = req.headers.authorization;

        if (authorization) {

            console.log('authorization', authorization);
            req['user'] = {
                token: authorization,
                name: 'Alex Rangel',
                role: 'diretor'
            };
        }

        next();
    }
}
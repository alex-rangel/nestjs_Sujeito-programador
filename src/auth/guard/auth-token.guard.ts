import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import jwtConfig from "../config/jwt.config";
import { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { REQUEST_TOKEN_PAYLOAD } from "../common/auth.constants";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthTokenGuard implements CanActivate {

    constructor(
        private readonly jwtservice: JwtService,
        private readonly prisma: PrismaService,

        @Inject(jwtConfig.KEY)
        private readonly jwtConfiguration: ConfigType<typeof jwtConfig>
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const request = context.switchToHttp().getRequest()
        const token = this.extractTokenHeader(request)

        if (!token) {
            throw new UnauthorizedException('Token não encontrado')
        }

        try {

            const payload = await this.jwtservice.verifyAsync(token, this.jwtConfiguration)

            request[REQUEST_TOKEN_PAYLOAD] = payload

            const userStatus = await this.prisma.user.findFirst({
                where: {
                    id: payload?.sub
                }
            })

            if (!userStatus?.active) {
                throw new UnauthorizedException('Acesso não autorizado')
            }

        } catch (error) {
            console.log(error)
            throw new UnauthorizedException('Acesso não autorizado')
        }


        return true
    }

    extractTokenHeader(request: Request) {

        const authorization = request.headers?.authorization

        if (!authorization || typeof authorization !== 'string') {
            return
        }

        return authorization.split(' ')[1]

    }

}
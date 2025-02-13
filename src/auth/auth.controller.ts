import { Body, Controller, Post } from '@nestjs/common';
import { SignInDto } from './dto/signIn.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) {}

    @Post()
    async signIn(@Body() signInDto: SignInDto) {

        return this.authService.autenticate(signInDto)
    }
}

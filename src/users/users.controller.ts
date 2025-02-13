import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-task.dto';
import { LoggerInterceptor } from 'src/common/interceptors/logger.interceptor';
import { AuthAdminGuard } from 'src/common/guard/admin.guard';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';

import { TokenPayloadParam } from 'src/auth/param/token-payload.param';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';


@Controller('users')
@UseInterceptors(LoggerInterceptor)
//@UseGuards(AuthAdminGuard)
export class UsersController {
    
    constructor(private readonly userService: UsersService ) {}

    @Get()
    findAllUsers() {

        console.log('Token teste: ', process.env.TOKEN_KEY)

        return this.userService.findAll()
    }

    @Get(":id")
    findOneUser(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id)
    }

    @Post()
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto)
    }

    @UseGuards(AuthTokenGuard)
    @Patch(':id')
    updateUser(
        @Param('id', ParseIntPipe) id: number, 
        @Body() updateUserDto: UpdateUserDto,
        @TokenPayloadParam() TokenPayloadParam: PayloadTokenDto
    ) {

        return this.userService.updateUser(id, updateUserDto, TokenPayloadParam)
    }

    @UseGuards(AuthTokenGuard)
    @Delete(':id')
    removeUser(
        @Param('id', ParseIntPipe) id: number,
        @TokenPayloadParam() TokenPayloadParam: PayloadTokenDto
    ) {
        return this.userService.delete(id, TokenPayloadParam)
    }
}

import { Body, Controller, Delete, Get, HttpStatus, Param, ParseFilePipeBuilder, ParseIntPipe, Patch, Post, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
//import { AuthAdminGuard } from 'src/common/guard/admin.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { AuthTokenGuard } from '../auth/guard/auth-token.guard';
import { LoggerInterceptor } from '../common/interceptors/logger.interceptor';
import { TokenPayloadParam } from '../auth/param/token-payload.param';
import { PayloadTokenDto } from '../auth/dto/payload-token.dto';


@Controller('users')
@UseInterceptors(LoggerInterceptor)
//@UseGuards(AuthAdminGuard)
export class UsersController {

    constructor(private readonly userService: UsersService) { }

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

    @UseGuards(AuthTokenGuard)
    @UseInterceptors(FileInterceptor('file'))
    @Post('upload')
    async uploadAvatar(
        @TokenPayloadParam() tokenPayload: PayloadTokenDto,
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: /jpeg|jpg|png/g,
                })
                .addMaxSizeValidator({
                    maxSize: 3 * (1024 * 1024) // Tamanho maximo de 3 MB
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
                }),
        ) file: Express.Multer.File
    ) {
        return this.userService.uploadAvatarImage(tokenPayload, file)
    }

    // @UseGuards(AuthTokenGuard)
    // //configuração do intercptors para upload de multiplos arquivos
    // //@UseInterceptors(FilesInterceptor('file'))
    // @UseInterceptors(FileInterceptor('file'))
    // @Post('upload')
    // async uploadAvatar(
    //     @TokenPayloadParam() tokenPayload: PayloadTokenDto,
    //     //configuração do intercptors para upload de multiplos arquivos
    //     //@UploadedFiles() files: Array<Express.Multer.File>
    //     @UploadedFile(
    //         //configuração do pipe para validação de arquivos
    //         new ParseFilePipeBuilder()
    //             .addFileTypeValidator({
    //                 fileType: /jpeg|jpg|png/g,
    //             })
    //             .addMaxSizeValidator({
    //                 maxSize: 3 * (1024 * 1024) // Tamanho maximo de 3 MB
    //             })
    //             .build({
    //                 errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    //             }),
    //     ) file: Express.Multer.File
    // ) {

    //     //codigo para salvar multiplos arquivos
    //     // files.forEach(async file => {
    //     //     const fileExtension = path.extname(file.originalname).toLowerCase().substring(1)
    //     //     const fileName = `${randomUUID()}.${fileExtension}`
    //     //     const fileLocale = path.resolve(process.cwd(), 'files', fileName)

    //     //     await fs.writeFile(fileLocale, file.buffer)

    //     // })

    //     const mimeType = file.mimetype;
    //     const fileExtension = path.extname(file.originalname).toLowerCase().substring(1)

    //     const fileName = `${tokenPayload.sub}.${fileExtension}`

    //     const fileLocale = path.resolve(process.cwd(), 'files', fileName)

    //     await fs.writeFile(fileLocale, file.buffer)


    //     return true
    // }
}

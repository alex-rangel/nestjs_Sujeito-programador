import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';
import { HashingServiceProtocol } from '../auth/hash/hashing.service';
import { PayloadTokenDto } from '../auth/dto/payload-token.dto';
import * as path from 'node:path';
import * as fs from 'node:fs/promises'

@Injectable()
export class UsersService {

    constructor(
        private prisma: PrismaService,
        private hashingService: HashingServiceProtocol
    ) { }

    async findAll() {

        const users = await this.prisma.user.findMany()

        return users
    }

    async findOne(id: number) {

        const user = await this.prisma.user.findFirst({
            where: {
                id: id
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                tasks: true
            }
        })

        if (user) return user

        throw new HttpException('Usuario não encontrado', HttpStatus.NOT_FOUND)
    }


    async createUser(createUserDto: CreateUserDto) {

        try {

            const passwordHash = await this.hashingService.hash(createUserDto.password)

            const user = await this.prisma.user.create({
                data: {
                    name: createUserDto.name,
                    email: createUserDto.email,
                    passwordHash: passwordHash
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            })

            return user

        } catch (error) {
            throw new HttpException('Falha ao cadastrar usuário!', HttpStatus.BAD_REQUEST)
        }
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto, TokenPayloadParam: PayloadTokenDto) {

        try {

            const user = await this.prisma.user.findFirst({
                where: {
                    id: id
                }
            })

            if (!user) {
                throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND)
            }

            if (user.id !== TokenPayloadParam.sub) {
                throw new HttpException('Acesso negado', HttpStatus.BAD_REQUEST)
            }

            const dataUser: { name?: string, passwordHash?: string } = {
                name: updateUserDto.name ? updateUserDto.name : user.name,
            }

            if (updateUserDto.password) {
                const passwordHash = await this.hashingService.hash(updateUserDto.password)
                dataUser['passwordHash'] = passwordHash
            }

            const updatedUser = await this.prisma.user.update({
                where: {
                    id: id
                },
                data: {
                    name: dataUser.name,
                    passwordHash: dataUser.passwordHash ? dataUser.passwordHash : user.passwordHash
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            })

            return updatedUser

        } catch (error) {
            throw new HttpException('Falha ao atualizar usuário!', HttpStatus.BAD_REQUEST)
        }
    }

    async delete(id: number, TokenPayloadParam: PayloadTokenDto) {

        try {

            const user = await this.prisma.user.findFirst({
                where: {
                    id: id
                }
            })

            if (!user) {
                throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND)
            }

            if (user.id !== TokenPayloadParam.sub) {
                throw new HttpException('Acesso negado', HttpStatus.BAD_REQUEST)
            }

            await this.prisma.user.delete({
                where: {
                    id: user.id
                }
            })

            return {
                message: 'Usuário deletado com sucesso'
            }

        } catch (error) {
            throw new HttpException('Falha ao deletar usuário', HttpStatus.BAD_REQUEST)
        }
    }

    async uploadAvatarImage(tokenPayload: PayloadTokenDto, file: Express.Multer.File) {
        try {
            const mimeType = file.mimetype;
            const fileExtension = path.extname(file.originalname).toLowerCase().substring(1)

            const fileName = `${tokenPayload.sub}.${fileExtension}`

            const fileLocale = path.resolve(process.cwd(), 'files', fileName)

            await fs.writeFile(fileLocale, file.buffer)

            const user = await this.prisma.user.findFirst({
                where: {
                    id: tokenPayload.sub
                }
            })

            if (!user) {
                throw new HttpException('Falha ao atualizar o avatar do usuário!', HttpStatus.BAD_REQUEST)
            }

            const updatedUser = await this.prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    avatar: fileName
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                }
            })

            return updatedUser;

        } catch (err) {
            console.log(err);
            throw new HttpException('Falha ao atualizar o avatar do usuário!', HttpStatus.BAD_REQUEST)
        }
    }

}

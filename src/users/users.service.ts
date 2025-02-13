import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-task.dto';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';

@Injectable()
export class UsersService {

    constructor(
        private prisma: PrismaService,
        private hashingService: HashingServiceProtocol
    ) {}

    async findAll() {

        const users = await this.prisma.user.findMany()

        return users
    }

    async findOne(id: number) {

        const user = await this.prisma.user.findUnique({
            where: {
                id: id
            },
            select: {
                id: true,
                name: true,
                email: true,
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
            throw new HttpException('Falha ao cadastrar usuário', HttpStatus.BAD_REQUEST)
        }
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto, TokenPayloadParam: PayloadTokenDto) {

        try {

            const user = await this.prisma.user.findFirst({
                where: {
                    id: id
                }
            })

            if (!user){
                throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND)
            } 

            if (user.id !== TokenPayloadParam.sub){
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
            throw new HttpException('Falha ao atualizar usuário', HttpStatus.BAD_REQUEST)
        }
    }

    async delete(id: number, TokenPayloadParam: PayloadTokenDto) {

        try {

            const user = await this.prisma.user.findFirst({
                where: {
                    id: id
                }
            })

            if (!user){
                throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND)
            } 

            if (user.id !== TokenPayloadParam.sub){
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
}

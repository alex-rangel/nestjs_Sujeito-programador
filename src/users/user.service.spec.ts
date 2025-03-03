import { Test, TestingModule } from "@nestjs/testing";
import { HashingServiceProtocol } from "../auth/hash/hashing.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { HttpException, HttpStatus } from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PayloadTokenDto } from "../auth/dto/payload-token.dto";
import * as path from 'node:path';
import * as fs from 'node:fs/promises'

jest.mock('node:fs/promises')

describe('UserService', () => {

  let userService: UsersService;
  let prismaService: PrismaService;
  let hashingService: HashingServiceProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn().mockResolvedValue({
                id: 1,
                email: 'alex@email.com',
                name: 'Alex',
              }),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn()
            }
          }
        },
        {
          provide: HashingServiceProtocol,
          useValue: {
            hash: jest.fn().mockResolvedValue('hashed_password')
          }
        }
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    hashingService = module.get<HashingServiceProtocol>(HashingServiceProtocol);


  })


  it('shold be defined users service', () => {

    expect(userService).toBeDefined();
  });


  //Esse teste é para verificar se a função createUser está sendo chamada corretamente e se está passando os parâmetros corretos para a função prismaService.user.create

  describe('Create User', () => {

    it('should create a new user', async () => {

      const createUserDto: CreateUserDto = {
        email: 'alex@email.com',
        name: 'Alex',
        password: '123456'
      }

      //Esse comando serve para mockar a função hash do hashingService ou seja ele vai simular o retorno da função hash para que não seja necessário a execução da função hash verdadeira.

      //jest.spyOn(hashingService, 'hash').mockResolvedValue('hashed_password');

      const user = await userService.createUser(createUserDto);

      expect(hashingService.hash).toHaveBeenCalled();

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          passwordHash: 'hashed_password'
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });

      expect(user).toEqual({
        id: 1,
        email: createUserDto.email,
        name: createUserDto.name
      });
    })

    it('should throw error if prisma create fails', async () => {
      const createUserDto: CreateUserDto = {
        email: 'matheus@teste.com',
        name: 'Matheus',
        password: '123123'
      }

      jest.spyOn(hashingService, 'hash').mockResolvedValue('HASH_MOCK_EXEMPLO')
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(new Error('Database error'))

      await expect(userService.createUser(createUserDto)).rejects.toThrow(
        new HttpException('Falha ao cadastrar usuário!', HttpStatus.BAD_REQUEST)
      )

      expect(hashingService.hash).toHaveBeenCalledWith(createUserDto.password)

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          passwordHash: "HASH_MOCK_EXEMPLO",
        },
        select: {
          id: true,
          name: true,
          email: true,
        }
      })


    })
  });

  describe('FindOne User', () => {

    it('should return a user when found', async () => {

      const mockUser = {
        id: 1,
        name: 'Matheus',
        email: 'matheus@teste.com',
        avatar: null,
        Task: [],
        passwordHash: 'hash_exemplo',
        active: true,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      const user = await userService.findOne(1);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          tasks: true
        }
      });

      expect(user).toEqual(mockUser);

    });

    it('should thorw error exception when user is not found', async () => {

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(userService.findOne(1)).rejects.toThrow(
        new HttpException('Usuario não encontrado', HttpStatus.BAD_REQUEST)
      );

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          tasks: true
        }
      })

    });

  });

  describe('Update User', () => {

    it('should throw exception when user is not found', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Novo nome' };
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null)

      await expect(userService.updateUser(1, updateUserDto, tokenPayload)).rejects.toThrow(
        new HttpException('Falha ao atualizar usuário!', HttpStatus.BAD_REQUEST)
      )

    })

    it('should throw UNAUTHORIZED exception when user is not authorized', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Novo nome' };
      const tokenPayload: PayloadTokenDto = {
        sub: 5,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      const mockUser = {
        id: 1,
        name: 'Matheus',
        email: 'matheus@teste.com',
        avatar: null,
        Task: [],
        passwordHash: 'hash_exemplo',
        active: true,
        createdAt: new Date(),
      }

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser)

      await expect(userService.updateUser(1, updateUserDto, tokenPayload)).rejects.toThrow(
        new HttpException('Falha ao atualizar usuário!', HttpStatus.BAD_REQUEST)
      )

    })

    it('should user updated', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Novo nome', password: 'nova senha' };
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      const mockUser = {
        id: 1,
        name: 'Matheus',
        email: 'matheus@teste.com',
        avatar: null,
        passwordHash: 'hash_exemplo',
        active: true,
        createdAt: new Date(),
      }

      const updateUser = {
        id: 1,
        name: 'Novo nome',
        email: 'matheus@teste.com',
        avatar: null,
        passwordHash: 'novo_hash_exemplo',
        active: true,
        createdAt: new Date(),
      }


      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser)
      jest.spyOn(hashingService, 'hash').mockResolvedValue('novo_hash_exemplo')
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updateUser)

      const result = await userService.updateUser(1, updateUserDto, tokenPayload)

      expect(hashingService.hash).toHaveBeenCalledWith(updateUserDto.password)

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: 1
        },
        data: {
          name: updateUserDto.name,
          passwordHash: 'novo_hash_exemplo'
        },
        select: {
          id: true,
          name: true,
          email: true,
        }
      })

      expect(result).toEqual(updateUser)



    })

  });

  describe('Delete User', () => {

    it('should throw error when user is not found', async () => {

      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null)

      await expect(userService.delete(1, tokenPayload)).rejects.toThrow(
        new HttpException('Falha ao deletar usuário!', HttpStatus.BAD_REQUEST)
      )
    })

    it('should throw UNAUTHORIZED whem user is not authorized', async () => {

      const tokenPayload: PayloadTokenDto = {
        sub: 5,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      const mockUser = {
        id: 1,
        name: 'Matheus',
        email: 'matheus@teste.com',
        avatar: null,
        passwordHash: 'hash_exemplo',
        active: true,
        createdAt: new Date(),
      }

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser)

      await expect(userService.delete(1, tokenPayload)).rejects.toThrow(
        new HttpException('Falha ao deletar usuário!', HttpStatus.BAD_REQUEST)
      )

      expect(prismaService.user.delete).not.toHaveBeenCalled()

    })

    it('should delete user', async () => {

      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      const mockUser = {
        id: 1,
        name: 'Matheus',
        email: 'matheus@teste.com',
        avatar: null,
        passwordHash: 'hash_exemplo',
        active: true,
        createdAt: new Date(),
      }

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser)
      jest.spyOn(prismaService.user, 'delete').mockResolvedValue(mockUser)

      const result = await userService.delete(1, tokenPayload)

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: {
          id: mockUser.id
        }
      })

      expect(result).toEqual({
        message: "Usuário deletado com sucesso!"
      })


    })

  });

  describe('Upload Avatar User', () => {

    it('should throw NOT_FOUND when user is not found', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      const file = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('')
      } as Express.Multer.File;

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null)

      await expect(userService.uploadAvatarImage(tokenPayload, file)).rejects.toThrow(
        new HttpException('Falha ao atualizar o avatar do usuário!', HttpStatus.BAD_REQUEST)
      )

    })

    it('should upload avatar and update user successfully', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      const file = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('')
      } as Express.Multer.File;

      const mockUser: any = {
        id: 1,
        name: 'Matheus',
        email: 'matheus@teste.com',
        avatar: null,
      }

      const updatedUser: any = {
        id: 1,
        name: 'Matheus',
        email: 'matheus@teste.com',
        avatar: '1.png',
      }

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser)
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser)
      jest.spyOn(fs, 'writeFile').mockResolvedValue()

      const result = await userService.uploadAvatarImage(tokenPayload, file)

      const fileLocale = path.resolve(process.cwd(), 'files', '1.png')

      expect(fs.writeFile).toHaveBeenCalledWith(fileLocale, file.buffer)
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUser.id
        },
        data: {
          avatar: '1.png'
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        }
      })

      expect(result).toEqual(updatedUser)


    })

    it('should throw error if file write fails', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: ''
      }

      const file = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('')
      } as Express.Multer.File;

      const mockUser: any = {
        id: 1,
        name: 'Matheus',
        email: 'matheus@teste.com',
        avatar: null,
      }

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser)

      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('File write error'))

      await expect(userService.uploadAvatarImage(tokenPayload, file)).rejects.toThrow(
        new HttpException('Falha ao atualizar o avatar do usuário!', HttpStatus.BAD_REQUEST)
      )


    })


  });

})

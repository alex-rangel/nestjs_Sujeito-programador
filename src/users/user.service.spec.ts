import { Test, TestingModule } from "@nestjs/testing";
import { HashingServiceProtocol } from "../auth/hash/hashing.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { HttpException, HttpStatus } from "@nestjs/common";
import exp from "constants";

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
                            findFirst: jest.fn()
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
              tasks: true
            }
          })
    
    });
})

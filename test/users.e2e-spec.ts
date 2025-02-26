import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from '../src/tasks/tasks.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { PrismaService } from '../src/prisma/prisma.service';
import * as dotenv from 'dotenv';
import { exec, execSync } from 'node:child_process';

// carrega as variáveis de ambiente do arquivo .env.test
dotenv.config({ path: '.env.test' });

describe('User (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // executa as migrate do banco de dados antes de todos os testes
  beforeAll(async () => {
    execSync('npx prisma migrate deploy');
  });


  beforeEach(async () => {

    //para garantir que sera setado a variável de ambiente DATABASE_URL e garantir que vai ser criado as migrations no banco de dados
    execSync('cross-env DATABASE_URL=mysql://alex:1234@localhost:3306/Db_test npx prisma migrate deploy')

    //importação dos modulos que serão utilizados no teste
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          //configuração para setar qual arquivo .env será carregado de acordo com o ambiente
          envFilePath: process.env.NODE_ENV ?
            `.env.${process.env.NODE_ENV}` : '.env'
        }),
        TasksModule,
        PrismaModule,
        UsersModule,
        AuthModule,
        // configuração para servir arquivos estáticos
        ServeStaticModule.forRoot({
          rootPath: join(__dirname, '..', 'files'),
          serveRoot: "/files"
        })
      ],
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    })),

      // comando para injetar o serviço do PrismaService
      prismaService = module.get<PrismaService>(PrismaService);

    await app.init();
  });

  //apaga todos os registros do banco de dados depois de cada teste
  afterAll(async () => {
    await prismaService.user.deleteMany();
  }
  );

  afterEach(async () => {
    await app.close();
  });

  describe('/users', () => {

    it('POST /users', async () => {

      const createUserDto = {
        name: 'Alex',
        email: 'alex@email.com',
        password: '123456',
      }

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toEqual({
        id: response.body.id,
        name: 'Alex',
        email: 'alex@email.com'
      });

    });
  });
});

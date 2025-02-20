import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { APP_GUARD } from '@nestjs/core';
import { AuthAdminGuard } from './common/guard/admin.guard';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TasksModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    // configuração para servir arquivos estáticos
    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..', 'files'),
      serveRoot: "/files"
    }),
  ],
  controllers: [],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthAdminGuard,
    // }
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware)
      .forRoutes({
        path: '*',
        method: RequestMethod.ALL
      });
  }
}

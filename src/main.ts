import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  // habilita o CORS
  app.enableCors({

    // determina a origem permitida 
    origin: '*',
    
    // determina os métodos HTTP permitidos 
    //methods: 'GET, POST, PUT, DELETE',

    // determina os cabeçalhos permit
    //allowedHeaders: 'Content-Type, Authorization',
  }); 

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // remove campos que não estão no DTO
  }))

  const configSwagger = new DocumentBuilder()
  .setTitle('Lista de tarefas')
  .setDescription('API lista de tarefas.')
  //para adicionar autenticação por token
  .addBearerAuth()
  .setVersion('1.0')
  .build();

const documentFactory = () => SwaggerModule.createDocument(app, configSwagger);
SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

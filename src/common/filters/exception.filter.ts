import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import path from "path";
import { timestamp } from "rxjs";

@Catch(HttpException)
export class ApiExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const erroResponse = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: erroResponse !== "" ? erroResponse : 'Erro ao realizar a operação',
      path: request.url,
    });
  }
}
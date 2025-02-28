import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { PaginationDto } from 'src/common/dto/pagination';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/param/token-payload.param';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

//incluir a anotação @ApiTags() para adicionar uma descrição na documentação do Swagger sobre o controller e personalizar o nome da tag
@ApiTags('Tarefas')
@Controller('tasks')
//@UseInterceptors(LoggerInterceptor)
//@UseInterceptors(AddHeaderInteceptor)
//@UseFilters(ApiExceptionFilter)
//@UseGuards(AuthAdminGuard)
export class TasksController {
    constructor(
        private readonly taskService: TasksService,
        @Inject('KEY_TOKEN')
        private readonly keyToken: string
    ) { }

    @Get()
    //incluir a anotação @ApiOperation() para adicionar uma descrição na documentação do Swagger sobre o método
    @ApiOperation({ summary: 'Lista todas as tarefas' })
    findAllTasks(@Query() paginationDto: PaginationDto) {
        return this.taskService.findAll(paginationDto);
    }

    @Get(":id")
    @ApiOperation({ summary: 'Lista detalhes de uma tarefa' })
    //Serve para colocar informações sobre os parâmetros da rota que tem que ser passados
    @ApiParam({ 
        name: 'id', 
        description: 'Id da tarefa',
        example: 1 
    })
    findOneTask(@Param('id', ParseIntPipe) id: number) {
        return this.taskService.findOne(id);
    }

    @UseGuards(AuthTokenGuard)
    //incluir a anotação @ApiBearerAuth() para habilitar a autenticação por token na documentação do Swagger
    @ApiBearerAuth()
    @ApiOperation({ summary: 'criar uma tarefa' })
    @Post()
    createTask(
        @Body() createTask: CreateTaskDto,
        @TokenPayloadParam() tokenPayLoad: PayloadTokenDto
    ) {
        return this.taskService.createTask(createTask, tokenPayLoad);
    }

    @UseGuards(AuthTokenGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Atualiaza uma tarefa' })
    @ApiParam({ 
        name: 'id', 
        description: 'Id da tarefa',
        example: 1 
    })
    @Patch(':id')
    updateTask(
        @Param('id', ParseIntPipe) id: number, @Body() body: UpdateTaskDto,
        @TokenPayloadParam() tokenPayLoad: PayloadTokenDto
    ) {

        return this.taskService.updateTask(id, body, tokenPayLoad);
    }

    @UseGuards(AuthTokenGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Deletar uma tarefa' })
    @Delete(':id')
    removeTask(
        @Param('id', ParseIntPipe) id: number,
        @TokenPayloadParam() tokenPayLoad: PayloadTokenDto
    ) {
        return this.taskService.delete(id, tokenPayLoad);
    }
}

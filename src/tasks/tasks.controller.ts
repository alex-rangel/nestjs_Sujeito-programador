import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { PaginationDto } from 'src/common/dto/pagination';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/param/token-payload.param';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';

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
    findAllTasks(@Query() paginationDto: PaginationDto) {
        return this.taskService.findAll(paginationDto);
    }

    @Get(":id")
    findOneTask(@Param('id', ParseIntPipe) id: number) {
        return this.taskService.findOne(id);
    }

    @UseGuards(AuthTokenGuard)
    @Post()
    createTask(
        @Body() createTask: CreateTaskDto,
        @TokenPayloadParam() tokenPayLoad: PayloadTokenDto
    ) {
        return this.taskService.createTask(createTask, tokenPayLoad);
    }

    @UseGuards(AuthTokenGuard)
    @Patch(':id')
    updateTask(
        @Param('id', ParseIntPipe) id: number, @Body() body: UpdateTaskDto,
        @TokenPayloadParam() tokenPayLoad: PayloadTokenDto
    ) {

        return this.taskService.updateTask(id, body, tokenPayLoad);
    }

    @UseGuards(AuthTokenGuard)
    @Delete(':id')
    removeTask(
        @Param('id', ParseIntPipe) id: number,
        @TokenPayloadParam() tokenPayLoad: PayloadTokenDto
    ) {
        return this.taskService.delete(id, tokenPayLoad);
    }
}

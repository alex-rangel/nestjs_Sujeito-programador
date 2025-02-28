import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from '../common/dto/pagination';
import { PayloadTokenDto } from '../auth/dto/payload-token.dto';
import { ResponseTaskDto } from './dto/response-task.dto';

@Injectable()
export class TasksService {

    constructor(private prisma: PrismaService) {}

    async findAll(paginationDto?: PaginationDto): Promise<ResponseTaskDto[]> {

        const { limit = 10, offset = 0 } = paginationDto || {};

        const allTasks = await this.prisma.task.findMany({
            take: limit,
            skip: offset,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return allTasks;
    }

    async findOne(id: number): Promise<ResponseTaskDto> {
        const task = await this.prisma.task.findUnique({
            where: { id }
        });
        
        if (task?.name) return task;

        throw new HttpException('Tarefa não foi encontrada', HttpStatus.NOT_FOUND);
    }

    async createTask(createtask: CreateTaskDto, tokenPayLoad: PayloadTokenDto): Promise<ResponseTaskDto> {

      try {

        const newTask = await this.prisma.task.create({
            data: {
                name: createtask.name,
                description: createtask.description,
                completed: false,
                userId: tokenPayLoad.sub
            }
        });

        return newTask;

      } catch (error) {
        throw new HttpException('Falha ao criar a tarefa', HttpStatus.BAD_REQUEST);
      }
    }

    async updateTask(id: number, updateTask: UpdateTaskDto, tokenPayLoad: PayloadTokenDto): Promise<ResponseTaskDto> {
        
        const findTask = await this.prisma.task.findUnique({
            where: { id }
        });

        if (!findTask) {
            throw new HttpException('Essa tarefa não existe', HttpStatus.NOT_FOUND);
        } 

        if (findTask.userId !== tokenPayLoad.sub) {
            throw new HttpException('Você não tem permissão para editar essa tarefa', HttpStatus.UNAUTHORIZED);
        }

        const task = await this.prisma.task.update({
            where: {
                id: findTask.id
            },
            data: {
                name: updateTask.name ? updateTask.name : findTask.name,
                description: updateTask.description ? updateTask.description : findTask.description,
                completed: updateTask.completed ? updateTask.completed : findTask.completed,
            }
        })
  
        return task;
    }

    async delete(id: number, tokenPayLoad: PayloadTokenDto) {

        try {

            const findTask = await this.prisma.task.findUnique({
                where: { id }
            });
    
            if (!findTask) {
                throw new HttpException('Essa tarefa não existe', HttpStatus.NOT_FOUND);
            } 
         
            if (findTask.userId !== tokenPayLoad.sub) {
                throw new HttpException('Você não tem permissão para deletar essa tarefa', HttpStatus.UNAUTHORIZED);
            }
            
            await this.prisma.task.delete({
                where: { id }
            });
    
            return {
                message: 'Tarefa deletada com sucesso'
            };

        } catch (error) {
            throw new HttpException('Falha ao deletar a tarefa', HttpStatus.NOT_FOUND);
        }
    }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';
import type {
    CreateUserRequest,
    CreateUserResponse,
    DeleteUserRequest,
    DeleteUserResponse,
    GetManyUsersRequest,
    GetManyUsersResponse,
    GetOneUserRequest,
    GetOneUserResponse,
    GetUserByIdRequest,
    GetUserByIdResponse,
    GetUserPageRequest,
    GetUserPageResponse,
    UpdateUserRequest,
    UpdateUserResponse,
} from 'proto/user.pb';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @GrpcMethod('UserService', 'CreateUser')
    async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
        const user = await this.userService.create(data);
        return { user };
    }

    @GrpcMethod('UserService', 'UpdateUser')
    async updateUser(data: UpdateUserRequest): Promise<UpdateUserResponse> {
        const user = await this.userService.update(data.id, data);
        return { user };
    }

    @GrpcMethod('UserService', 'DeleteUser')
    async deleteUser(data: DeleteUserRequest): Promise<DeleteUserResponse> {
        const success = await this.userService.remove(data.id);
        return { success };
    }

    @GrpcMethod('UserService', 'GetUserPage')
    async getUserPage(data: GetUserPageRequest): Promise<GetUserPageResponse> {
        return this.userService.getPage(
            data.page,
            data.pageSize,
            data.condition,
        );
    }

    @GrpcMethod('UserService', 'GetManyUsers')
    async getManyUsers(
        data: GetManyUsersRequest,
    ): Promise<GetManyUsersResponse> {
        const users = await this.userService.getMany(data.condition);
        return { users };
    }

    @GrpcMethod('UserService', 'GetUserById')
    async getUserById(
        data: GetUserByIdRequest,
    ): Promise<GetUserByIdResponse> {
        const user = await this.userService.getById(data.id);
        return { user };
    }

    @GrpcMethod('UserService', 'GetOneUser')
    async getOneUser(data: GetOneUserRequest): Promise<GetOneUserResponse> {
        const user = await this.userService.getOne(data.condition);
        return { user };
    }
}
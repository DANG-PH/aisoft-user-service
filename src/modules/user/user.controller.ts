import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';
import type {
    GetProfileRequest,
    GetProfileResponse,
} from 'proto/user.pb';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @GrpcMethod('UserService', 'GetProfile')
    async getProfile(data: GetProfileRequest): Promise<GetProfileResponse> {
        const user = await this.userService.getProfile(data.id);
        return {
            user: {
                realname: user.realname,
            },
        };
    }
}
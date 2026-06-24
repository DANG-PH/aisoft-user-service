import { Controller, Logger } from '@nestjs/common';
import {
    EventPattern,
    Payload,
    Ctx,
    RmqContext,
} from '@nestjs/microservices';
import { UserService } from '../user/user.service';

interface UserRegisteredPayload {
    authId: number;
    realname: string;
    username: string;
}

interface UserDeletedPayload {
    authId: number;
}

@Controller()
export class UserProfileConsumer {
    private readonly logger = new Logger(UserProfileConsumer.name);

    constructor(private readonly userService: UserService) {}

    @EventPattern('user.registered')
    async handleUserRegistered(
        @Payload() data: UserRegisteredPayload,
        @Ctx() context: RmqContext,
    ): Promise<void> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.log(`Nhận event user.registered authId=${data.authId}`);

        try {
            await this.userService.register(data.authId, data.realname);
            channel.ack(originalMsg);
        } catch (err) {
            this.logger.error(
                `Xử lý user.registered thất bại authId=${data.authId}`,
                err,
            );
            // Demo: requeue để retry. Production nên có DLQ + retry limit
            channel.nack(originalMsg, false, true);
        }
    }

    @EventPattern('user.deleted')
    async handleUserDeleted(
        @Payload() data: UserDeletedPayload,
        @Ctx() context: RmqContext,
    ): Promise<void> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.log(`Nhận event user.deleted authId=${data.authId}`);

        try {
            await this.userService.deleteByAuthId(data.authId);
            channel.ack(originalMsg);
        } catch (err) {
            this.logger.error(
                `Xử lý user.deleted thất bại authId=${data.authId}`,
                err,
            );
            channel.nack(originalMsg, false, true);
        }
    }
}
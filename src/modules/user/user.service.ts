import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { User_Entity } from './user.entity';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User_Entity)
        private readonly userRepository: Repository<User_Entity>,
    ) {}

    async register(authId: number, realname: string): Promise<boolean> {
        if (!authId) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Thiếu thông tin định danh người dùng',
            });
        }

        const existing = await this.userRepository.findOne({
            where: { auth_id: authId },
        });
        if (existing) {
            this.logger.warn(
                `Profile authId=${authId} đã tồn tại, skip (idempotent)`,
            );
            return true;
        }

        const user = this.userRepository.create({
            auth_id: authId,
            realname: realname ?? '',
        });

        try {
            await this.userRepository.save(user);
            this.logger.log(`Đã tạo hồ sơ cho authId=${authId}`);
            return true;
        } catch (err) {
            this.logger.error(`Tạo hồ sơ thất bại cho authId=${authId}`, err);
            throw new RpcException({
                code: status.INTERNAL,
                message: 'Không thể tạo hồ sơ người dùng',
            });
        }
    }

    async deleteByAuthId(authId: number): Promise<boolean> {
        if (!authId) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Thiếu thông tin định danh người dùng',
            });
        }

        try {
            const result = await this.userRepository.delete({ auth_id: authId });
            if (result.affected === 0) {
                this.logger.warn(
                    `Không tìm thấy profile authId=${authId} để xóa (đã xóa trước đó?)`,
                );
            } else {
                this.logger.log(`Đã xóa profile authId=${authId}`);
            }
            return true;
        } catch (err) {
            this.logger.error(`Xóa profile thất bại authId=${authId}`, err);
            throw new RpcException({
                code: status.INTERNAL,
                message: 'Không thể xóa hồ sơ người dùng',
            });
        }
    }

    async getProfile(authId: number): Promise<User_Entity> {
        if (!authId) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Thiếu thông tin định danh người dùng',
            });
        }

        const user = await this.userRepository.findOne({
            where: { auth_id: authId },
        });

        if (!user) {
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'Người dùng không tồn tại',
            });
        }

        return user;
    }
}
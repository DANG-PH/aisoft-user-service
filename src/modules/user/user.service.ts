import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ILike, Repository } from 'typeorm';
import { User_Entity } from './user.entity';
import { CreateUserRequest, UpdateUserRequest, UserCondition } from 'proto/user.pb';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User_Entity)
        private readonly userRepository: Repository<User_Entity>,
    ) {}

    /**
     * Build where clause từ condition. Dùng ILIKE để search không phân biệt hoa
     * thường, tìm theo partial match (kiểu %abc%).
     */
    private buildWhere(condition?: UserCondition) {
        if (!condition) return {};
        const where: any = {};
        if (condition.username) where.username = ILike(`%${condition.username}%`);
        if (condition.realname) where.realname = ILike(`%${condition.realname}%`);
        return where;
    }

    // ============================================================
    // CREATE
    // ============================================================
    async create(data: CreateUserRequest): Promise<User_Entity> {
        if (!data.username || !data.email) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Thiếu username hoặc email',
            });
        }

        // Check trùng
        const existing = await this.userRepository.findOne({
            where: [{ username: data.username }, { email: data.email }],
        });
        if (existing) {
            throw new RpcException({
                code: status.ALREADY_EXISTS,
                message: 'Username hoặc email đã tồn tại',
            });
        }

        const user = this.userRepository.create({
            username: data.username,
            realname: data.realname ?? '',
            email: data.email,
        });

        try {
            const saved = await this.userRepository.save(user);
            this.logger.log(`Đã tạo user id=${saved.id}`);
            return saved;
        } catch (err) {
            this.logger.error('Tạo user thất bại', err);
            throw new RpcException({
                code: status.INTERNAL,
                message: 'Không thể tạo người dùng',
            });
        }
    }

    // ============================================================
    // UPDATE
    // ============================================================
    async update(id: number, data: UpdateUserRequest): Promise<User_Entity> {
        if (!id) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Thiếu id',
            });
        }

        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'Người dùng không tồn tại',
            });
        }

        if (data.username !== undefined) user.username = data.username;
        if (data.realname !== undefined) user.realname = data.realname;
        if (data.email !== undefined) user.email = data.email;

        try {
            const updated = await this.userRepository.save(user);
            this.logger.log(`Đã update user id=${id}`);
            return updated;
        } catch (err) {
            this.logger.error(`Update user id=${id} thất bại`, err);
            throw new RpcException({
                code: status.INTERNAL,
                message: 'Không thể cập nhật người dùng',
            });
        }
    }

    // ============================================================
    // DELETE
    // ============================================================
    async remove(id: number): Promise<boolean> {
        if (!id) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Thiếu id',
            });
        }

        try {
            const result = await this.userRepository.delete({ id });
            if (result.affected === 0) {
                throw new RpcException({
                    code: status.NOT_FOUND,
                    message: 'Người dùng không tồn tại',
                });
            }
            this.logger.log(`Đã xóa user id=${id}`);
            return true;
        } catch (err) {
            if (err instanceof RpcException) throw err;
            this.logger.error(`Xóa user id=${id} thất bại`, err);
            throw new RpcException({
                code: status.INTERNAL,
                message: 'Không thể xóa người dùng',
            });
        }
    }

    // ============================================================
    // GET PAGE
    // ============================================================
    async getPage(
        page: number,
        pageSize: number,
        condition?: UserCondition,
    ): Promise<{
        users: User_Entity[];
        total: number;
        page: number;
        pageSize: number;
    }> {
        const safePage = page && page > 0 ? page : 1;
        const safeSize = pageSize && pageSize > 0 ? pageSize : 10;

        const [users, total] = await this.userRepository.findAndCount({
            where: this.buildWhere(condition),
            skip: (safePage - 1) * safeSize,
            take: safeSize,
            order: { id: 'DESC' },
        });

        return { users, total, page: safePage, pageSize: safeSize };
    }

    // ============================================================
    // GET MANY
    // ============================================================
    async getMany(condition?: UserCondition): Promise<User_Entity[]> {
        return this.userRepository.find({
            where: this.buildWhere(condition),
            order: { id: 'DESC' },
        });
    }

    // ============================================================
    // GET BY ID
    // ============================================================
    async getById(id: number): Promise<User_Entity> {
        if (!id) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Thiếu id',
            });
        }

        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'Người dùng không tồn tại',
            });
        }
        return user;
    }

    // ============================================================
    // GET ONE (theo condition)
    // ============================================================
    async getOne(condition?: UserCondition): Promise<User_Entity> {
        const where = this.buildWhere(condition);
        if (Object.keys(where).length === 0) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Cần ít nhất 1 điều kiện tìm kiếm',
            });
        }

        const user = await this.userRepository.findOne({ where });
        if (!user) {
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'Không tìm thấy người dùng phù hợp',
            });
        }
        return user;
    }
}
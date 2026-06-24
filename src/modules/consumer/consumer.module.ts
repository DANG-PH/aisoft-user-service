import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { UserProfileConsumer } from './user-profile.consumer';

@Module({
    imports: [UserModule], 
    controllers: [UserProfileConsumer],
})
export class ConsumerModule {}
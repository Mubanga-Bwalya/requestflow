import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersMutationService } from './users-mutation.service';
import { UsersQueryService } from './users-query.service';
import { UsersService } from './users.service';
import { ZamtelDirectoryService } from './zamtel-directory.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersQueryService,
    UsersMutationService,
    ZamtelDirectoryService,
  ],
  exports: [UsersService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../../common/cache/cache.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsMutationService } from './departments-mutation.service';
import { DepartmentsQueryService } from './departments-query.service';
import { DepartmentsRosterService } from './departments-roster.service';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [DepartmentsController],
  providers: [
    DepartmentsService,
    DepartmentsQueryService,
    DepartmentsMutationService,
    DepartmentsRosterService,
  ],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsMutationService } from './departments-mutation.service';
import { DepartmentsQueryService } from './departments-query.service';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [AuthModule],
  controllers: [DepartmentsController],
  providers: [
    DepartmentsService,
    DepartmentsQueryService,
    DepartmentsMutationService,
  ],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}

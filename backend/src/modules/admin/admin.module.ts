import { Module } from '@nestjs/common';
import { FrontendDiagnosticsModule } from '../../common/diagnostics/frontend-diagnostics.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, FrontendDiagnosticsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminReportsService],
})
export class AdminModule {}

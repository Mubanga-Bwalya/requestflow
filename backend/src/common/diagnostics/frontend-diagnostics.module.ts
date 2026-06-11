import { Module } from '@nestjs/common';
import { FrontendDiagnosticsService } from './frontend-diagnostics.service';

@Module({
  providers: [FrontendDiagnosticsService],
  exports: [FrontendDiagnosticsService],
})
export class FrontendDiagnosticsModule {}

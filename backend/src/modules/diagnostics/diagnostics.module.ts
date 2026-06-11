import { Module } from '@nestjs/common';
import { FrontendDiagnosticsModule } from '../../common/diagnostics/frontend-diagnostics.module';
import { AuthModule } from '../auth/auth.module';
import { DiagnosticsController } from './diagnostics.controller';

@Module({
  imports: [FrontendDiagnosticsModule, AuthModule],
  controllers: [DiagnosticsController],
})
export class DiagnosticsModule {}

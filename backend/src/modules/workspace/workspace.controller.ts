import { Controller, Get, Query } from '@nestjs/common';
import type { RequestUser } from '../../common/auth.types';
import { isManagerRole } from '../../common/auth-helpers';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  getWorkspace(
    @CurrentUser() user: RequestUser,
    @Query('includeInbox') includeInbox?: string,
  ) {
    return this.workspaceService.getForUser({
      userId: user.id,
      departmentName: user.departmentName ?? undefined,
      includeInbox:
        (includeInbox === 'true' || includeInbox === '1') &&
        isManagerRole(user.roleName),
    });
  }
}

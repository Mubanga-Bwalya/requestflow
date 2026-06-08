import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import type { RequestUser } from '../../common/auth.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { wantsPagination } from '../../common/pagination';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread-count')
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.notificationsService.countUnread(user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const paginate = wantsPagination(page, limit);
    return this.notificationsService.findAllForUser(
      user.id,
      paginate ? parseInt(page ?? '1', 10) : undefined,
      paginate ? parseInt(limit ?? '20', 10) : undefined,
    );
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllRead(user.id);
  }
}

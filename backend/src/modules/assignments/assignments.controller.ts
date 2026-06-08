import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RequestUser } from '../../common/auth.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { wantsPagination } from '../../common/pagination';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import {
  CreateMilestoneDto,
  UpdateAssignmentStatusDto,
  UpdateMilestoneDto,
} from './dto/update-assignment.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('tab') tab?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const paginate = wantsPagination(page, limit);
    return this.assignmentsService.findAllForUser(user.id, {
      tab,
      q,
      page: paginate ? parseInt(page ?? '1', 10) : undefined,
      limit: paginate ? parseInt(limit ?? '20', 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.assignmentsService.findOne(id, user);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post()
  create(@Body() body: CreateAssignmentDto, @CurrentUser() user: RequestUser) {
    return this.assignmentsService.create(body, user);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateAssignmentStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assignmentsService.updateStatus(id, body, user);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post(':id/milestones')
  createMilestone(
    @Param('id') id: string,
    @Body() body: CreateMilestoneDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assignmentsService.createMilestone(id, body, user);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Patch(':assignmentId/milestones/:milestoneId')
  updateMilestone(
    @Param('assignmentId') assignmentId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: UpdateMilestoneDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assignmentsService.updateMilestone(
      assignmentId,
      milestoneId,
      body,
      user,
    );
  }
}

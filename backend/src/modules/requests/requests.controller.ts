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
import { assertManagerInboxAccess } from '../../common/auth-helpers';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { wantsPagination } from '../../common/pagination';
import { CreateRequestDto } from './dto/create-request.dto';
import {
  ProvideMissingInformationDto,
  RequestMissingInformationDto,
  UpdateRequestStatusDto,
} from './dto/update-request-status.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post()
  create(@Body() body: CreateRequestDto, @CurrentUser() user: RequestUser) {
    return this.requestsService.create(body, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('targetDepartmentName') targetDepartmentName?: string,
    @Query('tab') tab?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (targetDepartmentName?.trim()) {
      assertManagerInboxAccess(user, targetDepartmentName);
    }
    const paginate = wantsPagination(page, limit);
    return this.requestsService.findAll({
      createdByUserId: targetDepartmentName?.trim() ? undefined : user.id,
      targetDepartmentName: targetDepartmentName?.trim() || undefined,
      tab,
      q,
      ...(paginate
        ? {
            page: parseInt(page ?? '1', 10),
            limit: parseInt(limit ?? '20', 10),
          }
        : {}),
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.requestsService.findOne(id, user);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateRequestStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requestsService.updateStatus(id, body, user);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post(':id/request-missing-information')
  requestMissingInformation(
    @Param('id') id: string,
    @Body() body: RequestMissingInformationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requestsService.requestMissingInformation(id, body, user);
  }

  @Throttle({ writes: { limit: 60, ttl: 60_000 } })
  @Post(':id/provide-information')
  provideInformation(
    @Param('id') id: string,
    @Body() body: ProvideMissingInformationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.requestsService.provideMissingInformation(id, body, user);
  }
}

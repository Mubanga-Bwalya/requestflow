import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../common/auth.types';
import type { CreateRequestDto } from './dto/create-request.dto';
import type {
  ProvideMissingInformationDto,
  RequestMissingInformationDto,
  UpdateRequestStatusDto,
} from './dto/update-request-status.dto';
import { RequestsCreateService } from './requests-create.service';
import { RequestsLifecycleService } from './requests-lifecycle.service';
import { RequestsQueryService } from './requests-query.service';

/** Facade — keeps controller stable while logic lives in focused services. */
@Injectable()
export class RequestsService {
  constructor(
    private readonly query: RequestsQueryService,
    private readonly createSvc: RequestsCreateService,
    private readonly lifecycle: RequestsLifecycleService,
  ) {}

  create(dto: CreateRequestDto, user: RequestUser) {
    return this.createSvc.create(dto, user);
  }

  findAll(query: Parameters<RequestsQueryService['findAll']>[0]) {
    return this.query.findAll(query);
  }

  findOne(id: string, user: RequestUser) {
    return this.query.findOne(id, user);
  }

  updateStatus(id: string, dto: UpdateRequestStatusDto, user: RequestUser) {
    return this.lifecycle.updateStatus(id, dto, user);
  }

  provideMissingInformation(
    id: string,
    dto: ProvideMissingInformationDto,
    user: RequestUser,
  ) {
    return this.lifecycle.provideMissingInformation(id, dto, user);
  }

  requestMissingInformation(
    id: string,
    dto: RequestMissingInformationDto,
    user: RequestUser,
  ) {
    return this.lifecycle.requestMissingInformation(id, dto, user);
  }
}

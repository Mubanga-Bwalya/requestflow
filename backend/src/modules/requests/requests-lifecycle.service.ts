import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../common/auth.types';
import type {
  ProvideMissingInformationDto,
  RequestMissingInformationDto,
  UpdateRequestStatusDto,
} from './dto/update-request-status.dto';
import { RequestsMissingInfoLifecycleService } from './requests-missing-info-lifecycle.service';
import { RequestsStatusLifecycleService } from './requests-status-lifecycle.service';

/** Facade — keeps RequestsService stable while status and missing-info logic stay separate. */
@Injectable()
export class RequestsLifecycleService {
  constructor(
    private readonly status: RequestsStatusLifecycleService,
    private readonly missingInfo: RequestsMissingInfoLifecycleService,
  ) {}

  updateStatus(id: string, dto: UpdateRequestStatusDto, user: RequestUser) {
    return this.status.updateStatus(id, dto, user);
  }

  provideMissingInformation(
    id: string,
    dto: ProvideMissingInformationDto,
    user: RequestUser,
  ) {
    return this.missingInfo.provideMissingInformation(id, dto, user);
  }

  requestMissingInformation(
    id: string,
    dto: RequestMissingInformationDto,
    user: RequestUser,
  ) {
    return this.missingInfo.requestMissingInformation(id, dto, user);
  }
}

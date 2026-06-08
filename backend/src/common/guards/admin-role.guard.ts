import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ADMIN_ROLE_NAMES } from '../../modules/auth/auth.service';
import type { RequestUser } from '../auth.types';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user?.roleName || !ADMIN_ROLE_NAMES.has(user.roleName)) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}

import { AccessPolicyService } from './access-policy.service';
import type { RequestUser } from './auth.types';
import type {
  AssignmentAccessContext,
  RequestAccessContext,
} from './access-policy.types';

describe('AccessPolicyService', () => {
  const service = new AccessPolicyService({} as never);

  const requester: RequestUser = {
    id: 'user-requester',
    email: 'a@x.com',
    roleName: 'Employee',
    departmentName: 'HR',
    departmentId: 'dept-hr-src',
  };

  const hrManager: RequestUser = {
    id: 'user-hr-mgr',
    email: 'm@x.com',
    roleName: 'HR Manager',
    departmentName: 'HR',
    departmentId: 'dept-hr',
  };

  const marketingManager: RequestUser = {
    id: 'user-mkt-mgr',
    email: 'mm@x.com',
    roleName: 'Marketing Manager',
    departmentName: 'Marketing',
    departmentId: 'dept-mkt',
  };

  const member: RequestUser = {
    id: 'user-member',
    email: 't@x.com',
    roleName: 'HR Team Member',
    departmentName: 'HR',
    departmentId: 'dept-hr',
  };

  const admin: RequestUser = {
    id: 'user-admin',
    email: 'admin@x.com',
    roleName: 'Admin',
    departmentName: null,
    departmentId: null,
  };

  const requestCtx: RequestAccessContext = {
    id: 'req-1',
    createdByUserId: requester.id,
    targetDepartmentId: 'dept-hr',
    memberUserIds: [member.id],
  };

  const assignmentCtx: AssignmentAccessContext = {
    id: 'asg-1',
    departmentId: 'dept-hr',
    requestCreatedByUserId: requester.id,
    memberUserIds: [member.id],
  };

  describe('canViewRequest', () => {
    it('allows requester, target manager, member, and admin', () => {
      expect(service.canViewRequest(requester, requestCtx)).toBe(true);
      expect(service.canViewRequest(hrManager, requestCtx)).toBe(true);
      expect(service.canViewRequest(member, requestCtx)).toBe(true);
      expect(service.canViewRequest(admin, requestCtx)).toBe(true);
    });

    it('denies unrelated manager and employee', () => {
      expect(service.canViewRequest(marketingManager, requestCtx)).toBe(false);
      const outsider: RequestUser = {
        id: 'other',
        email: 'o@x.com',
        roleName: 'Employee',
        departmentName: 'Marketing',
        departmentId: 'dept-mkt',
      };
      expect(service.canViewRequest(outsider, requestCtx)).toBe(false);
    });
  });

  describe('canChangeRequestStatus', () => {
    it('allows requester-only statuses for requester', () => {
      expect(
        service.canChangeRequestStatus(requester, requestCtx, 'APPROVED'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(requester, requestCtx, 'REOPENED'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(hrManager, requestCtx, 'APPROVED'),
      ).toBe(false);
    });

    it('allows manager inbox statuses for target department manager', () => {
      expect(
        service.canChangeRequestStatus(hrManager, requestCtx, 'ACCEPTED'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(hrManager, requestCtx, 'REJECTED'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(
          marketingManager,
          requestCtx,
          'ACCEPTED',
        ),
      ).toBe(false);
    });

    it('allows work statuses for members and target manager', () => {
      expect(
        service.canChangeRequestStatus(member, requestCtx, 'IN_PROGRESS'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(hrManager, requestCtx, 'COMPLETED'),
      ).toBe(true);
      expect(
        service.canChangeRequestStatus(
          marketingManager,
          requestCtx,
          'COMPLETED',
        ),
      ).toBe(false);
    });
  });

  describe('canRequestMissingInformation', () => {
    it('allows target manager and admin only', () => {
      expect(service.canRequestMissingInformation(hrManager, requestCtx)).toBe(
        true,
      );
      expect(service.canRequestMissingInformation(admin, requestCtx)).toBe(
        true,
      );
      expect(service.canRequestMissingInformation(requester, requestCtx)).toBe(
        false,
      );
      expect(
        service.canRequestMissingInformation(marketingManager, requestCtx),
      ).toBe(false);
    });
  });

  describe('assignment access', () => {
    it('allows view for member, manager, requester, admin', () => {
      expect(service.canViewAssignment(member, assignmentCtx)).toBe(true);
      expect(service.canViewAssignment(hrManager, assignmentCtx)).toBe(true);
      expect(service.canViewAssignment(requester, assignmentCtx)).toBe(true);
      expect(service.canViewAssignment(admin, assignmentCtx)).toBe(true);
    });

    it('denies view for unrelated manager', () => {
      expect(service.canViewAssignment(marketingManager, assignmentCtx)).toBe(
        false,
      );
    });

    it('allows mutate for member and manager but not requester', () => {
      expect(service.canMutateAssignment(member, assignmentCtx)).toBe(true);
      expect(service.canMutateAssignment(hrManager, assignmentCtx)).toBe(true);
      expect(service.canMutateAssignment(requester, assignmentCtx)).toBe(false);
      expect(service.canMutateAssignment(marketingManager, assignmentCtx)).toBe(
        false,
      );
    });
  });
});

import { RequestStatus } from '@prisma/client';

export const TERMINAL_REQUEST_STATUSES: RequestStatus[] = [
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];

export function departmentListInclude() {
  return {
    manager: {
      select: { id: true, fullName: true, email: true, jobTitle: true },
    },
    _count: { select: { templates: true, users: true } },
  } as const;
}

export type DepartmentListRow = {
  id: string;
  name: string;
  description: string | null;
  externalDepartmentCode: string | null;
  isActive: boolean;
  manager: {
    id: string;
    fullName: string;
    email: string;
    jobTitle: string | null;
  } | null;
  _count: { templates: number; users: number };
};

export function mapDepartmentRow(
  d: DepartmentListRow,
  activeRequestCount: number,
) {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    externalDepartmentCode: d.externalDepartmentCode,
    isActive: d.isActive,
    manager: d.manager
      ? {
          id: d.manager.id,
          fullName: d.manager.fullName,
          email: d.manager.email,
          jobTitle: d.manager.jobTitle,
        }
      : null,
    templateCount: d._count.templates,
    userCount: d._count.users,
    activeRequestCount,
  };
}

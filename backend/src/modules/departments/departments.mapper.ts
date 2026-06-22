import { RequestStatus } from '@prisma/client';

export const TERMINAL_REQUEST_STATUSES: RequestStatus[] = [
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];

const managerSelect = {
  select: { id: true, fullName: true, email: true, jobTitle: true },
} as const;

const countSelect = { select: { templates: true, users: true } } as const;

export function departmentListInclude() {
  return {
    manager: managerSelect,
    parent: { select: { id: true, name: true } },
    sections: {
      orderBy: { name: 'asc' },
      include: { manager: managerSelect, _count: countSelect },
    },
    _count: countSelect,
  } as const;
}

type ManagerRow = {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
} | null;

type SectionRow = {
  id: string;
  name: string;
  description: string | null;
  externalDepartmentCode: string | null;
  parentDepartmentId: string | null;
  isActive: boolean;
  manager: ManagerRow;
  _count: { templates: number; users: number };
};

export type DepartmentListRow = {
  id: string;
  name: string;
  description: string | null;
  externalDepartmentCode: string | null;
  parentDepartmentId: string | null;
  isActive: boolean;
  manager: ManagerRow;
  parent: { id: string; name: string } | null;
  sections?: SectionRow[];
  _count: { templates: number; users: number };
};

function mapManager(m: ManagerRow) {
  return m
    ? { id: m.id, fullName: m.fullName, email: m.email, jobTitle: m.jobTitle }
    : null;
}

function mapSection(s: SectionRow, activeCounts: Map<string, number>) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    externalDepartmentCode: s.externalDepartmentCode,
    parentDepartmentId: s.parentDepartmentId,
    isActive: s.isActive,
    manager: mapManager(s.manager),
    templateCount: s._count.templates,
    userCount: s._count.users,
    activeRequestCount: activeCounts.get(s.id) ?? 0,
  };
}

export function mapDepartmentRow(
  d: DepartmentListRow,
  activeCounts: Map<string, number>,
) {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    externalDepartmentCode: d.externalDepartmentCode,
    parentDepartmentId: d.parentDepartmentId,
    parentName: d.parent?.name ?? null,
    isActive: d.isActive,
    manager: mapManager(d.manager),
    templateCount: d._count.templates,
    userCount: d._count.users,
    activeRequestCount: activeCounts.get(d.id) ?? 0,
    sections: (d.sections ?? []).map((s) => mapSection(s, activeCounts)),
  };
}

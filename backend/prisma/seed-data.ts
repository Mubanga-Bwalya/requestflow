/**
 * Fixed UUIDs for demo seed (hex only). Must match e2e seed-constants where overlapping.
 *
 * Live databases may differ after manual edits (e.g. Jane removed; Ivan uses mbwalya4477@gmail.com).
 * Re-running seed is idempotent for passwords but does not delete users removed outside seed.
 */

export const DEMO_PASSWORD = 'requestflow';

export const DEPT = {
  hr: 'd1111111-1111-4111-8111-111111110001',
  marketing: 'd1111111-1111-4111-8111-111111110002',
  billing: 'd1111111-1111-4111-8111-111111110003',
  innovations: 'd1111111-1111-4111-8111-111111110004',
} as const;

export const ROLE = {
  admin: 'b1111111-1111-4111-8111-111111110001',
  employee: 'b1111111-1111-4111-8111-111111110002',
  hrManager: 'b1111111-1111-4111-8111-111111110003',
  marketingManager: 'b1111111-1111-4111-8111-111111110004',
  hrTeam: 'b1111111-1111-4111-8111-111111110005',
  marketingTeam: 'b1111111-1111-4111-8111-111111110006',
  manager: 'b1111111-1111-4111-8111-111111110007',
  billingManager: 'b1111111-1111-4111-8111-111111110008',
  billingTeam: 'b1111111-1111-4111-8111-111111110009',
  innovationsManager: 'b1111111-1111-4111-8111-111111110010',
  innovationsTeam: 'b1111111-1111-4111-8111-111111110011',
} as const;

export type DemoUserSeed = {
  id: string;
  fullName: string;
  email: string;
  departmentName: keyof typeof DEPT_NAME;
  roleName: string;
  jobTitle: string;
};

export const DEPT_NAME = {
  hr: 'HR',
  marketing: 'Marketing',
  billing: 'Billing',
  innovations: 'Innovations',
} as const;

export const ADMIN_EMAIL = 'admin@requestflow.local';

/** Innovations manager — Gmail used for Resend/email testing in current demo DB. */
export const IVAN_EMAIL = 'mbwalya4477@gmail.com';

export const DEPARTMENTS = [
  {
    id: DEPT.hr,
    name: DEPT_NAME.hr,
    description: 'Human Resources department',
    externalDepartmentCode: 'DEPT-HR',
    managerEmail: 'henry@requestflow.local',
  },
  {
    id: DEPT.marketing,
    name: DEPT_NAME.marketing,
    description: 'Marketing and communications department',
    externalDepartmentCode: 'DEPT-MKT',
    managerEmail: 'mary@requestflow.local',
  },
  {
    id: DEPT.billing,
    name: DEPT_NAME.billing,
    description: 'Billing and payment support',
    externalDepartmentCode: 'DEPT-BIL',
    managerEmail: 'ben@requestflow.local',
  },
  {
    id: DEPT.innovations,
    name: DEPT_NAME.innovations,
    description: 'Software, systems, and digital support',
    externalDepartmentCode: 'DEPT-INN',
    managerEmail: IVAN_EMAIL,
  },
] as const;

export const ROLES = [
  { id: ROLE.admin, name: 'Admin', description: 'Full system configuration access' },
  { id: ROLE.employee, name: 'Employee', description: 'Create requests and view own progress' },
  { id: ROLE.manager, name: 'Manager', description: 'Review and assign requests for their department' },
  { id: ROLE.hrManager, name: 'HR Manager', description: 'Review and assign HR requests' },
  { id: ROLE.marketingManager, name: 'Marketing Manager', description: 'Review and assign Marketing requests' },
  { id: ROLE.hrTeam, name: 'HR Team Member', description: 'Execute HR assignments and milestones' },
  { id: ROLE.marketingTeam, name: 'Marketing Team Member', description: 'Execute Marketing assignments and milestones' },
  { id: ROLE.billingManager, name: 'Billing Manager', description: 'Review and assign Billing requests' },
  { id: ROLE.billingTeam, name: 'Billing Team Member', description: 'Execute Billing assignments and milestones' },
  { id: ROLE.innovationsManager, name: 'Innovations Manager', description: 'Review and assign Innovations requests' },
  { id: ROLE.innovationsTeam, name: 'Innovations Team Member', description: 'Execute Innovations assignments and milestones' },
] as const;

export const DEMO_USERS: DemoUserSeed[] = [
  {
    id: 'c1111111-1111-4111-8111-111111110001',
    fullName: 'System Admin',
    email: ADMIN_EMAIL,
    departmentName: 'hr',
    roleName: 'Admin',
    jobTitle: 'System Administrator',
  },
  { id: 'c1111111-1111-4111-8111-111111110003', fullName: 'Henry', email: 'henry@requestflow.local', departmentName: 'hr', roleName: 'HR Manager', jobTitle: 'HR Manager' },
  { id: 'c1111111-1111-4111-8111-111111110005', fullName: 'Helen', email: 'helen@requestflow.local', departmentName: 'hr', roleName: 'HR Team Member', jobTitle: 'HR Officer' },
  { id: 'c1111111-1111-4111-8111-111111110008', fullName: 'Hannah', email: 'hannah@requestflow.local', departmentName: 'hr', roleName: 'HR Team Member', jobTitle: 'HR Officer' },
  { id: 'c1111111-1111-4111-8111-111111110009', fullName: 'Hugo', email: 'hugo@requestflow.local', departmentName: 'hr', roleName: 'HR Team Member', jobTitle: 'HR Officer' },
  { id: 'c1111111-1111-4111-8111-111111110004', fullName: 'Mary', email: 'mary@requestflow.local', departmentName: 'marketing', roleName: 'Marketing Manager', jobTitle: 'Marketing Manager' },
  { id: 'c1111111-1111-4111-8111-111111110006', fullName: 'Mark', email: 'mark@requestflow.local', departmentName: 'marketing', roleName: 'Marketing Team Member', jobTitle: 'Marketing Designer' },
  { id: 'c1111111-1111-4111-8111-111111110007', fullName: 'Musa', email: 'musa@requestflow.local', departmentName: 'marketing', roleName: 'Marketing Team Member', jobTitle: 'Marketing Assistant' },
  { id: 'c1111111-1111-4111-8111-111111110010', fullName: 'Mia', email: 'mia@requestflow.local', departmentName: 'marketing', roleName: 'Marketing Team Member', jobTitle: 'Marketing Assistant' },
  { id: 'c1111111-1111-4111-8111-111111110011', fullName: 'Ben', email: 'ben@requestflow.local', departmentName: 'billing', roleName: 'Billing Manager', jobTitle: 'Billing Manager' },
  { id: 'c1111111-1111-4111-8111-111111110012', fullName: 'Beth', email: 'beth@requestflow.local', departmentName: 'billing', roleName: 'Billing Team Member', jobTitle: 'Billing Officer' },
  { id: 'c1111111-1111-4111-8111-111111110013', fullName: 'Blake', email: 'blake@requestflow.local', departmentName: 'billing', roleName: 'Billing Team Member', jobTitle: 'Billing Officer' },
  { id: 'c1111111-1111-4111-8111-111111110014', fullName: 'Brooke', email: 'brooke@requestflow.local', departmentName: 'billing', roleName: 'Billing Team Member', jobTitle: 'Billing Officer' },
  { id: 'c1111111-1111-4111-8111-111111110015', fullName: 'Ivan', email: IVAN_EMAIL, departmentName: 'innovations', roleName: 'Innovations Manager', jobTitle: 'Innovations Manager' },
  { id: 'c1111111-1111-4111-8111-111111110016', fullName: 'Iris', email: 'iris@requestflow.local', departmentName: 'innovations', roleName: 'Innovations Team Member', jobTitle: 'Innovations Analyst' },
  { id: 'c1111111-1111-4111-8111-111111110017', fullName: 'Isaac', email: 'isaac@requestflow.local', departmentName: 'innovations', roleName: 'Innovations Team Member', jobTitle: 'Innovations Analyst' },
  { id: 'c1111111-1111-4111-8111-111111110018', fullName: 'Imani', email: 'imani@requestflow.local', departmentName: 'innovations', roleName: 'Innovations Team Member', jobTitle: 'Innovations Analyst' },
];

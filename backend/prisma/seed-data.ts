/**
 * Fixed UUIDs for demo seed (hex only). Must match e2e seed-constants where overlapping.
 *
 * Live databases may differ after manual edits (e.g. Jane removed; Ivan uses mbwalya4477@gmail.com).
 * Re-running seed is idempotent but does not delete users removed outside seed.
 */

// Canonical Zamtel departments. The first four reuse the historical demo UUIDs
// so re-seeding an existing dev database stays idempotent (upsert is by id); the
// demo team users (HR/Marketing/Finance/IT groups) live in these four.
export const DEPT = {
  humanResource: 'd1111111-1111-4111-8111-111111110001',
  marketing: 'd1111111-1111-4111-8111-111111110002',
  finance: 'd1111111-1111-4111-8111-111111110003',
  informationTechnology: 'd1111111-1111-4111-8111-111111110004',
  ceoOffice: 'd1111111-1111-4111-8111-111111110005',
  internalAudit: 'd1111111-1111-4111-8111-111111110006',
  riskCompliance: 'd1111111-1111-4111-8111-111111110007',
  technical: 'd1111111-1111-4111-8111-111111110008',
  sharedServices: 'd1111111-1111-4111-8111-111111110009',
  supplyChain: 'd1111111-1111-4111-8111-111111110010',
  legal: 'd1111111-1111-4111-8111-111111110011',
  salesDistribution: 'd1111111-1111-4111-8111-111111110012',
  zamtelMoney: 'd1111111-1111-4111-8111-111111110013',
  zamtelBusiness: 'd1111111-1111-4111-8111-111111110014',
  hrbp: 'd1111111-1111-4111-8111-111111110015',
  // Large real AD departments kept alongside the operating set.
  commercial: 'd1111111-1111-4111-8111-111111110016',
  customerServices: 'd1111111-1111-4111-8111-111111110017',
  customerExperiencePr: 'd1111111-1111-4111-8111-111111110018',
  productsDataAnalytics: 'd1111111-1111-4111-8111-111111110019',
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
  humanResource: 'Human Resource',
  marketing: 'Marketing',
  finance: 'Finance',
  informationTechnology: 'Information Technology',
  ceoOffice: "CEO's Office",
  internalAudit: 'Internal Audit',
  riskCompliance: 'Risk and Compliance',
  technical: 'Technical',
  sharedServices: 'Shared Services',
  supplyChain: 'Supply Chain',
  legal: 'Legal',
  salesDistribution: 'Sales and Distribution',
  zamtelMoney: 'Zamtel Money',
  zamtelBusiness: 'Zamtel Business',
  hrbp: 'HRBP',
  commercial: 'Commercial',
  customerServices: 'Customer Services',
  customerExperiencePr: 'Customer Experience and Public Relations',
  productsDataAnalytics: 'Products and Data Analytics',
} as const;

export const ADMIN_EMAIL = 'admin@requestflow.local';

/** Innovations manager — Gmail used for SMTP/email testing in current demo DB. */
export const IVAN_EMAIL = 'mbwalya4477@gmail.com';

export type DepartmentSeed = {
  id: string;
  name: string;
  description: string;
  externalDepartmentCode: string;
  /** Optional demo manager (dev fixtures). Real managers are assigned via the admin portal / LDAP. */
  managerEmail?: string;
};

export const DEPARTMENTS: readonly DepartmentSeed[] = [
  {
    id: DEPT.ceoOffice,
    name: DEPT_NAME.ceoOffice,
    description: "Office of the Chief Executive Officer",
    externalDepartmentCode: 'DEPT-CEO',
  },
  {
    id: DEPT.internalAudit,
    name: DEPT_NAME.internalAudit,
    description: 'Internal audit and assurance',
    externalDepartmentCode: 'DEPT-AUD',
  },
  {
    id: DEPT.marketing,
    name: DEPT_NAME.marketing,
    description: 'Marketing and communications',
    externalDepartmentCode: 'DEPT-MKT',
    managerEmail: 'mary@requestflow.local',
  },
  {
    id: DEPT.humanResource,
    name: DEPT_NAME.humanResource,
    description: 'Human Resources',
    externalDepartmentCode: 'DEPT-HR',
    managerEmail: 'henry@requestflow.local',
  },
  {
    id: DEPT.riskCompliance,
    name: DEPT_NAME.riskCompliance,
    description: 'Risk management and regulatory compliance',
    externalDepartmentCode: 'DEPT-RSK',
  },
  {
    id: DEPT.informationTechnology,
    name: DEPT_NAME.informationTechnology,
    description: 'Information technology, systems, and digital support',
    externalDepartmentCode: 'DEPT-IT',
    managerEmail: IVAN_EMAIL,
  },
  {
    id: DEPT.technical,
    name: DEPT_NAME.technical,
    description: 'Network and technical operations',
    externalDepartmentCode: 'DEPT-TEC',
  },
  {
    id: DEPT.sharedServices,
    name: DEPT_NAME.sharedServices,
    description: 'Shared corporate services',
    externalDepartmentCode: 'DEPT-SHS',
  },
  {
    id: DEPT.supplyChain,
    name: DEPT_NAME.supplyChain,
    description: 'Procurement and supply chain',
    externalDepartmentCode: 'DEPT-SCM',
  },
  {
    id: DEPT.finance,
    name: DEPT_NAME.finance,
    description: 'Finance, billing, and payments',
    externalDepartmentCode: 'DEPT-FIN',
    managerEmail: 'ben@requestflow.local',
  },
  {
    id: DEPT.legal,
    name: DEPT_NAME.legal,
    description: 'Legal and company secretarial',
    externalDepartmentCode: 'DEPT-LEG',
  },
  {
    id: DEPT.salesDistribution,
    name: DEPT_NAME.salesDistribution,
    description: 'Sales and distribution',
    externalDepartmentCode: 'DEPT-SAL',
  },
  {
    id: DEPT.zamtelMoney,
    name: DEPT_NAME.zamtelMoney,
    description: 'Zamtel Money mobile financial services',
    externalDepartmentCode: 'DEPT-ZMN',
  },
  {
    id: DEPT.zamtelBusiness,
    name: DEPT_NAME.zamtelBusiness,
    description: 'Enterprise and business solutions',
    externalDepartmentCode: 'DEPT-ZBU',
  },
  {
    id: DEPT.hrbp,
    name: DEPT_NAME.hrbp,
    description: 'HR Business Partners',
    externalDepartmentCode: 'DEPT-HRB',
  },
  {
    id: DEPT.commercial,
    name: DEPT_NAME.commercial,
    description: 'Commercial',
    externalDepartmentCode: 'DEPT-COM',
  },
  {
    id: DEPT.customerServices,
    name: DEPT_NAME.customerServices,
    description: 'Customer Services',
    externalDepartmentCode: 'DEPT-CS',
  },
  {
    id: DEPT.customerExperiencePr,
    name: DEPT_NAME.customerExperiencePr,
    description: 'Customer Experience and Public Relations',
    externalDepartmentCode: 'DEPT-CXP',
  },
  {
    id: DEPT.productsDataAnalytics,
    name: DEPT_NAME.productsDataAnalytics,
    description: 'Products and Data Analytics',
    externalDepartmentCode: 'DEPT-PDA',
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
    departmentName: 'humanResource',
    roleName: 'Admin',
    jobTitle: 'System Administrator',
  },
  { id: 'c1111111-1111-4111-8111-111111110003', fullName: 'Henry', email: 'henry@requestflow.local', departmentName: 'humanResource', roleName: 'HR Manager', jobTitle: 'HR Manager' },
  { id: 'c1111111-1111-4111-8111-111111110005', fullName: 'Helen', email: 'helen@requestflow.local', departmentName: 'humanResource', roleName: 'HR Team Member', jobTitle: 'HR Officer' },
  { id: 'c1111111-1111-4111-8111-111111110008', fullName: 'Hannah', email: 'hannah@requestflow.local', departmentName: 'humanResource', roleName: 'HR Team Member', jobTitle: 'HR Officer' },
  { id: 'c1111111-1111-4111-8111-111111110009', fullName: 'Hugo', email: 'hugo@requestflow.local', departmentName: 'humanResource', roleName: 'HR Team Member', jobTitle: 'HR Officer' },
  { id: 'c1111111-1111-4111-8111-111111110004', fullName: 'Mary', email: 'mary@requestflow.local', departmentName: 'marketing', roleName: 'Marketing Manager', jobTitle: 'Marketing Manager' },
  { id: 'c1111111-1111-4111-8111-111111110006', fullName: 'Mark', email: 'mark@requestflow.local', departmentName: 'marketing', roleName: 'Marketing Team Member', jobTitle: 'Marketing Designer' },
  { id: 'c1111111-1111-4111-8111-111111110007', fullName: 'Musa', email: 'musa@requestflow.local', departmentName: 'marketing', roleName: 'Marketing Team Member', jobTitle: 'Marketing Assistant' },
  { id: 'c1111111-1111-4111-8111-111111110010', fullName: 'Mia', email: 'mia@requestflow.local', departmentName: 'marketing', roleName: 'Marketing Team Member', jobTitle: 'Marketing Assistant' },
  { id: 'c1111111-1111-4111-8111-111111110011', fullName: 'Ben', email: 'ben@requestflow.local', departmentName: 'finance', roleName: 'Billing Manager', jobTitle: 'Finance Manager' },
  { id: 'c1111111-1111-4111-8111-111111110012', fullName: 'Beth', email: 'beth@requestflow.local', departmentName: 'finance', roleName: 'Billing Team Member', jobTitle: 'Finance Officer' },
  { id: 'c1111111-1111-4111-8111-111111110013', fullName: 'Blake', email: 'blake@requestflow.local', departmentName: 'finance', roleName: 'Billing Team Member', jobTitle: 'Finance Officer' },
  { id: 'c1111111-1111-4111-8111-111111110014', fullName: 'Brooke', email: 'brooke@requestflow.local', departmentName: 'finance', roleName: 'Billing Team Member', jobTitle: 'Finance Officer' },
  { id: 'c1111111-1111-4111-8111-111111110015', fullName: 'Ivan', email: IVAN_EMAIL, departmentName: 'informationTechnology', roleName: 'Innovations Manager', jobTitle: 'IT Manager' },
  { id: 'c1111111-1111-4111-8111-111111110016', fullName: 'Iris', email: 'iris@requestflow.local', departmentName: 'informationTechnology', roleName: 'Innovations Team Member', jobTitle: 'IT Analyst' },
  { id: 'c1111111-1111-4111-8111-111111110017', fullName: 'Isaac', email: 'isaac@requestflow.local', departmentName: 'informationTechnology', roleName: 'Innovations Team Member', jobTitle: 'IT Analyst' },
  { id: 'c1111111-1111-4111-8111-111111110018', fullName: 'Imani', email: 'imani@requestflow.local', departmentName: 'informationTechnology', roleName: 'Innovations Team Member', jobTitle: 'IT Analyst' },
];

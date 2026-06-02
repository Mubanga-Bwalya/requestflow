import type { Department } from "@/types/department";
import type { Role } from "@/types/role";
import type { RequestTemplate } from "@/types/template";
import type { User } from "@/types/user";
import type { ReportSummary } from "@/types/report";

export const adminDashboardSummary = [
  { label: "Total Users", value: "148" },
  { label: "Departments", value: "2" },
  { label: "Active Requests", value: "39" },
  { label: "Completed Requests", value: "214" },
  { label: "Overdue Requests", value: "7" },
  { label: "Templates Configured", value: "12" },
];

export const users: User[] = [
  { id: "u1", name: "Martha N.", email: "martha@requestflow.local", department: "HR", role: "HR Manager", status: "Active" },
  { id: "u2", name: "Bwalya M.", email: "bwalya@requestflow.local", department: "Marketing", role: "Marketing Team Member", status: "Active" },
];

export const departments: Department[] = [
  { id: "d1", name: "HR", manager: "Martha N.", teamMembers: 21, activeRequests: 13, status: "Active" },
  { id: "d2", name: "Marketing", manager: "Edward K.", teamMembers: 18, activeRequests: 26, status: "Active" },
];

export const roles: Role[] = [
  { id: "r1", name: "Admin", permissionSummary: "Full system configuration access" },
  { id: "r2", name: "Employee", permissionSummary: "Create requests and view own progress" },
  { id: "r3", name: "HR Manager", permissionSummary: "Review and assign HR requests" },
  { id: "r4", name: "Marketing Manager", permissionSummary: "Review and assign Marketing requests" },
  { id: "r5", name: "HR Team Member", permissionSummary: "Execute HR assignments and milestones" },
  { id: "r6", name: "Marketing Team Member", permissionSummary: "Execute Marketing assignments and milestones" },
];

export const templates: RequestTemplate[] = [
  { id: "t1", name: "Graphic Design Request", department: "MARKETING", fieldCount: 8, isActive: true },
  { id: "t7", name: "Recruitment Request", department: "HR", fieldCount: 9, isActive: true },
];

export const templateDetails: RequestTemplate = {
  id: "t1",
  name: "Graphic Design Request",
  department: "MARKETING",
  fieldCount: 8,
  isActive: true,
  fields: [
    { id: "f1", label: "Request Title", fieldType: "TEXT", required: true, displayOrder: 1 },
    { id: "f2", label: "Description", fieldType: "LONG_TEXT", required: true, displayOrder: 2 },
  ],
};

export const reportSummary: ReportSummary[] = [
  { label: "Requests by Department", value: "HR 42% | Marketing 58%" },
  { label: "Requests by Status", value: "In Progress 39 | Needs Info 8" },
  { label: "Average Progress", value: "63%" },
  { label: "Completed This Month", value: "24" },
  { label: "Overdue Requests", value: "7" },
];

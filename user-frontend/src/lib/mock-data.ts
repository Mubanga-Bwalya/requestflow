import type { Assignment } from "@/types/task";
import type { RequestItem } from "@/types/request";

export const seedNotifications = [
  {
    id: "n1",
    title: "Information required",
    message: "RF-1038 needs your input before work can continue.",
    read: false,
    createdAt: "5h ago",
    href: "/requests/r2",
  },
  {
    id: "n2",
    title: "Request update",
    message: "RF-1042 progress updated to 62%.",
    read: false,
    createdAt: "2h ago",
    href: "/requests/r1",
  },
  {
    id: "n3",
    title: "Assignment reminder",
    message: "Poster production milestone due soon.",
    read: true,
    createdAt: "1d ago",
    href: "/tasks/a1",
  },
];

export const dashboardSummary = [
  { label: "My Requests", value: 14 },
  { label: "My Assigned Work", value: 8 },
  { label: "Needs My Information", value: 2 },
  { label: "Completed Requests", value: 26 },
];

export const recentUpdates = [
  { requestNumber: "RF-1042", title: "Recruitment Support - Intern Cohort", status: "IN_PROGRESS", updated: "2h ago" },
  { requestNumber: "RF-1038", title: "Poster for Customer Engagement Week", status: "NEEDS_INFORMATION", updated: "5h ago" },
  { requestNumber: "RF-1030", title: "Training Request: Compliance", status: "COMPLETED", updated: "1d ago" },
];

export const requests: RequestItem[] = [
  { id: "r1", requestNumber: "RF-1042", title: "Recruitment Support - Intern Cohort", department: "HR", requestType: "Recruitment Request", status: "IN_PROGRESS", progress: 62, deadline: "2026-06-14", actionNeeded: "None" },
  { id: "r2", requestNumber: "RF-1038", title: "Poster for Customer Engagement Week", department: "Marketing", requestType: "Graphic Design Request", status: "NEEDS_INFORMATION", progress: 35, deadline: "2026-06-08", actionNeeded: "Provide event dimensions" },
  { id: "r3", requestNumber: "RF-1030", title: "Compliance Training Materials", department: "HR", requestType: "Training Request", status: "COMPLETED", progress: 100, deadline: "2026-05-30", actionNeeded: "Approve or reopen" },
];

export const assignments: Assignment[] = [
  { id: "a1", title: "Poster Production - Customer Engagement Week", relatedRequest: "RF-1038", department: "Marketing", status: "IN_PROGRESS", progress: 40, deadline: "2026-06-08", milestones: [
    { id: "m1", title: "Research", owner: "Bwalya M.", status: "COMPLETED", progress: 100 },
    { id: "m2", title: "Colour palette", owner: "Martha N.", status: "IN_PROGRESS", progress: 60 },
    { id: "m3", title: "Poster design", owner: "Bwalya M.", status: "TODO", progress: 0 }
  ], members: [{ id: "u1", name: "Bwalya M." }, { id: "u2", name: "Martha N." }, { id: "u3", name: "Edward K." }] },
];

export const departmentInbox = [
  { requestNumber: "RF-1042", title: "Recruitment Support - Intern Cohort", requestedBy: "John K.", sourceDepartment: "Operations", requestType: "Recruitment Request", priority: "HIGH", deadline: "2026-06-14", status: "IN_PROGRESS", assignedMembers: "Martha N." },
  { requestNumber: "RF-1038", title: "Poster for Customer Engagement Week", requestedBy: "Tina B.", sourceDepartment: "Customer Care", requestType: "Graphic Design Request", priority: "MEDIUM", deadline: "2026-06-08", status: "NEEDS_INFORMATION", assignedMembers: "Bwalya M., Edward K." },
];

export const requestDetail = {
  requestNumber: "RF-1038",
  title: "Poster for Customer Engagement Week",
  department: "Marketing",
  type: "Graphic Design Request",
  status: "NEEDS_INFORMATION",
  progress: 35,
  deadline: "2026-06-08",
  currentStage: "Awaiting requester clarification",
  submittedInfo: { priority: "MEDIUM" },
  missingInformation: ["Poster dimensions", "Confirmed event slogan"],
  milestoneSummary: [
    { title: "Research", progress: 100 },
    { title: "Colour palette", progress: 60 },
    { title: "Poster design", progress: 0 },
  ],
  activity: [
    "Request submitted by Tina B.",
    "Manager reviewed and accepted request",
    "Assigned to Bwalya M. and Edward K.",
    "Manager requested missing information",
  ],
};

export type Department = "HR" | "Marketing";

export type RequestFieldType = "TEXT" | "LONG_TEXT" | "DATE" | "DROPDOWN" | "FILE";

export type RequestFieldDef = {
  key: string;
  label: string;
  type: RequestFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type RequestTypeDef = {
  id: string;
  name: string;
  department: Department;
  fields: RequestFieldDef[];
};

export const requestTypes: RequestTypeDef[] = [
  {
    id: "mkt-graphic-design",
    name: "Graphic Design Request",
    department: "Marketing",
    fields: [
      { key: "title", label: "Request title", type: "TEXT", required: true, placeholder: "e.g. Poster for Customer Engagement Week" },
      { key: "description", label: "Description / purpose", type: "LONG_TEXT", required: true, placeholder: "What do you need and what is the expected output?" },
      { key: "dimensions", label: "Required dimensions", type: "TEXT", required: true, placeholder: "e.g. A3 / 1080x1080" },
      { key: "assets", label: "Attachments (placeholder)", type: "FILE" },
    ],
  },
  {
    id: "mkt-social-post",
    name: "Social Media Post Request",
    department: "Marketing",
    fields: [
      { key: "title", label: "Request title", type: "TEXT", required: true, placeholder: "e.g. Facebook post for product launch" },
      { key: "description", label: "Copy / message", type: "LONG_TEXT", required: true, placeholder: "Provide the message to communicate" },
      { key: "channel", label: "Channel", type: "DROPDOWN", required: true, options: ["Facebook", "X (Twitter)", "Instagram", "LinkedIn"] },
      { key: "assets", label: "Attachments (placeholder)", type: "FILE" },
    ],
  },
  {
    id: "hr-recruitment",
    name: "Recruitment Request",
    department: "HR",
    fields: [
      { key: "title", label: "Request title", type: "TEXT", required: true, placeholder: "e.g. Hire 2 customer care agents" },
      { key: "description", label: "Role summary", type: "LONG_TEXT", required: true, placeholder: "Describe the role and key requirements" },
      { key: "headcount", label: "Headcount", type: "DROPDOWN", required: true, options: ["1", "2", "3", "4", "5+"] },
      { key: "assets", label: "Attachments (placeholder)", type: "FILE" },
    ],
  },
  {
    id: "hr-training",
    name: "Training Request",
    department: "HR",
    fields: [
      { key: "title", label: "Request title", type: "TEXT", required: true, placeholder: "e.g. Compliance training materials" },
      { key: "description", label: "Training need", type: "LONG_TEXT", required: true, placeholder: "Describe the training need and target group" },
      { key: "preferredDate", label: "Preferred training date", type: "DATE", required: true },
      { key: "assets", label: "Attachments (placeholder)", type: "FILE" },
    ],
  },
];

export function getRequestTypesForDepartment(department: Department) {
  return requestTypes.filter((t) => t.department === department);
}


/** Department display name from API (e.g. HR, Marketing, Finance). */
export type Department = string;

export type RequestFieldType =
  | "TEXT"
  | "LONG_TEXT"
  | "DATE"
  | "DROPDOWN"
  | "MULTI_SELECT"
  | "FILE"
  | "NUMBER"
  | "CHECKBOX"
  | "EMAIL";

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

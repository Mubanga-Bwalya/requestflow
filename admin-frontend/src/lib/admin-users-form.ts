import {
  isValidEmail,
  normalizeEmail,
  USER_NAME_MAX,
} from "@/lib/admin-form-utils";

export type UserFormState = {
  name: string;
  email: string;
  jobTitle: string;
  externalEmployeeId: string;
  department: string;
  /** Selected sub-section id under `department`, or "" for department-level. */
  sectionId: string;
  role: string;
  status: "Active" | "Inactive";
  gn: string;
};

export function emptyUserForm(defaultDept: string): UserFormState {
  return {
    name: "",
    email: "",
    jobTitle: "",
    externalEmployeeId: "",
    department: defaultDept,
    sectionId: "",
    role: "",
    status: "Active",
    gn: "",
  };
}

export function validateUserForm(form: UserFormState) {
  const errors: Partial<Record<keyof UserFormState, string>> = {};
  const name = form.name.trim();
  const email = normalizeEmail(form.email);

  if (!name) errors.name = "Full name is required.";
  else if (name.length > USER_NAME_MAX) {
    errors.name = `Name must be ${USER_NAME_MAX} characters or fewer.`;
  }

  if (!email) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  if (!form.department) errors.department = "Select a department.";
  if (!form.role) errors.role = "Select a role.";

  return errors;
}

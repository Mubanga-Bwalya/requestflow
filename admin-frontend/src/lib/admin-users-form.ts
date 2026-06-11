import {
  isValidEmail,
  normalizeEmail,
  USER_NAME_MAX,
  validateUserPassword,
} from "@/lib/admin-form-utils";

export type UserFormState = {
  name: string;
  email: string;
  jobTitle: string;
  externalEmployeeId: string;
  department: string;
  role: string;
  status: "Active" | "Inactive";
  password: string;
};

export function emptyUserForm(defaultDept: string): UserFormState {
  return {
    name: "",
    email: "",
    jobTitle: "",
    externalEmployeeId: "",
    department: defaultDept,
    role: "",
    status: "Active",
    password: "",
  };
}

export function validateUserForm(form: UserFormState, editing: boolean) {
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

  if (!editing) {
    const passwordError = validateUserPassword(form.password);
    if (passwordError) errors.password = passwordError;
  }

  return errors;
}

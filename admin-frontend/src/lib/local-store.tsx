"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import {
  adminDashboardSummary,
  departments as seedDepartments,
  roles as seedRoles,
  templateDetails as seedTemplateDetails,
  templates as seedTemplates,
  users as seedUsers,
} from "@/lib/mock-data";
import type { Department } from "@/types/department";
import type { Role } from "@/types/role";
import type { RequestTemplate, TemplateField } from "@/types/template";
import type { User } from "@/types/user";

type State = {
  auth: { isLoggedIn: boolean; email?: string };
  users: User[];
  departments: Department[];
  roles: Role[];
  templates: RequestTemplate[];
  templateDetailsById: Record<string, RequestTemplate>;
  settings: {
    systemName: string;
    defaultPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    allowUploads: boolean;
    notifyOnStatusChange: boolean;
  };
  dashboard: typeof adminDashboardSummary;
};

type Action =
  | { type: "LOGIN"; payload: { email: string } }
  | { type: "LOGOUT" }
  | { type: "USER_ADD"; payload: User }
  | { type: "USER_UPDATE"; payload: { id: string; patch: Partial<User> } }
  | { type: "DEPT_UPDATE"; payload: { id: string; patch: Partial<Department> } }
  | { type: "TEMPLATE_TOGGLE_ACTIVE"; payload: { id: string } }
  | { type: "TEMPLATE_FIELD_ADD"; payload: { templateId: string; field: TemplateField } }
  | { type: "TEMPLATE_FIELD_UPDATE"; payload: { templateId: string; fieldId: string; patch: Partial<TemplateField> } }
  | { type: "TEMPLATE_FIELD_DELETE"; payload: { templateId: string; fieldId: string } }
  | { type: "SETTINGS_UPDATE"; payload: Partial<State["settings"]> };

const initialState: State = {
  auth: { isLoggedIn: false },
  users: seedUsers,
  departments: seedDepartments,
  roles: seedRoles,
  templates: seedTemplates,
  templateDetailsById: {
    [seedTemplateDetails.id]: seedTemplateDetails,
    t7: {
      id: "t7",
      name: "Recruitment Request",
      department: "HR",
      fieldCount: 2,
      isActive: true,
      fields: [
        { id: "f1", label: "Request Title", fieldType: "TEXT", required: true, displayOrder: 1 },
        { id: "f2", label: "Role Summary", fieldType: "LONG_TEXT", required: true, displayOrder: 2 },
      ],
    },
  },
  settings: { systemName: "RequestFlow", defaultPriority: "MEDIUM", allowUploads: true, notifyOnStatusChange: true },
  dashboard: adminDashboardSummary,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOGIN":
      return { ...state, auth: { isLoggedIn: true, email: action.payload.email } };
    case "LOGOUT":
      return { ...state, auth: { isLoggedIn: false } };
    case "USER_ADD":
      return { ...state, users: [action.payload, ...state.users] };
    case "USER_UPDATE":
      return { ...state, users: state.users.map((u) => (u.id === action.payload.id ? { ...u, ...action.payload.patch } : u)) };
    case "DEPT_UPDATE":
      return { ...state, departments: state.departments.map((d) => (d.id === action.payload.id ? { ...d, ...action.payload.patch } : d)) };
    case "TEMPLATE_TOGGLE_ACTIVE": {
      const templates = state.templates.map((t) => (t.id === action.payload.id ? { ...t, isActive: !t.isActive } : t));
      const templateDetailsById = { ...state.templateDetailsById };
      const existing = templateDetailsById[action.payload.id];
      if (existing) templateDetailsById[action.payload.id] = { ...existing, isActive: !existing.isActive };
      return { ...state, templates, templateDetailsById };
    }
    case "TEMPLATE_FIELD_ADD": {
      const templateDetailsById = { ...state.templateDetailsById };
      const t = templateDetailsById[action.payload.templateId];
      if (!t) return state;
      const fields = [...(t.fields ?? []), action.payload.field].sort((a, b) => a.displayOrder - b.displayOrder);
      templateDetailsById[action.payload.templateId] = { ...t, fields, fieldCount: fields.length };
      return { ...state, templateDetailsById };
    }
    case "TEMPLATE_FIELD_UPDATE": {
      const templateDetailsById = { ...state.templateDetailsById };
      const t = templateDetailsById[action.payload.templateId];
      if (!t) return state;
      const fields = (t.fields ?? []).map((f) => (f.id === action.payload.fieldId ? { ...f, ...action.payload.patch } : f)).sort((a, b) => a.displayOrder - b.displayOrder);
      templateDetailsById[action.payload.templateId] = { ...t, fields, fieldCount: fields.length };
      return { ...state, templateDetailsById };
    }
    case "TEMPLATE_FIELD_DELETE": {
      const templateDetailsById = { ...state.templateDetailsById };
      const t = templateDetailsById[action.payload.templateId];
      if (!t) return state;
      const fields = (t.fields ?? []).filter((f) => f.id !== action.payload.fieldId);
      templateDetailsById[action.payload.templateId] = { ...t, fields, fieldCount: fields.length };
      return { ...state, templateDetailsById };
    }
    case "SETTINGS_UPDATE":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

type Store = {
  state: State;
  actions: {
    login: (email: string) => void;
    logout: () => void;
    addUser: (u: Omit<User, "id">) => void;
    updateUser: (id: string, patch: Partial<User>) => void;
    updateDepartment: (id: string, patch: Partial<Department>) => void;
    toggleTemplateActive: (id: string) => void;
    addTemplateField: (templateId: string, f: Omit<TemplateField, "id">) => void;
    updateTemplateField: (templateId: string, fieldId: string, patch: Partial<TemplateField>) => void;
    deleteTemplateField: (templateId: string, fieldId: string) => void;
    updateSettings: (patch: Partial<State["settings"]>) => void;
    ensureTemplateDetails: (id: string) => void;
  };
};

const Ctx = createContext<Store | null>(null);

export function LocalStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const store = useMemo<Store>(() => {
    return {
      state,
      actions: {
        login: (email) => dispatch({ type: "LOGIN", payload: { email } }),
        logout: () => dispatch({ type: "LOGOUT" }),
        addUser: (u) => dispatch({ type: "USER_ADD", payload: { ...u, id: `u-${Date.now()}` } }),
        updateUser: (id, patch) => dispatch({ type: "USER_UPDATE", payload: { id, patch } }),
        updateDepartment: (id, patch) => dispatch({ type: "DEPT_UPDATE", payload: { id, patch } }),
        toggleTemplateActive: (id) => dispatch({ type: "TEMPLATE_TOGGLE_ACTIVE", payload: { id } }),
        addTemplateField: (templateId, f) => dispatch({ type: "TEMPLATE_FIELD_ADD", payload: { templateId, field: { ...f, id: `f-${Date.now()}` } } }),
        updateTemplateField: (templateId, fieldId, patch) => dispatch({ type: "TEMPLATE_FIELD_UPDATE", payload: { templateId, fieldId, patch } }),
        deleteTemplateField: (templateId, fieldId) => dispatch({ type: "TEMPLATE_FIELD_DELETE", payload: { templateId, fieldId } }),
        updateSettings: (patch) => dispatch({ type: "SETTINGS_UPDATE", payload: patch }),
        ensureTemplateDetails: (id) => {
          if (state.templateDetailsById[id]) return;
          const base = state.templates.find((t) => t.id === id);
          if (!base) return;
          const seeded: RequestTemplate = {
            ...base,
            fields: [{ id: "f-seed", label: "Request Title", fieldType: "TEXT", required: true, displayOrder: 1 }],
          };
          dispatch({ type: "TEMPLATE_FIELD_ADD", payload: { templateId: id, field: seeded.fields![0] } });
        },
      },
    };
  }, [state]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useLocalStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocalStore must be used within LocalStoreProvider");
  return ctx;
}


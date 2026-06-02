"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import { assignments as seedAssignments, departmentInbox as seedInbox, requests as seedRequests, seedNotifications } from "@/lib/mock-data";
import type { Assignment } from "@/types/task";
import type { Milestone } from "@/types/milestone";
import type { RequestItem, RequestStatus } from "@/types/request";

type InboxItem = (typeof seedInbox)[number] & { id: string };

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  href?: string;
};

export type UserProfile = {
  displayName: string;
  role: string;
  email?: string;
  avatarDataUrl?: string;
};

export type AccessibilitySettings = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
};

type State = {
  auth: { isLoggedIn: boolean; email?: string; role?: string };
  profile: UserProfile;
  notifications: AppNotification[];
  accessibility: AccessibilitySettings;
  requests: RequestItem[];
  assignments: Assignment[];
  inbox: InboxItem[];
  requestMissingInfoById: Record<string, string[]>;
  activityByRequestId: Record<string, string[]>;
};

type Action =
  | { type: "LOGIN"; payload: { email: string } }
  | { type: "LOGOUT" }
  | { type: "SET_AVATAR"; payload: { avatarDataUrl?: string } }
  | { type: "SET_ACCESSIBILITY"; payload: Partial<AccessibilitySettings> }
  | { type: "MARK_NOTIFICATION_READ"; payload: { id: string } }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "ADD_REQUEST"; payload: RequestItem }
  | { type: "UPDATE_REQUEST_STATUS"; payload: { id: string; status: RequestStatus; activity?: string } }
  | { type: "SET_REQUEST_MISSING_INFO"; payload: { id: string; missing: string[]; activity?: string } }
  | { type: "SET_REQUEST_ACTIVITY"; payload: { id: string; activity: string[] } }
  | { type: "INBOX_UPDATE"; payload: { id: string; patch: Partial<InboxItem> } }
  | { type: "ASSIGNMENT_ADD_MILESTONE"; payload: { assignmentId: string; milestone: Milestone } }
  | { type: "ASSIGNMENT_UPDATE_MILESTONE"; payload: { assignmentId: string; milestoneId: string; patch: Partial<Pick<Milestone, "title" | "owner" | "status" | "progress">> } }
  | { type: "ASSIGNMENT_SET_STATUS"; payload: { assignmentId: string; status: Assignment["status"] } };

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

function recomputeAssignmentProgress(a: Assignment): Assignment {
  if (!a.milestones.length) return { ...a, progress: clamp(a.progress) };
  const avg = a.milestones.reduce((acc, m) => acc + clamp(m.progress), 0) / a.milestones.length;
  const progress = Math.round(avg);
  let status = a.status;
  if (progress >= 100) status = "COMPLETED";
  else if (progress > 0 && status === "ASSIGNED") status = "IN_PROGRESS";
  return { ...a, progress, status };
}

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "User";
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

const initialState: State = {
  auth: { isLoggedIn: false },
  profile: { displayName: "Jane Employee", role: "HR Team Member" },
  notifications: seedNotifications,
  accessibility: { largeText: false, highContrast: false, reduceMotion: false },
  requests: seedRequests,
  assignments: seedAssignments,
  inbox: seedInbox.map((it, idx) => ({ ...it, id: `inbox-${idx + 1}` })),
  requestMissingInfoById: {
    r2: ["Poster dimensions", "Confirmed event slogan"],
  },
  activityByRequestId: {
    r2: [
      "Request submitted by Tina B.",
      "Manager reviewed and accepted request",
      "Assigned to Bwalya M. and Edward K.",
      "Manager requested missing information",
    ],
  },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOGIN": {
      const email = action.payload.email;
      return {
        ...state,
        auth: { isLoggedIn: true, email, role: "Employee" },
        profile: {
          ...state.profile,
          displayName: displayNameFromEmail(email),
          email,
          role: email.includes("manager") ? "Department Manager" : state.profile.role,
        },
      };
    }
    case "LOGOUT":
      return {
        ...state,
        auth: { isLoggedIn: false },
        profile: { displayName: "Jane Employee", role: "HR Team Member" },
      };
    case "SET_AVATAR":
      return { ...state, profile: { ...state.profile, avatarDataUrl: action.payload.avatarDataUrl } };
    case "SET_ACCESSIBILITY":
      return { ...state, accessibility: { ...state.accessibility, ...action.payload } };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.payload.id ? { ...n, read: true } : n)),
      };
    case "MARK_ALL_NOTIFICATIONS_READ":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case "ADD_REQUEST":
      return { ...state, requests: [action.payload, ...state.requests] };
    case "UPDATE_REQUEST_STATUS": {
      const { id, status, activity } = action.payload;
      const requests = state.requests.map((r) => (r.id === id ? { ...r, status } : r));
      const activityByRequestId = { ...state.activityByRequestId };
      if (activity) activityByRequestId[id] = [...(activityByRequestId[id] ?? []), activity];
      return { ...state, requests, activityByRequestId };
    }
    case "SET_REQUEST_MISSING_INFO": {
      const { id, missing, activity } = action.payload;
      const requestMissingInfoById = { ...state.requestMissingInfoById, [id]: missing };
      const activityByRequestId = { ...state.activityByRequestId };
      if (activity) activityByRequestId[id] = [...(activityByRequestId[id] ?? []), activity];
      return { ...state, requestMissingInfoById, activityByRequestId };
    }
    case "SET_REQUEST_ACTIVITY": {
      const { id, activity } = action.payload;
      return { ...state, activityByRequestId: { ...state.activityByRequestId, [id]: activity } };
    }
    case "INBOX_UPDATE": {
      const { id, patch } = action.payload;
      return { ...state, inbox: state.inbox.map((it) => (it.id === id ? { ...it, ...patch } : it)) };
    }
    case "ASSIGNMENT_ADD_MILESTONE": {
      const { assignmentId, milestone } = action.payload;
      const assignments = state.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        const next = { ...a, milestones: [...a.milestones, milestone] };
        return recomputeAssignmentProgress(next);
      });
      return { ...state, assignments };
    }
    case "ASSIGNMENT_UPDATE_MILESTONE": {
      const { assignmentId, milestoneId, patch } = action.payload;
      const assignments = state.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        const next = {
          ...a,
          milestones: a.milestones.map((m) =>
            m.id === milestoneId
              ? { ...m, ...patch, progress: patch.progress == null ? m.progress : clamp(patch.progress) }
              : m,
          ),
        };
        return recomputeAssignmentProgress(next);
      });
      return { ...state, assignments };
    }
    case "ASSIGNMENT_SET_STATUS": {
      const { assignmentId, status } = action.payload;
      return { ...state, assignments: state.assignments.map((a) => (a.id === assignmentId ? { ...a, status } : a)) };
    }
    default:
      return state;
  }
}

type Store = {
  state: State;
  actions: {
    login: (email: string) => void;
    logout: () => void;
    setAvatar: (avatarDataUrl?: string) => void;
    updateAccessibility: (patch: Partial<AccessibilitySettings>) => void;
    markNotificationRead: (id: string) => void;
    markAllNotificationsRead: () => void;
    addRequest: (req: RequestItem) => void;
    updateRequestStatus: (id: string, status: RequestStatus, activity?: string) => void;
    setRequestMissingInfo: (id: string, missing: string[], activity?: string) => void;
    inboxUpdate: (id: string, patch: Partial<InboxItem>) => void;
    addMilestone: (assignmentId: string, milestone: Omit<Milestone, "id">) => void;
    updateMilestone: (assignmentId: string, milestoneId: string, patch: Partial<Pick<Milestone, "title" | "owner" | "status" | "progress">>) => void;
    setAssignmentStatus: (assignmentId: string, status: Assignment["status"]) => void;
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
        setAvatar: (avatarDataUrl) => dispatch({ type: "SET_AVATAR", payload: { avatarDataUrl } }),
        updateAccessibility: (patch) => dispatch({ type: "SET_ACCESSIBILITY", payload: patch }),
        markNotificationRead: (id) => dispatch({ type: "MARK_NOTIFICATION_READ", payload: { id } }),
        markAllNotificationsRead: () => dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" }),
        addRequest: (req) => dispatch({ type: "ADD_REQUEST", payload: req }),
        updateRequestStatus: (id, status, activity) => dispatch({ type: "UPDATE_REQUEST_STATUS", payload: { id, status, activity } }),
        setRequestMissingInfo: (id, missing, activity) => dispatch({ type: "SET_REQUEST_MISSING_INFO", payload: { id, missing, activity } }),
        inboxUpdate: (id, patch) => dispatch({ type: "INBOX_UPDATE", payload: { id, patch } }),
        addMilestone: (assignmentId, milestone) =>
          dispatch({ type: "ASSIGNMENT_ADD_MILESTONE", payload: { assignmentId, milestone: { id: `m-${Date.now()}`, ...milestone } } }),
        updateMilestone: (assignmentId, milestoneId, patch) => dispatch({ type: "ASSIGNMENT_UPDATE_MILESTONE", payload: { assignmentId, milestoneId, patch } }),
        setAssignmentStatus: (assignmentId, status) => dispatch({ type: "ASSIGNMENT_SET_STATUS", payload: { assignmentId, status } }),
      },
    };
  }, [state]);

  return (
    <Ctx.Provider value={store}>
      {children}
    </Ctx.Provider>
  );
}

export function useLocalStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocalStore must be used within LocalStoreProvider");
  return ctx;
}

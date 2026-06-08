import type { RequestDetail } from "@/lib/requests-api";
import { statusLabel } from "@/lib/request-status-groups";

export function requestWhatsHappening(req: RequestDetail): string {
  if (req.currentStage?.trim()) return req.currentStage.trim();
  return `Your request is ${statusLabel(req.status).toLowerCase()}.`;
}

export function requestNextStep(req: RequestDetail, isRequester: boolean): string {
  if (req.actionNeeded && req.actionNeeded !== "None") return req.actionNeeded;
  if (req.status === "NEEDS_INFORMATION" && isRequester) {
    return "Provide the requested information to continue.";
  }
  if (req.status === "READY_FOR_REVIEW" && isRequester) {
    return "Review the completed work and approve or send back.";
  }
  return "No action needed from you right now.";
}

export function requestNeedsAttention(req: RequestDetail, isRequester: boolean): boolean {
  if (req.status === "NEEDS_INFORMATION" && isRequester) return true;
  if (req.actionNeeded && req.actionNeeded !== "None") return true;
  return false;
}

export function taskNextStep(status: string): string {
  const s = status.toUpperCase();
  if (s === "READY_FOR_REVIEW") return "Waiting for requester review.";
  if (s === "COMPLETED") return "This task is complete.";
  if (s === "OVERDUE") return "This task is overdue — update progress as soon as possible.";
  if (s === "ASSIGNED" || s === "TODO") return "Start working on the milestones below.";
  if (s === "IN_PROGRESS") return "Update milestones to reflect your progress.";
  return "No action needed from you right now.";
}

import type { RequestDetail } from "@/lib/requests-api";
import { statusLabel } from "@/lib/request-status-groups";

export function requestWhatsHappening(req: RequestDetail): string {
  if (req.currentStage?.trim()) return req.currentStage.trim();
  return `Your request is ${statusLabel(req.status).toLowerCase()}.`;
}

export function managerWhatsHappening(req: RequestDetail): string {
  const name = req.createdBy.fullName;
  switch (req.status) {
    case "SUBMITTED":
      return `${name} sent this to your team. Review their answers below, then accept, ask for details, or decline.`;
    case "ACCEPTED":
      return `You accepted this request. Assign team members so they can start work under My Assigned Tasks.`;
    case "NEEDS_INFORMATION":
      return `Waiting for ${name} to answer your questions before work can continue.`;
    case "IN_PROGRESS":
      return "Your team is working on this request.";
    case "READY_FOR_REVIEW":
    case "COMPLETED":
      return `Work is finished. Waiting for ${name} to approve the result.`;
    default:
      return `This request is ${statusLabel(req.status).toLowerCase()}.`;
  }
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

export function managerNextStep(req: RequestDetail): string {
  switch (req.status) {
    case "SUBMITTED":
      return "Accept the request, ask for more details, or decline.";
    case "ACCEPTED":
      return "Assign one or more team members to do the work.";
    case "NEEDS_INFORMATION":
      return "No action until the requester responds.";
    default:
      return requestNextStep(req, false);
  }
}

export function requestNeedsAttention(req: RequestDetail, isRequester: boolean): boolean {
  if (req.status === "NEEDS_INFORMATION" && isRequester) return true;
  if (req.actionNeeded && req.actionNeeded !== "None") return true;
  return false;
}

export function managerNeedsAttention(req: RequestDetail): boolean {
  return req.status === "SUBMITTED" || req.status === "ACCEPTED";
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

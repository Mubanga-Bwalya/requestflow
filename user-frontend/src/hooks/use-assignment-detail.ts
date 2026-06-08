"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMilestone,
  fetchAssignmentDetail,
  updateAssignmentStatus,
  updateMilestone,
  type AssignmentDetail,
} from "@/lib/assignments-api";
import { validateMilestoneCreateInput } from "@/lib/assignment-form-utils";
import { apiErrorMessage } from "@/lib/api-error";

export type MilestoneFormStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";

export function useAssignmentDetail(assignmentId: string, userId: string | undefined) {
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [mTitle, setMTitle] = useState("");
  const [mOwnerId, setMOwnerId] = useState("");
  const [mDeadline, setMDeadline] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mStatus, setMStatus] = useState<MilestoneFormStatus>("TODO");
  const [mProgress, setMProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAssignmentDetail(assignmentId);
        if (cancelled) return;
        setAssignment(data);
      } catch {
        if (cancelled) return;
        setError("Could not load this assignment.");
        setAssignment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  function resetAddForm() {
    setMTitle("");
    setMOwnerId("");
    setMDeadline("");
    setMDescription("");
    setFormError(null);
  }

  useEffect(() => {
    if (addOpen) resetAddForm();
  }, [addOpen]);

  function openUpdate(milestoneId: string) {
    setFormError(null);
    setSelectedMilestoneId(milestoneId);
    const m = assignment?.milestones.find((x) => x.id === milestoneId);
    if (m) {
      setMProgress(m.progress);
      setMStatus(m.status as MilestoneFormStatus);
    }
    setUpdateOpen(true);
  }

  const addFieldErrors = useMemo(() => {
    if (!assignment) return {};
    return validateMilestoneCreateInput({
      title: mTitle,
      ownerUserId: mOwnerId,
      deadline: mDeadline,
      memberIds: assignment.members.map((m) => m.id),
    });
  }, [assignment, mTitle, mOwnerId, mDeadline]);

  const canAddMilestone = Boolean(userId && assignment) && Object.keys(addFieldErrors).length === 0;

  async function markReadyForReview() {
    if (saving || !userId || !assignment) return;
    setSaving(true);
    setFormError(null);
    try {
      setAssignment(await updateAssignmentStatus(assignment.id, "READY_FOR_REVIEW"));
    } catch (e) {
      setFormError(apiErrorMessage(e, "Could not mark this assignment ready for review."));
    } finally {
      setSaving(false);
    }
  }

  async function submitAddMilestone() {
    if (saving || !userId || !assignment) return;
    setFormError(null);
    if (Object.keys(addFieldErrors).length) return;

    setSaving(true);
    try {
      const description = mDescription.trim();
      const updated = await addMilestone(assignment.id, {
        title: mTitle.trim(),
        ownerUserId: mOwnerId,
        deadline: mDeadline.trim() || undefined,
        ...(description ? { description } : {}),
      });
      setAssignment(updated);
      resetAddForm();
      setAddOpen(false);
    } catch (e) {
      setFormError(apiErrorMessage(e, "We could not add the milestone. Please check your entries."));
    } finally {
      setSaving(false);
    }
  }

  async function submitUpdateMilestone() {
    if (saving) return;
    if (!userId || !assignment || !selectedMilestoneId) {
      setUpdateOpen(false);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await updateMilestone(assignment.id, selectedMilestoneId, {
        progress: Math.max(0, Math.min(100, mProgress)),
        status: mStatus,
      });
      setAssignment(updated);
      setUpdateOpen(false);
    } catch (e) {
      setFormError(apiErrorMessage(e, "We could not update the milestone."));
    } finally {
      setSaving(false);
    }
  }

  return {
    assignment,
    loading,
    error,
    addOpen,
    setAddOpen,
    updateOpen,
    setUpdateOpen,
    mTitle,
    setMTitle,
    mOwnerId,
    setMOwnerId,
    mDeadline,
    setMDeadline,
    mDescription,
    setMDescription,
    mStatus,
    setMStatus,
    mProgress,
    setMProgress,
    formError,
    fieldErrors: addFieldErrors,
    saving,
    canAddMilestone,
    openUpdate,
    markReadyForReview,
    submitAddMilestone,
    submitUpdateMilestone,
  };
}

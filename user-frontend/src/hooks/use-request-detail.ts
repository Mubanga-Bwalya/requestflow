"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "@/lib/api-error";
import {
  fetchRequestDetail,
  provideMissingInformation,
  updateRequestStatus,
  type RequestDetail,
} from "@/lib/requests-api";
import { invalidateApiCache } from "@/lib/query-cache";

export function useRequestDetail(requestId: string, userId: string | undefined) {
  const [req, setReq] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provideOpen, setProvideOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [providedValues, setProvidedValues] = useState<Record<string, string>>({});
  const [provideError, setProvideError] = useState<string | null>(null);
  const [provideSaving, setProvideSaving] = useState(false);
  const [approveSaving, setApproveSaving] = useState(false);
  const [reopenSaving, setReopenSaving] = useState(false);

  const applyDetail = useCallback((data: RequestDetail) => {
    setReq(data);
    setProvidedValues(
      data.missingInformation.reduce(
        (acc, m) => {
          if (m.fieldKey) acc[m.fieldKey] = "";
          return acc;
        },
        {} as Record<string, string>,
      ),
    );
  }, []);

  const reload = useCallback(async () => {
    invalidateApiCache(`request:${requestId}`);
    const data = await fetchRequestDetail(requestId);
    applyDetail(data);
  }, [requestId, applyDetail]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRequestDetail(requestId);
        if (cancelled) return;
        applyDetail(data);
      } catch {
        if (cancelled) return;
        setError("Could not load this request.");
        setReq(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [requestId, applyDetail]);

  async function submitMissingInfo() {
    if (!userId || !req || provideSaving) return;
    const answers = req.missingInformation
      .filter((m) => m.fieldKey)
      .map((m) => ({ fieldKey: m.fieldKey!, answerText: providedValues[m.fieldKey!] ?? "" }));
    if (answers.some((a) => !a.answerText.trim())) {
      setProvideError("Please complete all fields before submitting.");
      return;
    }
    setProvideError(null);
    setProvideSaving(true);
    try {
      const updated = await provideMissingInformation(req.id, answers);
      setReq(updated);
      setProvideOpen(false);
    } catch (e) {
      setProvideError(apiErrorMessage(e, "Could not submit your answers. Please try again."));
    } finally {
      setProvideSaving(false);
    }
  }

  async function approve() {
    if (!userId || !req || approveSaving) return;
    setApproveSaving(true);
    try {
      const updated = await updateRequestStatus(req.id, "APPROVED", "Requester approved the completion.");
      setReq(updated);
      setApproveOpen(false);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not approve this request."));
    } finally {
      setApproveSaving(false);
    }
  }

  async function reopen() {
    if (!userId || !req || reopenSaving) return;
    setReopenSaving(true);
    try {
      const updated = await updateRequestStatus(req.id, "REOPENED", "Requester sent the request back for more work.");
      setReq(updated);
      setReopenOpen(false);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not reopen this request."));
    } finally {
      setReopenSaving(false);
    }
  }

  const isRequester = Boolean(req && userId && req.createdBy.id === userId);
  const canReviewCompletion =
    isRequester && (req?.status === "COMPLETED" || req?.status === "READY_FOR_REVIEW");

  return {
    req,
    loading,
    error,
    provideOpen,
    setProvideOpen,
    approveOpen,
    setApproveOpen,
    reopenOpen,
    setReopenOpen,
    providedValues,
    setProvidedValues,
    provideError,
    setProvideError,
    provideSaving,
    approveSaving,
    reopenSaving,
    submitMissingInfo,
    approve,
    reopen,
    reload,
    canReviewCompletion,
  };
}

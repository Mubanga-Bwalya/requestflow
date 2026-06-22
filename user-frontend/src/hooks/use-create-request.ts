"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "@/lib/requests-api";
import {
  deriveRequestDescription,
  deriveRequestTitle,
  trimFieldValues,
  validateTemplateFields,
} from "@/lib/create-request-utils";
import { buildCreateRequestFieldAnswers } from "@/lib/create-request-build";
import type { Department, RequestTypeDef } from "@/lib/request-templates";
import { fetchSettings } from "@/lib/settings-api";
import { fetchActiveDepartments } from "@/lib/departments-api";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchTemplateDetail, fetchTemplatesForDepartment } from "@/lib/templates-api";
import type { Priority } from "@/types/request";

type TemplateOption = { id: string; name: string; department: Department };
type WizardStep = 1 | 2 | 3 | 4;

export function useCreateRequest(presetDepartment: Department | null, userId: string | undefined) {
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(1);
  const [departments, setDepartments] = useState<
    { id: string; name: string; description: string | null; sections: { id: string; name: string }[] }[]
  >([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [department, setDepartment] = useState<Department | null>(presetDepartment);
  /** Selected sub-section name under `department`, or null for department-level. */
  const [section, setSection] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [requestTypeId, setRequestTypeId] = useState("");
  const [requestType, setRequestType] = useState<RequestTypeDef | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [defaultPriority, setDefaultPriority] = useState<Priority>("MEDIUM");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [showPriorityOverride, setShowPriorityOverride] = useState(false);
  const [allowUploads, setAllowUploads] = useState(true);
  const [fileUploadLimitMb, setFileUploadLimitMb] = useState(10);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [attachmentName, setAttachmentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldValidation = useMemo(() => {
    if (!requestType) return {};
    return validateTemplateFields(requestType.fields, values, allowUploads);
  }, [requestType, values, allowUploads]);

  const sections = useMemo(
    () => departments.find((d) => d.name === department)?.sections ?? [],
    [departments, department],
  );
  /** The leaf the request targets: the section when chosen, else the department. */
  const targetLeaf = section ?? department;

  const canProceedStep1 = Boolean(department && requestTypeId && !loadingTemplates && templates.length);
  const canProceedStep2 = requestType ? Object.keys(fieldValidation).length === 0 && !loadingFields : false;
  const canSubmit = canProceedStep2 && Boolean(userId);

  useEffect(() => {
    setLoadingDepartments(true);
    setDepartmentsError(null);
    fetchActiveDepartments()
      .then((rows) => {
        setDepartments(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            sections: (r.sections ?? [])
              .filter((s) => s.isActive)
              .map((s) => ({ id: s.id, name: s.name })),
          })),
        );
        if (presetDepartment && rows.some((d) => d.name === presetDepartment)) {
          setDepartment(presetDepartment);
        } else if (!presetDepartment && rows.length === 1) {
          setDepartment(rows[0].name);
        }
      })
      .catch((e) => {
        setDepartments([]);
        setDepartmentsError(apiErrorMessage(e, "Could not load departments. Check your connection and try again."));
      })
      .finally(() => setLoadingDepartments(false));
  }, [presetDepartment]);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setDefaultPriority(s.defaultPriority);
        setPriority(s.defaultPriority);
        setAllowUploads(s.allowUploads);
        setFileUploadLimitMb(s.fileUploadLimitMb);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!targetLeaf) {
      setTemplates([]);
      return;
    }
    setLoadingTemplates(true);
    setApiError(null);
    fetchTemplatesForDepartment(targetLeaf)
      .then((rows) => {
        setTemplates(rows);
        setRequestTypeId((prev) => (rows.some((t) => t.id === prev) ? prev : ""));
      })
      .catch(() => {
        setTemplates([]);
        setApiError("We could not load request types. Check your connection and try again.");
      })
      .finally(() => setLoadingTemplates(false));
  }, [targetLeaf]);

  useEffect(() => {
    if (!requestTypeId || !targetLeaf) {
      setRequestType(null);
      return;
    }
    setLoadingFields(true);
    setApiError(null);
    fetchTemplateDetail(requestTypeId, targetLeaf)
      .then(setRequestType)
      .catch(() => {
        setRequestType(null);
        setApiError("Could not load form fields for this request type.");
      })
      .finally(() => setLoadingFields(false));
  }, [requestTypeId, targetLeaf]);

  function onDepartmentChange(next: Department) {
    setDepartment(next);
    setSection(null);
    setRequestTypeId("");
    setRequestType(null);
    setValues({});
    setFieldErrors({});
  }

  function onSectionChange(next: string) {
    setSection(next || null);
    setRequestTypeId("");
    setRequestType(null);
    setValues({});
    setFieldErrors({});
  }

  function setFieldValue(key: string, value: string) {
    setValues((p) => ({ ...p, [key]: value }));
    setFieldErrors((p) => {
      if (!p[key]) return p;
      const next = { ...p };
      delete next[key];
      return next;
    });
  }

  async function submitRequest() {
    if (submitting) return;
    if (!userId || !department || !requestType) return;
    const trimmed = trimFieldValues(values);
    const errors = validateTemplateFields(requestType.fields, trimmed, allowUploads);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createRequest({
        targetDepartmentName: section ?? department,
        templateId: requestType.id,
        title: deriveRequestTitle(trimmed, requestType),
        description: deriveRequestDescription(trimmed, requestType),
        priority,
        fieldAnswers: buildCreateRequestFieldAnswers(requestType, trimmed),
      });
      setCreatedId(created.id);
      setStep(4);
    } catch (e) {
      setError(apiErrorMessage(e, "We could not submit your request. Please check your entries."));
    } finally {
      setSubmitting(false);
    }
  }

  async function next() {
    setError(null);
    if (step === 1) {
      if (!department) return setError("Please choose a department.");
      if (!requestTypeId) return setError("Please choose a request type.");
      if (loadingFields || !requestType) return setError("Form fields are still loading. Please wait.");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!requestType) return setError("Please choose a request type.");
      const errors = validateTemplateFields(requestType.fields, values, allowUploads);
      setFieldErrors(errors);
      if (Object.keys(errors).length) {
        return setError("Please complete all required fields before continuing.");
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (submitting) return;
      await submitRequest();
    }
  }

  function back() {
    setError(null);
    if (step === 1 || step === 4) return;
    setStep((step - 1) as WizardStep);
  }

  function resetWizard() {
    setCreatedId(null);
    setStep(1);
    setDepartment(presetDepartment);
    setSection(null);
    setRequestTypeId("");
    setRequestType(null);
    setPriority(defaultPriority);
    setShowPriorityOverride(false);
    setValues({});
    setFieldErrors({});
    setAttachmentName("");
  }

  return {
    router,
    step,
    departments,
    loadingDepartments,
    departmentsError,
    department,
    section,
    sections,
    onSectionChange,
    templates,
    requestTypeId,
    setRequestTypeId,
    requestType,
    loadingTemplates,
    loadingFields,
    apiError,
    defaultPriority,
    priority,
    setPriority,
    showPriorityOverride,
    setShowPriorityOverride,
    allowUploads,
    fileUploadLimitMb,
    values,
    fieldErrors,
    attachmentName,
    setAttachmentName,
    error,
    createdId,
    submitting,
    canProceedStep1,
    canProceedStep2,
    canSubmit,
    onDepartmentChange,
    setFieldValue,
    next,
    back,
    resetWizard,
    setValues,
  };
}

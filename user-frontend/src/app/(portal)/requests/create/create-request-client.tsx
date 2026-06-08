"use client";

import { useEffect, useRef } from "react";
import { CreateRequestStepper } from "@/components/create-request/create-request-stepper";
import { CreateRequestSteps } from "@/components/create-request/create-request-steps";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateRequest } from "@/hooks/use-create-request";
import { useAuth } from "@/lib/auth-context";
import type { Department } from "@/lib/request-templates";

export function CreateRequestClient({ presetDepartment }: { presetDepartment: Department | null }) {
  const { state } = useAuth();
  const wizard = useCreateRequest(presetDepartment, state.auth.userId);
  const formCardRef = useRef<HTMLDivElement>(null);

  const isSuccess = wizard.step === 4;

  const nextDisabled =
    isSuccess ||
    wizard.submitting ||
    (wizard.step === 1 && (!wizard.canProceedStep1 || wizard.loadingFields)) ||
    (wizard.step === 2 && (!wizard.canProceedStep2 || wizard.loadingFields)) ||
    (wizard.step === 3 && !wizard.canSubmit);

  const nextLabel =
    wizard.step === 3 ? (wizard.submitting ? "Submitting…" : "Submit request") : "Next";

  const step1Helper =
    wizard.step === 1 && nextDisabled && !wizard.submitting
      ? "Select a department and request type to continue."
      : null;

  useEffect(() => {
    if (isSuccess) return;
    const el = formCardRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  }, [wizard.step, isSuccess]);

  return (
    <>
      <PageHeader
        title="Create Request"
        description="Choose a department and request type, complete the form, then review before submitting."
      />
      <div ref={formCardRef} className="scroll-mt-24">
      <Card>
        <CardContent className="space-y-5 pt-6 md:pt-6">
          {!isSuccess ? <CreateRequestStepper currentStep={wizard.step} /> : null}

          {wizard.apiError ? (
            <div className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {wizard.apiError}
            </div>
          ) : null}
          {wizard.error ? (
            <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700">{wizard.error}</div>
          ) : null}

          <CreateRequestSteps
            step={wizard.step}
            department={wizard.department}
            departments={wizard.departments}
            loadingDepartments={wizard.loadingDepartments}
            templates={wizard.templates}
            loadingTemplates={wizard.loadingTemplates}
            requestTypeId={wizard.requestTypeId}
            setRequestTypeId={wizard.setRequestTypeId}
            requestType={wizard.requestType}
            loadingFields={wizard.loadingFields}
            defaultPriority={wizard.defaultPriority}
            priority={wizard.priority}
            setPriority={wizard.setPriority}
            showPriorityOverride={wizard.showPriorityOverride}
            setShowPriorityOverride={wizard.setShowPriorityOverride}
            allowUploads={wizard.allowUploads}
            fileUploadLimitMb={wizard.fileUploadLimitMb}
            values={wizard.values}
            fieldErrors={wizard.fieldErrors}
            attachmentName={wizard.attachmentName}
            onDepartmentChange={wizard.onDepartmentChange}
            setFieldValue={wizard.setFieldValue}
            setAttachmentName={wizard.setAttachmentName}
            setValues={wizard.setValues}
            createdId={wizard.createdId}
            onViewRequests={() => wizard.router.push("/requests")}
            onViewDetail={(id) => wizard.router.push(`/requests/${id}`)}
            onCreateAnother={wizard.resetWizard}
          />

          {!isSuccess ? (
            <div className="space-y-3 border-t border-zamtel-border pt-4">
              {step1Helper ? <p className="text-sm text-zamtel-muted">{step1Helper}</p> : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                {wizard.step === 1 ? (
                  <Button className="w-full sm:w-auto" variant="outline" onClick={() => wizard.router.push("/requests")}>
                    Cancel
                  </Button>
                ) : (
                  <Button className="w-full sm:w-auto" variant="outline" onClick={wizard.back}>
                    Back
                  </Button>
                )}
                <Button className="w-full sm:w-auto" onClick={wizard.next} disabled={nextDisabled} loading={wizard.submitting}>
                  {nextLabel}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      </div>
    </>
  );
}

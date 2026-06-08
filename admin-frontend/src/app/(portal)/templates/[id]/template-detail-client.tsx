"use client";

import { TemplateDetailHeader } from "@/components/admin-templates/template-detail-header";
import { TemplateFieldDialog } from "@/components/admin-templates/template-field-dialog";
import { TemplateFieldsTable } from "@/components/admin-templates/template-fields-table";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { PageHeader } from "@/components/shared/page-header";
import { BackButtonLink } from "@/components/ui/back-button-link";
import { useTemplateDetail } from "@/hooks/use-template-detail";

export function TemplateDetailClient({ templateId }: { templateId: string }) {
  const { template, loading, error, activeFields, dialog, deactivateField } =
    useTemplateDetail(templateId);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!template || error) {
    return (
      <PageHeader
        title="Template not found"
        description={error ?? ""}
        actions={<BackButtonLink href="/templates">Back to Templates</BackButtonLink>}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <TemplateDetailHeader template={template} onAddField={dialog.openAdd} />
        <TemplateFieldsTable
          fields={activeFields}
          onEdit={dialog.openEdit}
          onDeactivate={deactivateField}
        />
      </div>

      <TemplateFieldDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        editing={dialog.editing}
        form={dialog.form}
        onFormChange={dialog.patchForm}
        formError={dialog.formError}
        fieldErrors={dialog.fieldErrors}
        canSave={dialog.canSave}
        saving={dialog.saving}
        onSave={() => void dialog.saveField()}
      />
    </>
  );
}

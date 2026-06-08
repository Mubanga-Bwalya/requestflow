import { PageHeader } from "@/components/shared/page-header";
import { BackButtonLink } from "@/components/ui/back-button-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ApiTemplateDetail } from "@/lib/templates-api";

type Props = {
  template: ApiTemplateDetail;
  onAddField: () => void;
};

export function TemplateDetailHeader({ template, onAddField }: Props) {
  return (
    <>
      <PageHeader
        title="Template Details"
        description="Field configuration saved to database."
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButtonLink href="/templates">Back to Templates</BackButtonLink>
            <Button onClick={onAddField}>Add Field</Button>
          </div>
        }
      />
      <Card>
        <CardContent>
          <p className="text-sm text-muted">Template</p>
          <p className="text-xl font-semibold text-brand-dark">{template.name}</p>
          <p className="text-sm text-muted">Department: {template.departmentName}</p>
          <p className="text-sm text-muted">Status: {template.isActive ? "Active" : "Inactive"}</p>
        </CardContent>
      </Card>
    </>
  );
}

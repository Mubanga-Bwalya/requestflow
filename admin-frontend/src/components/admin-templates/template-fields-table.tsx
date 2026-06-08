import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { TableActionButton } from "@/components/shared/table-action-button";
import { Button } from "@/components/ui/button";
import type { ApiTemplateField } from "@/lib/templates-api";

type Props = {
  fields: ApiTemplateField[];
  onEdit: (field: ApiTemplateField) => void;
  onDeactivate: (field: ApiTemplateField) => Promise<void>;
};

export function TemplateFieldsTable({ fields, onEdit, onDeactivate }: Props) {
  return (
    <DataTable
      columns={[
        { key: "label", label: "Field" },
        { key: "fieldType", label: "Type" },
        { key: "required", label: "Required" },
        { key: "displayOrder", label: "Order" },
        { key: "__actions", label: "Actions" },
      ]}
      rows={fields.map((f): DataTableRow => ({
        label: f.label,
        fieldType: f.fieldType,
        required: f.isRequired ? "Required" : "Optional",
        displayOrder: f.displayOrder,
        __actions: (
          <div className="flex gap-2">
            <TableActionButton onClick={() => onEdit(f)}>Edit</TableActionButton>
            <Button
              type="button"
              size="compact"
              variant="destructive"
              onClick={async () => {
                if (!confirm(`Deactivate field "${f.label}"?`)) return;
                await onDeactivate(f);
              }}
            >
              Deactivate
            </Button>
          </div>
        ),
      }))}
    />
  );
}

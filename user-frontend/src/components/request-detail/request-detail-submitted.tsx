import { DetailField } from "@/components/shared/detail-field";
import { Card, CardContent } from "@/components/ui/card";
import type { RequestDetail } from "@/lib/requests-api";

function formatAnswer(
  answerText: string | null,
  answerJson: unknown,
  fileUrl: string | null,
): string {
  if (fileUrl?.trim()) return fileUrl;
  if (answerText?.trim()) return answerText;
  if (answerJson != null) return JSON.stringify(answerJson);
  return "—";
}

export function RequestDetailSubmitted({ req, isRequester }: { req: RequestDetail; isRequester: boolean }) {
  const heading = isRequester ? "What you submitted" : `Submitted by ${req.createdBy.fullName}`;

  return (
    <Card>
      <CardContent>
        <p className="mb-1 text-sm font-bold text-brand-dark">{heading}</p>
        <p className="mb-4 text-xs text-zamtel-muted">Details provided when this request was created</p>

        <dl className="divide-y divide-zamtel-border">
          <DetailField label="Request title" value={req.title} />
          {req.description ? <DetailField label="Description" value={req.description} /> : null}
          <DetailField label="Department" value={req.department} />
          <DetailField label="Request type" value={req.requestType} />
          <DetailField label="Due date" value={req.deadline?.trim() ? req.deadline : "No due date set"} />
          {req.fieldAnswers.length ? (
            req.fieldAnswers.map((a) => (
              <DetailField
                key={a.fieldKey}
                label={a.label}
                value={formatAnswer(a.answerText, a.answerJson, a.fileUrl)}
              />
            ))
          ) : (
            <DetailField label="Form responses" value="No additional fields were submitted." />
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

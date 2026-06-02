import { TemplateDetailClient } from "./template-detail-client";

export default function Page({ params }: { params: { id: string } }) {
  return <TemplateDetailClient templateId={params.id} />;
}

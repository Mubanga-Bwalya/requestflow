import { DepartmentSectionsClient } from "./department-sections-client";

export default function Page({ params }: { params: { id: string } }) {
  return <DepartmentSectionsClient departmentId={params.id} />;
}

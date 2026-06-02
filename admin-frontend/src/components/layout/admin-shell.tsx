import { ReactNode } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export function AdminShell({children,title}:{children:ReactNode;title:string}){
  return (
    <div className="flex min-h-screen bg-brand-primary/5">
      <AdminSidebar/>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title={title}/>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

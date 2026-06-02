import { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function AppShell({children,title}:{children:ReactNode;title:string}){
  return (
    <div className="flex min-h-screen bg-brand-primary/5">
      <AppSidebar/>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title={title}/>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

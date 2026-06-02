"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
const items = [["Dashboard","/dashboard"],["Users","/users"],["Departments","/departments"],["Roles","/roles"],["Templates","/templates"],["Reports","/reports"],["Settings","/settings"]] as const;
export function AdminSidebar(){
  const pathname=usePathname();
  return (
    <aside className="w-64 border-r border-brand-dark/20 bg-brand-dark p-4 text-white">
      <div className="mb-5 rounded-lg border border-white/10 bg-white/5 p-3">
        <BrandLogo subtitle="Admin Configuration Portal" />
      </div>

      <nav className="space-y-1">
        {items.map(([label,href])=>{
          const active=pathname===href||pathname.startsWith(`${href}/`);
          return (
            <Link
              key={label}
              href={href}
              className={
                active
                  ? "block rounded-md border border-brand-lime/30 bg-brand-primary px-3 py-2 text-sm font-medium text-white shadow-sm"
                  : "block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-white"
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

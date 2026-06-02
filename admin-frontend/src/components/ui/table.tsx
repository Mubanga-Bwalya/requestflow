import { ReactNode } from "react";

export function Table({children}:{children:ReactNode}){
  return (
    <div className="overflow-x-auto rounded-lg border border-brand-dark/10 bg-white">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({children}:{children:ReactNode}){
  return <th className="border-b border-brand-dark/10 bg-brand-primary/10 px-3 py-2 text-left font-semibold text-brand-dark">{children}</th>;
}

export function Td({children}:{children:ReactNode}){
  return <td className="border-b border-brand-dark/5 px-3 py-3 text-slate-700">{children}</td>;
}

export function Tr({children}:{children:ReactNode}){
  return <tr>{children}</tr>;
}


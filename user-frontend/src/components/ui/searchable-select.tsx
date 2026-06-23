"use client";

import { ChevronDown } from "lucide-react";
import { useAnchoredMenuPosition } from "@/components/ui/use-anchored-menu-position";
import { cn } from "@/lib/utils";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
  description?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  noResultsLabel?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
  id: idProp,
  className,
  noResultsLabel = "No matches found",
}: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-listbox`;
  const searchId = `${id}-search`;
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const menuStyle = useAnchoredMenuPosition(open, anchorRef);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const hay = `${opt.label} ${opt.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  const menu =
    open && mounted ? (
      <div
        ref={menuRef}
        style={menuStyle}
        className="rf-select-menu flex flex-col overflow-hidden rounded-control border border-zamtel-border bg-white shadow-overlay"
      >
        <div className="shrink-0 border-b border-zamtel-border/80 p-2">
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "rf-field-control min-h-10 w-full rounded-control border border-zamtel-border bg-white py-0 pl-3 pr-3 text-sm text-brand-dark",
            )}
            aria-label={searchPlaceholder}
            autoComplete="off"
          />
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="min-h-0 flex-1 overflow-y-auto py-1"
        >
          {filtered.length ? (
            filtered.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value || "__empty"} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={cn(
                      "rf-clickable-row rf-focus-ring w-full px-4 py-2.5 text-left text-sm",
                      isSelected
                        ? "border-l-[3px] border-l-brand-magenta bg-brand-primary/10 font-semibold text-brand-dark"
                        : "text-brand-dark",
                    )}
                    onClick={() => pick(opt.value)}
                  >
                    <span className="block">{opt.label}</span>
                    {opt.description ? (
                      <span className="mt-0.5 block text-xs font-normal text-zamtel-muted">
                        {opt.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-4 py-3 text-sm text-zamtel-muted">{noResultsLabel}</li>
          )}
        </ul>
      </div>
    ) : null;

  return (
    <>
      <div className={cn(className)}>
        <button
          ref={anchorRef}
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          className={cn(
            "rf-field-control rf-focus-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-control border border-zamtel-border bg-white py-0 pl-4 pr-3 text-left text-base text-brand-dark md:text-sm",
            !selected?.value && "text-muted",
            open && "border-brand-primary outline outline-[3px] outline-brand-magenta outline-offset-2",
          )}
          onClick={() => !disabled && setOpen((v) => !v)}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-brand-primary transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>
      {menu && mounted ? createPortal(menu, document.body) : null}
    </>
  );
}

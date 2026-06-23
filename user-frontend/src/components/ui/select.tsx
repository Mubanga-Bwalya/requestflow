"use client";

import { ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { fieldControlClassName } from "@/components/ui/field-control";

type OptionItem = { value: string; label: string };

function parseOptions(children: ReactNode): OptionItem[] {
  const items: OptionItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ value?: string; children?: ReactNode }>;
    if (el.type === "option") {
      const value = String(el.props.value ?? "");
      const label =
        typeof el.props.children === "string" || typeof el.props.children === "number"
          ? String(el.props.children)
          : value || "—";
      items.push({ value, label });
      return;
    }
    if (el.type === "optgroup") {
      items.push(...parseOptions(el.props.children));
    }
  });
  return items;
}

function NativeSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          fieldControlClassName,
          "rf-native-select appearance-none py-0 pl-4 pr-10",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-primary"
        aria-hidden
      />
    </div>
  );
}

function CustomSelect({
  className,
  children,
  value,
  onChange,
  disabled,
  id: idProp,
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-listbox`;
  const options = parseOptions(children);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === String(value ?? ""));
  const displayLabel = selected?.label ?? options.find((o) => o.value === "")?.label ?? "Select…";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
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
    onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  const selectable = options.filter((o) => o.value !== "");

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          fieldControlClassName,
          "rf-focus-ring flex items-center justify-between gap-2 py-0 pl-4 pr-3 text-left",
          !selected?.value && "text-muted",
          open && "border-brand-primary outline outline-[3px] outline-brand-magenta outline-offset-2",
        )}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-brand-primary transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="rf-select-menu absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-control border border-zamtel-border bg-white py-1 shadow-overlay"
        >
          {selectable.map((opt) => {
            const isSelected = opt.value === String(value ?? "");
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
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  if (props.multiple) {
    return <NativeSelect {...props} />;
  }
  return <CustomSelect {...props} />;
}

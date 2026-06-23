"use client";

import { useMemo } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";

export type PersonOption = {
  id: string;
  fullName: string;
  email?: string | null;
  jobTitle?: string | null;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  people: PersonOption[];
  id?: string;
  className?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
};

export function PersonSelect({
  value,
  onChange,
  people,
  id,
  className,
  disabled,
  allowEmpty = true,
  emptyLabel = "No one selected",
  placeholder = "Choose a person…",
  searchPlaceholder = "Search by name, email, or position…",
}: Props) {
  const options = useMemo(() => {
    const rows = people
      .slice()
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map((person) => ({
        value: person.id,
        label: person.fullName,
        keywords: [person.email, person.jobTitle].filter(Boolean).join(" "),
        description: [person.jobTitle, person.email].filter(Boolean).join(" · ") || undefined,
      }));
    if (allowEmpty) {
      return [{ value: "", label: emptyLabel, keywords: "" }, ...rows];
    }
    return rows;
  }, [allowEmpty, emptyLabel, people]);

  return (
    <SearchableSelect
      id={id}
      className={className}
      disabled={disabled}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      noResultsLabel="No people match your search"
    />
  );
}

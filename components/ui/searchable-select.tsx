"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}

export function SearchableSelect({ options, value, onChange, placeholder = "Rechercher...", emptyLabel = "— Aucun —" }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="w-full flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm outline-none"
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {selected ? selected.label : emptyLabel}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              className="hover:text-foreground text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder={placeholder}
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            <button
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${!value ? "text-primary font-medium" : "text-muted-foreground"}`}
              onClick={() => { onChange(""); setOpen(false); }}
            >
              {emptyLabel}
            </button>
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${value === o.value ? "bg-primary/10 text-primary font-medium" : ""}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

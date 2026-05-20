import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { SearchInput } from "./SearchInput";

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

export function FilterSelect({ className, children, placeholder, ...props }: FilterSelectProps) {
  return (
    <select
      className={cn(
        "form-input h-9 text-sm pr-8 cursor-pointer min-w-[120px]",
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function FilterBar({
  search, onSearchChange, searchPlaceholder = "Search…",
  filters, hasActiveFilters, onClearFilters, className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {onSearchChange && (
        <SearchInput
          value={search ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={search ? () => onSearchChange("") : undefined}
          placeholder={searchPlaceholder}
          className="w-64"
        />
      )}
      {filters}
      {hasActiveFilters && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
        >
          <X size={13} />
          Clear filters
        </button>
      )}
    </div>
  );
}

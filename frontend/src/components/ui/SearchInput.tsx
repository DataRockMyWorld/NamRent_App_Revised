import { Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchInput({ className, value, onClear, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
        <Search size={15} />
      </span>
      <input
        className={cn(
          "form-input pl-9",
          value && onClear ? "pr-8" : "",
          "h-9 text-sm",
          className
        )}
        value={value}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

import { cn } from "@/utils/cn";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  className?: string;
}

// Vary skeleton cell widths for realism
const CELL_WIDTHS = ["w-28", "w-32", "w-20", "w-16", "w-24", "w-18", "w-20", "w-14", "w-22"];

export function TableSkeleton({ columns, rows = 6, className }: TableSkeletonProps) {
  return (
    <div className={cn("table-container", className)}>
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <div className={cn("skeleton h-2.5 rounded", i === 0 ? "w-20" : "w-14")} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  {c === columns - 1 ? (
                    <div className="skeleton h-4 w-4 rounded ml-auto" />
                  ) : (
                    <div className={cn("skeleton h-4 rounded", CELL_WIDTHS[(r + c) % CELL_WIDTHS.length])} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ListPageSkeletonProps {
  columns?: number;
  stats?: number;
}

export function ListPageSkeleton({ columns = 6, stats = 3 }: ListPageSkeletonProps) {
  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="skeleton h-7 w-36 rounded-lg mb-2" />
          <div className="skeleton h-3.5 w-24 rounded" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg" />
      </div>

      {/* Stat strip */}
      <div
        className="flex gap-px overflow-hidden mb-5 rounded-[var(--radius-md)] border border-[var(--color-border)]"
        style={{ background: "var(--color-border)" }}
      >
        {Array.from({ length: stats }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-[80px] px-4 py-3 flex flex-col gap-2 bg-[var(--color-bg-surface)]"
          >
            <div className="skeleton h-5 w-8 rounded" />
            <div className="skeleton h-2.5 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="skeleton h-9 w-64 rounded-lg mb-5" />

      {/* Table */}
      <TableSkeleton columns={columns} rows={6} />
    </div>
  );
}

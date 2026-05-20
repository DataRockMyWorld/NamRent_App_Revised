import { ChevronRight } from "lucide-react";

export interface PipelineStage {
  label: string;
  count: number;
  color?: string;
}

interface PipelineStripProps {
  stages: PipelineStage[];
}

export function PipelineStrip({ stages }: PipelineStripProps) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {stages.map((stage, i) => (
        <div key={stage.label} className="flex items-center gap-1 shrink-0">
          <div className="flex flex-col items-center px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] min-w-[80px]">
            <span
              className="text-xl font-bold leading-none"
              style={{ color: stage.color ?? "var(--color-text-heading)" }}
            >
              {stage.count}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mt-1 whitespace-nowrap">
              {stage.label}
            </span>
            {total > 0 && (
              <span className="text-[10px] text-[var(--color-text-disabled)] mt-0.5">
                {Math.round((stage.count / total) * 100)}%
              </span>
            )}
          </div>
          {i < stages.length - 1 && (
            <ChevronRight size={14} className="text-[var(--color-text-disabled)] shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

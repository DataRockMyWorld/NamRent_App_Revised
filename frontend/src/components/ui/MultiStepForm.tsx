import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

export interface StepDef {
  title: string;
  description?: string;
}

interface MultiStepFormProps {
  steps: StepDef[];
  currentStep: number; // 0-indexed
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function MultiStepForm({
  steps,
  currentStep,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  submitLabel = "Submit",
  children,
  className,
}: MultiStepFormProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {/* Step indicator */}
      <div className="flex items-start">
        {steps.map((step, i) => {
          const isComplete = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={i} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    (isComplete || isActive) && "bg-[var(--color-primary)] text-white",
                    isActive && "ring-4 ring-[var(--color-primary-tint)]",
                    !isComplete && !isActive && "bg-[var(--color-bg-subtle)] border-2 border-[var(--color-border)] text-[var(--color-text-muted)]"
                  )}
                >
                  {isComplete ? <Check size={14} strokeWidth={2.5} /> : <span>{i + 1}</span>}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold whitespace-nowrap text-center",
                    isActive ? "text-[var(--color-text-heading)]" : isComplete ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mt-4 mx-3",
                    i < currentStep ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step description */}
      {steps[currentStep]?.description && (
        <p className="text-sm text-[var(--color-text-muted)] -mt-4">{steps[currentStep].description}</p>
      )}

      {/* Content */}
      <div>{children}</div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
        <Button type="button" variant="secondary" onClick={onBack} disabled={isFirst}>
          ← Back
        </Button>
        {isLast ? (
          <Button type="button" onClick={onSubmit} loading={isSubmitting}>
            {submitLabel}
          </Button>
        ) : (
          <Button type="button" onClick={onNext}>
            Continue →
          </Button>
        )}
      </div>
    </div>
  );
}

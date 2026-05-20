interface DetailRowProps {
  label: string;
  value?: React.ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">
        {value ?? <span className="text-[var(--color-text-muted)]">—</span>}
      </span>
    </div>
  );
}

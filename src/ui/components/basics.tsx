import type { CSSProperties, ReactNode } from "react";

export function ProgressBar({ value, max, label, className = "" }: { value: number; max: number; label: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`bar ${className}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.max(0, value)}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
  color?: string;
}

/** Groupe de choix exclusifs, présenté en pastilles mais annoncé comme des boutons radio. */
export function OptionGroup<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      <span id={`opt-${label}`}>{label}</span>
      <div className="opts" role="radiogroup" aria-labelledby={`opt-${label}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={o.value === value ? "on" : ""}
            style={o.color ? ({ "--sc": o.color } as CSSProperties) : undefined}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function SectionTitle({ children, count, action }: { children: ReactNode; count?: string | number; action?: ReactNode }) {
  return (
    <h2>
      {children}
      {count !== undefined && <span className="count">{count}</span>}
      {action && (
        <>
          <span className="sp" />
          {action}
        </>
      )}
    </h2>
  );
}

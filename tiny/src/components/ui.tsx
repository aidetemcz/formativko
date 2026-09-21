import { ReactNode } from "react";
import { Link } from "react-router-dom";

// Mid-fi stavební prvky. Záměrně střídmé — prototyp, ne finální vizuál.

export function Karta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-line bg-surface ${className}`}>{children}</div>;
}

export function Nadpis({ children, popis }: { children: ReactNode; popis?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold">{children}</h1>
      {popis && <p className="mt-1 text-sm text-muted">{popis}</p>}
    </div>
  );
}

export function Tlacitko({
  children,
  onClick,
  to,
  varianta = "hlavni",
  disabled,
  typ = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  varianta?: "hlavni" | "vedlejsi";
  disabled?: boolean;
  typ?: "button" | "submit";
}) {
  const styl =
    varianta === "hlavni"
      ? "bg-accent text-white border-accent hover:opacity-90"
      : "bg-surface text-ink border-line hover:bg-canvas";
  const tridy = `inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${styl}`;

  if (to) {
    return (
      <Link to={to} className={tridy}>
        {children}
      </Link>
    );
  }
  return (
    <button type={typ} onClick={onClick} disabled={disabled} className={tridy}>
      {children}
    </button>
  );
}

export function Stitek({ children, tlumeny = false }: { children: ReactNode; tlumeny?: boolean }) {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-xs ${
        tlumeny ? "border-line text-muted" : "border-accent/40 bg-accent/5 text-accent"
      }`}
    >
      {children}
    </span>
  );
}

export function Pole({
  label,
  value,
  onChange,
  placeholder,
  vicerádkove = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  vicerádkove?: boolean;
}) {
  const tridy =
    "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {vicerádkove ? (
        <textarea rows={4} className={tridy} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={tridy} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function Prazdno({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function Sekce({ titulek, akce, children }: { titulek: string; akce?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{titulek}</h2>
        {akce}
      </div>
      {children}
    </section>
  );
}

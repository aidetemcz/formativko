import { NavLink, Outlet } from "react-router-dom";

const polozky = [
  { to: "/", label: "Přehled", konec: true },
  { to: "/plany", label: "Tematické plány" },
  { to: "/archy", label: "Testovací archy" },
  { to: "/zaci", label: "Žáci a důkazy" },
];

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
          <span className="font-semibold">Tiny</span>
          <span className="rounded border border-line px-1.5 py-0.5 text-xs text-muted">
            prototyp v1
          </span>
          <nav className="ml-auto flex gap-1 text-sm">
            {polozky.map((p) => (
              <NavLink
                key={p.to}
                to={p.to}
                end={p.konec}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 ${isActive ? "bg-canvas font-medium" : "text-muted hover:text-ink"}`
                }
              >
                {p.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

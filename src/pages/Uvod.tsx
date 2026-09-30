import { Link } from "react-router-dom";
import { Book, FileText, GraduationCap, Lightbulb, Search, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { greeting, vocative } from "@/lib/greeting";

const SHORTCUTS = [
  { to: "/predmety", icon: Book, title: "Předměty a plány", text: "Tematické plány a lekce s cíli a kritérii." },
  { to: "/tridy", icon: GraduationCap, title: "Třídy a žáci", text: "Kdo je připravený na hodnocení." },
  { to: "/napady", icon: Lightbulb, title: "Doplnit úrovně", text: "Rychlé otázky na chybějící úrovně." },
  { to: "/hodnoceni", icon: FileText, title: "Hodnocení", text: "Slovní hodnocení z důkazů o učení." },
];

/**
 * The welcome page (zadání kap. 5). TinyBuddy — searching everything, answering
 * questions over the data, proposing changes — arrives in phase 10; until then
 * the page greets the teacher and offers the main ways in.
 */
export default function Uvod() {
  usePageTitle("Úvod");
  const { displayName } = useProfile();
  const hello = greeting(new Date().getHours());

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl pt-6">
        <h1 className="text-3xl font-medium">
          {hello}
          {displayName ? `, ${vocative(displayName)}` : ""}.
        </h1>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-muted-foreground">
          <Search className="h-5 w-5 shrink-0 text-subtle" />
          <span className="flex-1 text-sm">Zeptejte se Buddyho nebo hledejte…</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs text-brand-strong">
            <Sparkles className="h-3 w-3" />
            Brzy
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          TinyBuddy bude umět najít cokoli, co jste vytvořili, a navrhnout úpravy lekcí. Zatím použijte zkratky níže.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-input"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <s.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block font-medium">{s.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{s.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

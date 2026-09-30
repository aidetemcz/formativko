import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Public self-assessment page for pupils (/s/:token): no login, no menu.
 * The online exit ticket arrives in phase 8; nothing is read or written here
 * yet, so an early link shows a calm message instead of an error.
 */
export default function SebehodnoceniVerejne() {
  usePageTitle("Exitka");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-sm rounded-2xl border bg-card p-8 text-center">
        <p className="text-lg font-medium">Exitka tu zatím není</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Počkej, až ti paní učitelka nebo pan učitel ukáže nový kód.
        </p>
      </div>
    </div>
  );
}

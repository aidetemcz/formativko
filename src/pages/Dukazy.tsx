import { Link } from "react-router-dom";
import { Camera } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Overview of all proofs with filters — rebuilt in phase 9. */
export default function Dukazy() {
  usePageTitle("Důkazy o učení");
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Důkazy o učení"
          help="Všechno, co o učení žáků víte: fotky prací, poznámky, nahrávky a úrovně u kritérií. Z nich pak vzniká hodnocení."
        />
        <EmptyState
          icon={Camera}
          title="Přehled důkazů se připravuje"
          action={
            <Button asChild variant="outline">
              <Link to="/tridy">Otevřít třídy</Link>
            </Button>
          }
        >
          Tady budou důkazy všech žáků s filtrem podle třídy, předmětu a období. Do té doby je najdete v profilu každého žáka.
        </EmptyState>
      </div>
    </AppLayout>
  );
}

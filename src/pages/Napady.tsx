import { Link } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Quick questions on missing levels (zadání kap. 4.6) — built in phase 9. */
export default function Napady() {
  usePageTitle("Nápady");
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Nápady"
          help="Rychlé doplnění úrovní, které vám u žáků chybějí. Odpovídáte jedním ťuknutím na J, Č, T nebo Ú."
        />
        <EmptyState
          icon={Lightbulb}
          title="Nápady se připravují"
          action={
            <Button asChild variant="outline">
              <Link to="/predmety">Otevřít předměty</Link>
            </Button>
          }
        >
          Až budou mít lekce kritéria, nabídneme vám tu otázky typu „Na jaké úrovni je Adam B. v kritériu Popíšu části rostliny?“ U každé uvidíte, co už o žákovi víte.
        </EmptyState>
      </div>
    </AppLayout>
  );
}

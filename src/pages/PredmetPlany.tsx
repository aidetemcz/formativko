import { Link, useParams } from "react-router-dom";
import { CalendarRange, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/ListSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/useCourses";
import { useSubject } from "@/hooks/useSubjects";
import { usePageTitle } from "@/hooks/usePageTitle";
import { subjectChipClasses } from "@/constants/subjectColors";

/** Thematic plans of one subject, as cards (zadání kap. 4.3). */
export default function PredmetPlany() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { data: subject } = useSubject(subjectId);
  const { data: courses = [], isLoading } = useCourses();
  const plans = courses.filter((c) => c.subject_id === subjectId);
  usePageTitle(subject?.name ?? "Předmět");

  const newPlan = (
    <Button asChild>
      <Link to={`/courses/create?predmet=${subjectId}`}>
        <Plus />
        Nový plán
      </Link>
    </Button>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          breadcrumbs={[{ label: "Předměty", href: "/predmety" }, { label: subject?.name ?? "…" }]}
          title={subject?.name ?? "Předmět"}
          help="Tematické plány tohoto předmětu. Plán patří k jedné třídě a rozpadá se na lekce po měsících."
          actions={plans.length > 0 ? newPlan : undefined}
        />

        {isLoading ? (
          <ListSkeleton />
        ) : plans.length === 0 ? (
          <EmptyState icon={CalendarRange} title="Zatím tu není žádný plán" action={newPlan}>
            Vytvořte tematický plán pro třídu, ve které předmět učíte. Můžete začít prázdnou tabulkou, nebo nahrát plán, který už máte.
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                to={`/plany/${plan.id}`}
                className="rounded-xl border bg-card p-4 transition-colors hover:border-input"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="plain" className={subjectChipClasses(subject?.name)}>
                    {subject?.name}
                  </Badge>
                  {plan.classes?.name && <Badge variant="outline">{plan.classes.name}</Badge>}
                </div>
                <p className="mt-3 font-medium">{plan.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

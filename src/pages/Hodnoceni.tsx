import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/ListSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvaluationBatches, type EvaluationBatchSummary } from "@/hooks/useEvaluations";
import { usePageTitle } from "@/hooks/usePageTitle";
import { schoolPeriods } from "@/constants/schoolYear";
import { subjectChipClasses } from "@/constants/subjectColors";
import { MODE_LABELS, evaluationStatus, type EvaluationMode } from "@/lib/evaluations";

const ALL = "vse";

function modeOf(b: EvaluationBatchSummary): EvaluationMode {
  return b.mode ?? (b.type === "vysvedceni" ? "certificate" : "feedback");
}

/**
 * Hodnocení (zadání kap. 4.5, Veroničin HodnoceniView): the batches the
 * teacher generated, newest first, with how many texts are approved.
 */
export default function Hodnoceni() {
  usePageTitle("Hodnocení");
  const { data: batches = [], isLoading } = useEvaluationBatches();
  const periods = useMemo(() => schoolPeriods(new Date()), []);
  const [classId, setClassId] = useState(ALL);
  const [periodId, setPeriodId] = useState(ALL);
  const [mode, setMode] = useState(ALL);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of batches) if (b.classes) map.set(b.classes.id, b.classes.name);
    return [...map].sort((a, b) => a[1].localeCompare(b[1], "cs"));
  }, [batches]);

  const period = periods.find((p) => p.id === periodId);
  const filtered = batches.filter((b) => {
    if (classId !== ALL && b.classes?.id !== classId) return false;
    if (mode !== ALL && modeOf(b) !== mode) return false;
    if (period) {
      const from = b.date_from ?? b.created_at.slice(0, 10);
      const to = b.date_to ?? from;
      if (to < period.from || from > period.to) return false;
    }
    return true;
  });

  const newButton = (
    <Button asChild>
      <Link to="/hodnoceni/nove">
        <Sparkles />
        Vygenerovat hodnocení
      </Link>
    </Button>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Hodnocení"
          help="Slovní hodnocení, které Buddy sestaví z důkazů o učení a úrovní u kritérií. Popisuje pokrok žáka místo známky. Vy ho projdete, upravíte a schválíte."
          actions={batches.length > 0 ? newButton : undefined}
        />

        {isLoading ? (
          <ListSkeleton variant="row" />
        ) : batches.length === 0 ? (
          <EmptyState icon={FileText} title="Slovní hodnocení psané za vás" action={newButton}>
            Z důkazů o učení, které jste u žáků nasbírali, sestaví Buddy návrh hodnocení pro celou třídu najednou. Vy ho
            pak projdete, doladíte vlastními slovy a schválíte.
          </EmptyState>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger aria-label="Třída" className="w-40 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Všechny třídy</SelectItem>
                  {classOptions.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger aria-label="Období" className="w-56 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Všechna období</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger aria-label="Druh" className="w-56 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Všechny druhy</SelectItem>
                  {(Object.keys(MODE_LABELS) as EvaluationMode[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Žádné hodnocení neodpovídá filtru.</p>
            ) : (
              <ul className="space-y-2">
                {filtered.map((b) => {
                  const total = b.evaluations.length;
                  const approved = b.evaluations.filter((e) => evaluationStatus(e.status) === "approved").length;
                  return (
                    <li key={b.id}>
                      <Link
                        to={`/hodnoceni/${b.id}`}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{b.name}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {b.subjects && (
                              <Badge variant="plain" className={subjectChipClasses(b.subjects.name)}>
                                {b.subjects.name}
                              </Badge>
                            )}
                            <span>{MODE_LABELS[modeOf(b)]}</span>
                            <span>· vytvořeno {new Date(b.created_at).toLocaleDateString("cs-CZ")}</span>
                          </span>
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          Schváleno <span className="font-medium text-foreground">{approved}</span> z {total}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Camera, FileText, Lightbulb, Mic, Paperclip, Pencil, UserPlus, Users } from "lucide-react";
import { ImportPupilsDialog } from "@/components/shared/ImportPupilsDialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/ListSkeleton";
import { ReadinessBadge } from "@/components/shared/ReadinessBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClasses } from "@/hooks/useClasses";
import { useClassOverview, type ProofKind } from "@/hooks/useClassOverview";
import { usePageTitle } from "@/hooks/usePageTitle";
import { currentPeriod, schoolPeriods } from "@/constants/schoolYear";
import { READINESS_LABELS, type Readiness } from "@/lib/readiness";

const PROOF_COLUMNS: { kind: ProofKind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: "text", label: "Poznámky", icon: FileText },
  { kind: "camera", label: "Fotky", icon: Camera },
  { kind: "voice", label: "Nahrávky", icon: Mic },
  { kind: "file", label: "Soubory", icon: Paperclip },
];

const SUMMARY_ORDER: Readiness[] = ["ready", "partial", "missing"];

/**
 * A class (zadání kap. 4.4, Veronika's ClassesView): its pupils with their
 * proofs by type and the readiness semafor for the chosen term.
 */
export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const { data: classes = [] } = useClasses();
  const cls = classes.find((c) => c.id === classId);
  usePageTitle(cls?.name ?? "Třída");

  const periods = useMemo(() => schoolPeriods(new Date()), []);
  const [periodId, setPeriodId] = useState(() => currentPeriod(new Date()).id);
  const period = periods.find((p) => p.id === periodId) ?? periods[0];
  const { data, isLoading } = useClassOverview(classId, period);
  const [importOpen, setImportOpen] = useState(false);
  const addPupils = (
    <Button variant="outline" onClick={() => setImportOpen(true)}>
      <UserPlus />
      Přidat žáky
    </Button>
  );

  const summary = SUMMARY_ORDER.map((status) => ({
    status,
    count: data?.rows.filter((r) => r.readiness.status === status).length ?? 0,
  }));
  const anyMissing = data?.rows.some((r) => r.readiness.status === "partial" || r.readiness.status === "missing");

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          breadcrumbs={[{ label: "Třídy", href: "/tridy" }, { label: cls?.name ?? "…" }]}
          title={cls?.name ?? "Třída"}
          help="Žáci třídy s počty důkazů o učení a semaforem připravenosti. Žák je připravený na hodnocení, když od vás má úroveň u všech kritérií lekcí, které jste v období probrali."
          actions={
            <>
              <Button asChild variant="ghost">
                <Link to={`/tridy/${classId}/upravit`}>
                  <Pencil />
                  Upravit třídu
                </Link>
              </Button>
              {data && data.rows.length > 0 && addPupils}
              {anyMissing && (
                <Button asChild>
                  <Link to={`/napady?trida=${classId}`}>
                    <Lightbulb />
                    Doplnit chybějící
                  </Link>
                </Button>
              )}
            </>
          }
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Select value={periodId} onValueChange={setPeriodId}>
            <SelectTrigger aria-label="Období" className="w-56 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data && data.taughtLessons > 0 && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {summary.map((s) => (
                <span key={s.status}>
                  {READINESS_LABELS[s.status]}: <span className="font-medium text-foreground">{s.count}</span>
                </span>
              ))}
              <span>· probráno {data.taughtLessons} lekcí, {data.taughtCriteria} kritérií</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <ListSkeleton variant="row" />
        ) : !data || data.rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Třída zatím nemá žáky"
            action={addPupils}
          >
            Jména můžete vložit ze seznamu, nebo nahrát fotku či PDF třídní listiny.
          </EmptyState>
        ) : (
          <>
            {data.taughtLessons === 0 && (
              <p className="mb-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                V tomto období zatím nemáte žádnou lekci označenou jako probranou. Semafor se rozsvítí, až lekci v plánu
                označíte <span className="font-medium text-foreground">Probráno</span>.
              </p>
            )}
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Žák</TableHead>
                    {PROOF_COLUMNS.map((c) => (
                      <TableHead key={c.kind} className="text-center" title={c.label}>
                        <c.icon className="mx-auto h-4 w-4" aria-label={c.label} />
                      </TableHead>
                    ))}
                    <TableHead>Připravenost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map(({ pupil, proofs, readiness }) => (
                    <TableRow key={pupil.id}>
                      <TableCell>
                        <Link to={`/zaci/${pupil.id}`} className="font-medium hover:underline">
                          {pupil.first_name} {pupil.last_name}
                        </Link>
                        {pupil.svp && (
                          <Badge variant="outline" className="ml-2 text-[0.625rem]">
                            SVP
                          </Badge>
                        )}
                      </TableCell>
                      {PROOF_COLUMNS.map((c) => (
                        <TableCell key={c.kind} className={`text-center tabular-nums ${proofs[c.kind] ? "" : "text-subtle"}`}>
                          {proofs[c.kind]}
                        </TableCell>
                      ))}
                      <TableCell>
                        <ReadinessBadge result={readiness} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
      {classId && <ImportPupilsDialog classId={classId} open={importOpen} onOpenChange={setImportOpen} />}
    </AppLayout>
  );
}

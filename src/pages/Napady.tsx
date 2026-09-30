import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LevelChip } from "@/components/shared/LevelChip";
import { ListSkeleton } from "@/components/shared/ListSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/useClasses";
import { useNapadyQuestions } from "@/hooks/useNapady";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useRecordLevels } from "@/hooks/useRecordLevels";
import { useSubjects } from "@/hooks/useSubjects";
import { JCTU_LEVELS, type JctuCode } from "@/constants/jctu";
import { currentPeriod, schoolPeriods, shortPupilName } from "@/constants/schoolYear";
import { subjectChipClasses } from "@/constants/subjectColors";
import { NAPADY_BATCH } from "@/lib/napady";

const ALL = "vse";

/**
 * Nápady (zadání kap. 4.6): quick questions on the pupil × criterion pairs of
 * taught lessons that still have no level from the teacher. One tap on J/Č/T/Ú
 * records the level; "Nevím" skips the question for now.
 */
export default function Napady() {
  usePageTitle("Nápady");
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const periods = useMemo(() => schoolPeriods(new Date()), []);
  const classId = params.get("trida") ?? ALL;
  const subjectId = params.get("predmet") ?? ALL;
  const periodId = params.get("obdobi") ?? currentPeriod(new Date()).id;
  const period = periods.find((p) => p.id === periodId) ?? periods[0];

  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: questions, isLoading, refetch, isFetching } = useNapadyQuestions({
    classId: classId === ALL ? undefined : classId,
    subjectId: subjectId === ALL ? undefined : subjectId,
    period,
  });
  const record = useRecordLevels();

  const [batch, setBatch] = useState<string[] | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const filterKey = `${classId}|${subjectId}|${periodId}`;
  useEffect(() => {
    setBatch(null);
    setAnswered(new Set());
    setSkipped(new Set());
  }, [filterKey]);

  // A batch is fixed when it starts, so answering does not move the questions around.
  useEffect(() => {
    if (batch === null && questions && !isFetching) {
      setBatch(questions.filter((q) => !skipped.has(q.key)).slice(0, NAPADY_BATCH).map((q) => q.key));
    }
  }, [batch, questions, isFetching, skipped]);

  const byKey = useMemo(() => new Map((questions ?? []).map((q) => [q.key, q])), [questions]);
  const open = (batch ?? []).filter((k) => !answered.has(k) && !skipped.has(k));
  const current = open.length ? byKey.get(open[0]) : undefined;
  const done = (batch ?? []).length - open.length;
  const outsideBatch = (questions ?? []).filter((q) => !(batch ?? []).includes(q.key) && !skipped.has(q.key)).length;

  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === ALL) next.delete(name);
    else next.set(name, value);
    setParams(next, { replace: true });
  };

  const answer = (level: JctuCode) => {
    if (!current) return;
    const key = current.key;
    setAnswered((prev) => new Set(prev).add(key));
    record.mutate(
      { studentIds: [current.pupil.id], criterionId: current.criterion.id, level, lessonId: current.lesson.id },
      {
        onError: (e) => {
          setAnswered((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          toast({ title: "Úroveň se nepodařilo uložit", description: e.message, variant: "destructive" });
        },
      },
    );
  };

  const nextBatch = async () => {
    await refetch();
    setAnswered(new Set());
    setBatch(null);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Nápady"
          help="Ptáme se na úrovně, které vám u žáků v probraných lekcích chybějí. Každá odpověď se uloží jako vaše hodnocení v kritériu a počítá se do semaforu připravenosti."
        />

        <div className="mb-5 flex flex-wrap gap-2">
          <Select value={classId} onValueChange={(v) => setFilter("trida", v)}>
            <SelectTrigger aria-label="Třída" className="w-44 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Všechny třídy</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subjectId} onValueChange={(v) => setFilter("predmet", v)}>
            <SelectTrigger aria-label="Předmět" className="w-48 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Všechny předměty</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period.id} onValueChange={(v) => setFilter("obdobi", v)}>
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
        </div>

        {isLoading || batch === null ? (
          <ListSkeleton count={1} />
        ) : !current ? (
          (questions ?? []).length === 0 && done === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Zatím se není na co ptát"
              action={
                <Button asChild variant="outline">
                  <Link to="/predmety">Otevřít předměty</Link>
                </Button>
              }
            >
              Otázky vzniknou z lekcí, které mají kritéria a jsou v plánu označené jako{" "}
              <span className="font-medium text-foreground">Probráno</span>. U všech takových lekcí v tomto výběru už
              úrovně máte.
            </EmptyState>
          ) : (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="font-medium">
                {outsideBatch > 0 || skipped.size > 0 ? "Dávku máte za sebou" : "Hotovo, nic dalšího nechybí"}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {outsideBatch > 0
                  ? `Čeká ještě ${outsideBatch} ${outsideBatch < 5 ? "otázky" : "otázek"}.`
                  : skipped.size > 0
                    ? "Přeskočené otázky můžete vrátit, nebo si je nechat na příště."
                    : "U probraných lekcí máte úrovně zaznamenané. Můžete psát hodnocení."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {outsideBatch > 0 && (
                  <Button onClick={nextBatch} disabled={isFetching}>
                    Další dávka
                  </Button>
                )}
                {skipped.size > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSkipped(new Set());
                      nextBatch();
                    }}
                  >
                    Vrátit přeskočené ({skipped.size})
                  </Button>
                )}
                {outsideBatch === 0 && (
                  <Button asChild variant="outline">
                    <Link to="/hodnoceni/nove">Psát hodnocení</Link>
                  </Button>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-brand">
              Dávka · otázka {done + 1} z {batch.length}
            </p>
            <p className="mt-2 text-lg leading-snug">
              Na jaké úrovni je <span className="font-medium">{shortPupilName(current.pupil)}</span> v kritériu „
              {current.criterion.text.replace(/[.!]\s*$/, "")}“?
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {current.lesson.subject && (
                <Badge variant="plain" className={subjectChipClasses(current.lesson.subject)}>
                  {current.lesson.subject}
                </Badge>
              )}
              <span>
                {current.lesson.className} ·{" "}
                <Link to={`/lekce/${current.lesson.id}`} className="hover:underline">
                  {current.lesson.title}
                </Link>
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Co už víme</p>
              {current.selfLevel || current.lastProof ? (
                <ul className="mt-1 space-y-1">
                  {current.selfLevel && (
                    <li className="flex items-center gap-2">
                      Sebehodnocení z exitky: <LevelChip level={current.selfLevel} withLabel />
                    </li>
                  )}
                  {current.lastProof && (
                    <li>
                      Poslední důkaz z lekce: {current.lastProof.title} ·{" "}
                      {new Date(current.lastProof.date).toLocaleDateString("cs-CZ")}
                    </li>
                  )}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">Z této lekce zatím nemáte od žáka nic zaznamenaného.</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {JCTU_LEVELS.map((l) => (
                <Button
                  key={l.code}
                  variant="outline"
                  className="h-auto flex-col gap-1.5 py-3"
                  onClick={() => answer(l.code)}
                >
                  <LevelChip level={l.code} />
                  <span className="text-xs font-normal text-muted-foreground">{l.label}</span>
                </Button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSkipped((prev) => new Set(prev).add(current.key))}>
                Nevím, zjistím v hodině
              </Button>
              <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-brand transition-all"
                  style={{ width: `${(done / batch.length) * 100}%` }}
                />
              </span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {open.length} zbývá{outsideBatch > 0 ? ` · ${outsideBatch} další` : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

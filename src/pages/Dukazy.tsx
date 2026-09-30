import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/ListSkeleton";
import { SearchBar } from "@/components/shared/SearchBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAllClassStudents, useClasses } from "@/hooks/useClasses";
import { useDeleteAssessment, useEvidenceFeed } from "@/hooks/useEvidenceFeed";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useDeleteProof } from "@/hooks/useProofs";
import { useSubjects } from "@/hooks/useSubjects";
import { currentPeriod, schoolPeriods } from "@/constants/schoolYear";
import {
  EVIDENCE_KIND_LABELS,
  filterEvidence,
  pluralRecords,
  type EvidenceItem,
  type EvidenceKind,
} from "@/lib/evidence";

const ALL = "vse";
const PAGE = 40;
const KINDS: EvidenceKind[] = ["level", "text", "camera", "voice", "file"];

function FilterSelect({
  label,
  value,
  onChange,
  allLabel,
  options,
  className = "sm:w-44",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={`w-full ${className} bg-card`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Důkazy o učení (zadání kap. 4.5, Veroničin DukazyView): every proof and
 * every level the teacher recorded, newest first, filtered by subject, class,
 * pupil, lesson, period and kind.
 */
export default function Dukazy() {
  usePageTitle("Důkazy o učení");
  const { toast } = useToast();
  const periods = useMemo(() => schoolPeriods(new Date()), []);
  const [periodId, setPeriodId] = useState(() => currentPeriod(new Date()).id);
  const period = periods.find((p) => p.id === periodId) ?? periods[0];
  const [subjectId, setSubjectId] = useState(ALL);
  const [classId, setClassId] = useState(ALL);
  const [studentId, setStudentId] = useState(ALL);
  const [lessonId, setLessonId] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [toDelete, setToDelete] = useState<EvidenceItem | null>(null);

  const { data: items = [], isLoading } = useEvidenceFeed(period);
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: memberships = [] } = useAllClassStudents();
  const deleteProof = useDeleteProof();
  const deleteLevel = useDeleteAssessment();

  const classOf = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of memberships) map.set(m.student_id, [...(map.get(m.student_id) ?? []), m.class_id]);
    return map;
  }, [memberships]);

  const pupilOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of items) {
      for (const p of i.pupils) {
        if (classId !== ALL && !(classOf.get(p.id) ?? []).includes(classId)) continue;
        map.set(p.id, `${p.last_name} ${p.first_name}`);
      }
    }
    return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "cs"));
  }, [items, classId, classOf]);

  const lessonOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of items) {
      if (!i.lesson) continue;
      if (classId !== ALL && i.lesson.class_id !== classId) continue;
      if (subjectId !== ALL && i.lesson.subject_id !== subjectId) continue;
      map.set(i.lesson.id, i.lesson.title);
    }
    return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "cs"));
  }, [items, classId, subjectId]);

  const filtered = useMemo(
    () =>
      filterEvidence(
        items,
        {
          subjectId: subjectId === ALL ? undefined : subjectId,
          classId: classId === ALL ? undefined : classId,
          studentId: studentId === ALL ? undefined : studentId,
          lessonId: lessonId === ALL ? undefined : lessonId,
          kind: kind === ALL ? undefined : (kind as EvidenceKind),
          search,
        },
        classOf,
      ),
    [items, subjectId, classId, studentId, lessonId, kind, search, classOf],
  );

  const active = [subjectId, classId, studentId, lessonId, kind].filter((v) => v !== ALL).length + (search.trim() ? 1 : 0);
  const reset = () => {
    setSubjectId(ALL);
    setClassId(ALL);
    setStudentId(ALL);
    setLessonId(ALL);
    setKind(ALL);
    setSearch("");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (toDelete.kind === "level") await deleteLevel.mutateAsync(toDelete.id);
      else await deleteProof.mutateAsync(toDelete.id);
      toast({ title: toDelete.kind === "level" ? "Úroveň odstraněna" : "Důkaz odstraněn" });
    } catch (e) {
      toast({ title: "Nepodařilo se odstranit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setToDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Důkazy o učení"
          help="Důkaz o učení je konkrétní stopa toho, co žák umí: zaznamenaná úroveň u kritéria, fotka práce, nahrávka nebo vaše poznámka. Z důkazů pak vzniká slovní hodnocení."
          description={isLoading ? undefined : `${filtered.length} ${pluralRecords(filtered.length)}`}
          actions={
            <Button asChild>
              <Link to="/capture">
                <Users />
                Zaznamenat důkazy v hodině
              </Link>
            </Button>
          }
        />

        <div className="mb-5 space-y-2 rounded-2xl border bg-card p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <FilterSelect
              label="Předmět"
              value={subjectId}
              onChange={(v) => {
                setSubjectId(v);
                setLessonId(ALL);
              }}
              allLabel="Všechny předměty"
              options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            />
            <FilterSelect
              label="Třída"
              value={classId}
              onChange={(v) => {
                setClassId(v);
                setStudentId(ALL);
                setLessonId(ALL);
              }}
              allLabel="Všechny třídy"
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              className="sm:w-36"
            />
            <FilterSelect
              label="Žák"
              value={studentId}
              onChange={setStudentId}
              allLabel="Všichni žáci"
              options={pupilOptions}
            />
            <FilterSelect
              label="Lekce"
              value={lessonId}
              onChange={setLessonId}
              allLabel="Všechny lekce"
              options={lessonOptions}
              className="sm:w-56"
            />
            <FilterSelect
              label="Druh"
              value={kind}
              onChange={setKind}
              allLabel="Všechny druhy"
              options={KINDS.map((k) => ({ value: k, label: EVIDENCE_KIND_LABELS[k] }))}
              className="sm:w-40"
            />
            <FilterSelect
              label="Období"
              value={period.id}
              onChange={setPeriodId}
              options={periods.map((p) => ({ value: p.id, label: p.label }))}
              className="sm:w-56"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} placeholder="Hledat ve jménech, kritériích a poznámkách…" />
            </div>
            {active > 0 && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Zrušit filtry ({active})
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton variant="row" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Zachyťte, co jste v hodině viděli"
            action={
              <Button asChild>
                <Link to="/capture">Zaznamenat první důkaz</Link>
              </Button>
            }
          >
            Stačí pár vteřin přímo v hodině: úroveň u kritéria, fotka práce, nahrávka nebo poznámka. Na konci období
            z nich vznikne hodnocení. V tomto období zatím nic zaznamenaného nemáte.
          </EmptyState>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Žádné záznamy neodpovídají vybraným filtrům.</p>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, shown).map((item) => (
              <EvidenceCard
                key={item.key}
                item={item}
                hidePupil={studentId !== ALL}
                onDelete={() => setToDelete(item)}
              />
            ))}
            {filtered.length > shown && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                  Zobrazit další ({filtered.length - shown})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toDelete?.kind === "level" ? "Odstranit úroveň?" : "Odstranit důkaz?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.kind === "level"
                ? "Žákovi zůstane jeho předchozí úroveň v tomto kritériu, pokud nějakou měl."
                : "Důkaz zmizí u všech žáků, ke kterým patří. Tuto akci nelze vrátit."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Odstranit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

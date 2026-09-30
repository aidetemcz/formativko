import { useCallback, useEffect, useState } from "react";
import { groupByMonth } from "@/lib/lessons";
import { SCHOOL_MONTHS, gradeFromClassName, schoolMonthOf } from "@/constants/schoolYear";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, BookOpen, CheckCircle2, FileUp, Loader2, Pencil, Plus, RotateCcw, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/ListSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/useCourses";
import { saveLessonCriteria, saveLessonGoal, useCreatePlanLesson, usePlanLessons } from "@/hooks/usePlanLessons";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { invokeAi } from "@/lib/ai";
import { generateLessonContent, runQueue, type GenerationStatus } from "@/lib/lessonGeneration";
import { PlanImportDialog } from "@/components/lesson/PlanImportDialog";
import { GenerateLessonsDialog } from "@/components/lesson/GenerateLessonsDialog";
import { usePageTitle } from "@/hooks/usePageTitle";

import { subjectChipClasses } from "@/constants/subjectColors";

/** Where a lesson is in the generation queue, with a retry after an error. */
function GenerationBadge({
  state,
  onRetry,
}: {
  state?: { state: GenerationStatus; error?: string };
  onRetry: (e: React.MouseEvent) => void;
}) {
  if (!state) return null;
  if (state.state === "waiting") return <span className="shrink-0 text-xs text-muted-foreground">Čeká…</span>;
  if (state.state === "running")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-brand-strong">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Připravuji
      </span>
    );
  if (state.state === "done")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-brand-strong">
        <Sparkles className="h-3.5 w-3.5" />
        Hotovo
      </span>
    );
  return (
    <button
      type="button"
      onClick={onRetry}
      title={state.error}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-destructive/40 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
    >
      <AlertCircle className="h-3.5 w-3.5" />
      Chyba · zkusit znovu
      <RotateCcw className="h-3 w-3" />
    </button>
  );
}

/**
 * A thematic plan: its lessons month by month (zadání kap. 4.3). Lessons come
 * from the teacher by hand or from a plan she already has (Načíst plán); goals
 * and criteria are then generated one lesson at a time (Vygenerovat lekce).
 */
export default function PlanDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: course } = useCourse(courseId);
  const { data: lessons = [], isLoading } = usePlanLessons(courseId);
  const createLesson = useCreatePlanLesson();
  usePageTitle(course?.name ?? "Plán");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState<string>(schoolMonthOf(new Date()));
  const [hours, setHours] = useState("1");
  const [description, setDescription] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  /** Generation status per lesson; lessons not in the map are idle. */
  const [status, setStatus] = useState<Record<string, { state: GenerationStatus; error?: string }>>({});
  const running = Object.values(status).some((s) => s.state === "waiting" || s.state === "running");

  // Closing the tab stops the queue; say so before it happens.
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  const generate = useCallback(
    async (ids: string[]) => {
      if (!course || !user) return;
      const ctx = { subject: course.subjects?.name ?? "", grade: gradeFromClassName(course.classes?.name) };
      const byId = new Map(lessons.map((l) => [l.id, l]));
      await runQueue(
        ids.map((id) => byId.get(id)!).filter(Boolean),
        (lesson) =>
          generateLessonContent(lesson, ctx, {
            invoke: invokeAi,
            saveGoal: (lessonId, goal) =>
              saveLessonGoal(user.id, {
                lesson: { ...lesson, id: lessonId, courses: { id: course.id, name: course.name, classes: course.classes ?? null, subjects: course.subjects ?? null } },
                goalId: null,
                teacher: goal.teacher,
                pupil: goal.pupil,
              }),
            saveCriteria: (goalId, criteria) => saveLessonCriteria({ goalId, existingIds: [], criteria }),
          }).then(() => queryClient.invalidateQueries({ queryKey: ["plan_lessons", course.id] })),
        (id, state, error) => setStatus((prev) => ({ ...prev, [id]: { state, error } })),
      );
    },
    [course, user, lessons, queryClient],
  );

  const create = async () => {
    if (!course || !title.trim()) return;
    const h = hours.trim() ? Number(hours.replace(",", ".")) : null;
    try {
      const lesson = await createLesson.mutateAsync({
        course,
        title: title.trim(),
        month,
        hours: h !== null && !Number.isNaN(h) ? h : null,
        description: description.trim(),
        position: lessons.length + 1,
      });
      setOpen(false);
      navigate(`/lekce/${lesson.id}`);
    } catch (e) {
      toast({ title: "Lekci se nepodařilo vytvořit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  const newLesson = (
    <Button
      onClick={() => {
        setTitle("");
        setDescription("");
        setOpen(true);
      }}
    >
      <Plus />
      Nová lekce
    </Button>
  );

  const subject = course?.subjects;
  const groups = groupByMonth(lessons);
  const withoutGoal = lessons.filter((l) => !l.goalTitle && status[l.id]?.state !== "done");

  const importPlan = (
    <Button variant="outline" onClick={() => setImportOpen(true)}>
      <FileUp />
      Načíst plán
    </Button>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          breadcrumbs={[
            { label: "Předměty", href: "/predmety" },
            ...(subject ? [{ label: subject.name, href: `/predmety/${subject.id}` }] : []),
            { label: course?.name ?? "…" },
          ]}
          title={course?.name ?? "Plán"}
          help="Tematický plán po měsících. Každá lekce má jeden výukový cíl a tři kritéria hodnocení ve verzi pro učitele i pro žáky."
          actions={
            <>
              <Button asChild variant="ghost">
                <Link to={`/courses/${courseId}/edit`}>
                  <Pencil />
                  Upravit plán
                </Link>
              </Button>
              {importPlan}
              {withoutGoal.length > 0 && (
                <Button variant="brand" onClick={() => setGenerateOpen(true)} disabled={running}>
                  {running ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {running ? "Generuji lekce…" : "Vygenerovat lekce"}
                </Button>
              )}
              {newLesson}
            </>
          }
          description={
            <span className="inline-flex flex-wrap items-center gap-1.5">
              {subject && (
                <Badge variant="plain" className={subjectChipClasses(subject.name)}>
                  {subject.name}
                </Badge>
              )}
              {course?.classes?.name && <Badge variant="outline">{course.classes.name}</Badge>}
              <Link to={`/plany/${courseId}/prehled`} className="ml-1 text-xs underline-offset-4 hover:underline">
                Původní přehled kurzu
              </Link>
            </span>
          }
        />

        {isLoading ? (
          <ListSkeleton variant="row" />
        ) : lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Plán zatím nemá lekce"
            action={
              <>
                {importPlan}
                {newLesson}
              </>
            }
          >
            Načtěte tematický plán, který už máte (text, PDF nebo fotku), a AI z něj udělá lekce po měsících. Nebo vytvořte
            první lekci ručně.
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.month}>
                <h2 className="mb-2 text-sm font-medium capitalize text-muted-foreground">{g.month}</h2>
                <div className="divide-y overflow-hidden rounded-xl border bg-card">
                  {g.lessons.map((l) => (
                    <Link key={l.id} to={`/lekce/${l.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{l.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {l.goalTitle ?? <span className="italic">Zatím bez cíle</span>}
                        </p>
                      </div>
                      <GenerationBadge
                        state={status[l.id]}
                        onRetry={(e) => {
                          e.preventDefault();
                          generate([l.id]);
                        }}
                      />
                      {l.hours != null && <span className="shrink-0 text-xs text-muted-foreground">{l.hours} h</span>}
                      {l.status === "past" && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          Probráno
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {course && (
        <PlanImportDialog open={importOpen} onOpenChange={setImportOpen} course={course} startPosition={lessons.length + 1} />
      )}
      <GenerateLessonsDialog open={generateOpen} onOpenChange={setGenerateOpen} lessons={withoutGoal} onConfirm={generate} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nová lekce</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-lesson-title">Název</Label>
              <Input id="new-lesson-title" className="mt-1.5" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Měsíc</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-lesson-hours">Dotace (hodin)</Label>
                <Input id="new-lesson-hours" inputMode="decimal" className="mt-1.5" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="new-lesson-description">Popis (nepovinné)</Label>
              <Textarea
                id="new-lesson-description"
                className="mt-1.5 min-h-[70px]"
                placeholder="Co se v lekci bude dít. Z popisu pak AI navrhne cíl."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={create} disabled={!title.trim() || createLesson.isPending}>
              {createLesson.isPending && <Loader2 className="animate-spin" />}
              Vytvořit lekci
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

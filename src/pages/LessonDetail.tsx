import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ClipboardList, FileText, QrCode, Trash2, Upload, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListSkeleton } from "@/components/shared/ListSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalEditor } from "@/components/lesson/GoalEditor";
import { CriteriaEditor } from "@/components/lesson/CriteriaEditor";
import { LessonInfoEditor } from "@/components/lesson/LessonInfoEditor";
import { LessonLevelsOverview } from "@/components/lesson/LessonLevelsOverview";
import { useToast } from "@/hooks/use-toast";
import { useDeleteLesson, useLessonDetail, useUpdateLessonInfo } from "@/hooks/usePlanLessons";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Lesson detail (zadání kap. 4.3): description and hours, the one goal, three
 * criteria for the teacher and the pupil with their J/Č/T/Ú scales, what to
 * take into the lesson, and who is where on its criteria.
 */
export default function LessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: lesson, isLoading } = useLessonDetail(lessonId);
  const update = useUpdateLessonInfo();
  const remove = useDeleteLesson();
  usePageTitle(lesson?.title ?? "Lekce");

  if (isLoading || !lesson) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl pt-6">
          <ListSkeleton count={3} />
        </div>
      </AppLayout>
    );
  }

  const course = lesson.courses;
  const done = lesson.status === "past";
  const ready = !!lesson.goal && lesson.criteria.length > 0;

  const toggleDone = () =>
    update.mutate(
      { id: lesson.id, status: done ? "prepared" : "past" },
      { onError: (e) => toast({ title: "Nepodařilo se uložit", description: e.message, variant: "destructive" }) },
    );

  const deleteLesson = async () => {
    if (!window.confirm("Smazat lekci? Cíl a kritéria zůstanou mezi cíli kurzu.")) return;
    await remove.mutateAsync(lesson.id);
    navigate(course ? `/plany/${course.id}` : "/predmety");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          breadcrumbs={[
            { label: "Předměty", href: "/predmety" },
            ...(course?.subjects ? [{ label: course.subjects.name, href: `/predmety/${course.subjects.id}` }] : []),
            ...(course ? [{ label: course.name, href: `/plany/${course.id}` }] : []),
            { label: lesson.title },
          ]}
          title={lesson.title}
          help="Jedna lekce: cíl, tři kritéria pro učitele i pro žáky se škálou J, Č, T, Ú, a z nich hodnoticí arch a exitky do hodiny."
          actions={
            <Button variant={done ? "secondary" : "outline"} onClick={toggleDone} disabled={update.isPending}>
              <CheckCircle2 />
              {done ? "Probráno" : "Označit jako probrané"}
            </Button>
          }
          description={[lesson.month, lesson.hours != null ? `${lesson.hours} h` : null, course?.classes?.name]
            .filter(Boolean)
            .join(" · ")}
        />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>O lekci</CardTitle>
            </CardHeader>
            <CardContent>
              <LessonInfoEditor lesson={lesson} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Výukový cíl</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalEditor lesson={lesson} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kritéria hodnocení</CardTitle>
            </CardHeader>
            <CardContent>
              <CriteriaEditor lesson={lesson} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Do hodiny</CardTitle>
            </CardHeader>
            <CardContent>
              {!ready && (
                <p className="mb-3 text-sm text-muted-foreground">Arch a exitky připravíte, až bude mít lekce cíl a kritéria.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" disabled={!ready}>
                  <Link to={ready ? `/lekce/${lesson.id}/tisk/arch` : "#"} target="_blank" aria-disabled={!ready} className={!ready ? "pointer-events-none opacity-50" : undefined}>
                    <ClipboardList />
                    Hodnoticí arch
                  </Link>
                </Button>
                <Button asChild variant="outline" disabled={!ready}>
                  <Link to={ready ? `/lekce/${lesson.id}/tisk/exitky` : "#"} target="_blank" aria-disabled={!ready} className={!ready ? "pointer-events-none opacity-50" : undefined}>
                    <FileText />
                    Exitky
                  </Link>
                </Button>
                {/* Coming in phase 8 (exit tickets and self-assessment). */}
                <Button variant="outline" disabled title="Připravujeme">
                  <QrCode />
                  QR pro žáky
                </Button>
                <Button asChild>
                  <Link to={`/lekce/${lesson.id}/zaznam`}>
                    <Users />
                    Zaznamenat důkazy v hodině
                  </Link>
                </Button>
                <Button variant="outline" disabled title="Připravujeme">
                  <Upload />
                  Nahrát vyplněné exitky
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kdo je kde</CardTitle>
            </CardHeader>
            <CardContent>
              <LessonLevelsOverview lesson={lesson} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={deleteLesson}>
              <Trash2 />
              Smazat lekci
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

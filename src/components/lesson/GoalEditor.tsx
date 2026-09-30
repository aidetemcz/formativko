import { useEffect, useState } from "react";
import { Check, Loader2, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { invokeAi } from "@/lib/ai";
import { useSaveLessonGoal, type LessonDetail } from "@/hooks/usePlanLessons";
import { gradeFromClassName } from "@/constants/schoolYear";

interface GoalVariant {
  teacher: string;
  pupil: string;
  competences: string[];
}

/**
 * The lesson's one goal (rozhodnutí 8.1), for the teacher and for the pupil.
 * The teacher writes it, or asks for three variants (prompt 01) and picks one.
 */
export function GoalEditor({ lesson }: { lesson: LessonDetail }) {
  const { toast } = useToast();
  const saveGoal = useSaveLessonGoal();
  const goal = lesson.goal;

  const [editing, setEditing] = useState(!goal);
  const [teacher, setTeacher] = useState(goal?.title ?? "");
  const [pupil, setPupil] = useState(goal?.pupil_text ?? "");
  const [context, setContext] = useState(lesson.description || lesson.title);
  const [rvpOutcome, setRvpOutcome] = useState(lesson.rvp_outcome ?? "");
  const [competences, setCompetences] = useState("");
  const [variants, setVariants] = useState<GoalVariant[]>([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setTeacher(goal?.title ?? "");
    setPupil(goal?.pupil_text ?? "");
    setEditing(!goal);
  }, [goal]);

  const suggest = async () => {
    setAsking(true);
    const { data, error } = await invokeAi<{ goals: GoalVariant[] }>("formulate-goal", {
      body: {
        context,
        rvpOutcome,
        competences,
        subject: lesson.courses?.subjects?.name,
        grade: gradeFromClassName(lesson.courses?.classes?.name),
      },
    });
    setAsking(false);
    if (error) {
      toast({ title: "Cíl se nepodařilo navrhnout", description: error.message, variant: "destructive" });
      return;
    }
    setVariants(data?.goals ?? []);
  };

  const save = async () => {
    if (!teacher.trim()) {
      toast({ title: "Napište cíl pro učitele", variant: "destructive" });
      return;
    }
    try {
      await saveGoal.mutateAsync({ lesson, goalId: goal?.id ?? null, teacher: teacher.trim(), pupil: pupil.trim() });
      setVariants([]);
      setEditing(false);
      toast({ title: "Cíl uložen" });
    } catch (e) {
      toast({ title: "Cíl se nepodařilo uložit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  if (goal && !editing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pro učitele</p>
          <p className="mt-1">{goal.title}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pro žáka</p>
          <p className="mt-1">{goal.pupil_text || <span className="text-muted-foreground">Zatím chybí.</span>}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil />
          Upravit cíl
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="goal-context">Čeho se lekce týká</Label>
          <Textarea id="goal-context" className="mt-1.5 min-h-[60px]" value={context} onChange={(e) => setContext(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="goal-rvp">Výstup z RVP (nepovinné)</Label>
          <Input id="goal-rvp" className="mt-1.5" value={rvpOutcome} onChange={(e) => setRvpOutcome(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="goal-competences">Rozvíjené kompetence (nepovinné)</Label>
          <Input id="goal-competences" className="mt-1.5" placeholder="např. k učení, komunikační" value={competences} onChange={(e) => setCompetences(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Button variant="brand" onClick={suggest} disabled={asking || (!context.trim() && !rvpOutcome.trim())}>
            {asking ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Navrhnout cíl
          </Button>
        </div>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Vyberte variantu, kterou pak můžete upravit:</p>
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTeacher(v.teacher);
                setPupil(v.pupil);
              }}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-colors hover:border-brand ${
                teacher === v.teacher ? "border-brand bg-brand-soft/50" : "bg-card"
              }`}
            >
              <p>{v.teacher}</p>
              <p className="mt-1 text-muted-foreground">{v.pupil}</p>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="goal-teacher">Cíl pro učitele</Label>
          <Textarea id="goal-teacher" className="mt-1.5 min-h-[70px]" value={teacher} onChange={(e) => setTeacher(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="goal-pupil">Cíl pro žáka</Label>
          <Textarea id="goal-pupil" className="mt-1.5 min-h-[50px]" placeholder="Dnes se učím…" value={pupil} onChange={(e) => setPupil(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saveGoal.isPending}>
            {saveGoal.isPending ? <Loader2 className="animate-spin" /> : <Check />}
            Uložit cíl
          </Button>
          {goal && (
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Zrušit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

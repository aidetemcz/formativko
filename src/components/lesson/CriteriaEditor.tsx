import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { invokeAi } from "@/lib/ai";
import { LevelChip } from "@/components/shared/LevelChip";
import { JCTU_LEVELS, type JctuScale } from "@/constants/jctu";
import { gradeFromClassName } from "@/constants/schoolYear";
import { useSaveLessonCriteria, type CriterionDraft, type LessonDetail } from "@/hooks/usePlanLessons";

/** The brief asks for three criteria per lesson. */
export const MAX_CRITERIA = 3;

const EMPTY_SCALE: JctuScale = { J: "", C: "", T: "", U: "" };

function draftsFrom(lesson: LessonDetail): CriterionDraft[] {
  return lesson.criteria.map((c) => ({
    teacher: c.teacher_text || c.description,
    pupil: c.pupil_text ?? "",
    scale: c.scale ?? null,
    svp_variants: c.svp_variants ?? [],
  }));
}

interface GeneratedCriterion {
  teacher: string;
  pupil: string;
  scale: JctuScale;
  svp_variants: { need: string; text: string }[];
}

/**
 * The goal's criteria in two versions — for the teacher and for the pupil with
 * its J/Č/T/Ú sentences (zadání kap. 4.3). Proposed by prompts 02 + 03, edited
 * and saved by the teacher.
 */
export function CriteriaEditor({ lesson }: { lesson: LessonDetail }) {
  const { toast } = useToast();
  const save = useSaveLessonCriteria();
  const saved = useMemo(() => draftsFrom(lesson), [lesson]);
  const [drafts, setDrafts] = useState<CriterionDraft[]>(saved);
  const [notes, setNotes] = useState("");
  const [svpNeeds, setSvpNeeds] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => setDrafts(saved), [saved]);

  const dirty = JSON.stringify(drafts) !== JSON.stringify(saved);
  const goal = lesson.goal;

  const update = (i: number, patch: Partial<CriterionDraft>) =>
    setDrafts((prev) => prev.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  const updateScale = (i: number, code: keyof JctuScale, text: string) =>
    setDrafts((prev) =>
      prev.map((d, j) => (j === i ? { ...d, scale: { ...(d.scale ?? EMPTY_SCALE), [code]: text } } : d)),
    );

  const suggest = async () => {
    if (!goal) return;
    if (drafts.some((d) => d.teacher.trim()) && !window.confirm("Nahradit současná kritéria novým návrhem?")) return;
    setAsking(true);
    const { data, error } = await invokeAi<{ criteria: GeneratedCriterion[] }>("generate-criteria", {
      body: {
        goal: goal.title,
        grade: gradeFromClassName(lesson.courses?.classes?.name),
        subject: lesson.courses?.subjects?.name,
        notes,
        svpNeeds: svpNeeds.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean),
      },
    });
    setAsking(false);
    if (error) {
      toast({ title: "Kritéria se nepodařilo navrhnout", description: error.message, variant: "destructive" });
      return;
    }
    setDrafts(
      (data?.criteria ?? []).map((c) => ({
        teacher: c.teacher,
        pupil: c.pupil,
        scale: c.scale,
        svp_variants: c.svp_variants ?? [],
      })),
    );
  };

  const persist = async () => {
    if (!goal) return;
    const cleaned = drafts.filter((d) => d.teacher.trim());
    const removing = lesson.criteria.length - cleaned.length;
    if (removing > 0 && !window.confirm("Odebraná kritéria se smažou i s úrovněmi, které k nim žáci mají. Pokračovat?")) return;
    try {
      await save.mutateAsync({
        lessonId: lesson.id,
        goalId: goal.id,
        existingIds: lesson.criteria.map((c) => c.id),
        criteria: cleaned.map((d) => ({ ...d, teacher: d.teacher.trim(), pupil: d.pupil.trim() })),
      });
      toast({ title: "Kritéria uložena" });
    } catch (e) {
      toast({ title: "Kritéria se nepodařilo uložit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  if (!goal) {
    return <p className="text-sm text-muted-foreground">Kritéria navrhnete, až bude mít lekce uložený cíl.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="criteria-notes">Poznámky pro návrh (nepovinné)</Label>
          <Input id="criteria-notes" className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="criteria-svp">Varianty pro SVP (zkušební, nepovinné)</Label>
          <Input
            id="criteria-svp"
            className="mt-1.5"
            placeholder="např. dyslexie, ADHD — bez jmen žáků"
            value={svpNeeds}
            onChange={(e) => setSvpNeeds(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button variant="brand" onClick={suggest} disabled={asking}>
            {asking ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {drafts.length > 0 ? "Navrhnout znovu" : "Navrhnout kritéria"}
          </Button>
        </div>
      </div>

      {drafts.length > 0 && (
        <Tabs defaultValue="teacher">
          <TabsList>
            <TabsTrigger value="teacher">Pro učitele</TabsTrigger>
            <TabsTrigger value="pupil">Pro žáky</TabsTrigger>
          </TabsList>

          <TabsContent value="teacher" className="space-y-3">
            {drafts.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 pt-2 text-right text-sm text-muted-foreground">{i + 1}.</span>
                <Textarea
                  aria-label={`Kritérium ${i + 1} pro učitele`}
                  className="min-h-[60px] flex-1"
                  value={d.teacher}
                  onChange={(e) => update(i, { teacher: e.target.value })}
                />
                <Button variant="ghost" size="icon" title="Odebrat kritérium" onClick={() => setDrafts((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="pupil" className="space-y-5">
            {drafts.map((d, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-5 pt-2 text-right text-sm text-muted-foreground">{i + 1}.</span>
                  <Textarea
                    aria-label={`Kritérium ${i + 1} pro žáky`}
                    className="min-h-[50px] flex-1"
                    placeholder="Jak kritérium přečte žák"
                    value={d.pupil}
                    onChange={(e) => update(i, { pupil: e.target.value })}
                  />
                </div>
                <div className="ml-7 space-y-1.5">
                  {JCTU_LEVELS.map((l) => (
                    <div key={l.code} className="flex items-center gap-2">
                      <LevelChip level={l.code} />
                      <Input
                        aria-label={`${l.label}, kritérium ${i + 1}`}
                        className="h-8 flex-1 text-sm"
                        placeholder={l.pupil}
                        value={d.scale?.[l.code] ?? ""}
                        onChange={(e) => updateScale(i, l.code, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                {d.svp_variants.length > 0 && (
                  <div className="ml-7 rounded-lg border border-dashed p-2 text-xs text-muted-foreground">
                    {d.svp_variants.map((v, j) => (
                      <p key={j}>
                        <span className="font-medium">{v.need}:</span> {v.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      )}

      <div className="flex flex-wrap gap-2">
        {drafts.length < MAX_CRITERIA && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrafts((p) => [...p, { teacher: "", pupil: "", scale: null, svp_variants: [] }])}
          >
            <Plus />
            Přidat kritérium
          </Button>
        )}
        {dirty && (
          <Button onClick={persist} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Check />}
            Uložit kritéria
          </Button>
        )}
      </div>
    </div>
  );
}

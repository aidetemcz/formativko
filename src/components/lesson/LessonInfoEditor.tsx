import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUpdateLessonInfo, type LessonDetail } from "@/hooks/usePlanLessons";
import { SCHOOL_MONTHS } from "@/constants/schoolYear";

/** Title, description, hours, month and RVP outcome of a lesson, editable in place. */
export function LessonInfoEditor({ lesson }: { lesson: LessonDetail }) {
  const { toast } = useToast();
  const update = useUpdateLessonInfo();
  const initial = {
    title: lesson.title,
    description: lesson.description ?? "",
    month: lesson.month ?? "",
    hours: lesson.hours != null ? String(lesson.hours) : "",
    rvp_outcome: lesson.rvp_outcome ?? "",
    planned_activities: lesson.planned_activities ?? "",
  };
  const [form, setForm] = useState(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setForm(initial), [lesson]);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Lekce potřebuje název", variant: "destructive" });
      return;
    }
    const hours = form.hours.trim() ? Number(form.hours.replace(",", ".")) : null;
    if (hours !== null && (Number.isNaN(hours) || hours < 0)) {
      toast({ title: "Dotace musí být číslo", variant: "destructive" });
      return;
    }
    try {
      await update.mutateAsync({
        id: lesson.id,
        title: form.title.trim(),
        description: form.description.trim(),
        month: form.month || null,
        hours,
        rvp_outcome: form.rvp_outcome.trim() || null,
        planned_activities: form.planned_activities.trim(),
      });
      toast({ title: "Lekce uložena" });
    } catch (e) {
      toast({ title: "Lekci se nepodařilo uložit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="lesson-title">Název lekce</Label>
        <Input id="lesson-title" className="mt-1.5" value={form.title} onChange={(e) => set("title")(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Měsíc</Label>
          <Select value={form.month || undefined} onValueChange={set("month")}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Vyberte měsíc" />
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
          <Label htmlFor="lesson-hours">Dotace (hodin)</Label>
          <Input id="lesson-hours" inputMode="decimal" className="mt-1.5" value={form.hours} onChange={(e) => set("hours")(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="lesson-description">Popis lekce</Label>
        <Textarea
          id="lesson-description"
          className="mt-1.5 min-h-[80px]"
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="lesson-activities">Průběh hodiny</Label>
        <Textarea
          id="lesson-activities"
          className="mt-1.5 min-h-[80px]"
          placeholder="Např. 5 min motivace, 15 min práce ve dvojicích… Můžete ho vymyslet i s Buddym."
          value={form.planned_activities}
          onChange={(e) => set("planned_activities")(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="lesson-rvp">Výstup z RVP</Label>
        <Input id="lesson-rvp" className="mt-1.5" value={form.rvp_outcome} onChange={(e) => set("rvp_outcome")(e.target.value)} />
      </div>
      {dirty && (
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="animate-spin" /> : <Check />}
          Uložit změny
        </Button>
      )}
    </div>
  );
}

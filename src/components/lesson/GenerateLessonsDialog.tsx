import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { monthOrder } from "@/constants/schoolYear";

interface GenerateLessonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lessons that do not have a goal yet. */
  lessons: { id: string; month: string | null }[];
  onConfirm: (lessonIds: string[]) => void;
}

function lessonsWord(n: number): string {
  return n === 1 ? "lekce" : n >= 2 && n <= 4 ? "lekce" : "lekcí";
}

/**
 * Veronika's GenerateLessonsModal: goals and criteria for the whole plan, or
 * only for chosen months. Lessons that already have a goal are left alone.
 */
export function GenerateLessonsDialog({ open, onOpenChange, lessons, onConfirm }: GenerateLessonsDialogProps) {
  const months = useMemo(
    () => [...new Set(lessons.map((l) => l.month?.trim() || ""))].sort((a, b) => monthOrder(a) - monthOrder(b)),
    [lessons],
  );
  const [mode, setMode] = useState<"all" | "pick">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const countFor = (m: string) => lessons.filter((l) => (l.month?.trim() || "") === m).length;
  const chosen = mode === "all" ? lessons : lessons.filter((l) => picked.has(l.month?.trim() || ""));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vygenerovat lekce</DialogTitle>
          <DialogDescription>
            Každá lekce bez cíle dostane výukový cíl a tři kritéria se škálou J, Č, T, Ú. Lekce se připravují jedna po druhé,
            všechno pak můžete upravit.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "all" | "pick")} className="gap-2">
          <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft/50">
            <RadioGroupItem value="all" />
            Celý plán — {lessons.length} {lessonsWord(lessons.length)}
          </Label>
          <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft/50">
            <RadioGroupItem value="pick" />
            Jen vybrané měsíce
          </Label>
        </RadioGroup>

        {mode === "pick" && (
          <div className="flex flex-wrap gap-2">
            {months.map((m) => {
              const on = picked.has(m);
              return (
                <button
                  key={m || "none"}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (on) next.delete(m);
                      else next.add(m);
                      return next;
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                    on ? "border-brand bg-brand-soft text-brand-strong" : "bg-card text-muted-foreground hover:border-input"
                  }`}
                >
                  {m || "bez měsíce"}
                  <span className="text-xs opacity-75">{countFor(m)}</span>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            variant="brand"
            disabled={chosen.length === 0}
            onClick={() => {
              onConfirm(chosen.map((l) => l.id));
              onOpenChange(false);
            }}
          >
            <Sparkles />
            Vygenerovat {chosen.length} {lessonsWord(chosen.length)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

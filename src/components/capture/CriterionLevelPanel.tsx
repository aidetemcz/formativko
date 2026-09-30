import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { JCTU_LEVELS, type JctuCode } from "@/constants/jctu";
import { useToast } from "@/hooks/use-toast";
import { useRecordLevels } from "@/hooks/useRecordLevels";
import type { LessonCriterion } from "@/hooks/usePlanLessons";

/** Spelled out in full so Tailwind finds the classes. */
const ACTIVE: Record<JctuCode, string> = {
  J: "bg-jctu-j text-jctu-j-foreground border-jctu-t",
  C: "bg-jctu-c text-jctu-c-foreground border-jctu-c-foreground/40",
  T: "bg-jctu-t text-jctu-t-foreground border-jctu-t-foreground/40",
  U: "bg-jctu-u text-jctu-u-foreground border-jctu-u",
};

interface CriterionLevelPanelProps {
  criteria: LessonCriterion[];
  selectedStudents: string[];
  lessonId: string;
  /** Teacher's current level per `${studentId}:${criterionId}`. */
  current: Map<string, JctuCode>;
  onRecorded: (studentIds: string[]) => void;
}

/**
 * Four buttons J/Č/T/Ú for every criterion of the lesson (zadání kap. 3,
 * bod 2). One tap records the level for all selected pupils at once.
 */
export function CriterionLevelPanel({ criteria, selectedStudents, lessonId, current, onRecorded }: CriterionLevelPanelProps) {
  const { toast } = useToast();
  const record = useRecordLevels();

  if (criteria.length === 0) {
    return <p className="text-sm text-muted-foreground">Lekce zatím nemá kritéria. Doplníte je v detailu lekce.</p>;
  }

  /** The level all selected pupils share on a criterion, if they share one. */
  const shared = (criterionId: string): JctuCode | null => {
    const levels = selectedStudents.map((s) => current.get(`${s}:${criterionId}`) ?? null);
    return levels.length > 0 && levels.every((l) => l && l === levels[0]) ? levels[0] : null;
  };

  const tap = (criterionId: string, level: JctuCode) => {
    if (selectedStudents.length === 0) {
      toast({ title: "Nejdřív vyberte žáky v mřížce", variant: "destructive" });
      return;
    }
    const ids = [...selectedStudents];
    record.mutate(
      { studentIds: ids, criterionId, level, lessonId },
      {
        onSuccess: () => onRecorded(ids),
        onError: (e) => toast({ title: "Úroveň se nepodařilo uložit", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-4">
      {criteria.map((c, i) => {
        const active = shared(c.id);
        return (
          <div key={c.id} className="space-y-2">
            <p className="text-sm">
              <span className="mr-1.5 font-medium text-muted-foreground">K{i + 1}</span>
              {c.teacher_text || c.description}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {JCTU_LEVELS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  title={l.label}
                  aria-label={`${l.label}, kritérium ${i + 1}`}
                  aria-pressed={active === l.code}
                  disabled={record.isPending}
                  onClick={() => tap(c.id, l.code)}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-lg border text-lg font-medium transition-colors",
                    active === l.code ? ACTIVE[l.code] : "bg-card hover:bg-accent",
                  )}
                >
                  {l.letter}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {record.isPending && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ukládám…
        </p>
      )}
    </div>
  );
}

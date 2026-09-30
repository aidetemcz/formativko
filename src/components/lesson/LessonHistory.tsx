import { useState } from "react";
import { ChevronDown, Loader2, Sparkles, Undo2, User } from "lucide-react";
import { LessonDiff } from "@/components/buddy/ProposalCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLessonRevisions, useRevertRevision, type LessonRevision } from "@/hooks/useBuddy";

function Entry({ lessonId, revision, latest }: { lessonId: string; revision: LessonRevision; latest: boolean }) {
  const { toast } = useToast();
  const revert = useRevertRevision();
  const [open, setOpen] = useState(false);
  const Icon = revision.changed_by === "buddy" ? Sparkles : User;

  const undo = async () => {
    const criteriaBack = revision.before && JSON.stringify(revision.before.criteria) !== JSON.stringify(revision.after.criteria);
    const warning = criteriaBack
      ? "Vrátit změnu? Kritéria se vrátí do původní podoby. Úrovně žáků u kritérií zůstanou, jen u kritérií, která změna přidala, zmizí."
      : "Vrátit změnu?";
    if (!window.confirm(warning)) return;
    try {
      await revert.mutateAsync({ lessonId, revision });
      toast({ title: "Změna vrácena" });
    } catch (e) {
      toast({ title: "Změnu se nepodařilo vrátit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          {revision.summary || (revision.changed_by === "buddy" ? "Změna od Buddyho" : "Změna")}
          <span className="text-muted-foreground">
            {" "}
            · {revision.changed_by === "buddy" ? "Buddy" : "Vy"} · {new Date(revision.created_at).toLocaleString("cs-CZ", { dateStyle: "short", timeStyle: "short" })}
          </span>
        </span>
        {revision.before && (
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
            <ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} />
            Co se změnilo
          </Button>
        )}
        {revision.before && latest && (
          <Button variant="outline" size="sm" onClick={undo} disabled={revert.isPending}>
            {revert.isPending ? <Loader2 className="animate-spin" /> : <Undo2 />}
            Vrátit
          </Button>
        )}
      </div>
      {open && revision.before && (
        <div className="mt-2">
          <LessonDiff before={revision.before} after={revision.after} />
        </div>
      )}
    </li>
  );
}

/**
 * Changes to the lesson that came from Buddy, and their undos (zadání kap.
 * 5.2, bod 3: kdo, kdy, co, a jde to vrátit). Only the newest change is
 * undone directly, so an undo never skips over a later change.
 */
export function LessonHistory({ lessonId }: { lessonId: string }) {
  const { data: revisions = [] } = useLessonRevisions(lessonId);
  if (revisions.length === 0) {
    return <p className="text-sm text-muted-foreground">Zatím žádné změny od Buddyho. Každou, kterou uložíte, tu uvidíte a můžete ji vrátit.</p>;
  }
  return (
    <ul className="divide-y">
      {revisions.map((r, i) => (
        <Entry key={r.id} lessonId={lessonId} revision={r} latest={i === 0} />
      ))}
    </ul>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { LevelChip } from "@/components/shared/LevelChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JCTU_LEVELS } from "@/constants/jctu";
import { snapshotChanges, type LessonSnapshot, type Proposal } from "@/lib/buddy";
import { cn } from "@/lib/utils";

function Side({ label, children, muted }: { label: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-lg border p-2.5 text-sm", muted ? "bg-muted/40 text-muted-foreground" : "bg-card")}>
      <p className="mb-1 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function BeforeAfter({ title, before, after }: { title: string; before: React.ReactNode; after: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Side label="Před" muted>
          {before}
        </Side>
        <Side label="Po">{after}</Side>
      </div>
    </div>
  );
}

function Criteria({ criteria }: { criteria: LessonSnapshot["criteria"] }) {
  if (criteria.length === 0) return <p>Bez kritérií</p>;
  return (
    <ol className="list-decimal space-y-2 pl-4">
      {criteria.map((c, i) => (
        <li key={i}>
          <p>{c.teacher}</p>
          {c.pupil && <p className="text-xs text-muted-foreground">Pro žáka: {c.pupil}</p>}
          {c.scale && (
            <ul className="mt-1 space-y-0.5">
              {JCTU_LEVELS.map((l) =>
                c.scale?.[l.code] ? (
                  <li key={l.code} className="flex items-start gap-1.5 text-xs">
                    <LevelChip level={l.code} className="h-5 min-w-5 shrink-0" />
                    <span>{c.scale[l.code]}</span>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

const FIELD_LABELS = {
  title: "Název",
  description: "Popis",
  month: "Měsíc",
  hours: "Dotace (hodin)",
  planned_activities: "Průběh hodiny",
} as const;

function text(value: unknown) {
  return value === null || value === undefined || value === "" ? <span className="text-muted-foreground">—</span> : <span className="whitespace-pre-line">{String(value)}</span>;
}

/** Before and after of a lesson, only for what changes. */
export function LessonDiff({ before, after }: { before: LessonSnapshot; after: LessonSnapshot }) {
  const changes = snapshotChanges(before, after);
  const fields = Object.keys(changes.info) as (keyof typeof FIELD_LABELS)[];
  if (fields.length === 0 && !changes.goal && !changes.criteria) {
    return <p className="text-sm text-muted-foreground">Návrh nic nemění.</p>;
  }
  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <BeforeAfter key={f} title={FIELD_LABELS[f]} before={text(before[f])} after={text(after[f])} />
      ))}
      {changes.goal && (
        <BeforeAfter
          title="Výukový cíl"
          before={before.goal ? <GoalText goal={before.goal} /> : text(null)}
          after={<GoalText goal={changes.goal} />}
        />
      )}
      {changes.criteria && <BeforeAfter title="Kritéria a škála JČTÚ" before={<Criteria criteria={before.criteria} />} after={<Criteria criteria={after.criteria} />} />}
    </div>
  );
}

function GoalText({ goal }: { goal: { teacher: string; pupil: string } }) {
  return (
    <>
      <p>{goal.teacher}</p>
      {goal.pupil && <p className="mt-1 text-xs text-muted-foreground">Pro žáka: {goal.pupil}</p>}
    </>
  );
}

function NewLesson({ lesson }: { lesson: LessonSnapshot }) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 text-sm">
      <p className="font-medium">{lesson.title}</p>
      <p className="text-xs text-muted-foreground">
        {[lesson.month, lesson.hours != null ? `${lesson.hours} h` : null].filter(Boolean).join(" · ")}
      </p>
      {lesson.description && <p>{lesson.description}</p>}
      {lesson.planned_activities && <p className="whitespace-pre-line text-muted-foreground">{lesson.planned_activities}</p>}
      {lesson.goal && (
        <div>
          <p className="text-xs font-medium">Výukový cíl</p>
          <GoalText goal={lesson.goal} />
        </div>
      )}
      {lesson.criteria.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium">Kritéria a škála JČTÚ</p>
          <Criteria criteria={lesson.criteria} />
        </div>
      )}
    </div>
  );
}

/**
 * A change Buddy proposes, as a preview (zadání kap. 5.2, bod 3). Nothing is
 * saved until the teacher clicks "Uložit".
 */
export function ProposalCard({
  proposal,
  onSave,
  onDiscard,
  saving,
}: {
  proposal: Proposal;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
}) {
  const heading =
    proposal.type === "lesson_update"
      ? { label: "Úprava lekce", name: proposal.lesson_title, href: `/lekce/${proposal.lesson_id}` }
      : proposal.type === "lesson_create"
        ? { label: "Nová lekce v plánu", name: proposal.plan_name, href: `/plany/${proposal.plan_id}` }
        : { label: "Úprava plánu", name: proposal.plan_name, href: `/plany/${proposal.plan_id}` };

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-soft/40 p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant="plain" className="bg-brand-soft text-brand-strong">
          Návrh
        </Badge>
        <span className="text-sm">
          {heading.label}:{" "}
          <Link to={heading.href} className="font-medium hover:underline">
            {heading.name}
          </Link>
        </span>
      </div>
      {proposal.summary && <p className="mb-3 text-sm text-muted-foreground">{proposal.summary}</p>}

      {proposal.type === "lesson_update" && <LessonDiff before={proposal.before} after={proposal.after} />}
      {proposal.type === "lesson_create" && <NewLesson lesson={proposal.after} />}
      {proposal.type === "plan_update" && (
        <ul className="space-y-1.5 text-sm">
          {proposal.items.map((item) => (
            <li key={item.lesson_id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5">
              <span className="text-muted-foreground">
                {item.before.title}
                {item.before.month ? ` · ${item.before.month}` : ""}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {item.after.title}
                {item.after.month ? ` · ${item.after.month}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {proposal.status === "pending" ? (
          <>
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              Uložit
            </Button>
            <Button size="sm" variant="outline" onClick={onDiscard} disabled={saving}>
              <X />
              Zahodit
            </Button>
            <span className="text-xs text-muted-foreground">Dokud neuložíte, nic se nezmění.</span>
          </>
        ) : proposal.status === "saved" ? (
          <span className="flex items-center gap-1.5 text-sm">
            <Check className="h-4 w-4" /> Uloženo. Změnu vrátíte v historii lekce.
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Zahozeno</span>
        )}
      </div>
    </div>
  );
}

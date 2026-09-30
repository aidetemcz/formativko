import { Link } from "react-router-dom";
import { BookOpen, FileText, GraduationCap, Layers, Paperclip, User } from "lucide-react";
import { HIT_LABELS, hrefForHit, type SearchHit } from "@/lib/buddy";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  lesson: BookOpen,
  plan: Layers,
  student: User,
  class: GraduationCap,
  proof: Paperclip,
  evaluation: FileText,
};

/** Search hits as links; used under the Buddy field and under an answer. */
export function HitList({
  hits,
  onPick,
  className,
  compact,
}: {
  hits: SearchHit[];
  onPick?: () => void;
  className?: string;
  compact?: boolean;
}) {
  if (hits.length === 0) return null;
  return (
    <ul className={cn(compact ? "flex flex-wrap gap-1.5" : "divide-y", className)}>
      {hits.map((hit) => {
        const Icon = ICONS[hit.kind] ?? BookOpen;
        return (
          <li key={`${hit.kind}:${hit.id}`}>
            <Link
              to={hrefForHit(hit)}
              onClick={onPick}
              className={
                compact
                  ? "inline-flex max-w-[16rem] items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs hover:bg-accent"
                  : "flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
              }
            >
              <Icon className={compact ? "h-3.5 w-3.5 shrink-0 text-muted-foreground" : "h-4 w-4 shrink-0 text-muted-foreground"} />
              <span className="min-w-0 flex-1 truncate">
                {hit.title}
                {!compact && hit.subtitle && <span className="text-muted-foreground"> · {hit.subtitle}</span>}
              </span>
              {!compact && <span className="shrink-0 text-xs text-muted-foreground">{HIT_LABELS[hit.kind] ?? hit.kind}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

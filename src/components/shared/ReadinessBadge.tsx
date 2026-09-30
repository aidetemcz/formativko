import { cn } from "@/lib/utils";
import { READINESS_CLASSES, READINESS_LABELS, type ReadinessResult } from "@/lib/readiness";

/** The semafor for one pupil: status and how many criteria have the teacher's level. */
export function ReadinessBadge({ result, className }: { result: ReadinessResult; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        READINESS_CLASSES[result.status],
        className,
      )}
      title={result.total ? `Úroveň od vás má ${result.covered} z ${result.total} kritérií probraných lekcí.` : undefined}
    >
      {READINESS_LABELS[result.status]}
      {result.total > 0 && result.status !== "ready" && (
        <span className="font-normal opacity-80">
          {result.covered}/{result.total}
        </span>
      )}
    </span>
  );
}

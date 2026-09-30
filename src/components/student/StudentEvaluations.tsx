import { Link } from "react-router-dom";
import { useStudentEvaluations } from "@/hooks/useStudentProgress";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Koncept",
  approved: "Schváleno",
  done: "Hotovo",
  insufficient: "Málo podkladů",
};

/** Earlier evaluations of the pupil: date, period and the start of the text. */
export function StudentEvaluations({ studentId }: { studentId: string }) {
  const { data = [], isLoading } = useStudentEvaluations(studentId);
  if (isLoading) return null;
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Žák zatím nemá žádné slovní hodnocení.</p>;
  }
  return (
    <ul className="divide-y">
      {data.map((e) => {
        const date = new Date(e.created_at).toLocaleDateString("cs-CZ");
        const body = (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{e.subject || "Hodnocení"}</span>
              <span className="text-xs text-muted-foreground">
                {date} · {e.period} · {STATUS_LABELS[e.status] ?? e.status}
              </span>
            </div>
            {e.text && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.text}</p>}
          </>
        );
        return (
          <li key={e.id} className="py-2.5">
            {e.group_id ? (
              <Link to={`/hodnoceni/${e.group_id}`} className="block rounded-md hover:bg-muted/40">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

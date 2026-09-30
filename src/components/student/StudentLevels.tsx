import { Link } from "react-router-dom";
import { LevelChip } from "@/components/shared/LevelChip";
import { compareJctu } from "@/constants/jctu";
import { useStudentLevels, type StudentCriterionLevel } from "@/hooks/useStudentProgress";

function groupByGoal(rows: StudentCriterionLevel[]) {
  const groups = new Map<string, StudentCriterionLevel[]>();
  for (const r of rows) groups.set(r.goal, [...(groups.get(r.goal) ?? []), r]);
  return [...groups.entries()];
}

/**
 * The pupil's levels per criterion in two columns: the teacher's and the
 * pupil's own. A difference is a topic for a conversation, not an error.
 */
export function StudentLevels({ studentId }: { studentId: string }) {
  const { data: rows = [], isLoading } = useStudentLevels(studentId);

  if (isLoading) return null;
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Zatím tu nejsou žádné úrovně. Vzniknou v záznamu v hodině, z exitek a z Nápadů.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 text-xs text-muted-foreground">
        <span />
        <span className="w-10 text-center">Učitel</span>
        <span className="w-10 text-center">Žák</span>
      </div>
      {groupByGoal(rows).map(([goal, items]) => (
        <div key={goal}>
          <p className="mb-1.5 text-sm font-medium">
            {items[0].lesson ? (
              <Link to={`/lekce/${items[0].lesson.id}`} className="hover:underline">
                {items[0].lesson.title}
              </Link>
            ) : (
              goal
            )}
          </p>
          <ul className="space-y-1.5">
            {items.map((r) => {
              const differs = r.teacher && r.self && compareJctu(r.teacher.level, r.self.level) !== 0;
              return (
                <li key={r.criterionId} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 text-sm">
                  <span className="min-w-0">
                    {r.criterion}
                    {differs && (
                      <span className="ml-2 text-xs text-muted-foreground">· jiný pohled žáka, námět na rozhovor</span>
                    )}
                  </span>
                  <span className="flex w-10 justify-center">
                    <LevelChip level={r.teacher?.level} />
                  </span>
                  <span className="flex w-10 justify-center">
                    <LevelChip level={r.self?.level} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

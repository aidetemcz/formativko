import { useMemo } from "react";
import { levelMap } from "@/lib/lessons";
import { LevelChip } from "@/components/shared/LevelChip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClassStudents } from "@/hooks/useClasses";
import { useCriterionLevels, type LessonDetail } from "@/hooks/usePlanLessons";
import { shortPupilName } from "@/constants/schoolYear";

/**
 * Who is on which step of each criterion of this lesson (zadání kap. 4.3,
 * bottom of the lesson detail): the teacher's level and, beside it, the
 * pupil's own. A difference is something to talk about, not an error.
 */
export function LessonLevelsOverview({ lesson }: { lesson: LessonDetail }) {
  const classId = lesson.class_id ?? lesson.courses?.classes?.id;
  const { data: students = [] } = useClassStudents(classId ?? undefined);
  const criterionIds = useMemo(() => lesson.criteria.map((c) => c.id), [lesson.criteria]);
  const { data: levels = [] } = useCriterionLevels(criterionIds);
  const map = useMemo(() => levelMap(levels), [levels]);

  if (lesson.criteria.length === 0) {
    return <p className="text-sm text-muted-foreground">Přehled se ukáže, až bude mít lekce kritéria.</p>;
  }
  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">Třída tohoto plánu zatím nemá žáky.</p>;
  }

  const sorted = [...students].sort((a, b) => a.last_name.localeCompare(b.last_name, "cs"));

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Žák</TableHead>
              {lesson.criteria.map((c, i) => (
                <TableHead key={c.id} title={c.teacher_text || c.description}>
                  Kritérium {i + 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap font-medium">{shortPupilName(s)}</TableCell>
                {lesson.criteria.map((c) => {
                  const cell = map.get(`${s.id}:${c.id}`);
                  return (
                    <TableCell key={c.id}>
                      <span className="inline-flex items-center gap-1.5">
                        <LevelChip level={cell?.teacher} />
                        {cell?.self && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Sebehodnocení žáka">
                            žák <LevelChip level={cell.self} className="h-5 min-w-5" />
                          </span>
                        )}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        První čip je úroveň od vás, „žák“ je jeho sebehodnocení z exitky. Rozdíl je námět na rozhovor, ne chyba.
      </p>
    </div>
  );
}

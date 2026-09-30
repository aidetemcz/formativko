import { useState } from "react";
import { LevelChip } from "@/components/shared/LevelChip";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLessonExitTickets, useUpdateExitTicketComment, type LessonExitTicket } from "@/hooks/useExitTickets";
import type { LessonCriterion } from "@/hooks/usePlanLessons";

function TeacherComment({ ticket }: { ticket: LessonExitTicket }) {
  const { toast } = useToast();
  const update = useUpdateExitTicketComment();
  const [value, setValue] = useState(ticket.teacher_comment);
  return (
    <Textarea
      aria-label="Komentář pedagoga"
      className="mt-2 min-h-[44px] text-sm"
      placeholder="Komentář pedagoga…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== ticket.teacher_comment) {
          update.mutate(
            { id: ticket.id, teacherComment: value },
            { onError: (e) => toast({ title: "Komentář se nepodařilo uložit", description: e.message, variant: "destructive" }) },
          );
        }
      }}
    />
  );
}

/**
 * Exit tickets pupils handed in for the lesson: their steps, their comment,
 * and room for the teacher's (zadání kap. 4.3, points 3 and 4).
 */
export function LessonExitTickets({ lessonId, criteria }: { lessonId: string; criteria: LessonCriterion[] }) {
  const { data: tickets = [], isLoading } = useLessonExitTickets(lessonId);
  if (isLoading) return null;
  if (tickets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Zatím žádné exitky. Spusťte QR pro žáky, nebo nahrajte fotky vyplněných papírových exitek.
      </p>
    );
  }
  return (
    <ul className="divide-y">
      {tickets.map((t) => (
        <li key={t.id} className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {t.students ? `${t.students.first_name} ${t.students.last_name}` : "Neznámý žák"}
            </span>
            <Badge variant="outline">{t.source === "self_qr" ? "online" : "papír"}</Badge>
            <span className="text-xs text-muted-foreground">{new Date(t.submitted_at).toLocaleString("cs-CZ")}</span>
            <span className="ml-auto flex gap-1">
              {criteria.map((c) => (
                <LevelChip key={c.id} level={t.criterion_assessments.find((a) => a.criterion_id === c.id)?.level} />
              ))}
            </span>
          </div>
          {t.pupil_comment && <p className="mt-1.5 text-sm">„{t.pupil_comment}“</p>}
          <TeacherComment ticket={t} />
        </li>
      ))}
    </ul>
  );
}

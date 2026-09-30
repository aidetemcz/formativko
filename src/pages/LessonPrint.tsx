import { useEffect, useMemo, useState } from "react";
import { templateFrom, type ExitTicketTemplate } from "@/lib/lessons";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClassStudents } from "@/hooks/useClasses";
import { useLessonDetail, type LessonDetail } from "@/hooks/usePlanLessons";
import { usePageTitle } from "@/hooks/usePageTitle";
import { JCTU_LEVELS } from "@/constants/jctu";

interface Pupil {
  id: string;
  first_name: string;
  last_name: string;
}

function Box() {
  return <span className="inline-block h-6 w-6 shrink-0 rounded-sm border-2 border-foreground" aria-hidden="true" />;
}

function WriteLines({ count }: { count: number }) {
  return (
    <div className="space-y-6 pt-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-foreground/40" />
      ))}
    </div>
  );
}

/**
 * One exit ticket per page: the goal for the pupil, each criterion with four
 * large boxes J/Č/T/Ú to tick, the pupil's comment and room for the teacher's.
 * The name is printed so the photo of a filled-in ticket can be matched to the
 * pupil without guessing; a blank ticket has a line for it.
 */
export function ExitTicket({
  template,
  pupil,
  heading,
}: {
  template: ExitTicketTemplate;
  pupil: Pupil | null;
  heading: string;
}) {
  return (
    <article className="mx-auto mb-8 max-w-[210mm] break-after-page rounded-xl border bg-card p-8 text-foreground print:mb-0 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header className="flex items-end justify-between gap-6 border-b-2 border-foreground pb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Exitka · {heading}</p>
          <p className="mt-2 text-xl font-medium">
            {pupil ? (
              `${pupil.first_name} ${pupil.last_name}`
            ) : (
              <span className="inline-flex items-end gap-2">
                Jméno: <span className="inline-block w-64 border-b border-foreground" />
              </span>
            )}
          </p>
        </div>
        <p className="shrink-0 text-sm">
          Datum: <span className="inline-block w-28 border-b border-foreground" />
        </p>
      </header>

      <section className="mt-5">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">1. Dnes se učím</p>
        <p className="mt-1 text-lg">{template.goal}</p>
      </section>

      <section className="mt-5">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          2. Jak se mi daří? U každého řádku zaškrtni jedno políčko.
        </p>
        <div className="mt-2 space-y-4">
          {template.criteria.map((c, i) => (
            <div key={i} className="break-inside-avoid">
              <p className="font-medium">{c.pupil}</p>
              <ul className="mt-1.5 space-y-1.5">
                {JCTU_LEVELS.map((l) => (
                  <li key={l.code} className="flex items-center gap-3">
                    <Box />
                    <span className="w-5 text-lg font-medium">{l.letter}</span>
                    <span className="text-sm">{c.scale[l.code]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 break-inside-avoid">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">3. Můj komentář</p>
        <WriteLines count={3} />
      </section>

      <section className="mt-5 break-inside-avoid">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">4. Komentář učitele</p>
        <div className="mt-2 h-24 rounded-md border border-foreground/40" />
      </section>
    </article>
  );
}

/** The teacher's sheet: pupils × criteria, four small boxes in each cell. */
export function AssessmentSheet({ lesson, pupils, heading }: { lesson: LessonDetail; pupils: Pupil[]; heading: string }) {
  return (
    <article className="mx-auto max-w-[297mm] rounded-xl border bg-card p-8 text-foreground print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header className="border-b-2 border-foreground pb-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Hodnoticí arch · {heading}</p>
        <p className="mt-1 text-xl font-medium">{lesson.title}</p>
        <p className="mt-1 text-sm">Cíl: {lesson.goal?.title}</p>
        <p className="mt-2 text-sm">
          Datum: <span className="inline-block w-28 border-b border-foreground" />
        </p>
      </header>
      <ol className="mt-3 space-y-1 text-sm">
        {lesson.criteria.map((c, i) => (
          <li key={c.id}>
            <span className="font-medium">K{i + 1}</span> {c.teacher_text || c.description}
          </li>
        ))}
      </ol>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-foreground/50 px-2 py-1.5 text-left">Žák</th>
            {lesson.criteria.map((c, i) => (
              <th key={c.id} className="border border-foreground/50 px-2 py-1.5">
                K{i + 1}
                <span className="mt-0.5 block text-xs font-normal">J · Č · T · Ú</span>
              </th>
            ))}
            <th className="border border-foreground/50 px-2 py-1.5 text-left">Poznámka</th>
          </tr>
        </thead>
        <tbody>
          {pupils.map((p) => (
            <tr key={p.id} className="break-inside-avoid">
              <td className="whitespace-nowrap border border-foreground/50 px-2 py-2">
                {p.last_name} {p.first_name}
              </td>
              {lesson.criteria.map((c) => (
                <td key={c.id} className="border border-foreground/50 px-2 py-2">
                  <span className="flex justify-center gap-1.5">
                    {JCTU_LEVELS.map((l) => (
                      <span key={l.code} className="inline-block h-4 w-4 rounded-sm border border-foreground" />
                    ))}
                  </span>
                </td>
              ))}
              <td className="w-1/4 border border-foreground/50 px-2 py-2" />
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

/**
 * Printable sheet or exit tickets for a lesson. No AI is involved: everything
 * comes from the lesson's data. The browser's print dialog saves it as a PDF,
 * which keeps Czech letters and the app's font intact.
 */
export default function LessonPrint() {
  const { lessonId, kind } = useParams<{ lessonId: string; kind: string }>();
  const isSheet = kind === "arch";
  const { data: lesson } = useLessonDetail(lessonId);
  const classId = lesson?.class_id ?? lesson?.courses?.classes?.id;
  const { data: students = [] } = useClassStudents(classId ?? undefined);
  usePageTitle(isSheet ? "Hodnoticí arch" : "Exitky");

  const pupils: Pupil[] = useMemo(
    () => [...students].sort((a, b) => a.last_name.localeCompare(b.last_name, "cs")),
    [students],
  );
  const [template, setTemplate] = useState<ExitTicketTemplate | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [blank, setBlank] = useState("2");

  useEffect(() => {
    if (lesson && !template) setTemplate(templateFrom(lesson));
  }, [lesson, template]);

  if (!lesson || !template) {
    return <div className="p-8 text-muted-foreground">Načítání…</div>;
  }

  const heading = [lesson.courses?.subjects?.name, lesson.courses?.classes?.name].filter(Boolean).join(" · ");
  const printed = pupils.filter((p) => !excluded.has(p.id));
  const blankCount = Math.max(0, Math.min(40, Number(blank) || 0));

  return (
    <div className="min-h-screen bg-background print:bg-card">
      <div className="mx-auto max-w-4xl space-y-4 p-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link to={`/lekce/${lesson.id}`}>
              <ArrowLeft />
              Zpět na lekci
            </Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Printer />
            Vytisknout nebo uložit jako PDF
          </Button>
        </div>
        <h1 className="text-2xl font-medium">
          {isSheet ? "Hodnoticí arch" : "Exitky"} · {lesson.title}
        </h1>

        {!isSheet && (
          <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-medium">Texty exitky</p>
              <p className="text-xs text-muted-foreground">Úpravy platí jen pro tento tisk, lekce zůstane beze změny.</p>
              <div>
                <Label htmlFor="print-goal">Dnes se učím</Label>
                <Textarea
                  id="print-goal"
                  className="mt-1.5 min-h-[50px]"
                  value={template.goal}
                  onChange={(e) => setTemplate({ ...template, goal: e.target.value })}
                />
              </div>
              {template.criteria.map((c, i) => (
                <div key={i} className="space-y-1.5">
                  <Label htmlFor={`print-c${i}`}>Kritérium {i + 1}</Label>
                  <Input
                    id={`print-c${i}`}
                    value={c.pupil}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        criteria: template.criteria.map((x, j) => (j === i ? { ...x, pupil: e.target.value } : x)),
                      })
                    }
                  />
                  {JCTU_LEVELS.map((l) => (
                    <Input
                      key={l.code}
                      aria-label={`${l.label}, kritérium ${i + 1}`}
                      className="h-8 text-sm"
                      value={c.scale[l.code]}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          criteria: template.criteria.map((x, j) =>
                            j === i ? { ...x, scale: { ...x.scale, [l.code]: e.target.value } } : x,
                          ),
                        })
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Pro koho</p>
              <div className="max-h-80 space-y-1.5 overflow-y-auto">
                {pupils.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={!excluded.has(p.id)}
                      onCheckedChange={(v) =>
                        setExcluded((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.delete(p.id);
                          else next.add(p.id);
                          return next;
                        })
                      }
                    />
                    {p.first_name} {p.last_name}
                  </label>
                ))}
              </div>
              <div>
                <Label htmlFor="print-blank">Prázdné exitky s řádkem na jméno</Label>
                <Input id="print-blank" inputMode="numeric" className="mt-1.5 w-24" value={blank} onChange={(e) => setBlank(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-10 print:p-0">
        {isSheet ? (
          <AssessmentSheet lesson={lesson} pupils={pupils} heading={heading} />
        ) : (
          <>
            {printed.map((p) => (
              <ExitTicket key={p.id} template={template} pupil={p} heading={heading} />
            ))}
            {Array.from({ length: blankCount }).map((_, i) => (
              <ExitTicket key={`blank-${i}`} template={template} pupil={null} heading={heading} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

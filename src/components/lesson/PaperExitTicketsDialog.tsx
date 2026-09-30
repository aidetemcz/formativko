import { useEffect, useRef, useState } from "react";
import { AlertCircle, ImageUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useClassStudents } from "@/hooks/useClasses";
import { useSavePaperExitTickets } from "@/hooks/useExitTickets";
import type { LessonCriterion } from "@/hooks/usePlanLessons";
import { supabase } from "@/integrations/supabase/client";
import { invokeAi } from "@/lib/ai";
import { buildUploadPath, createSignedUrl, EDGE_FUNCTION_URL_TTL_SECONDS } from "@/lib/storage";
import { JCTU_LEVELS, isJctuCode, type JctuCode } from "@/constants/jctu";

const NONE = "none";

interface Row {
  key: string;
  preview: string;
  file: { path: string; name: string } | null;
  status: "reading" | "ready" | "error";
  error?: string;
  readName: string;
  unclear: string;
  studentId: string;
  levels: Record<string, JctuCode | null>;
  pupilComment: string;
  teacherComment: string;
}

interface ReadResult {
  studentId: string | null;
  readName: string;
  levels: Record<string, string | null>;
  pupilComment: string;
  unclear: string;
}

interface PaperExitTicketsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: { id: string; class_id: string | null; courses?: { classes?: { id: string } | null } | null };
  goalId: string | null;
  criteria: LessonCriterion[];
}

/**
 * Photos of filled-in paper exit tickets (zadání kap. 3, bod 5): the app reads
 * each one, and the teacher checks every row — the pupil, the steps, the
 * comments — before anything is saved.
 */
export function PaperExitTicketsDialog({ open, onOpenChange, lesson, goalId, criteria }: PaperExitTicketsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const classId = lesson.class_id ?? lesson.courses?.classes?.id;
  const { data: pupils = [] } = useClassStudents(classId);
  const save = useSavePaperExitTickets();
  const [rows, setRows] = useState<Row[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setRows((prev) => {
        prev.forEach((r) => URL.revokeObjectURL(r.preview));
        return [];
      });
    }
  }, [open]);

  const patch = (key: string, change: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...change } : r)));

  const readOne = async (key: string, file: File) => {
    try {
      const path = buildUploadPath(user!.id, file.name);
      const { error: upErr } = await supabase.storage.from("proof-files").upload(path, file);
      if (upErr) throw upErr;
      patch(key, { file: { path, name: file.name } });
      const fileUrl = await createSignedUrl("proof-files", path, EDGE_FUNCTION_URL_TTL_SECONDS);
      if (!fileUrl) throw new Error("Fotku se nepodařilo připravit ke čtení.");
      const { data, error } = await invokeAi<ReadResult>("read-exit-tickets", { body: { lessonId: lesson.id, fileUrl } });
      if (error) throw error;
      const levels: Record<string, JctuCode | null> = {};
      for (const c of criteria) {
        const v = data?.levels?.[c.id];
        levels[c.id] = isJctuCode(v) ? v : null;
      }
      patch(key, {
        status: "ready",
        studentId: data?.studentId ?? "",
        readName: data?.readName ?? "",
        unclear: data?.unclear ?? "",
        levels,
        pupilComment: data?.pupilComment ?? "",
      });
    } catch (e) {
      // The photo may still be filled in by hand.
      patch(key, { status: "error", error: e instanceof Error ? e.message : "Exitku se nepodařilo přečíst." });
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    const added = Array.from(files).map((file) => ({
      file,
      row: {
        key: crypto.randomUUID(),
        preview: URL.createObjectURL(file),
        file: null,
        status: "reading" as const,
        readName: "",
        unclear: "",
        studentId: "",
        levels: Object.fromEntries(criteria.map((c) => [c.id, null])),
        pupilComment: "",
        teacherComment: "",
      },
    }));
    setRows((prev) => [...prev, ...added.map((a) => a.row)]);
    // A few at a time, so a whole class does not hit the function limit at once.
    const queue = [...added];
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) await readOne(next.row.key, next.file);
    };
    await Promise.all([worker(), worker(), worker()]);
  };

  const complete = rows.filter((r) => r.file && r.studentId && r.status !== "reading");
  const reading = rows.some((r) => r.status === "reading");

  const submit = async () => {
    try {
      await save.mutateAsync({
        lessonId: lesson.id,
        goalId,
        tickets: complete.map((r) => ({
          studentId: r.studentId,
          file: r.file!,
          levels: Object.fromEntries(Object.entries(r.levels).filter(([, v]) => v)) as Record<string, JctuCode>,
          pupilComment: r.pupilComment.trim(),
          teacherComment: r.teacherComment.trim(),
        })),
      });
      toast({ title: complete.length === 1 ? "Exitka uložena" : `Uloženo ${complete.length} exitek` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Exitky se nepodařilo uložit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nahrát vyplněné exitky</DialogTitle>
          <DialogDescription>
            Vyfoťte exitky a nahrajte je. Aplikace je přečte, vy u každé zkontrolujete žáka a zaškrtnuté schody. Uloží se
            teprve po potvrzení.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button variant="outline" onClick={() => input.current?.click()} className="self-start">
          <ImageUp />
          Vybrat fotky
        </Button>

        {rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.key} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row">
                <a href={r.preview} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={r.preview} alt="Fotka exitky" className="h-32 w-full rounded-lg object-cover sm:w-28" />
                </a>
                <div className="min-w-0 flex-1 space-y-2">
                  {r.status === "reading" ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Čtu exitku…
                    </p>
                  ) : (
                    <>
                      {r.status === "error" && (
                        <p className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          {r.error} Vyplňte ji prosím ručně.
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={r.studentId || NONE} onValueChange={(v) => patch(r.key, { studentId: v === NONE ? "" : v })}>
                          <SelectTrigger className="w-56" aria-label="Žák">
                            <SelectValue placeholder="Vyberte žáka" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Vyberte žáka</SelectItem>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(pupils as any[]).map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.first_name} {p.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {r.readName && !r.studentId && (
                          <span className="text-xs text-muted-foreground">Na exitce: „{r.readName}“</span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {criteria.map((c, i) => (
                          <div key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="min-w-0 flex-1 truncate" title={c.pupil_text || c.teacher_text}>
                              {i + 1}. {c.pupil_text || c.teacher_text || c.description}
                            </span>
                            <div className="flex gap-1" role="radiogroup" aria-label={`Kritérium ${i + 1}`}>
                              {JCTU_LEVELS.map((l) => {
                                const on = r.levels[c.id] === l.code;
                                return (
                                  <Button
                                    key={l.code}
                                    type="button"
                                    size="sm"
                                    variant={on ? "default" : "outline"}
                                    className="h-8 w-8 p-0"
                                    role="radio"
                                    aria-checked={on}
                                    title={l.label}
                                    onClick={() => patch(r.key, { levels: { ...r.levels, [c.id]: on ? null : l.code } })}
                                  >
                                    {l.letter}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {r.unclear && <p className="text-xs text-muted-foreground">Nejisté: {r.unclear}</p>}
                      <Input
                        aria-label="Komentář žáka"
                        placeholder="Komentář žáka"
                        value={r.pupilComment}
                        onChange={(e) => patch(r.key, { pupilComment: e.target.value })}
                      />
                      <Textarea
                        aria-label="Komentář pedagoga"
                        placeholder="Komentář pedagoga (nepovinné)"
                        className="min-h-[44px]"
                        value={r.teacherComment}
                        onChange={(e) => patch(r.key, { teacherComment: e.target.value })}
                      />
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Vyřadit"
                  className="self-start"
                  onClick={() => {
                    URL.revokeObjectURL(r.preview);
                    setRows((prev) => prev.filter((x) => x.key !== r.key));
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="items-center gap-2">
          {rows.length > 0 && (
            <span className="mr-auto text-sm text-muted-foreground">
              Připraveno {complete.length} z {rows.length}
              {rows.length > complete.length && !reading ? " (bez vybraného žáka se exitka neuloží)" : ""}
            </span>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={submit} disabled={reading || complete.length === 0 || save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Potvrdit a uložit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

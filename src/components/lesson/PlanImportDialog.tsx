import { useState } from "react";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAddPlanLessons } from "@/hooks/usePlanLessons";
import { supabase } from "@/integrations/supabase/client";
import { invokeAi } from "@/lib/ai";
import { buildUploadPath, createSignedUrl, EDGE_FUNCTION_URL_TTL_SECONDS } from "@/lib/storage";
import { SCHOOL_MONTHS, gradeFromClassName } from "@/constants/schoolYear";

interface Row {
  keep: boolean;
  month: string;
  title: string;
  description: string;
  hours: number;
  rvp_outcome: string;
}

interface PlanImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    id: string;
    class_id: string;
    subject_id: string;
    classes?: { name: string } | null;
    subjects?: { name: string } | null;
  };
  startPosition: number;
}

const NO_MONTH = "–";

/**
 * Turn a thematic plan the teacher already has into lessons (zadání kap. 4.3):
 * paste the text or upload a PDF or photo, check the rows the AI read, keep
 * the ones that fit. Goals and criteria come afterwards, lesson by lesson.
 */
export function PlanImportDialog({ open, onOpenChange, course, startPosition }: PlanImportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const addLessons = useAddPlanLessons();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<"text" | "file">("text");
  const [hoursPerLesson, setHoursPerLesson] = useState("1");
  const [reading, setReading] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);

  const reset = () => {
    setRows(null);
    setText("");
    setFile(null);
  };

  const read = async () => {
    setReading(true);
    try {
      let fileUrl: string | null = null;
      if (source === "file") {
        if (!file || !user) throw new Error("Vyberte soubor s plánem.");
        const path = buildUploadPath(user.id, file.name);
        const { error } = await supabase.storage.from("course-files").upload(path, file);
        if (error) throw error;
        fileUrl = await createSignedUrl("course-files", path, EDGE_FUNCTION_URL_TTL_SECONDS);
      }
      const { data, error } = await invokeAi<{ rows: Omit<Row, "keep">[] }>("plan-rows", {
        body: {
          text: source === "text" ? text : "",
          fileUrl: fileUrl ?? "",
          subject: course.subjects?.name,
          grade: gradeFromClassName(course.classes?.name),
          hoursPerLesson: Number(hoursPerLesson),
        },
      });
      if (error) throw error;
      const read = (data?.rows ?? []).map((r) => ({ ...r, keep: true }));
      if (read.length === 0) throw new Error("V plánu se nepodařilo najít žádná témata.");
      setRows(read);
    } catch (e) {
      toast({ title: "Plán se nepodařilo přečíst", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setReading(false);
    }
  };

  const update = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev!.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const kept = rows?.filter((r) => r.keep && r.title.trim()) ?? [];

  const add = async () => {
    try {
      await addLessons.mutateAsync({
        course,
        startPosition,
        sourceText: source === "text" ? text.trim() : undefined,
        rows: kept.map((r) => ({
          title: r.title.trim(),
          description: r.description.trim(),
          month: r.month || null,
          hours: r.hours || null,
          rvp_outcome: r.rvp_outcome.trim() || null,
        })),
      });
      toast({ title: `Přidáno ${kept.length} lekcí`, description: "Cíle a kritéria jim vytvoříte tlačítkem Vygenerovat lekce." });
      reset();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Lekce se nepodařilo přidat", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Načíst tematický plán</DialogTitle>
          <DialogDescription>
            Vložte plán, který už máte. AI z něj udělá lekce po měsících, vy je zkontrolujete.
          </DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="space-y-4">
            <Tabs value={source} onValueChange={(v) => setSource(v as "text" | "file")}>
              <TabsList>
                <TabsTrigger value="text">Vložit text</TabsTrigger>
                <TabsTrigger value="file">Nahrát soubor</TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                <Textarea
                  aria-label="Text tematického plánu"
                  className="min-h-[200px]"
                  placeholder="Zkopírujte sem plán z Wordu, Excelu nebo e-mailu."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="file">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground hover:border-input">
                  <FileUp className="h-6 w-6" />
                  {file ? <span className="text-foreground">{file.name}</span> : "PDF nebo fotografie plánu"}
                  <input
                    type="file"
                    accept="application/pdf,image/*,text/plain"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </TabsContent>
            </Tabs>
            <div className="flex items-end gap-3">
              <div>
                <Label>Délka jedné lekce</Label>
                <Select value={hoursPerLesson} onValueChange={setHoursPerLesson}>
                  <SelectTrigger className="mt-1.5 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 vyučovací hodina</SelectItem>
                    <SelectItem value="2">2 vyučovací hodiny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="brand"
                onClick={read}
                disabled={reading || (source === "text" ? !text.trim() : !file)}
              >
                {reading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {reading ? "Čtu plán…" : "Přečíst plán"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Zkontrolujte lekce. Odškrtněte ty, které nechcete, a opravte, co nesedí.
            </p>
            <div className="divide-y rounded-lg border">
              {rows.map((r, i) => (
                <div key={i} className="flex items-start gap-2 p-2">
                  <Checkbox
                    className="mt-2.5"
                    aria-label={`Přidat lekci ${r.title}`}
                    checked={r.keep}
                    onCheckedChange={(v) => update(i, { keep: v === true })}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Input aria-label="Název lekce" className="h-8" value={r.title} onChange={(e) => update(i, { title: e.target.value })} />
                    {r.description && <p className="px-1 text-xs text-muted-foreground">{r.description}</p>}
                  </div>
                  <Select value={r.month || NO_MONTH} onValueChange={(v) => update(i, { month: v === NO_MONTH ? "" : v })}>
                    <SelectTrigger aria-label="Měsíc" className="h-8 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_MONTH}>bez měsíce</SelectItem>
                      {SCHOOL_MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label="Dotace"
                    inputMode="decimal"
                    className="h-8 w-14"
                    value={String(r.hours)}
                    onChange={(e) => update(i, { hours: Number(e.target.value.replace(",", ".")) || 0 })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {rows && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRows(null)}>
              Zpět
            </Button>
            <Button onClick={add} disabled={kept.length === 0 || addLessons.isPending}>
              {addLessons.isPending && <Loader2 className="animate-spin" />}
              Přidat {kept.length} {kept.length === 1 ? "lekci" : kept.length < 5 ? "lekce" : "lekcí"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

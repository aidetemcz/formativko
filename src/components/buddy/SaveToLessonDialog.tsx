import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProposalCard } from "@/components/buddy/ProposalCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSaveProposal, useSearchEverything } from "@/hooks/useBuddy";
import { useCourses } from "@/hooks/useCourses";
import { fetchLessonDetail } from "@/hooks/usePlanLessons";
import { SCHOOL_MONTHS, schoolMonthOf } from "@/constants/schoolYear";
import { snapshotOf, type Proposal } from "@/lib/buddy";

/**
 * "Uložit do lekce" under a brainstormed lesson plan (zadání kap. 5.2, bod 4):
 * into an existing lesson or a new one in a plan, with the same preview and
 * confirmation as any other change from Buddy.
 */
export function SaveToLessonDialog({ open, onOpenChange, text }: { open: boolean; onOpenChange: (open: boolean) => void; text: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const save = useSaveProposal();
  const { data: plans = [] } = useCourses();
  const [query, setQuery] = useState("");
  const { data: hits = [] } = useSearchEverything(query);
  const lessons = hits.filter((h) => h.kind === "lesson");
  const [planId, setPlanId] = useState("");
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState<string>(schoolMonthOf(new Date()));
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);

  const close = (value: boolean) => {
    if (!value) {
      setProposal(null);
      setQuery("");
      setTitle("");
    }
    onOpenChange(value);
  };

  const intoLesson = async (lessonId: string) => {
    setLoading(true);
    try {
      const lesson = await fetchLessonDetail(lessonId);
      const before = snapshotOf(lesson);
      setProposal({
        id: crypto.randomUUID(),
        type: "lesson_update",
        status: "pending",
        summary: "Průběh hodiny z rozhovoru s Buddym",
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        before,
        after: { ...before, planned_activities: text },
      });
    } catch (e) {
      toast({ title: "Lekci se nepodařilo načíst", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const intoNewLesson = () => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || !title.trim()) return;
    setProposal({
      id: crypto.randomUUID(),
      type: "lesson_create",
      status: "pending",
      summary: "Nová lekce s průběhem hodiny z rozhovoru s Buddym",
      plan_id: plan.id,
      plan_name: plan.name,
      after: { title: title.trim(), description: "", month, hours: 1, planned_activities: text, goal: null, criteria: [] },
    });
  };

  const confirm = async () => {
    if (!proposal) return;
    try {
      const lessonId = await save.mutateAsync({ messageId: null, proposal });
      toast({ title: "Uloženo do lekce" });
      close(false);
      if (lessonId) navigate(`/lekce/${lessonId}`);
    } catch (e) {
      toast({ title: "Nepodařilo se uložit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uložit do lekce</DialogTitle>
          <DialogDescription>Průběh hodiny se uloží do lekce, až ho v náhledu potvrdíte.</DialogDescription>
        </DialogHeader>

        {proposal ? (
          <ProposalCard proposal={proposal} saving={save.isPending} onSave={confirm} onDiscard={() => setProposal(null)} />
        ) : (
          <Tabs defaultValue="existing">
            <TabsList>
              <TabsTrigger value="existing">Existující lekce</TabsTrigger>
              <TabsTrigger value="new">Nová lekce</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="space-y-2">
              <Input autoFocus placeholder="Hledat lekci podle názvu nebo tématu…" value={query} onChange={(e) => setQuery(e.target.value)} />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <ul className="divide-y rounded-lg border">
                {lessons.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">{query.trim().length < 2 ? "Napište aspoň dvě písmena." : "Nic nenalezeno."}</li>
                ) : (
                  lessons.map((l) => (
                    <li key={l.id}>
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => intoLesson(l.id)}>
                        {l.title}
                        {l.subtitle && <span className="text-muted-foreground"> · {l.subtitle}</span>}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </TabsContent>
            <TabsContent value="new" className="space-y-3">
              <div>
                <Label className="mb-1.5 block">Tematický plán</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger aria-label="Tematický plán">
                    <SelectValue placeholder="Vyberte plán…" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
                <div>
                  <Label htmlFor="new-lesson-title" className="mb-1.5 block">
                    Název lekce
                  </Label>
                  <Input id="new-lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Měsíc</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger aria-label="Měsíc">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={intoNewLesson} disabled={!planId || !title.trim()}>
                Ukázat náhled
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

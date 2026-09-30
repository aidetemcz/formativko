import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EvaluationSources } from "@/components/evaluation/EvaluationSources";
import { ListSkeleton } from "@/components/shared/ListSkeleton";
import { RadceReview } from "@/components/shared/RadceReview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDeleteEvaluationGroup, useEvaluationBatch, useUpdateEvaluation, type BatchEvaluation } from "@/hooks/useEvaluations";
import { usePageTitle } from "@/hooks/usePageTitle";
import { invokeAi } from "@/lib/ai";
import {
  DEFAULT_SETTINGS,
  MODE_LABELS,
  STATUS_LABELS,
  batchAsDocument,
  batchAsText,
  evaluationStatus,
  generateEvaluation,
  needsGenerating,
  type EvaluationMode,
  type EvaluationStatus,
} from "@/lib/evaluations";
import { runQueue, type GenerationStatus } from "@/lib/lessonGeneration";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<EvaluationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-ready text-ready-foreground",
  insufficient: "bg-missing text-missing-foreground",
};

function pupilName(e: BatchEvaluation) {
  return e.students ? `${e.students.first_name} ${e.students.last_name}` : "Žák";
}

function initials(e: BatchEvaluation) {
  return e.students ? `${e.students.first_name.charAt(0)}${e.students.last_name.charAt(0)}` : "?";
}

/**
 * One evaluation batch (zadání kap. 4.5, Veroničin HodnoceniResultPage): the
 * pupils on the left, the text of the chosen one on the right with the
 * Rádce's comments and the records each sentence was written from. A text is
 * edited, then approved; only approved texts are copied or exported.
 */
export default function HodnoceniDetail() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: batch, isLoading } = useEvaluationBatch(id);
  const update = useUpdateEvaluation();
  const remove = useDeleteEvaluationGroup();
  usePageTitle(batch?.name ?? "Hodnocení");

  const [activeId, setActiveId] = useState<string | null>(params.get("zak"));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<Record<string, { status: GenerationStatus; error?: string }>>({});
  const [copied, setCopied] = useState(false);
  const generating = Object.values(running).some((r) => r.status === "waiting" || r.status === "running");

  const evaluations = useMemo(() => batch?.evaluations ?? [], [batch]);
  const active =
    evaluations.find((e) => e.id === activeId || e.student_id === activeId) ?? evaluations[0] ?? null;
  const index = active ? evaluations.indexOf(active) : -1;
  const mode: EvaluationMode = batch?.mode ?? (batch?.type === "vysvedceni" ? "certificate" : "feedback");
  const settings = { ...DEFAULT_SETTINGS[mode], ...(batch?.settings ?? {}) };
  const missing = evaluations.filter(needsGenerating);

  const generate = useCallback(
    async (items: BatchEvaluation[]) => {
      if (!batch || items.length === 0) return;
      await runQueue(
        items,
        async (e) => {
          const result = await generateEvaluation(invokeAi, {
            studentId: e.student_id,
            mode,
            dateFrom: batch.date_from,
            dateTo: batch.date_to,
            className: batch.classes?.name ?? "",
            subjectId: batch.subject_id,
            subjectName: batch.subjects?.name ?? "",
            settings,
          });
          await update.mutateAsync({ id: e.id, ...result });
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[e.id];
            return next;
          });
        },
        (itemId, status, error) => setRunning((prev) => ({ ...prev, [itemId]: { status, error } })),
      );
    },
    // settings is rebuilt every render from the batch
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [batch, mode, update],
  );

  // Coming from the generator: write the empty drafts straight away.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !batch || params.get("generovat") !== "1") return;
    started.current = true;
    const next = new URLSearchParams(params);
    next.delete("generovat");
    setParams(next, { replace: true });
    generate(batch.evaluations.filter(needsGenerating));
  }, [batch, params, setParams, generate]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl pt-6">
          <ListSkeleton count={3} />
        </div>
      </AppLayout>
    );
  }
  if (!batch) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl pt-10 text-center">
          <p className="font-medium">Hodnocení nenalezeno</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/hodnoceni">Zpět na hodnocení</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const approved = evaluations.filter((e) => evaluationStatus(e.status) === "approved");
  const exportItems = approved.map((e) => ({ name: pupilName(e), text: e.text }));

  const copyAll = async () => {
    await navigator.clipboard?.writeText(batchAsText(exportItems)).catch(() => {});
    toast({ title: `Zkopírováno ${approved.length} schválených textů` });
  };
  const download = () => {
    const blob = new Blob([batchAsDocument(batch.name, exportItems)], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.name.replace(/[\\/:*?"<>|]/g, "")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const deleteBatch = async () => {
    if (!window.confirm("Smazat celé hodnocení i s texty všech žáků?")) return;
    await remove.mutateAsync(batch.id);
    navigate("/hodnoceni");
  };

  const text = active ? drafts[active.id] ?? active.text ?? "" : "";
  const status = active ? evaluationStatus(active.status) : "draft";
  const run = active ? running[active.id] : undefined;
  const busy = run?.status === "waiting" || run?.status === "running";

  const saveText = () => {
    if (!active || drafts[active.id] === undefined || drafts[active.id] === active.text) return;
    update.mutate(
      { id: active.id, text: drafts[active.id] },
      { onError: (e) => toast({ title: "Text se nepodařilo uložit", description: e.message, variant: "destructive" }) },
    );
  };
  const setStatus = (next: EvaluationStatus) => {
    if (!active) return;
    update.mutate(
      { id: active.id, status: next, ...(drafts[active.id] !== undefined ? { text: drafts[active.id] } : {}) },
      { onError: (e) => toast({ title: "Nepodařilo se uložit", description: e.message, variant: "destructive" }) },
    );
  };
  const rewrite = () => {
    if (!active) return;
    if (text.trim() && !window.confirm("Napsat text znovu? Vaše úpravy se přepíšou.")) return;
    generate([active]);
  };
  const copyOne = async () => {
    await navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const chips: [string, string][] = [
    ["Třída", batch.classes?.name ?? "—"],
    ["Předmět", batch.subjects?.name ?? "Všechny"],
    ["Období", evaluations[0]?.period ?? [batch.date_from, batch.date_to].filter(Boolean).join(" – ")],
    ["Druh", MODE_LABELS[mode]],
    ["Schváleno", `${approved.length} z ${evaluations.length}`],
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl pb-12">
        <PageHeader
          breadcrumbs={[{ label: "Hodnocení", href: "/hodnoceni" }, { label: batch.name }]}
          title={batch.name}
          help="Každý text projděte, upravte a schvalte. Rádce k němu píše připomínky podle metodiky; pod textem vidíte, z kterých důkazů a úrovní vychází."
          actions={
            <>
              {missing.length > 0 && !generating && (
                <Button variant="outline" onClick={() => generate(missing)}>
                  <Sparkles />
                  Dopsat chybějící ({missing.length})
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={approved.length === 0} title={approved.length === 0 ? "Exportovat jde jen schválené texty" : undefined}>
                    <Download />
                    Exportovat
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyAll}>Zkopírovat schválené texty</DropdownMenuItem>
                  <DropdownMenuItem onClick={download}>Stáhnout pro Word</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" title="Smazat hodnocení" onClick={deleteBatch}>
                <Trash2 />
              </Button>
            </>
          }
        />

        <div className="mb-5 flex flex-wrap gap-2">
          {chips.map(([label, value]) => (
            <span key={label} className="rounded-full border bg-card px-3 py-1 text-xs">
              <span className="text-muted-foreground">{label}: </span>
              {value}
            </span>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
          <nav aria-label="Žáci" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {evaluations.map((e) => {
              const on = e.id === active?.id;
              const r = running[e.id];
              const st = evaluationStatus(e.status);
              return (
                <button
                  key={e.id}
                  onClick={() => setActiveId(e.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    on ? "bg-card shadow-sm ring-1 ring-border" : "hover:bg-accent",
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {initials(e)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{pupilName(e)}</span>
                  {r?.status === "running" || r?.status === "waiting" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : r?.status === "error" ? (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  ) : st === "approved" ? (
                    <Check className="h-3.5 w-3.5 text-ready-foreground" aria-label="Schváleno" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          {active && (
            <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/zaci/${active.student_id}`} className="font-medium hover:underline">
                  {pupilName(active)}
                </Link>
                <Badge variant="plain" className={STATUS_CLASSES[status]}>
                  {STATUS_LABELS[status]}
                </Badge>
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  {index + 1} z {evaluations.length}
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Předchozí žák" disabled={index <= 0} onClick={() => setActiveId(evaluations[index - 1].id)}>
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Další žák"
                    disabled={index >= evaluations.length - 1}
                    onClick={() => setActiveId(evaluations[index + 1].id)}
                  >
                    <ChevronRight />
                  </Button>
                </span>
              </div>

              {busy ? (
                <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {run?.status === "waiting" ? "Čeká na řadu…" : "Buddy píše hodnocení…"}
                </p>
              ) : run?.status === "error" ? (
                <div className="py-6 text-sm">
                  <p className="text-destructive">Text se nepodařilo napsat: {run.error}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => generate([active])}>
                    <RotateCcw />
                    Zkusit znovu
                  </Button>
                </div>
              ) : status === "insufficient" ? (
                <div className="py-6 text-sm">
                  <p>
                    Za toto období o žákovi nemáte žádné důkazy ani úrovně, takže Buddy nemá z čeho psát.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/napady${batch.class_id ? `?trida=${batch.class_id}` : ""}`}>Doplnit úrovně v Nápadech</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => generate([active])}>
                      <RotateCcw />
                      Zkusit znovu
                    </Button>
                  </div>
                </div>
              ) : needsGenerating(active) && !generating ? (
                <div className="py-6 text-sm">
                  <p className="text-muted-foreground">Text zatím není napsaný.</p>
                  <Button size="sm" className="mt-3" onClick={() => generate([active])}>
                    <Sparkles />
                    Napsat
                  </Button>
                </div>
              ) : (
                <>
                  <Textarea
                    aria-label="Text hodnocení"
                    className="mt-3 min-h-[12rem] text-[0.9375rem] leading-relaxed"
                    value={text}
                    readOnly={status === "approved"}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [active.id]: e.target.value }))}
                    onBlur={saveText}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {status === "approved" ? (
                      <>
                        <Button onClick={copyOne}>
                          <Copy />
                          {copied ? "Zkopírováno" : "Kopírovat"}
                        </Button>
                        <Button variant="outline" onClick={() => setStatus("draft")}>
                          <Undo2 />
                          Vrátit ke konceptu
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => setStatus("approved")} disabled={!text.trim()}>
                          <Check />
                          Schválit
                        </Button>
                        <Button variant="outline" onClick={rewrite}>
                          <RotateCcw />
                          Napsat znovu
                        </Button>
                      </>
                    )}
                  </div>

                  <RadceReview
                    key={active.id}
                    text={text}
                    mode={mode}
                    className={batch.classes?.name}
                    studentId={active.student_id}
                    initialReview={active.review}
                    recommendationsOutside={active.recommendations_outside}
                    onReviewed={(review) => update.mutate({ id: active.id, review })}
                  />

                  <EvaluationSources sentences={active.sentences} />
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

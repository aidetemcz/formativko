import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Info, Loader2, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReadinessBadge } from "@/components/shared/ReadinessBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useClassOverview } from "@/hooks/useClassOverview";
import { useClasses } from "@/hooks/useClasses";
import { useCreateEvaluationBatch } from "@/hooks/useEvaluations";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSubjects } from "@/hooks/useSubjects";
import { currentPeriod, schoolPeriods, type SchoolPeriod } from "@/constants/schoolYear";
import {
  DEFAULT_SETTINGS,
  LENGTH_STEPS,
  MODE_LABELS,
  TONE_STEPS,
  type EvaluationMode,
  type EvaluationSettings,
} from "@/lib/evaluations";
import { cn } from "@/lib/utils";

const ALL = "vse";
const CUSTOM = "vlastni";

const MODE_HINTS: Record<EvaluationMode, string> = {
  feedback: "Pro žáka a rodiče během roku. Text končí doporučením, co dál.",
  certificate: "Na vysvědčení. Doporučení dalších kroků dostanete zvlášť, mimo text.",
};

function formatDay(iso: string) {
  return iso.split("-").reverse().join(". ").replace(/^0/, "");
}

/**
 * New evaluation batch (zadání kap. 4.5, Veroničin HodnoceniGeneratorPage):
 * mode, class, subject, period, pupils with the readiness semafor, tone and
 * length. The texts are written on the batch page, one pupil at a time.
 */
export default function HodnoceniNove() {
  usePageTitle("Nové hodnocení");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const create = useCreateEvaluationBatch();

  const periods = useMemo(() => schoolPeriods(new Date()), []);
  const [mode, setMode] = useState<EvaluationMode>("feedback");
  const [settings, setSettings] = useState<EvaluationSettings>(DEFAULT_SETTINGS.feedback);
  const [classId, setClassId] = useState(params.get("trida") ?? "");
  const [subjectId, setSubjectId] = useState(ALL);
  const [periodId, setPeriodId] = useState(() => currentPeriod(new Date()).id);
  const [customFrom, setCustomFrom] = useState(periods[0].from);
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const period: SchoolPeriod =
    periodId === CUSTOM
      ? { id: CUSTOM, label: `${formatDay(customFrom)} – ${formatDay(customTo)}`, from: customFrom, to: customTo }
      : periods.find((p) => p.id === periodId) ?? periods[0];
  const { data: overview, isLoading: loadingPupils } = useClassOverview(classId || undefined, period);
  const rows = overview?.rows ?? [];
  const cls = classes.find((c) => c.id === classId);
  const subject = subjects.find((s) => s.id === subjectId);

  useEffect(() => setSelected(new Set()), [classId]);

  const chooseMode = (m: EvaluationMode) => {
    setMode(m);
    setSettings((s) => ({ ...DEFAULT_SETTINGS[m], preferences: s.preferences, includeSvp: s.includeSvp }));
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const readyIds = rows.filter((r) => r.readiness.status === "ready").map((r) => r.pupil.id);
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const notReadySelected = rows.filter(
    (r) => selected.has(r.pupil.id) && (r.readiness.status === "partial" || r.readiness.status === "missing"),
  ).length;

  const submit = async () => {
    if (!cls || selected.size === 0) return;
    try {
      const name = [`Hodnocení ${cls.name}`, subject?.name, period.label].filter(Boolean).join(" · ");
      const id = await create.mutateAsync({
        name,
        mode,
        classId: cls.id,
        subjectId: subject?.id ?? null,
        subjectName: subject?.name ?? "",
        dateFrom: period.from,
        dateTo: period.to,
        periodLabel: period.label,
        settings,
        studentIds: rows.filter((r) => selected.has(r.pupil.id)).map((r) => r.pupil.id),
      });
      navigate(`/hodnoceni/${id}?generovat=1`);
    } catch (e) {
      toast({ title: "Hodnocení se nepodařilo založit", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          breadcrumbs={[{ label: "Hodnocení", href: "/hodnoceni" }, { label: "Nové hodnocení" }]}
          title="Vygenerovat hodnocení"
          help="Buddy navrhne slovní hodnocení vybraných žáků z důkazů o učení a úrovní u kritérií. Každý text pak projdete, upravíte a schválíte."
        />

        <div className="space-y-6 pb-12">
          <section>
            <Label className="mb-2 block">Druh hodnocení</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(MODE_LABELS) as EvaluationMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => chooseMode(m)}
                  className={cn(
                    "rounded-xl border bg-card p-3 text-left transition-colors",
                    mode === m ? "border-primary ring-1 ring-primary" : "hover:bg-accent/50",
                  )}
                >
                  <span className="block text-sm font-medium">{MODE_LABELS[m]}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{MODE_HINTS[m]}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Třída</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger aria-label="Třída">
                  <SelectValue placeholder="Vyberte třídu…" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Předmět</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger aria-label="Předmět">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Všechny předměty</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section>
            <Label className="mb-2 block">Období</Label>
            <div className="flex flex-wrap gap-2">
              {[...periods, { id: CUSTOM, label: "Vlastní" }].map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={periodId === p.id ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setPeriodId(p.id)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {periodId === CUSTOM && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input type="date" aria-label="Od" className="w-44" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} />
                <span className="text-muted-foreground">–</span>
                <Input type="date" aria-label="Do" className="w-44" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Label>Žáci</Label>
              {selected.size > 0 && <span className="text-xs text-muted-foreground">{selected.size} vybráno</span>}
              {rows.length > 0 && (
                <span className="ml-auto flex gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set(readyIds))} disabled={readyIds.length === 0}>
                    Vybrat připravené
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.pupil.id)))}
                  >
                    {allSelected ? "Zrušit výběr" : "Vybrat všechny"}
                  </Button>
                </span>
              )}
            </div>
            {!classId ? (
              <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                Nejdřív vyberte třídu, pak si vyberete žáky, které chcete hodnotit.
              </p>
            ) : loadingPupils ? (
              <p className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Načítám žáky…
              </p>
            ) : rows.length === 0 ? (
              <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Třída zatím nemá žáky.</p>
            ) : (
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                {rows.map(({ pupil, proofs, readiness }) => {
                  const count = proofs.text + proofs.camera + proofs.voice + proofs.file;
                  return (
                    <li key={pupil.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Checkbox
                        id={`p-${pupil.id}`}
                        checked={selected.has(pupil.id)}
                        onCheckedChange={() => toggle(pupil.id)}
                      />
                      <label htmlFor={`p-${pupil.id}`} className="min-w-0 flex-1 cursor-pointer truncate text-sm">
                        {pupil.first_name} {pupil.last_name}
                      </label>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {count} {count === 1 ? "důkaz" : count >= 2 && count <= 4 ? "důkazy" : "důkazů"}
                      </span>
                      <ReadinessBadge result={readiness} />
                      {readiness.status !== "ready" && readiness.status !== "nothing_taught" && (
                        <Link
                          to={`/napady?trida=${classId}${periodId !== CUSTOM ? `&obdobi=${periodId}` : ""}`}
                          className="whitespace-nowrap text-xs text-brand hover:underline"
                        >
                          Doplnit
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {notReadySelected > 0 && (
              <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                U {notReadySelected} {notReadySelected === 1 ? "vybraného žáka" : "vybraných žáků"} chybí úrovně z probraných
                lekcí. Text bude obecnější; chybějící úrovně doplníte v Nápadech.
              </p>
            )}
          </section>

          <section className="space-y-5 rounded-xl border bg-card p-4">
            <Label className="block">Jak má zpětná vazba znít</Label>
            {[
              { key: "tone" as const, steps: TONE_STEPS, left: "Profesionální", right: "Přátelská" },
              { key: "length" as const, steps: LENGTH_STEPS, left: "Stručná", right: "Podrobná" },
            ].map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                  <span>{s.left}</span>
                  <span>{s.right}</span>
                </div>
                <Slider
                  aria-label={`${s.left} až ${s.right}`}
                  min={0}
                  max={s.steps.length - 1}
                  step={1}
                  value={[(s.steps as readonly string[]).indexOf(settings[s.key])]}
                  onValueChange={([v]) => setSettings((prev) => ({ ...prev, [s.key]: s.steps[v] }))}
                />
              </div>
            ))}
            <div>
              <Label htmlFor="preferences" className="mb-1.5 block text-sm">
                Na co se zaměřit (nepovinné)
              </Label>
              <Textarea
                id="preferences"
                placeholder="Např. ocenit pokrok ve čtení, zmínit spolupráci ve skupině…"
                value={settings.preferences}
                onChange={(e) => setSettings((prev) => ({ ...prev, preferences: e.target.value }))}
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={settings.includeSvp}
                onCheckedChange={(v) => setSettings((prev) => ({ ...prev, includeSvp: v === true }))}
                className="mt-0.5"
              />
              <span>
                Poslat AI i podrobnosti o speciálních vzdělávacích potřebách
                <span className="block text-xs text-muted-foreground">Jen u žáků se SVP a jen pod přezdívkou.</span>
              </span>
            </label>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Buddy píše podle metodiky formativního hodnocení: popisuje pokrok, drží se důkazů a podporuje žáka. Tón a délka
              to nepřebijí.
            </p>
          </section>

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link to="/hodnoceni">Zrušit</Link>
            </Button>
            <Button onClick={submit} disabled={!cls || selected.size === 0 || create.isPending}>
              {create.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Vygenerovat {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

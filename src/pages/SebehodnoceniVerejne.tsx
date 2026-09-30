import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";
import { JCTU_LEVELS, pupilSentence, type JctuCode, type JctuScale } from "@/constants/jctu";

interface Loaded {
  lesson: { title: string; goal: string };
  criteria: { id: string; text: string; scale: Partial<JctuScale> | null }[];
  pupils: { id: string; label: string }[];
}

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/self-assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Něco se nepovedlo. Zkus to prosím znovu.");
  return data as T;
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background px-4 py-6">{children}</div>;
}

function Message({ title, text }: { title: string; text?: string }) {
  return (
    <Screen>
      <div className="mx-auto mt-16 max-w-sm rounded-2xl border bg-card p-8 text-center">
        <p className="text-lg font-medium">{title}</p>
        {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
      </div>
    </Screen>
  );
}

/**
 * The online exit ticket pupils open from the QR code (/s/:token, zadání
 * kap. 2.3): no login, no menu. The pupil picks their name, a step for each
 * criterion, may add a comment, and sends it.
 */
export default function SebehodnoceniVerejne() {
  usePageTitle("Exitka");
  const { token = "" } = useParams<{ token: string }>();
  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [levels, setLevels] = useState<Record<string, JctuCode>>({});
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    post<Loaded>({ action: "load", token })
      .then(setData)
      .catch((e) => setLoadError(e.message));
  }, [token]);

  if (loadError) return <Message title="Exitku nejde otevřít" text={loadError} />;
  if (!data) {
    return (
      <Screen>
        <Loader2 className="mx-auto mt-24 h-8 w-8 animate-spin text-muted-foreground" />
      </Screen>
    );
  }

  const pupil = data.pupils.find((p) => p.id === studentId);

  if (sent) {
    return (
      <Screen>
        <div className="mx-auto mt-16 max-w-sm rounded-2xl border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-lg font-medium">Díky, {pupil?.label}!</p>
          <p className="mt-2 text-sm text-muted-foreground">Exitka je odeslaná.</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setSent(false);
              setStudentId(null);
              setLevels({});
              setComment("");
            }}
          >
            Vyplní další spolužák
          </Button>
        </div>
      </Screen>
    );
  }

  if (!pupil) {
    return (
      <Screen>
        <div className="mx-auto max-w-lg">
          <p className="text-sm text-muted-foreground">{data.lesson.title}</p>
          <h1 className="mt-1 text-2xl font-semibold">Kdo jsi?</h1>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.pupils.map((p) => (
              <Button key={p.id} variant="outline" className="h-12 text-base" onClick={() => setStudentId(p.id)}>
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </Screen>
    );
  }

  const complete = data.criteria.every((c) => levels[c.id]);

  const send = async () => {
    setSending(true);
    setSendError(null);
    try {
      await post({ action: "submit", token, studentId, levels, comment });
      setSent(true);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Něco se nepovedlo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <div className="mx-auto max-w-lg space-y-5 pb-8">
        <div>
          <button className="text-sm text-muted-foreground underline" onClick={() => setStudentId(null)}>
            Nejsem {pupil.label}
          </button>
          <h1 className="mt-2 text-2xl font-semibold">{data.lesson.title}</h1>
          {data.lesson.goal && <p className="mt-1 text-muted-foreground">{data.lesson.goal}</p>}
        </div>

        {data.criteria.map((c, i) => (
          <section key={c.id} className="rounded-2xl border bg-card p-4">
            <p className="font-medium">
              {i + 1}. {c.text}
            </p>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label={c.text}>
              {JCTU_LEVELS.map((l) => {
                const on = levels[c.id] === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setLevels((prev) => ({ ...prev, [c.id]: l.code }))}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      on ? "border-primary bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-semibold",
                        on && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {l.letter}
                    </span>
                    <span className="pt-1 text-sm">{pupilSentence(l.code, c.scale)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <div>
          <label htmlFor="comment" className="text-sm font-medium">
            Chceš něco dodat? (nepovinné)
          </label>
          <Textarea id="comment" className="mt-1.5" value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} />
        </div>

        {sendError && <p className="text-sm text-destructive">{sendError}</p>}
        <Button size="lg" className="w-full" disabled={!complete || sending} onClick={send}>
          {sending && <Loader2 className="animate-spin" />}
          Odeslat
        </Button>
        {!complete && <p className="text-center text-xs text-muted-foreground">Vyber prosím schod u každého kritéria.</p>}
      </div>
    </Screen>
  );
}

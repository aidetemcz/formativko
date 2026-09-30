import { useMemo } from "react";
import { LevelChip } from "@/components/shared/LevelChip";
import { useEvaluationSources } from "@/hooks/useEvaluations";
import type { JctuCode } from "@/constants/jctu";
import type { EvaluationSentence } from "@/lib/evaluations";

const PROOF_TYPE_LABELS: Record<string, string> = {
  text: "poznámka",
  camera: "fotka",
  voice: "nahrávka",
  file: "soubor",
};

/**
 * "Napsáno z…" (zadání kap. 2.4): each sentence of the generated text with
 * the proofs and levels it was written from. A sentence without sources is
 * marked, so the teacher knows which parts to check against what they know.
 */
export function EvaluationSources({ sentences }: { sentences: EvaluationSentence[] }) {
  const proofIds = useMemo(() => [...new Set(sentences.flatMap((s) => s.proofIds))], [sentences]);
  const assessmentIds = useMemo(() => [...new Set(sentences.flatMap((s) => s.assessmentIds))], [sentences]);
  const { data } = useEvaluationSources(proofIds, assessmentIds);
  if (sentences.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proofs = new Map((data?.proofs ?? []).map((p: any) => [p.id, p]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const levels = new Map((data?.levels ?? []).map((l: any) => [l.id, l]));

  return (
    <details className="mt-4 rounded-lg border p-3 text-sm" open>
      <summary className="cursor-pointer font-medium">Napsáno z…</summary>
      <p className="mt-1 text-xs text-muted-foreground">
        Věty tak, jak je Buddy napsal, a záznamy, ze kterých vychází. Po vašich úpravách textu platí dál jako vodítko.
      </p>
      <ol className="mt-3 space-y-3">
        {sentences.map((s, i) => {
          const found = [
            ...s.assessmentIds.map((id) => levels.get(id)).filter(Boolean),
            ...s.proofIds.map((id) => proofs.get(id)).filter(Boolean),
          ];
          return (
            <li key={i}>
              <p>{s.text}</p>
              {s.proofIds.length + s.assessmentIds.length === 0 ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Bez konkrétního záznamu – zkontrolujte, zda sedí.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {s.assessmentIds.map((id) => {
                    const l = levels.get(id);
                    if (!l) return null;
                    const c = l.evaluation_criteria;
                    return (
                      <li key={id} className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <LevelChip level={l.level as JctuCode} />
                        {c?.teacher_text || c?.pupil_text || c?.description}
                        <span>· {new Date(l.assessed_at).toLocaleDateString("cs-CZ")}</span>
                      </li>
                    );
                  })}
                  {s.proofIds.map((id) => {
                    const p = proofs.get(id);
                    if (!p) return null;
                    return (
                      <li key={id} className="text-xs text-muted-foreground">
                        {PROOF_TYPE_LABELS[p.type] ?? "důkaz"}: {p.title} · {new Date(p.date).toLocaleDateString("cs-CZ")}
                      </li>
                    );
                  })}
                  {found.length === 0 && data && (
                    <li className="text-xs text-muted-foreground">Záznam už byl mezitím odstraněn.</li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

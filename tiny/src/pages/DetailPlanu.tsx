import { Link, useParams } from "react-router-dom";
import { Karta, Nadpis, Prazdno, Sekce, Stitek } from "../components/ui";
import { cileVPlanu, najdiPlan } from "../data/mock";

export default function DetailPlanu() {
  const { planId } = useParams();
  const plan = najdiPlan(planId!);
  const cile = cileVPlanu(planId!);

  if (!plan) return <Prazdno>Plán nenalezen.</Prazdno>;

  return (
    <>
      <Link to="/plany" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Tematické plány
      </Link>
      <Nadpis popis={`${plan.predmet} · ${plan.rocnik} · ${plan.obdobi}`}>{plan.nazev}</Nadpis>

      <Sekce titulek="Cíle učení">
        {cile.length === 0 ? (
          <Prazdno>Plán zatím nemá žádné cíle.</Prazdno>
        ) : (
          <div className="space-y-2">
            {cile.map((c) => (
              <Link key={c.id} to={`/cile/${c.id}`}>
                <Karta className="flex items-start gap-3 p-4 hover:border-accent">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-xs text-muted">
                    {c.poradi}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.nazev}</div>
                    <p className="mt-0.5 text-xs text-muted">{c.popis}</p>
                  </div>
                  <Stitek tlumeny>{c.kriteria.length} kritérií</Stitek>
                </Karta>
              </Link>
            ))}
          </div>
        )}
      </Sekce>

      <Sekce titulek="Poznámka k prototypu">
        <Prazdno>Cíle se v budoucnu stanou lekcemi.</Prazdno>
      </Sekce>
    </>
  );
}

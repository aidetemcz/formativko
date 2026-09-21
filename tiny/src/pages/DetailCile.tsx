import { Link, useParams } from "react-router-dom";
import { Karta, Nadpis, Prazdno, Sekce, Tlacitko } from "../components/ui";
import { archy, najdiCil, najdiPlan } from "../data/mock";

export default function DetailCile() {
  const { cilId } = useParams();
  const cil = najdiCil(cilId!);
  if (!cil) return <Prazdno>Cíl nenalezen.</Prazdno>;

  const plan = najdiPlan(cil.planId);
  const archyCile = archy.filter((a) => a.cilId === cil.id);

  return (
    <>
      <Link to={`/plany/${cil.planId}`} className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← {plan?.nazev}
      </Link>
      <Nadpis popis={cil.popis}>{cil.nazev}</Nadpis>

      <Sekce titulek="Kritéria hodnocení">
        <Karta>
          {cil.kriteria.map((k, i) => (
            <div key={k.id} className={`px-4 py-3 text-sm ${i > 0 ? "border-t border-line" : ""}`}>
              {k.popis}
            </div>
          ))}
        </Karta>
      </Sekce>

      <Sekce
        titulek="Testovací archy"
        akce={
          archyCile.length > 0 ? (
            <Tlacitko to={`/archy/${archyCile[0].id}`} varianta="vedlejsi">
              + Nový arch
            </Tlacitko>
          ) : undefined
        }
      >
        {archyCile.length === 0 ? (
          <Prazdno>Z tohoto cíle zatím nevznikl žádný arch.</Prazdno>
        ) : (
          <Karta>
            {archyCile.map((a, i) => (
              <Link
                key={a.id}
                to={`/archy/${a.id}`}
                className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-canvas ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <span className="font-medium">{a.nazev}</span>
                <span className="text-xs text-muted">
                  {a.trida} · {a.datum}
                </span>
              </Link>
            ))}
          </Karta>
        )}
      </Sekce>
    </>
  );
}

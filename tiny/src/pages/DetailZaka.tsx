import { Link, useParams } from "react-router-dom";
import { Karta, Nadpis, Prazdno, Sekce, Stitek, Tlacitko } from "../components/ui";
import { cile, dukazyZaka, najdiCil, najdiZaka, urovne } from "../data/mock";

export default function DetailZaka() {
  const { zakId } = useParams();
  const zak = najdiZaka(zakId!);
  if (!zak) return <Prazdno>Žák nenalezen.</Prazdno>;

  const dukazy = dukazyZaka(zak.id);

  return (
    <>
      <Link to="/zaci" className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← Žáci a důkazy
      </Link>
      <div className="flex items-start justify-between">
        <Nadpis popis={`${dukazy.length} důkazů o učení`}>{zak.jmeno}</Nadpis>
        <Tlacitko to={`/zaci/${zak.id}/hodnoceni`}>Vygenerovat hodnocení</Tlacitko>
      </div>

      <Sekce titulek="Důkazy o učení">
        {dukazy.length === 0 ? (
          <Prazdno>U tohoto žáka zatím nejsou žádné důkazy.</Prazdno>
        ) : (
          <div className="space-y-2">
            {dukazy.map((d) => {
              const cil = najdiCil(d.cilId);
              const kr = cil?.kriteria.find((k) => k.id === d.kriteriumId);
              const uroven = urovne.find((u) => u.id === d.uroven)!;
              return (
                <Karta key={d.id} className="p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{cil?.nazev}</span>
                    <Stitek>{uroven.popis}</Stitek>
                  </div>
                  <p className="text-xs text-muted">{kr?.popis}</p>
                  <p className="mt-2 text-sm">{d.poznamka}</p>
                  <p className="mt-2 text-xs text-muted">{d.datum}</p>
                </Karta>
              );
            })}
          </div>
        )}
      </Sekce>

      <Sekce titulek="Pokrytí cílů">
        <Karta>
          {cile.map((c, i) => {
            const pocet = dukazy.filter((d) => d.cilId === c.id).length;
            return (
              <div
                key={c.id}
                className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <span>{c.nazev}</span>
                <span className="text-xs text-muted">
                  {pocet} / {c.kriteria.length} kritérií
                </span>
              </div>
            );
          })}
        </Karta>
      </Sekce>
    </>
  );
}

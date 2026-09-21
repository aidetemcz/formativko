import { Link } from "react-router-dom";
import { Karta, Nadpis, Sekce, Stitek, Tlacitko } from "../components/ui";
import { archy, najdiCil, plany } from "../data/mock";

const kroky = [
  { c: "1", t: "Tematický plán", p: "Vygeneruj plán na období z RVP a svého zadání." },
  { c: "2", t: "Cíle učení", p: "Z plánu vzniknou cíle — budoucí lekce." },
  { c: "3", t: "Testovací arch", p: "Z cíle vytvoř arch s kritérii do hodiny." },
  { c: "4", t: "Důkazy o učení", p: "V hodině hodnoť kritéria a sbírej důkazy." },
  { c: "5", t: "Formativní hodnocení", p: "Z důkazů vygeneruj hodnocení pro žáka." },
];

export default function Prehled() {
  return (
    <>
      <Nadpis popis="Prototyp formativního hodnocení. Data jsou ukázková.">Přehled</Nadpis>

      <Sekce titulek="Jak to funguje">
        <div className="grid gap-3 sm:grid-cols-5">
          {kroky.map((k) => (
            <Karta key={k.c} className="p-3">
              <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full border border-line text-xs text-muted">
                {k.c}
              </div>
              <div className="text-sm font-medium">{k.t}</div>
              <p className="mt-1 text-xs leading-snug text-muted">{k.p}</p>
            </Karta>
          ))}
        </div>
      </Sekce>

      <Sekce
        titulek="Moje tematické plány"
        akce={<Tlacitko to="/plany/novy">+ Vygenerovat plán</Tlacitko>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {plany.map((p) => (
            <Link key={p.id} to={`/plany/${p.id}`}>
              <Karta className="p-4 hover:border-accent">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-medium">{p.nazev}</span>
                  <Stitek tlumeny={p.stav === "koncept"}>
                    {p.stav === "koncept" ? "koncept" : "hotovo"}
                  </Stitek>
                </div>
                <p className="text-sm text-muted">
                  {p.predmet} · {p.rocnik} · {p.obdobi}
                </p>
                <p className="mt-2 text-xs text-muted">{p.pocetCilu} cílů učení</p>
              </Karta>
            </Link>
          ))}
        </div>
      </Sekce>

      <Sekce titulek="Nedávné archy">
        <Karta>
          {archy.map((a, i) => (
            <Link
              key={a.id}
              to={`/archy/${a.id}`}
              className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-canvas ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <div>
                <div className="font-medium">{a.nazev}</div>
                <div className="text-xs text-muted">
                  {najdiCil(a.cilId)?.nazev} · {a.trida}
                </div>
              </div>
              <span className="text-xs text-muted">{a.datum}</span>
            </Link>
          ))}
        </Karta>
      </Sekce>
    </>
  );
}

import { Link } from "react-router-dom";
import { Karta, Nadpis, Stitek, Tlacitko } from "../components/ui";
import { plany } from "../data/mock";

export default function Plany() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Nadpis popis="Plán na období, ze kterého vznikají cíle učení.">Tematické plány</Nadpis>
        <Tlacitko to="/plany/novy">+ Vygenerovat plán</Tlacitko>
      </div>

      <Karta>
        {plany.map((p, i) => (
          <Link
            key={p.id}
            to={`/plany/${p.id}`}
            className={`flex items-center justify-between px-4 py-3 hover:bg-canvas ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <div>
              <div className="text-sm font-medium">{p.nazev}</div>
              <div className="text-xs text-muted">
                {p.predmet} · {p.rocnik} · {p.obdobi} · {p.pocetCilu} cílů
              </div>
            </div>
            <Stitek tlumeny={p.stav === "koncept"}>
              {p.stav === "koncept" ? "koncept" : "hotovo"}
            </Stitek>
          </Link>
        ))}
      </Karta>
    </>
  );
}

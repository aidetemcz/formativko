import { Link } from "react-router-dom";
import { Karta, Nadpis } from "../components/ui";
import { archy, najdiCil } from "../data/mock";

export default function Archy() {
  return (
    <>
      <Nadpis popis="Archy, ve kterých v hodině hodnotíš kritéria a sbíráš důkazy.">
        Testovací archy
      </Nadpis>
      <Karta>
        {archy.map((a, i) => (
          <Link
            key={a.id}
            to={`/archy/${a.id}`}
            className={`flex items-center justify-between px-4 py-3 hover:bg-canvas ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <div>
              <div className="text-sm font-medium">{a.nazev}</div>
              <div className="text-xs text-muted">{najdiCil(a.cilId)?.nazev}</div>
            </div>
            <span className="text-xs text-muted">
              {a.trida} · {a.datum}
            </span>
          </Link>
        ))}
      </Karta>
    </>
  );
}

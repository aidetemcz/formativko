import { Link } from "react-router-dom";
import { Karta, Nadpis } from "../components/ui";
import { dukazyZaka, zaci } from "../data/mock";

export default function Zaci() {
  return (
    <>
      <Nadpis popis="Důkazy o učení nasbírané napříč archy.">Žáci a důkazy</Nadpis>
      <Karta>
        {zaci.map((z, i) => (
          <Link
            key={z.id}
            to={`/zaci/${z.id}`}
            className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-canvas ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <span className="font-medium">{z.jmeno}</span>
            <span className="text-xs text-muted">{dukazyZaka(z.id).length} důkazů</span>
          </Link>
        ))}
      </Karta>
    </>
  );
}

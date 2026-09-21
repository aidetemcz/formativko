// Placeholder data pro prototyp. Žádný backend, nic se neukládá.

export type Kriterium = {
  id: string;
  popis: string;
};

export type Cil = {
  id: string;
  planId: string;
  poradi: number;
  nazev: string;
  popis: string;
  kriteria: Kriterium[];
};

export type TematickyPlan = {
  id: string;
  nazev: string;
  predmet: string;
  rocnik: string;
  obdobi: string;
  stav: "koncept" | "hotovo";
  pocetCilu: number;
};

export type Zak = {
  id: string;
  jmeno: string;
};

export type Uroven = "nezacal" | "rozvijí" | "zvládá" | "presahuje";

export type Dukaz = {
  id: string;
  zakId: string;
  cilId: string;
  kriteriumId: string;
  uroven: Uroven;
  poznamka: string;
  datum: string;
};

export type Arch = {
  id: string;
  cilId: string;
  nazev: string;
  datum: string;
  trida: string;
};

export const urovne: { id: Uroven; zkratka: string; popis: string }[] = [
  { id: "nezacal", zkratka: "—", popis: "Zatím nezačal" },
  { id: "rozvijí", zkratka: "R", popis: "Rozvíjí se" },
  { id: "zvládá", zkratka: "Z", popis: "Zvládá" },
  { id: "presahuje", zkratka: "P", popis: "Přesahuje" },
];

export const plany: TematickyPlan[] = [
  {
    id: "plan-1",
    nazev: "Zlomky a desetinná čísla",
    predmet: "Matematika",
    rocnik: "6. ročník",
    obdobi: "Září – listopad",
    stav: "hotovo",
    pocetCilu: 4,
  },
  {
    id: "plan-2",
    nazev: "Literatura 19. století",
    predmet: "Český jazyk",
    rocnik: "8. ročník",
    obdobi: "Leden – březen",
    stav: "koncept",
    pocetCilu: 3,
  },
];

export const cile: Cil[] = [
  {
    id: "cil-1",
    planId: "plan-1",
    poradi: 1,
    nazev: "Rozumím pojmu zlomek",
    popis: "Žák vysvětlí zlomek jako část celku a znázorní ho.",
    kriteria: [
      { id: "kr-1", popis: "Znázorním zlomek na obrázku i na číselné ose" },
      { id: "kr-2", popis: "Vysvětlím vlastními slovy, co znamená čitatel a jmenovatel" },
      { id: "kr-3", popis: "Najdu příklad zlomku v běžném životě" },
    ],
  },
  {
    id: "cil-2",
    planId: "plan-1",
    poradi: 2,
    nazev: "Porovnávám zlomky",
    popis: "Žák porovná dva zlomky a zdůvodní svůj postup.",
    kriteria: [
      { id: "kr-4", popis: "Porovnám zlomky se stejným jmenovatelem" },
      { id: "kr-5", popis: "Převedu zlomky na společný jmenovatel" },
      { id: "kr-6", popis: "Zdůvodním, proč je jeden zlomek větší" },
    ],
  },
  {
    id: "cil-3",
    planId: "plan-1",
    poradi: 3,
    nazev: "Převádím zlomky na desetinná čísla",
    popis: "Žák převede zlomek na desetinné číslo a naopak.",
    kriteria: [
      { id: "kr-7", popis: "Převedu zlomek na desetinné číslo" },
      { id: "kr-8", popis: "Převedu desetinné číslo na zlomek" },
    ],
  },
  {
    id: "cil-4",
    planId: "plan-1",
    poradi: 4,
    nazev: "Počítám se zlomky",
    popis: "Žák sčítá a odčítá zlomky.",
    kriteria: [
      { id: "kr-9", popis: "Sečtu zlomky se stejným jmenovatelem" },
      { id: "kr-10", popis: "Sečtu zlomky s různým jmenovatelem" },
    ],
  },
];

export const archy: Arch[] = [
  { id: "arch-1", cilId: "cil-1", nazev: "Zlomek jako část celku", datum: "12. 9.", trida: "6. A" },
  { id: "arch-2", cilId: "cil-2", nazev: "Porovnávání zlomků", datum: "19. 9.", trida: "6. A" },
];

export const zaci: Zak[] = [
  { id: "zak-1", jmeno: "Adéla Bartošová" },
  { id: "zak-2", jmeno: "Matěj Dvořák" },
  { id: "zak-3", jmeno: "Klára Havlíčková" },
  { id: "zak-4", jmeno: "Ondřej Kratochvíl" },
  { id: "zak-5", jmeno: "Tereza Nováková" },
  { id: "zak-6", jmeno: "Vojtěch Šimek" },
];

export const dukazy: Dukaz[] = [
  {
    id: "d-1",
    zakId: "zak-1",
    cilId: "cil-1",
    kriteriumId: "kr-1",
    uroven: "zvládá",
    poznamka: "Znázornila zlomek na ose bez nápovědy.",
    datum: "12. 9.",
  },
  {
    id: "d-2",
    zakId: "zak-1",
    cilId: "cil-1",
    kriteriumId: "kr-2",
    uroven: "presahuje",
    poznamka: "Vysvětlila spolužákovi vlastními slovy.",
    datum: "12. 9.",
  },
  {
    id: "d-3",
    zakId: "zak-1",
    cilId: "cil-2",
    kriteriumId: "kr-5",
    uroven: "rozvijí",
    poznamka: "Společný jmenovatel hledá metodou pokus–omyl.",
    datum: "19. 9.",
  },
];

export const najdiPlan = (id: string) => plany.find((p) => p.id === id);
export const cileVPlanu = (planId: string) => cile.filter((c) => c.planId === planId);
export const najdiCil = (id: string) => cile.find((c) => c.id === id);
export const najdiArch = (id: string) => archy.find((a) => a.id === id);
export const najdiZaka = (id: string) => zaci.find((z) => z.id === id);
export const dukazyZaka = (zakId: string) => dukazy.filter((d) => d.zakId === zakId);

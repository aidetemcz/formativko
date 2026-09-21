# Tiny — prototyp formativního hodnocení

Samostatná aplikace. Nesdílí nic se starým Formativkem v kořeni repa (vlastní
`package.json`, vlastní komponenty, vlastní Tailwind tokeny).

```bash
cd tiny
npm install
npm run dev      # http://localhost:5174
npm run build
```

## Stack

React 18 + TypeScript + Vite + Tailwind. Žádné shadcn, žádný Radix — mid-fi
prvky jsou ručně psané v `src/components/ui.tsx`, aby šly rychle měnit.

## Flow

Tematický plán → cíle učení (budoucí lekce) → testovací arch do hodiny →
důkazy o učení → formativní hodnocení.

## Data

Všechno je placeholder v `src/data/mock.ts`. Nic se neukládá, žádný backend.
Hodnocení v archu žije jen v paměti komponenty, generování je simulované
timeoutem.

## Nasazení

Na Vercelu nastavit **Root Directory = `tiny`**, framework Vite. Kořenový
`vercel.json` patří staré aplikaci a tohohle projektu se netýká.

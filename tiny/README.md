# Tiny — prototyp formativního hodnocení

Prototyp v1 vyexportovaný z Figma Make a přenesený do tohohle repa. Samostatná
aplikace — se starým Formativkem v kořeni repa nesdílí nic (vlastní
`package.json`, vlastní build, vlastní závislosti).

```bash
cd tiny
npm install
npm run dev        # http://localhost:5174
npm run typecheck
npm run build
```

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 (`@tailwindcss/vite`, bez
`tailwind.config`). Celá aplikace je v `src/App.tsx` — tak ji vygenerovala
Figma Make. Navigace je stavová, ne přes router.

## Co se při portu změnilo

Cílem bylo zachovat vzhled 1:1 a odstranit jen to, co fungovalo pouze uvnitř
Figma Make:

- **`vite.config.ts`** — vyhozeny Figma-only pluginy (`figmaSiteConfiguration`,
  `figmaErrorOverlayReplay`, `figmaReactRefreshBoundaryFallback`,
  `figmaMakeKitPlugin`) a závislost na `.figma/make/site.json`. Zůstal React,
  Tailwind a alias `@` → `src`.
- **`index.html`** — Figma HTML sloty (`<!-- figma:title -->` apod.) nahrazeny
  statickým `<head>`, `lang="cs"`, favicon.
- **Font Inter** — původně se stahoval z `https://static.figma.com/font/Inter_1`.
  Teď je hostovaný lokálně v `public/fonts/` (latin + latin-ext subset, variabilní
  woff2 z Google Fonts). Názvy rodin `"Inter:Regular"` / `"Inter:Medium"` zůstaly,
  protože je `App.tsx` používá na 257 místech. Aplikace nestahuje nic z figma.com.
- **`src/App.tsx`** — jediná úprava: závorky kolem výrazu `?? ... ||` u `goalNum`
  (TypeScript TS5076, `'??' and '||' cannot be mixed`). Obě možná čtení dávají
  stejný výsledek, protože čísla cílů začínají od 1.
- **Vyhozeno** — `src/imports/` a `imports/` (80 KB generovaného kódu
  `RedesignPrihlaskavsSkV4`, který nic neimportovalo), `.figma/`, `.mise.toml`,
  `pnpm-lock.yaml`, `AGENTS.md`.

## Data

Všechno je placeholder přímo v `src/App.tsx` a `src/data.ts` (třída 3.A s 22 žáky,
ukázkové důkazy o učení, tematický plán pro češtinu). Nic se neukládá, po
refreshi je stav zpátky na začátku. Žádný backend.

## Nasazení

Na Vercelu nastavit **Root Directory = `tiny`**, framework Vite, build `npm run build`,
output `dist`. Kořenový `vercel.json` patří staré aplikaci a tohohle projektu se netýká.

## Aktualizace z Figmy

Když přijde nový export z Figma Make, stačí přenést `src/App.tsx`, `src/data.ts`
a `src/assets/` — build config v `tiny/` zůstává. Pak projít seznam změn výš a
ověřit, jestli nepřibyla nová závislost na Figma prostředí.

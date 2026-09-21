# CLAUDE.md — prototyp Tiny

Prototyp formativního hodnocení, vyexportovaný z Figma Make. Samostatná
aplikace, se starým Formativkem v kořeni repa nesdílí nic. Detaily v README.md.

## Jak pracovat

**Default je „jen ať to buildí".** Napsat změnu, ověřit `npm run typecheck`
a `npm run build`, a skončit. Neověřovat v prohlížeči, nedělat screenshoty,
nepsat testy interakcí — zadavatelka si prototyp proklikne sama a co nesedí,
pošle zpátky. Ověřovat v prohlížeči jen tehdy, když si to vyžádá, nebo když
na výsledku nejde nic vidět (refaktor, propojení dat, výkon).

Nerestartovat produkční build a preview server po každé úpravě; na hraní
stačí jeden `npm run dev` s hot reloadem.

Dávkovat změny. Velký balík zadání v jedné zprávě je rychlejší než totéž
rozdělené do několika — ušetří se opakované čtení kódu a buildy.

## Kde co je

Celá aplikace je v `src/App.tsx` (~6100 řádků) — tak ji vygenerovala Figma.
Navigace je stavová, ne přes router. Styly jsou inline pixelové hodnoty,
žádné Tailwind `text-*` třídy. Data jsou placeholder v `src/App.tsx`
a `src/data.ts`, nic se neukládá.

Klíčové části: `TematickyPlanView` (tabulka plánu), `CileView` + `LessonList`
(vyučovací hodiny), `ClassesView` (třídy), `DukazyView`, `HodnoceniView`,
`BuddyChat`.

## Na co narazit

- **Plán a hodiny jsou dvě oddělené kopie dat.** Hodiny se z tematického plánu
  jednorázově vygenerují (`addTpGoals`) a dál si žijí vlastním životem. Úprava
  hodiny se do plánu nepropíše, i když to poznámka na stránce Vyučovací hodiny
  slibuje. Zapojit to znamená vytáhnout stav plánu na úroveň `App`.
- **Dlouhé texty nepatří do `<input>`.** Cíle učení jsou celé věty a input je
  usekne bez jakékoli indikace. Používat rostoucí `<textarea>`
  (`AutoTextarea`, `EditableLessonTitle`).
- **`key={navKey}`** v `App()` odmontuje sekci při každém kliku v menu, takže
  lokální stav sekce se zahodí. Co má přežít navigaci, patří do kontextu.

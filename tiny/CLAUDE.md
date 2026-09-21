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

**Odpovídat stručně, ale čitelně.** Seznam zapracovaných úkolů celými větami,
u každého jedna věta o tom, co se změnilo — ne jen holé odrážky s názvem
úkolu. Vynechat vysvětlování, jak to funguje vnitřně, rozbory příčin
a zdůvodňování zvolených řešení; to patří do commit message. Na konec zprávy
věci k rozhodnutí. Zmínit navíc jen to, co bylo potřeba udělat jinak, než
znělo zadání, nebo co je rozbité.

**Po dokončení balíku změn poslat upozornění** (PushNotification) s jednou
větou o tom, co je hotové — zadavatelka u toho nesedí a čeká na signál.

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

- **Plán a hodiny jsou propojené.** Řádky plánu (`planRows`) i hodiny
  (`tpGoals`) žijí v `App` a `GoalsContext` je drží v souladu: `updatePlanRow`
  a `updateTpGoal` píšou vždy do obojího. Párují se přes `TpRow._id`, které
  hodina zdědí jako své `id`. Synchronizuje se cíl, měsíc, rozsah a výstup;
  předmět a třída jsou vlastnost celého plánu, ne řádku.
- **Dlouhé texty nepatří do `<input>`.** Cíle učení jsou celé věty a input je
  usekne bez jakékoli indikace. Používat rostoucí `<textarea>`
  (`AutoTextarea`, `EditableLessonTitle`).
- **`key={navKey}`** v `App()` odmontuje sekci při každém kliku v menu, takže
  lokální stav sekce se zahodí. Co má přežít navigaci, patří do kontextu.

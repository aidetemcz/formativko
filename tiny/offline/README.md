# Tiny — spustitelná verze

Tahle složka je hotová aplikace. Nepotřebuje internet, Node.js ani nic
instalovat.

**Jak ji spustit:** stáhněte si celou složku `offline` k sobě do počítače
a dvojklikněte na soubor `index.html`. Otevře se v prohlížeči a Tiny běží.

Důležité: soubory musí zůstat pohromadě v jedné složce. `index.html` samotný
bez `tiny.js` a obrázků fungovat nebude.

Prototyp si nic neukládá — po zavření okna se všechno vrátí do výchozího
stavu (žádná třída, žádné důkazy, žádný plán). Třídu, důkazy i plán přidáte
tlačítky dole v levém menu.

## Pro vývoj

Tahle složka se generuje, needitujte ji ručně. Znovu ji vyrobíte příkazem:

```bash
npm run build:offline
```

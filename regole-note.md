# Regole per scrivere le Note dei trade (EOW)

Istruzioni per Claude, o per chiunque scriva le Note del foglio **EOW** guardando gli screenshot TradingView di un trade.

Edgebook (l'app del journal) **non usa l'IA per leggere le note**: le legge un programma con regole fisse (`notePath` in
`core.js`). Ottimizza usa la nota per simulare stop a BE, stop spostato in profitto, trailing stop e uscite a parziali.
Una nota scritta in modo diverso da queste regole **non viene letta**: il trade resta nei conti, ma con una stima meno precisa.
Nella scheda del trade l'app ti dice subito se la nota si legge.

## In breve

Una nota è il **percorso del prezzo** dall'ingresso all'uscita, misurato in R e scritto come elenco di punti separati da virgole:

```
scende a -0.3rr, raggiunge 1.2rr, torna a 0.6rr, poi raggiunge 2.3rr, torna a 1.5rr, poi raggiunge 2.6rr, torna a 2.1rr (screenshot fino alle 16:44)
```

## Le frasi ammesse

Ogni pezzo tra due virgole deve essere **esattamente una** di queste frasi (maiuscole e minuscole non contano):

| Frase | Significato |
|---|---|
| `raggiunge 2.4rr` | il prezzo sale fino a +2,4R (nuovo massimo) |
| `arriva a 2.4rr` | uguale a «raggiunge» |
| `scende a -0.3rr` | il prezzo scende fino a −0,3R (sotto l'ingresso, o un nuovo minimo) |
| `torna a 1.5rr` | il prezzo torna indietro fino a +1,5R (ritracciamento) |
| `torna a BE` | il prezzo torna esattamente all'ingresso (0R) |
| `torna allo stop (-1rr)` | il prezzo arriva allo stop: il trade è finito, la nota finisce qui |
| `va allo stop (-1rr)` | uguale a «torna allo stop» |

- Davanti a ogni frase puoi mettere **`poi`** (es. `poi raggiunge 2.3rr`): non cambia nulla, aiuta a leggere.
- **Non scrivere l'ingresso**: il percorso parte sempre da 0R.

Alla fine della nota, e solo lì, sono ammesse anche queste due aggiunte:

| Aggiunta | Quando |
|---|---|
| `(screenshot fino alle 16:44)` | lo screenshot finisce prima che il trade sia chiuso (ora italiana, `HH:MM`) |
| `, oltre lo screenshot arriva a 11.1rr (EOW)` | dopo la fine dello screenshot il prezzo è arrivato più in alto: il valore è il **Max Real RR** del foglio |

Esempio con tutte e due:

```
scende a -0.3rr, raggiunge 0.9rr, scende a -0.6rr, raggiunge 1rr, scende a -0.2rr, raggiunge 6.4rr, torna a 3.5rr, poi raggiunge 9rr, torna a 4.6rr (screenshot fino alle 16:19), oltre lo screenshot arriva a 11.1rr (EOW)
```

Esempio di trade finito allo stop:

```
raggiunge 0.6rr, torna a 0.1rr, poi raggiunge 0.9rr, scende a -0.4rr, poi torna allo stop (-1rr)
```

## Come scrivere i numeri

- **Punto** come separatore dei decimali, **mai la virgola**: `1.5rr`, non `1,5rr`. La virgola separa i punti del percorso,
  quindi `1,5rr` diventa due pezzi e la nota non si legge più.
- **Una cifra decimale** (`2.3rr`); gli interi senza decimali vanno bene (`2rr`).
- Il segno meno è il trattino normale **`-`** (`-0.3rr`), non il segno «−» tipografico.
- Dopo il numero sempre **`rr`** (`2.4rr` o `2.4 rr`), non `R`, `r` o `%`.
- Niente valori approssimati o intervalli: niente `circa`, `~`, `1.2-1.3rr`, `>2rr`.

## Cosa annotare

- **R rispetto all'ingresso**: (prezzo − entry) ÷ rischio per i long, (entry − prezzo) ÷ rischio per gli short. Il rischio (1R)
  è lo **SL Points** del foglio, che include già il buffer (ES e GC 1 punto, NQ 5 punti). Lo stop è −1R.
- Misura **solo sulle candele giapponesi** (nello screenshot a due pannelli sono quelle a destra; le Heikin Ashi a sinistra
  hanno prezzi sintetici). Contano le **ombre**: il massimo è il punto più alto toccato, il ritracciamento il punto più basso.
- Ogni punto è un **punto di svolta** (un massimo o un minimo), in **ordine di tempo**. L'app considera che tra due punti il
  prezzo vada dritto: un ritracciamento non scritto per l'app non c'è stato.
- Annota **ogni ritracciamento di almeno 0.3R** e ogni volta che il prezzo torna vicino all'ingresso o va sotto. Nel dubbio,
  annotalo: un punto in più non fa danni, uno in meno sì, perché fa sembrare migliori il BE e il trailing.
- Concentrati sui **primi 5R**: è lì che si decidono BE, parziali e target. Oltre i 5R basta segnare i massimi e i
  ritracciamenti principali.
- La nota deve essere coerente con le colonne del foglio:
  - il punto più alto della nota (o il valore di «oltre lo screenshot») è il **Max Real RR**;
  - se il trade ha preso lo stop, la nota finisce con `torna allo stop (-1rr)`;
  - se lo screenshot finisce prima, metti `(screenshot fino alle HH:MM)`; se il prezzo è salito ancora dopo, aggiungi
    `oltre lo screenshot arriva a Xrr (EOW)` con X = Max Real RR.

## Cosa NON scrivere

- Commenti o descrizioni: `forte rifiuto`, `candela di inversione`, `volume basso`, `buon trade`.
- Altre parentesi oltre a `(screenshot fino alle HH:MM)`, `(-1rr)` dopo lo stop e `(EOW)`.
- Punti e virgola, a capo, elenchi puntati.
- Verbi diversi da quelli della tabella: `ritraccia a`, `sale a`, `tocca`, `ripiega`, `estende a` non vengono capiti.
- L'ingresso (`entra a 0rr`) o lo stop iniziale (`stop a -1rr`) all'inizio.

## Controllo prima di consegnare

Per ogni nota:

1. Ogni pezzo tra due virgole è una frase della tabella, con o senza `poi`.
2. I numeri hanno il punto, il trattino `-` e finiscono con `rr`.
3. I punti sono in ordine di tempo e alternano salite e discese.
4. Il punto più alto coincide con il Max Real RR, oppure c'è `oltre lo screenshot arriva a …rr (EOW)`.
5. La nota finisce con `torna allo stop (-1rr)` oppure con `(screenshot fino alle HH:MM)`.

Se lavori in Claude Code puoi controllare le note con questa funzione Python, che fa le stesse cose dell'app:

```python
import re

def leggi_nota(s):
    """Restituisce (punti, massimo_oltre_lo_screenshot, stop) oppure None se la nota non si legge."""
    s = (s or '').strip()
    if not s:
        return None
    num = lambda t: float(t.replace(',', '.'))
    af = re.search(r'oltre lo screenshot arriva a\s*(-?\d+(?:[.,]\d+)?)\s*rr', s, re.I)
    core = re.sub(r'\(screenshot fino alle [^)]*\)', '', s, flags=re.I)
    core = re.sub(r',?\s*oltre lo screenshot arriva a [^,]*\(EOW\)', '', core, flags=re.I)
    p, stop = [0.0], False
    for part in [x.strip() for x in core.split(',') if x.strip()]:
        q = re.sub(r'^poi\s+', '', part, flags=re.I)
        if re.match(r'^(va|torna) allo stop', q, re.I):
            p.append(-1.0); stop = True; continue
        if re.match(r'^torna a BE\b', q, re.I):
            p.append(0.0); continue
        m = re.match(r'^(scende a|raggiunge|torna a|arriva a)\s+(-?\d+(?:[.,]\d+)?)\s*rr$', q, re.I)
        if not m:
            return None          # frase non riconosciuta: la nota non si legge
        p.append(num(m.group(2)))
    if len(p) < 2:
        return None
    return p, (num(af.group(1)) if af else None), stop
```

Per esempio, `leggi_nota("scende a -0.3rr, raggiunge 1.2rr, torna a 0.6rr")` restituisce `([0.0, -0.3, 1.2, 0.6], None, False)`.

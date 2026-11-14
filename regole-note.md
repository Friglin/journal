# Regole per le note del percorso (EOW)

Ogni nota descrive la strada fatta dal prezzo dopo l'entry, in R, letta dallo screenshot 1m del trade. L'analisi si ferma a 5R,
uguale per tutti i trade, così le note restano confrontabili. Le note le scrive Claude in una sessione dedicata e finiscono nella
colonna `Note` del foglio `Dati` dell'EOW.

**Chi le legge:** Edgebook, l'app del journal, con un programma a regole fisse (`notePath` in `core.js`), non con l'IA.
Ottimizza le usa per simulare stop a BE, stop spostato in profitto, trailing stop e uscite a parziali. Una nota che non rispetta
la sezione 7 **non viene letta**: il trade resta nei conti, ma con una stima meno precisa. In Impostazioni → «Note dei trade»
l'app dice quante note legge e quali no.

Le sezioni 1–6 sono il metodo di chi scrive le note. Le sezioni 7–8 sono quello che l'app accetta, con il controllo finale.

## 1. Da dove vengono i numeri

- **Fonte:** lo screenshot 1m (colonna `1m Link`), sul pannello a candele giapponesi. Il pannello Heikin-Ashi viene scartato.
- **Solo dati del grafico:** quello che succede dopo la fine dello screenshot non entra nella nota.
- **Unità:** R = (prezzo − entry) / `SL Points` dell'EOW. Per uno short il segno è invertito, quindi +1R è sempre a favore.
  `SL Points` include già il buffer dello stop (ES e GC 1 punto, NQ 5 punti).
  - Il prezzo si legge dall'asse dei prezzi del grafico.
  - L'entry si arrotonda al tick: 0,25 per ES e NQ, 0,1 per GC.
  - Se la scala R disegnata sul grafico riproduce chiaramente meglio l'EOW (Max Real RR e holding time), si usa quella.
- **Inizio:** la candela dell'entry conta solo dalla sua chiusura; le candele dopo contano per intero.
- **Ordine dentro una candela:** dall'immagine non si vede se è venuto prima il massimo o il minimo, quindi si assume:
  - candela a favore (chiude meglio di come apre): apertura → punto peggiore → punto migliore → chiusura;
  - candela contro: apertura → punto migliore → punto peggiore → chiusura.

## 2. Dove finisce la nota

La nota finisce al primo di questi tre eventi:

1. **Il prezzo tocca 5R:** la nota finisce con `raggiunge 5rr`. Quello che succede dopo non viene descritto, anche se lo
   screenshot continua.
2. **Il prezzo tocca lo stop** (−1R, con tolleranza di 0,015R): `poi torna allo stop (-1rr)`, oppure `va allo stop (-1rr)` se
   non è mai arrivato a +0,15R.
3. **Lo screenshot finisce prima:** la nota finisce con `(screenshot fino alle HH:MM)`.

## 3. Cosa entra nella nota

Fino alla fine, la nota segue ogni movimento di almeno 0,3R, in entrambe le direzioni.

- Si scrive ogni punto in cui il prezzo cambia direzione, se il movimento che segue è di almeno 0,3R.
- I movimenti più piccoli di 0,3R non vengono scritti.
- **Prima mossa:** finché il prezzo non si è mosso di 0,3R in una direzione non si scrive niente. Quando succede, si scrive anche
  il punto estremo toccato prima nell'altra direzione, se è almeno ±0,15R (es. `scende a -0.2rr, raggiunge 0.8rr`).
- Si descrive tutta la strada, anche dopo il massimo: i rimbalzi che non fanno un nuovo massimo e le discese prima dello stop.

Perché conta per l'app: tra due punti della nota l'app considera che il prezzo vada dritto. I punti bassi tra due salite decidono
se uno stop a BE, uno stop in profitto o un trailing sarebbero scattati. La soglia di 0,3R va bene perché l'app non prova stop
più vicini di 0,5R al massimo raggiunto: un movimento sotto 0,3R non cambia l'esito.

## 4. Come si scrive

- **Verbi:**
  - `raggiunge` per un nuovo massimo del trade; `poi raggiunge` quando segue un ritracciamento sopra BE;
  - `risale a` per un rimbalzo che non supera il massimo precedente;
  - `torna a` per un ritracciamento che resta sopra BE (−0,05R);
  - `scende a` per una discesa sotto BE.
- **Valori** con un decimale, senza zeri inutili: `1rr`, `2.3rr`, `-0.7rr`.
- **BE** per i valori tra −0,05R e +0,05R (`torna a BE`).
- **Appena sotto un livello intero, due decimali:** `1.96rr` e non `2rr`. Così `2rr` significa sempre che 2R è stato toccato
  davvero (l'app conta un target come preso solo se il valore lo raggiunge).
- Le parti sono separate da virgole.

**Esempio:** `scende a -0.3rr, raggiunge 1.2rr, torna a 0.4rr, risale a 0.9rr, torna a 0.2rr, poi raggiunge 2.6rr, torna a 1.8rr, poi raggiunge 5rr`

## 5. Controlli con l'EOW

- **[da verificare]:** la nota si chiude con `[da verificare: sul grafico max X, nell'EOW Max Real RR Y]` quando:
  - il trade arriva allo stop dentro lo screenshot e il massimo sul grafico differisce dal Max Real RR di più di 0,12R;
  - oppure non arriva allo stop e il massimo sul grafico supera il Max Real RR di più di 0,12R.

  Va scritto **in fondo**, tra parentesi quadre. L'app lo toglie, legge comunque il percorso e segnala la nota in Impostazioni
  → «Note dei trade», così si può correggere il foglio o la nota.
- **Holding time:** gli orari in cui il percorso tocca 1R–5R devono coincidere con gli holding time dell'EOW. Di solito il grafico
  è 1 minuto dopo, perché conta la candela intera.
- **Correzioni manuali:** quando una candela è coperta da un disegno (box della posizione, freccia tratteggiata, cursore) e la
  lettura automatica non coincide con l'EOW, il percorso si ricontrolla a occhio sul grafico e la nota si corregge a mano.

## 6. Scrittura nel foglio

- Le note vanno nella colonna `Note` del foglio `Dati` tramite lo script Apps Script. Sono 4 file: `scrivi_note_EOW.gs` e i dati
  in `note_1.gs`, `note_2.gs`, `note_3.gs`. Si esegue `scriviNote`.
- Una nota viene scritta solo se Asset, Data e Ora della riga coincidono, e solo se la cella è vuota o contiene già una nota del
  percorso. Le note scritte a mano non vengono toccate.
- Questi file restano **separati** da `Code.gs`, che è il file di Edgebook e a ogni aggiornamento viene sostituito per intero. Nei
  file delle note non vanno usati nomi di funzioni o variabili globali che esistono già in `Code.gs`: nello stesso progetto Apps
  Script si sovrapporrebbero.

## 7. Cosa legge l'app

Ogni pezzo tra due virgole deve essere **esattamente una** di queste frasi (maiuscole e minuscole non contano). Davanti a ognuna
si può mettere `poi`.

| Frase | Significato |
|---|---|
| `raggiunge 2.4rr` / `arriva a 2.4rr` | il prezzo sale fino a +2,4R |
| `risale a 0.9rr` | il prezzo rimbalza fino a +0,9R |
| `torna a 1.5rr` | il prezzo torna indietro fino a +1,5R |
| `scende a -0.3rr` | il prezzo scende fino a −0,3R |
| `torna a BE` | il prezzo torna all'ingresso (0R) |
| `torna allo stop (-1rr)` / `va allo stop (-1rr)` | il prezzo arriva allo stop: il trade è finito |

In fondo alla nota, e solo lì, sono ammessi, in quest'ordine:

1. `(screenshot fino alle HH:MM)`;
2. ` [da verificare: …]`.

Le note scritte con le regole precedenti possono avere anche `, oltre lo screenshot arriva a 11.1rr (EOW)` dopo lo screenshot:
l'app lo legge ancora, ma le note nuove non lo usano.

Regole sui numeri:

- **Punto** per i decimali, **mai la virgola**: la virgola separa i pezzi, quindi `1,5rr` rompe la nota.
- Il segno meno è il trattino normale **`-`**, non il segno tipografico «−».
- Dopo il numero sempre **`rr`** (`2.4rr`), non `R`, `r` o `%`.
- Niente valori approssimati o intervalli (`circa`, `~`, `1.2-1.3rr`).

Non scrivere:

- commenti (`forte rifiuto`, `candela di inversione`);
- altre parentesi;
- punti e virgola;
- l'ingresso o lo stop iniziale all'inizio. Il percorso parte sempre da 0R.

## 8. Controllo prima di consegnare

Per ogni nota:

1. Ogni pezzo tra due virgole è una frase della sezione 7, con o senza `poi`.
2. I numeri hanno il punto, il trattino `-` e finiscono con `rr`.
3. I punti sono in ordine di tempo e alternano salite e discese.
4. La nota finisce con `raggiunge 5rr`, con lo stop oppure con `(screenshot fino alle HH:MM)`, ed eventualmente `[da verificare: …]`.

Questa funzione Python legge le note esattamente come l'app. Restituisce `None` se la nota non si legge.

```python
import re

def leggi_nota(s):
    """(punti, massimo_oltre_lo_screenshot, stop, da_verificare) oppure None se la nota non si legge."""
    s = (s or '').strip()
    if not s:
        return None
    num = lambda t: float(t.replace(',', '.'))
    af = re.search(r'oltre lo screenshot arriva a\s*(-?\d+(?:[.,]\d+)?)\s*rr', s, re.I)
    chk = bool(re.search(r'\[da verificare[^\]]*\]', s, re.I))
    core = re.sub(r',?\s*\[da verificare[^\]]*\]', '', s, flags=re.I)
    core = re.sub(r'\(screenshot fino alle [^)]*\)', '', core, flags=re.I)
    core = re.sub(r',?\s*oltre lo screenshot arriva a [^,]*\(EOW\)', '', core, flags=re.I)
    p, stop = [0.0], False
    for part in [x.strip() for x in core.split(',') if x.strip()]:
        q = re.sub(r'^poi\s+', '', part, flags=re.I)
        if re.match(r'^(va|torna) allo stop', q, re.I):
            p.append(-1.0); stop = True; continue
        if re.match(r'^(torna|scende) a BE\b', q, re.I):
            p.append(0.0); continue
        m = re.match(r'^(scende a|raggiunge|torna a|arriva a|risale a)\s+(-?\d+(?:[.,]\d+)?)\s*rr$', q, re.I)
        if not m:
            return None          # frase non riconosciuta: la nota non si legge
        p.append(num(m.group(2)))
    if len(p) < 2:
        return None
    return p, (num(af.group(1)) if af else None), stop, chk
```

Per esempio, `leggi_nota("scende a -0.3rr, raggiunge 1.2rr, torna a 0.4rr, risale a 0.9rr")` restituisce
`([0.0, -0.3, 1.2, 0.4, 0.9], None, False, False)`.

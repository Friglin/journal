// Edgebook · simula.js — Simula: passare le valutazioni Topstep (dollari e conti prop, simulazione).
// I file JS sono script classici caricati in ordine da index.html e condividono le stesse variabili globali:
// l'ordine conta (core.js → home.js → pagine.js → analisi.js → simula.js → scheda.js).
// ───────────────────────── SIMULA: passare le valutazioni Topstep ─────────────────────────
// Quanti conti passare, di che taglia e in quanto tempo lo sceglie l'utente; il simulatore cerca il resto: quali trade prendere
// (combinazioni di filtri sui trade dell'EOW: i filtri della pagina qui non valgono), il target in R, le regole del giorno,
// con o senza Daily Loss Limit, il rischio a trade e come tradare più conti. Ogni calcolo usa numeri casuali nuovi.
// Regole Topstep: 50K confermate dall'utente; prezzi e limiti di 100K/150K da verificare.
const PF_PRE = {
  '50K':  { target:3000, mll:2000, dllAmt:1000, feeD:85,  feeN:95,  lots:5 },
  '100K': { target:6000, mll:3000, dllAmt:2000, feeD:155, feeN:165, lots:10 },
  '150K': { target:9000, mll:4500, dllAmt:3000, feeD:235, feeN:245, lots:15 } };
const PF_CONS = 50;                         // consistenza: il giorno migliore non oltre il 50% del profitto totale
const PF_RT = { mini:3.78, micro:1.22 };   // commissioni e fee Topstep a contratto, andata e ritorno
const PF_SLIP = .25;                         // slippage: 1 tick (0,25 punti) sugli stop e sulle chiusure forzate, ordini a mercato
const PF_BUF = { ES:1, NQ:5 };               // buffer già compreso negli stop dell'EOW e del Journal (punti oltre il livello di struttura)
const PF_DEF = { size:'50K', n:'1', weeks:'4', goal:'safe' };
function loadPF() { try { const o=Object.assign({}, PF_DEF, JSON.parse(store.get('pf5','{}'))); if (!PF_PRE[o.size]) o.size='50K'; return o; } catch(e) { return Object.assign({}, PF_DEF); } }
const savePF = () => store.set('pf5', JSON.stringify(S.pf));
const usd = (x, dec=0) => isFinite(x) ? (x<0?'−':'')+'$'+Math.abs(x).toLocaleString('it-IT',{ maximumFractionDigits:dec, minimumFractionDigits:dec }) : '–';
// ───── dollari e conti prop ─────
// Ogni trade del Journal ha il suo PnL in $ per conto (colonna «PnL $»); se manca vale RR × rischio delle Impostazioni.
// Con il copy trading il PnL si moltiplica per i conti attivi quel giorno. L'EOW (backtest) usa sempre R × rischio.
const riskUsd = () => { const v=num(CFG.risk); return isFinite(v) && v>0 ? v : 0; };
const nAcc = () => (CFG.prop && +CFG.prop.n) || 1;   // conti su cui copi ogni trade
const totView = () => !CFG.prop || CFG.prop.view!=='one';
const isEst = t => !isFinite(t.pnl);
const pnl1 = (t, r) => isFinite(t.pnl) ? t.pnl : riskUsd() ? r*riskUsd() : NaN;               // $ su un conto
const usdT = (t, r) => { const v=pnl1(t, r); return isFinite(v) ? v*(totView() ? nAcc(t.d) : 1) : NaN; };   // $ mostrati
let uoJ, uoV;
function usdOn(E) { if (E===undefined) E=S.type==='EOW'; if (riskUsd()) return true; if (E) return false;
  const J=rowsOf('Journal'); if (J!==uoJ) { uoJ=J; uoV=!!J && J.some(t=>isFinite(t.pnl)); } return uoV; }
const usdSum = (ts, m) => ts.reduce((s,t)=>{ const v=usdT(t, m.rOf(t)); return isFinite(v) ? s+v : s; }, 0);
function usdDD(ts, m) { let eq=0, pk=0, dd=0; ts.forEach(t=>{ const v=usdT(t, m.rOf(t)); if (isFinite(v)) eq+=v; pk=Math.max(pk,eq); dd=Math.min(dd,eq-pk); }); return dd; }
const fmtU = (v, est) => isFinite(v) ? (est?'≈':'')+(v>=0.5?'+':'')+usd(v) : '';
const fmtUk = v => isFinite(v) ? (v<=-0.5?'−':v>=0.5?'+':'')+'$'+usdK(Math.abs(v)) : '';
const withU = (txt, v, est) => { const u=fmtU(v, est); return u ? u+(txt?' · '+txt:'') : txt; };
const usdWhat = () => nAcc()>1 ? (totView() ? nAcc()+' conti' : 'un conto') : '';
const usdK = x => { const a=Math.abs(x); return (x<0?'−':'')+(a>=1e6 ? fmtN(a/1e6,a>=1e7?0:1)+'M' : a>=1e3 ? fmtN(a/1e3,a>=1e5?0:a%1000?1:0)+'k' : fmtN(a,0)); };
// ── 1. i trade dell'EOW e le strategie (combinazioni di filtri) ──
// Ogni giorno feriale tra il primo e l'ultimo trade dell'EOW, con i suoi trade (anche nessuno): così un filtro che toglie trade
// allunga davvero i tempi. Per ogni trade: stop in punti (SL Points) e quanto è andato contro (SL DD), in R.
function pfBase() {
  const E=rowsOf('EOW'); if (!E) return null;
  const ts=E.filter(t=>t.d && isFinite(t.best) && t.d.getDay()%6!==0), days=[], idx={};
  if (ts.length) for (let d=new Date(ts[0].d.getFullYear(),ts[0].d.getMonth(),ts[0].d.getDate()); d<=ts[ts.length-1].d; d.setDate(d.getDate()+1)) { if (d.getDay()%6===0) continue; idx[iso(d)]=days.length; days.push(iso(d)); }
  const di=ts.map(t=>idx[iso(t.d)]), sl=ts.map(t=>{ const v=num(t.raw['SL Points']); return v>0?Math.max(v, PF_BUF[/NQ/i.test(t.a||'')?'NQ':'ES']):0; }), dd=ts.map(t=>{ const v=num(t.raw['SL DD']); return v>=0?v:NaN; });
  // peso dei giorni: si dimezza ogni «hl» giorni feriali andando indietro, così le scelte guardano soprattutto al periodo recente;
  // «cut» separa gli ultimi giorni (l'ultimo 30%, almeno 20) su cui ogni filtro deve reggere
  const n=days.length, hl=Math.max(20, Math.round(n*.25)), w=days.map((_,i)=>Math.pow(.5,(n-1-i)/hl)), cut=Math.max(0, Math.min(Math.floor(n*.7), n-20));
  const slq={}; ['ES','NQ'].forEach(a=>{ const v=ts.map((t,i)=>(/NQ/i.test(t.a||'')?'NQ':'ES')===a?sl[i]:0).filter(x=>x>0).sort((x,y)=>x-y); if (v.length>=10) slq[a]={ p75:v[Math.floor(.75*(v.length-1))], p90:v[Math.floor(.9*(v.length-1))] }; });
  // escursione contraria in R (SL DD / stop). Nei vincenti uno SL DD pari o oltre lo stop vuol dire che è stato misurato dopo il
  // target (es. «raggiunge 2,2R, poi torna a BE»): lì, e quando manca, vale la mediana degli altri vincenti
  const okW=(t,i)=>t.best>=1 && sl[i]>0 && isFinite(dd[i]) && dd[i]<sl[i];
  const mw=ts.map((t,i)=>okW(t,i)?dd[i]/sl[i]:NaN).filter(isFinite).sort((x,y)=>x-y), maeW=mw.length?mw[Math.floor(mw.length/2)]:.5;
  const mae=ts.map((t,i)=>sl[i]>0 && isFinite(dd[i]) && dd[i]<sl[i] ? dd[i]/sl[i] : maeW);   // per gli stop pieni la simulazione usa comunque 1R
  return { ts, days, di, sl, mae, slq, dir:ts.some(t=>t.dir), w, hl, cut };
}
// T: target in R · maxN: trade al giorno (0 = senza limite) · sw: stop dopo il primo trade in profitto · sll: stop dopo 1 o 2 perdite
// xsl: niente trade con stop oltre il 75° o 90° percentile del suo asset · gli altri: filtri come nella pagina Filtri
const PF_TG = [.5,1,1.5,2,2.5,3,3.5,4,4.5,5];   // target provati, in R
const pfT = T => fmtN(T, T%1?1:0)+'R';
const PF_ST0 = { T:2, asset:'', maxN:0, sw:0, sll:0, xsl:'', xIdea:[], smt:'', news:'', lvn:'', clean:'', xBand:[], xDay:[], dir:'' };
const pfAll = T => Object.assign({}, PF_ST0, { T, xIdea:[], xBand:[], xDay:[] });   // tutti i trade a target T
// i trade di una strategia, giorno per giorno, nell'intervallo di giorni [lo, hi). Esito a target T: vinto (+T R) se il prezzo
// è arrivato a T (Max Real RR, decimale; se manca il Best Real RR), altrimenti stop pieno (−1 R)
function pfApply(B, st, lo=0, hi=B.days.length) {
  const out=Array.from({ length:hi-lo }, ()=>[]), T=st.T;
  B.ts.forEach((t,i)=>{ const k=B.di[i]; if (k===undefined || k<lo || k>=hi) return;
    if ((st.asset && t.a!==st.asset) || st.xIdea.includes(t.idea) || (st.dir && t.dir!==st.dir)) return;
    if ((st.smt==='fav' && t.smt!=='SMT a favore') || (st.smt==='nosf' && t.smt==='SMT a sfavore')) return;
    if ((st.news==='nored' && t.news==='Red News') || (st.news==='none' && t.news!=='No News Day')) return;
    if ((st.lvn && t.lvn!==st.lvn) || (st.clean==='si' && !t.clean) || (st.xBand.length && st.xBand.includes(bandOf(t)))) return;
    if (st.xDay.length && st.xDay.includes(t.day)) return;
    const nq=/NQ/i.test(t.a||''), a=nq?'NQ':'ES', sl=B.sl[i];
    if (st.xsl && sl>0 && B.slq[a] && sl>B.slq[a][st.xsl]) return;
    const day=out[k-lo], r=(isFinite(t.max)?t.max:t.best)>=T-1e-9?T:-1;
    if ((st.maxN && day.length>=st.maxN) || (st.sw && day.some(x=>x.r>0)) || (st.sll && day.filter(x=>x.r<0).length>=st.sll)) return;
    day.push({ r, T, sl, mv:nq?2:5, a, mae:r<0?1:B.mae[i] }); });
  return out;
}
// qualità di una strategia senza simulare: R medi al giorno feriale divisi per la loro variabilità (il rischio in $ lo sceglie poi
// la simulazione), ridotti quando i giorni con trade sono pochi, perché lì il risultato è più fortuna
function pfStat(days, w) { let W=0, s=0, s2=0, act=0, k=0;
  days.forEach((d,i)=>{ const wi=w?w[i]:1, r=d.reduce((x,t)=>x+t.r,0); W+=wi; s+=wi*r; s2+=wi*r*r; if (d.length) { act++; k+=d.length; } });
  const m=W?s/W:0, sd=Math.sqrt(Math.max(0, (W?s2/W:0)-m*m)); return { m, sd, act, k, sh: sd>0?m/sd:0 }; }
const pfScore = st => (st.k<20 || st.act<12 || !(st.sd>0)) ? -Infinity : st.sh*st.act/(st.act+15);
// ricerca a passi: parte da tutti i trade con un target e prova un filtro alla volta. Un filtro resta solo se migliora il risultato
// (giorni pesati verso i recenti) e non peggiora i R al giorno degli ultimi giorni: deve funzionare soprattutto adesso
// i filtri possibili a partire da una strategia: ognuno è [chiave, valore] o [lista, voce, aggiungi/togli]
function pfMoves(B, st) { const out=[], opts={ asset:['','ES','NQ'], maxN:[0,1,2,3], sw:[0,1], sll:[0,1,2], xsl:['','p90','p75'], smt:['','nosf','fav'], news:['','nored','none'], lvn:['','Si','No'], clean:['','si'] };
  if (B.dir) opts.dir=['','Long','Short'];
  for (const k in opts) for (const v of opts[k]) if (v!==st[k]) out.push([k,v]);
  L.idea.forEach(i=>{ const add=!st.xIdea.includes(i); if (!add || st.xIdea.length<L.idea.length-1) out.push(['idea',i,add]); });
  L.bands.forEach(b=>{ const add=!st.xBand.includes(b[0]); if (!add || st.xBand.length<L.bands.length-1) out.push(['band',b[0],add]); });
  L.days.slice(0,5).forEach(g=>{ const add=!st.xDay.includes(g); if (!add || st.xDay.length<3) out.push(['day',g,add]); });
  return out; }
function pfMove(st, ch) { const [k,v,add]=ch, L2={ idea:'xIdea', band:'xBand', day:'xDay' }[k];
  if (k==='pair') return pfMove(pfMove(st, v), add);
  if (L2) return Object.assign({}, st, { [L2]: add ? st[L2].concat(v) : st[L2].filter(y=>y!==v) });
  return Object.assign({}, st, { [k]:v }); }
// Un filtro (o una coppia) resta solo se migliora il risultato (giorni pesati verso i recenti) e non peggiora i R al giorno degli
// ultimi giorni: deve funzionare soprattutto adesso. Prima uno alla volta; quando nessun filtro da solo aiuta, prova le coppie
// tra i 10 più promettenti, perché alcune confluenze funzionano solo insieme
function pfGreedy(B, T) {
  const ev=st=>{ const d=pfApply(B,st); return { sc:pfScore(pfStat(d,B.w)), rec:pfStat(d.slice(B.cut)).m }; };
  let st=pfAll(T), best=ev(st); const log=[], rej=[];
  const ok=v=>v.sc>best.sc+.01 && v.rec>=best.rec-1e-9;
  for (let pass=0; pass<4; pass++) { let imp=false;
    for (const ch of pfMoves(B, st)) { const c=pfMove(st, ch), v=ev(c); if (v.sc>best.sc+.01) { if (ok(v)) { log.push({ ch, from:st, to:c }); st=c; best=v; imp=true; } else rej.push({ ch, gain:v.sc-best.sc, from:st, to:c }); } }
    if (imp) continue;
    const singles=pfMoves(B, st).map(ch=>({ ch, v:ev(pfMove(st, ch)) })).filter(x=>isFinite(x.v.sc)).sort((a,b)=>b.v.sc-a.v.sc).slice(0,10);
    let bp=null;
    for (let i=0;i<singles.length;i++) for (let j=i+1;j<singles.length;j++) { const a=singles[i].ch, b=singles[j].ch; if (a[0]===b[0] && !{ idea:1, band:1, day:1 }[a[0]]) continue;
      const ch=['pair',a,b], c=pfMove(st, ch), v=ev(c); if (ok(v) && (!bp || v.sc>bp.v.sc)) bp={ ch, c, v }; }
    if (bp) { log.push({ ch:bp.ch, from:st, to:bp.c }); st=bp.c; best=bp.v; continue; }
    break; }
  // scartati: i miglioramenti più grandi sullo storico che però peggioravano gli ultimi giorni (uno per filtro)
  const seen=new Set(), rj=rej.sort((a,b)=>b.gain-a.gain).filter(x=>{ const k=pfChange(x.ch); if (seen.has(k) || log.some(l=>pfChange(l.ch)===k)) return false; seen.add(k); return true; }).slice(0,3);
  return { st, score:best.sc, log, rej:rj };
}
// un filtro in parole
function pfChange(ch) { const [k,v,add]=ch; if (k==='pair') return pfChange(v)+' insieme a '+pfChange(add);
  return ({ asset:v?'solo '+v:'ES e NQ', maxN:v?'al massimo '+v+' trade al giorno':'nessun limite di trade al giorno', sw:v?'stop dopo il primo trade in profitto':'niente stop dopo il primo win',
    sll:v?(v===1?'stop dopo la prima perdita':'stop dopo 2 perdite'):'niente stop dopo le perdite', xsl:v?'niente trade con stop oltre il '+(v==='p90'?'90°':'75°')+' percentile':'anche gli stop più larghi',
    smt:v==='fav'?'solo SMT a favore':v==='nosf'?'niente SMT a sfavore':'tutte le SMT', news:v?PF_NEWS[v]:'tutti i giorni di news', lvn:v==='Si'?'solo da LVN':v==='No'?'solo non da LVN':'LVN indifferente',
    clean:v?'solo 1m pulito':'anche 1m non pulito', dir:v?'solo '+v:'Long e Short', idea:(add?'senza ':'di nuovo con ')+v, band:(add?'niente ':'di nuovo ')+v, day:(add?'niente ':'di nuovo il ')+v })[k]; }
// i numeri di una strategia: trade, % vinti, R medi, profit factor, trade a settimana, serie peggiore di stop, drawdown in R
function pfNumbers(days) { let k=0, w=0, gp=0, gl=0, cur=0, streak=0, eq=0, pk=0, dd=0;
  days.forEach(d=>d.forEach(t=>{ k++; if (t.r>0) { w++; gp+=t.r; cur=0; } else { gl-=t.r; cur++; if (cur>streak) streak=cur; } eq+=t.r; if (eq>pk) pk=eq; if (eq-pk<dd) dd=eq-pk; }));
  return { k, wr:k?w/k:NaN, avg:k?(gp-gl)/k:NaN, pf:gl?gp/gl:Infinity, week:days.length?k/(days.length/5):0, streak, dd }; }
const pfStKey = st => JSON.stringify([st.T,st.asset,st.maxN,st.sw,st.sll,st.xsl,[...st.xIdea].sort(),st.smt,st.news,st.lvn,st.clean,[...st.xBand].sort(),[...st.xDay].sort(),st.dir]);
// le strategie da simulare: tutti i trade a 2R (riferimento) e le 7 migliori combinazioni tra i target da 0,5R a 5R; per ognuna
// i R al giorno negli ultimi giorni e su tutto lo storico, anche di tutti i trade allo stesso target
function pfStrats(B) {
  if (B._st) return B._st;
  const seen=new Set(), list=[], all=pfAll;
  const add=(st,g)=>{ const k=pfStKey(st); if (seen.has(k)) return; seen.add(k); const d=pfApply(B,st), s=pfStat(d,B.w), b=pfApply(B,all(st.T));
    list.push({ st, stat:s, score:pfScore(s), full:pfStat(d), rec:pfStat(d.slice(B.cut)), num:pfNumbers(d), numRec:pfNumbers(d.slice(B.cut)), base:{ full:pfStat(b), rec:pfStat(b.slice(B.cut)) }, log:g?g.log:[], rej:g?g.rej:[] }); };
  const G=PF_TG.map(T=>pfGreedy(B,T));
  add(all(2), G.find(g=>g.st.T===2&&!g.log.length));
  G.filter(g=>isFinite(g.score)).sort((a,b)=>b.score-a.score).forEach(g=>add(g.st,g));
  return (B._st={ list:list.slice(0,8) });
}
const PF_NEWS = { nored:'niente giorni con Red News', none:'solo giorni senza news' };
function pfDayRule(st, short) {
  const a=[st.maxN?(short?'max '+st.maxN+'/giorno':'al massimo '+st.maxN+' trade al giorno'):(short?'tutti i trade del giorno':'nessun limite di trade al giorno')];
  if (st.sw) a.push(short?'stop al 1° win':'stop dopo il primo trade in profitto');
  if (st.sll) a.push(short?'stop dopo '+st.sll+' loss':st.sll===1?'stop dopo la prima perdita':'stop dopo 2 perdite');
  return a.join(short?' · ':', '); }
function pfDesc(st, short, noDay) {
  const B=S._pfB||{ slq:{} }, a=[(short?'':'target ')+pfT(st.T), st.asset?(short?st.asset:'solo '+st.asset):'ES e NQ'];
  if (!noDay) a.push(pfDayRule(st, short));
  if (st.xsl) { const lim=Object.entries(B.slq).map(([k,q])=>k+' '+fmtN(q[st.xsl],1)+' pt').join(', '); a.push(short?'stop ≤ '+(st.xsl==='p90'?'90°':'75°')+' perc.':'niente trade con stop oltre '+(lim||(st.xsl==='p90'?'il 90° percentile':'il 75° percentile'))); }
  if (st.xIdea.length) a.push('senza '+st.xIdea.join(', '));
  if (st.smt) a.push(st.smt==='fav'?'solo SMT a favore':'niente SMT a sfavore');
  if (st.news) a.push(PF_NEWS[st.news]); if (st.lvn) a.push(st.lvn==='Si'?'solo da LVN':'solo non da LVN'); if (st.clean) a.push('solo 1m pulito');
  if (st.xBand.length) a.push('niente '+st.xBand.join(', ')); if (st.xDay.length) a.push('niente '+st.xDay.join(', ')); if (st.dir) a.push('solo '+st.dir);
  return a.join(' · '); }
// ── 2. motore ──
const pfRand = () => (Math.random()*4294967296)>>>0;
function pfRng(seed) { let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^t>>>15, t|1); t^=t+Math.imul(t^t>>>7, t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function pfConf(size, dll) { const q=PF_PRE[size], d=dll==='si';
  return { size, dllOn:d, dll:d?q.dllAmt:0, fee:d?q.feeD:q.feeN, target:q.target, mll:q.mll, lots:q.lots, cons:PF_CONS, minRoom:q.mll*.05 }; }
// rischi a trade provati, in frazioni del limite di perdita del conto (sul 50K da $100 a $1.000, a passi di $25 fino a $300); con l'approccio prudente almeno
// 4 stop pieni prima del limite di perdita e, col DLL, almeno 2 stop pieni nella stessa giornata
// dosaggio del rischio: fisso, oppure mai oltre metà (.5) o tutto (1) lo spazio che resta prima del limite di perdita; in quei casi
// il rischio scelto è il massimo (es. $1.500 a 1R sul 50K: dopo uno stop restano $500 e il trade dopo rischia $500)
const PF_DYN = { 0:'Rischio fisso', .33:'Al massimo un terzo dello spazio rimasto', .5:'Al massimo metà dello spazio rimasto', 1:'Al massimo tutto lo spazio rimasto' };
// rischi provati, in frazioni del limite di perdita del conto (sul 50K da $100 a $1.500, a passi di $25 fino a $300).
// Prudente: almeno 4 stop pieni prima del limite di perdita e, col DLL, almeno 2 nella giornata; niente «tutto lo spazio».
const pfRiskGrid = mll => [.05,.0625,.075,.0875,.1,.1125,.125,.1375,.15,.175,.2,.225,.25,.3,.35,.4,.45,.5,.6,.75].map(f=>Math.max(25, Math.round(f*mll/25)*25)).filter((v,i,a)=>a.indexOf(v)===i);
const pfRG = (z, d, safe) => { const q=PF_PRE[z], out=[];
  pfRiskGrid(q.mll).forEach(r=>{ if (safe) { if (r>q.mll/4+1e-9 || (d==='si' && r>q.dllAmt/2+1e-9)) return; out.push({ rE:r, dyn:0 }, { rE:r, dyn:.33 }, { rE:r, dyn:.5 }); }
    else { out.push({ rE:r, dyn:0 }, { rE:r, dyn:.33 }, { rE:r, dyn:.5 }); if (r>=q.mll/4) out.push({ rE:r, dyn:1 }); } });
  return out; };
function pfEngine(days, w) {
  const K=days.length, cd=7/5, cum=new Float64Array(K); let tot=0; for (let i=0;i<K;i++) { tot+=w?w[i]:1; cum[i]=tot; }
  // un giorno a caso: con i pesi, i giorni recenti escono più spesso
  const idx=rnd=>{ const x=rnd()*tot; let lo=0, hi=K-1; while (lo<hi) { const m=(lo+hi)>>1; if (cum[m]>x) hi=m; else lo=m+1; } return lo; };
  const rt=n=>Math.floor(n/10)*PF_RT.mini+(n%10)*PF_RT.micro;
  const D=days.map(day=>day.map(t=>({ r:t.r, T:t.T||2, mae:t.mae??(t.r<0?1:.5), sm:(t.sl||0)*(t.mv||5), mv:t.mv||5 })));
  let cm=0;   // commissioni pagate nel percorso in corso
  // Il rischio di ogni trade (size), deciso come farebbe un trader: il rischio del piano, ma
  //  · dyn: mai oltre una quota (1/3, metà o tutto) dello spazio rimasto prima del limite di perdita;
  //  · need: mai oltre quanto serve per chiudere target e consistenza con questo trade (vicino al traguardo non si rischia di più);
  //  · dcap: mai oltre il tetto di profitto della giornata (metà del target), così la consistenza è sempre rispettata.
  // A target raggiunto (con la consistenza a posto) non si trada più.
  const goalLeft=(p,a,dp)=>Math.max(p.target, Math.max(a.best,dp)/(p.cons/100))-a.bal;
  // contratti interi: i micro che stanno nel rischio con lo stop del trade (10 = 1 mini), entro il massimo del conto. Se non ne sta
  // nemmeno uno: per chiudere il target se ne prende comunque 1; col rischio del piano o lo spazio rimasto, 1 solo se il rischio
  // vero non va oltre il 60% in più, altrimenti il trade si salta; col tetto giornaliero quasi pieno la giornata finisce.
  // Senza stop in punti: R × rischio. Ritorna [rischio $, commissioni] oppure null (salta) o 0 (giornata finita)
  const size=(p,a,t,dp)=>{ const base=p.dyn?Math.min(p.rE, p.dyn*(a.bal-a.floor)):p.rE, need=p.need?(goalLeft(p,a,dp)+2*PF_RT.mini)/t.T:Infinity, cap=p.dcap?(p.cons/100*p.target-dp)/t.T:Infinity;
    const r=Math.min(base, need, cap); if (!t.sm) return r>0?[r, PF_RT.mini, 0]:(cap<=0?0:null);
    let n=Math.floor(r/t.sm+1e-9);
    if (n<1) { if (cap<=r+1e-9) return 0; if (need<=r+1e-9 && base>=.6*t.sm) n=1; else if (base<=r+1e-9 && r>=.6*t.sm) n=1; else return null; }
    n=Math.min(n, p.lots*10); return [n*t.sm, rt(n), PF_SLIP*t.mv*n]; };
  // una giornata su un conto. Daily Loss Limit e limite di perdita si toccano anche a trade aperto: se il trade va contro (SL DD)
  // fino al DLL viene chiuso lì e la giornata finisce (la valutazione continua); se arriva al limite di perdita la valutazione è persa
  const play=(p, a, day)=>{ let dp=0;
    for (let i=0;i<day.length;i++) { if (goalLeft(p,a,dp)<=0) break;
      const t=day[i], sz=size(p,a,t,dp); if (sz===0) break; if (!sz) continue;
      const [R$, c, sl$]=sz, dd=t.mae*R$, fD=a.bal-a.floor, lD=p.dll>0?p.dll+dp:Infinity; cm+=c;
      if (dd>=Math.min(fD,lD)) { if (lD<fD) { a.bal-=lD+c+sl$; dp-=lD+c+sl$; if (a.bal<=a.floor) return null; break; } return null; }
      const v=t.r>0 ? t.r*R$-c : t.r*R$-c-sl$; a.bal+=v; dp+=v; if (a.bal<=a.floor) return null; if (p.dll>0 && dp<=-p.dll) break; }
    return dp; };
  const newEval=p=>({ bal:0, peak:0, floor:-p.mll, best:0 });
  // valutazione: passata col profitto al target e il giorno migliore entro la consistenza (se la supera si continua finché rientra);
  // il limite di perdita segue il saldo più alto di fine giornata e si ferma al saldo iniziale
  // col rischio che si adatta, se lo spazio rimasto scende sotto il 5% del limite (sul 50K $100) non ci sta più un trade: il conto è finito
  const evalDay=(p,a,day)=>{ const dp=play(p, a, day); if (dp===null) return -1; if (dp>a.best) a.best=dp; if (a.bal>a.peak) a.peak=a.bal; a.floor=Math.min(a.peak-p.mll,0);
    if (a.bal>=p.target && a.best<=p.cons/100*a.bal+1e-9) return 1; return (p.dyn && a.bal-a.floor<p.minRoom) ? -1 : 0; };
  // abbonamento: si paga all'inizio e ogni 30 giorni di calendario finché il conto è attivo (si ferma quando passa o si brucia)
  const newSub=p=>({ cal:0, next:30, cost:p.fee });
  const subDay=(p,s)=>{ s.cal+=cd; while (s.cal>=s.next) { s.cost+=p.fee; s.next+=30; } };
  const q=(a,f)=>{ if (!a.length) return NaN; const b=Float64Array.from(a).sort(); return b[Math.min(b.length-1, Math.max(0, Math.round(f*(b.length-1))))]; };
  const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;
  // N valutazioni entro Td giorni feriali, una sola possibilità per conto: se un conto tocca il limite di perdita è bruciato e non
  // si ricompra. In copy (stessi trade su tutti i conti: passano o si bruciano insieme), a rotazione (ogni giorno con trade su un
  // conto diverso, tutti comprati subito) o uno alla volta (il successivo si compra quando il precedente è passato o bruciato)
  function pass(p, N, mode, Td, M, seed, full) {
    const rnd=pfRng(seed), pick=()=>D[idx(rnd)], cap=full?Math.max(Td*4, 260):Td;
    let ok=0, sumPassed=0, sumBurn=0; const doneD=[], costL=[], cmL=[], byDay=new Float64Array(cap+1), dist=new Float64Array(N+1);
    for (let s=0;s<M;s++) { let d=0, passed=0, burned=0, cost=0, passedAtT=0; cm=0;
      if (mode==='copy') { const a=newEval(p), sub=newSub(p);
        while (d<cap) { d++; subDay(p,sub); const r=evalDay(p,a,pick()); if (r===1) { passed=N; break; } if (r===-1) { burned=N; break; } }
        cost=sub.cost*N; if (passed && d<=Td) passedAtT=N; }
      else if (mode==='rot') { const A=Array.from({ length:N }, ()=>({ a:newEval(p), sub:newSub(p), st:0 })); let ptr=0;   // st: 0 attivo, 1 passato, −1 bruciato
        while (d<cap && passed+burned<N) { d++; A.forEach(x=>{ if (!x.st) subDay(p,x.sub); }); const day=pick(); if (!day.length) continue;
          while (A[ptr].st) ptr=(ptr+1)%N; const x=A[ptr]; ptr=(ptr+1)%N; const r=evalDay(p,x.a,day);
          if (r===1) { x.st=1; passed++; if (d<=Td) passedAtT++; } else if (r===-1) { x.st=-1; burned++; } }
        cost=A.reduce((c,x)=>c+x.sub.cost,0); }
      else { let a=newEval(p), sub=newSub(p), k=0;
        while (d<cap && k<N) { d++; subDay(p,sub); const r=evalDay(p,a,pick());
          if (r) { if (r===1) { passed++; if (d<=Td) passedAtT++; } else burned++; cost+=sub.cost; k++; if (k<N) { a=newEval(p); sub=newSub(p); } else sub=null; } }
        if (sub) cost+=sub.cost; }
      const done=passed>=N; if (done && d<=Td) ok++; sumPassed+=passedAtT; sumBurn+=burned; dist[passedAtT]++; costL.push(cost); cmL.push(mode==='copy'?cm*N:cm);
      if (done) { doneD.push(d); for (let i=d;i<=cap;i++) byDay[i]++; } }
    const out={ P:ok/M, passedT:sumPassed/M, cost:mean(costL), M };
    if (full) Object.assign(out, { costQ90:q(costL,.9), doneQ:[q(doneD,.25),q(doneD,.5),q(doneD,.75)], never:1-doneD.length/M, burned:sumBurn/M, dist:Array.from(dist).map(v=>v/M), comm:mean(cmL), commQ90:q(cmL,.9), byDay:Array.from(byDay).map(v=>v/M), cap });
    return out; }
  return { pass };
}
// ── 3. ricerca del piano ──
const pfTick = () => new Promise(r=>setTimeout(r,0));
const pfMoe = (p, M) => 1.96*Math.sqrt(Math.max(p*(1-p), 1/M)/M);   // margine d'errore al 95% di una probabilità stimata su M percorsi
// veloce: la probabilità di arrivare in tempo, poi la spesa; prudente: anche il rischio a trade conta (serve a sfoltire i candidati)
const pfPassGs = (v, N, safe) => safe ? v.P-.15*v.rf-.002*v.cost/(N*1000) : v.P-.01*v.cost/(N*1000);
// prudente: tra i piani quasi alla pari per probabilità (entro «tol» dal migliore) quello col rischio più basso, poi la spesa
const pfPickSafe = (l, tol) => { const pm=Math.max(...l.map(v=>v.P)); return l.filter(v=>v.P>=pm-tol).sort((a,b)=>a.rf-b.rf||a.cost-b.cost)[0]; };
async function pfOptPass(B, size, N, Td, goal, prog) {
  const SL=pfStrats(B).list, modes=N>1?['copy','rot','seq']:['copy'], dlls=['si','no'], safe=goal!=='fast';
  const s1=pfRand(), s2=pfRand(), M1=150, M2=1500, eng=SL.map(x=>pfEngine(pfApply(B,x.st), B.w)), gs=v=>pfPassGs(v,N,safe), mll=PF_PRE[size].mll;
  // un piano: strategia, DLL, modo, rischio, dosaggio (dyn), rischio quanto basta (need), tetto giornaliero (dcap)
  const c1=new Map(), c2=new Map(), ev=(c,M,sd,i,d,mode,rE,dyn,need=1,dcap=0)=>{ const k=[i,d,mode,rE,dyn,need,dcap].join('|'); let v=c.get(k);
      if (!v) { const r=eng[i].pass(Object.assign(pfConf(size,d), { rE, dyn, need, dcap }), N, mode, Td, M, sd, false); v={ i, d, mode, rE, dyn, need, dcap, rf:rE/mll*(1-dyn*.01), P:r.P, cost:r.cost, passedT:r.passedT }; c.set(k,v); } return v; };
  const pick=(l,tol)=>safe ? pfPickSafe(l,tol) : l.slice().sort((a,b)=>gs(b)-gs(a))[0];
  // rischio a due passaggi: prima un valore sì e uno no della griglia, poi i vicini dei 3 migliori
  const RGrid=pfRiskGrid(mll);
  const scan=(i,d,mode,dy)=>{ const opts=pfRG(size,d,safe).filter(o=>dy===undefined||o.dyn===dy), gi=o=>RGrid.indexOf(o.rE);
    const l=opts.filter(o=>gi(o)%2===0).map(o=>ev(c1,M1,s1,i,d,mode,o.rE,o.dyn)), anchors=new Set([pick(l,.05), ...l.slice().sort((a,b)=>gs(b)-gs(a)).slice(0,2)]);
    anchors.forEach(v=>opts.filter(o=>o.dyn===v.dyn && Math.abs(gi(o)-RGrid.indexOf(v.rE))===1).forEach(o=>l.push(ev(c1,M1,s1,i,d,mode,o.rE,o.dyn))));
    return pick(l,.05); };
  const topN=Math.min(4,SL.length), steps=SL.length+topN*dlls.length*(1+(modes.length-1))+6+SL.length; let done=0; const step=async()=>{ done++; prog(Math.min(.99,done/steps)); await pfTick(); };
  // 1) ogni strategia col DLL e in copy: rischio e dosaggio; 2) le 4 migliori con e senza DLL; con più conti anche rotazione e uno alla volta
  const st1=[]; for (let i=0;i<SL.length;i++) { st1.push(scan(i,'si','copy')); await step(); }
  const topS=st1.slice().sort((a,b)=>gs(b)-gs(a)).slice(0,topN).map(x=>x.i);
  for (const i of topS) for (const d of dlls) { const bc=scan(i,d,'copy'); await step();
    for (const mode of modes.slice(1)) { scan(i,d,mode,bc.dyn); await step(); } }
  // 3) i migliori provano anche le regole del traguardo: rischio quanto basta per chiudere e tetto di profitto della giornata
  const all1=[...c1.values()], base=new Set(all1.slice().sort((a,b)=>gs(b)-gs(a)).slice(0,10));
  if (safe) { const pm=Math.max(...all1.map(v=>v.P)); all1.filter(v=>v.P>=pm-.06).sort((a,b)=>a.rf-b.rf||a.cost-b.cost).slice(0,10).forEach(v=>base.add(v)); }
  const cand=new Set(base); for (const v of base) for (const [need,dcap] of [[0,0],[1,1],[0,1]]) cand.add(ev(c1,M1,s1,v.i,v.d,v.mode,v.rE,v.dyn,need,dcap));
  await step();
  // 4) ricontrollo con numeri nuovi e più percorsi
  const all2=[...c1.values()], fin=new Set([...cand].sort((a,b)=>gs(b)-gs(a)).slice(0,14));
  if (safe) { const pm=Math.max(...all2.map(v=>v.P)); all2.filter(v=>v.P>=pm-.06).sort((a,b)=>a.rf-b.rf||a.cost-b.cost).slice(0,10).forEach(v=>fin.add(v)); }
  const top=[...fin].map(v=>ev(c2,M2,s2,v.i,v.d,v.mode,v.rE,v.dyn,v.need,v.dcap)); await step();
  const best=pick(top, Math.max(.03, 2*pfMoe(Math.max(...top.map(v=>v.P)),M2)));
  // grafici: si cambia una scelta alla volta, le altre restano quelle del piano
  const bestFor=(i,d,mode,dy)=>{ const o=scan(i,d,mode,dy); return ev(c2,M2,s2,i,d,mode,o.rE,o.dyn,best.need,best.dcap); };
  const byMode=modes.map(mode=>mode===best.mode?best:bestFor(best.i,best.d,mode)); await step();
  const byDll=dlls.map(d=>d===best.d?best:bestFor(best.i,d,best.mode));
  const byRisk=pfRG(size,best.d,safe).filter(o=>o.dyn===best.dyn).map(o=>ev(c2,M2,s2,best.i,best.d,best.mode,o.rE,o.dyn,best.need,best.dcap));
  const byDyn=[...new Set(pfRG(size,best.d,safe).map(o=>o.dyn))].map(dy=>dy===best.dyn?best:bestFor(best.i,best.d,best.mode,dy)); await step();
  const byRule=[[0,0],[1,0],[0,1],[1,1]].map(([need,dcap])=>ev(c2,M2,s2,best.i,best.d,best.mode,best.rE,best.dyn,need,dcap)); await step();
  const byStrat=[]; for (let i=0;i<SL.length;i++) { byStrat.push(i===best.i?best:bestFor(i,best.d,best.mode)); await step(); }
  // il piano scelto, con 3.000 percorsi nuovi: coi giorni recenti pesati di più e con tutti i giorni uguali
  const pb=Object.assign(pfConf(size,best.d), { rE:best.rE, dyn:best.dyn, need:best.need, dcap:best.dcap }), res=eng[best.i].pass(pb, N, best.mode, Td, 3000, pfRand(), true), resAll=pfEngine(pfApply(B,SL[best.i].st)).pass(pb, N, best.mode, Td, 3000, pfRand(), true);
  return { goal:safe?'safe':'fast', size, N, Td, best, res, resAll, byMode, byDll, byRisk, byDyn, byRule, byStrat, strats:SL, tried:c1.size };
}
// ── 4. pagina ──
const PF_WEEKS = [{v:'2',l:'2 sett.'},{v:'4',l:'1 mese'},{v:'9',l:'2 mesi'},{v:'13',l:'3 mesi'},{v:'26',l:'6 mesi'}];
const pfWkLbl = w => ({ 2:'2 settimane', 4:'1 mese', 9:'2 mesi', 13:'3 mesi', 26:'6 mesi' })[+w] || w+' settimane';
const pfK = x => Math.abs(x)>=1000 ? (x<0?'−':'')+'$'+fmtN(Math.abs(x)/1000, Math.abs(x)%1000?1:0)+'k' : usd(x);
const pfAccTxt = (z, d) => 'Topstep '+z+(d==='si'?' con Daily Loss Limit':' senza Daily Loss Limit');
const PF_MODE = { copy:'In copy', rot:'A rotazione', seq:'Uno alla volta' };
// regole Topstep usate per una taglia, in parole
function pfRules(z) { const q=PF_PRE[z];
  return '<ul>'+
    '<li><b>Target:</b> '+usd(q.target)+' di profitto.</li>'+
    '<li><b>Limite di perdita (MLL):</b> '+usd(q.mll)+' sotto il saldo più alto di fine giornata; sale con il saldo e si ferma al saldo iniziale. Vale anche a trade aperto: se lo tocchi, la valutazione è persa.</li>'+
    '<li><b>Daily Loss Limit (facoltativo):</b> '+usd(q.dllAmt)+' di perdita nella giornata, anche a trade aperto. Se lo tocchi i trade si chiudono e per quel giorno hai finito, ma la valutazione continua. Il conto costa '+usd(q.feeD)+' al mese con il DLL, '+usd(q.feeN)+' senza.</li>'+
    '<li><b>Consistenza:</b> il giorno migliore non può valere più del '+PF_CONS+'% del profitto totale. Se lo supera non perdi: continui finché rientra.</li>'+
    '<li><b>Contratti:</b> al massimo '+q.lots+' mini o '+(q.lots*10)+' micro (10 micro = 1 mini).</li>'+
    '<li><b>Un tentativo per conto:</b> se un conto tocca il limite di perdita è bruciato e non si ricompra. L\'abbonamento si paga ogni 30 giorni finché il conto è attivo; quando passi o si brucia si ferma. L\'attivazione del conto finanziato è gratis.</li>'+
    '<li><b>Commissioni:</b> '+usd(PF_RT.mini,2)+' per mini e '+usd(PF_RT.micro,2)+' per micro, andata e ritorno. <b>Slippage:</b> 1 tick sugli stop e sulle chiusure forzate (ES $12,50 a mini, NQ $5).</li>'+
    '<li><b>Come trada il simulatore:</b> rischio dal tuo stop (buffer compreso) con contratti interi; smette appena il target è raggiunto con la consistenza a posto.</li></ul>'+
    (z!=='50K'?'<p>I valori del '+z+' sono da verificare sul sito Topstep.</p>':''); }
function renderMC() {
  const el=$('v-mc'); if (!S.loaded) { el.innerHTML=skeleton(); return; }
  const B=pfBase(), P=S.pf;
  if (!B) { el.innerHTML=skeleton(); fetchFile('EOW').then(()=>{ if (S.tab==='mc') renderCurrent(true); }).catch(()=>{}); return; }
  const fd=B.days.length?fmtIt(B.days[0])+' → '+fmtIt(B.days[B.days.length-1]):'';
  let html='<div class="stat-h rise"><div><div class="eyebrow">Prop firm · Topstep</div><h1>'+words('Simula')+'</h1></div></div>';
  html+='<div class="card wide mc-src rise" style="--d:40ms"><div class="mc-src-ic">'+logo(30)+'</div><div><b>Tutti i '+B.ts.length+' trade dell\'EOW · '+B.days.length+' giorni di borsa</b>'+
    '<span>'+fd+' · i filtri della pagina qui non valgono: il simulatore prova da solo target, asset, idee, SMT, news, LVN, 1m pulito, fasce orarie, giorni della settimana, direzione, stop e regole del giorno, anche a coppie, con più peso ai giorni recenti</span></div></div>';
  if (B.ts.length<40) html+='<div class="warn rise">'+ic('alert',17,2)+'<span>Solo '+B.ts.length+' trade nell\'EOW: servono più trade perché i risultati siano affidabili.</span></div>';
  html+='<div class="card wide rise pf-set" style="--d:80ms"><div class="card-h"><div class="h2">Passare le valutazioni</div><span class="sub">Topstep</span></div>'+
    '<p class="pf-lead">Scegli il conto, quanti passarne e in quanto tempo: cerco quali trade prendere, il rischio a trade, se usare il Daily Loss Limit e, con più conti, se tradarli in copy, a rotazione o uno alla volta.</p>'+
    '<div class="pf-opts"><div class="field"><span class="flabel">Conto</span>'+seg('pf-size',['50K','100K','150K'],P.size)+'</div><div class="field"><span class="flabel">Quanti conti</span>'+seg('pf-n',['1','2','3','4','5'],P.n)+'</div>'+
    '<div class="field"><span class="flabel">Entro</span>'+seg('pf-weeks',PF_WEEKS,P.weeks)+'</div><div class="field"><span class="flabel">Approccio</span>'+seg('pf-goal',[{v:'safe',l:'Prudente'},{v:'fast',l:'Veloce'}],P.goal)+'</div></div>'+
    '<p class="pf-goal">'+(P.goal==='fast'?'<b>Veloce:</b> la probabilità più alta di arrivare in tempo e la spesa più bassa, anche con rischi alti (fino a 3/4 del limite di perdita, anche con tutto lo spazio rimasto).':'<b>Prudente:</b> il rischio a trade più basso che ti fa arrivare in tempo quasi come il piano più aggressivo, con almeno 4 stop pieni prima del limite di perdita e 2 prima del Daily Loss Limit.')+'</p>'+
    '<button type="button" class="btn" id="mc-run" data-act="mcrun"'+(B.ts.length>=20?'':' disabled')+'>'+ic('spark',18,2)+'Trova il piano</button><div class="pf-prog" id="pf-prog"><i></i></div>'+
    '<details class="pf-rules"><summary>Le regole Topstep del '+P.size+' che simulo</summary>'+pfRules(P.size)+'</details></div>';
  html+='<div id="mc-res"></div>';
  S._pfB=B;
  enter(el, html, ()=>{ if (S.pfA && S.pfA.key===pfKey(B)) drawPass(S.pfA.res, true); });
}
const pfKey = B => JSON.stringify([B.ts.length, B.days.length, S.pf.size, S.pf.n, S.pf.weeks, S.pf.goal]);
function runMCClick() {
  const B=S._pfB; if (!B) return; const key=pfKey(B);
  const b=$('mc-run'), pg=$('pf-prog'), bar=pg.querySelector('i'); b.disabled=true; pg.classList.add('on'); bar.style.width='0%';
  const lbl=f=>{ b.innerHTML='<span class="spin"></span>'+(f<.05?'Cerco le combinazioni di trade… ':'Provo i piani… ')+Math.round(f*100)+'%'; bar.style.width=Math.round(f*100)+'%'; };
  lbl(0);
  setTimeout(async ()=>{ try { const t0=performance.now();
      const res=await pfOptPass(B, S.pf.size, Math.max(1,+S.pf.n||1), Math.max(5,(+S.pf.weeks||4)*5), S.pf.goal, lbl);
      res.ms=performance.now()-t0; res.B=B; S.pfA={ key, res };
      if (S.tab==='mc') drawPass(res); }
    catch(e) { console.error(e); toast('Simulazione non riuscita', true); }
    const b2=$('mc-run'); if (b2) { b2.disabled=false; b2.innerHTML=ic('spark',18,2)+'Ricalcola con numeri nuovi'; } const p2=$('pf-prog'); if (p2) p2.classList.remove('on'); }, 30);
}
// classifica delle strategie provate
function pfRank(rows, fmt, bestI) {
  return '<div class="pf-rank">'+rows.map((r,j)=>'<div class="pf-rk'+(r.i===bestI?' on':'')+'"><span class="pf-rk-n">'+(j+1)+'</span><div><b>'+esc(pfDesc(r.st,true))+'</b><span>'+esc(r.sub)+'</span></div><em>'+fmt(r)+'</em></div>').join('')+'</div>'; }
// come sono stati scelti i trade: da tutti i trade al target, un filtro alla volta, con l'effetto su R al giorno (storico e recenti)
// e numero di trade; poi i filtri scartati perché migliorano lo storico ma peggiorano gli ultimi giorni
function pfLogCard(B, x, d) {
  const S0=pfAll(x.st.T), sn=st=>{ const dd=pfApply(B,st); return { m:pfStat(dd).m, rec:pfStat(dd.slice(B.cut)).m, k:pfNumbers(dd).k, wr:pfNumbers(dd).wr }; };
  const row=(lbl,a,b2,cls)=>'<div class="pf-lg'+(cls?' '+cls:'')+'"><b>'+esc(lbl)+'</b><span>'+(a?fmtR(a.m,2)+' → ':'')+fmtR(b2.m,2)+' al giorno · recenti '+(a?fmtR(a.rec,2)+' → ':'')+fmtR(b2.rec,2)+' · '+(a?a.k+' → ':'')+b2.k+' trade, '+pct(b2.wr)+' vinti</span></div>';
  let h=row('Tutti i trade a '+pfT(x.st.T), null, sn(S0), 'base');
  if (!x.log.length) h+='<p class="pf-wf">Nessun filtro ha migliorato il risultato senza peggiorare gli ultimi giorni: prendi tutti i trade.</p>';
  x.log.forEach(l=>{ h+=row('+ '+pfChange(l.ch), sn(l.from), sn(l.to)); });
  if (x.rej.length) h+='<div class="pf-lg-h">Scartati: migliorano lo storico ma peggiorano gli ultimi giorni</div>'+x.rej.map(l=>row('− '+pfChange(l.ch), sn(l.from), sn(l.to), 'rej')).join('');
  return card('Come ho scelto i trade', 'un filtro alla volta, dal più utile', h, d); }
// i trade scelti in numeri e cosa vogliono dire col rischio del piano: la serie peggiore di stop e il drawdown dello storico in $
function pfNumCard(x, conf, b, d) { const n=x.num, nr=x.numRec, r=b.rE, streak$=n.streak*r, dd$=-n.dd*r;
  const cell=(l,v,h2)=>'<div><span>'+l+'</span><b>'+v+'</b><em>'+h2+'</em></div>';
  const g='<div class="pf-wf-g pf-num">'+cell('Trade vinti', pct(n.wr), 'a '+pfT(x.st.T)+' · di recente '+pct(nr.wr))+cell('R medi a trade', fmtR(n.avg,2), 'commissioni escluse · di recente '+fmtR(nr.avg,2))+
    cell('Profit factor', isFinite(n.pf)?fmtN(n.pf,2):'–', 'R vinti / R persi')+cell('Trade a settimana', fmtN(n.week,1), n.k+' trade in tutto')+
    cell('Serie peggiore', n.streak+' stop di fila', (b.dyn?'fino a ':'')+usd(streak$)+' col rischio del piano')+cell('Drawdown peggiore', fmtR(n.dd,1), (b.dyn?'fino a ':'')+usd(dd$)+' col rischio del piano')+'</div>';
  const ok=b.dyn || streak$<conf.mll, msg=b.dyn?'Con il rischio che si adatta allo spazio rimasto, una serie di stop riduce da sola il rischio: la serie peggiore dello storico ('+n.streak+' stop) non fa perdere la valutazione in un colpo.'
    : streak$<conf.mll ? 'La serie peggiore dello storico ('+n.streak+' stop di fila, '+usd(streak$)+') sta dentro il limite di perdita di '+usd(conf.mll)+'.'
    : 'Attenzione: con '+usd(r)+' a trade la serie peggiore dello storico ('+n.streak+' stop di fila, '+usd(streak$)+') supera il limite di perdita di '+usd(conf.mll)+': è il prezzo della velocità.';
  return card('I trade scelti in numeri', pfT(x.st.T)+' · tutto lo storico', g+'<p class="pf-wf '+(ok?'ok':'ko')+'">'+msg+'</p>', d); }
// le due stime: coi giorni recenti pesati di più (quella usata per le scelte) e con tutti i giorni uguali
const pfWeeks = B => Math.max(1, Math.round(B.hl/5));
function pfExp(B, a, b, fmt, lbl) {
  return '<div class="pf-exp"><div class="on"><span>Peso sui giorni recenti</span><b>'+fmt(a)+'</b><em>'+lbl+' · metà del peso va alle ultime '+pfWeeks(B)+' settimane: è la stima usata per scegliere il piano</em></div>'+
    '<div><span>Tutti i giorni uguali</span><b>'+fmt(b)+'</b><em>'+lbl+' · tutti i giorni dal '+fmtIt(B.days[0])+' contano allo stesso modo</em></div></div>'; }
// i trade scelti negli ultimi giorni e su tutto lo storico, contro tutti i trade allo stesso target
function pfRecCard(B, x, d) {
  const nf=pfStKey(x.st)===pfStKey(pfAll(x.st.T)), cell=(l,v,k)=>'<div><span>'+l+'</span><b class="'+(v>=0?'pos':'neg')+'">'+fmtR(v,2)+'</b><em>al giorno di borsa · '+k+' trade</em></div>';
  const down=x.rec.m < x.full.m-.05, nRec=B.days.length-B.cut;
  return card('Recenti o tutto lo storico', 'ultimi '+nRec+' giorni, dal '+fmtIt(B.days[B.cut]),
    '<p class="pf-wf">'+(nf?'Nessun filtro regge sui giorni recenti: con target '+pfT(x.st.T)+' conviene prendere tutti i trade.':'Ogni filtro è tenuto solo perché migliora il risultato <b>e</b> non peggiora gli ultimi '+nRec+' giorni rispetto a prendere tutti i trade.')+' I valori sono R al giorno di borsa, contando anche i giorni senza trade.</p>'+
    '<div class="pf-wf-g">'+cell((nf?'Tutti i trade':'Questi trade')+' · ultimi giorni', x.rec.m, x.rec.k)+cell((nf?'Tutti i trade':'Questi trade')+' · tutto lo storico', x.full.m, x.full.k)+
    (nf?'':cell('Tutti i trade · ultimi giorni', x.base.rec.m, x.base.rec.k)+cell('Tutti i trade · tutto lo storico', x.base.full.m, x.base.full.k))+'</div>'+
    '<p class="pf-wf '+(down?'ko':'ok')+'">'+(down?'Negli ultimi giorni questi trade rendono meno della loro media storica: per questo la stima coi giorni recenti è più bassa.':'Negli ultimi giorni questi trade rendono come o più della loro media storica.')+'</p>', d); }
// il passo del piano sul rischio: fisso, oppure che si adatta allo spazio rimasto prima del limite di perdita (con un esempio)
function pfRiskLi(conf, b, N) { const on=N>1?' su ogni conto':'';
  if (!b.dyn) return '<li><b>Rischia '+usd(b.rE)+' a trade'+on+'.</b><span class="pf-lots">'+pfStops(conf.mll,b.rE,conf.dll)+'.</span></li>';
  const thr=b.rE/b.dyn, room1=conf.mll-Math.min(b.rE, b.dyn*conf.mll), exR=room1<thr?room1:Math.round(thr/2/25)*25, part=b.dyn===1?'tutto lo spazio rimasto':'metà dello spazio rimasto';
  return '<li><b>Rischia '+usd(b.rE)+' a trade'+on+', ma mai più di '+part+' prima del limite di perdita.</b><span class="pf-lots">'+
    'Lo spazio è la distanza tra il saldo e il limite di perdita: all\'inizio '+usd(conf.mll)+', e torna a crescere con le giornate in profitto perché il limite segue il saldo più alto di fine giornata. '+
    'Finché ti restano almeno '+usd(thr)+' di spazio rischi '+usd(b.rE)+'; sotto rischi '+part+(room1<thr?': dopo il primo stop ti restano '+usd(room1)+' e il trade dopo rischia '+usd(Math.min(b.rE,b.dyn*room1)):': con '+usd(exR)+' di spazio, '+usd(b.dyn*exR))+'. '+
    (b.dyn===1?'Uno stop pieno con tutto lo spazio rimasto brucia il conto.':'Così uno stop solo non brucia mai il conto.')+' Se lo spazio scende sotto '+usd(conf.minRoom)+' non ci sta più un trade: quel conto è finito.'+(conf.dll?' Col Daily Loss Limit di '+usd(conf.dll)+' la giornata si chiude comunque lì.':'')+'</span></li>'; }
// rischio rispetto ai limiti del conto, in parole
const pfStops = (mll, r, dll) => { const k=Math.max(1, Math.floor(mll/r+1e-9)), j=dll?Math.floor(dll/r+1e-9):0, left=dll?dll-j*r:0;
  return (k<=1?'un solo stop pieno ti porta al limite di perdita':k+' stop pieni di fila ti portano al limite di perdita')+
    (dll?' · Daily Loss Limit '+usd(dll)+': '+(j<1?'il rischio supera il DLL':j+' stop pieni nello stesso giorno'+(left>=1?' e ti restano '+usd(left)+', quindi il trade dopo si chiude appena va contro di '+usd(left):' chiudono la giornata')):''); };
function drawPass(R, quiet) {
  const box=$('mc-res'); if (!box) return; const B=R.B||S._pfB, b=R.best, r=R.res, st=R.strats[b.i].st, conf=pfConf(R.size,b.d), N=R.N, wl=pfWkLbl(R.Td/5);
  const moe=pfMoe(r.P, r.M), tutti=N>1?'tutti e '+N+' i conti':'il conto', kp=(lbl, v, hint, cls, d)=>kpi(lbl, v, hint, d, cls);
  const modeTxt={ copy:N>1?'<b>Tradali in copy:</b> gli stessi trade su tutti i conti nello stesso momento; passano (o si bruciano) insieme.':'<b>Tradalo tutti i giorni</b> con le regole qui sotto.',
    rot:'<b>Tradali a rotazione:</b> ogni giorno in cui c\'è un trade lo fai su un conto solo, poi passi al successivo ('+['A','B','C','D','E'].slice(0,N).join(', ')+', A…). Compri tutti i conti subito; quando uno passa o si brucia, esce dal giro.',
    seq:'<b>Uno alla volta:</b> tutti i giorni sullo stesso conto finché passa (o si brucia), poi compri il successivo.' }[b.mode];
  let h='<div class="card wide pf-plan rise"><div class="eyebrow">'+(R.goal==='fast'?'Piano veloce':'Piano prudente')+' · '+N+' × '+R.size+' entro '+wl+'</div>'+
    '<div class="pf-plan-h"><div><h2>Passi '+tutti+' entro '+wl+' nel '+fmtN(r.P*100,0)+'% dei casi</h2><span>'+(moe>=.005?'margine d\'errore ±'+fmtN(moe*100,0)+'% · ':'')+pfAccTxt(R.size,b.d)+(N>1?' · '+PF_MODE[b.mode].toLowerCase():'')+'</span></div></div>'+
    pfExp(B, r.P, R.resAll.P, v=>fmtN(v*100,0)+'%', 'probabilità di passare '+tutti+' entro '+wl)+'<ol>'+
    '<li><b>Compra '+(N>1?N+' conti':'il conto')+' '+R.size+(b.d==='si'?' con':' senza')+' Daily Loss Limit</b> ('+usd(conf.fee)+' al mese'+(N>1?' ciascuno':'')+(b.mode==='seq'&&N>1?', uno alla volta':'')+').</li>'+
    '<li>'+modeTxt+'</li>'+
    '<li><b>Quali trade:</b> '+esc(pfDesc(st,false,true))+'.</li>'+
    '<li><b>Regole del giorno:</b> '+esc(pfDayRule(st))+(conf.dll?'; il Daily Loss Limit di '+usd(conf.dll)+' chiude comunque la giornata':'')+'.</li>'+
    pfRiskLi(conf, b, N)+
    '<li><b>Verso il traguardo:</b> '+[b.need?'quando ti manca poco rischia solo quanto basta per chiudere il target con un trade vinto (es. mancano '+usd(conf.target*.2)+' a '+pfT(st.T)+': '+usd(conf.target*.2/st.T)+')':'',
      b.dcap?'in un giorno non guadagnare più di '+usd(conf.target*conf.cons/100)+' (metà del target): arrivato lì smetti, così la consistenza è sempre a posto':'',
      'appena il target è raggiunto con la consistenza a posto, smetti di tradare'].filter(Boolean).join('; ')+'.</li>'+
    '<li><b>Se un conto si brucia, è finito:</b> non lo ricompri'+(N>1&&b.mode!=='copy'?'; gli altri conti continuano':'')+'.</li></ol>'+
    '<button type="button" class="btn sec sm pf-ai" data-act="pfai">'+ic('spark',16,2)+'Chiedi a Claude di commentare il piano</button></div>';
  // i numeri del piano
  const nev=r.never>=.01?' · nel '+pct(r.never)+' dei casi non l'+(N>1?'i passi tutti':'o passi')+' mai, per conti bruciati':'';
  h+='<div class="pf-h rise">'+ic('target',16,2)+'I numeri del piano · stima coi giorni recenti</div><div class="kgrid">'+
    kp('Passarl'+(N>1?'i tutti':'o')+' entro '+wl, numEl(r.P*100,0)+'<small>%</small>', N>1?'in media ne passi '+fmtN(r.passedT,1)+' su '+N+' in tempo':'probabilità su 3.000 percorsi', r.P>=.7?'pos':r.P>=.4?'':'neg', 0)+
    kp('Tempo che serve', isFinite(r.doneQ[1])?numEl(r.doneQ[1],0)+'<small> gg</small>':'–', isFinite(r.doneQ[1])?'giorni di borsa, quando ce la fai: la metà delle volte meno, 1 volta su 4 più di '+Math.round(r.doneQ[2])+nev:'mai: i conti si bruciano prima', '', 40)+
    kp('Conti bruciati', N>1?numEl(r.burned,1)+'<small> su '+N+'</small>':numEl(r.burned*100,0)+'<small>%</small>', N>1?'in media · abbonamenti '+usd(r.cost)+', 9 volte su 10 meno di '+usd(r.costQ90):'delle volte · abbonamenti '+usd(r.cost)+', 9 volte su 10 meno di '+usd(r.costQ90), r.burned<(N>1?.5:.15)?'pos':r.burned<(N>1?1.5:.35)?'':'neg', 80)+
    kp('Commissioni', usd(r.comm), 'pagate sui trade fino a quando passi'+(N>1?', su tutti i conti':'')+' · 9 volte su 10 meno di '+usd(r.commQ90), '', 120)+'</div>';
  // perché questo piano
  const pc=v=>fmtN(v,0)+'%', bar=(id,items,aria)=>barChart($(id), items, { h:170, fmt:v=>fmtN(v,1)+'% di probabilità', tickFmt:pc, aria });
  const it=(v,l,tip,on)=>({ v:Math.round(v.P*1000)/10, l, tip:tip+' · spesa media '+usd(v.cost)+(N>1?' · ne passi '+fmtN(v.passedT,1)+' su '+N:''), cls:'p'+(on?' pick':'') });
  h+='<div class="pf-h rise">'+ic('chart',16,2)+'Perché questo piano · probabilità di passare '+tutti+' entro '+wl+', cambiando una scelta alla volta</div>';
  const cards=[]; if (R.byMode.length>1) cards.push(card('Copy, rotazione o uno alla volta', 'col rischio migliore per ogni modo', '<div class="chart" id="c-pf-mode"></div>', 60));
  cards.push(card('Con o senza Daily Loss Limit', 'col rischio migliore per ciascuno', '<div class="chart" id="c-pf-dll"></div>', 80),
    card('Rischio fisso o che si adatta', 'allo spazio rimasto prima del limite di perdita', '<div class="chart" id="c-pf-dyn"></div>', 90),
    card('Quanto rischiare', (R.goal==='fast'?'rischio massimo a trade':'evidenziato: il più basso che ti fa arrivare in tempo')+(b.dyn?' · '+PF_DYN[b.dyn].toLowerCase():''), '<div class="chart" id="c-pf-risk"></div>', 100),
    card('Regole del traguardo', 'rischio quanto basta per chiudere · tetto di profitto giornaliero', '<div class="chart" id="c-pf-rule"></div>', 110),
    card('Settimana per settimana', 'probabilità di aver già passato '+tutti, '<div class="chart" id="c-pf-time"></div>', 120));
  h+=rows2(cards);
  const rk=R.byStrat.map(v=>({ i:v.i, st:R.strats[v.i].st, sub:fmtN(R.strats[v.i].num.k,0)+' trade · '+pct(R.strats[v.i].num.wr)+' vinti · '+fmtR(R.strats[v.i].num.avg,2)+' a trade · '+fmtR(R.strats[v.i].rec.m,2)+' al giorno di recente, '+fmtR(R.strats[v.i].full.m,2)+' su tutto · rischio '+(v.dyn?'fino a ':'')+usd(v.rE), v })).sort((x,y)=>(y.i===b.i)-(x.i===b.i) || y.v.P-x.v.P);
  h+=rows2([card('Quali trade prendere', 'la combinazione migliore per ogni target · a destra: probabilità di passare in tempo', pfRank(rk, x=>numEl(x.v.P*100,0)+'%', b.i), 140), pfRecCard(B, R.strats[b.i], 160)]);
  h+=rows2([pfLogCard(B, R.strats[b.i], 180), pfNumCard(R.strats[b.i], conf, b, 200)]);
  h+='<p class="mc-note rise">Come leggere: «probabilità» è la quota di percorsi simulati in cui passi '+tutti+' entro '+wl+' ('+fmtN(R.Td,0)+' giorni di borsa). Ho provato '+R.tried.toLocaleString('it-IT')+' piani ripescando a caso i '+B.days.length+' giorni di borsa dell\'EOW con i loro trade nell\'ordine in cui sono stati presi (i giorni recenti escono più spesso); i migliori li ho ricontrollati con 1.500 percorsi nuovi e il piano scelto con 3.000. Ogni calcolo usa numeri casuali nuovi: le cifre cambiano un poco'+(moe>=.005?' (±'+fmtN(moe*100,0)+'%)':'')+', le scelte restano se sono davvero migliori. È una stima sul passato, non una previsione.</p>';
  box.innerHTML=h; box.classList.toggle('quiet', !!quiet); richMeta(box);
  if (R.byMode.length>1) bar('c-pf-mode', R.byMode.map(v=>it(v, PF_MODE[v.mode], PF_MODE[v.mode]+' · rischio '+usd(v.rE), v.mode===b.mode)), 'Probabilità per modo');
  bar('c-pf-dll', R.byDll.map(v=>it(v, v.d==='si'?'Con DLL':'Senza DLL', pfAccTxt(R.size,v.d)+' · '+usd(pfConf(R.size,v.d).fee)+' al mese · rischio '+usd(v.rE), v.d===b.d)), 'Probabilità con e senza Daily Loss Limit');
  bar('c-pf-dyn', R.byDyn.map(v=>it(v, v.dyn===0?'Fisso':v.dyn===.5?'Metà spazio':'Tutto lo spazio', PF_DYN[v.dyn]+' · fino a '+usd(v.rE), v.dyn===b.dyn)), 'Probabilità per dosaggio del rischio');
  bar('c-pf-rule', R.byRule.map(v=>it(v, v.need&&v.dcap?'Entrambe':v.need?'Quanto basta':v.dcap?'Tetto':'Nessuna', (v.need?'rischio quanto basta per chiudere':'rischio pieno fino al target')+(v.dcap?' · tetto di '+usd(conf.target*conf.cons/100)+' al giorno':' · senza tetto giornaliero'), v.need===b.need&&v.dcap===b.dcap)), 'Probabilità con le regole del traguardo');
  bar('c-pf-risk', R.byRisk.map(v=>it(v, pfK(v.rE), (v.dyn?'fino a ':'')+usd(v.rE)+' a trade', v.rE===b.rE)), 'Probabilità per rischio');
  const w99=r.byDay.findIndex(v=>v>=.99), wkN=Math.min(Math.ceil(r.cap/5), Math.max(4, Math.ceil(R.Td/5)+2, w99>0?Math.ceil(w99/5)+1:0)), tp=[];
  for (let w=0; w<=wkN; w++) tp.push({ y:Math.round((r.byDay[Math.min(r.cap,w*5)]||0)*1000)/10, x:w?'settimana '+w:'inizio', tip:'entro la settimana '+w });
  lineChart($('c-pf-time'), tp, { h:170, x0:true, fmt:v=>fmtN(v,1)+'%', aria:'Probabilità settimana per settimana' });
  if (!quiet) { countUp(box, 0); setTimeout(()=>box.scrollIntoView({ behavior:'smooth', block:'start' }), 60); }
}


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['simula.js'] = '2026-10-28.1';

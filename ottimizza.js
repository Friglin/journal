// Edgebook · ottimizza.js — il mio piano (scheda per descriverlo) e la pagina Ottimizza: il piano contro le alternative.
// I file JS sono script classici caricati in ordine da index.html e condividono le stesse variabili globali:
// l'ordine conta (core.js → home.js → pagine.js → analisi.js → simula.js → ottimizza.js → scheda.js).

// ───────────────────────── IL MIO PIANO: descrizione e scheda per modificarlo ─────────────────────────
const PL_SMT = { '':'', nosf:'niente SMT a sfavore', fav:'solo SMT a favore' };
const PL_LVN = { '':'', Si:'solo da LVN', No:'solo non da LVN' };
const PL_CC2 = { '':'', si:'solo con 2° CC', no:'solo senza 2° CC' };
const PL_NEWS = { '':'', nored:'niente giorni con Red News', none:'solo giorni senza news' };
const pbKey = pb => Object.keys(PLAN_PB).find(k=>PLAN_PB[k].join()===pb.join()) ?? '';
const bandNames = () => L.bands.map(b=>b[0]);
// le condizioni d'ingresso che il piano chiede (quelle lasciate «indifferente» non compaiono)
function planCond(P) { P=P||PL(); const a=[];
  if (P.dir) a.push('solo '+P.dir); if (P.smt) a.push(PL_SMT[P.smt]); if (P.lvn) a.push(PL_LVN[P.lvn]); if (P.clean) a.push('solo 1m pulito');
  if (P.cc2) a.push(PL_CC2[P.cc2]); if (P.pb.length) a.push('fino a '+P.pb.length+' candele di pullback'); if (P.news) a.push(PL_NEWS[P.news]);
  return a; }
function planWhen(P) { P=P||PL(); const xb=bandNames().filter(b=>!P.bande.includes(b)), xd=L.days.filter(d=>!P.giorni.includes(d)), a=[];
  if (xb.length) a.push('niente '+xb.join(', ')); if (xd.length) a.push('niente '+xd.map(d=>d.toLowerCase()).join(', '));
  return a.length ? a.join(' · ') : 'tutte le fasce orarie, tutti i giorni'; }
const planWhat = P => mkList(P.asset)+' · '+(P.idee.length===L.idea.length ? 'tutte le idee' : P.idee.join(', '));
function planDesc(P) { P=P||PL(); const c=planCond(P);
  return { mercati_e_setup:planWhat(P), condizioni:c.length?c.join(', '):'nessun vincolo', orari:planWhen(P), gestione:mgTxt(P.g), regole_del_giorno:dayRuleTxt(P), altre_regole:P.altro||'' }; }
function planSumHtml(P) { P=P||PL(); const c=planCond(P), row=(i,l,v)=>'<div class="pl-r">'+ic(i,16,2)+'<span>'+l+'</span><b>'+esc(v)+'</b></div>';
  return '<div class="pl-sum">'+row('list','Mercati e setup',planWhat(P))+row('filter','Condizioni',c.length?c.join(' · '):'nessun vincolo')+row('clock','Orari',planWhen(P))+
    row('target','Gestione',mgTxt(P.g))+row('shield','Regole del giorno',dayRuleTxt(P))+(P.altro?row('book','Altre regole',P.altro):'')+'</div>'; }
// ogni modifica del piano si salva subito ed è sincronizzata; le pagine che lo usano si ricalcolano
function planSaved(prev) { if (prev) S._planPrev=prev; normPiano(); syncTouch('piano'); S._opt=null; gcSess(); }
function openPlan() { S.sheet='plan'; $('sh-sub').textContent='Impostazioni · uguale su telefono e PC'; $('sh-title').innerHTML=words('Il mio piano'); renderPlanSheet(); openSheet(); }
function renderPlanSheet() {
  const P=PL(), g=P.g, el=$('sh-body'), top=el.scrollTop, x=v=>({ v, l:fmtX(v)+'R' }), sec=(t,sub,b)=>'<div class="fsec"><div class="fsec-h"><div class="h2">'+t+'</div>'+(sub?'<span class="mut" style="font-size:12.5px">'+sub+'</span>':'')+'</div>'+b+'</div>', f=(l,b,hint)=>'<div class="field"><span class="flabel">'+l+'</span>'+b+(hint?'<span class="hint">'+hint+'</span>':'')+'</div>';
  let h=sec('Cosa tradi','',f('Mercati · anche più di uno',chips('pl-asset',L.asset,P.asset,true))+f('Idee 5m che fanno parte del piano',chips('pl-idee',L.idea,P.idee,true))+
    f('Direzione',seg('pl-dir',[{v:'',l:'Long e Short'},'Long','Short'],P.dir)));
  h+=sec('Condizioni d\'ingresso','lascia «indifferente» quello che non guardi',
    f('SMT',seg('pl-smt',[{v:'',l:'Indifferente'},{v:'nosf',l:'Non a sfavore'},{v:'fav',l:'Solo a favore'}],P.smt))+
    '<div class="g2">'+f('Coming from LVN',seg('pl-lvn',[{v:'',l:'Indiff.'},{v:'Si',l:'Sì'},{v:'No',l:'No'}],P.lvn))+f('1m pulito obbligatorio',seg('pl-clean',[{v:'',l:'Indiff.'},{v:'si',l:'Sì'}],P.clean))+'</div>'+
    f('2° CC',seg('pl-cc2',[{v:'',l:'Indifferente'},{v:'si',l:'Obbligatoria'},{v:'no',l:'Esclusa'}],P.cc2))+
    f('Candele di pullback',seg('pl-pb',[{v:'',l:'Tutte'},{v:'2',l:'Fino a 2'},{v:'3',l:'Fino a 3'},{v:'4',l:'Fino a 4'}],pbKey(P.pb)))+
    f('News',seg('pl-news',[{v:'',l:'Tutti i giorni'},{v:'nored',l:'No Red News'},{v:'none',l:'Solo senza'}],P.news)));
  h+=sec('Quando','',f('Fasce orarie',chips('pl-bande',bandNames(),P.bande,true),'Con Wall Street che apre alle 15:30: nelle settimane del cambio d\'ora l\'app le sposta da sola.')+f('Giorni',chips('pl-giorni',L.days,P.giorni,true)));
  const lk=v=>({ v, l:v?'+'+fmtX(v)+'R':'BE' });
  h+=sec('Gestione del trade','',f('Come esci',seg('pl-gk',[{v:'P',l:'A parziali'},{v:'T',l:'Target fisso'},{v:'L',l:'Trailing'}],g.k))+
    (g.k==='T' ? f('Target',chips('pl-gt',PLAN_MG.T.map(x),g.t))+f('Sposta lo stop quando arriva a',chips('pl-gbe',[{v:0,l:'Mai'},...PLAN_MG.BE.filter(b=>b<g.t).map(x)],g.be||0))+
        (g.be ? f('Lo stop va a',seg('pl-gbs',PLAN_MG.BS.filter(b=>b<g.be).map(lk),g.bs||0)) : '')
    : g.k==='L' ? f('Parte quando arriva a',chips('pl-gla',PLAN_MG.LA.map(x),g.a))+f('Segue il prezzo a distanza di',chips('pl-gld',PLAN_MG.LD.map(x),g.d),'Lo stop sta sempre a questa distanza dal massimo raggiunto, e sale con lui.')+
        f('Target',chips('pl-glt',PLAN_MG.LT.filter(t=>!t || t>g.a).map(t=>t?x(t):{ v:0, l:'Nessuno' }),g.t||0))
    : f('Prima metà a',chips('pl-gt1',PLAN_MG.P1.map(x),g.t1))+f('Poi lo stop del resto va a',seg('pl-gs',PLAN_MG.PS.filter(v=>v<g.t1).map(lk),g.s))+f('Resto a',chips('pl-gt2',PLAN_MG.P2.filter(v=>v>g.t1).map(x),g.t2)))+
    '<p class="hint" style="margin:0">In breve: '+esc(mgTxt(g))+'.</p>');
  h+=sec('Regole del giorno','',f('Trade al giorno, al massimo',seg('pl-maxN',[{v:1,l:'1'},{v:2,l:'2'},{v:3,l:'3'},{v:0,l:'Nessuno'}],P.maxN))+
    f('Stop dopo il primo trade in profitto',seg('pl-sw',[{v:1,l:'Sì'},{v:0,l:'No'}],P.sw))+f('Stop dopo le perdite',seg('pl-sll',[{v:0,l:'No'},{v:1,l:'Dopo la prima'},{v:2,l:'Dopo 2'}],P.sll))+
    f('Un trade alla volta',seg('pl-uno',[{v:1,l:'Sì'},{v:0,l:'No'}],P.uno),'Con «Sì» non entri se hai già un trade aperto: per esempio quando ES e NQ danno il segnale insieme ne prendi uno solo (il primo: ES, poi NQ, poi GC).')+
    '<div class="field"><label for="pl-loss">Perdita massima al giorno (R)</label><input class="inp" id="pl-loss" data-pl="lossR" inputmode="decimal" value="'+(P.lossR?fmtN(P.lossR,P.lossR%1?1:0):'')+'" placeholder="vuoto = nessuna"><span class="hint">Oltre questa, la Panoramica ti dice di fermarti.</span></div>');
  h+=sec('Altre regole','',fld('altro','','<textarea class="inp" id="pl-altro" data-pl="altro" rows="3" maxlength="600" placeholder="Es. niente trade nei 5 minuti prima di una news rossa">'+esc(P.altro)+'</textarea>')+
    '<p class="hint" style="margin:0">Quello che i campi sopra non coprono. Lo legge Claude quando gli chiedi un parere sul piano.</p>');
  el.innerHTML=h; el.scrollTop=top;
  $('sh-foot').innerHTML='<button type="button" class="btn sec" data-nav="opt">'+ic('target',18,2)+'Ottimizza</button><button type="button" class="btn" style="flex:1" data-act="close">Fatto</button>';
}
function planClick(b) {
  const sg=b.closest('[data-seg]'), ch=b.closest('[data-chips]'), k=(sg||ch||{}).dataset; if (!k) return false;
  const key=(sg?k.seg:k.chips); if (key.indexOf('pl-')!==0) return false;
  const P=JSON.parse(JSON.stringify(PL())), prev=JSON.parse(JSON.stringify(PL())), v=b.dataset.v, n=+v, name=key.slice(3);
  if (ch && ch.dataset.multi) { const a=P[name]; P[name]=a.includes(v)?a.filter(x=>x!==v):a.concat(v);
    if (!P[name].length) { toast('Nel piano ne serve almeno uno', true); return true; } }
  else if (name==='pb') P.pb=PLAN_PB[v]||[];
  else if (name==='gk') P.g = v==='T' ? { k:'T', t:P.g.k==='P'?P.g.t1:P.g.k==='L'?(P.g.t||4):P.g.t } : v==='L' ? { k:'L', a:2, d:1, t:4 } : { k:'P', t1:2, s:1, t2:4 };
  else if (name==='gt') { P.g.t=n; if (P.g.be>=n) { delete P.g.be; delete P.g.bs; } }
  else if (name==='gbe') { if (n) { P.g.be=n; if (P.g.bs>=n) delete P.g.bs; } else { delete P.g.be; delete P.g.bs; } }
  else if (name==='gbs') { if (n) P.g.bs=n; else delete P.g.bs; }
  else if (name==='gla') { P.g.a=n; if (P.g.t && P.g.t<=n) P.g.t=PLAN_MG.LT.find(x=>x>n)||0; }
  else if (name==='gld') P.g.d=n;
  else if (name==='glt') P.g.t=n;
  else if (name==='gt1') { P.g.t1=n; if (P.g.t2<=n) P.g.t2=PLAN_MG.P2.find(x=>x>n); if (P.g.s>=n) P.g.s=0; }
  else if (name==='gs') P.g.s=n;
  else if (name==='gt2') { if (n<=P.g.t1) { toast('Il resto deve uscire oltre la prima metà', true); return true; } P.g.t2=n; }
  else if (['maxN','sw','sll','uno'].includes(name)) P[name]=n;
  else P[name]=v;
  CFG.piano=P; planSaved(prev); renderPlanSheet(); return true;
}
document.addEventListener('change', e => { const k=e.target.dataset && e.target.dataset.pl; if (!k || S.sheet!=='plan') return;
  const prev=JSON.parse(JSON.stringify(PL()));
  if (k==='lossR') { const v=numS(e.target.value); CFG.piano.lossR = isFinite(v) && v>0 ? v : 0; } else CFG.piano.altro=e.target.value;
  planSaved(prev); toast('Piano salvato'); });

// ───────────────────────── OTTIMIZZA ─────────────────────────
// Il piano contro le alternative sui trade dell'EOW (backtest dal Max Real RR), settimana per settimana: su tutto lo
// storico, sugli ultimi 3 mesi, sull'ultimo mese e sulle ultime 3 settimane. Una modifica è consigliata solo se migliora i R
// a settimana con buona probabilità (ricampionando le settimane, con più peso alle recenti), non peggiora l'ultimo mese e
// cambia l'esito di abbastanza trade da non essere un caso. Il target fisso è esatto dal Max Real RR; stop a BE e parziali si
// calcolano dal percorso scritto nelle note dei trade (optWalk), con il caso peggiore quando la nota non basta.
const OPT_WIN = [{ k:'all', l:'Tutto' }, { k:13, l:'3 mesi' }, { k:4, l:'4 sett.' }, { k:3, l:'3 sett.' }];
const OPT_HL = 12;           // peso delle settimane: si dimezza ogni 12 settimane andando indietro (con 6 la prova sul passato
                             // dava consigli peggiori: le ultime settimane da sole sono troppo rumorose)
// soglie tarate rimescolando a caso gli esiti dei trade (nessun legame tra filtri ed esito): vedi optnull in CLAUDE.md.
// p = probabilità con le settimane recenti pesate di più, pa = tutte uguali. «Conviene» non deve peggiorare troppo il drawdown.
const optDDok = c => c.ddV >= c.ddB - Math.max(2, .3*Math.abs(c.ddB));
// «Forte di recente» (scelta dell'utente: il mercato cambia, il recente deve contare): almeno 4 trade cambiati e +1 R a settimana
// nelle ultime 3 settimane, positiva nelle ultime 4 e nei 3 mesi, e non negativa sullo storico (adattarsi al mercato di adesso
// senza andare contro il lungo periodo). Prova sul passato del 9/11/2026, con le regole del giorno senza senno di poi e cinque
// piani di partenza: seguire «conviene + forte di recente» ha reso 1,04 / 1,42 / 1,58 / 1,67 / 3,88 R a settimana contro
// 0,25 / 1,25 / 1,00 / 1,67 / 4,58 del piano fermo (meglio in 3, pari in 1, peggio in 1); con i soli «conviene» 0,25 / 1,04 /
// 1,42 / 1,50. Senza il vincolo sullo storico o con soglie diverse i risultati erano più instabili. Per questo il piano per
// adesso si propone solo se, con i dati e il piano dell'utente, la stessa prova rende più del piano (almeno +0,1 R a settimana e più settimane migliori che peggiori).
const optNowOk = c => c.aff3>=4 && c.w3>=1 && c.m1>=.5 && c.m3>0 && c.all>=0;
const OPT_NOW = c => c.verdict==='si' || optNowOk(c);
const OPT_ACT = c => OPT_NOW(c) || c.verdict==='indizio';
const optFlag = c => !!c.verdict && c.verdict!=='calo';   // la modifica è segnalata (conviene, da provare o forte di recente)
function optVerdict(c) {
  if (!c.aff) return '';
  // le ultime 3 settimane hanno la priorità (richiesta dell'utente): niente proposte che stanno peggiorando proprio adesso.
  // Prova sul passato: questo veto non toglie nulla ai risultati; pesare di più le ultime settimane nel verdetto invece sì
  // (emivita 6: da +0,71 a +0,38 R a settimana; emivita 3: −0,17), perché poche settimane hanno troppo pochi trade.
  const ok = c.all>0 && c.m3>=0 && c.m1>=0 && c.w3>=0;
  if (c.aff>=8 && c.p>=.99 && c.pa>=.95 && ok && c.m3>0 && c.wm>=.2 && optDDok(c)) return 'si';
  if (c.aff>=6 && ok && c.wm>=.15 && ((c.p>=.9 && c.pa>=.75) || (c.pa>=.95 && c.p>=.8))) return 'indizio';
  if (optNowOk(c)) return 'recente';
  if (c.aff>=8 && c.all>0 && c.pa>=.8 && c.m3<0 && c.m1<0) return 'calo';
  return ''; }
function optBase() {
  const E=rowsOf('EOW'); if (!E) return null;
  const cut=revWeek();   // solo settimane di borsa chiuse: quella in corso entra quando finisce
  if (S._optB && S._optB.src===E && S._optB.cut===cut) return S._optB;
  const ts=[];
  E.forEach(t=>{ const mx=isFinite(t.max)?t.max:t.best; if (!t.d || !isFinite(mx) || t.d.getDay()%6===0) return; const wk=weekOf(iso(t.d)); if (wk>cut) return;
    ts.push({ t, mx, wk, day:iso(t.d), band:bandOf(t), pb:String(t.raw['Candele PB']??'').trim() }); });
  const weeks=[], wi={};
  if (ts.length) for (let d=pdIso(ts[0].wk); iso(d)<=ts[ts.length-1].wk; d=addDays(d,7)) { wi[iso(d)]=weeks.length; weeks.push(iso(d)); }
  return (S._optB={ src:E, cut, ts, weeks, wi, dir:ts.some(x=>x.t.dir), cc2:hasCol('2° CC')||ts.some(x=>x.t.cc2) }); }
// Target fisso senza BE: esatto dal Max Real RR (massimo di tutto il trade: il trade finisce al target o allo stop). Stop a BE e
// parziali dipendono dall'ordine dei movimenti: si seguono gli estremi scritti nella nota (notePath); dopo la fine della nota si
// sa solo il massimo, e se non basta per decidere si prende il caso peggiore (mai una stima per eccesso).
function optR(B, x, g, best) { const mx=x.mx;
  if (g.k==='T' && !g.be) return mx>=g.t-1e-9 ? g.t : -1;
  if (x.pth===undefined) x.pth = notePath(x.t && x.t.raw ? x.t.raw.Note : '');
  if (x.pth) return optWalk(x.pth, mx, g)[best?1:0];
  // senza nota: come prima (stima)
  if (g.k==='T') return mx>=g.t-1e-9 ? g.t : mx>=g.be-1e-9 ? (g.bs||0) : -1;
  if (g.k==='L') return g.t && mx>=g.t-1e-9 ? g.t : mx>=g.a-1e-9 ? g.a-g.d : -1;
  if (mx<g.t1-1e-9) return -1;
  return .5*g.t1 + .5*g.s; }
// Esito di un'uscita seguendo il percorso scritto nella nota: [caso peggiore, caso migliore]. Tra due punti della nota il prezzo
// si muove in una direzione sola. Uscite: target fisso con lo stop spostato a BE o in profitto (be → bs), stop che segue il prezzo a
// distanza d da quando arriva ad a (con target t o senza), metà a t1 con stop a +s e resto a t2.
// Dopo la fine della nota si sa solo il massimo di tutto il trade (Max Real RR) e che il trade finisce al target o allo stop.
// Caso migliore: sale dritto al massimo e poi torna allo stop. Caso peggiore: torna indietro appena lo stop si stringe (se è già
// stretto, subito). Se lo stop non si muove mai l'esito è esatto (target raggiunto o stop).
function optWalk(N, mx, g) {
  let stop=-1, half=null, top=0; const K=g.k, ex=st=>half!==null ? .5*half+.5*st : st;
  const up=v=>{ if (v<=top+1e-9) return null;
    if (K==='T') { if (v>=g.t-1e-9) return g.t; if (g.be && v>=g.be-1e-9) stop=Math.max(stop, g.bs||0); }
    else if (K==='L') { if (g.t && v>=g.t-1e-9) return g.t; if (v>=g.a-1e-9) stop=Math.max(stop, v-g.d); }
    else { if (half===null && v>=g.t1-1e-9) { half=g.t1; stop=Math.max(stop, g.s); } if (half!==null && v>=g.t2-1e-9) return .5*half+.5*g.t2; }
    top=v; return null; };
  for (let i=1;i<N.p.length;i++) { const v=N.p[i];
    if (v<=stop+1e-9) { const r=ex(stop); return [r,r]; }
    const r=up(v); if (r!==null) return [r,r]; }
  const M=Math.max(mx||0, top), save=[stop,half,top];
  const best=(()=>{ const r=up(M); return r!==null ? r : ex(stop); })();
  [stop,half,top]=save;
  let worst;
  if (stop>-1+1e-9) worst=ex(stop);
  else { // sale per gradini (i livelli che cambiano qualcosa) e torna indietro al primo stop che si stringe
    const lv=(K==='T' ? [g.be,g.t] : K==='L' ? [g.a,g.t] : [g.t1,g.t2]).filter(x=>x && x>top+1e-9 && x<=M+1e-9).sort((a,b)=>a-b).concat(M);
    for (const v of lv) { const r=up(v); if (r!==null) { worst=r; break; } if (stop>-1+1e-9) { worst=ex(stop); break; } }
    if (worst===undefined) worst=ex(stop); }
  return [Math.min(worst,best), Math.max(worst,best)]; }
function optPass(P, x) { const t=x.t;
  if (!P.asset.includes(mktOf(t.a)) || !P.idee.includes(t.idea) || !P.giorni.includes(t.day) || !P.bande.includes(x.band)) return false;
  if ((P.dir && t.dir!==P.dir) || (P.smt==='fav' && t.smt!=='SMT a favore') || (P.smt==='nosf' && t.smt==='SMT a sfavore')) return false;
  if ((P.lvn && t.lvn!==P.lvn) || (P.clean && !t.clean) || (P.cc2==='si' && !t.cc2) || (P.cc2==='no' && t.cc2)) return false;
  if ((P.news==='nored' && t.news==='Red News') || (P.news==='none' && t.news!=='No News Day')) return false;
  if (P.pb.length && !P.pb.includes(x.pb)) return false;
  return true; }
// simulazione del piano: i trade presi giorno per giorno con le regole del giorno, i R per settimana e l'esito di ogni trade
function optSim(B, P, best) {
  const W=B.weeks.length, wR=new Float64Array(W), wN=new Float64Array(W), rs=new Map(), seq=[], take=dayRules(P);
  B.ts.forEach((x,i)=>{ if (!optPass(P,x)) return;
    const r=optR(B,x,P.g,best); if (!take(x.t, r, P.g)) return;   // regole del giorno senza senno di poi (dayRules in core.js)
    const w=B.wi[x.wk]; wR[w]+=r; wN[w]++; rs.set(i,r); seq.push([w,r]); });
  return { wR, wN, rs, seq }; }
// i numeri di una simulazione nelle ultime n settimane (fino alla settimana «to», esclusa)
function optNums(B, sim, n, to) { to=to??B.weeks.length; const from=Math.max(0, to-(n==='all'?to:n)), k=to-from; let R=0, N=0, w=0, eq=0, pk=0, dd=0;
  sim.seq.forEach(([wk,r])=>{ if (wk<from || wk>=to) return; R+=r; N++; if (r>0) w++; eq+=r; if (eq>pk) pk=eq; if (eq-pk<dd) dd=eq-pk; });
  return { R, n:N, wk:k, rw:k?R/k:NaN, rt:N?R/N:NaN, wr:N?w/N:NaN, dd, cur:eq-pk }; }
// generatore di numeri casuali con seme: gli stessi dati danno sempre lo stesso risultato
function optRng(seed) { let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
// confronto di una variante con il piano, settimana per settimana nelle settimane [0, to)
const OPT_CC = new WeakMap();   // base → variante → (settimane, estrazioni) → confronto: le prove sul passato ne rifanno molti uguali
function optCmp(B, base, v, to, N) {
  to=to??B.weeks.length; N=N||1000;
  let m1=OPT_CC.get(base); if (!m1) OPT_CC.set(base, m1=new WeakMap()); let m2=m1.get(v); if (!m2) m1.set(v, m2=new Map()); const ck=to*1e5+N, hit=m2.get(ck); if (hit) return hit;
  const d=[], w=[]; for (let i=0;i<to;i++) { d.push(v.wR[i]-base.wR[i]); w.push(Math.pow(.5,(to-1-i)/OPT_HL)); }
  const mean=(a,b)=>{ const s=d.slice(Math.max(0,to-a)); return s.length ? s.reduce((x,y)=>x+y,0)/s.length : 0; };
  const W=w.reduce((x,y)=>x+y,0), wm=d.reduce((s,x,i)=>s+x*w[i],0)/W;
  const rng=optRng(to*7919+Math.round(wm*1e4)); let pos=0, posA=0;
  for (let k=0;k<N;k++) { let s=0, sw=0, sa=0; for (let i=0;i<to;i++) { const j=Math.floor(rng()*to); s+=d[j]*w[j]; sw+=w[j]; sa+=d[j]; } if (s/sw>0) pos++; if (sa>0) posA++; }
  let aff=0, aff3=0; const keys=new Set([...base.rs.keys(), ...v.rs.keys()]);
  keys.forEach(i=>{ const wk=B.wi[B.ts[i].wk]; if (wk<to && base.rs.get(i)!==v.rs.get(i)) { aff++; if (wk>=to-3) aff3++; } });
  const l4=d.slice(-4);
  const c={ all:mean(to), m3:mean(13), m1:mean(4), w3:mean(3), w1:to?d[to-1]:0, up4:l4.filter(x=>x>1e-9).length, dn4:l4.filter(x=>x<-1e-9).length, aff3, wm, p:pos/N, pa:posA/N, aff, ddB:optNums(B,base,'all',to).dd, ddV:optNums(B,v,'all',to).dd };
  c.verdict=optVerdict(c); m2.set(ck,c); return c; }
// le modifiche possibili a partire da un piano: [categoria, testo, nuovo piano]
// gestioni confrontate: target fissi, target con stop a BE, metà a 2R con stop a +1R o a BE (tutte calcolate dalle note)
// ── Uscita dal trade, dalle note: tutte le uscite possibili con le altre regole del piano. Per non inseguire il caso si guarda
// il «gruppo» di ogni uscita (lei e le vicine: un passo in più o in meno su un parametro): un'uscita buona ha vicine buone.
function optExitGrid() { const M=PLAN_MG, out=[];
  M.T.forEach((t,i)=>out.push({ f:'T', g:{ k:'T', t }, ix:[i] }));
  M.T.forEach((t,i)=>M.BE.forEach((be,j)=>{ if (be>=t) return; M.BS.forEach((bs,k)=>{ if (bs>=be) return; out.push({ f:'B', g:Object.assign({ k:'T', t, be }, bs?{ bs }:{}), ix:[i,j,k] }); }); }));
  M.LA.forEach((a,i)=>M.LD.forEach((d,j)=>M.LT.forEach((t,k)=>{ if (t && t<=a) return; out.push({ f:'L', g:{ k:'L', a, d, t }, ix:[i,j,k] }); })));
  M.P1.forEach((t1,i)=>M.PS.forEach((s,j)=>{ if (s>=t1) return; M.P2.forEach((t2,k)=>{ if (t2<=t1) return; out.push({ f:'P', g:{ k:'P', t1, s, t2 }, ix:[i,j,k] }); }); }));
  return out; }
// punteggio di un'uscita fino alla settimana «to» (esclusa): media dei R a settimana suoi e delle vicine
const optXScore = (v, to, OPT_XHL) => { const g=[v, ...v.nb]; let s=0;
  g.forEach(u=>{ let a=0, w=0; for (let i=0;i<to;i++) { const k=OPT_XHL ? Math.pow(.5,(to-1-i)/OPT_XHL) : 1; a+=u.sim.wR[i]*k; w+=k; } s+=w?a/w:0; }); return s/g.length; };
function optExit(O) { if (O.exit) return O.exit;
  const B=O.B, P=O.P, W=B.weeks.length, key=g=>JSON.stringify(g), cur=key(P.g), grid=optExitGrid();
  if (!grid.some(v=>key(v.g)===cur)) grid.push({ f:'X', g:P.g, ix:[] });
  grid.forEach(v=>{ v.sim=O.simOf(Object.assign({}, P, { g:v.g })); v.cur=key(v.g)===cur; });
  grid.forEach(v=>{ v.nb=v.ix.length ? grid.filter(u=>u!==v && u.f===v.f && u.ix.reduce((s,x,i)=>s+Math.abs(x-v.ix[i]),0)===1) : []; v.sc=optXScore(v,W); v.n=OPT_WIN.map(w=>optNums(B,v.sim,w.k)); });
  const me=grid.find(v=>v.cur), fams=['T','B','L','P'].map(f=>grid.filter(v=>v.f===f).sort((a,b)=>b.sc-a.sc)[0]), top=fams.slice().sort((a,b)=>b.sc-a.sc)[0];
  // prova sul passato: ogni settimana (dalla metà dello storico) si sceglie l'uscita col punteggio migliore fino a quel momento e la
  // si usa la settimana dopo; si cambia solo se batte la tua di almeno 0,1 R a settimana (cambiare per poco è rumore)
  // (i punteggi fino a ogni settimana si calcolano una volta sola: servono alla prova di tutte le uscite e a quella di ogni tipo)
  const from=Math.max(8, Math.ceil(W/2)), H=Math.max(4, Math.round(W/4)), scAt=new Map(), scT=t=>{ let a=scAt.get(t); if (!a) { a=new Map(grid.map(v=>[v, optXScore(v,t)])); scAt.set(t,a); } return a; };
  const rollOf=cand=>{ if (W-from<4) return null; let R=0, Rb=0, up=0, dn=0, ch=0;
    for (let t=from;t<W;t++) { const sc=scT(t); let bv=me, bs=sc.get(me)+.1;
      cand.forEach(v=>{ const x=sc.get(v); if (x>bs) { bs=x; bv=v; } });
      const d=bv.sim.wR[t]-me.sim.wR[t]; R+=bv.sim.wR[t]; Rb+=me.sim.wR[t]; if (d>1e-9) up++; else if (d<-1e-9) dn++; if (bv!==me) ch++; }
    return { n:W-from, rw:R/(W-from), rb:Rb/(W-from), up, dn, ch }; };
  // controprova: l'uscita scelta senza le ultime H settimane, e come è andata proprio in quelle (che non ha visto)
  const hoOf=cand=>{ if (W-H<8) return null; const sc=scT(W-H); let hv=me, hs=sc.get(me)+.1; cand.forEach(v=>{ const x=sc.get(v); if (x>hs) { hs=x; hv=v; } });
    const sum=v=>{ let a=0; for (let i=W-H;i<W;i++) a+=v.sim.wR[i]; return a; }; return { H, v:hv, R:sum(hv), Rme:sum(me) }; };
  // si consiglia di cambiare solo se: l'uscita migliore batte la tua di almeno 0,1 R a settimana (col suo gruppo), la controprova
  // regge (scelta senza le ultime settimane, meglio della tua proprio lì) e nella prova sul passato scegliere così ha pagato
  const judge=(best, cand)=>{ const roll=rollOf(cand), ho=hoOf(cand), gain=best.sc-me.sc, wfOk=!!roll && roll.rw-roll.rb>=.1 && roll.up>roll.dn, hoOk=!!ho && ho.v!==me && ho.R>ho.Rme;
    return { best, roll, ho, gain, wfOk, hoOk, kind: best===me || gain<.1 ? 'same' : wfOk && hoOk ? 'go' : 'paper' }; };
  const J=judge(top, grid.filter(v=>v.f!=='X')), roll=J.roll, ho=J.ho, gain=J.gain, kind=J.kind;
  // lo stesso giudizio per ogni tipo di uscita (target fisso, stop spostato, trailing, parziali): le domande della routine
  const fam={}; ['T','B','L','P'].forEach((f,i)=>{ const cand=grid.filter(v=>v.f===f); fam[f]=Object.assign(judge(fams[i], cand), { top3:cand.slice().sort((a,b)=>b.sc-a.sc).slice(0,3) }); });
  // incertezza: trade la cui nota finisce prima dell'uscita (contati nel caso peggiore)
  const unc=v=>{ const b=optSim(B, Object.assign({}, P, { g:v.g }), true); let n=0; v.sim.rs.forEach((r,i)=>{ if (b.rs.get(i)!==r) n++; });
    return { n, rwB:b.wR.reduce((x,y)=>x+y,0)/W }; };
  me.u=unc(me); if (top!==me) top.u=unc(top);
  // cosa dicono le note, sui trade che passano le condizioni del piano (senza regole del giorno)
  const X=B.ts.filter(x=>optPass(P,x)), N=X.length;
  const tp=PLAN_MG.T.map(t=>({ t, e:N ? X.reduce((s,x)=>s+(x.mx>=t-1e-9?t:-1),0)/N : 0, p:N ? X.filter(x=>x.mx>=t-1e-9).length/N : 0 })), tBest=tp.slice().sort((a,b)=>b.e-a.e)[0];
  const Tref = P.g.k==='T' ? P.g.t : P.g.k==='L' ? (P.g.t||tBest.t) : P.g.t2;
  const be=[1,1.5,2].filter(a=>a<Tref).map(a=>{ let sv=0, kl=0, net=0; X.forEach(x=>{ const r0=optR(B,x,{ k:'T', t:Tref }), r1=optR(B,x,{ k:'T', t:Tref, be:a }); if (r1>r0+1e-9) sv++; else if (r1<r0-1e-9) kl++; net+=r1-r0; }); return { a, sv, kl, net }; });
  const pb=[1,2,3].map(L=>{ const dd=[]; X.forEach(x=>{ if (!x.pth) return; let top=0, m=0, on=false;
      for (const v of x.pth.p.slice(1)) { if (on && v>=L+1-1e-9) { dd.push(m); return; } if (v>top) top=v; if (top>=L-1e-9) { on=true; m=Math.max(m, top-v); } } });
    dd.sort((a,b)=>a-b); const q=k=>dd.length ? dd[Math.min(dd.length-1, Math.floor(k*dd.length))] : NaN; return { L, n:dd.length, med:q(.5), p8:q(.8), p9:q(.9) }; }).filter(x=>x.n>=8);
  return (O.exit={ grid, me, fams, fam, top, roll, ho, kind, gain, tp, tBest, Tref, be, pb, N }); }
// le uscite tra le modifiche di «Cosa provare» e del piano proposto: l'elenco fisso e corto di sempre. Prova del 14/11/2026: aggiungere
// qui stop in profitto e trailing faceva peggiorare la prova sul passato del piano per adesso (da +1,04 a +0,05 R a settimana contro
// +0,25 del piano fermo): più varianti = più occasioni di inseguire il caso. La ricerca completa sulle uscite sta nella carta «Uscita
// dal trade» (optExit), con le sue prove.
const OPT_GS = () => [...[1,1.5,2,2.5,3,4,5].map(t=>({ k:'T', t })), ...[2,3,4].flatMap(t=>[1,1.5,2].filter(b=>b<t).map(be=>({ k:'T', t, be }))),
  ...[1,0].flatMap(s=>PLAN_MG.P2.map(t2=>({ k:'P', t1:2, s, t2 })))];
function optMoves(B, P) {
  const out=[], cp=()=>JSON.parse(JSON.stringify(P)), add=(cat,l,f)=>{ const q=cp(); f(q); out.push({ cat, l, P:q }); };
  // gestione: tutte le varianti (stop a BE e parziali sono calcolati dal percorso scritto nelle note)
  OPT_GS().forEach(g=>{ if (JSON.stringify(g)!==JSON.stringify(P.g)) add('g', 'gestione: '+mgTxt(g), q=>{ q.g=g; }); });
  // mercati: ogni combinazione dei mercati che hanno trade nell'EOW (solo ES, ES e GC…)
  const mk=L.asset.filter(a=>B.ts.some(x=>mktOf(x.t.a)===a));
  for (let m=1; m<1<<mk.length; m++) { const a=mk.filter((_,i)=>m>>i&1); if (a.join()!==P.asset.filter(x=>mk.includes(x)).join()) add('asset', a.length>1?mkList(a):'solo '+a[0], q=>{ q.asset=a; }); }
  const tog=(cat,key,all,v,lbl)=>{ const on=P[key].includes(v); if (on && P[key].length<2) return; add(cat, (on?'togli ':'aggiungi ')+lbl, q=>{ q[key]=on ? q[key].filter(x=>x!==v) : all.filter(x=>q[key].includes(x)||x===v); }); };
  L.idea.forEach(i=>tog('idee','idee',L.idea,i,i)); bandNames().forEach(b=>tog('bande','bande',bandNames(),b,b)); L.days.forEach(d=>tog('giorni','giorni',L.days,d,d.toLowerCase()));
  const opt=(cat,key,vals,lbl)=>vals.forEach(v=>{ if (v!==P[key]) add(cat, lbl(v), q=>{ q[key]=v; }); });
  opt('ctx','news',['','nored','none'],v=>v?PL_NEWS[v]:'tutti i giorni di news'); opt('ctx','smt',['','nosf','fav'],v=>v?PL_SMT[v]:'SMT indifferente');
  opt('ctx','lvn',['','Si','No'],v=>v?PL_LVN[v]:'LVN indifferente'); opt('ctx','clean',['','si'],v=>v?'solo 1m pulito':'1m pulito indifferente');
  if (B.cc2) opt('ctx','cc2',['','si','no'],v=>v?PL_CC2[v]:'2° CC indifferente'); if (B.dir) opt('ctx','dir',['','Long','Short'],v=>v?'solo '+v:'Long e Short');
  ['','2','3','4'].forEach(k=>{ if (k!==pbKey(P.pb)) add('ctx', k?'fino a '+k+' candele di pullback':'tutte le candele di pullback', q=>{ q.pb=PLAN_PB[k]; }); });
  opt('day','maxN',[1,2,3,0],v=>v?'al massimo '+v+' trade al giorno':'nessun limite di trade al giorno'); opt('day','sw',[0,1],v=>v?'stop dopo il primo TP':'niente stop dopo il primo TP');
  opt('day','sll',[0,1,2],v=>v?'stop dopo '+(v===1?'la prima perdita':'2 perdite'):'niente stop dopo le perdite');
  opt('day','uno',[0,1],v=>v?'un trade alla volta':'anche più trade aperti insieme');
  opt('day','lossR',[1,2,3,0],v=>v?'perdita massima −'+v+' R al giorno':'nessun limite di perdita al giorno');
  return out; }
// ricerca a passi: dal piano, una modifica alla volta (la migliore tra quelle che passano il test), al massimo 4
function optGreedy(B, P0, to, ok, simOf, N) {
  ok=ok||['si']; const pass=typeof ok==='function' ? ok : c=>ok.includes(c.verdict), ord=c=>(c.verdict==='si'?1e3:0)+c.wm;
  simOf=simOf||(q=>optSim(B,q)); let P=P0, base=simOf(P); const steps=[];
  const pick=want=>{ let best=null;
    optMoves(B,P).forEach(m=>{ if (!want(m)) return; const v=simOf(m.P), c=optCmp(B,base,v,to,N); if (pass(c) && (!best || ord(c)>ord(best.c))) best={ m, v, c }; });
    if (best) { steps.push({ l:best.m.l, cat:best.m.cat, c:best.c }); P=best.m.P; base=best.v; } return !!best; };
  // Prima quali trade prendere (condizioni, mercati, setup, orari, giorni, regole del giorno: fino a 3 passi), poi l'uscita, scelta
  // sul piano già cambiato, poi un eventuale ultimo passo. Prima l'uscita poteva essere scelta per prima e restava quella anche
  // se i passi dopo cambiavano i trade: lo stesso piano con o senza «niente SMT a sfavore» dava due proposte diverse (caso
  // dell'utente, 15/11/2026: target 4R, oppure target 3R + niente SMT a sfavore + togli 14:30–15:30). Così le due partenze arrivano
  // allo stesso piano. Prova sul passato dei cinque piani, modo attivo: da +0,54 / +0,46 / +0,17 / +0,75 / −0,67 a +1,13 / +1,04 /
  // +0,79 / +1,33 / −0,67 R a settimana rispetto al piano fermo; modo prudente uguale o meglio (+0,13 / +0,04 / −0,17 / +0,42 / −0,25).
  // Scartati perché peggiorano la prova: probabilità ≥ 80% anche per «forte di recente», e l'uscita senza altri passi dopo.
  for (let k=0;k<3;k++) if (!pick(m=>m.cat!=='g')) break;
  pick(m=>m.cat==='g'); while (steps.length<4 && pick(m=>m.cat!=='g'));
  return { P, steps, sim:base }; }
// tutte le analisi della pagina, rifatte quando cambiano i dati dell'EOW o il piano
function optAll() {
  const B=optBase(); if (!B || B.weeks.length<6) return null;
  const P=PL(), key=JSON.stringify(P); if (S._opt && S._opt.B===B && S._opt.key===key) return S._opt;
  const t0=performance.now(), cache=new Map(), simOf=q=>{ const k=JSON.stringify(q); let s=cache.get(k); if (!s) { s=optSim(B,q); cache.set(k,s); } return s; };
  const base=simOf(P), W=B.weeks.length, nums=s=>OPT_WIN.map(w=>optNums(B,s,w.k));
  const moves=optMoves(B,P).map(m=>{ const v=simOf(m.P); return Object.assign(m, { v, c:optCmp(B,base,v), nums:nums(v) }); }).filter(m=>m.c.aff>0);   // senza effetto: non conta
  // gestione: tutte le varianti (anche quella del piano) con i loro numeri
  const gs=OPT_GS(); if (!gs.some(g=>JSON.stringify(g)===JSON.stringify(P.g))) gs.unshift(P.g);
  const mg=gs.map(g=>{ const q=Object.assign({}, P, { g }), v=simOf(q); return { g, cur:JSON.stringify(g)===JSON.stringify(P.g), nums:nums(v), c:optCmp(B,base,v) }; });
  // gruppi: ogni valore di una dimensione con gli altri filtri del piano e senza regole del giorno (quanto rende un trade di quel tipo)
  const groups=optGroups(B,P);
  // il piano proposto mette insieme solo i «conviene»: unire i «da provare», nella prova sul passato, peggiorava il piano
  // controprova: la stessa ricerca senza le ultime H settimane, poi controllata proprio su quelle (che non ha visto)
  const H=Math.max(4, Math.round(W/4)), greedy=optGreedy(B,P,undefined,['si'],simOf), wf = W>=12 ? optGreedy(B,P,W-H,['si'],simOf) : null;
  const wfRes = wf ? { H, steps:wf.steps, cut:B.weeks[W-H], plan:optNums(B,base,H), prop:optNums(B,simOf(wf.P),H) } : null;
  const roll=optRoll(B,P,base,simOf);
  // piano per il mercato di adesso: «conviene» più «forte di recente»; si propone se ha almeno una modifica recente e, nella prova
  // sul passato fatta con la stessa regola, seguirlo ha reso davvero di più del piano (almeno +0,1 R a settimana) e in più settimane
  // di quante ha fatto peggio: un pareggio non basta per cambiare piano. Con gli esiti rimescolati (9/11/2026, 40 giri) una singola
  // modifica «forte di recente» che toglie trade esce circa una volta per analisi (è rumore: 3 settimane sono poche), ma il piano
  // per adesso con meno trade viene proposto solo nel 5% dei casi: la prova sul passato è il filtro che conta.
  // Dal 15/11/2026 la routine prova due modi di scegliere le modifiche per la settimana dopo: «prudente» (conviene + forte di
  // recente) e «attivo» (anche i «da provare»). Sui dati veri del 14/11 (25 settimane, cinque piani di partenza, prova dalla
  // settimana 13) il modo attivo ha reso +0,88 / +0,79 / +0,50 / +1,08 / −0,67 R a settimana rispetto al piano fermo, il prudente
  // +0,13 / +0,04 / −0,17 / +0,25 / −0,25: nessuno dei due vince sempre, quindi si propone quello che, con il piano e i dati
  // dell'utente, ha reso di più nella prova sul passato, e solo se passa la soglia di sempre (≥ +0,1 e più settimane migliori).
  const pass=r=>!!r && r.rw-r.rb>=.1 && r.up>r.dn, mode=(ok,id)=>{ const g=optGreedy(B,P,undefined,ok,simOf), r=g.steps.some(x=>x.c.verdict!=='si') ? optRoll(B,P,base,simOf,ok) : null;
    return { g, r, id, ok:pass(r) }; };
  const mNow=mode(OPT_NOW,'now'), mAct=mode(OPT_ACT,'act');
  const mBest = [mNow, mAct].filter(m=>m.ok).sort((a,b)=>(b.r.rw-b.r.rb)-(a.r.rw-a.r.rb))[0] || null;
  const now = mBest && mBest.ok ? Object.assign(mBest.g, { nums:nums(mBest.g.sim), roll:mBest.r, mode:mBest.id }) : null;
  // la prova della routine da mostrare anche quando non propone niente (così si vede perché)
  const track = now ? now.roll : [mAct.r, mNow.r].filter(Boolean).sort((a,b)=>(b.rw-b.rb)-(a.rw-a.rb))[0] || null;
  const sugg=moves.filter(m=>m.c.verdict==='si').sort((a,b)=>b.c.wm-a.c.wm), hint=moves.filter(m=>m.c.verdict==='indizio').sort((a,b)=>b.c.p-a.c.p||b.c.wm-a.c.wm);
  // una sola proposta per categoria di gestione, asset e regole (sono alternative tra loro)
  const one=l=>{ const seen=new Set(); return l.filter(m=>{ const k=['g','asset','day'].includes(m.cat)?m.cat:m.l; if (seen.has(k)) return false; seen.add(k); return true; }); };
  const mkt=optMkt(B,P,base);
  // ultime 3 settimane (il mercato più recente): cosa avrebbe reso di più, con almeno 4 trade cambiati in quelle settimane
  const recentAll=one(moves.filter(m=>m.c.aff3>=4 && m.c.w3>=.5).sort((a,b)=>(b.c.verdict==='recente')-(a.c.verdict==='recente') || b.c.w3-a.c.w3));
  // da tenere d'occhio: cambiamenti netti nelle ultime settimane (p ≤ 5% e almeno 0,4 R a trade di differenza). Le cose fuori dal
  // piano che peggiorano non servono. Taratura: sui dati rimescolati ~0,4 falsi allarmi per analisi a 5%, ~0,2 a 2%; nella prova
  // sul passato i cambiamenti segnalati sono continuati nella stessa direzione nelle 4 settimane dopo (11 casi su 11).
  const drift=optDrift(B,P).filter(d=>d.p<=.05 && Math.abs(d.mr-d.mb)>=.4 && (d.on || d.mr>d.mb))
    .sort((a,b)=>(b.id==='piano')-(a.id==='piano') || a.p-b.p).slice(0,4);
  // il piano migliore si propone solo se è sicuro: trovato con i «conviene», trovato uguale anche senza le ultime settimane,
  // meglio del piano proprio in quelle settimane non viste, e il metodo non ha fatto peggio del piano nella prova sul passato
  // (le modifiche proposte devono essere tutte tra quelle trovate senza le ultime settimane, e il piano proposto deve fare meglio
  // del tuo proprio in quelle settimane)
  const blind = !!wf && greedy.steps.every(x=>wf.steps.some(y=>y.l===x.l)), held = wf ? optNums(B,greedy.sim,H).R : NaN;
  const why = !greedy.steps.length ? '' : !wf ? 'poche' : !blind ? 'recenti' : !(held>wfRes.plan.R) ? 'retto' : roll && roll.rw<roll.rb ? 'metodo' : '';
  const sure = !!greedy.steps.length && !why, best = sure ? greedy : null, doubt = why;
  if (wfRes) wfRes.held=held;
  // le ultime 3 settimane senza ripetere quello che è già proposto sopra (piano migliore e «da provare»)
  const shown=new Set([...(best?best.steps.map(x=>x.l):[]), ...(now?now.steps.map(x=>x.l):[]), ...one([...(sure?[]:sugg), ...hint].filter(m=>!(best && best.steps.some(x=>x.l===m.l)))).slice(0,3).map(m=>m.l)]);
  const recent=recentAll.filter(m=>!shown.has(m.l)).slice(0,3);
  const O={ B, key, P, base, simOf, nums:nums(base), mkt, moves, sugg:one(sugg).slice(0,6), hint:one([...(sure?[]:sugg), ...hint].filter(m=>!(best && best.steps.some(x=>x.l===m.l)))).slice(0,3), best, now, doubt, drift, recent, mg, groups, greedy, greedyNums:nums(greedy.sim), wf:wfRes, roll, track };
  // la proposta per la settimana dopo: le modifiche del piano per adesso (o del piano migliore) e, se nessuna tocca l'uscita, il
  // cambio di uscita che ha passato le sue due prove (optExit). Ogni passo sa da quanti weekend di fila è segnalato.
  const X=optExit(O), G=now||best, steps=G ? G.steps.slice() : [];
  if (X.kind==='go' && !steps.some(x=>x.cat==='g')) { const q=Object.assign({}, steps.length?G.P:P, { g:X.top.g }), b0=steps.length?G.sim:base;
    steps.push({ l:'uscita: '+mgTxt(X.top.g,true), cat:'g', g:X.top.g, x:true, c:optCmp(B,b0,simOf(q)) }); }
  const since=(v,b)=>{ let k=1; for (let to=W-1; to>=Math.max(8,W-8); to--) { if (!optFlag(optCmp(B,b||base,v,to,200))) break; k++; } return k; };
  steps.forEach(x=>{ if (x.x) return; const m=moves.find(m=>m.l===x.l); x.since = m ? since(m.v) : 1; });
  moves.forEach(m=>{ if (optFlag(m.c)) m.since=since(m.v); });
  O.prop = steps.length ? { steps, roll: G ? (now ? now.roll : null) : X.roll, mode: now ? now.mode : best ? 'best' : 'exit' } : null;
  O.ms=performance.now()-t0; return (S._opt=O); }
// prova del metodo sul passato: ogni settimana (dalla metà dello storico) rifà la ricerca con i soli dati di prima, come se
// usassi Ottimizza quel giorno, e tiene il piano proposto per la settimana dopo. Confronto con il piano fisso.
function optRoll(B, P, base, simOf, ok) {
  const W=B.weeks.length, from=Math.max(8, Math.ceil(W/2)); if (W-from<4) return null;
  let R=0, Rb=0, ch=0, up=0, dn=0; const log=[];
  for (let t=from; t<W; t++) { const g=optGreedy(B,P,t,ok||['si'],simOf,400), d=g.sim.wR[t]-base.wR[t];
    R+=g.sim.wR[t]; Rb+=base.wR[t]; if (g.steps.length) ch++; if (d>1e-9) up++; else if (d<-1e-9) dn++; log.push({ wk:B.weeks[t], steps:g.steps.map(x=>x.l), d, r:g.sim.wR[t] }); }
  const n=W-from; return { n, from:B.weeks[from], rw:R/n, rb:Rb/n, ch, up, dn, log }; }
// ── da tenere d'occhio: cambiamenti nel tempo. Per il piano e per ogni valore (setup, mercato, orario, condizione) i R a trade
// delle ultime settimane contro quelli di prima, con la gestione del piano. Test di permutazione sull'ordine dei trade: se
// rimescolando a caso l'ordine una differenza così grande esce di rado, il cambiamento è reale. Si guardano più finestre
// (4, 6, 8, 13 settimane) e il test tiene conto di averle guardate tutte (prende la più estrema anche nei rimescolamenti).
const OPT_DW = [4, 6, 8, 13];
function optDriftOne(B, xs, r, to, N, seed) {
  const n=xs.length; if (n<20) return null;
  const wk=xs.map(x=>B.wi[x.wk]), v=xs.map(r), tot=v.reduce((a,b)=>a+b,0);
  const wins=OPT_DW.map(k=>{ let c=0; for (let i=0;i<n;i++) if (wk[i]>=to-k) c++; return { k, c }; }).filter(w=>w.c>=8 && n-w.c>=12);
  if (!wins.length) return null;
  const stat=a=>{ let bz=0, bw=null; for (const w of wins) { let sr=0; for (let i=n-w.c;i<n;i++) sr+=a[i];   // le ultime c operazioni (in ordine di tempo)
      const mr=sr/w.c, mb=(tot-sr)/(n-w.c), z=(mr-mb)/Math.sqrt(1/w.c+1/(n-w.c)); if (!bw || Math.abs(z)>Math.abs(bz)) { bz=z; bw={ win:w.k, c:w.c, mr, mb }; } }
    return { z:bz, w:bw }; };
  const obs=stat(v), rng=optRng(seed), a=v.slice(); let ge=0;
  for (let k=0;k<N;k++) { for (let i=n-1;i>0;i--) { const j=Math.floor(rng()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } if (Math.abs(stat(a).z)>=Math.abs(obs.z)-1e-12) ge++; }
  return Object.assign({ p:(ge+1)/(N+1), z:obs.z, n }, obs.w); }
function optDrift(B, P, to, N) {
  to=to??B.weeks.length; N=N||600;
  const { dims, inPlan }=optDims(B,P), out=[], r=x=>optR(B,x,P.g), sel=xs=>xs.filter(x=>B.wi[x.wk]<to);
  const d0=optDriftOne(B, sel(B.ts.filter(x=>optPass(P,x))), r, to, N, 7); if (d0) out.push(Object.assign(d0, { id:'piano', dim:'', k:'Il tuo piano', on:true }));
  dims.forEach(([id,name,fn,keys,relax],j)=>{ if (id==='giorni' || id==='pb') return;
    const q=JSON.parse(JSON.stringify(P)); relax(q); const xs=sel(B.ts.filter(x=>optPass(q,x)));
    keys.forEach((k,i)=>{ const d=optDriftOne(B, xs.filter(x=>fn(x)===k), r, to, N, 101+j*13+i); if (d) out.push(Object.assign(d, { id, dim:name, k, on:inPlan[id](k) })); }); });
  return out; }
// quale mercato: ogni asset da solo con tutte le regole del piano, e un test sullo storico: ogni settimana si tradava il mercato
// che aveva fatto meglio nelle 4 settimane prima. Ha reso più del piano? Dice se conviene cambiare mercato per un periodo.
const OPT_LB = 4;
function optMkt(B, P, base) {
  const has=a=>B.ts.some(x=>mktOf(x.t.a)===a);   // solo i mercati con trade nell'EOW
  const W=B.weeks.length, as=[...P.asset.filter(a=>L.asset.includes(a)), ...L.asset.filter(a=>!P.asset.includes(a))].filter(has);   // a parità vince quello del piano
  if (as.length<2) return null;
  const sims={}; as.forEach(a=>{ sims[a]=optSim(B, Object.assign({}, P, { asset:[a] })); }); if (as.some(a=>!sims[a].seq.length)) return null;
  const nums=s=>OPT_WIN.map(w=>optNums(B,s,w.k)), pa=P.asset.filter(has), one=pa.length===1 ? pa[0] : null;
  const rows=as.map(a=>({ l:a, cur:a===one, nums:nums(sims[a]) })); if (!one) rows.push({ l:mkList(pa), cur:true, nums:nums(base) });
  const lastR=(s,to,n)=>{ let r=0; for (let i=Math.max(0,to-n);i<to;i++) r+=s.wR[i]; return r; };
  const pick=to=>as.reduce((b,a)=>lastR(sims[a],to,OPT_LB)>lastR(sims[b],to,OPT_LB)?a:b, as[0]);
  const lead=pick(W), d=[], picks=[];
  for (let w=OPT_LB; w<W; w++) { const a=pick(w); picks.push(a); d.push(sims[a].wR[w]-base.wR[w]); }
  const n=d.length, mean=n?d.reduce((x,y)=>x+y,0)/n:0, rng=optRng(4242); let pos=0;
  if (n) for (let k=0;k<1000;k++) { let t=0; for (let i=0;i<n;i++) t+=d[Math.floor(rng()*n)]; if (t>0) pos++; }
  const sw=n?picks.reduce((x,a,i)=>x+sims[a].wR[OPT_LB+i],0)/n:0, st=n?base.wR.slice(OPT_LB).reduce((x,y)=>x+y,0)/n:0;
  const T={ n, d:mean, p:pos/1000, sw, st, k:picks.filter(a=>a!==one).length, cnt:as.map(a=>[a, picks.filter(x=>x===a).length]), from:B.weeks[OPT_LB] };
  const kind = lead===one ? 'stay' : T.k && T.d>0 && T.p>=.85 ? 'go' : T.k && T.d>0 && T.p>=.6 ? 'mid' : 'stay';
  return { rows, lead, one, cur:mkList(pa), l4:{ lead:lastR(sims[lead],W,OPT_LB)/OPT_LB, cur:lastR(base,W,OPT_LB)/OPT_LB }, T, kind }; }
function optDims(B, P) {
  const dims=[['asset','Mercati',x=>mktOf(x.t.a),L.asset,q=>{ q.asset=L.asset.slice(); }],
    ['idee','Setup',x=>x.t.idea,L.idea,q=>{ q.idee=L.idea.slice(); }],
    ['bande','Fasce orarie',x=>x.band,bandNames(),q=>{ q.bande=bandNames(); }],
    ['giorni','Giorni',x=>x.t.day,L.days,q=>{ q.giorni=L.days.slice(); }],
    ['news','News',x=>x.t.news,L.news,q=>{ q.news=''; }],
    ['smt','SMT',x=>x.t.smt,L.smt,q=>{ q.smt=''; }],
    ['lvn','Coming from LVN',x=>x.t.lvn==='Si'?'Da LVN':x.t.lvn==='No'?'Non da LVN':'',['Da LVN','Non da LVN'],q=>{ q.lvn=''; }],
    ['clean','Struttura 1m',x=>x.t.clean?'1m pulito':'1m non pulito',['1m pulito','1m non pulito'],q=>{ q.clean=''; }],
    ['pb','Candele di pullback',x=>x.pb?x.pb+(x.pb==='1'?' candela':x.pb==='Altro'?'':' candele'):'',L.pb.map(v=>v+(v==='1'?' candela':v==='Altro'?'':' candele')),q=>{ q.pb=[]; }]];
  if (B.cc2) dims.splice(8,0,['cc2','2° CC',x=>x.t.cc2?'Con 2° CC':'Senza 2° CC',['Con 2° CC','Senza 2° CC'],q=>{ q.cc2=''; }]);
  if (B.dir) dims.splice(8,0,['dir','Direzione',x=>x.t.dir,L.dir,q=>{ q.dir=''; }]);
  const inPlan={ asset:v=>P.asset.includes(v), idee:v=>P.idee.includes(v), bande:v=>P.bande.includes(v), giorni:v=>P.giorni.includes(v),
    news:v=>!(P.news==='nored'&&v==='Red News') && !(P.news==='none'&&v!=='No News Day'), smt:v=>!(P.smt==='fav'&&v!=='SMT a favore') && !(P.smt==='nosf'&&v==='SMT a sfavore'),
    lvn:v=>!P.lvn || (P.lvn==='Si')===(v==='Da LVN'), clean:v=>!P.clean || v==='1m pulito', cc2:v=>!P.cc2 || (P.cc2==='si')===(v==='Con 2° CC'),
    dir:v=>!P.dir || v===P.dir, pb:v=>!P.pb.length || P.pb.includes(String(v).split(' ')[0]) };
  return { dims, inPlan }; }
function optGroups(B, P) {
  const W=B.weeks.length, all=Object.assign({}, P), { dims, inPlan }=optDims(B,P);
  return dims.map(([id,name,fn,keys,relax])=>{ const q=JSON.parse(JSON.stringify(all)); relax(q);
    const xs=B.ts.filter(x=>optPass(q,x)), rows=keys.map(k=>{ const g=xs.filter(x=>fn(x)===k); if (!g.length) return null;
      const r=x=>optR(B,x,P.g), win=n=>{ const from=W-(n==='all'?W:n), h=g.filter(x=>B.wi[x.wk]>=from); return { n:h.length, rt:h.length?h.reduce((s,x)=>s+r(x),0)/h.length:NaN }; };
      const months={}; g.forEach(x=>{ const m=x.day.slice(0,7); (months[m]=months[m]||[]).push(r(x)); }); const mv=Object.values(months).filter(a=>a.length>=3).map(a=>a.reduce((s,y)=>s+y,0));
      const w=[win('all'), win(13), win(3), win(1)], tr = w[1].n>=8 && w[0].n>=15 ? (w[1].rt-w[0].rt>.3 ? 1 : w[1].rt-w[0].rt<-.3 ? -1 : 0) : 0;
      return { k, on:inPlan[id](k), w, tr, mPos:mv.filter(x=>x>0).length, mTot:mv.length }; }).filter(Boolean);
    return { id, name, rows }; }).filter(g=>g.rows.length>1); }

// ── La routine del weekend (15/11/2026, richiesta dell'utente: «deve pensare come un trader profittevole che rivede ogni EOW per
// trovare ogni miglioramento per la settimana dopo»). Tre pezzi: la settimana appena chiusa, la checklist (una risposta per ogni
// area: target, stop a BE, trailing, parziali, orari, setup, giorni, mercati, condizioni, regole del giorno) e la proposta per la
// settimana dopo. Quanto pesa il breve periodo l'hanno deciso i dati veri (14/11, 25 settimane, 356 trade):
//  · l'ultima settimana da sola non prevede la successiva (lo scarto di un gruppo dalla sua media continua per lo 0–4%), le
//    ultime 2–3 settimane un po' (12–26%), oltre di nuovo poco: quindi una settimana si rivede ma non decide, tre settimane
//    possono proporre una modifica solo se lo storico non è contrario;
//  · togliere ogni settimana i gruppi (orari, setup, giorni…) in perdita nelle ultime 1–6 settimane avrebbe fatto perdere da 2 a
//    9 R a settimana: quasi tutti i gruppi sono positivi sul lungo periodo e una serie negativa corta è rumore;
//  · scegliere l'uscita con le sole ultime 1–4 settimane ha reso meno che tenerla ferma.
// Per questo lo stato di ogni area è: «Cambia» (modifica nella proposta, che ha passato la prova sul passato), «Tieni d'occhio»
// (segnalata ma non ancora provata, con il numero di weekend di fila da cui lo è) o «Confermato».
const OPT_ST = { change:['Cambia',''], watch:['Tieni d\'occhio','rk'], ok:['Confermato','rec'] };
const OPT_AREAS = [['tp','Target','target'], ['be','Stop a BE o in profitto','shield'], ['tr','Trailing stop','trendUp'], ['pz','Uscita a parziali','grid'],
  ['bande','Orari','clock'], ['idee','Setup','spark'], ['giorni','Giorni','cal'], ['asset','Mercati','chart'], ['ctx','Condizioni','filter'], ['day','Regole del giorno','list']];
const OPT_XA = { tp:'T', be:'B', tr:'L', pz:'P' }, OPT_GA = { bande:['bande'], idee:['idee'], giorni:['giorni'], asset:['asset'], ctx:['news','smt','lvn','clean','cc2','dir','pb'], day:[] };
const low1 = s => /^[A-Z]{2}/.test(s) ? String(s) : String(s).replace(/^./, c=>c.toLowerCase());
const optFamOf = g => g.k==='L' ? 'L' : g.k==='P' ? 'P' : g.be ? 'B' : 'T';
// quanto dura una fase, misurato sui dati: di quanto lo scarto recente di un gruppo dalla sua media storica (ultima settimana,
// ultime 3) si ritrova la settimana dopo. 1 = continua tutto, 0 = non dice nulla.
function optPersist(B, P) { const W=B.weeks.length, { dims }=optDims(B,P), NS=[1,3], acc=NS.map(()=>({ xy:0, xx:0, w:0, x:0, y:0 })), mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
  dims.forEach(([id,,fn,keys,relax])=>{ if (!['asset','idee','bande','giorni','news','smt','lvn'].includes(id)) return;
    const q=JSON.parse(JSON.stringify(P)); relax(q); const xs=B.ts.filter(x=>optPass(q,x));
    keys.forEach(k=>{ const a=xs.filter(x=>fn(x)===k).map(x=>[B.wi[x.wk], optR(B,x,P.g)]); if (a.length<15) return;
      for (let t=8;t<W;t++) { const h=a.filter(x=>x[0]<t).map(x=>x[1]), now=a.filter(x=>x[0]===t).map(x=>x[1]); if (h.length<10 || !now.length) continue; const m=mean(h);
        NS.forEach((n,j)=>{ const r=a.filter(x=>x[0]<t && x[0]>=t-n).map(x=>x[1]); if (r.length<3) return; const X=mean(r)-m, Y=mean(now)-m, w=now.length, A=acc[j]; A.xy+=w*X*Y; A.xx+=w*X*X; A.w+=w; A.x+=w*X; A.y+=w*Y; }); } }); });
  const sl=A=>{ if (A.w<100) return null; const mx=A.x/A.w, my=A.y/A.w, vx=A.xx/A.w-mx*mx; return vx>1e-9 ? Math.max(-1, Math.min(1, (A.xy/A.w-mx*my)/vx)) : null; };
  return { w1:sl(acc[0]), w3:sl(acc[1]) }; }
function optRoutine(O) { if (O.rt) return O.rt;
  const B=O.B, P=O.P, W=B.weeks.length, X=optExit(O), base=O.base, me=X.me, steps=O.prop ? O.prop.steps : [], inStep=m=>steps.some(x=>x.l===m.l);
  const fR=x=>fmtN(x,1,true), fT=x=>fmtN(x,2,true), low=low1, lng=g=>mgTxt(g), mvL=m=>m.cat==='asset' ? 'tradare '+m.l : low(optLbl(m));
  const wk3=v=>{ let a=0; for (let i=Math.max(0,W-3);i<W;i++) a+=v.sim.wR[i]; return a/Math.min(3,W); };
  // l'uscita nella proposta (dalla ricerca a passi o dalla carta delle uscite) e il suo tipo
  const exStep=steps.find(x=>x.cat==='g'), exG = exStep ? (exStep.g || OPT_GS().find(g=>'gestione: '+mgTxt(g)===exStep.l) || null) : null, exF = exG ? optFamOf(exG) : '', meF=optFamOf(P.g);
  const xArea=id=>{ const f=OPT_XA[id], J=X.fam[f], b=J.best, mine=meF===f, d3=wk3(b)-wk3(me), nm='«'+(f==='T' ? 'target '+fmtX(b.g.t)+'R' : low(mgTxt(b.g,true)))+'»', dl=fR(J.gain)+' R a settimana';
    const rows=(id==='tp' ? X.grid.filter(v=>v.f==='T') : J.top3.slice()); if (!rows.includes(me)) rows.unshift(me);
    const be=X.be, beLo=be.length ? Math.min(...be.map(x=>x.net)) : 0, beHi=be.length ? Math.max(...be.map(x=>x.net)) : 0;
    const beSay = !be.length || mine ? '' : beHi<0 ? 'Lo stop a BE semplice non conviene: con target '+fmtX(X.Tref)+'R costa da '+fmtN(-beHi,0)+' a '+fmtN(-beLo,0)+' R sullo storico. ' : 'Lo stop a BE semplice rende fino a '+fR(beHi)+' R sullo storico (target '+fmtX(X.Tref)+'R). ';
    let st='ok', say;
    // altopiano: i target fissi che rendono quasi come il migliore (entro 0,5 R a settimana). Se sono tanti, quale scegli conta poco
    const Ts=X.grid.filter(v=>v.f==='T'), tMax=Math.max(...Ts.map(v=>v.n[0].rw)), flat=Ts.filter(v=>v.n[0].rw>=tMax-.5), lo=Math.min(...flat.map(v=>v.n[0].rw));
    const flatSay = id==='tp' && flat.length>=3 ? ' I target da '+fmtX(flat[0].g.t)+'R a '+fmtX(flat[flat.length-1].g.t)+'R rendono quasi uguale ('+fmtN(lo,1)+'–'+fmtN(tMax,1)+' R a settimana): quale scegli tra questi conta poco, e la proposta può cambiare da un weekend all\'altro.' : '';
    if (exF===f) { st='change'; say='Per la prossima settimana: '+lng(exG)+'.'+(optFamOf(exG)==='T' ? flatSay : ''); }
    else if (J.kind==='go') { st='watch'; say=(id==='be'?beSay:'')+nm+' rende '+dl+' in più della tua uscita e regge alle prove'+(exG ? ', ma per la prossima settimana la proposta è '+lng(exG)+'.' : ': valuta di provarla.'); }
    else if (J.kind==='paper') { st = (J.wfOk || J.hoOk) && d3>0 ? 'watch' : 'ok';   // sotto osservazione solo se ha passato una delle due prove
      say=(id==='be'?beSay:'')+'Sulla carta '+nm+' rende '+dl+' in più, ma le prove sul passato non lo confermano'+(st==='watch'?' del tutto':'')+': non cambiare.'+(st==='watch' ? ' Ha passato una delle due prove e nelle ultime 3 settimane è davanti di '+fR(d3)+' R a settimana.' : ''); }
    else if (id==='tp') say = mine ? 'Target '+fmtX(P.g.t)+'R confermato: nessun altro target fisso rende almeno 0,1 R a settimana in più.' : 'Nessun target fisso batte la tua uscita: il migliore è '+fmtX(b.g.t)+'R, '+fR(b.n[0].rw)+' R a settimana contro '+fR(me.n[0].rw)+'.';
    else if (id==='be') say = mine ? 'Il tuo stop spostato è confermato: nessuna variante rende almeno 0,1 R a settimana in più.'
        : be.length && beHi<0 ? 'Non conviene: con target '+fmtX(X.Tref)+'R lo stop a BE costa da '+fmtN(-beHi,0)+' a '+fmtN(-beLo,0)+' R sullo storico, perché chiude a zero trade che poi arrivano al target.'
        : beSay+'Spostare lo stop non batte la tua uscita: la variante migliore ('+nm+') fa '+dl+'.';
    else if (id==='tr') { const q=X.pb.find(x=>x.L===2) || X.pb[0];
      say = mine ? 'Il tuo trailing è confermato: nessun altro rende almeno 0,1 R a settimana in più.'
        : 'Non conviene per ora: il trailing migliore ('+nm+') fa '+dl+' rispetto alla tua uscita.'+(q ? ' Dopo '+fmtX(q.L)+'R i trade tornano indietro di '+fmtN(q.med,1)+' R in metà dei casi.' : ''); }
    else say = mine ? 'Le tue parziali sono confermate: nessun\'altra combinazione rende almeno 0,1 R a settimana in più.' : 'Uscire a parziali non batte la tua uscita: la combinazione migliore ('+nm+') fa '+dl+'.';
    return { x:true, f, J, rows, st, say }; };
  const gArea=id=>{ const gs=OPT_GA[id].map(k=>O.groups.find(g=>g.id===k)).filter(Boolean), ms=O.moves.filter(m=>m.cat===id);
    const ch=steps.filter(x=>x.cat===id), fl=ms.filter(m=>optFlag(m.c) && !inStep(m)).sort((a,b)=>b.c.p-a.c.p);
    const dr=O.drift.filter(d=>(OPT_GA[id].includes(d.id)) && (d.on ? d.mr<d.mb : d.mr>d.mb));
    const inp=gs.flatMap(g=>g.rows).filter(r=>r.on && r.w[0].n>=8), neg=inp.filter(r=>r.w[0].rt<0 && r.w[0].n>=12).sort((a,b)=>a.w[0].rt-b.w[0].rt);
    const M=O.mkt; let st='ok', say;
    if (ch.length) { st='change'; say='Per la prossima settimana: '+ch.map(x=>mvL(x)).join(', ')+'.'; }
    else if (fl.length) { st='watch'; const m=fl[0]; say=optCap(mvL(m))+': '+low(OPT_V[m.c.verdict][1])+' ('+fR(m.c.all)+' R a settimana sullo storico, '+fR(m.c.w3)+' nelle ultime 3)'+(m.since>1 ? ', segnalata da '+m.since+' weekend di fila.' : ', novità di questo weekend.'); }
    else if (id==='asset' && M && M.kind==='go') { st='watch'; say=M.lead+' è il mercato più in forma nelle ultime 4 settimane ('+fR(M.l4.lead)+' R a settimana contro '+fR(M.l4.cur)+'), e in passato seguire il mercato più in forma ha pagato.'; }
    else if (dr.length) { st='watch'; const d=dr[0]; say=d.k+(d.on ? ' sta rendendo meno' : ', fuori dal piano, sta rendendo di più')+': da '+fT(d.mb)+' a '+fT(d.mr)+' R a trade nelle ultime '+d.win+' settimane. Se continua così, va '+(d.on?'tolto dal':'aggiunto al')+' piano.'; }
    else if (neg.length) { st='watch'; const r=neg[0]; say=r.k+' è in perdita sullo storico ('+fT(r.w[0].rt)+' R a trade su '+r.w[0].n+' trade), ma toglierlo non cambia ancora il risultato in modo affidabile.'; }
    else if (id==='day') say='Le regole del giorno del piano sono confermate: nessuna alternativa rende di più in modo affidabile.';
    else if (id==='ctx') say='Nessuna condizione da aggiungere o togliere: nessuna cambia il risultato in modo affidabile.';
    else { const s=inp.slice().sort((a,b)=>b.w[0].rt-a.w[0].rt), weak=inp.filter(r=>r.w[2].n>=4 && r.w[2].rt<-.2 && r.w[0].rt>0).sort((a,b)=>a.w[2].rt-b.w[2].rt)[0];
      say = s.length>1 ? 'Confermati. Il migliore: '+s[0].k+' ('+fT(s[0].w[0].rt)+' R a trade), il più debole: '+s[s.length-1].k+' ('+fT(s[s.length-1].w[0].rt)+').' : 'Niente da cambiare.';
      if (weak) say+=' Nelle ultime 3 settimane '+weak.k+' ha perso ('+fT(weak.w[2].rt)+' R a trade su '+weak.w[2].n+' trade): troppo poco per toglierlo, sullo storico fa '+fT(weak.w[0].rt)+'.'; }
    return { gs, ms, ch, fl, dr, st, say }; };
  const areas=OPT_AREAS.map(([id,name,icon])=>Object.assign({ id, name, icon }, OPT_XA[id] ? xArea(id) : gArea(id)));
  // la settimana appena chiusa, col piano
  const lw=W-1, wRs=Array.from(base.wR), days=[0,0,0,0,0]; let took=0, out=0, outR=0;
  B.ts.forEach((x,i)=>{ if (B.wi[x.wk]!==lw) return; const r=base.rs.get(i);
    if (r!==undefined) { const d=x.t.d.getDay()-1; if (d>=0 && d<5) days[d]+=r; took++; } else if (P.asset.includes(mktOf(x.t.a))) { out++; outR+=optR(B,x,P.g); } });
  let streak=0; const s0=Math.sign(wRs[lw]); if (s0) for (let i=lw;i>=0 && Math.sign(wRs[i])===s0;i--) streak++;
  // la lezione della settimana: la modifica che avrebbe reso di più proprio questa settimana, e come era andata nelle 4 prima
  const lm=O.moves.filter(m=>m.c.w1>=1).sort((a,b)=>b.c.w1-a.c.w1)[0]; let lesson=null;
  if (lm) { let up=0, dn=0; for (let i=Math.max(0,lw-4);i<lw;i++) { const d=lm.v.wR[i]-base.wR[i]; if (d>1e-9) up++; else if (d<-1e-9) dn++; }
    lesson={ m:lm, up, dn, kind: inStep(lm) ? 'prop' : optFlag(lm.c) ? 'watch' : lm.c.all<=0 ? 'caso' : 'poco' }; }
  const last={ wk:B.weeks[lw], n:optNums(B,base,1), rank:W>1 ? wRs.filter(x=>x<wRs[lw]-1e-9).length/(W-1) : .5, days, took, out, outR, streak:streak*s0, lesson, drift:O.drift.find(d=>d.id==='piano') || null };
  return (O.rt={ areas, last, next:iso(addDays(pdIso(B.weeks[lw]),7)), pers:optPersist(B,P), nC:areas.filter(a=>a.st==='change').length, nW:areas.filter(a=>a.st==='watch').length }); }

// ── pagina ──
const OPT_V = { si:['check','Conviene','ok'], indizio:['spark','Da provare','try'], recente:['trendUp','Forte di recente','up'], calo:['trendDn','Funzionava, ora meno','down'] };
const fRw = x => isFinite(x) ? fmtN(x,1,true) : '–';
const fRt = x => isFinite(x) ? fmtN(x,2,true) : '–';
const optCap = s => String(s).replace(/^./, c=>c.toUpperCase());
const optLbl = m => optCap(m.cat==='g' ? m.l.replace(/^gestione: /,'') : m.l);
function optDates(B) { const a=B.ts[0].t.d, b=B.ts[B.ts.length-1].t.d; return a.getDate()+' '+MESI[a.getMonth()]+' – '+b.getDate()+' '+MESI[b.getMonth()]+' '+b.getFullYear(); }
function renderOpt() {
  const el=$('v-opt'), E=rowsOf('EOW');
  const head=eb=>'<div class="stat-h rise"><div><div class="eyebrow">'+eb+'</div><h1>'+words('Ottimizza')+'</h1></div></div>';
  if (!E) { const h=head('EOW · la routine del weekend'); el.innerHTML=h+skeleton();
    if (!S.optLoad) { S.optLoad=true; fetchFile('EOW').then(()=>{ S.optLoad=false; if (S.tab==='opt') renderCurrent(); }).catch(()=>{ S.optLoad=false; if (S.tab==='opt') el.innerHTML=h+emptyState('EOW non raggiungibile', 'Non riesco a leggere il foglio: riprova tra poco.'); }); }
    return; }
  const O=optAll();
  if (!O) { enter(el, head('EOW · la routine del weekend')+emptyState('Servono più settimane', 'Per rivedere il piano settimana per settimana servono almeno 6 settimane di trade nell\'EOW.')); return; }
  const h=head('EOW · '+O.B.ts.length+' trade · '+optDates(O.B).replace(/ \d{4}$/,''))+optHero(O)+optWeekCard(O)+optCheckCard(O)+optTrackCard(O)+optAiCard()+optHowCard(O);
  enter(el, h, ()=>{ const c=$('c-opt'); if (c) optChart(c, O); });
  countUp(el.querySelector('.op-hero'), 250); countUp(el.querySelector('.op-wk'), 350);
  const dt=el.querySelector('.op-det'); if (dt) dt.addEventListener('toggle', ()=>{ S.optDet=dt.open; });
  // la checklist ricorda quali aree sono aperte
  el.querySelectorAll('.op-ar').forEach(d=>d.addEventListener('toggle', ()=>{ S.optOpen=(S.optOpen||[]).filter(x=>x!==d.dataset.ar); if (d.open) S.optOpen.push(d.dataset.ar); }));
}
function optCurve(O, sim) { const B=O.B, s=sim||O.base, pts=[{ y:0, x:'', tip:' · inizio' }], ref=sim?[0]:null; let eq=0, eb=0;
  B.weeks.forEach((w,i)=>{ eq+=s.wR[i]; eb+=O.base.wR[i]; if (ref) ref.push(eb); const d=pdIso(w);
    pts.push({ y:eq, x:d.getDate()+' '+MESI[d.getMonth()], tip:' · settimana del '+d.getDate()+' '+MESI[d.getMonth()]+' · '+fmtN(s.wR[i],1,true)+' R in '+s.wN[i]+' trade'+(sim?' · il tuo piano '+fmtN(eb,1,true)+' R':'') }); });
  return { pts, ref }; }
// il grafico della testata: con una proposta, il piano con le modifiche scelte (linea piena) e il tuo piano (tratteggiato)
function optChart(c, O) { const K=optPick(O), cv=optCurve(O, K && K.on.length ? K.sim : null);
  lineChart(c, cv.pts, { h:150, ref:cv.ref, fmt:v=>fmtN(v,1,true)+' R', aria:'R cumulati del piano settimana per settimana' }); }
// le modifiche proposte che l'utente tiene (S.optOff = quelle tolte, per etichetta): si rifanno in ordine sul suo piano,
// ognuna cercata per etichetta tra le mosse possibili a quel punto (così «togli 14:30–15:30» vale anche senza i passi prima)
function optPick(O) { const G=O.prop; if (!G) return null;
  if (S.optOffKey!==O.key) { S.optOffKey=O.key; S.optOff=[]; }
  const off=S.optOff||[], on=[]; let P=O.P;
  G.steps.forEach((x,i)=>{ if (off.includes(x.l)) return; if (x.g) { P=Object.assign(JSON.parse(JSON.stringify(P)), { g:x.g }); on.push(i); return; }
    const m=optMoves(O.B,P).find(m=>m.l===x.l); if (m) { P=m.P; on.push(i); } });
  const sim=O.simOf(P); return { P, on, all:on.length===G.steps.length, sim, nums:OPT_WIN.map(w=>optNums(O.B,sim,w.k)) }; }
// confronto tuo piano / piano con le modifiche scelte: R a settimana per periodo e rischio, con la differenza
function optCmpHtml(n, k, cnt) {
  const row=(l,a,b,f,df,good)=>{ const d=b-a, eq=Math.abs(d)<1e-9 || df(d)===df(0), c=eq||good===0?'':(good*d>0?'pos':'neg');
    return '<div class="op-cr"><span>'+l+'</span><b class="num">'+f(a)+'</b><b class="num">'+f(b)+'</b><em class="'+c+'">'+(eq?'=':df(d))+'</em></div>'; };
  const rw=x=>fmtN(x,1,true), dR=x=>fmtN(x,1,true), a=n[0], b=k[0];
  return '<div class="op-duel"><div><span>Il tuo piano</span><b class="num '+sgn(a.rw)+'">'+numEl(a.rw,1,true)+'</b><em>R a settimana</em></div>'+
      '<span class="op-vs">'+ic('chev',18,2.6)+'</span>'+
      '<div class="on"><span>Con '+(cnt===1?'la modifica':'le '+cnt+' modifiche')+'</span><b class="num '+sgn(b.rw)+'">'+numEl(b.rw,1,true)+'</b><em>R a settimana</em></div>'+
      '<div class="op-dd '+(Math.abs(b.rw-a.rw)<.05?'':b.rw-a.rw>0?'pos':'neg')+'"><b class="num">'+numEl(b.rw-a.rw,1,true)+'</b><em>R a settimana</em></div></div>'+
    '<div class="op-cmp"><div class="op-cr op-chd"><span></span><span>Tuo piano</span><span>Modificato</span><span><i class="lg">Differenza</i><i class="sm">Diff.</i></span></div>'+
      '<div class="op-cg">R a settimana</div>'+OPT_WIN.map((w,i)=>row({ 'Tutto':'Tutto lo storico', '3 mesi':'Ultimi 3 mesi' }[w.l] || 'Ultime '+w.l,n[i].rw,k[i].rw,rw,dR,1)).join('')+
      '<div class="op-cg">Su tutto lo storico</div>'+
      row('R totali',a.R,b.R,x=>fmtN(x,0,true),x=>fmtN(x,0,true),1)+
      row('Calo massimo',a.dd,b.dd,x=>fmtN(x,1)+' R',x=>fmtN(x,1,true),1)+
      row('Trade a settimana',a.n/a.wk,b.n/b.wk,x=>fmtN(x,1),x=>fmtN(x,1,true),0)+
      row('R a trade',a.rt,b.rt,x=>fmtN(x,2,true),x=>fmtN(x,2,true),1)+
      row('Vinti',a.wr,b.wr,pct,x=>fmtN(x*100,0,true)+' pt',0)+'</div>'; }
// tabella: righe × finestre (Tutto, 3 mesi, 4 sett., 3 sett.), la migliore di ogni colonna sottolineata; r.grp apre un gruppo di righe
function optTable(rows, key, fmt, o={}) {
  const cols=o.cols||OPT_WIN.map((_,i)=>i), best=cols.map(j=>Math.max(...rows.map(r=>r.nums[j][key]).filter(isFinite)));
  let t='<div class="tbl-wrap"><table class="ex-t op-t"><tr><th>'+(o.head||'')+'</th>'+cols.map(j=>'<th>'+OPT_WIN[j].l+'</th>').join('')+'</tr>', g=null;
  rows.forEach(r=>{ if (r.grp && r.grp!==g) { g=r.grp; t+='<tr class="op-gh"><td colspan="'+(cols.length+1)+'">'+esc(g)+'</td></tr>'; }
    t+='<tr class="'+(r.cur?'cur':'')+'"><td>'+esc(r.l)+(r.cur&&!o.noTag?' <em class="tag">piano</em>':'')+'</td>'+cols.map((j,i)=>{ const v=r.nums[j][key];
    return '<td class="num '+sgn(v)+(isFinite(v)&&v===best[i]&&rows.length>2?' best':'')+'">'+fmt(v)+'</td>'; }).join('')+'</tr>'; });
  return t+'</table></div>'; }
// ───── La pagina è la routine del weekend: la proposta per la settimana dopo (testata), la settimana chiusa, la checklist
// (una risposta per area), la prova della routine sul passato.
const optWkLbl = w => { const d=pdIso(w); return d.getDate()+' '+MESI[d.getMonth()]; };
// testata: cosa cambiare per la settimana dopo (modifiche da accendere o spegnere, con il confronto), oppure piano confermato
function optHero(O, still) { const n=O.nums, G=O.prop, w=O.wf, K=G ? optPick(O) : null, gn=K ? K.nums : null, R=optRoutine(O), nx=optWkLbl(R.next);
  const why={ poche:'Qualcosa sembra migliore, ma le settimane sono ancora poche per confermarlo.', recenti:'Qualcosa sembra migliore, ma solo grazie alle ultime settimane.',
    retto:'Qualcosa sembrava migliore, ma non ha retto sulle settimane più recenti.', metodo:'Qualcosa sembra migliore, ma in passato seguire questi consigli non ha pagato.' }[O.doubt] || 'Ho rivisto '+O.moves.length+' alternative e oltre 200 uscite: nessuna ha passato le prove.';
  const tagOf=x=>x.x ? ['uscita','s'] : x.c.verdict==='si' ? ['storico','s'] : x.c.verdict==='indizio' ? ['da provare','r'] : ['recente','r'];
  // il numero grande è quello onesto: quanto ha reso in più seguire questa ricerca settimana per settimana con i soli dati di prima
  const rl = G ? G.roll : null, d = !G ? 0 : rl ? rl.rw-rl.rb : gn[0].rw-n[0].rw;
  const cnt=(k,one,many)=>{ const c=G.steps.filter(x=>tagOf(x)[0]===k).length; return c ? [c+' '+(c===1?one:many)] : []; };
  const sub = !G ? esc(why)+(R.nW ? ' '+(R.nW===1?'Una cosa':R.nW+' cose')+' da tenere d\'occhio nella checklist.' : '')
    : [...cnt('storico','confermata dallo storico','confermate dallo storico'), ...cnt('recente','forte nelle ultime settimane','forti nelle ultime settimane'), ...cnt('da provare','da provare','da provare'), ...cnt('uscita','cambio di uscita','cambi di uscita')].join(', ')+'.';
  // fase negativa: niente da proporre, ultime 4 settimane in perdita e calo dal massimo già oltre metà del peggiore di sempre.
  // In una fase così si abbassa il rischio per trade, non si cambiano le regole (cambiarle in drawdown è inseguire il rumore).
  const cold = !G && n[2].rw<0 && n[0].dd<0 && n[0].cur<=.5*n[0].dd;
  const a0=n[0], rk=(l,x,f)=>'<span><em>'+l+'</em><b class="num">'+f(x)+'</b></span>';
  const risk='<div class="op-risk">'+rk('Drawdown',a0.dd,x=>fmtN(x,1)+' R')+rk('Trade a sett.',a0.n/a0.wk,x=>fmtN(x,1))+rk('R a trade',a0.rt,x=>fmtN(x,2,true))+rk('Vinti',a0.wr,pct)+'</div>';
  let h='<div class="card wide op-hero'+(still?' still':' rise')+(G?' go':cold?' cold':'')+'"><div class="op-glow"></div>'+
    '<div class="op-hh"><div class="eyebrow">Routine del weekend · chiusa la settimana del '+optWkLbl(R.last.wk)+'</div><button type="button" class="op-edit" data-act="planedit">'+ic('gear',15,2.2)+'Modifica</button></div>'+
    '<div class="op-pt">'+esc(optPlanLine(O.P))+'</div>'+
    '<div class="op-vb"><span class="op-vi">'+ic(G?'trendUp':cold?'shield':'check',22,2.4)+'</span><div class="op-vt"><b>'+(G ? 'Per la settimana del '+nx+': '+(G.steps.length===1?'una modifica':G.steps.length+' modifiche') : cold ? 'Resta sul piano, riduci il rischio' : 'Piano confermato per la settimana del '+nx)+'</b><span>'+
      (cold ? 'Sei a '+fmtN(n[0].cur,1)+' R dal massimo (il calo peggiore finora: '+fmtN(n[0].dd,1)+' R) e nessuna alternativa è più affidabile del tuo piano. In una fase così si abbassa il rischio per trade, non si cambiano le regole.' : sub)+'</span></div>'+
      (G ? '<div class="op-up'+(K.all?'':' dim')+'"><b class="'+sgn(d)+'">'+numEl(d,1,true)+'</b><span>R a settimana'+(rl?' nella prova sul passato':' sullo storico')+(K.all?'':' · con tutte le modifiche')+'</span></div>' : '')+'</div>';
  if (G) {   // scegli le modifiche (tocca per togliere o rimettere) e guarda subito il confronto con il tuo piano
    const k=K.on.length, ex=G.steps.some(x=>x.x);
    h+='<div class="op-pk"><div class="op-pkh"><b>Le modifiche proposte</b><span>Tocca per togliere o rimettere: i numeri sotto cambiano</span></div><div class="op-picks">'+
      G.steps.map((x,i)=>{ const on=K.on.includes(i), t=tagOf(x); return '<button type="button" class="op-pick'+(on?' on':'')+'" data-act="optstep" data-i="'+i+'" aria-pressed="'+on+'" style="--k:'+i+'"'+(x.since>1?' title="Segnalata da '+x.since+' weekend di fila"':'')+'><i>'+(on?ic('check',13,3):'')+'</i>'+esc(optLbl(x))+
        '<em class="'+t[1]+'">'+t[0]+'</em></button>'; }).join('')+'</div></div>'+
      (k ? optCmpHtml(n, gn, k) : '<p class="op-none">Nessuna modifica scelta: resta il tuo piano.</p>')+
      '<div class="chart" id="c-opt"></div>'+(k?'<div class="op-lgd"><span><i></i>Con le modifiche</span><span><i class="r"></i>Il tuo piano</span></div>':'')+
      '<button type="button" class="btn op-best" data-act="optall"'+(k?'':' disabled')+'>'+ic('check',18,2.2)+(K.all?'Usa questo piano la prossima settimana':k?'Usa '+(k===1?'questa modifica':'queste '+k+' modifiche'):'Scegli almeno una modifica')+'</button>'+
      '<p class="op-leg">'+(G.mode==='exit' ? 'Il cambio di uscita ha passato le sue due prove: le trovi nella checklist, sotto il tipo di uscita. '
        : rl ? 'Prova sul passato: rifacendo questa routine ogni weekend con i soli dati di prima (ultime '+rl.n+' settimane), seguirla ha reso '+fRw(rl.rw)+' R a settimana contro '+fRw(rl.rb)+' del tuo piano'+(rl.up+rl.dn ? ' (meglio in '+rl.up+' settiman'+(rl.up===1?'a':'e')+', peggio in '+rl.dn+')' : '')+'. '+(ex?'Il cambio di uscita ha passato a parte le sue due prove (nella checklist). ':'')
        : 'Nelle '+w.H+' settimane non usate per trovarle, le modifiche hanno fatto '+fmtN(w.held,1,true)+' R contro '+fmtN(w.plan.R,1,true)+' R del tuo piano. ')+
        'Il confronto sopra è un conto fatto a posteriori sui trade passati: vale meno della prova. Rifai la routine ogni weekend.</p>';
    if (S._planPrev) h+='<button type="button" class="link" data-act="planundo">'+ic('refresh',15,2)+'Annulla l\'ultima modifica al piano</button>';
    return h+'</div>'; }
  h+='<div class="op-k">'+OPT_WIN.map((x,i)=>'<div style="--k:'+i+'"><span>'+x.l+'</span><b class="num '+sgn(n[i].rw)+'">'+numEl(n[i].rw,1,true)+'</b>'+
      '<em>'+n[i].n+' trade</em></div>').join('')+'</div>'+
    '<div class="chart" id="c-opt"></div>'+risk;
  if (S._planPrev) h+='<button type="button" class="link" data-act="planundo">'+ic('refresh',15,2)+'Annulla l\'ultima modifica al piano</button>';
  return h+'</div>'; }
// il piano in una riga
function optPlanLine(P) { const w=planWhen(P);
  return [mkList(P.asset), P.idee.length===L.idea.length ? 'tutte le idee' : P.idee.length<=2 ? P.idee.join(', ') : P.idee.length+' idee su '+L.idea.length,
    ...planCond(P), ...(w.indexOf('tutte')===0 ? [] : [w]), mgTxt(P.g,true), dayRuleTxt(P,true)].join(' · '); }
// affidabilità a pallini (1–5) dalla probabilità che il miglioramento sia vero
const optDots = p => { const k=Math.max(1, Math.min(5, Math.round((p-.5)*10))); return '<span class="op-dots" title="Affidabilità: probabilità '+pct(p)+'">'+[1,2,3,4,5].map(i=>'<i class="'+(i<=k?'on':'')+'"></i>').join('')+'</span>'; };
// la settimana appena chiusa col piano: quanto, com'è rispetto alle altre, giorno per giorno, e cosa insegna
function optWeekCard(O) { const R=optRoutine(O), w=R.last, a=w.n, d0=pdIso(w.wk), d1=addDays(d0,4), wd=['Lun','Mar','Mer','Gio','Ven'], fR=x=>fmtN(x,1,true);
  const pos=Math.max(0,...w.days), neg=Math.max(0,...w.days.map(x=>-x)), tot=pos+neg || 1, z=neg/tot*100, k=100/tot;
  const tag = !a.n ? ['','Nessun trade'] : w.rank>=.8 ? ['rec','Tra le migliori'] : w.rank<=.2 ? ['rk','Tra le peggiori'] : ['','Nella norma'];
  const li=[];
  if (w.out) li.push(['filter','Le regole del piano hanno lasciato fuori <b>'+w.out+' trade su '+(w.took+w.out)+'</b>: con la tua uscita avrebbero fatto <b class="'+sgn(w.outR)+'">'+fR(w.outR)+' R</b>'+(w.outR<-1e-9?', quindi questa settimana ti hanno protetto.':w.outR>1e-9?', quindi questa settimana ti sono costate.':'.')]);
  const ls=w.lesson;
  if (ls) li.push(['spark','Con «'+esc(low1(optLbl(ls.m)))+'» questa settimana avresti fatto <b class="pos">'+fR(ls.m.c.w1)+' R</b> in più. '+(
    ls.kind==='prop' ? 'È già tra le modifiche proposte qui sopra.' : ls.kind==='watch' ? 'È tra le cose da tenere d\'occhio nella checklist.'
    : ls.kind==='caso' ? 'Sullo storico però rende meno del tuo piano ('+fR(ls.m.c.all)+' R a settimana): è il caso di una settimana, non una regola.'
    : 'Nelle 4 settimane prima ha fatto meglio in '+ls.up+' e peggio in '+ls.dn+': una settimana sola non basta per cambiare.')]);
  if (Math.abs(w.streak)>=2) li.push([w.streak>0?'trendUp':'trendDn', '<b>'+Math.abs(w.streak)+'ª settimana '+(w.streak>0?'positiva':'negativa')+' di fila.</b> '+(w.streak>0 ? 'Non alzare il rischio per questo: una serie positiva non dice nulla sulla prossima.' : 'Non cambiare le regole per questo: da sola una serie negativa non dice nulla sulla prossima.')]);
  const c=O.nums[0]; li.push(['shield', c.cur<-.5 ? 'Sei a <b>'+fmtN(c.cur,1)+' R</b> dal massimo (il calo peggiore finora: '+fmtN(c.dd,1)+' R).' : 'Sei sui massimi del piano.']);
  if (w.drift) { const d=w.drift, up=d.mr>d.mb; li.push([up?'trendUp':'alert', 'Il piano sta rendendo <b>'+(up?'di più':'di meno')+'</b> di prima: da '+fmtN(d.mb,2,true)+' a '+fmtN(d.mr,2,true)+' R a trade nelle ultime '+d.win+' settimane.'+(up?'':' Controlla la disciplina nel Journal.')]); }
  return '<div class="card wide rise op-wk"><div class="card-h"><h2 class="h2">La settimana chiusa</h2><span class="sub">'+d0.getDate()+(d0.getMonth()!==d1.getMonth()?' '+MESI[d0.getMonth()]:'')+' – '+d1.getDate()+' '+MESI[d1.getMonth()]+' · col tuo piano</span></div>'+
    '<div class="op-wt"><div class="op-wn"><b class="num '+sgn(a.R)+'">'+numEl(a.R,1,true)+'<small>R</small></b><span class="op-chip '+tag[0]+'">'+tag[1]+'</span>'+
      '<em>'+a.n+' trade'+(a.n?' · '+pct(a.wr)+' vinti':'')+' · la tua media: '+fR(c.rw)+' R a settimana</em></div>'+
      '<div class="rc-days op-wd" style="--z:'+z+'%">'+wd.map((l,i)=>'<div style="--k:'+i+'"><div class="rc-col">'+(w.days[i]?'<i class="'+sgn(w.days[i])+'" style="--h:'+Math.abs(w.days[i])*k+'%"></i>':'')+'</div><b class="'+sgn(w.days[i])+'">'+(w.days[i]?fR(w.days[i]):'–')+'</b><span>'+l+'</span></div>').join('')+'</div></div>'+
    '<ul class="op-wl">'+li.map((x,i)=>'<li style="--k:'+i+'">'+ic(x[0],16,2.2)+'<span>'+x[1]+'</span></li>').join('')+'</ul></div>'; }
// la checklist: una riga per area con lo stato e la risposta; si apre per vedere i numeri
function optCheckCard(O) { const R=optRoutine(O), nOk=R.areas.length-R.nC-R.nW, sec={ tp:'Come esci dal trade', bande:'Quando e cosa tradi', day:'Durante la giornata' }, open=S.optOpen||[];
  let h='<div class="card wide rise op-ck"><div class="card-h"><h2 class="h2">La checklist del weekend</h2><span class="sub">'+[R.nC?R.nC+' da cambiare':'', R.nW?R.nW+' da tenere d\'occhio':'', nOk+' confermat'+(nOk===1?'o':'i')].filter(Boolean).join(' · ')+'</span></div>';
  R.areas.forEach((a,i)=>{ const st=OPT_ST[a.st]; if (sec[a.id]) h+='<div class="op-cs">'+sec[a.id]+'</div>';
    h+='<details class="op-ar '+a.st+'" data-ar="'+a.id+'" style="--k:'+i+'"'+(open.includes(a.id)?' open':'')+'><summary><span class="op-ari">'+ic(a.icon,17,2.2)+'</span><div class="op-art"><b>'+a.name+'<span class="op-chip '+st[1]+'">'+st[0]+'</span></b><small>'+esc(a.say)+'</small></div>'+ic('chev',15,2.4)+'</summary>'+
      '<div class="op-arb">'+(a.x ? optXBody(O,a) : optGBody(O,a))+'</div></details>'; });
  return h+'<p class="op-leg">«Cambia»: è nella proposta in alto. «Tieni d\'occhio»: i numeri la segnalano ma non ha ancora passato le prove; se resta segnalata per più weekend di fila lo vedi scritto. Tocca una riga per i numeri: Tutto, 3 mesi, ultime 3 settimane e ultima settimana.</p></div>'; }
// dentro un'area di uscita: le uscite di quel tipo contro la tua (R a settimana) e cosa dicono le note
function optXBody(O, a) { const X=optExit(O), W=O.B.weeks.length, J=a.J, me=X.me, fR=x=>fmtN(x,1,true), cap=g=>optCap(mgTxt(g,true)), td=(v,c)=>'<td class="num '+(c||'')+' '+sgn(v)+'">'+fR(v)+'</td>';
  let h='<div class="tbl-wrap"><table class="ex-t op-t"><tr><th>R a settimana</th><th>Tutto</th><th class="op-c3">3 mesi</th><th>3 sett.</th><th>Ultima</th><th></th></tr>'+
    a.rows.map(v=>'<tr class="'+(v===me?'cur':'')+'"><td>'+esc(cap(v.g))+(v===me?' <em class="tag">la tua</em>':v===J.best?' <em class="tag">migliore</em>':'')+'</td>'+td(v.n[0].rw)+td(v.n[1].rw,'op-c3')+td(v.n[3].rw)+td(v.sim.wR[W-1])+
      '<td class="op-tb">'+(v===me?'':'<button type="button" class="chip op-xb" data-act="optexit" data-gi="'+X.grid.indexOf(v)+'">Usa</button>')+'</td></tr>').join('')+'</table></div>';
  if (a.id==='tp') { const tm=Math.max(.01, ...X.tp.map(x=>Math.abs(x.e)));
    h+='<div class="op-xc"><b>R a trade per target <small>sui '+X.N+' trade che rispettano le condizioni del piano</small></b><div class="op-tp">'+X.tp.map((x,i)=>'<div class="'+(x===X.tBest?'best':'')+'" style="--k:'+i+'" title="Arriva a '+fmtX(x.t)+'R il '+pct(x.p)+' dei trade"><em class="'+sgn(x.e)+'">'+fmtN(x.e,2,true)+'</em><i class="'+sgn(x.e)+'" style="--h:'+Math.max(3,Math.abs(x.e)/tm*100)+'%"></i><span>'+fmtX(x.t)+'</span></div>').join('')+'</div>'+
      '<small>Il migliore a trade: <b>'+fmtX(X.tBest.t)+'R</b> ('+fmtN(X.tBest.e,2,true)+' R a trade, ci arriva il '+pct(X.tBest.p)+'). La tabella sopra conta anche le regole del giorno.</small></div>'; }
  if (a.id==='be' && X.be.length) h+='<div class="op-xc"><b>Stop a BE <small>con target '+fmtX(X.Tref)+'R</small></b>'+X.be.map(b=>'<div class="op-ber"><span>a '+fmtX(b.a)+'R</span><span>salva <b>'+b.sv+'</b> loss · chiude <b>'+b.kl+'</b> win</span><em class="'+sgn(b.net)+'">'+fmtN(b.net,1,true)+' R</em></div>').join('')+
    '<small>'+(X.be.every(b=>b.net<0) ? 'Il BE costa a ogni livello: chiude a zero trade che poi sarebbero arrivati al target.' : X.be.some(b=>b.net>0) ? 'Il BE conviene a '+X.be.filter(b=>b.net>0).map(b=>fmtX(b.a)+'R').join(', ')+'.' : '')+'</small></div>';
  if (a.id==='tr' && X.pb.length) h+='<div class="op-xc"><b>Quanto tornano indietro i trade</b><div class="op-pbr op-pbh"><span>prima di salire di 1R, dopo</span><span>metà</span><span>8 su 10</span></div>'+
    X.pb.map(q=>'<div class="op-pbr"><span>'+fmtX(q.L)+'R <small>'+q.n+' trade</small></span><b class="num">'+fmtN(q.med,1)+' R</b><b class="num">'+fmtN(q.p8,1)+' R</b></div>').join('')+
    '<small>Uno stop che segue più vicino di '+fmtN((X.pb.find(q=>q.L===2)||X.pb[0]).p8,1)+' R chiude prima del tempo più di 2 trade buoni su 10.</small></div>';
  const r=J.roll, ho=J.ho;
  return h+'<p class="op-leg">'+(r ? 'Le prove: scegliendo ogni settimana la migliore di questo tipo fino a quel momento (col suo gruppo di uscite vicine) e usandola la settimana dopo, avresti fatto '+fRw(r.rw)+' R a settimana contro '+fRw(r.rb)+' della tua (meglio in '+r.up+', peggio in '+r.dn+' settimane su '+r.n+'). ' : '')+
    (ho && ho.v!==me ? 'Senza le ultime '+ho.H+' settimane la scelta era '+esc(low1(cap(ho.v.g)))+', che proprio in quelle ha fatto '+fmtN(ho.R,1,true)+' R contro '+fmtN(ho.Rme,1,true)+' della tua. ' : '')+
    'Stop spostato, trailing e parziali seguono il percorso scritto nelle note; se la nota finisce prima, conta il caso peggiore.</p>'; }
// dentro un'area del piano: le modifiche proposte o segnalate, poi ogni valore con i suoi R a trade
function optGBody(O, a) { const mx=Math.max(.5, ...a.fl.map(m=>m.c).concat(a.ch.map(x=>x.c)).flatMap(c=>[c.all, c.m3, c.w3, c.w1].map(Math.abs)));
  const bar=(l,v)=>'<div class="op-br"><span>'+l+'</span><i><b class="'+sgn(v)+'" style="--w:'+Math.max(4,Math.abs(v)/mx*100)+'%"></b></i><em class="num '+sgn(v)+'">'+fRw(v)+'</em></div>';
  const mv=(m,go,i,sc)=>{ const c=sc||m.c, v=OPT_V[c.verdict];
    return '<div class="op-a" style="--k:'+i+'"><div class="op-at"><b>'+esc(optLbl(m))+'</b><span class="op-chip '+(go?'':'rk')+'">'+(go?'Nella proposta':v?v[1]:'Segnalata')+'</span></div>'+
      '<div class="op-bars">'+bar('Tutto',c.all)+bar('3 mesi',c.m3)+bar('3 sett.',c.w3)+bar('Ultima',c.w1)+'</div>'+
      '<div class="op-af">'+optDots(c.p)+'<small>'+c.aff+' trade cambiano · '+(m.since>1?'segnalata da '+m.since+' weekend':'novità di questo weekend')+'</small>'+
      (go?'':'<button type="button" class="btn sec sm" data-act="optapply" data-mv="'+O.moves.indexOf(m)+'">Applica</button>')+'</div></div>'; };
  const list=[...a.ch.map(x=>[O.moves.find(m=>m.l===x.l), true, x.c]).filter(x=>x[0]), ...a.fl.slice(0,3).map(m=>[m,false])];   // per i passi della proposta: il confronto fatto dopo i passi prima
  let h = list.length ? '<div class="op-sub">R a settimana in più del tuo piano'+(a.ch.length?' (per quelle nella proposta: dopo le modifiche che vengono prima)':'')+'</div><div class="op-al">'+list.map((x,i)=>mv(x[0],x[1],i,x[2])).join('')+'</div>' : '';
  a.dr.forEach(d=>{ h+='<p class="op-calm op-dr">'+ic(d.mr>d.mb?'trendUp':'trendDn',16,2.4)+'<span><b>'+esc(d.k)+'</b>'+(d.on?'':' (fuori dal piano)')+': da '+fmtN(d.mb,2,true)+' a '+fmtN(d.mr,2,true)+' R a trade nelle ultime '+d.win+' settimane ('+d.c+' trade). Per caso succede '+(d.p<.01?'meno di 1 volta':Math.round(d.p*100)+' volte')+' su 100.</span></p>'; });
  if (a.id==='asset' && O.mkt) h+=optMktBody(O);
  if (a.id==='day') { const ms=a.ms.slice().sort((x,y)=>y.c.all-x.c.all), td=v=>'<td class="num '+(Math.abs(v)<.05?'':sgn(v))+'">'+(Math.abs(v)<.05?'=':fRw(v))+'</td>';
    return h+'<div class="tbl-wrap"><table class="ex-t op-t"><tr><th>Al posto della tua regola</th><th>Tutto</th><th class="op-c3">3 mesi</th><th>3 sett.</th><th>Ultima</th></tr>'+
      ms.map(m=>'<tr><td>'+esc(optLbl(m))+'</td>'+td(m.c.all)+'<td class="num op-c3 '+sgn(m.c.m3)+'">'+fRw(m.c.m3)+'</td>'+td(m.c.w3)+td(m.c.w1)+'</tr>').join('')+'</table></div>'+
      '<p class="op-leg">R a settimana in più o in meno del tuo piano ('+esc(dayRuleTxt(O.P,true))+'). Le regole reagiscono solo ai trade già chiusi quando entra il successivo.</p>'; }
  a.gs.forEach(g=>{ h+='<div class="tbl-wrap"><table class="ex-t op-t op-g"><tr><th>'+esc(g.name)+'</th><th>Tutto</th><th class="op-c3">3 mesi</th><th>3 sett.</th><th>Ultima</th></tr>'+
    g.rows.map(r=>'<tr class="'+(r.on?'':'off')+'"><td>'+esc(r.k)+(r.tr?'<i class="op-tr '+(r.tr>0?'up':'down')+'">'+ic(r.tr>0?'trendUp':'trendDn',13,2.4)+'</i>':'')+(r.on?'':'<small>fuori dal piano</small>')+'</td>'+
      r.w.map((w,j)=>'<td class="num '+(j===1?'op-c3 ':'')+sgn(w.rt)+'">'+(w.n?fRt(w.rt):'–')+'<small>'+w.n+'</small></td>').join('')+'</tr>').join('')+'</table></div>'; });
  return h+(a.gs.length ? '<p class="op-leg">R a trade con il resto del piano e la tua uscita, senza le regole del giorno; sotto, il numero di trade. La freccia dice se negli ultimi 3 mesi rende di più o di meno. Con pochi trade (ultime 3 settimane, ultima) i numeri oscillano molto: da soli non bastano per decidere.</p>' : ''); }
// quale mercato: ognuno da solo con le regole del piano e il test «segui il mercato più in forma»
function optMktBody(O) { const M=O.mkt, T=M.T, d=pdIso(T.from);
  return optTable(M.rows,'rw',fRw,{ head:'R a settimana, da solo' })+
    (T.n ? '<p class="op-leg">Il test: dal '+d.getDate()+' '+MESI[d.getMonth()]+', ogni settimana il mercato che aveva fatto meglio nelle 4 settimane prima ('+T.cnt.map(c=>c[0]+' '+c[1]).join(', ')+' settimane) avrebbe fatto '+fRw(T.sw)+' R a settimana, contro '+fRw(T.st)+' restando su '+esc(M.cur)+(M.kind==='go'?': seguire il mercato più in forma ha pagato.':M.kind==='mid'?': un po\' di più, ma può essere un caso.':': cambiare mercato non ha pagato.')+'</p>' : ''); }
// la routine alla prova: cosa avrebbe proposto ogni weekend con i soli dati di prima, e com'è andata la settimana dopo
function optTrackCard(O) { const T=O.track; if (!T) return '';
  const d=T.rw-T.rb, on=!!(O.prop && O.prop.roll===T);
  return '<details class="card wide rise op-det"'+(S.optDet?' open':'')+'><summary><span class="op-ds">'+ic('chev',15,2.4)+'<b>La routine alla prova</b></span><span class="sub"><b class="'+(Math.abs(d)<.05?'':sgn(d))+'">'+fRw(d)+' R a settimana</b> rispetto al piano fermo, in '+T.n+' settimane</span></summary>'+
    '<p class="op-leg">Ogni weekend, dalla metà dello storico, ho rifatto la routine con i soli dati di prima e ho tenuto le modifiche per la settimana dopo. Meglio del piano fermo in '+T.up+' settiman'+(T.up===1?'a':'e')+', peggio in '+T.dn+'. '+(on ? 'È la prova che sta dietro alla proposta in alto.' : 'Non abbastanza per proporre modifiche oggi: servono almeno +0,1 R a settimana e più settimane migliori che peggiori.')+'</p>'+
    '<div class="op-tk">'+T.log.slice(-8).reverse().map((x,i)=>'<div style="--k:'+i+'"><span>'+optWkLbl(x.wk)+'</span><small>'+(x.steps.length ? esc(x.steps.map(l=>l.replace(/^gestione: /,'')).join(' · ')) : 'nessuna modifica')+'</small><b class="num '+(Math.abs(x.d)<1e-9?'':sgn(x.d))+'">'+(Math.abs(x.d)<1e-9?'=':fmtN(x.d,1,true)+' R')+'</b></div>').join('')+'</div></details>'; }
function optAiCard() {
  return '<div class="card wide rise op-ai"><span class="op-ic">'+ic('spark',18,2.2)+'</span><div class="op-ai-t"><b>Chiedi a Claude</b><span>Vede il tuo piano, la settimana e tutta la checklist.</span></div>'+
    '<div class="op-ai-b"><button type="button" class="btn sm" data-act="optai">Commenta</button><button type="button" class="btn sec sm" data-act="optask">Fai una domanda</button></div></div>'; }
function optHowCard(O) { const p=optRoutine(O).pers, pc=x=>x===null ? 'una quota non ancora misurabile' : 'il '+Math.round(Math.max(0,x)*100)+'%';
  return '<details class="card wide rr-how rise op-how"><summary>'+ic('chev',15,2.2)+'Come funziona</summary><ul>'+
    '<li><b>La routine.</b> A settimana chiusa rivedo tutto: '+O.moves.length+' modifiche possibili al piano (una alla volta: orari, setup, giorni, mercati, condizioni, regole del giorno) e oltre 200 uscite (target, stop a BE o in profitto, trailing, parziali). Ogni alternativa si confronta con il tuo piano settimana per settimana, in R a settimana: conta sia quanto rende un trade sia quanti ne fai.</li>'+
    '<li><b>Quanto conta il breve periodo.</b> '+(p.w1===null && p.w3===null ? 'Lo misuro sui tuoi dati (quanto dello scarto recente di un orario, un setup o un giorno si ritrova la settimana dopo): per ora le settimane sono poche per dirlo. ' : 'L\'ho misurato sui tuoi dati: quando un gruppo di trade (un orario, un setup, un giorno) va meglio o peggio del solito, la settimana dopo si ritrova '+pc(p.w1)+' di quello scarto se guardo solo l\'ultima settimana, '+pc(p.w3)+' se guardo le ultime 3. ')+'Per questo l\'ultima settimana si rivede ma da sola non decide; le ultime 3 possono proporre una modifica, ma solo se anche i 3 mesi sono positivi e lo storico non è contrario. Il numero si aggiorna ogni settimana: se il mercato diventa più «a fasi», lo vedi qui.</li>'+
    '<li><b>Gli stati.</b> <b>Conviene</b>: regge su tutto lo storico (probabilità almeno 99% con più peso alle settimane recenti, 95% con tutte uguali), nei 3 mesi e non peggiora nelle ultime 3–4 settimane. <b>Forte di recente</b>: almeno +1 R a settimana nelle ultime 3 su almeno 4 trade, positiva nelle ultime 4 e nei 3 mesi, non negativa sullo storico. <b>Da provare</b>: probabilità almeno 90% e 75%. Su tante alternative qualcuna sembra buona per caso: per questo una segnalazione da sola finisce in «Tieni d\'occhio».</li>'+
    '<li><b>Cosa entra nella proposta.</b> Metto insieme le modifiche segnalate, una alla volta (al massimo 4): prima quali trade prendere (condizioni, mercati, setup, orari, giorni, regole del giorno), poi l\'uscita, scelta sui trade che restano. Così la proposta non dipende da come è scritto oggi il tuo piano. Lo faccio in due modi: prudente (conviene e forte di recente) e attivo (anche da provare). Poi rifaccio la stessa routine ogni weekend del passato con i soli dati di prima: propongo il modo che ha reso di più, e solo se ha battuto il piano fermo di almeno 0,1 R a settimana e in più settimane di quante ha fatto peggio. Se nessuno dei due passa, il piano è confermato. La trovi in «La routine alla prova».</li>'+
    '<li><b>Uscite.</b> Il target fisso è esatto dal Max Real RR. Stop a BE o in profitto, trailing e parziali seguono il percorso scritto nelle note; se la nota finisce prima, conta il caso peggiore. Ogni uscita conta insieme alle vicine (un passo in più o in meno), perché un picco isolato è quasi sempre fortuna. Un cambio di uscita si propone solo se batte la tua di almeno 0,1 R a settimana, se scegliere così ha pagato nella prova sul passato e se regge sulle ultime settimane non usate per sceglierla.</li>'+
    '<li><b>Niente senno di poi.</b> Le regole del giorno reagiscono solo ai trade già chiusi quando entra il successivo. Contano solo le settimane chiuse.</li>'+
    '<li><b>Cosa sta cambiando.</b> Per il piano e per ogni setup, mercato, orario e condizione confronto i R a trade delle ultime 4, 6, 8 o 13 settimane con quelli di prima, rimescolando l\'ordine dei trade: lo segnalo solo se una differenza così esce per caso al massimo 5 volte su 100.</li>'+
    '<li><b>In drawdown.</b> Se non c\'è niente da proporre, le ultime 4 settimane sono negative e il calo supera metà del peggiore di sempre, il consiglio è abbassare il rischio per trade, non cambiare le regole.</li></ul></details>'; }
// pulsanti della pagina e della scheda del piano
function optClick(b) {
  if (S.sheet==='plan' && b.closest('#sh-body')) return planClick(b);
  const a=b.dataset.act;
  if (a==='planedit') { openPlan(); return true; }
  if (a==='planundo') { if (S._planPrev) { CFG.piano=S._planPrev; S._planPrev=null; planSaved(); toast('Piano com\'era prima'); renderCurrent(true); } return true; }
  if (a==='optstep') { const O=S._opt, G=O && O.prop; if (!G) return true; optPick(O); const l=G.steps[+b.dataset.i].l;
    S.optOff = S.optOff.includes(l) ? S.optOff.filter(x=>x!==l) : S.optOff.concat(l);
    const el=document.querySelector('.op-hero'), t=document.createElement('div'); t.innerHTML=optHero(O,true); el.replaceWith(t.firstElementChild);
    const c=$('c-opt'); if (c) optChart(c, O); return true; }
  if (a==='optapply' || a==='optall' || a==='optexit') {
    if (!b.classList.contains('arm')) { b.classList.add('arm'); const t=b.innerHTML; b.textContent='Conferma'; setTimeout(()=>{ if (b.isConnected) { b.classList.remove('arm'); b.innerHTML=t; } }, 3500); return true; }
    const O=S._opt; if (!O) return true; const prev=JSON.parse(JSON.stringify(PL()));
    if (a==='optexit') { const X=optExit(O), v=X.grid[+b.dataset.gi]; if (!v) return true; CFG.piano=Object.assign(JSON.parse(JSON.stringify(PL())), { g:JSON.parse(JSON.stringify(v.g)) }); planSaved(prev); toast('Uscita aggiornata: '+mgTxt(v.g,true)); }
    else if (a==='optapply') { const m=O.moves[+b.dataset.mv]; if (!m) return true; CFG.piano=JSON.parse(JSON.stringify(m.P)); planSaved(prev); toast('Piano aggiornato: '+m.l); }
    else { const K=optPick(O); if (!K || !K.on.length) return true; CFG.piano=JSON.parse(JSON.stringify(K.P)); S.optOff=[]; planSaved(prev);
      toast('Piano per la prossima settimana: '+K.on.length+(K.on.length===1?' modifica':' modifiche')); }
    renderCurrent(true); window.scrollTo({ top:0, behavior:'smooth' }); return true; }
  if (a==='optai') { openChat(); sendChat('Fai con me la routine del weekend: com\'è andata la settimana chiusa, cosa cambieresti per la prossima, cosa terresti d\'occhio e cosa non toccheresti? Usa i numeri della pagina e dimmi quanto ti fidi di ogni indicazione.'); return true; }
  if (a==='optask') { openChat(); return true; }
  return false; }
// contesto per Claude quando la chat parte da questa pagina: piano, numeri per periodo, proposte e gruppi
function optCtx() { const O=optAll(); if (!O) return 'servono almeno 6 settimane di trade nell\'EOW';
  const w=n=>OPT_WIN.reduce((o,x,i)=>(o[x.l]={ R_a_settimana:r2(n[i].rw), R_a_trade:r2(n[i].rt), trade:n[i].n, vinti:r2(n[i].wr), drawdown_R:r2(n[i].dd), calo_attuale_dal_massimo_R:r2(n[i].cur) }, o), {});
  const c=m=>({ modifica:m.l, verdetto:OPT_V[m.c.verdict]?OPT_V[m.c.verdict][1]:'nessuno', R_a_settimana_in_piu:{ tutto:r2(m.c.all), ultimi_3_mesi:r2(m.c.m3), ultimo_mese:r2(m.c.m1), ultime_3_settimane:r2(m.c.w3) }, probabilita_che_sia_vero:r2(m.c.p), trade_che_cambiano:m.c.aff });
  return { nota:'Backtest sui trade dell\'EOW: ogni alternativa simulata con le regole del piano e confrontata settimana per settimana. «Conviene» con probabilità ≥ 99% (pesata sulle settimane recenti) e ≥ 95% (tutte uguali), «da provare» con ≥ 90% e ≥ 75% (o ≥ 95% su tutte le settimane e ≥ 80% pesata): con decine di alternative provate un «da provare» falso esce circa una volta su tre. Esiti: target fisso esatto dal Max Real RR; stop a BE e parziali calcolati dal percorso scritto nelle note dei trade (caso peggiore quando la nota non basta). Le regole del giorno reagiscono solo ai trade già chiusi quando entra il successivo (niente senno di poi).',
    periodo:optDates(O.B), settimane:O.B.weeks.length, piano:planDesc(O.P), risultati_del_piano:w(O.nums),
    consigliate:O.sugg.map(c), da_provare:O.hint.map(c), ultime_3_settimane:O.recent.map(m=>Object.assign(c(m), { trade_cambiati_nelle_ultime_3_settimane:m.c.aff3 })), da_tenere_d_occhio:O.drift.map(d=>({ cosa:d.id==='piano'?'il piano intero':d.dim+': '+d.k, nel_piano:d.on, R_a_trade_ultime_settimane:r2(d.mr), settimane:d.win, trade_recenti:d.c, R_a_trade_prima:r2(d.mb), probabilita_che_sia_un_caso:r2(d.p) })), uscita_dal_trade:(()=>{ const X=optExit(O), f=v=>({ uscita:mgTxt(v.g), R_a_settimana_tutto:r2(v.n[0].rw), R_a_settimana_3_mesi:r2(v.n[1].rw), calo_massimo_R:r2(v.n[0].dd) });
      return { nota:'tutte le uscite (target fissi, stop spostato a BE o in profitto, trailing, parziali) simulate col percorso scritto nelle note; ogni uscita conta col gruppo delle vicine; caso peggiore quando la nota finisce prima', verdetto:{ go:'cambiare uscita', same:'la sua è già tra le migliori', paper:'meglio sulla carta ma le prove non confermano' }[X.kind],
        la_sua:f(X.me), migliori_per_tipo:X.fams.map(f), prova_sul_passato:X.roll?{ scegliendo_ogni_settimana:r2(X.roll.rw), tenendo_la_sua:r2(X.roll.rb), settimane_meglio:X.roll.up, settimane_peggio:X.roll.dn }:null,
        R_a_trade_per_target_fisso:X.tp.reduce((o,x)=>(o[fmtX(x.t)+'R']=r2(x.e),o),{}), stop_a_BE:X.be.map(b=>({ livello:b.a, perdite_salvate:b.sv, vincenti_chiusi_a_zero:b.kl, R_netti:r2(b.net), con_target:X.Tref })),
        ritracciamenti:X.pb.map(q=>({ dopo_R:q.L, mediana_R:r2(q.med), otto_su_dieci_entro_R:r2(q.p8), trade:q.n })) }; })(), routine_del_weekend:(()=>{ const R=optRoutine(O), w=R.last, G=O.prop, T=O.track;
      return { nota:'la pagina è una routine da fare a settimana chiusa: revisione della settimana, checklist con uno stato per area (Cambia = nella proposta, Tieni d\'occhio = segnalata ma non provata, Confermato) e proposta per la settimana dopo. L\'ultima settimana da sola non decide mai.',
        settimana_chiusa:{ lunedi:w.wk, R_col_piano:r2(w.n.R), trade:w.n.n, vinti:r2(w.n.wr), rispetto_alle_altre_settimane:w.rank>=.8?'tra le migliori':w.rank<=.2?'tra le peggiori':'nella norma', R_per_giorno_lun_ven:w.days.map(r2), trade_lasciati_fuori_dalle_regole:w.out, R_che_avrebbero_fatto:r2(w.outR), settimane_di_fila_dello_stesso_segno:w.streak,
          modifica_migliore_col_senno_di_poi:w.lesson ? { modifica:w.lesson.m.l, R_in_piu_questa_settimana:r2(w.lesson.m.c.w1), R_a_settimana_sullo_storico:r2(w.lesson.m.c.all), nelle_4_settimane_prima:{ meglio:w.lesson.up, peggio:w.lesson.dn } } : null },
        proposta_per_la_settimana_dopo: G ? { modifiche:G.steps.map(x=>({ modifica:x.l, tipo:x.x?'cambio di uscita (ha passato prova sul passato e controprova)':x.c.verdict==='si'?'confermata dallo storico':x.c.verdict==='indizio'?'da provare':'forte nelle ultime 3 settimane', weekend_di_fila_segnalata:x.since||1 })), modo:{ now:'prudente (conviene + forte di recente)', act:'attivo (anche da provare)', best:'solo conviene, confermato senza le ultime settimane', exit:'solo cambio di uscita' }[G.mode] } : 'nessuna: piano confermato',
        checklist:R.areas.map(a=>({ area:a.name, stato:OPT_ST[a.st][0], risposta:a.say })),
        prova_sul_passato_della_routine:T ? { settimane:T.n, R_a_settimana_seguendola:r2(T.rw), R_a_settimana_piano_fermo:r2(T.rb), settimane_meglio:T.up, settimane_peggio:T.dn, ultime:T.log.slice(-6).map(x=>({ settimana:x.wk, modifiche:x.steps, R_rispetto_al_piano:r2(x.d) })) } : null,
        quanto_dura_una_fase:{ nota:'quota dello scarto recente di un gruppo dalla sua media che si ritrova la settimana dopo (1 = tutto, 0 = niente)', ultima_settimana:R.pers.w1===null?null:r2(R.pers.w1), ultime_3_settimane:R.pers.w3===null?null:r2(R.pers.w3) } }; })(), piano_migliore:{ sicuro:!!O.best, nota:'si propone solo se trovato con i «conviene», trovato uguale anche senza le ultime settimane e migliore del piano proprio in quelle', modifiche:O.greedy.steps.map(s=>s.l), risultati:w(O.greedyNums) },
    quale_mercato:O.mkt ? { nota:'ogni mercato da solo con tutte le regole del piano; test: ogni settimana il mercato migliore delle 4 settimane prima, confrontato con il piano', mercati:O.mkt.rows.map(r=>({ mercato:r.l, del_piano:r.cur, R_a_settimana:OPT_WIN.reduce((o,x,i)=>(o[x.l]=r2(r.nums[i].rw), o), {}) })),
      davanti_nelle_ultime_4_settimane:O.mkt.lead, verdetto:{ go:'passa per ora', mid:'davanti ma presto per cambiare', stay:'resta' }[O.mkt.kind],
      test_cambio_mercato:{ settimane:O.mkt.T.n, settimane_fuori_dal_piano:O.mkt.T.k, R_a_settimana_cambiando:r2(O.mkt.T.sw), R_a_settimana_restando:r2(O.mkt.T.st), probabilita_che_sia_meglio:r2(O.mkt.T.p) } } : null,
    prova_sul_passato:O.roll ? { nota:'ogni settimana, dalla metà dello storico, la ricerca rifatta con i soli dati di prima e il piano proposto tenuto per la settimana dopo', settimane:O.roll.n, settimane_con_piano_cambiato:O.roll.ch, R_a_settimana_seguendo_ottimizza:r2(O.roll.rw), R_a_settimana_piano:r2(O.roll.rb) } : null,
    verifica_sulle_ultime_settimane_non_viste:O.wf ? { settimane:O.wf.H, proposta_senza_quelle_settimane:O.wf.steps.map(s=>s.l), R_proposta:r2(O.wf.prop.R), R_piano:r2(O.wf.plan.R) } : null,
    gestioni:O.mg.map(m=>({ gestione:mgTxt(m.g), del_piano:m.cur, R_a_settimana:OPT_WIN.reduce((o,x,i)=>(o[x.l]=r2(m.nums[i].rw), o), {}) })),
    gruppi:O.groups.map(g=>({ dimensione:g.name, valori:g.rows.map(r=>({ valore:r.k, nel_piano:r.on, R_a_trade:{ tutto:r2(r.w[0].rt), ultimi_3_mesi:r2(r.w[1].rt), ultime_3_settimane:r2(r.w[2].rt), ultima_settimana:r2(r.w[3].rt) }, trade:{ tutto:r.w[0].n, ultimi_3_mesi:r.w[1].n, ultime_3_settimane:r.w[2].n, ultima_settimana:r.w[3].n }, mesi_positivi:r.mPos+'/'+r.mTot })) })) }; }


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['ottimizza.js'] = '2026-11-15.3';

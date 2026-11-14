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
  h+=sec('Gestione del trade','',f('Come esci',seg('pl-gk',[{v:'P',l:'A parziali'},{v:'T',l:'Target fisso'}],g.k))+
    (g.k==='T' ? f('Target',chips('pl-gt',PLAN_MG.T.map(x),g.t))+f('Stop a BE quando arriva a',seg('pl-gbe',[{v:0,l:'Mai'},...PLAN_MG.BE.filter(b=>b<g.t).map(b=>({ v:b, l:fmtX(b)+'R' }))],g.be||0))
    : f('Prima metà a',chips('pl-gt1',PLAN_MG.P1.map(x),g.t1))+f('Poi lo stop del resto va a',seg('pl-gs',[{v:0,l:'BE'},{v:.5,l:'+0,5R'},{v:1,l:'+1R'}],g.s))+f('Resto a',chips('pl-gt2',PLAN_MG.P2.map(x),g.t2)))+
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
  else if (name==='gk') P.g = v==='T' ? { k:'T', t:P.g.k==='P'?P.g.t1:P.g.t } : { k:'P', t1:2, s:1, t2:4 };
  else if (name==='gt') { P.g.t=n; if (P.g.be>=n) delete P.g.be; }
  else if (name==='gbe') { if (n) P.g.be=n; else delete P.g.be; }
  else if (name==='gt1') { P.g.t1=n; if (P.g.t2<=n) P.g.t2=PLAN_MG.P2.find(x=>x>n); }
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
function optR(B, x, g) { const mx=x.mx;
  if (g.k==='T' && !g.be) return mx>=g.t-1e-9 ? g.t : -1;
  if (x.pth===undefined) x.pth = notePath(x.t && x.t.raw ? x.t.raw.Note : '');
  if (x.pth) return optWalk(x.pth, mx, g);
  if (g.k==='T') return mx>=g.t-1e-9 ? g.t : mx>=g.be-1e-9 ? 0 : -1;   // senza nota: come prima
  if (mx<g.t1-1e-9) return -1;
  return .5*g.t1 + .5*g.s; }
function optWalk(N, mx, g) {
  let stop=-1, half=null; const T=g.k==='T';
  for (let i=1;i<N.p.length;i++) { const v=N.p[i];
    if (v<=stop+1e-9) return half!==null ? .5*half+.5*stop : stop;
    if (T) { if (v>=g.t-1e-9) return g.t; if (v>=g.be-1e-9) stop=Math.max(stop,0); }
    else { if (half===null && v>=g.t1-1e-9) { half=g.t1; stop=Math.max(stop,g.s); } if (half!==null && v>=g.t2-1e-9) return .5*half+.5*g.t2; } }
  // dopo la nota: arriva al massimo e poi allo stop (dov'è in quel momento)
  if (T) { if (mx<g.t-1e-9) return mx>=g.be-1e-9 ? 0 : stop; return stop<0 && mx<g.be-1e-9 ? g.t : stop<0 ? 0 : stop; }   // BE toccato dopo la nota e poi il target: ordine ignoto → BE
  if (half===null) return mx<g.t1-1e-9 ? stop : .5*g.t1+.5*g.s;
  return .5*half+.5*stop; }
function optPass(P, x) { const t=x.t;
  if (!P.asset.includes(mktOf(t.a)) || !P.idee.includes(t.idea) || !P.giorni.includes(t.day) || !P.bande.includes(x.band)) return false;
  if ((P.dir && t.dir!==P.dir) || (P.smt==='fav' && t.smt!=='SMT a favore') || (P.smt==='nosf' && t.smt==='SMT a sfavore')) return false;
  if ((P.lvn && t.lvn!==P.lvn) || (P.clean && !t.clean) || (P.cc2==='si' && !t.cc2) || (P.cc2==='no' && t.cc2)) return false;
  if ((P.news==='nored' && t.news==='Red News') || (P.news==='none' && t.news!=='No News Day')) return false;
  if (P.pb.length && !P.pb.includes(x.pb)) return false;
  return true; }
// simulazione del piano: i trade presi giorno per giorno con le regole del giorno, i R per settimana e l'esito di ogni trade
function optSim(B, P) {
  const W=B.weeks.length, wR=new Float64Array(W), wN=new Float64Array(W), rs=new Map(), seq=[], take=dayRules(P);
  B.ts.forEach((x,i)=>{ if (!optPass(P,x)) return;
    const r=optR(B,x,P.g); if (!take(x.t, r, P.g)) return;   // regole del giorno senza senno di poi (dayRules in core.js)
    const w=B.wi[x.wk]; wR[w]+=r; wN[w]++; rs.set(i,r); seq.push([w,r]); });
  return { wR, wN, rs, seq }; }
// i numeri di una simulazione nelle ultime n settimane (fino alla settimana «to», esclusa)
function optNums(B, sim, n, to) { to=to??B.weeks.length; const from=Math.max(0, to-(n==='all'?to:n)), k=to-from; let R=0, N=0, w=0, eq=0, pk=0, dd=0;
  sim.seq.forEach(([wk,r])=>{ if (wk<from || wk>=to) return; R+=r; N++; if (r>0) w++; eq+=r; if (eq>pk) pk=eq; if (eq-pk<dd) dd=eq-pk; });
  return { R, n:N, wk:k, rw:k?R/k:NaN, rt:N?R/N:NaN, wr:N?w/N:NaN, dd, cur:eq-pk }; }
// generatore di numeri casuali con seme: gli stessi dati danno sempre lo stesso risultato
function optRng(seed) { let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
// confronto di una variante con il piano, settimana per settimana nelle settimane [0, to)
function optCmp(B, base, v, to, N) {
  to=to??B.weeks.length; N=N||1000; const d=[], w=[]; for (let i=0;i<to;i++) { d.push(v.wR[i]-base.wR[i]); w.push(Math.pow(.5,(to-1-i)/OPT_HL)); }
  const mean=(a,b)=>{ const s=d.slice(Math.max(0,to-a)); return s.length ? s.reduce((x,y)=>x+y,0)/s.length : 0; };
  const W=w.reduce((x,y)=>x+y,0), wm=d.reduce((s,x,i)=>s+x*w[i],0)/W;
  const rng=optRng(to*7919+Math.round(wm*1e4)); let pos=0, posA=0;
  for (let k=0;k<N;k++) { let s=0, sw=0, sa=0; for (let i=0;i<to;i++) { const j=Math.floor(rng()*to); s+=d[j]*w[j]; sw+=w[j]; sa+=d[j]; } if (s/sw>0) pos++; if (sa>0) posA++; }
  let aff=0, aff3=0; const keys=new Set([...base.rs.keys(), ...v.rs.keys()]);
  keys.forEach(i=>{ const wk=B.wi[B.ts[i].wk]; if (wk<to && base.rs.get(i)!==v.rs.get(i)) { aff++; if (wk>=to-3) aff3++; } });
  const c={ all:mean(to), m3:mean(13), m1:mean(4), w3:mean(3), aff3, wm, p:pos/N, pa:posA/N, aff, ddB:optNums(B,base,'all',to).dd, ddV:optNums(B,v,'all',to).dd };
  c.verdict=optVerdict(c); return c; }
// le modifiche possibili a partire da un piano: [categoria, testo, nuovo piano]
// gestioni confrontate: target fissi, target con stop a BE, metà a 2R con stop a +1R o a BE (tutte calcolate dalle note)
const OPT_GS = () => [...PLAN_MG.T.map(t=>({ k:'T', t })), ...[2,3,4].flatMap(t=>PLAN_MG.BE.filter(b=>b<t).map(be=>({ k:'T', t, be }))),
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
  for (let k=0;k<4;k++) { let best=null;
    optMoves(B,P).forEach(m=>{ const v=simOf(m.P), c=optCmp(B,base,v,to,N); if (pass(c) && (!best || ord(c)>ord(best.c))) best={ m, v, c }; });
    if (!best) break; steps.push({ l:best.m.l, cat:best.m.cat, c:best.c }); P=best.m.P; base=best.v; }
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
  // regole del giorno: tutte le combinazioni principali
  const days=[];
  [1,2,3,0].forEach(maxN=>[1,0].forEach(sw=>[0,2].forEach(sll=>{ const q=Object.assign({}, P, { maxN, sw, sll }); days.push({ q, cur:maxN===P.maxN&&sw===P.sw&&sll===P.sll, nums:nums(simOf(q)) }); })));
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
  const gNow=optGreedy(B,P,undefined,OPT_NOW,simOf), rollNow=gNow.steps.some(x=>x.c.verdict!=='si') ? optRoll(B,P,base,simOf,OPT_NOW) : null;
  const now = rollNow && rollNow.rw-rollNow.rb>=.1 && rollNow.up>rollNow.dn ? Object.assign(gNow, { nums:nums(gNow.sim), roll:rollNow }) : null;
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
  return (S._opt={ B, key, P, base, simOf, nums:nums(base), mkt, moves, sugg:one(sugg).slice(0,6), hint:one([...(sure?[]:sugg), ...hint].filter(m=>!(best && best.steps.some(x=>x.l===m.l)))).slice(0,3), best, now, doubt, drift, recent, mg, days, groups, greedy, greedyNums:nums(greedy.sim), wf:wfRes, roll, ms:performance.now()-t0 }); }
// prova del metodo sul passato: ogni settimana (dalla metà dello storico) rifà la ricerca con i soli dati di prima, come se
// usassi Ottimizza quel giorno, e tiene il piano proposto per la settimana dopo. Confronto con il piano fisso.
function optRoll(B, P, base, simOf, ok) {
  const W=B.weeks.length, from=Math.max(8, Math.ceil(W/2)); if (W-from<4) return null;
  let R=0, Rb=0, ch=0, up=0, dn=0;
  for (let t=from; t<W; t++) { const g=optGreedy(B,P,t,ok||['si'],simOf,400), d=g.sim.wR[t]-base.wR[t];
    R+=g.sim.wR[t]; Rb+=base.wR[t]; if (g.steps.length) ch++; if (d>1e-9) up++; else if (d<-1e-9) dn++; }
  const n=W-from; return { n, from:B.weeks[from], rw:R/n, rb:Rb/n, ch, up, dn }; }
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
      const w=[win('all'), win(13), win(4)], tr = w[1].n>=8 && w[0].n>=15 ? (w[1].rt-w[0].rt>.3 ? 1 : w[1].rt-w[0].rt<-.3 ? -1 : 0) : 0;
      return { k, on:inPlan[id](k), w, tr, mPos:mv.filter(x=>x>0).length, mTot:mv.length }; }).filter(Boolean);
    return { id, name, rows }; }).filter(g=>g.rows.length>1); }

// ── pagina ──
const OPT_V = { si:['check','Conviene','ok'], indizio:['spark','Da provare','try'], recente:['trendUp','Forte di recente','up'], calo:['trendDn','Funzionava, ora meno','down'] };
const OPT_CAT = { g:'Gestione', asset:'Mercati', idee:'Setup', bande:'Orari', giorni:'Giorni', ctx:'Condizioni', day:'Regole del giorno' };
const OPT_TABS = [{ v:'g', l:'Gestione' }, { v:'set', l:'Setup' }, { v:'ora', l:'Orari' }, { v:'ctx', l:'Contesto' }];
const OPT_TG = { set:['asset','idee','dir'], ora:['bande','giorni'], ctx:['news','smt','lvn','clean','cc2','pb'] };
const fRw = x => isFinite(x) ? fmtN(x,1,true) : '–';
const fRt = x => isFinite(x) ? fmtN(x,2,true) : '–';
const optCap = s => String(s).replace(/^./, c=>c.toUpperCase());
const optLbl = m => optCap(m.cat==='g' ? m.l.replace(/^gestione: /,'') : m.l);
function optDates(B) { const a=B.ts[0].t.d, b=B.ts[B.ts.length-1].t.d; return a.getDate()+' '+MESI[a.getMonth()]+' – '+b.getDate()+' '+MESI[b.getMonth()]+' '+b.getFullYear(); }
function renderOpt() {
  const el=$('v-opt'), E=rowsOf('EOW');
  const head=eb=>'<div class="stat-h rise"><div><div class="eyebrow">'+eb+'</div><h1>'+words('Ottimizza')+'</h1></div></div>';
  if (!E) { const h=head('EOW · piano e alternative'); el.innerHTML=h+skeleton();
    if (!S.optLoad) { S.optLoad=true; fetchFile('EOW').then(()=>{ S.optLoad=false; if (S.tab==='opt') renderCurrent(); }).catch(()=>{ S.optLoad=false; if (S.tab==='opt') el.innerHTML=h+emptyState('EOW non raggiungibile', 'Non riesco a leggere il foglio: riprova tra poco.'); }); }
    return; }
  const O=optAll();
  if (!O) { enter(el, head('EOW · piano e alternative')+emptyState('Servono più settimane', 'Per confrontare il piano con le alternative servono almeno 6 settimane di trade nell\'EOW.')); return; }
  const h=head('EOW · '+O.B.ts.length+' trade · '+optDates(O.B).replace(/ \d{4}$/,''))+optHero(O)+optActCard(O)+optWatchCard(O)+optMktCard(O)+optDetCard(O)+optAiCard()+optHowCard(O);
  enter(el, h, ()=>{ const c=$('c-opt'); if (c) optChart(c, O); });
  countUp(el.querySelector('.op-hero'), 250);
  const dt=el.querySelector('.op-det'); if (dt) dt.addEventListener('toggle', ()=>{ S.optDet=dt.open; });
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
function optPick(O) { const G=O.now||O.best; if (!G) return null;
  if (S.optOffKey!==O.key) { S.optOffKey=O.key; S.optOff=[]; }
  const off=S.optOff||[], on=[]; let P=O.P;
  G.steps.forEach((x,i)=>{ if (off.includes(x.l)) return; const m=optMoves(O.B,P).find(m=>m.l===x.l); if (m) { P=m.P; on.push(i); } });
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
// ───── La pagina in tre domande: il piano va bene? (verdetto) · cosa posso provare? · cosa sta cambiando? Il resto in «Tutti i numeri».
// verdetto: il numero che conta (R a settimana in più del piano migliore, o il piano com'è), le finestre e la curva
function optHero(O, still) { const n=O.nums, NW=O.now, G=NW || O.best, w=O.wf, K=G ? optPick(O) : null, gn=K ? K.nums : null;
  const why={ poche:'Qualcosa sembra migliore, ma le settimane sono ancora poche per confermarlo.', recenti:'Qualcosa sembra migliore, ma solo grazie alle ultime settimane.',
    retto:'Qualcosa sembrava migliore, ma non ha retto sulle settimane più recenti.', metodo:'Qualcosa sembra migliore, ma in passato seguire questi consigli non ha pagato.' }[O.doubt] || 'Nessuna delle '+O.moves.length+' alternative lo batte, né sullo storico né nelle ultime settimane.';
  const nR = NW ? NW.steps.filter(x=>x.c.verdict!=='si').length : 0, nS = G ? G.steps.length-nR : 0;
  // il numero grande è quello onesto: quanto ha reso in più seguire questa ricerca settimana per settimana con i soli dati di prima
  const rl = NW ? NW.roll : O.roll, d = !G ? 0 : rl ? rl.rw-rl.rb : gn[0].rw-n[0].rw;
  const sub = !G ? esc(why) : NW ? (nS ? nS+(nS===1?' confermata':' confermate')+' dallo storico, '+nR+(nR===1?' forte':' forti')+' nelle ultime settimane.' : (nR===1?'Una modifica forte':nR+' modifiche forti')+' nelle ultime settimane, che regge anche a 3 mesi e sullo storico.')
    : (G.steps.length===1?'Con una modifica':'Con '+G.steps.length+' modifiche')+', confermate anche sulle '+w.H+' settimane che non ho usato per trovarle.';
  // rischio: drawdown massimo, trade a settimana e R a trade, prima → dopo
  // fase negativa: niente da proporre, ultime 4 settimane in perdita e calo dal massimo già oltre metà del peggiore di sempre.
  // In una fase così si abbassa il rischio per trade, non si cambiano le regole (cambiarle in drawdown è inseguire il rumore).
  const cold = !G && n[2].rw<0 && n[0].dd<0 && n[0].cur<=.5*n[0].dd;
  const a0=n[0], a1=null, rk=(l,x,y,f)=>'<span><em>'+l+'</em><b class="num">'+f(x)+'</b>'+(y!==undefined?ic('chev',11,2.6)+'<b class="num '+(l==='Drawdown'?(y<x-1e-9?'neg':y>x+1e-9?'pos':''):'')+'">'+f(y)+'</b>':'')+'</span>';
  const risk='<div class="op-risk">'+rk('Drawdown',a0.dd,a1?a1.dd:undefined,x=>fmtN(x,1)+' R')+rk('Trade a sett.',a0.n/a0.wk,a1?a1.n/a1.wk:undefined,x=>fmtN(x,1))+rk('R a trade',a0.rt,a1?a1.rt:undefined,x=>fmtN(x,2,true))+rk('Vinti',a0.wr,a1?a1.wr:undefined,pct)+'</div>';
  let h='<div class="card wide op-hero'+(still?' still':' rise')+(G?' go':cold?' cold':'')+'"><div class="op-glow"></div>'+
    '<div class="op-hh"><div class="eyebrow">Il tuo piano · R a settimana</div><button type="button" class="op-edit" data-act="planedit">'+ic('gear',15,2.2)+'Modifica</button></div>'+
    '<div class="op-pt">'+esc(optPlanLine(O.P))+'</div>'+
    '<div class="op-vb"><span class="op-vi">'+ic(NW?'trendUp':G?'spark':cold?'shield':'check',22,2.4)+'</span><div class="op-vt"><b>'+(NW?'Adatta il piano al mercato di adesso':G?'Puoi fare meglio':cold?'Resta sul piano, riduci il rischio':'Il tuo piano è il migliore')+'</b><span>'+
      (cold ? 'Sei a '+fmtN(n[0].cur,1)+' R dal massimo (il calo peggiore finora: '+fmtN(n[0].dd,1)+' R) e nessuna alternativa è più affidabile del tuo piano. In una fase così si abbassa il rischio per trade, non si cambiano le regole.' : sub)+'</span></div>'+
      (G ? '<div class="op-up'+(K.all?'':' dim')+'"><b class="'+sgn(d)+'">'+numEl(d,1,true)+'</b><span>R a settimana'+(rl?' nella prova sul passato':' sullo storico')+(K.all?'':' · con tutte le modifiche')+'</span></div>' : '')+'</div>';
  if (G) {   // scegli le modifiche (tocca per togliere o rimettere) e guarda subito il confronto con il tuo piano
    const k=K.on.length;
    h+='<div class="op-pk"><div class="op-pkh"><b>Le modifiche proposte</b><span>Tocca per togliere o rimettere: i numeri sotto cambiano</span></div><div class="op-picks">'+
      G.steps.map((x,i)=>{ const on=K.on.includes(i); return '<button type="button" class="op-pick'+(on?' on':'')+'" data-act="optstep" data-i="'+i+'" aria-pressed="'+on+'" style="--k:'+i+'"><i>'+(on?ic('check',13,3):'')+'</i>'+esc(optLbl(x))+
        (NW?'<em class="'+(x.c.verdict==='si'?'s':'r')+'">'+(x.c.verdict==='si'?'storico':'recente')+'</em>':'')+'</button>'; }).join('')+'</div></div>'+
      (k ? optCmpHtml(n, gn, k) : '<p class="op-none">Nessuna modifica scelta: resta il tuo piano.</p>')+
      '<div class="chart" id="c-opt"></div>'+(k?'<div class="op-lgd"><span><i></i>Con le modifiche</span><span><i class="r"></i>Il tuo piano</span></div>':'')+
      '<button type="button" class="btn op-best" data-act="'+(NW?'optnow':'optall')+'"'+(k?'':' disabled')+'>'+ic('check',18,2.2)+(K.all?(NW?'Usa il piano per adesso':'Usa il piano migliore'):k?'Usa '+(k===1?'questa modifica':'queste '+k+' modifiche'):'Scegli almeno una modifica')+'</button>'+
      (rl ? '<p class="op-leg">Prova sul passato: rifacendo questa ricerca ogni settimana con i soli dati di prima (ultime '+rl.n+' settimane), seguirla ha reso '+fRw(rl.rw)+' R a settimana contro '+fRw(rl.rb)+' del tuo piano'+(rl.up+rl.dn ? ' (meglio in '+rl.up+' settiman'+(rl.up===1?'a':'e')+', peggio in '+rl.dn+')' : '')+'. Il confronto sopra è un conto fatto a posteriori sui trade passati: vale meno della prova.'+(NW?' Ricontrolla ogni settimana.':'')+'</p>'
        : '<p class="op-leg">Nelle '+w.H+' settimane non usate per trovarle, le modifiche hanno fatto '+fmtN(w.held,1,true)+' R contro '+fmtN(w.plan.R,1,true)+' R del tuo piano. Il confronto sopra è un conto fatto a posteriori.</p>');
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
// cosa provare: un solo elenco («da provare» e «ultime 3 settimane»), con barre per periodo e quanto fidarsi
function optActCard(O) {
  // niente doppioni con il piano proposto in alto: né le stesse modifiche, né alternative su mercati, gestione o regole del giorno
  const top=(O.now||O.best||{ steps:[] }).steps, cats=new Set(top.filter(x=>['g','asset','day'].includes(x.cat)).map(x=>x.cat)), dup=m=>top.some(x=>x.l===m.l) || cats.has(m.cat);
  const items=[...O.hint.filter(m=>!dup(m)).map(m=>({ m, k:'try', t:'Da provare' })), ...O.recent.filter(m=>!dup(m)).map(m=>{ const c=m.c, ok=c.verdict==='si'||c.verdict==='indizio';
    return { m, k: ok ? 'try' : c.verdict==='recente' ? 'rec' : 'rk', t: ok ? 'Da provare' : c.verdict==='recente' ? 'Forte di recente' : 'Solo di recente' }; })].slice(0,5);
  const mx=Math.max(.5, ...items.flatMap(x=>[x.m.c.all, x.m.c.m3, x.m.c.w3].map(Math.abs)));
  const bar=(l,v)=>'<div class="op-br"><span>'+l+'</span><i><b class="'+sgn(v)+'" style="--w:'+Math.max(4,Math.abs(v)/mx*100)+'%"></b></i><em class="num '+sgn(v)+'">'+fRw(v)+'</em></div>';
  let h='<div class="card wide rise op-act"><div class="card-h"><h2 class="h2">Cosa provare</h2><span class="sub">R a settimana in più del tuo piano</span></div>';
  if (!items.length) return h+'<p class="op-calm">'+ic('check',16,2.4)+'Niente da provare: nessuna modifica rende chiaramente di più, né sullo storico né nelle ultime 3 settimane.</p></div>';
  h+='<div class="op-al">'+items.map((x,i)=>{ const c=x.m.c;
    return '<div class="op-a '+x.k+'" style="--k:'+i+'"><div class="op-at"><b>'+esc(optLbl(x.m))+'</b><span class="op-chip '+x.k+'">'+x.t+'</span></div>'+
      '<div class="op-bars">'+bar('Tutto',c.all)+bar('3 mesi',c.m3)+bar('3 sett.',c.w3)+'</div>'+
      '<div class="op-af">'+optDots(c.p)+'<small>'+OPT_CAT[x.m.cat]+' · '+(x.k==='rk'?'sullo storico rende meno':c.aff+' trade cambiano')+'</small>'+
      '<button type="button" class="btn sec sm" data-act="optapply" data-mv="'+O.moves.indexOf(x.m)+'">Applica</button></div></div>'; }).join('')+'</div>';
  return h+'<p class="op-leg">I pallini dicono quanto fidarsi dello storico. «Forte di recente»: almeno +1 R a settimana nelle ultime 3 settimane, positiva anche nelle ultime 4 e nei 3 mesi. «Solo di recente»: forte nelle ultime 3 settimane ma non regge oltre.</p></div>'; }
// cosa sta cambiando: prima → adesso, in R a trade
function optWatchCard(O) {
  let h='<div class="card wide rise op-watch"><div class="card-h"><h2 class="h2">Cosa sta cambiando</h2><span class="sub">R a trade, prima → adesso</span></div>';
  if (!O.drift.length) return h+'<p class="op-calm">'+ic('check',16,2.4)+'Niente sta cambiando in modo netto: setup, mercati, orari e condizioni rendono come al solito.</p></div>';
  return h+O.drift.map((d,i)=>{ const up=d.mr>d.mb, name=d.id==='piano' ? 'Il tuo piano' : d.k+(d.on?'':' · fuori dal piano');
    const todo = d.id==='piano' ? (up?'Buon periodo.':'Controlla la disciplina nel Journal.') : d.on ? (up?'Lascialo nel piano.':'Se continua, valuta di toglierlo.') : 'Se continua, valuta di aggiungerlo.';
    return '<div class="op-w '+(up?'up':'down')+'" style="--k:'+i+'" title="Per caso succede '+(d.p<.01?'meno di 1 volta':Math.round(d.p*100)+' volte')+' su 100"><span class="op-wi">'+ic(up?'trendUp':'trendDn',16,2.4)+'</span>'+
      '<div class="op-wm"><b>'+esc(name)+'</b><small>'+(d.dim?esc(d.dim)+' · ':'')+'ultime '+d.win+' sett. · '+d.c+' trade · '+todo+'</small></div>'+
      '<div class="op-wv"><span class="num '+sgn(d.mb)+'">'+fmtN(d.mb,2,true)+'</span>'+ic('chev',13,2.6)+'<b class="num '+sgn(d.mr)+'">'+fmtN(d.mr,2,true)+'</b></div></div>'; }).join('')+'</div>'; }
function optMktCard(O) { const M=O.mkt; if (!M) return '';
  const T=M.T, ld=M.lead, cur=M.cur;
  const head = M.kind==='go' ? ['trendUp',M.one?'Passa a '+ld+' per ora':'Per ora solo '+ld] : M.kind==='mid' ? ['alert',ld+' è davanti, ma è presto per cambiare'] : ld===M.one ? ['check','Resta su '+cur] : ['check','Resterei su '+cur];
  const why = ld===M.one ? 'È davanti anche nelle ultime 4 settimane.'
    : ld+' è davanti nelle ultime 4 settimane: '+fRw(M.l4.lead)+' R a settimana contro '+fRw(M.l4.cur)+(M.one?'':' del piano')+'. '+(
      M.kind==='go' ? 'Nello storico, seguire il mercato più in forma ha reso di più'+(M.one?': torna su '+cur+' quando torna davanti.':' che tradarli tutti e due.')
      : M.kind==='mid' ? 'Nello storico seguire il mercato più in forma ha reso un po\' di più, ma potrebbe essere un caso (probabilità '+pct(T.p)+').'
      : T.k ? 'Ma nello storico cambiare mercato seguendo quello più in forma non ha reso di più.' : 'Nello storico non è mai stato davanti per 4 settimane di fila: non so ancora se seguirlo paga.');
  const d=pdIso(T.from);
  return '<div class="card wide rise op-mkt"><div class="card-h"><h2 class="h2">Quale mercato</h2><span class="sub">ognuno da solo con le regole del piano</span></div>'+
    '<div class="op-verd'+(M.kind==='go'?' go':M.kind==='mid'?' mid':'')+'"><span class="op-ic">'+ic(head[0],18,2.4)+'</span><div><b>'+esc(head[1])+'</b><span>'+esc(why)+'</span></div></div>'+
    optTable(M.rows,'rw',fRw,{ head:'R a settimana' })+
    (T.n ? '<p class="op-leg">Il test: dal '+d.getDate()+' '+MESI[d.getMonth()]+', ogni settimana il mercato che aveva fatto meglio nelle 4 settimane prima ('+T.cnt.map(c=>c[0]+' '+c[1]).join(', ')+' settimane). Avrebbe fatto '+fRw(T.sw)+' R a settimana, contro '+fRw(T.st)+' restando su '+esc(cur)+'.</p>' : '')+'</div>'; }
// il dettaglio, diviso in schede
function optDetCard(O) { const t=S.optTab||'g';
  return '<details class="card wide rise op-det"'+(S.optDet?' open':'')+'><summary><span class="op-ds">'+ic('chev',15,2.4)+'<b>Tutti i numeri</b></span><span class="sub">gestioni, regole del giorno, setup, orari, contesto</span></summary>'+
    seg('opt-tab',OPT_TABS,t,'op-tabs')+'<div id="op-det">'+optDetBody(O,t)+'</div></details>'; }
function optDetBody(O, t) {
  if (t==='g') return '<div class="op-gg"><div>'+optMgSec(O)+'</div><div>'+optDaySec(O)+'</div></div>';
  return '<p class="op-leg">Con il resto del piano; sotto ogni valore, il numero di trade. La freccia dice se negli ultimi 3 mesi rende di più o di meno.</p>'+
    '<div class="op-gg">'+O.groups.filter(g=>OPT_TG[t].includes(g.id)).map(g=>optGroupSec(O,g)).join('')+'</div>'; }
function optMgSec(O) {
  const fam=g=>g.k==='T' && !g.be ? ['Target fisso', fmtX(g.t)+'R'] : g.k==='T' ? ['Target con stop a BE', fmtX(g.t)+'R · BE a '+fmtX(g.be)+'R']
    : g.t1===2 && (g.s===1 || g.s===0) ? ['Metà a 2R, stop '+(g.s?'a +1R':'a BE'), 'resto a '+fmtX(g.t2)+'R'] : ['Il tuo piano', optCap(mgTxt(g,true))];
  const rows=O.mg.map(m=>{ const f=fam(m.g); return { grp:f[0], l:f[1], cur:m.cur, nums:m.nums }; });
  const ord=['Il tuo piano','Target fisso','Target con stop a BE','Metà a 2R, stop a +1R','Metà a 2R, stop a BE']; rows.sort((a,b)=>ord.indexOf(a.grp)-ord.indexOf(b.grp));
  const nb=O.B.ts.filter(x=>{ if (x.pth===undefined) x.pth=notePath(x.t.raw.Note); return !!x.pth; }).length;
  return optTable(rows,'rw',fRw,{ head:'Uscita' })+
    '<p class="op-leg">Stop a BE e parziali sono calcolati seguendo il percorso scritto nelle note ('+nb+' trade su '+O.B.ts.length+'): se dopo la fine della nota non si sa cosa è successo prima, conta il caso peggiore. Il target fisso è esatto dal Max Real RR.</p>'; }
function optDaySec(O) {
  const rows=O.days.filter(d=>d.cur || d.q.sll===0 || d.q.sll===O.P.sll).map(d=>({ l:dayRuleTxt(d.q,true).replace(/ · max −[\d,]+ R$/,''), cur:d.cur, nums:d.nums }));
  return optTable(rows,'rw',fRw,{ head:'Regole del giorno', cols:[0,1,2] }); }
function optGroupSec(O, g) {
  const find=(k,on)=>O.moves.find(m=>m.cat===g.id && m.l===(on?'togli ':'aggiungi ')+(g.id==='giorni'?k.toLowerCase():k) && m.c.verdict);
  let t='<div class="tbl-wrap"><table class="ex-t op-t op-g"><tr><th>'+esc(g.name)+'</th><th>Tutto</th><th>3 mesi</th><th>4 sett.</th></tr>';
  g.rows.forEach(r=>{ const m=['idee','bande','giorni','asset'].includes(g.id) ? find(r.k, r.on) : null, v=m && OPT_V[m.c.verdict];
    const note=v ? '<small><b class="'+v[2]+'">'+(r.on?'da togliere':'da aggiungere')+' · '+v[1].toLowerCase()+'</b></small>' : r.on ? '' : '<small>fuori dal piano</small>';
    t+='<tr class="'+(r.on?'':'off')+'"><td>'+esc(r.k)+(r.tr?'<i class="op-tr '+(r.tr>0?'up':'down')+'">'+ic(r.tr>0?'trendUp':'trendDn',13,2.4)+'</i>':'')+note+'</td>'+
      r.w.map(w=>'<td class="num '+sgn(w.rt)+'">'+(w.n?fRt(w.rt):'–')+'<small>'+w.n+'</small></td>').join('')+'</tr>'; });
  return t+'</table></div>'; }
function optAiCard() {
  return '<div class="card wide rise op-ai"><span class="op-ic">'+ic('spark',18,2.2)+'</span><div class="op-ai-t"><b>Chiedi a Claude</b><span>Vede il tuo piano e tutti questi numeri.</span></div>'+
    '<div class="op-ai-b"><button type="button" class="btn sm" data-act="optai">Commenta</button><button type="button" class="btn sec sm" data-act="optask">Fai una domanda</button></div></div>'; }
function optHowCard(O) {
  return '<details class="card wide rr-how rise op-how"><summary>'+ic('chev',15,2.2)+'Come funziona</summary><ul>'+
    '<li><b>Il confronto.</b> Ogni alternativa cambia una sola cosa del piano (le '+O.moves.length+' che cambiano almeno un trade) e si confronta con il piano settimana per settimana, in R a settimana: conta sia quanto rende un trade sia quanti trade fai. Solo settimane chiuse.</li>'+
    '<li><b>Storico e recente.</b> Ricampiono le settimane mille volte in due modi: tutte uguali, e con più peso alle recenti (il peso si dimezza ogni '+OPT_HL+' settimane). La probabilità è quante volte il miglioramento resta positivo.</li>'+
    '<li><b>Conviene</b>: almeno 99% con il peso sulle recenti e 95% tutte uguali, meglio anche negli ultimi 3 mesi, non peggio nelle ultime 4 e nelle ultime 3 settimane, almeno 8 trade che cambiano e drawdown non molto peggiore. <b>Da provare</b>: almeno 90% e 75%, oppure 95% su tutto lo storico e 80% sul recente.</li>'+
    '<li><b>Perché soglie così alte.</b> Su tante alternative qualcuna sembra buona per caso: rimescolando a caso gli esiti dei trade, un falso «conviene» esce circa una volta ogni 10 analisi, un falso «da provare» una ogni 3.</li>'+
    '<li><b>Il mercato di adesso.</b> Una modifica è «forte di recente» se nelle ultime 3 settimane rende almeno 1 R a settimana in più su almeno 4 trade, è positiva anche nelle ultime 4 settimane e nei 3 mesi e non è negativa sullo storico. Il piano per adesso unisce queste modifiche a quelle che convengono sullo storico. Si propone solo se, rifacendo la ricerca ogni settimana con i soli dati di prima, seguirlo ha reso più del tuo piano, e in più settimane di quante ha fatto peggio: il numero grande in alto è proprio quella differenza. Una singola modifica «forte di recente» da sola vale poco (3 settimane sono poche, può essere un caso): provala in piccolo.</li><li><b>Niente senno di poi.</b> Le regole del giorno (stop dopo il primo TP, dopo le perdite, perdita massima, un trade alla volta) reagiscono solo ai trade già chiusi quando entra il successivo. Un vincente è chiuso quando tocca il target (Holding time); per chi perde non c\'è un orario e conto circa 5 minuti per R dall\'ultimo livello toccato. Se ES e NQ entrano insieme, il secondo era già dentro quando il primo ha chiuso: conta.</li><li><b>Cosa sta cambiando.</b> Per il piano e per ogni setup, mercato, orario e condizione confronto i R a trade delle ultime 4, 6, 8 o 13 settimane con quelli di prima. Rimescolo l\'ordine dei trade centinaia di volte: lo segnalo solo se una differenza così grande esce per caso al massimo 5 volte su 100. Nella prova sul passato i cambiamenti segnalati sono continuati nelle settimane dopo.</li>'+
    '<li><b>Il piano migliore</b> compare solo se è sicuro: mette insieme le modifiche che convengono, una alla volta; rifacendo la stessa ricerca senza le ultime settimane deve trovare le stesse modifiche, e in quelle settimane (che non ha visto) deve fare meglio del tuo piano. Inoltre, rifacendo l\'analisi ogni settimana con i soli dati di prima, seguirla non deve aver reso meno del tuo piano.</li>'+
    '<li><b>Uscite.</b> Il target fisso è esatto dal Max Real RR. Stop a BE e parziali seguono il percorso scritto nelle note («raggiunge 2rr, torna a 1rr…»): se dopo la fine della nota non si sa cosa è successo prima, conta il caso peggiore.</li>'+
    '<li><b>Quale mercato.</b> Ogni mercato da solo con tutte le regole del piano. Il test tradava ogni settimana il mercato che aveva fatto meglio nelle 4 settimane prima: «passa» solo se così avrebbe reso più del piano con probabilità almeno dell\'85%.</li></ul></details>'; }
// pulsanti della pagina e della scheda del piano
function optClick(b) {
  if (S.sheet==='plan' && b.closest('#sh-body')) return planClick(b);
  const tg=b.closest('[data-seg="opt-tab"]');
  if (tg) { if (!b.dataset.v) return true; S.optTab=b.dataset.v; setSeg(tg,S.optTab); const d=$('op-det'), O=S._opt;
    if (d && O) { d.innerHTML=optDetBody(O,S.optTab); const sb=tg.closest('.card').querySelector('.card-h .sub'); if (sb) sb.textContent=S.optTab==='g'?'R a settimana':'R a trade'; } return true; }
  const a=b.dataset.act;
  if (a==='planedit') { openPlan(); return true; }
  if (a==='planundo') { if (S._planPrev) { CFG.piano=S._planPrev; S._planPrev=null; planSaved(); toast('Piano com\'era prima'); renderCurrent(true); } return true; }
  if (a==='optstep') { const O=S._opt, G=O && (O.now||O.best); if (!G) return true; optPick(O); const l=G.steps[+b.dataset.i].l;
    S.optOff = S.optOff.includes(l) ? S.optOff.filter(x=>x!==l) : S.optOff.concat(l);
    const el=document.querySelector('.op-hero'), t=document.createElement('div'); t.innerHTML=optHero(O,true); el.replaceWith(t.firstElementChild);
    const c=$('c-opt'); if (c) optChart(c, O); return true; }
  if (a==='optapply' || a==='optall' || a==='optnow') {
    if (!b.classList.contains('arm')) { b.classList.add('arm'); const t=b.innerHTML; b.textContent='Conferma'; setTimeout(()=>{ if (b.isConnected) { b.classList.remove('arm'); b.innerHTML=t; } }, 3500); return true; }
    const O=S._opt; if (!O) return true; const prev=JSON.parse(JSON.stringify(PL()));
    if (a==='optapply') { const m=O.moves[+b.dataset.mv]; if (!m) return true; CFG.piano=JSON.parse(JSON.stringify(m.P)); planSaved(prev); toast('Piano aggiornato: '+m.l); }
    else { const K=optPick(O); if (!K || !K.on.length) return true; CFG.piano=JSON.parse(JSON.stringify(K.P)); S.optOff=[]; planSaved(prev);
      toast((a==='optnow' && K.all ? 'Piano adattato al mercato di adesso: ' : 'Piano aggiornato: ')+K.on.length+(K.on.length===1?' modifica':' modifiche')); }
    renderCurrent(true); window.scrollTo({ top:0, behavior:'smooth' }); return true; }
  if (a==='optai') { openChat(); sendChat('Guarda l\'ottimizzazione del mio piano: cosa cambieresti, cosa terresti d\'occhio e cosa non toccheresti? Usa i numeri della pagina e dimmi quanto ti fidi di ogni indicazione.'); return true; }
  if (a==='optask') { openChat(); return true; }
  return false; }
// contesto per Claude quando la chat parte da questa pagina: piano, numeri per periodo, proposte e gruppi
function optCtx() { const O=optAll(); if (!O) return 'servono almeno 6 settimane di trade nell\'EOW';
  const w=n=>OPT_WIN.reduce((o,x,i)=>(o[x.l]={ R_a_settimana:r2(n[i].rw), R_a_trade:r2(n[i].rt), trade:n[i].n, vinti:r2(n[i].wr), drawdown_R:r2(n[i].dd), calo_attuale_dal_massimo_R:r2(n[i].cur) }, o), {});
  const c=m=>({ modifica:m.l, verdetto:OPT_V[m.c.verdict]?OPT_V[m.c.verdict][1]:'nessuno', R_a_settimana_in_piu:{ tutto:r2(m.c.all), ultimi_3_mesi:r2(m.c.m3), ultimo_mese:r2(m.c.m1), ultime_3_settimane:r2(m.c.w3) }, probabilita_che_sia_vero:r2(m.c.p), trade_che_cambiano:m.c.aff });
  return { nota:'Backtest sui trade dell\'EOW: ogni alternativa simulata con le regole del piano e confrontata settimana per settimana. «Conviene» con probabilità ≥ 99% (pesata sulle settimane recenti) e ≥ 95% (tutte uguali), «da provare» con ≥ 90% e ≥ 75% (o ≥ 95% su tutte le settimane e ≥ 80% pesata): con decine di alternative provate un «da provare» falso esce circa una volta su tre. Esiti: target fisso esatto dal Max Real RR; stop a BE e parziali calcolati dal percorso scritto nelle note dei trade (caso peggiore quando la nota non basta). Le regole del giorno reagiscono solo ai trade già chiusi quando entra il successivo (niente senno di poi).',
    periodo:optDates(O.B), settimane:O.B.weeks.length, piano:planDesc(O.P), risultati_del_piano:w(O.nums),
    consigliate:O.sugg.map(c), da_provare:O.hint.map(c), ultime_3_settimane:O.recent.map(m=>Object.assign(c(m), { trade_cambiati_nelle_ultime_3_settimane:m.c.aff3 })), da_tenere_d_occhio:O.drift.map(d=>({ cosa:d.id==='piano'?'il piano intero':d.dim+': '+d.k, nel_piano:d.on, R_a_trade_ultime_settimane:r2(d.mr), settimane:d.win, trade_recenti:d.c, R_a_trade_prima:r2(d.mb), probabilita_che_sia_un_caso:r2(d.p) })), piano_per_il_mercato_di_adesso: O.now ? { modifiche:O.now.steps.map(x=>x.l+(x.c.verdict==='si'?' (confermata dallo storico)':' (forte nelle ultime 3 settimane)')), prova_sul_passato_R_a_settimana:{ seguendolo:r2(O.now.roll.rw), piano_fermo:r2(O.now.roll.rb), settimane:O.now.roll.n, settimane_meglio:O.now.roll.up, settimane_peggio:O.now.roll.dn } } : null, piano_migliore:{ sicuro:!!O.best, nota:'si propone solo se trovato con i «conviene», trovato uguale anche senza le ultime settimane e migliore del piano proprio in quelle', modifiche:O.greedy.steps.map(s=>s.l), risultati:w(O.greedyNums) },
    quale_mercato:O.mkt ? { nota:'ogni mercato da solo con tutte le regole del piano; test: ogni settimana il mercato migliore delle 4 settimane prima, confrontato con il piano', mercati:O.mkt.rows.map(r=>({ mercato:r.l, del_piano:r.cur, R_a_settimana:OPT_WIN.reduce((o,x,i)=>(o[x.l]=r2(r.nums[i].rw), o), {}) })),
      davanti_nelle_ultime_4_settimane:O.mkt.lead, verdetto:{ go:'passa per ora', mid:'davanti ma presto per cambiare', stay:'resta' }[O.mkt.kind],
      test_cambio_mercato:{ settimane:O.mkt.T.n, settimane_fuori_dal_piano:O.mkt.T.k, R_a_settimana_cambiando:r2(O.mkt.T.sw), R_a_settimana_restando:r2(O.mkt.T.st), probabilita_che_sia_meglio:r2(O.mkt.T.p) } } : null,
    prova_sul_passato:O.roll ? { nota:'ogni settimana, dalla metà dello storico, la ricerca rifatta con i soli dati di prima e il piano proposto tenuto per la settimana dopo', settimane:O.roll.n, settimane_con_piano_cambiato:O.roll.ch, R_a_settimana_seguendo_ottimizza:r2(O.roll.rw), R_a_settimana_piano:r2(O.roll.rb) } : null,
    verifica_sulle_ultime_settimane_non_viste:O.wf ? { settimane:O.wf.H, proposta_senza_quelle_settimane:O.wf.steps.map(s=>s.l), R_proposta:r2(O.wf.prop.R), R_piano:r2(O.wf.plan.R) } : null,
    gestioni:O.mg.map(m=>({ gestione:mgTxt(m.g), del_piano:m.cur, R_a_settimana:OPT_WIN.reduce((o,x,i)=>(o[x.l]=r2(m.nums[i].rw), o), {}) })),
    gruppi:O.groups.map(g=>({ dimensione:g.name, valori:g.rows.map(r=>({ valore:r.k, nel_piano:r.on, R_a_trade:{ tutto:r2(r.w[0].rt), ultimi_3_mesi:r2(r.w[1].rt), ultimo_mese:r2(r.w[2].rt) }, trade:{ tutto:r.w[0].n, ultimi_3_mesi:r.w[1].n, ultimo_mese:r.w[2].n }, mesi_positivi:r.mPos+'/'+r.mTot })) })) }; }


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['ottimizza.js'] = '2026-11-14.2';

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
const planWhat = P => P.asset.join(' e ')+' · '+(P.idee.length===L.idea.length ? 'tutte le idee' : P.idee.join(', '));
function planDesc(P) { P=P||PL(); const c=planCond(P);
  return { mercati_e_setup:planWhat(P), condizioni:c.length?c.join(', '):'nessun vincolo', orari:planWhen(P), gestione:mgTxt(P.g), regole_del_giorno:dayRuleTxt(P), altre_regole:P.altro||'' }; }
function planSumHtml(P) { P=P||PL(); const c=planCond(P), row=(i,l,v)=>'<div class="pl-r">'+ic(i,16,2)+'<span>'+l+'</span><b>'+esc(v)+'</b></div>';
  return '<div class="pl-sum">'+row('list','Mercati e setup',planWhat(P))+row('filter','Condizioni',c.length?c.join(' · '):'nessun vincolo')+row('clock','Orari',planWhen(P))+
    row('target','Gestione',mgTxt(P.g))+row('shield','Regole del giorno',dayRuleTxt(P))+(P.altro?row('book','Altre regole',P.altro):'')+'</div>'; }
// ogni modifica del piano si salva subito ed è sincronizzata; le pagine che lo usano si ricalcolano
function planSaved(prev) { if (prev) S._planPrev=prev; normPiano(); syncTouch('piano'); S._opt=null; }
function openPlan() { S.sheet='plan'; $('sh-sub').textContent='Impostazioni · uguale su telefono e PC'; $('sh-title').innerHTML=words('Il mio piano'); renderPlanSheet(); openSheet(); }
function renderPlanSheet() {
  const P=PL(), g=P.g, el=$('sh-body'), top=el.scrollTop, x=v=>({ v, l:fmtX(v)+'R' }), sec=(t,sub,b)=>'<div class="fsec"><div class="fsec-h"><div class="h2">'+t+'</div>'+(sub?'<span class="mut" style="font-size:12.5px">'+sub+'</span>':'')+'</div>'+b+'</div>', f=(l,b,hint)=>'<div class="field"><span class="flabel">'+l+'</span>'+b+(hint?'<span class="hint">'+hint+'</span>':'')+'</div>';
  let h=sec('Cosa tradi','',f('Mercati · anche tutti e due',chips('pl-asset',L.asset,P.asset,true))+f('Idee 5m che fanno parte del piano',chips('pl-idee',L.idea,P.idee,true))+
    f('Direzione',seg('pl-dir',[{v:'',l:'Long e Short'},'Long','Short'],P.dir)));
  h+=sec('Condizioni d\'ingresso','lascia «indifferente» quello che non guardi',
    f('SMT',seg('pl-smt',[{v:'',l:'Indifferente'},{v:'nosf',l:'Non a sfavore'},{v:'fav',l:'Solo a favore'}],P.smt))+
    '<div class="g2">'+f('Coming from LVN',seg('pl-lvn',[{v:'',l:'Indiff.'},{v:'Si',l:'Sì'},{v:'No',l:'No'}],P.lvn))+f('1m pulito obbligatorio',seg('pl-clean',[{v:'',l:'Indiff.'},{v:'si',l:'Sì'}],P.clean))+'</div>'+
    f('2° CC',seg('pl-cc2',[{v:'',l:'Indifferente'},{v:'si',l:'Obbligatoria'},{v:'no',l:'Esclusa'}],P.cc2))+
    f('Candele di pullback',seg('pl-pb',[{v:'',l:'Tutte'},{v:'2',l:'Fino a 2'},{v:'3',l:'Fino a 3'},{v:'4',l:'Fino a 4'}],pbKey(P.pb)))+
    f('News',seg('pl-news',[{v:'',l:'Tutti i giorni'},{v:'nored',l:'No Red News'},{v:'none',l:'Solo senza'}],P.news)));
  h+=sec('Quando','',f('Fasce orarie',chips('pl-bande',bandNames(),P.bande,true),'Con Wall Street che apre alle 15:30: nelle settimane del cambio d\'ora l\'app le sposta da sola.')+f('Giorni',chips('pl-giorni',L.days,P.giorni,true)));
  h+=sec('Gestione del trade','',f('Come esci',seg('pl-gk',[{v:'P',l:'A parziali'},{v:'T',l:'Target fisso'}],g.k))+
    (g.k==='T' ? f('Target',chips('pl-gt',PLAN_MG.T.map(x),g.t))
    : f('Prima metà a',chips('pl-gt1',PLAN_MG.P1.map(x),g.t1))+f('Poi lo stop del resto va a',seg('pl-gs',[{v:0,l:'BE'},{v:.5,l:'+0,5R'},{v:1,l:'+1R'}],g.s))+f('Resto a',chips('pl-gt2',PLAN_MG.P2.map(x),g.t2)))+
    '<p class="hint" style="margin:0">In breve: '+esc(mgTxt(g))+'.</p>');
  h+=sec('Regole del giorno','',f('Trade al giorno, al massimo',seg('pl-maxN',[{v:1,l:'1'},{v:2,l:'2'},{v:3,l:'3'},{v:0,l:'Nessuno'}],P.maxN))+
    f('Stop dopo il primo trade in profitto',seg('pl-sw',[{v:1,l:'Sì'},{v:0,l:'No'}],P.sw))+f('Stop dopo le perdite',seg('pl-sll',[{v:0,l:'No'},{v:1,l:'Dopo la prima'},{v:2,l:'Dopo 2'}],P.sll))+
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
  else if (name==='gt') P.g.t=n;
  else if (name==='gt1') { P.g.t1=n; if (P.g.t2<=n) P.g.t2=PLAN_MG.P2.find(x=>x>n); }
  else if (name==='gs') P.g.s=n;
  else if (name==='gt2') { if (n<=P.g.t1) { toast('Il resto deve uscire oltre la prima metà', true); return true; } P.g.t2=n; }
  else if (['maxN','sw','sll'].includes(name)) P[name]=n;
  else P[name]=v;
  CFG.piano=P; planSaved(prev); renderPlanSheet(); return true;
}
document.addEventListener('change', e => { const k=e.target.dataset && e.target.dataset.pl; if (!k || S.sheet!=='plan') return;
  const prev=JSON.parse(JSON.stringify(PL()));
  if (k==='lossR') { const v=numS(e.target.value); CFG.piano.lossR = isFinite(v) && v>0 ? v : 0; } else CFG.piano.altro=e.target.value;
  planSaved(prev); toast('Piano salvato'); });

// ───────────────────────── OTTIMIZZA ─────────────────────────
// Il piano contro le alternative sui trade dell'EOW (backtest dal Max Real RR), settimana per settimana: su tutto lo
// storico, sugli ultimi 3 mesi, sull'ultimo mese e sulle ultime 2 settimane. Una modifica è consigliata solo se migliora i R
// a settimana con buona probabilità (ricampionando le settimane, con più peso alle recenti), non peggiora l'ultimo mese e
// cambia l'esito di abbastanza trade da non essere un caso. Le note dei trade non si usano (ci sono solo per chi arriva a 2R e
// non sono aggiornate): il target fisso è esatto, le parziali sono una stima per eccesso e non entrano nei consigli.
const OPT_WIN = [{ k:'all', l:'Tutto' }, { k:13, l:'3 mesi' }, { k:4, l:'4 sett.' }, { k:2, l:'2 sett.' }];
const OPT_HL = 12;           // peso delle settimane: si dimezza ogni 12 settimane andando indietro (con 6 la prova sul passato
                             // dava consigli peggiori: le ultime settimane da sole sono troppo rumorose)
// soglie tarate rimescolando a caso gli esiti dei trade (nessun legame tra filtri ed esito): vedi optnull in CLAUDE.md.
// p = probabilità con le settimane recenti pesate di più, pa = tutte uguali. «Conviene» non deve peggiorare troppo il drawdown.
const optDDok = c => c.ddV >= c.ddB - Math.max(2, .3*Math.abs(c.ddB));
function optVerdict(c) {
  if (!c.aff) return '';
  const ok = c.all>0 && c.m3>=0 && c.m1>=0;
  if (c.aff>=8 && c.p>=.99 && c.pa>=.95 && ok && c.m3>0 && c.wm>=.2 && optDDok(c)) return 'si';
  if (c.aff>=6 && ok && c.wm>=.15 && ((c.p>=.9 && c.pa>=.75) || (c.pa>=.95 && c.p>=.8))) return 'indizio';
  if (c.aff>=8 && c.m1>.5 && c.m3>.25 && c.wm>.25 && c.p>=.8 && c.pa<.75) return 'recente';
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
// esito di un trade con la gestione g, dal Max Real RR. Target fisso: esatto. Parziali: metà a t1; il resto a t2 se il Max
// Real RR ci arriva, altrimenti allo stop spostato a s. Non si sa se prima di t2 il prezzo è tornato allo stop: stima per eccesso.
function optR(B, x, g) { const mx=x.mx;
  if (g.k==='T') return mx>=g.t-1e-9 ? g.t : -1;
  if (mx<g.t1-1e-9) return -1;
  return .5*g.t1 + .5*(mx>=g.t2-1e-9 ? g.t2 : g.s); }
function optPass(P, x) { const t=x.t;
  if (!P.asset.includes(/NQ/i.test(t.a||'')?'NQ':'ES') || !P.idee.includes(t.idea) || !P.giorni.includes(t.day) || !P.bande.includes(x.band)) return false;
  if ((P.dir && t.dir!==P.dir) || (P.smt==='fav' && t.smt!=='SMT a favore') || (P.smt==='nosf' && t.smt==='SMT a sfavore')) return false;
  if ((P.lvn && t.lvn!==P.lvn) || (P.clean && !t.clean) || (P.cc2==='si' && !t.cc2) || (P.cc2==='no' && t.cc2)) return false;
  if ((P.news==='nored' && t.news==='Red News') || (P.news==='none' && t.news!=='No News Day')) return false;
  if (P.pb.length && !P.pb.includes(x.pb)) return false;
  return true; }
// simulazione del piano: i trade presi giorno per giorno con le regole del giorno, i R per settimana e l'esito di ogni trade
function optSim(B, P) {
  const W=B.weeks.length, wR=new Float64Array(W), wN=new Float64Array(W), rs=new Map(), seq=[];
  let day='', n=0, stop=false, ls=0, R=0;
  B.ts.forEach((x,i)=>{ if (!optPass(P,x)) return;
    if (x.day!==day) { day=x.day; n=0; stop=false; ls=0; R=0; }
    if (stop || (P.maxN && n>=P.maxN) || (P.sll && ls>=P.sll) || (P.lossR && R<=-P.lossR+1e-9)) return;
    const r=optR(B,x,P.g); n++; R+=r; if (r<0) ls++; if (P.sw && r>0) stop=true;
    const w=B.wi[x.wk]; wR[w]+=r; wN[w]++; rs.set(i,r); seq.push([w,r]); });
  return { wR, wN, rs, seq }; }
// i numeri di una simulazione nelle ultime n settimane (fino alla settimana «to», esclusa)
function optNums(B, sim, n, to) { to=to??B.weeks.length; const from=Math.max(0, to-(n==='all'?to:n)), k=to-from; let R=0, N=0, w=0, eq=0, pk=0, dd=0;
  sim.seq.forEach(([wk,r])=>{ if (wk<from || wk>=to) return; R+=r; N++; if (r>0) w++; eq+=r; if (eq>pk) pk=eq; if (eq-pk<dd) dd=eq-pk; });
  return { R, n:N, wk:k, rw:k?R/k:NaN, rt:N?R/N:NaN, wr:N?w/N:NaN, dd }; }
// generatore di numeri casuali con seme: gli stessi dati danno sempre lo stesso risultato
function optRng(seed) { let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
// confronto di una variante con il piano, settimana per settimana nelle settimane [0, to)
function optCmp(B, base, v, to, N) {
  to=to??B.weeks.length; N=N||1000; const d=[], w=[]; for (let i=0;i<to;i++) { d.push(v.wR[i]-base.wR[i]); w.push(Math.pow(.5,(to-1-i)/OPT_HL)); }
  const mean=(a,b)=>{ const s=d.slice(Math.max(0,to-a)); return s.length ? s.reduce((x,y)=>x+y,0)/s.length : 0; };
  const W=w.reduce((x,y)=>x+y,0), wm=d.reduce((s,x,i)=>s+x*w[i],0)/W;
  const rng=optRng(to*7919+Math.round(wm*1e4)); let pos=0, posA=0;
  for (let k=0;k<N;k++) { let s=0, sw=0, sa=0; for (let i=0;i<to;i++) { const j=Math.floor(rng()*to); s+=d[j]*w[j]; sw+=w[j]; sa+=d[j]; } if (s/sw>0) pos++; if (sa>0) posA++; }
  let aff=0; const keys=new Set([...base.rs.keys(), ...v.rs.keys()]);
  keys.forEach(i=>{ const wk=B.wi[B.ts[i].wk]; if (wk<to && base.rs.get(i)!==v.rs.get(i)) aff++; });
  const c={ all:mean(to), m3:mean(13), m1:mean(4), w2:mean(2), wm, p:pos/N, pa:posA/N, aff, ddB:optNums(B,base,'all',to).dd, ddV:optNums(B,v,'all',to).dd };
  c.verdict=optVerdict(c); return c; }
// le modifiche possibili a partire da un piano: [categoria, testo, nuovo piano]
const OPT_GS = () => [...PLAN_MG.T.map(t=>({ k:'T', t })), ...PLAN_MG.P2.map(t2=>({ k:'P', t1:2, s:1, t2 }))];
function optMoves(B, P) {
  const out=[], cp=()=>JSON.parse(JSON.stringify(P)), add=(cat,l,f)=>{ const q=cp(); f(q); out.push({ cat, l, P:q }); };
  // le parziali sono stimate per eccesso: nei consigli si confrontano solo target fissi, e solo se il piano ha un target fisso
  if (P.g.k==='T') PLAN_MG.T.forEach(t=>{ if (t!==P.g.t) add('g', 'gestione: target '+fmtX(t)+'R', q=>{ q.g={ k:'T', t }; }); });
  [['ES'],['NQ'],['ES','NQ']].forEach(a=>{ if (a.join()!==P.asset.join()) add('asset', a.length>1?'ES e NQ':'solo '+a[0], q=>{ q.asset=a; }); });
  const tog=(cat,key,all,v,lbl)=>{ const on=P[key].includes(v); if (on && P[key].length<2) return; add(cat, (on?'togli ':'aggiungi ')+lbl, q=>{ q[key]=on ? q[key].filter(x=>x!==v) : all.filter(x=>q[key].includes(x)||x===v); }); };
  L.idea.forEach(i=>tog('idee','idee',L.idea,i,i)); bandNames().forEach(b=>tog('bande','bande',bandNames(),b,b)); L.days.forEach(d=>tog('giorni','giorni',L.days,d,d.toLowerCase()));
  const opt=(cat,key,vals,lbl)=>vals.forEach(v=>{ if (v!==P[key]) add(cat, lbl(v), q=>{ q[key]=v; }); });
  opt('ctx','news',['','nored','none'],v=>v?PL_NEWS[v]:'tutti i giorni di news'); opt('ctx','smt',['','nosf','fav'],v=>v?PL_SMT[v]:'SMT indifferente');
  opt('ctx','lvn',['','Si','No'],v=>v?PL_LVN[v]:'LVN indifferente'); opt('ctx','clean',['','si'],v=>v?'solo 1m pulito':'1m pulito indifferente');
  if (B.cc2) opt('ctx','cc2',['','si','no'],v=>v?PL_CC2[v]:'2° CC indifferente'); if (B.dir) opt('ctx','dir',['','Long','Short'],v=>v?'solo '+v:'Long e Short');
  ['','2','3','4'].forEach(k=>{ if (k!==pbKey(P.pb)) add('ctx', k?'fino a '+k+' candele di pullback':'tutte le candele di pullback', q=>{ q.pb=PLAN_PB[k]; }); });
  opt('day','maxN',[1,2,3,0],v=>v?'al massimo '+v+' trade al giorno':'nessun limite di trade al giorno'); opt('day','sw',[0,1],v=>v?'stop dopo il primo TP':'niente stop dopo il primo TP');
  opt('day','sll',[0,1,2],v=>v?'stop dopo '+(v===1?'la prima perdita':'2 perdite'):'niente stop dopo le perdite');
  opt('day','lossR',[1,2,3,0],v=>v?'perdita massima −'+v+' R al giorno':'nessun limite di perdita al giorno');
  return out; }
// ricerca a passi: dal piano, una modifica alla volta (la migliore tra quelle che passano il test), al massimo 4
function optGreedy(B, P0, to, ok, simOf, N) {
  ok=ok||['si']; simOf=simOf||(q=>optSim(B,q)); let P=P0, base=simOf(P); const steps=[];
  for (let k=0;k<4;k++) { let best=null;
    optMoves(B,P).forEach(m=>{ const v=simOf(m.P), c=optCmp(B,base,v,to,N); if (ok.includes(c.verdict) && (!best || c.wm>best.c.wm)) best={ m, v, c }; });
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
  const ord={ recente:1, calo:2 };
  const sugg=moves.filter(m=>m.c.verdict==='si').sort((a,b)=>b.c.wm-a.c.wm), hint=moves.filter(m=>m.c.verdict==='indizio').sort((a,b)=>b.c.p-a.c.p||b.c.wm-a.c.wm),
    watch=moves.filter(m=>(m.c.verdict==='recente'||m.c.verdict==='calo') && m.cat!=='asset').sort((a,b)=>ord[a.c.verdict]-ord[b.c.verdict]||b.c.m1-a.c.m1);
  // una sola proposta per categoria di gestione, asset e regole (sono alternative tra loro)
  const one=l=>{ const seen=new Set(); return l.filter(m=>{ const k=['g','asset','day'].includes(m.cat)?m.cat:m.l; if (seen.has(k)) return false; seen.add(k); return true; }); };
  const mkt=optMkt(B,P,base);
  // il piano migliore si propone solo se è sicuro: trovato con i «conviene», trovato uguale anche senza le ultime settimane,
  // meglio del piano proprio in quelle settimane non viste, e il metodo non ha fatto peggio del piano nella prova sul passato
  // (le modifiche proposte devono essere tutte tra quelle trovate senza le ultime settimane, e il piano proposto deve fare meglio
  // del tuo proprio in quelle settimane)
  const blind = !!wf && greedy.steps.every(x=>wf.steps.some(y=>y.l===x.l)), held = wf ? optNums(B,greedy.sim,H).R : NaN;
  const why = !greedy.steps.length ? '' : !wf ? 'poche' : !blind ? 'recenti' : !(held>wfRes.plan.R) ? 'retto' : roll && roll.rw<roll.rb ? 'metodo' : '';
  const sure = !!greedy.steps.length && !why, best = sure ? greedy : null, doubt = why;
  if (wfRes) wfRes.held=held;
  return (S._opt={ B, key, P, base, nums:nums(base), mkt, moves, sugg:one(sugg).slice(0,6), hint:one([...(sure?[]:sugg), ...hint].filter(m=>!(best && best.steps.some(x=>x.l===m.l)))).slice(0,3), best, doubt, watch:one(watch).slice(0,4), mg, days, groups, greedy, greedyNums:nums(greedy.sim), wf:wfRes, roll, ms:performance.now()-t0 }); }
// prova del metodo sul passato: ogni settimana (dalla metà dello storico) rifà la ricerca con i soli dati di prima, come se
// usassi Ottimizza quel giorno, e tiene il piano proposto per la settimana dopo. Confronto con il piano fisso.
function optRoll(B, P, base, simOf) {
  const W=B.weeks.length, from=Math.max(8, Math.ceil(W/2)); if (W-from<4) return null;
  let R=0, Rb=0, ch=0;
  for (let t=from; t<W; t++) { const g=optGreedy(B,P,t,['si'],simOf,400);
    R+=g.sim.wR[t]; Rb+=base.wR[t]; if (g.steps.length) ch++; }
  const n=W-from; return { n, from:B.weeks[from], rw:R/n, rb:Rb/n, ch }; }
// quale mercato: ogni asset da solo con tutte le regole del piano, e un test sullo storico: ogni settimana si tradava il mercato
// che aveva fatto meglio nelle 4 settimane prima. Ha reso più del piano? Dice se conviene cambiare mercato per un periodo.
const OPT_LB = 4;
function optMkt(B, P, base) {
  const W=B.weeks.length, as=[...P.asset.filter(a=>L.asset.includes(a)), ...L.asset.filter(a=>!P.asset.includes(a))];   // a parità vince quello del piano
  if (as.length<2) return null;
  const sims={}; as.forEach(a=>{ sims[a]=optSim(B, Object.assign({}, P, { asset:[a] })); }); if (!as.every(a=>sims[a].seq.length)) return null;
  const nums=s=>OPT_WIN.map(w=>optNums(B,s,w.k)), one=P.asset.length===1 ? P.asset[0] : null;
  const rows=as.map(a=>({ l:a, cur:a===one, nums:nums(sims[a]) })); if (!one) rows.push({ l:P.asset.join(' e '), cur:true, nums:nums(base) });
  const lastR=(s,to,n)=>{ let r=0; for (let i=Math.max(0,to-n);i<to;i++) r+=s.wR[i]; return r; };
  const pick=to=>as.reduce((b,a)=>lastR(sims[a],to,OPT_LB)>lastR(sims[b],to,OPT_LB)?a:b, as[0]);
  const lead=pick(W), d=[], picks=[];
  for (let w=OPT_LB; w<W; w++) { const a=pick(w); picks.push(a); d.push(sims[a].wR[w]-base.wR[w]); }
  const n=d.length, mean=n?d.reduce((x,y)=>x+y,0)/n:0, rng=optRng(4242); let pos=0;
  if (n) for (let k=0;k<1000;k++) { let t=0; for (let i=0;i<n;i++) t+=d[Math.floor(rng()*n)]; if (t>0) pos++; }
  const sw=n?picks.reduce((x,a,i)=>x+sims[a].wR[OPT_LB+i],0)/n:0, st=n?base.wR.slice(OPT_LB).reduce((x,y)=>x+y,0)/n:0;
  const T={ n, d:mean, p:pos/1000, sw, st, k:picks.filter(a=>a!==one).length, cnt:as.map(a=>[a, picks.filter(x=>x===a).length]), from:B.weeks[OPT_LB] };
  const kind = lead===one ? 'stay' : T.k && T.d>0 && T.p>=.85 ? 'go' : T.k && T.d>0 && T.p>=.6 ? 'mid' : 'stay';
  return { rows, lead, one, cur:P.asset.join(' e '), l4:{ lead:lastR(sims[lead],W,OPT_LB)/OPT_LB, cur:lastR(base,W,OPT_LB)/OPT_LB }, T, kind }; }
function optGroups(B, P) {
  const W=B.weeks.length, all=Object.assign({}, P);
  const dims=[['asset','Mercati',x=>/NQ/i.test(x.t.a||'')?'NQ':'ES',L.asset,q=>{ q.asset=L.asset.slice(); }],
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
  return dims.map(([id,name,fn,keys,relax])=>{ const q=JSON.parse(JSON.stringify(all)); relax(q);
    const xs=B.ts.filter(x=>optPass(q,x)), rows=keys.map(k=>{ const g=xs.filter(x=>fn(x)===k); if (!g.length) return null;
      const r=x=>optR(B,x,P.g), win=n=>{ const from=W-(n==='all'?W:n), h=g.filter(x=>B.wi[x.wk]>=from); return { n:h.length, rt:h.length?h.reduce((s,x)=>s+r(x),0)/h.length:NaN }; };
      const months={}; g.forEach(x=>{ const m=x.day.slice(0,7); (months[m]=months[m]||[]).push(r(x)); }); const mv=Object.values(months).filter(a=>a.length>=3).map(a=>a.reduce((s,y)=>s+y,0));
      const w=[win('all'), win(13), win(4)], tr = w[1].n>=8 && w[0].n>=15 ? (w[1].rt-w[0].rt>.3 ? 1 : w[1].rt-w[0].rt<-.3 ? -1 : 0) : 0;
      return { k, on:inPlan[id](k), w, tr, mPos:mv.filter(x=>x>0).length, mTot:mv.length }; }).filter(Boolean);
    return { id, name, rows }; }).filter(g=>g.rows.length>1); }

// ── pagina ──
const OPT_V = { si:['check','Conviene','ok'], indizio:['spark','Da provare','try'], recente:['trendUp','Sta funzionando di recente','up'], calo:['trendDn','Funzionava, ora meno','down'] };
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
  const head=eb=>'<div class="stat-h rise"><div><div class="eyebrow">'+eb+'</div><h1>'+words('Ottimizza')+'</h1></div>'+
    '<button type="button" class="btn sec sm op-pl" data-act="planedit">'+ic('gear',16,2)+'Il mio piano</button></div>';
  if (!E) { const h=head('EOW · piano e alternative'); el.innerHTML=h+skeleton();
    if (!S.optLoad) { S.optLoad=true; fetchFile('EOW').then(()=>{ S.optLoad=false; if (S.tab==='opt') renderCurrent(); }).catch(()=>{ S.optLoad=false; if (S.tab==='opt') el.innerHTML=h+emptyState('EOW non raggiungibile', 'Non riesco a leggere il foglio: riprova tra poco.'); }); }
    return; }
  const O=optAll();
  if (!O) { enter(el, head('EOW · piano e alternative')+emptyState('Servono più settimane', 'Per confrontare il piano con le alternative servono almeno 6 settimane di trade nell\'EOW.')); return; }
  const h=head('EOW · '+O.B.ts.length+' trade · '+optDates(O.B).replace(/ \d{4}$/,''))+optPlanCard(O)+optSuggCard(O)+optMktCard(O)+optDetCard(O)+optAiCard()+optHowCard(O);
  enter(el, h, ()=>{ const c=$('c-opt'); if (c) lineChart(c, optCurve(O), { h:150, fmt:v=>fmtN(v,1,true)+' R', aria:'R cumulati del piano settimana per settimana' }); });
}
function optCurve(O) { const B=O.B, pts=[{ y:0, x:'', tip:' · inizio' }]; let eq=0;
  B.weeks.forEach((w,i)=>{ eq+=O.base.wR[i]; const d=pdIso(w); pts.push({ y:eq, x:d.getDate()+' '+MESI[d.getMonth()], tip:' · settimana del '+d.getDate()+' '+MESI[d.getMonth()]+' · '+fmtN(O.base.wR[i],1,true)+' R in '+O.base.wN[i]+' trade' }); });
  return pts; }
// tabella: righe × finestre (Tutto, 3 mesi, 4 sett., 2 sett.), la migliore di ogni colonna sottolineata; r.grp apre un gruppo di righe
function optTable(rows, key, fmt, o={}) {
  const cols=o.cols||OPT_WIN.map((_,i)=>i), best=cols.map(j=>Math.max(...rows.map(r=>r.nums[j][key]).filter(isFinite)));
  let t='<div class="tbl-wrap"><table class="ex-t op-t"><tr><th>'+(o.head||'')+'</th>'+cols.map(j=>'<th>'+OPT_WIN[j].l+'</th>').join('')+'</tr>', g=null;
  rows.forEach(r=>{ if (r.grp && r.grp!==g) { g=r.grp; t+='<tr class="op-gh"><td colspan="'+(cols.length+1)+'">'+esc(g)+'</td></tr>'; }
    t+='<tr class="'+(r.cur?'cur':'')+'"><td>'+esc(r.l)+(r.cur&&!o.noTag?' <em class="tag">piano</em>':'')+'</td>'+cols.map((j,i)=>{ const v=r.nums[j][key];
    return '<td class="num '+sgn(v)+(isFinite(v)&&v===best[i]&&rows.length>2?' best':'')+'">'+fmt(v)+'</td>'; }).join('')+'</tr>'; });
  return t+'</table></div>'; }
// il piano in etichette brevi (il dettaglio è nella scheda «Il mio piano»)
function optPlanTags(P) { const w=planWhen(P);
  const t=[P.asset.join(' e '), P.idee.length===L.idea.length ? 'tutte le idee' : P.idee.length<=2 ? P.idee.join(', ') : P.idee.length+' idee su '+L.idea.length,
    ...planCond(P), ...(w.indexOf('tutte')===0 ? [] : w.split(' · ')), mgTxt(P.g), ...dayRuleTxt(P,true).split(' · ')];
  return '<div class="op-tags">'+t.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>'; }
function optPlanCard(O) { const n=O.nums;
  return '<div class="card wide rise op-plan"><div class="card-h"><h2 class="h2">Il tuo piano</h2><span class="sub">R a settimana</span></div>'+optPlanTags(O.P)+
    '<div class="op-k">'+OPT_WIN.map((w,i)=>'<div><span>'+w.l+'</span><b class="num '+sgn(n[i].rw)+'">'+fRw(n[i].rw)+'</b><em>'+n[i].n+' trade</em></div>').join('')+'</div>'+
    (O.P.g.k==='P'?'<p class="op-leg">Gestione a parziali: numeri stimati dal Max Real RR, un po\' più alti del vero.</p>':'')+
    '<div class="chart" id="c-opt"></div>'+
    (S._planPrev?'<button type="button" class="link" data-act="planundo">'+ic('refresh',15,2)+'Annulla l\'ultima modifica al piano</button>':'')+'</div>'; }
// una modifica: titolo, quanto cambia (R a settimana) nei tre periodi, una riga di dettaglio
function optItem(O, m, apply) { const v=OPT_V[m.c.verdict], c=m.c, nb=(l,x)=>'<span><em>'+l+'</em><b class="num '+sgn(x)+'">'+fRw(x)+'</b></span>';
  const meta=OPT_CAT[m.cat]+' · '+(apply ? 'probabilità '+pct(c.p)+' · '+c.aff+' trade cambiano' : v[1].toLowerCase())+(c.ddV<c.ddB-1 ? ' · drawdown da '+fmtN(c.ddB,1)+' a '+fmtN(c.ddV,1)+' R' : '');
  return '<div class="op-s '+v[2]+'"><span class="op-ic">'+ic(v[0],15,2.4)+'</span><div class="op-sm"><b>'+esc(optLbl(m))+'</b>'+
    '<div class="op-n">'+nb('Tutto',c.all)+nb('3 mesi',c.m3)+nb('4 sett.',c.m1)+'</div><small>'+esc(meta)+'</small></div>'+
    (apply?'<button type="button" class="btn sec sm" data-act="optapply" data-mv="'+O.moves.indexOf(m)+'">Applica</button>':'')+'</div>'; }
function optSuggCard(O) { const sub=(t,x)=>'<div class="op-sub"><b>'+t+'</b><span>'+x+'</span></div>', G=O.best, w=O.wf;
  let b;
  if (G) { const d=pdIso(w.cut);
    b='<div class="op-verd go"><span class="op-ic">'+ic('spark',18,2.4)+'</span><div><b>Ho trovato un piano migliore</b><span>Batte il tuo su tutto lo storico ed è confermato sulle ultime '+w.H+' settimane, che non ho usato per trovarlo.</span></div></div>'+
      '<ol class="op-steps">'+G.steps.map(x=>'<li>'+esc(optLbl(x))+'</li>').join('')+'</ol>'+
      optTable([{ l:'Il tuo piano', cur:true, nums:O.nums }, { l:'Migliore', nums:O.greedyNums }], 'rw', fRw, { head:'R a settimana', noTag:true })+
      '<p class="op-leg">Dal '+d.getDate()+' '+MESI[d.getMonth()]+', settimane che non ho usato per trovarlo: '+fmtN(w.held,1,true)+' R contro '+fmtN(w.plan.R,1,true)+' R del tuo piano.</p>'+
      '<button type="button" class="btn op-best" data-act="optall">'+ic('check',18,2.2)+'Usa il piano migliore</button>'; }
  else b='<div class="op-verd"><span class="op-ic">'+ic('check',18,2.4)+'</span><div><b>Il tuo piano resta il migliore</b><span>'+({ poche:'Qualcosa sembra migliore, ma le settimane sono ancora troppo poche per confermarlo.',
        recenti:'Qualcosa sembra migliore, ma solo grazie alle ultime settimane: non è ancora sicuro.',
        retto:'Qualcosa sembrava migliore, ma non ha retto sulle ultime settimane.',
        metodo:'Qualcosa sembra migliore, ma in passato seguire questi consigli non ha pagato.' }[O.doubt] || 'Nessuna delle '+O.moves.length+' alternative provate lo batte con sicurezza.')+'</span></div></div>';
  if (O.hint.length) b+=sub('Da provare','R a settimana in più, ma non ancora sicuri')+O.hint.map(m=>optItem(O,m,true)).join('');
  if (O.watch.length) b+=sub('Da tenere d\'occhio','stanno cambiando di recente')+O.watch.map(m=>optItem(O,m,false)).join('');
  return '<div class="card wide rise op-sugg"><div class="card-h"><h2 class="h2">Il piano migliore</h2><span class="sub">solo se è sicuro</span></div>'+b+'</div>'; }
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
  return '<div class="card wide rise op-det"><div class="card-h"><h2 class="h2">Nel dettaglio</h2><span class="sub">'+(t==='g'?'R a settimana':'R a trade')+'</span></div>'+
    seg('opt-tab',OPT_TABS,t,'op-tabs')+'<div id="op-det">'+optDetBody(O,t)+'</div></div>'; }
function optDetBody(O, t) {
  if (t==='g') return '<div class="op-gg"><div>'+optMgSec(O)+'</div><div>'+optDaySec(O)+'</div></div>';
  return '<p class="op-leg">Con il resto del piano; sotto ogni valore, il numero di trade. La freccia dice se negli ultimi 3 mesi rende di più o di meno.</p>'+
    '<div class="op-gg">'+O.groups.filter(g=>OPT_TG[t].includes(g.id)).map(g=>optGroupSec(O,g)).join('')+'</div>'; }
function optMgSec(O) {
  const fam=g=>g.k==='T' ? ['Target fisso', fmtX(g.t)+'R'] : g.k==='P' && g.t1===2 && g.s===1 ? ['Metà a 2R, stop a +1R · stima', 'resto a '+fmtX(g.t2)+'R'] : ['Il tuo piano · stima', optCap(mgTxt(g,true))];
  const rows=O.mg.map(m=>{ const f=fam(m.g); return { grp:f[0], l:f[1], cur:m.cur, nums:m.nums }; });
  const ord=['Il tuo piano · stima','Target fisso','Metà a 2R, stop a +1R · stima']; rows.sort((a,b)=>ord.indexOf(a.grp)-ord.indexOf(b.grp));
  return optTable(rows,'rw',fRw,{ head:'Uscita' })+
    '<p class="op-leg">Le parziali sono una stima per eccesso: la seconda metà conta come arrivata al target se il Max Real RR lo raggiunge, ma prima potrebbe essere tornata allo stop. Per questo nei consigli confronto solo i target fissi.</p>'; }
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
    '<li><b>Conviene</b>: almeno 99% con il peso sulle recenti e 95% tutte uguali, meglio anche negli ultimi 3 mesi, non peggio nelle ultime 4 settimane, almeno 8 trade che cambiano e drawdown non molto peggiore. <b>Da provare</b>: almeno 90% e 75%, oppure 95% su tutto lo storico e 80% sul recente.</li>'+
    '<li><b>Perché soglie così alte.</b> Su tante alternative qualcuna sembra buona per caso: rimescolando a caso gli esiti dei trade, un falso «conviene» esce circa una volta ogni 10 analisi, un falso «da provare» una ogni 3.</li>'+
    '<li><b>Il piano migliore</b> compare solo se è sicuro: mette insieme le modifiche che convengono, una alla volta; rifacendo la stessa ricerca senza le ultime settimane deve trovare le stesse modifiche, e in quelle settimane (che non ha visto) deve fare meglio del tuo piano. Inoltre, rifacendo l\'analisi ogni settimana con i soli dati di prima, seguirla non deve aver reso meno del tuo piano.</li>'+
    '<li><b>Uscite.</b> Il target fisso è esatto dal Max Real RR. Le parziali sono una stima per eccesso (la seconda metà conta come arrivata al target se il Max Real RR lo raggiunge) e non entrano nei consigli. Le note non si usano.</li>'+
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
  if (a==='optapply' || a==='optall') {
    if (!b.classList.contains('arm')) { b.classList.add('arm'); const t=b.innerHTML; b.textContent='Conferma'; setTimeout(()=>{ if (b.isConnected) { b.classList.remove('arm'); b.innerHTML=t; } }, 3500); return true; }
    const O=S._opt; if (!O) return true; const prev=JSON.parse(JSON.stringify(PL()));
    if (a==='optapply') { const m=O.moves[+b.dataset.mv]; if (!m) return true; CFG.piano=JSON.parse(JSON.stringify(m.P)); planSaved(prev); toast('Piano aggiornato: '+m.l); }
    else { if (!O.best) return true; CFG.piano=JSON.parse(JSON.stringify(O.best.P)); planSaved(prev); toast('Piano aggiornato con '+O.best.steps.length+(O.best.steps.length===1?' modifica':' modifiche')); }
    renderCurrent(true); window.scrollTo({ top:0, behavior:'smooth' }); return true; }
  if (a==='optai') { openChat(); sendChat('Guarda l\'ottimizzazione del mio piano: cosa cambieresti, cosa terresti d\'occhio e cosa non toccheresti? Usa i numeri della pagina e dimmi quanto ti fidi di ogni indicazione.'); return true; }
  if (a==='optask') { openChat(); return true; }
  return false; }
// contesto per Claude quando la chat parte da questa pagina: piano, numeri per periodo, proposte e gruppi
function optCtx() { const O=optAll(); if (!O) return 'servono almeno 6 settimane di trade nell\'EOW';
  const w=n=>OPT_WIN.reduce((o,x,i)=>(o[x.l]={ R_a_settimana:r2(n[i].rw), R_a_trade:r2(n[i].rt), trade:n[i].n, vinti:r2(n[i].wr), drawdown_R:r2(n[i].dd) }, o), {});
  const c=m=>({ modifica:m.l, verdetto:OPT_V[m.c.verdict]?OPT_V[m.c.verdict][1]:'nessuno', R_a_settimana_in_piu:{ tutto:r2(m.c.all), ultimi_3_mesi:r2(m.c.m3), ultimo_mese:r2(m.c.m1), ultime_2_settimane:r2(m.c.w2) }, probabilita_che_sia_vero:r2(m.c.p), trade_che_cambiano:m.c.aff });
  return { nota:'Backtest sui trade dell\'EOW: ogni alternativa simulata con le regole del piano e confrontata settimana per settimana. «Conviene» con probabilità ≥ 99% (pesata sulle settimane recenti) e ≥ 95% (tutte uguali), «da provare» con ≥ 90% e ≥ 75% (o ≥ 95% su tutte le settimane e ≥ 80% pesata): con decine di alternative provate un «da provare» falso esce circa una volta su tre. Esiti dal Max Real RR: target fisso esatto; le gestioni a parziali sono stimate per eccesso (la seconda metà conta come arrivata al target se il Max Real RR lo raggiunge) e non entrano nei consigli. Le note dei trade non si usano.',
    periodo:optDates(O.B), settimane:O.B.weeks.length, piano:planDesc(O.P), risultati_del_piano:w(O.nums),
    consigliate:O.sugg.map(c), da_provare:O.hint.map(c), da_tenere_d_occhio:O.watch.map(c), piano_migliore:{ sicuro:!!O.best, nota:'si propone solo se trovato con i «conviene», trovato uguale anche senza le ultime settimane e migliore del piano proprio in quelle', modifiche:O.greedy.steps.map(s=>s.l), risultati:w(O.greedyNums) },
    quale_mercato:O.mkt ? { nota:'ogni mercato da solo con tutte le regole del piano; test: ogni settimana il mercato migliore delle 4 settimane prima, confrontato con il piano', mercati:O.mkt.rows.map(r=>({ mercato:r.l, del_piano:r.cur, R_a_settimana:OPT_WIN.reduce((o,x,i)=>(o[x.l]=r2(r.nums[i].rw), o), {}) })),
      davanti_nelle_ultime_4_settimane:O.mkt.lead, verdetto:{ go:'passa per ora', mid:'davanti ma presto per cambiare', stay:'resta' }[O.mkt.kind],
      test_cambio_mercato:{ settimane:O.mkt.T.n, settimane_fuori_dal_piano:O.mkt.T.k, R_a_settimana_cambiando:r2(O.mkt.T.sw), R_a_settimana_restando:r2(O.mkt.T.st), probabilita_che_sia_meglio:r2(O.mkt.T.p) } } : null,
    prova_sul_passato:O.roll ? { nota:'ogni settimana, dalla metà dello storico, la ricerca rifatta con i soli dati di prima e il piano proposto tenuto per la settimana dopo', settimane:O.roll.n, settimane_con_piano_cambiato:O.roll.ch, R_a_settimana_seguendo_ottimizza:r2(O.roll.rw), R_a_settimana_piano:r2(O.roll.rb) } : null,
    verifica_sulle_ultime_settimane_non_viste:O.wf ? { settimane:O.wf.H, proposta_senza_quelle_settimane:O.wf.steps.map(s=>s.l), R_proposta:r2(O.wf.prop.R), R_piano:r2(O.wf.plan.R) } : null,
    gestioni:O.mg.map(m=>({ gestione:mgTxt(m.g), del_piano:m.cur, R_a_settimana:OPT_WIN.reduce((o,x,i)=>(o[x.l]=r2(m.nums[i].rw), o), {}) })),
    gruppi:O.groups.map(g=>({ dimensione:g.name, valori:g.rows.map(r=>({ valore:r.k, nel_piano:r.on, R_a_trade:{ tutto:r2(r.w[0].rt), ultimi_3_mesi:r2(r.w[1].rt), ultimo_mese:r2(r.w[2].rt) }, trade:{ tutto:r.w[0].n, ultimi_3_mesi:r.w[1].n, ultimo_mese:r.w[2].n }, mesi_positivi:r.mPos+'/'+r.mTot })) })) }; }


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['ottimizza.js'] = '2026-11-04.3';

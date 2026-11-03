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
  h+=sec('Gestione del trade','',f('Come esci',seg('pl-gk',[{v:'P',l:'A parziali'},{v:'T',l:'Target fisso'},{v:'BE',l:'Con BE'}],g.k))+
    (g.k==='T' ? f('Target',chips('pl-gt',PLAN_MG.T.map(x),g.t))
    : g.k==='BE' ? f('Target',chips('pl-gt',PLAN_MG.BT.map(x),g.t))+f('Stop a BE quando il prezzo arriva a',chips('pl-gl',PLAN_MG.BL.map(x),g.l))
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
  else if (name==='gk') P.g = v==='T' ? { k:'T', t:P.g.k==='P'?P.g.t1:P.g.t } : v==='BE' ? { k:'BE', t:Math.max(3, P.g.k==='P'?P.g.t2:P.g.t), l:2 } : { k:'P', t1:2, s:1, t2:4 };
  else if (name==='gt') { P.g.t=n; if (P.g.k==='BE' && P.g.l>=n) P.g.l=PLAN_MG.BL.filter(x=>x<n).pop(); }
  else if (name==='gl') { if (n>=P.g.t) { toast('Lo stop a BE deve scattare prima del target', true); return true; } P.g.l=n; }
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
// Il piano contro le alternative sui trade dell'EOW (backtest con Max Real RR e note), settimana per settimana: su tutto lo
// storico, sugli ultimi 3 mesi, sull'ultimo mese e sulle ultime 2 settimane. Una modifica è consigliata solo se migliora i R
// a settimana con buona probabilità (ricampionando le settimane, con più peso alle recenti), non peggiora l'ultimo mese e
// cambia l'esito di abbastanza trade da non essere un caso. Le uscite con parziali o BE dopo 2R si ricostruiscono dalle note
// («raggiunge 2.4rr, torna a 1.2rr, poi raggiunge 4rr»); quando la nota manca vale la frequenza osservata negli altri trade.
const OPT_WIN = [{ k:'all', l:'Tutto' }, { k:13, l:'3 mesi' }, { k:4, l:'4 sett.' }, { k:2, l:'2 sett.' }];
const OPT_HL = 6;            // peso delle settimane: si dimezza ogni 6 settimane andando indietro
// soglie tarate rimescolando a caso gli esiti dei trade (nessun legame tra filtri ed esito): con queste, un «conviene» falso
// esce circa una volta ogni 10 analisi, un «indizio» falso circa una volta ogni 3 (si provano una cinquantina di alternative)
function optVerdict(c) {
  if (c.aff>=8 && c.p>=.99 && c.pa>=.95 && c.all>0 && c.m3>0 && c.m1>=0 && c.wm>=.2) return 'si';
  if (c.aff>=6 && c.p>=.9 && c.pa>=.75 && c.all>0 && c.m3>=0 && c.m1>=0 && c.wm>=.15) return 'indizio';
  if (c.aff>=8 && c.m1>.5 && c.m3>.25 && c.wm>.25 && c.p>=.8) return 'recente';
  if (c.aff>=8 && c.all>0 && c.pa>=.8 && c.m3<0 && c.m1<0) return 'calo';
  return ''; }
// percorso del prezzo dalle note: [] = «va diretto senza pullback», null = nessuna informazione
function notePath(s) { s=String(s||'').toLowerCase(); if (!s) return null;
  if (/diretto|senza pullback/.test(s)) return [];
  const ev=[], re=/(raggiunge|torna a|torna in|ritorna a)\s+(?:appena\s+)?(?:i\s+)?(be\b|\d+(?:[.,]\d+)?)/g; let m;
  while ((m=re.exec(s))) ev.push([m[1]==='raggiunge'?'u':'d', m[2]==='be'?0:parseFloat(m[2].replace(',','.'))]);
  return ev.length ? ev : null; }
// dopo essere arrivato a t1, il prezzo torna a s prima di arrivare a t2? true / false / null (non si sa)
function optStop(x, t1, s, t2) { if (x.mx<t2-1e-9) return true; if (!x.path) return null;
  let up=false; for (const [k,v] of x.path) { if (k==='u') { if (v>=t1-1e-9) up=true; if (v>=t2-1e-9) return false; } else if (up && v<=s+1e-9) return true; }
  return false; }
function optBase() {
  const E=rowsOf('EOW'); if (!E) return null;
  if (S._optB && S._optB.src===E) return S._optB;
  const ts=[];
  E.forEach(t=>{ const mx=isFinite(t.max)?t.max:t.best; if (!t.d || !isFinite(mx) || t.d.getDay()%6===0) return;
    const sl=num(t.raw['SL Points']), dd=num(t.raw['SL DD']);
    ts.push({ t, mx, path:notePath(t.note), ddr: sl>0 && dd>=0 ? dd/sl : NaN, wk:weekOf(iso(t.d)), day:iso(t.d), band:bandOf(t), pb:String(t.raw['Candele PB']??'').trim() }); });
  const weeks=[], wi={};
  if (ts.length) for (let d=pdIso(ts[0].wk); iso(d)<=ts[ts.length-1].wk; d=addDays(d,7)) { wi[iso(d)]=weeks.length; weeks.push(iso(d)); }
  return (S._optB={ src:E, ts, weeks, wi, pU:{}, dir:ts.some(x=>x.t.dir), cc2:hasCol('2° CC')||ts.some(x=>x.t.cc2) }); }
// probabilità di tornare a s prima di t2, dai trade con la nota (serve per quelli senza)
function optPU(B, t1, s, t2) { const k=t1+'|'+s+'|'+t2; if (k in B.pU) return B.pU[k];
  const v=B.ts.filter(x=>x.path && x.mx>=t2-1e-9).map(x=>optStop(x,t1,s,t2)?1:0);
  return (B.pU[k] = v.length>=5 ? v.reduce((a,b)=>a+b,0)/v.length : .25); }
// esito di un trade con la gestione g. mode: 'exp' valore atteso · 'lo' / 'hi' caso peggiore / migliore quando non si sa
// (solo per lo stop a BE prima di 2R, dove le note non arrivano)
function optR(B, x, g, mode) {
  const mx=x.mx;
  if (g.k==='T') return mx>=g.t-1e-9 ? g.t : -1;
  if (g.k==='P') { if (mx<g.t1-1e-9) return -1; let st=optStop(x,g.t1,g.s,g.t2); if (st===null) st=optPU(B,g.t1,g.s,g.t2); return .5*g.t1 + .5*(st*g.s + (1-st)*g.t2); }
  if (mx<g.l-1e-9) return -1; if (mx<g.t-1e-9) return 0;
  let st=optStop(x, Math.max(g.l,2), 0, g.t);
  if (st===true) return 0;
  if (g.l<2) { if (st===false && x.ddr===0) return g.t; if (x.ddr===0) return g.t;   // mai andato contro: lo stop a BE non scatta
    return mode==='lo' ? 0 : mode==='hi' ? g.t : g.t/2; }                       // tra l e 2R le note non dicono niente
  if (st===null) st=optPU(B,g.l,0,g.t);
  return (1-st)*g.t; }
function optPass(P, x) { const t=x.t;
  if (!P.asset.includes(/NQ/i.test(t.a||'')?'NQ':'ES') || !P.idee.includes(t.idea) || !P.giorni.includes(t.day) || !P.bande.includes(x.band)) return false;
  if ((P.dir && t.dir!==P.dir) || (P.smt==='fav' && t.smt!=='SMT a favore') || (P.smt==='nosf' && t.smt==='SMT a sfavore')) return false;
  if ((P.lvn && t.lvn!==P.lvn) || (P.clean && !t.clean) || (P.cc2==='si' && !t.cc2) || (P.cc2==='no' && t.cc2)) return false;
  if ((P.news==='nored' && t.news==='Red News') || (P.news==='none' && t.news!=='No News Day')) return false;
  if (P.pb.length && !P.pb.includes(x.pb)) return false;
  return true; }
// simulazione del piano: i trade presi giorno per giorno con le regole del giorno, i R per settimana e l'esito di ogni trade
function optSim(B, P, mode) {
  const W=B.weeks.length, wR=new Float64Array(W), wN=new Float64Array(W), rs=new Map(), seq=[];
  let day='', n=0, stop=false, ls=0, R=0;
  B.ts.forEach((x,i)=>{ if (!optPass(P,x)) return;
    if (x.day!==day) { day=x.day; n=0; stop=false; ls=0; R=0; }
    if (stop || (P.maxN && n>=P.maxN) || (P.sll && ls>=P.sll) || (P.lossR && R<=-P.lossR+1e-9)) return;
    const r=optR(B,x,P.g,mode||'exp'); n++; R+=r; if (r<0) ls++; if (P.sw && r>0) stop=true;
    const w=B.wi[x.wk]; wR[w]+=r; wN[w]++; rs.set(i,r); seq.push([w,r]); });
  return { wR, wN, rs, seq }; }
// i numeri di una simulazione nelle ultime n settimane (fino alla settimana «to», esclusa)
function optNums(B, sim, n, to) { to=to??B.weeks.length; const from=Math.max(0, to-(n==='all'?to:n)), k=to-from; let R=0, N=0, w=0, eq=0, pk=0, dd=0;
  sim.seq.forEach(([wk,r])=>{ if (wk<from || wk>=to) return; R+=r; N++; if (r>0) w++; eq+=r; if (eq>pk) pk=eq; if (eq-pk<dd) dd=eq-pk; });
  return { R, n:N, wk:k, rw:k?R/k:NaN, rt:N?R/N:NaN, wr:N?w/N:NaN, dd }; }
// generatore di numeri casuali con seme: gli stessi dati danno sempre lo stesso risultato
function optRng(seed) { let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
// confronto di una variante con il piano, settimana per settimana nelle settimane [0, to)
function optCmp(B, base, v, to) {
  to=to??B.weeks.length; const d=[], w=[]; for (let i=0;i<to;i++) { d.push(v.wR[i]-base.wR[i]); w.push(Math.pow(.5,(to-1-i)/OPT_HL)); }
  const mean=(a,b)=>{ const s=d.slice(Math.max(0,to-a)); return s.length ? s.reduce((x,y)=>x+y,0)/s.length : 0; };
  const W=w.reduce((x,y)=>x+y,0), wm=d.reduce((s,x,i)=>s+x*w[i],0)/W;
  const rng=optRng(to*7919+Math.round(wm*1e4)), N=700; let pos=0, posA=0;
  for (let k=0;k<N;k++) { let s=0, sw=0, sa=0; for (let i=0;i<to;i++) { const j=Math.floor(rng()*to); s+=d[j]*w[j]; sw+=w[j]; sa+=d[j]; } if (s/sw>0) pos++; if (sa>0) posA++; }
  let aff=0; const keys=new Set([...base.rs.keys(), ...v.rs.keys()]);
  keys.forEach(i=>{ const wk=B.wi[B.ts[i].wk]; if (wk<to && base.rs.get(i)!==v.rs.get(i)) aff++; });
  const c={ all:mean(to), m3:mean(13), m1:mean(4), w2:mean(2), wm, p:pos/N, pa:posA/N, aff };
  c.verdict=optVerdict(c); return c; }
// le modifiche possibili a partire da un piano: [categoria, testo, nuovo piano]
const OPT_GS = () => [...PLAN_MG.T.map(t=>({ k:'T', t })), ...[0,1].flatMap(s=>PLAN_MG.P2.map(t2=>({ k:'P', t1:2, s, t2 }))), ...[3,4,5].map(t=>({ k:'BE', t, l:2 }))];
function optMoves(B, P) {
  const out=[], cp=()=>JSON.parse(JSON.stringify(P)), add=(cat,l,f)=>{ const q=cp(); f(q); out.push({ cat, l, P:q }); };
  OPT_GS().forEach(g=>{ if (JSON.stringify(g)!==JSON.stringify(P.g)) add('g', 'gestione: '+mgTxt(g), q=>{ q.g=g; }); });
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
  return out; }
// ricerca a passi: dal piano, una modifica alla volta (la migliore tra quelle che passano il test), al massimo 4
function optGreedy(B, P0, to, ok) {
  ok=ok||['si']; let P=P0, base=optSim(B,P); const steps=[];
  for (let k=0;k<4;k++) { let best=null;
    optMoves(B,P).forEach(m=>{ const v=optSim(B,m.P), c=optCmp(B,base,v,to); if (ok.includes(c.verdict) && (!best || c.wm>best.c.wm)) best={ m, v, c }; });
    if (!best) break; steps.push({ l:best.m.l, cat:best.m.cat, c:best.c }); P=best.m.P; base=best.v; }
  return { P, steps, sim:base }; }
// tutte le analisi della pagina, rifatte quando cambiano i dati dell'EOW o il piano
function optAll() {
  const B=optBase(); if (!B || B.weeks.length<6) return null;
  const P=PL(), key=JSON.stringify(P); if (S._opt && S._opt.B===B && S._opt.key===key) return S._opt;
  const t0=performance.now(), base=optSim(B,P), W=B.weeks.length;
  const nums=s=>OPT_WIN.map(w=>optNums(B,s,w.k));
  const moves=optMoves(B,P).map(m=>{ const v=optSim(B,m.P); return Object.assign(m, { v, c:optCmp(B,base,v), nums:nums(v) }); });
  // gestione: tutte le varianti (anche quella del piano) con i loro numeri
  const gs=OPT_GS(); if (!gs.some(g=>JSON.stringify(g)===JSON.stringify(P.g))) gs.unshift(P.g);
  const mg=gs.map(g=>{ const q=Object.assign({}, P, { g }), v=optSim(B,q); return { g, cur:JSON.stringify(g)===JSON.stringify(P.g), nums:nums(v), c:optCmp(B,base,v) }; });
  // stop a BE prima di 2R: caso peggiore e migliore, perché tra 1R e 2R le note non dicono se il prezzo è tornato indietro
  const be=[2,3,4].flatMap(t=>[1,1.5].map(l=>({ g:{ k:'BE', t, l } }))).map(o=>{ const q=Object.assign({}, P, { g:o.g });
    return Object.assign(o, { lo:nums(optSim(B,q,'lo')), hi:nums(optSim(B,q,'hi')) }); });
  // regole del giorno: tutte le combinazioni principali
  const days=[];
  [1,2,3,0].forEach(maxN=>[1,0].forEach(sw=>[0,2].forEach(sll=>{ const q=Object.assign({}, P, { maxN, sw, sll }); days.push({ q, cur:maxN===P.maxN&&sw===P.sw&&sll===P.sll, nums:nums(optSim(B,q)) }); })));
  // gruppi: ogni valore di una dimensione con gli altri filtri del piano e senza regole del giorno (quanto rende un trade di quel tipo)
  const groups=optGroups(B,P);
  let lvl=['si'], greedy=optGreedy(B,P,undefined,lvl); if (!greedy.steps.length) { lvl=['si','indizio']; greedy=optGreedy(B,P,undefined,lvl); }
  const wf = W>=10 ? optGreedy(B,P,W-4,lvl) : null;
  const wfRes = wf ? { steps:wf.steps, cut:B.weeks[W-4], plan:optNums(B,optSim(B,P),4), prop:optNums(B,optSim(B,wf.P),4) } : null;
  const ord={ recente:1, calo:2 };
  const sugg=moves.filter(m=>m.c.verdict==='si').sort((a,b)=>b.c.wm-a.c.wm), hint=moves.filter(m=>m.c.verdict==='indizio').sort((a,b)=>b.c.p-a.c.p||b.c.wm-a.c.wm),
    watch=moves.filter(m=>m.c.verdict==='recente'||m.c.verdict==='calo').sort((a,b)=>ord[a.c.verdict]-ord[b.c.verdict]||b.c.m1-a.c.m1);
  // una sola proposta per categoria di gestione, asset e regole (sono alternative tra loro)
  const one=l=>{ const seen=new Set(); return l.filter(m=>{ const k=['g','asset','day'].includes(m.cat)?m.cat:m.l; if (seen.has(k)) return false; seen.add(k); return true; }); };
  return (S._opt={ B, key, P, base, nums:nums(base), moves, sugg:one(sugg).slice(0,6), hint:one(hint).slice(0,3), watch:one(watch).slice(0,4), mg, be, days, groups, greedy, greedyOnlyHints:lvl.length>1, greedyNums:nums(greedy.sim), wf:wfRes, ms:performance.now()-t0 }); }
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
      const r=x=>optR(B,x,P.g,'exp'), win=n=>{ const from=W-(n==='all'?W:n), h=g.filter(x=>B.wi[x.wk]>=from); return { n:h.length, rt:h.length?h.reduce((s,x)=>s+r(x),0)/h.length:NaN }; };
      const months={}; g.forEach(x=>{ const m=x.day.slice(0,7); (months[m]=months[m]||[]).push(r(x)); }); const mv=Object.values(months).filter(a=>a.length>=3).map(a=>a.reduce((s,y)=>s+y,0));
      const w=[win('all'), win(13), win(4)], tr = w[1].n>=8 && w[0].n>=15 ? (w[1].rt-w[0].rt>.3 ? 1 : w[1].rt-w[0].rt<-.3 ? -1 : 0) : 0;
      return { k, on:inPlan[id](k), w, tr, mPos:mv.filter(x=>x>0).length, mTot:mv.length }; }).filter(Boolean);
    return { id, name, rows }; }).filter(g=>g.rows.length>1); }

// ── pagina ──
const OPT_V = { si:['check','Conviene','ok'], indizio:['spark','Indizio da verificare','hint'], recente:['trendUp','Sta funzionando di recente','up'], calo:['trendDn','Funzionava, ora meno','down'] };
const fRw = x => isFinite(x) ? fmtN(x,1,true) : '–';
const fRt = x => isFinite(x) ? fmtN(x,2,true) : '–';
function optDates(B) { const a=B.ts[0].t.d, b=B.ts[B.ts.length-1].t.d; return a.getDate()+' '+MESI[a.getMonth()]+' – '+b.getDate()+' '+MESI[b.getMonth()]+' '+b.getFullYear(); }
function renderOpt() {
  const el=$('v-opt'), E=rowsOf('EOW');
  let h='<div class="stat-h rise"><div><div class="eyebrow">EOW · piano e alternative</div><h1>'+words('Ottimizza')+'</h1></div>'+
    '<button type="button" class="btn sec sm op-pl" data-act="planedit">'+ic('gear',16,2)+'Il mio piano</button></div>';
  if (!E) { el.innerHTML=h+skeleton();
    if (!S.optLoad) { S.optLoad=true; fetchFile('EOW').then(()=>{ S.optLoad=false; if (S.tab==='opt') renderCurrent(); }).catch(()=>{ S.optLoad=false; if (S.tab==='opt') el.innerHTML=h+emptyState('EOW non raggiungibile', 'Non riesco a leggere il foglio: riprova tra poco.'); }); }
    return; }
  const O=optAll();
  if (!O) { enter(el, h+emptyState('Servono più settimane', 'Per confrontare il piano con le alternative servono almeno 6 settimane di trade nell\'EOW.')); return; }
  const B=O.B, W=B.weeks.length, wkEnd=iso(addDays(pdIso(B.weeks[W-1]),4)), lastD=pdIso(wkEnd);
  h+='<p class="nsrc rise">'+ic('clock',14,2)+'<span>'+B.ts.length+' trade dell\'EOW, '+optDates(B)+' · '+W+' settimane. «4 sett.» e «2 sett.» sono le ultime settimane fino a venerdì '+lastD.getDate()+' '+MESI[lastD.getMonth()]+'.</span></p>';
  h+=optPlanCard(O);
  h+=optSuggCard(O);
  h+=optPropCard(O);
  h+=optMgCard(O);
  h+=rows2([optBeCard(O), optDayCard(O)]);
  const gcards=O.groups.map(g=>optGroupCard(O,g)); h+=rows2(gcards);
  h+='<div class="card wide rise op-ai"><div class="card-h"><h2 class="h2">Chiedi a Claude</h2><span class="sub">vede tutti questi numeri e il tuo piano</span></div>'+
    '<p class="ds-note">Un parere a parole: cosa cambierebbe, cosa terrebbe d\'occhio e perché, con i numeri di questa pagina.</p>'+
    '<div class="op-ai-b"><button type="button" class="btn" data-act="optai">'+ic('spark',18,2)+'Commenta l\'ottimizzazione</button><button type="button" class="btn sec" data-act="optask">Fai una domanda</button></div></div>';
  h+='<details class="card wide rr-how rise op-how"><summary>'+ic('chev',15,2.2)+'Come funziona</summary><div>'+
    '<p>Ogni alternativa si simula sui trade dell\'EOW con tutte le regole del tuo piano, cambiando solo quella cosa, e si confronta con il piano <b>settimana per settimana</b>, in R a settimana: così conta sia quanto rende un trade sia quanti trade fai.</p>'+
    '<p>La <b>probabilità che il miglioramento sia vero</b> si ottiene ricampionando le settimane centinaia di volte, una volta con più peso a quelle recenti (il peso si dimezza ogni '+OPT_HL+' settimane) e una volta tutte uguali: se il miglioramento dipende da una o due settimane fortunate, resta bassa.</p>'+
    '<p><b>Conviene</b>: probabilità almeno 99% con il peso sulle recenti e 95% su tutto lo storico, meglio anche negli ultimi 3 mesi, non peggio nell\'ultimo mese, almeno 8 trade che cambiano esito. <b>Indizio</b>: almeno 90% e 75%. Le soglie sono severe perché si provano una cinquantina di alternative e qualcuna sembra buona per caso: le ho tarate rimescolando a caso gli esiti dei trade, dove nessun filtro può funzionare davvero. Lì un «conviene» falso esce circa una volta ogni 10 analisi, un indizio falso circa una volta ogni 3.</p>'+
    '<p><b>Sta funzionando di recente</b>: molto meglio negli ultimi 3 mesi e nell\'ultimo mese, non ancora sullo storico. <b>Funzionava, ora meno</b>: sullo storico era meglio, negli ultimi 3 mesi e nell\'ultimo mese no.</p>'+
    '<p>Le uscite a parziali e lo stop a BE dopo 2R si ricostruiscono dalle note dei trade («raggiunge 2.4rr, torna a 1.2rr, poi raggiunge 4rr»). Per i trade senza nota vale quanto spesso succede negli altri. Prima di 2R le note non dicono se il prezzo è tornato indietro: lì lo stop a BE si mostra come intervallo, dal caso peggiore al migliore.</p>'+
    '<p>Il <b>piano proposto</b> aggiunge una modifica alla volta, sempre con lo stesso test. La verifica rifà la stessa ricerca senza guardare le ultime 4 settimane e poi controlla come sarebbe andata proprio in quelle settimane.</p></div></details>';
  enter(el, h, ()=>{ const c=$('c-opt'); if (c) lineChart(c, optCurve(O), { h:170, fmt:v=>fmtN(v,1,true)+' R', aria:'R cumulati del piano settimana per settimana' }); });
}
function optCurve(O) { const B=O.B, pts=[{ y:0, x:'', tip:' · inizio' }]; let eq=0;
  B.weeks.forEach((w,i)=>{ eq+=O.base.wR[i]; const d=pdIso(w); pts.push({ y:eq, x:d.getDate()+' '+MESI[d.getMonth()], tip:' · settimana del '+d.getDate()+' '+MESI[d.getMonth()]+' · '+fmtN(O.base.wR[i],1,true)+' R in '+O.base.wN[i]+' trade' }); });
  return pts; }
// tabella: righe × finestre (Tutto, 3 mesi, 4 sett., 2 sett.), con la migliore di ogni colonna in evidenza
function optTable(rows, key, fmt, o={}) {
  const cols=o.cols||OPT_WIN.map((_,i)=>i), best=cols.map(j=>Math.max(...rows.map(r=>r.nums[j][key]).filter(isFinite)));
  let t='<div class="tbl-wrap"><table class="ex-t op-t"><tr><th>'+(o.head||'')+'</th>'+cols.map(j=>'<th>'+OPT_WIN[j].l+'</th>').join('')+'</tr>';
  rows.forEach(r=>{ t+='<tr class="'+(r.cur?'cur':'')+'"><td>'+r.l+(r.cur?' <em class="tag">piano</em>':'')+'</td>'+cols.map((j,i)=>{ const v=r.nums[j][key];
    return '<td class="num '+sgn(v)+(isFinite(v)&&v===best[i]&&rows.length>2?' best':'')+'">'+fmt(v)+(o.n?'<small>'+r.nums[j].n+'</small>':'')+'</td>'; }).join('')+'</tr>'; });
  return t+'</table></div>'; }
function optPlanCard(O) { const n=O.nums;
  const kp=(l,v,s,cls)=>'<div><span>'+l+'</span><b class="num '+(cls||'')+'">'+v+'</b><em>'+s+'</em></div>';
  return '<div class="card wide rise op-plan"><div class="card-h"><h2 class="h2">Il tuo piano</h2><span class="sub">sui trade dell\'EOW</span></div>'+planSumHtml(O.P)+
    '<div class="op-k">'+OPT_WIN.map((w,i)=>kp(w.l, fRw(n[i].rw)+' R', 'a settimana · '+n[i].n+' trade · '+fRt(n[i].rt)+' R/trade', sgn(n[i].rw))).join('')+'</div>'+
    '<div class="chart" id="c-opt"></div>'+
    (S._planPrev?'<button type="button" class="link" data-act="planundo">'+ic('refresh',15,2)+'Annulla l\'ultima modifica al piano</button>':'')+'</div>'; }
function optSuggCard(O) {
  const li=(m,apply)=>{ const v=OPT_V[m.c.verdict], c=m.c;
    return '<div class="op-s '+v[2]+'"><span class="op-ic">'+ic(v[0],16,2.4)+'</span><div><b>'+esc(m.l.replace(/^./,ch=>ch.toUpperCase()))+'</b>'+
      '<span>'+fRw(c.all)+' R a settimana su tutto lo storico · '+fRw(c.m3)+' negli ultimi 3 mesi · '+fRw(c.m1)+' nell\'ultimo mese · probabilità '+pct(c.p)+' · cambia '+c.aff+' trade</span></div>'+
      (apply?'<button type="button" class="btn sec sm" data-act="optapply" data-mv="'+O.moves.indexOf(m)+'">Applica</button>':'')+'</div>'; };
  let b='';
  if (O.sugg.length) b+=O.sugg.map(m=>li(m,true)).join('');
  else b+='<div class="op-none">'+ic('check',18,2.4)+'<span><b>Nessuna modifica è dimostrata.</b> Tra le '+O.moves.length+' alternative provate nessuna batte il piano con una probabilità abbastanza alta da escludere la fortuna: per ora non cambierei niente.</span></div>';
  if (O.hint.length) b+='<div class="op-sub">Indizi da verificare</div><p class="op-subp">Migliorano il piano, ma non abbastanza da escludere la fortuna: con tante alternative provate, un indizio falso esce circa una volta su tre. Meglio provarli nell\'EOW per qualche settimana prima di cambiare il piano.</p>'+O.hint.map(m=>li(m,true)).join('');
  if (O.watch.length) b+='<div class="op-sub">Da tenere d\'occhio</div>'+O.watch.map(m=>li(m,false)).join('');
  return '<div class="card wide rise"><div class="card-h"><h2 class="h2">Cosa cambierei</h2><span class="sub">ogni modifica da sola, rispetto al piano · R a settimana in più</span></div>'+b+'</div>'; }
function optPropCard(O) {
  const G=O.greedy; if (!G.steps.length && !(O.wf && O.wf.steps.length)) return '';
  const hintOnly=O.greedyOnlyHints;
  let b=(G.steps.length && hintOnly ? '<p class="ds-note" style="margin:0 0 10px">Nessuna modifica è dimostrata, quindi questo piano mette insieme gli <b>indizi</b>: da provare, non da adottare a occhi chiusi.</p>' : '')+
    (G.steps.length ? '<ol class="op-steps">'+G.steps.map(s=>'<li>'+esc(s.l.replace(/^./,c=>c.toUpperCase()))+'</li>').join('')+'</ol>' : '<p class="ds-note">Con tutti i dati non cambierei niente.</p>');
  if (G.steps.length) b+=optTable([{ l:'Piano attuale', cur:true, nums:O.nums }, { l:hintOnly?'Piano da provare':'Piano proposto', nums:O.greedyNums }], 'rw', fRw, { head:'R a settimana' });
  if (O.wf) { const w=O.wf, d=pdIso(w.cut);
    b+='<div class="op-wf">'+ic('shield',16,2)+'<span><b>Verifica sulle settimane non viste.</b> '+(w.steps.length
      ? 'Rifacendo la stessa ricerca senza le ultime 4 settimane avrei proposto: '+esc(w.steps.map(s=>s.l).join(', '))+'. Dal '+d.getDate()+' '+MESI[d.getMonth()]+' in poi quella proposta ha fatto <b class="'+sgn(w.prop.R)+'">'+fmtN(w.prop.R,1,true)+' R</b>, il tuo piano <b class="'+sgn(w.plan.R)+'">'+fmtN(w.plan.R,1,true)+' R</b>'+(w.prop.R>=w.plan.R?': la proposta ha retto anche sui dati nuovi.':': sui dati nuovi la proposta ha fatto peggio, quindi va presa con cautela.')
      : 'Senza le ultime 4 settimane non avrei cambiato niente: le modifiche proposte dipendono soprattutto dal periodo recente.')+'</span></div>'; }
  if (G.steps.length) b+='<button type="button" class="btn'+(hintOnly?' sec':'')+'" data-act="optall">'+ic('check',18,2.2)+(hintOnly?'Applica il piano da provare':'Applica il piano proposto')+'</button>';
  return '<div class="card wide rise"><div class="card-h"><h2 class="h2">'+(hintOnly?'Piano da provare':'Piano proposto')+'</h2><span class="sub">le modifiche che reggono insieme, una alla volta</span></div>'+b+'</div>'; }
function optMgCard(O) {
  const rows=O.mg.map(m=>({ l:mgTxt(m.g,true).replace(/^./,c=>c.toUpperCase()), cur:m.cur, nums:m.nums }));
  return '<div class="card wide rise"><div class="card-h"><h2 class="h2">Target e gestione</h2><span class="sub">R a settimana · in evidenza la migliore di ogni periodo</span></div>'+optTable(rows,'rw',fRw,{ head:'Gestione' })+
    '<p class="ds-note">Target fisso: esito dal Max Real RR. Parziali e BE dopo 2R: dalle note del trade.</p></div>'; }
function optBeCard(O) { const b=O.nums[0].rw, b1=O.nums[2].rw;
  const rows=O.be.map(o=>{ const lo=o.lo[0].rw, hi=o.hi[0].rw, lo1=o.lo[2].rw, hi1=o.hi[2].rw, v = lo>b ? ['ok','meglio del piano in ogni caso'] : hi<b ? ['ko','peggio del piano in ogni caso'] : ['','dipende da quanto spesso torna indietro prima di 2R'];
    return '<tr><td>'+esc(mgTxt(o.g,true).replace(/^./,c=>c.toUpperCase()))+'<small class="'+v[0]+'">'+v[1]+'</small></td><td class="num">'+fRw(lo)+' … '+fRw(hi)+'</td><td class="num">'+fRw(lo1)+' … '+fRw(hi1)+'</td></tr>'; }).join('');
  return '<div class="card rise"><div class="card-h"><h2 class="h2">Stop a BE prima di 2R</h2><span class="sub">R a settimana, dal caso peggiore al migliore</span></div>'+
    '<div class="tbl-wrap"><table class="ex-t op-t op-be"><tr><th></th><th>Tutto</th><th>4 sett.</th></tr>'+rows+'</table></div>'+
    '<p class="ds-note">Il tuo piano: <b class="'+sgn(b)+'">'+fRw(b)+'</b> su tutto lo storico, <b class="'+sgn(b1)+'">'+fRw(b1)+'</b> nelle ultime 4 settimane. Le note descrivono il percorso solo dopo 2R: tra 1R e 2R non so se il prezzo è tornato all\'entrata, quindi il caso peggiore conta come BE ogni trade andato contro, il migliore nessuno. Scrivere nelle note anche i ritorni prima di 2R renderebbe il numero preciso.</p></div>'; }
function optDayCard(O) {
  const rows=O.days.filter(d=>d.cur || d.q.sll===0 || d.q.sll===O.P.sll).map(d=>({ l:dayRuleTxt(d.q,true).replace(/ · max −[\d,]+ R$/,''), cur:d.cur, nums:d.nums }));
  return '<div class="card rise"><div class="card-h"><h2 class="h2">Regole del giorno</h2><span class="sub">R a settimana</span></div>'+optTable(rows,'rw',fRw,{ cols:[0,1,2] })+'</div>'; }
function optGroupCard(O, g) {
  const mv=O.moves, find=(k,on)=>mv.find(m=>m.cat===g.id && m.l===(on?'togli ':'aggiungi ')+(g.id==='giorni'?k.toLowerCase():k) && m.c.verdict);
  let t='<div class="tbl-wrap"><table class="ex-t op-t op-g"><tr><th>R a trade</th><th>Tutto</th><th>3 mesi</th><th>4 sett.</th></tr>';
  g.rows.forEach(r=>{ const m=['idee','bande','giorni','asset'].includes(g.id) ? find(r.k, r.on) : null, v=m && OPT_V[m.c.verdict];
    t+='<tr class="'+(r.on?'':'off')+'"><td>'+esc(r.k)+(r.tr?'<i class="op-tr '+(r.tr>0?'up':'down')+'">'+ic(r.tr>0?'trendUp':'trendDn',13,2.4)+'</i>':'')+
      '<small>'+(r.on?'nel piano':'fuori dal piano')+(r.mTot?' · '+r.mPos+'/'+r.mTot+' mesi positivi':'')+(v?' · <b class="'+v[2]+'">'+(m.l.indexOf('togli')===0?'da togliere: ':'da aggiungere: ')+v[1].toLowerCase()+'</b>':'')+'</small></td>'+
      r.w.map(w=>'<td class="num '+sgn(w.rt)+'">'+(w.n?fRt(w.rt):'–')+'<small>'+w.n+'</small></td>').join('')+'</tr>'; });
  return '<div class="card rise"><div class="card-h"><h2 class="h2">'+g.name+'</h2><span class="sub">con il resto del piano</span></div>'+t+'</table></div></div>'; }
// pulsanti della pagina e della scheda del piano
function optClick(b) {
  if (S.sheet==='plan' && b.closest('#sh-body')) return planClick(b);
  const a=b.dataset.act;
  if (a==='planedit') { openPlan(); return true; }
  if (a==='planundo') { if (S._planPrev) { CFG.piano=S._planPrev; S._planPrev=null; planSaved(); toast('Piano com\'era prima'); renderCurrent(true); } return true; }
  if (a==='optapply' || a==='optall') {
    if (!b.classList.contains('arm')) { b.classList.add('arm'); const t=b.innerHTML; b.textContent='Conferma'; setTimeout(()=>{ if (b.isConnected) { b.classList.remove('arm'); b.innerHTML=t; } }, 3500); return true; }
    const O=S._opt; if (!O) return true; const prev=JSON.parse(JSON.stringify(PL()));
    if (a==='optapply') { const m=O.moves[+b.dataset.mv]; if (!m) return true; CFG.piano=JSON.parse(JSON.stringify(m.P)); planSaved(prev); toast('Piano aggiornato: '+m.l); }
    else { CFG.piano=JSON.parse(JSON.stringify(O.greedy.P)); planSaved(prev); toast('Piano aggiornato con '+O.greedy.steps.length+(O.greedy.steps.length===1?' modifica':' modifiche')); }
    renderCurrent(true); window.scrollTo({ top:0, behavior:'smooth' }); return true; }
  if (a==='optai') { openChat(); sendChat('Guarda l\'ottimizzazione del mio piano: cosa cambieresti, cosa terresti d\'occhio e cosa non toccheresti? Usa i numeri della pagina e dimmi quanto ti fidi di ogni indicazione.'); return true; }
  if (a==='optask') { openChat(); return true; }
  return false; }
// contesto per Claude quando la chat parte da questa pagina: piano, numeri per periodo, proposte e gruppi
function optCtx() { const O=optAll(); if (!O) return 'servono almeno 6 settimane di trade nell\'EOW';
  const w=n=>OPT_WIN.reduce((o,x,i)=>(o[x.l]={ R_a_settimana:r2(n[i].rw), R_a_trade:r2(n[i].rt), trade:n[i].n, vinti:r2(n[i].wr), drawdown_R:r2(n[i].dd) }, o), {});
  const c=m=>({ modifica:m.l, verdetto:OPT_V[m.c.verdict]?OPT_V[m.c.verdict][1]:'nessuno', R_a_settimana_in_piu:{ tutto:r2(m.c.all), ultimi_3_mesi:r2(m.c.m3), ultimo_mese:r2(m.c.m1), ultime_2_settimane:r2(m.c.w2) }, probabilita_che_sia_vero:r2(m.c.p), trade_che_cambiano:m.c.aff });
  return { nota:'Backtest sui trade dell\'EOW: ogni alternativa simulata con le regole del piano e confrontata settimana per settimana. «Conviene» con probabilità ≥ 99% (pesata sulle settimane recenti) e ≥ 95% (tutte uguali), «indizio» con ≥ 90% e ≥ 75%: con una cinquantina di alternative provate un indizio falso esce circa una volta su tre.',
    periodo:optDates(O.B), settimane:O.B.weeks.length, piano:planDesc(O.P), risultati_del_piano:w(O.nums),
    consigliate:O.sugg.map(c), indizi_da_verificare:O.hint.map(c), da_tenere_d_occhio:O.watch.map(c), piano_proposto:{ fatto_solo_di_indizi:O.greedyOnlyHints, modifiche:O.greedy.steps.map(s=>s.l), risultati:w(O.greedyNums) },
    verifica_sulle_ultime_4_settimane_non_viste:O.wf ? { proposta_senza_ultime_4:O.wf.steps.map(s=>s.l), R_proposta:r2(O.wf.prop.R), R_piano:r2(O.wf.plan.R) } : null,
    gestioni:O.mg.map(m=>({ gestione:mgTxt(m.g), del_piano:m.cur, R_a_settimana:OPT_WIN.reduce((o,x,i)=>(o[x.l]=r2(m.nums[i].rw), o), {}) })),
    stop_a_BE_prima_di_2R:O.be.map(o=>({ gestione:mgTxt(o.g), R_a_settimana_tutto:[r2(o.lo[0].rw), r2(o.hi[0].rw)], nota:'intervallo dal caso peggiore al migliore' })),
    gruppi:O.groups.map(g=>({ dimensione:g.name, valori:g.rows.map(r=>({ valore:r.k, nel_piano:r.on, R_a_trade:{ tutto:r2(r.w[0].rt), ultimi_3_mesi:r2(r.w[1].rt), ultimo_mese:r2(r.w[2].rt) }, trade:{ tutto:r.w[0].n, ultimi_3_mesi:r.w[1].n, ultimo_mese:r.w[2].n }, mesi_positivi:r.mPos+'/'+r.mTot })) })) }; }


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['ottimizza.js'] = '2026-11-03.1';

// Edgebook · analisi.js — Analisi, Coach (consigli e chat con Claude), eliminazione di un trade.
// I file JS sono script classici caricati in ordine da index.html e condividono le stesse variabili globali:
// l'ordine conta (core.js → home.js → pagine.js → analisi.js → simula.js → scheda.js).
// ───────────────────────── ANALISI ─────────────────────────
// righe per categoria (idea, SMT, fascia…): ogni riga si tocca e apre l'elenco dei suoi trade
const BDG=new Map(); let bdId=0;
function bdReg(g, m, k, f) { const id=++bdId; BDG.set(id, { g, m, k, f:f||S.file }); if (BDG.size>400) BDG.delete(BDG.keys().next().value); return id; }
function bdRows(ts, m, keyFn, keys, d0, f) {
  let h='<div class="bd hd"><span></span><span>Win rate</span><span></span><span style="text-align:right">R</span></div>', j=0;
  keys.forEach(k=>{ const g=ts.filter(t=>{ const v=keyFn(t); return Array.isArray(v) ? v.includes(k) : v===k; }); if (!g.length) return; const a=agg(g,m);
    h+='<button type="button" class="bd tap" data-bd="'+bdReg(g,m,k,f)+'" aria-label="'+esc(k)+': vedi i '+a.n+' trade"><div class="bd-l"><span>'+esc(k)+'</span><small>'+a.n+' trade</small></div><div class="track"><i style="width:'+((a.wr||0)*100)+'%;--d:'+((d0||0)+j++*60)+'ms"></i></div><div class="p2 num">'+pct(a.wr)+'</div><div class="r '+sgn(a.R)+'">'+fmtR(a.R)+'</div></button>'; });
  return h;
}
// elenco dei trade di una categoria, in un pannello: riepilogo in cima, poi i trade dal più recente
function openBd(b) {
  const x=BDG.get(+b.dataset.bd); if (!x) return;
  const cat=(b.closest('.card')||{}).querySelector ? (b.closest('.card').querySelector('.h2')||{}).textContent||'' : '';
  const a=agg(x.g, x.m), E=x.f==='EOW', U=usdOn(E), list=x.g.slice().reverse();
  S.sheet='bd'; $('sh-sub').textContent=(cat?cat+' · ':'')+x.f; $('sh-title').innerHTML=words(x.k);
  $('sh-body').innerHTML='<div class="bd-sum"><div><span>Trade</span><b class="num">'+a.n+'</b></div><div><span>Win rate</span><b class="num">'+pct(a.wr)+'</b></div>'+
      '<div><span>Risultato</span><b class="num '+sgn(a.R)+'">'+fmtR(a.R)+'</b></div>'+(U?'<div><span>Dollari</span><b class="num '+sgn(usdSum(x.g,x.m))+'">'+fmtU(usdSum(x.g,x.m))+'</b></div>':'')+'</div>'+
    '<div class="bd-list">'+list.map(t=>'<button type="button" class="trow" data-open="'+x.f+':'+t.row+'">'+tline(t, x.f, { r:x.m.rOf(t), w:x.m.isWin(t), l:x.m.isLoss(t), date:true })+'</button>').join('')+'</div>';
  $('sh-foot').innerHTML=''; openSheet();   // al centro anche su PC, come la scheda del trade
}
function levelRows(rows) { // [{l, p, right, sub}]
  return rows.map((r,j)=>'<div class="bd"><div class="bd-l"><span>'+r.l+'</span>'+(r.sub?'<small>'+r.sub+'</small>':'')+'</div><div class="track"><i style="width:'+((r.p||0)*100)+'%;--d:'+(j*70)+'ms"></i></div><div class="p2 num">'+pct(r.p)+'</div><div class="r '+(r.cls||'')+'">'+r.right+'</div></div>').join('');
}
function dayNews(ts, m) {
  let h='<div class="tbl-wrap"><table><tr><th></th><th>Tutti</th><th>Red</th><th>Orange</th><th>No news</th></tr>';
  L.days.forEach(d=>{ const g=ts.filter(t=>t.day===d); if (!g.length) return;
    const c=(f,lbl)=>{ const x=g.filter(f); if (!x.length) return '<td>–</td>'; const a=agg(x,m);
      return '<td class="hm" style="--p:'+Math.round((a.wr||0)*55)+'%"><button type="button" class="hmb" data-bd="'+bdReg(x,m,d+(lbl?' · '+lbl:''))+'" aria-label="'+esc(d+' '+(lbl||''))+': vedi i '+x.length+' trade"><b class="num">'+pct(a.wr)+'</b><small>'+x.length+' trade</small></button></td>'; };
    h+='<tr><td>'+d.slice(0,3)+'</td>'+c(()=>true,'')+c(t=>t.news==='Red News','Red news')+c(t=>t.news==='Orange News','Orange news')+c(t=>t.news==='No News Day','No news')+'</tr>'; });
  return h+'</table></div>';
}
// card affiancate a due a due nell'ordine dato; se restano dispari l'ultima prende tutta la riga
// due colonne di card: su PC finiscono alla stessa altezza (l'ultima card di ogni colonna si allunga), sul telefono una sotto l'altra
const cols2 = (A, B) => { A=A.filter(Boolean); B=B.filter(Boolean); if (!A.length || !B.length) return A.concat(B).join('');
  return '<div class="mcols eq"><div class="mcol">'+A.join('')+'</div><div class="mcol">'+B.join('')+'</div></div>'; };
const rows2 = cards => { let h=''; for (let i=0;i<cards.length;i+=2) h+='<div class="prow'+(i+1<cards.length?'':' one')+'">'+cards[i]+(cards[i+1]||'')+'</div>'; return h; };
const card = (title, sub, body, d) => '<div class="card rise" style="--d:'+(d||0)+'ms"><div class="card-h"><h2 class="h2">'+title+'</h2>'+(sub?'<span class="sub">'+sub+'</span>':'')+'</div>'+body+'</div>';
const kpi = (lbl, v, hint, d, cls) => '<div class="kpi rise" style="--d:'+(d||0)+'ms"><div class="eyebrow">'+lbl+'</div><div class="v '+(cls||'')+'">'+v+'</div>'+(hint?'<div class="h">'+hint+'</div>':'')+'</div>';
function renderStats() {
  const el=$('v-stats'); if (!S.loaded) { el.innerHTML=skeleton(); return; }
  const E=S.type==='EOW', T=tgt(), m=curModel(), ts=filtered(m);
  let html='<div class="stat-h rise"><div><h1>'+words('Analisi')+'</h1></div><span class="mut num">'+ts.length+' trade</span></div>'+fbar(20);
  if (!ts.length) { enter(el, html+emptyState('Nessun trade', 'Nessun trade corrisponde ai filtri scelti. Allarga il periodo o togli qualche filtro.')); return; }
  const a=agg(ts,m), ringOff=94.25*(1-(a.wr||0)), U=usdOn(), uT=U?usdSum(ts,m):0;
  html+='<div class="kgrid">'+
    kpi('Trade', numEl(a.n,0), E?'Esito calcolato a '+T+'R':(a.be?a.be+' in pareggio':'Nessun pareggio'), 60)+
    kpi('Win rate', '<svg class="ring" viewBox="0 0 36 36"><circle class="bgc" cx="18" cy="18" r="15"/><circle class="fgc" cx="18" cy="18" r="15" stroke-dasharray="94.25" stroke-dashoffset="'+ringOff+'"/></svg>'+numEl(a.wr*100,0)+'<small>%</small>', a.w+' vinti su '+(a.w+a.l)+(!E&&a.be?' · con BE '+pct(a.wrAll):''), 90)+
    kpi('R totali', numEl(a.R,1,true)+'<small>R</small>', U?fmtU(uT)+(usdWhat()?' · '+usdWhat():E?' a '+usd(riskUsd())+' per trade':''):E?'Vinto '+T+'R, perso 1R':'Somma degli RR dei trade', 120, sgn(a.R))+
    kpi('Profit factor', a.pf===Infinity?'∞':numEl(a.pf,2), isFinite(a.pf)?fmtN(a.pf,1)+' R guadagnati per R perso':'', 150)+
    kpi('Expectancy', numEl(a.exp,2,true)+'<small>R</small>', U?fmtU(uT/ts.length)+' in media a trade':'Resa media per trade', 180, sgn(a.exp))+
    kpi('Max drawdown', numEl(a.dd,1)+'<small>R</small>', U?usd(usdDD(ts,m))+' dal picco':'Calo massimo dal picco', 210);
  if (E) { const mx=ts.filter(t=>isFinite(t.max)); html+=kpi('Max RR medio', numEl(mx.reduce((s,t)=>s+t.max,0)/(mx.length||1),2)+'<small>R</small>', 'Escursione favorevole media', 240)+
      kpi('Tempo medio a '+Math.min(T,5)+'R', (()=>{ const v=ts.map(t=>t.h[Math.min(T,5)-1]).filter(isFinite); return v.length?hhmm(v.reduce((x,y)=>x+y,0)/v.length):'–'; })(), 'Dall\'ingresso al livello', 270)+'</div>'; }
  else { const hs=ts.map(t=>t.hold).filter(isFinite); html+=kpi('Holding medio', hs.length?hhmm(hs.reduce((x,y)=>x+y,0)/hs.length):'–', 'Durata media del trade', 240)+
      kpi('Win rate con BE', numEl(a.wrAll*100,0)+'<small>%</small>', 'Pareggi contati come non vinti', 270)+'</div>'; }
  html+='<button type="button" class="mc-cta rise" style="--d:240ms" data-tab-go="coach"><span class="mc-ic">'+ic('spark',24,1.8)+'</span><span><b>Apri il coach</b><span>Consigli su questi '+ts.length+' trade e domande a Claude</span></span>'+ic('chev',18,2)+'</button>';
  const C={};   // ogni riquadro una volta sola; l'ordine delle righe è scelto sotto per affiancare riquadri di altezza simile
  C.eq=card('Curva dei risultati', ts.length+' trade', '<div class="chart" id="c-eq"></div>', 300);
  C.mo=card('R per mese', '', '<div class="chart" id="c-mo"></div>', 330);
  if (E) {
    C.tg=card('Win rate per target', 'expectancy a destra', levelRows([1,2,3,4,5].map(k=>{ const p=ts.filter(t=>t.best>=k).length/ts.length, ex=p*k-(1-p); return { l:k+'R', p, right:fmtN(ex,2,true), cls:sgn(ex), sub:k===T?'target attuale':'' }; })), 360);
    const conv=(x,y)=>{ const nx=ts.filter(t=>t.best>=x).length, ny=ts.filter(t=>t.best>=y).length; return { l:x+'R → '+y+'R', p:nx?ny/nx:NaN, right:ny+'/'+nx }; };
    C.cv=card('Conversione tra livelli', 'chi arriva a… poi arriva a…', levelRows([conv(1,2),conv(2,3),conv(3,4),conv(4,5),conv(2,5)]), 390);
  } else {
    C.pr=card('Probabilità di raggiungere il livello', 'dal Max Real RR', levelRows([1,2,3,4,5].map(k=>{ const n=ts.filter(t=>t.max>=k).length; return { l:k+'R', p:n/ts.length, right:String(n) }; })), 360);
  }
  C.fo=card('Fascia oraria', '', bdRows(ts,m,bandOf,L.bands.map(b=>b[0]),0), 420);
  C.id=card('Idea 5m', '', bdRows(ts,m,t=>t.idea,L.idea), 440);
  C.gn=card('Giorno e news', 'win rate', dayNews(ts,m), 460);
  C.smt=card('SMT', '', bdRows(ts,m,t=>t.smt,L.smt), 480);
  C.as=card('Asset', '', bdRows(ts,m,t=>t.a,L.asset), 500);
  if (hasCol('Direzione')) C.dir=card('Direzione', '', bdRows(ts,m,t=>t.dir,L.dir), 505);
  if (E && hasCol('2° CC')) C.cc=card('2° CC', '', bdRows(ts,m,t=>t.cc2?'Con 2° CC':'Senza 2° CC',['Con 2° CC','Senza 2° CC']), 507);
  C.lvn=card('Coming from LVN e struttura 1m', '', bdRows(ts,m,t=>t.lvn==='Si'?'Da LVN':t.lvn==='No'?'Non da LVN':'',['Da LVN','Non da LVN'])+'<div style="height:10px"></div>'+bdRows(ts,m,t=>t.clean?'1m pulito':'1m non pulito',['1m pulito','1m non pulito']), 520);
  if (E) {
    let sp='<div class="tbl-wrap"><table><tr><th></th>'+[1,2,3,4,5].map(k=>'<th>'+k+'R</th>').join('')+'</tr>';
    [['< 15 min',0,15],['15–30 min',15,30],['30–60 min',30,60],['> 1 ora',60,1e9]].forEach(b=>{ sp+='<tr><td>'+b[0]+'</td>'+[0,1,2,3,4].map(k=>{ const r=ts.filter(t=>t.best>k&&isFinite(t.h[k])); const c=r.filter(t=>t.h[k]>=b[1]&&t.h[k]<b[2]).length; return '<td class="num">'+(c||'·')+'</td>'; }).join('')+'</tr>'; });
    sp+='<tr><td>Media</td>'+[0,1,2,3,4].map(k=>{ const v=ts.filter(t=>isFinite(t.h[k])).map(t=>t.h[k]); return '<td class="num"><b>'+(v.length?hhmm(v.reduce((x,y)=>x+y,0)/v.length):'–')+'</b></td>'; }).join('')+'</tr></table></div>';
    C.sp=card('Velocità', 'tempo per raggiungere il livello', sp, 540);
  }
  const order = E ? ['eq','mo','tg','cv','fo','gn','id','smt','lvn','sp','as','dir','cc'] : ['eq','mo','pr','fo','id','smt','gn','lvn','as','dir'];
  html+=rows2(order.filter(k=>C[k]).map(k=>C[k]));
  html+='<button type="button" class="mc-cta rise" style="--d:560ms" data-act="mc"><span class="mc-ic">'+ic('dice',24,1.8)+'</span><span><b>Simula la prop firm</b><span>Il piano migliore per passare le valutazioni Topstep, coi trade dell\'EOW</span></span>'+ic('chev',18,2)+'</button>';
  enter(el, html, ()=>{ lineChart($('c-eq'), equityPts(ts,m), { h:200 }); barChart($('c-mo'), monthItems(ts,m), { h:170 }); });
}

// ───────────────────────── COACH (consigli dal periodo filtrato) ─────────────────────────
// Ogni gruppo (idea, fascia, giorno…) è giudicato sulla resa media per trade in R, «corretta» per il numero di trade:
// con pochi trade il valore viene avvicinato alla media generale (k=5), così 3 su 3 non vale come 30 su 40.
// «Forte» se anche il caso pessimo (80% di fiducia) è sopra zero, «da evitare» se anche il caso migliore è sotto zero.
const COACH_K = 5, COACH_Z = 1.28;
function rStats(rs) { const n=rs.length; if (!n) return { n:0 }; const mean=rs.reduce((x,y)=>x+y,0)/n;
  const sd = n>1 ? Math.sqrt(rs.reduce((s,r)=>s+(r-mean)*(r-mean),0)/(n-1)) : 0, se = n>1 ? sd/Math.sqrt(n) : Infinity;
  return { n, mean, lo:mean-COACH_Z*se, hi:mean+COACH_Z*se, sum:mean*n }; }
function coachGroups(ts, m, keyFn, keys, overall) {
  return keys.map(k=>{ const g=ts.filter(t=>keyFn(t)===k); if (g.length<3) return null; const st=rStats(g.map(m.rOf)), a=agg(g,m);
    const shr=(st.sum+COACH_K*overall)/(st.n+COACH_K);
    return { k, n:st.n, wr:a.wr, R:st.sum, exp:st.mean, shr, lo:st.lo, hi:st.hi, verdict: st.n>=5 && st.lo>0 ? 'forte' : st.n>=5 && st.hi<0 ? 'evitare' : 'neutro' }; })
    .filter(Boolean).sort((a,b)=>b.shr-a.shr);
}
function coachData(scope) {
  const E=S.type==='EOW', T=tgt(), m=curModel(), allSc=(scope||S.coachScope)==='all', ts=allSc ? all() : filtered(m); if (ts.length<5) return null;
  const all0=rStats(ts.map(m.rOf)), overall=all0.mean, a=agg(ts,m);
  const dims=[['Idea 5m',t=>t.idea,L.idea],['Fascia oraria',bandOf,L.bands.map(b=>b[0])],['Giorno',t=>t.day,L.days],['News',t=>t.news,L.news],
    ['SMT',t=>t.smt,L.smt],['Coming from LVN',t=>t.lvn==='Si'?'Da LVN':t.lvn==='No'?'Non da LVN':'',['Da LVN','Non da LVN']],
    ['Struttura 1m',t=>t.clean?'1m pulito':'1m non pulito',['1m pulito','1m non pulito']],['Asset',t=>t.a,L.asset]];
  if (hasCol('Direzione')) dims.push(['Direzione',t=>t.dir,['Long','Short']]);
  if (E && hasCol('2° CC')) dims.push(['2° CC',t=>t.cc2?'Con 2° CC':'Senza 2° CC',['Con 2° CC','Senza 2° CC']]);
  const groups={}; dims.forEach(([name,fn,keys])=>{ const g=coachGroups(ts,m,fn,keys,overall); if (g.length) groups[name]=g; });
  let targets=null;
  if (E) targets=[1,2,3,4,5].map(k=>{ const mm=model(k), st=rStats(ts.map(mm.rOf)); return { T:k, wr:ts.filter(mm.isWin).length/ts.length, exp:st.mean, lo:st.lo }; });
  const best = targets ? targets.slice().sort((x,y)=>y.lo-x.lo)[0] : null;
  const recentN=Math.min(20, Math.floor(ts.length/2)), rec = recentN>=5 ? rStats(ts.slice(-recentN).map(m.rOf)) : null;
  const dayNews=[]; L.days.forEach(d=>L.news.forEach(nw=>{ const g=ts.filter(t=>t.day===d && t.news===nw); if (g.length>=3) { const st=rStats(g.map(m.rOf)); dayNews.push({ day:d, news:nw, n:st.n, exp:st.mean, shr:(st.sum+COACH_K*overall)/(st.n+COACH_K) }); } }));
  let disc=null;
  if (!E && hasCol('Esecuzione')) { const ok=ts.filter(t=>t.exe==='Trade valido'), ko=ts.filter(t=>t.exe==='Errore'); if (ok.length+ko.length) {
    const errs={}; ko.forEach(t=>(t.errs||[]).forEach(e=>{ (errs[e]=errs[e]||{n:0,R:0}); errs[e].n++; errs[e].R+=m.rOf(t); }));
    disc={ valid:ok.length, errors:ko.length, R_valid:ok.reduce((s,t)=>s+m.rOf(t),0), R_errors:ko.reduce((s,t)=>s+m.rOf(t),0), byError:errs }; } }
  const d0=ts[0].d, d1=ts[ts.length-1].d;
  return { file:S.file, esito: E?'EOW: vinto '+T+'R se il trade arriva a '+T+'R prima dello stop, altrimenti −1R':'Journal: RR scritto nel trade (il PnL in dollari può differire per commissioni, slippage e size)',
    periodo: d0.getDate()+' '+MESI[d0.getMonth()]+' '+d0.getFullYear()+' → '+d1.getDate()+' '+MESI[d1.getMonth()]+' '+d1.getFullYear(),
    filtri: allSc ? ['nessuno: tutti i trade del file'] : activeFilters().map(x=>x.l), trade:ts.length, winrate:a.wr, R_totali:a.R, expectancy:overall, profit_factor:isFinite(a.pf)?a.pf:null, max_drawdown_R:a.dd,
    target_attuale: E?T:null, targets, target_consigliato: best && best.T, forma_recente: rec && { ultimi:recentN, expectancy:rec.mean, storico:overall },
    gruppi: groups, giorno_news: dayNews.sort((x,y)=>y.shr-x.shr), disciplina: disc,
    oggi: GIORNI[new Date().getDay()]+' '+new Date().getDate()+' '+MESI_F[new Date().getMonth()] };
}
const fR = x => fmtR(x,2);
function coachCard(cd) {
  if (!cd) return card('Coach', '', '<p class="mut" style="margin:0">Servono almeno 5 trade con questi filtri per dare consigli.</p>', 240);
  const E=S.type==='EOW', tips=[];
  if (E && cd.targets) { const b=cd.targets.find(t=>t.T===cd.target_consigliato), cur=cd.targets.find(t=>t.T===cd.target_attuale);
    tips.push({ i:'target', c:'', h:'Target consigliato: '+b.T+'R', p: b.T===cd.target_attuale ? 'È quello che stai già usando: resa media '+fR(b.exp)+' per trade (WR '+pct(b.wr)+').'
      : 'Resa media '+fR(b.exp)+' per trade (WR '+pct(b.wr)+'), contro '+fR(cur.exp)+' a '+cur.T+'R. È il target che regge meglio anche nel caso pessimo.' }); }
  const allG=[]; Object.entries(cd.gruppi).forEach(([dim,gs])=>gs.forEach(g=>allG.push(Object.assign({ dim }, g))));
  const strong=allG.filter(g=>g.verdict==='forte').sort((a,b)=>b.shr-a.shr).slice(0,3), avoid=allG.filter(g=>g.verdict==='evitare').sort((a,b)=>a.shr-b.shr).slice(0,3);
  strong.forEach(g=>tips.push({ i:'trendUp', c:'pos', h:g.dim+': '+g.k, p:fR(g.exp)+' per trade su '+g.n+' trade (WR '+pct(g.wr)+'): positivo anche nel caso pessimo.' }));
  avoid.forEach(g=>tips.push({ i:'alert', c:'neg', h:'Da evitare · '+g.dim+': '+g.k, p:fR(g.exp)+' per trade su '+g.n+' trade (WR '+pct(g.wr)+'): negativo anche nel caso migliore.' }));
  if (!strong.length && !avoid.length) { const top=allG.filter(g=>g.n>=5)[0]; if (top) tips.push({ i:'target', c:'', h:'Il più promettente: '+top.dim+' '+top.k, p:fR(top.exp)+' per trade su '+top.n+' trade. Non ancora abbastanza trade per esserne sicuri.' }); }
  if (cd.forma_recente) { const f=cd.forma_recente, dv=f.expectancy-f.storico;
    tips.push({ i:dv>=0?'trendUp':'trendDn', c:dv>=0?'pos':'neg', h:'Forma recente: '+(Math.abs(dv)<0.1?'in linea':dv>0?'meglio del solito':'peggio del solito'), p:'Ultimi '+f.ultimi+' trade: '+fR(f.expectancy)+' per trade, contro '+fR(f.storico)+' del periodo.' }); }
  const dn=cd.giorno_news; if (dn.length>=2) { const b=dn[0], w=dn[dn.length-1];
    tips.push({ i:'clock', c:'', h:'Prossimi giorni', p:'Meglio: '+b.day+' con '+b.news+' ('+fR(b.exp)+' su '+b.n+'). '+(w.exp<0?'Più difficile: '+w.day+' con '+w.news+' ('+fR(w.exp)+' su '+w.n+').':'') }); }
  if (cd.disciplina) { const d=cd.disciplina, tot=d.valid+d.errors;
    tips.push({ i:'check', c:d.R_errors<0?'neg':'', h:'Disciplina: '+pct(d.valid/tot)+' di trade validi', p:'Validi '+fR(d.valid?d.R_valid/d.valid:NaN)+' per trade, con errori '+fR(d.errors?d.R_errors/d.errors:NaN)+' ('+d.errors+' trade). '+(d.errors?'I più costosi: '+Object.entries(d.byError).sort((a,b)=>a[1].R-b[1].R).slice(0,2).map(([k,v])=>k+' '+v.n+'× ('+fmtR(v.R,1)+')').join(', ')+'.':'') }); }
  const body='<div class="tips">'+tips.map(t=>'<div class="tip-row"><div class="ins-ic'+(t.c==='neg'?' bad':'')+'">'+ic(t.i,18)+'</div><div><b class="'+t.c+'">'+esc(t.h)+'</b><span>'+esc(t.p)+'</span></div></div>').join('')+'</div>'+
    '<div id="ai-box">'+aiBox()+'</div>';
  return card('Consigli', cd.trade+' trade · '+cd.periodo, body, 240);
}
// commento di Claude: le statistiche aggregate vanno allo script, che chiama l'API di Anthropic (serve ANTHROPIC_KEY nello script)
const aiKey = cd => JSON.stringify(cd);
function aiBox() {
  const cd=S._coach, saved=cd && aiCacheGet(aiKey(cd));
  if (saved) return '<div class="ai"><div class="ai-h">'+logo(20)+'<b>Analisi di Claude</b><button type="button" class="link" data-act="claude">Rifai</button></div><div class="md">'+md(saved)+'</div></div>';
  return '<button type="button" class="btn sec ai-go" data-act="claude">'+ic('spark',18,2)+'Analisi completa di Claude</button>';
}
function aiCacheGet(k) { try { const c=JSON.parse(localStorage.getItem('tj.ai')||'{}'); return c[k]; } catch(e) { return null; } }
function aiCacheSet(k, v) { try { localStorage.setItem('tj.ai', JSON.stringify({ [k]:v })); } catch(e) {} }
async function askClaude() {
  const cd=S._coach; if (!cd) return; const box=$('ai-box');
  box.innerHTML='<div class="ai"><div class="ai-h">'+logo(20)+'<b>Claude sta analizzando…</b><span class="spin dark"></span></div><div class="skel" style="height:110px"></div></div>';
  try { const txt=await call('coach', cd); aiCacheSet(aiKey(cd), txt); box.innerHTML=aiBox(); }
  catch(e) { const m=e.message||String(e);
    box.innerHTML='<div class="warn">'+ic('alert',17,2)+'<span>'+(m.indexOf('NO_CLAUDE_KEY')>=0 ? 'Nello script mancano le proprietà ANTHROPIC_KEY e CLAUDE_MODEL: aggiungile (vedi istruzioni) e riprova.' : 'Claude non ha risposto: '+esc(m))+'</span></div>'+
      '<button type="button" class="btn sec ai-go" data-act="claude">Riprova</button>'; }
}
function md(s) { // Markdown minimo: titoli ##, elenchi -, grassetto **
  const inl=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  let h='', list=false;
  String(s).split('\n').forEach(l=>{ const t=l.trim();
    if (/^[-•*] /.test(t)) { if (!list) { h+='<ul>'; list=true; } h+='<li>'+inl(t.replace(/^[-•*] /,''))+'</li>'; return; }
    if (list) { h+='</ul>'; list=false; }
    if (/^#{1,4} /.test(t)) h+='<h4>'+inl(t.replace(/^#{1,4} /,''))+'</h4>'; else if (t) h+='<p>'+inl(t)+'</p>'; });
  return h+(list?'</ul>':'');
}



// ───────────────────────── COACH: pagina dedicata e chat con Claude da ogni pagina ─────────────────────────
const PAGE_LBL = { home:'Panoramica', news:'News', list:'Trade', stats:'Analisi', cal:'Calendario', disc:'Disciplina', coach:'Coach', mc:'Simula', set:'Impostazioni' };
function renderCoach() {
  const el=$('v-coach'); if (!S.loaded) { el.innerHTML=skeleton(); return; }
  S._coach=coachData();
  const allS=S.coachScope==='all', n=allS ? all().length : filtered().length;
  let html='<div class="stat-h rise"><div><h1>'+words('Coach')+'</h1></div><span class="mut num">'+n+' trade</span></div>'+
    '<div class="rise scope" style="--d:20ms">'+seg('coach-scope',[{v:'all',l:'Tutti i trade'},{v:'filt',l:'Con i filtri'}],S.coachScope)+'</div>'+(allS ? '' : fbar(30));
  html+=coachCard(S._coach);
  html+='<div class="card rise" style="--d:300ms"><div class="card-h"><div class="h2">Chiedi al coach</div><span class="sub">vede tutti i trade e le note</span></div>'+
    '<div class="coach-chat"><div class="chat" id="chat-main"></div>'+chatInput()+'</div></div>';
  enter(el, html, ()=>renderChat(false));
}
let chatBusy=false;
S.coachScope = (()=>{ try { return sessionStorage.getItem('tj.cscope')||'all'; } catch(e) { return 'all'; } })();
S.chat = (()=>{ try { return JSON.parse(sessionStorage.getItem('tj.chat')||'[]'); } catch(e) { return []; } })();
const saveChat = () => { try { sessionStorage.setItem('tj.chat', JSON.stringify(S.chat.slice(-40).map(({fresh,...m})=>m))); } catch(e) {} };
const chatInput = () => '<form class="chat-in" id="chat-form"><textarea class="inp" id="chat-q" rows="1" placeholder="Scrivi una domanda…" enterkeyhint="send"></textarea>'+
  '<button type="submit" class="btn" aria-label="Invia">'+ic('send',20,2.2)+'</button></form>';
const SUGG = {
  home: ['Com\'è andato questo periodo?', 'Su cosa devo concentrarmi domani?'],
  list: ['Vedi un pattern negli ultimi trade?', 'Quali errori ripeto più spesso?'],
  stats: ['Quale target mi conviene?', 'Quali idee dovrei evitare?'],
  coach: ['Cosa ha funzionato e cosa no?', 'Preparami un piano per la prossima settimana'],
  mc: ['Spiegami questo piano', 'Con che rischio per trade sono tranquillo?'],
};
function renderChat(scroll) {
  const el=$('chat-main'); if (!el) return;
  let h='';
  if (!S.chat.length) h='<p class="mut" style="margin:0;font-size:13.5px">Chiedimi qualcosa: vedo tutti i trade di '+S.file+' con le note, la pagina che stai guardando e i filtri attivi.</p><div class="sugg">'+
    (SUGG[S.tab]||SUGG.coach).map(q=>'<button type="button" class="chip" data-q="'+esc(q)+'">'+esc(q)+'</button>').join('')+'</div>';
  h+=S.chat.map(m=> m.r==='u' ? '<div class="msg u"><span class="ctxt">'+esc(m.pg||'')+'</span>'+esc(m.t)+'</div>'
                   : m.r==='e' ? '<div class="msg a err">'+esc(m.t)+'</div>' : '<div class="msg a md'+(m.fresh?' fresh':'')+'">'+md(m.t)+'</div>').join('');
  if (chatBusy) h+='<div class="msg a"><span class="thinking">'+ic('spark',16,2)+'Claude sta pensando…</span></div>';
  if (S.chat.length && !chatBusy) h+='<button type="button" class="link" data-act="chatclear" style="align-self:center;font-size:12.5px">Nuova conversazione</button>';
  el.innerHTML=h;
  const fr=el.querySelector('.msg.fresh'); if (fr) { revealWords(fr); S.chat.forEach(m=>delete m.fresh); }
  if (scroll===false) return;
  const sc = S.sheet==='chat' ? $('sh-body') : null, tgtEl = fr || el.lastElementChild;
  if (sc) sc.scrollTo({ top: fr ? fr.offsetTop-12 : sc.scrollHeight, behavior:'smooth' }); else if (tgtEl) tgtEl.scrollIntoView({ block: fr ? 'start' : 'nearest', behavior:'smooth' });
}
// la risposta di Claude compare parola per parola, con una leggera dissolvenza
function revealWords(root) {
  const nodes=[], tw=document.createTreeWalker(root, NodeFilter.SHOW_TEXT); while (tw.nextNode()) nodes.push(tw.currentNode);
  let i=0; const total=nodes.reduce((n,t)=>n+t.nodeValue.split(/\s+/).length,0); root.style.setProperty('--st', Math.max(8, Math.min(32, 2600/Math.max(1,total)))+'ms');
  nodes.forEach(t=>{ const f=document.createDocumentFragment();
    t.nodeValue.split(/(\s+)/).forEach(w=>{ if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
      const sp=document.createElement('span'); sp.className='w'; sp.style.setProperty('--i', i++); sp.textContent=w; f.appendChild(sp); });
    t.replaceWith(f); });
}
function openChat() {
  if (S.tab!=='coach') $('v-coach').innerHTML='';   // un solo campo chat alla volta nella pagina
  S.sheet='chat'; $('sh-sub').textContent=S.file+' · '+PAGE_LBL[S.tab]; $('sh-title').innerHTML=words('Coach');
  $('sh-body').innerHTML='<div class="chat" id="chat-main"></div>'; $('sh-foot').innerHTML=chatInput(); openSheet(true); renderChat();
  if (matchMedia('(hover:hover)').matches) setTimeout(()=>$('chat-q') && $('chat-q').focus(), 400);
}
const tradeCtx = (t, m) => { const o={ data:t.raw.Data, ora:String(t.raw.Ora).slice(0,5), asset:t.a, direzione:t.dir, idea:t.idea, news:t.news, lvn:t.lvn, smt:t.smt,
  struttura_1m_pulita:t.clean, esito_R:r2(m.rOf(t)), max_rr:t.max, esecuzione:t.exe, errori:(t.errs||[]).join(', '), note:t.note };
  Object.keys(o).forEach(k=>{ if (o[k]===undefined || o[k]==='' || o[k]===null || (typeof o[k]==='number' && !isFinite(o[k]))) delete o[k]; }); return o; };
// tutti i trade del file in forma di tabella (colonne + righe): compatto, così Claude può rispondere anche fuori dai filtri
function tableCtx(ts, m) {
  const J=S.type!=='EOW', cols=['data','ora','asset','direzione','idea','news','lvn','smt','1m_pulito','esito_R','max_rr'].concat(J?['esecuzione','errori','note']:['note']);
  return { colonne:cols, righe:ts.map(t=>{ const r=[t.raw.Data, String(t.raw.Ora).slice(0,5), t.a, t.dir||'', t.idea||'', t.news||'', t.lvn||'', t.smt||'', t.clean?1:0, r2(m.rOf(t)), isFinite(t.max)?t.max:null];
    return J ? r.concat([t.exe||'', (t.errs||[]).join(', '), t.note||'']) : r.concat([t.note||'']); }) };
}
function ctxNow() {
  const m=curModel(), ts=filtered(m), a=agg(ts,m), E=S.type==='EOW', tab=S.tab;
  const c={ app:APP, file:S.file, significato_file: E ? 'EOW: review di fine settimana dei setup (backtest), esito calcolato a un target fisso di '+tgt()+'R' : 'Journal: trade reali eseguiti, esito = RR effettivo',
    pagina:PAGE_LBL[tab], filtri:activeFilters().map(x=>x.l), oggi:new Date().toLocaleDateString('it-IT',{ weekday:'long', day:'numeric', month:'long', year:'numeric' }),
    trade_filtrati:ts.length, riepilogo_filtrati:{ winrate:r2(a.wr), R_totali:r2(a.R), expectancy:r2(a.exp), profit_factor:isFinite(a.pf)?r2(a.pf):null, max_drawdown_R:r2(a.dd) },
    statistiche_tutti_i_trade:coachData('all'), statistiche_con_filtri:coachData('filt'), tutti_i_trade:tableCtx(all(), m) };
  if (tab==='home') { const p=inRange(ts, periodRange(S.per,0)), pa=agg(p,m); c.periodo_home={ periodo:S.per, trade:p.length, R:r2(pa.R), winrate:r2(pa.wr) }; c.trade_del_periodo=p.slice(-20).map(t=>tradeCtx(t,m)); }
  else if (tab==='mc') { const a=S.pfA&&S.pfA.res;
    c.simulazione_prop_firm={ nota:'Simula usa tutti i trade dell\'EOW (i filtri della pagina non valgono) e dà più peso ai giorni recenti', scelte:{ conto:S.pf.size, conti_da_passare:+S.pf.n, entro:pfWkLbl(S.pf.weeks), approccio:S.pf.goal==='fast'?'veloce':'prudente' },
      piano: a ? { conto:pfAccTxt(a.size,a.best.d), modo:PF_MODE[a.best.mode], trade:pfDesc(a.strats[a.best.i].st), rischio_a_trade:a.best.rE, dosaggio_rischio:PF_DYN[a.best.dyn], rischio_quanto_basta_verso_il_target:!!a.best.need, tetto_profitto_giornaliero:a.best.dcap?a.size&&PF_PRE[a.size].target*PF_CONS/100:null,
        statistiche_trade:{ vinti:r2(a.strats[a.best.i].num.wr), R_medi_a_trade:r2(a.strats[a.best.i].num.avg), profit_factor:r2(a.strats[a.best.i].num.pf), trade_a_settimana:r2(a.strats[a.best.i].num.week), serie_peggiore_stop:a.strats[a.best.i].num.streak, drawdown_R:r2(a.strats[a.best.i].num.dd) },
        filtri_tenuti:a.strats[a.best.i].log.map(l=>pfChange(l.ch)), filtri_scartati:a.strats[a.best.i].rej.map(l=>pfChange(l.ch)), entro_giorni_di_borsa:a.Td,
        prob_passarli_entro:r2(a.res.P), prob_con_tutti_i_giorni_uguali:r2(a.resAll.P), giorni_mediani:a.res.doneQ[1], spesa_media_abbonamenti:Math.round(a.res.cost), commissioni_medie:Math.round(a.res.comm), conti_bruciati_medi:r2(a.res.burned), regola:'un tentativo per conto, i conti bruciati non si ricomprano',
        per_modo:a.byMode.map(v=>({ modo:PF_MODE[v.mode], prob:r2(v.P), rischio:v.rE })), con_senza_dll:a.byDll.map(v=>({ dll:v.d, prob:r2(v.P), rischio:v.rE })), per_rischio:a.byRisk.map(v=>({ rischio:v.rE, prob:r2(v.P) })),
        strategie:a.byStrat.map(v=>({ trade:pfDesc(a.strats[v.i].st), prob:r2(v.P), rischio:v.rE })), regole_topstep:PF_PRE[a.size] } : 'non ancora calcolato' }; }
  else if (tab==='list') c.trade_visibili_in_pagina=ts.slice(-30).map(t=>tradeCtx(t,m));
  return c;
}
async function sendChat(q) {
  q=String(q||'').trim(); if (!q || chatBusy) return;
  S.chat.push({ r:'u', t:q, pg:PAGE_LBL[S.tab]+' · '+S.file }); chatBusy=true; saveChat(); renderChat(true);
  const hist=S.chat.filter(x=>x.r!=='e').slice(-12).map(x=>({ role:x.r==='u'?'user':'assistant', content:x.t }));
  try { const txt=await call('chat', ctxNow(), hist); S.chat.push({ r:'a', t:txt, fresh:1 }); }
  catch(e) { const m=e.message||String(e); S.chat.push({ r:'e', t: m.indexOf('NO_CLAUDE_KEY')>=0 ? 'Nello script mancano ANTHROPIC_KEY e CLAUDE_MODEL: aggiungile nelle proprietà dello script.' : 'Claude non ha risposto: '+m }); }
  chatBusy=false; saveChat(); renderChat(true);
}
document.addEventListener('submit', e => { if (e.target.id!=='chat-form') return; e.preventDefault(); const t=$('chat-q'); sendChat(t.value); t.value=''; });
document.addEventListener('keydown', e => { if (e.target.id==='chat-q' && e.key==='Enter' && !e.shiftKey && matchMedia('(hover:hover)').matches) { e.preventDefault(); $('chat-form').requestSubmit(); } });

// ───────────────────────── eliminazione di un trade ─────────────────────────
// Nel foglio la riga viene tolta (nessun buco): le righe sotto salgono di uno, quindi qui si aggiornano i numeri di riga.
let delT;
function delClick(b) {
  if (!b.classList.contains('arm')) { b.classList.add('arm'); b.innerHTML=ic('trash',18,2)+'Conferma'; clearTimeout(delT); delT=setTimeout(()=>{ if (b.isConnected) { b.classList.remove('arm'); b.innerHTML=ic('trash',18,2); } }, 3500); return; }
  delTrade();
}
async function delTrade() {
  const file=S.file, edit=S.edit; if (!edit) return; const row=edit.row;
  const snapRows=S.rows.map(r=>[r, r._row]), snapData=S.data[file] && JSON.parse(JSON.stringify(S.data[file]));   // anche i numeri di riga, che qui sotto scalano
  S.rows=S.rows.filter(r=>r._row!==row); S.rows.forEach(r=>{ if (r._row>row) r._row--; }); touchRows();
  const D=S.data[file]; if (D) { D.rows=D.rows.filter(a=>a[0]!==row).map(a=>a[0]>row ? [a[0]-1].concat(a.slice(1)) : a); cacheSet(file,D); }
  closeSheet(); S.edit=null; S.f={}; renderCurrent(true); setSync(true);
  try { await callW('deleteTrade', file, row, edit.check); toast('Trade eliminato da '+file); }
  catch(e) { S.rows=snapRows.map(([r,n])=>{ r._row=n; return r; }); touchRows(); if (snapData) { S.data[file]=snapData; cacheSet(file,snapData); } renderCurrent(true); toast('Non eliminato: '+errTxt(e)+'. Ricarica e controlla.', true); }
  finally { setSync(false); }
}


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['analisi.js'] = '2026-10-28.1';

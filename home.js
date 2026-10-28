// Edgebook · home.js — Home, palette comandi, Panoramica, News, Trump, riepilogo di oggi.
// I file JS sono script classici caricati in ordine da index.html e condividono le stesse variabili globali:
// l'ordine conta (core.js → home.js → pagine.js → analisi.js → simula.js → scheda.js).
// ───────────────────────── HOME ─────────────────────────
function sessionInfo() {
  const it = romeDate(Date.now()), m=it.getHours()*60+it.getMinutes(), wd=it.getDay(), ss=sessOf(iso(it));   // formattatore già pronto (toLocaleString ne creava uno a ogni chiamata)
  const fm = x => (x>=60 ? Math.floor(x/60)+' h ' : '')+String(x%60).padStart(x>=60?2:1,'0')+' min';
  if (wd>=1 && wd<=5 && m>=ss[0] && m<ss[1]) return { open:true, txt:'Sessione aperta · chiude tra '+fm(ss[1]-m) };
  if (wd>=1 && wd<=5 && m<ss[0]) return { open:false, txt:'La sessione inizia tra '+fm(ss[0]-m) };
  let add=1; while ([0,6].includes((wd+add)%7)) add++;
  const s1=hmMin(sessOf(iso(addDays(it,add)))[0]);
  return { open:false, txt: add===1 ? 'Sessione domani alle '+s1 : 'Prossima sessione '+GIORNI[(wd+add)%7]+' alle '+s1 };
}
const greeting = () => { const h=new Date().getHours(); return (h<5 ? 'Buonanotte' : h<13 ? 'Buongiorno' : h<18 ? 'Buon pomeriggio' : 'Buonasera')+', '+USER; };

// ───────────────────────── PALETTE COMANDI (⌘K / Ctrl+K) ─────────────────────────
// Pagine, azioni e trade di entrambi i file in un solo campo. Si apre senza animazione: la si usa di continuo.
const PAL={ on:false, i:0, items:[], last:null };
function palAll(q) {
  q=q.trim().toLowerCase(); const out=[];
  const kb=matchMedia('(hover:hover) and (pointer:fine)').matches, add=(g,l,i,run,em,kw)=>{ if (em && em.length<3 && !kb) em=''; if (!q || (l+' '+(kw||'')+' '+(em||'')).toLowerCase().includes(q)) out.push({ g,l,i,run,em }); };
  [...NAV.filter(n=>!n.g),...NAV_FOOT].forEach((n,j)=>add('Pagine', n.l, n.i, ()=>navTo(navKey(n),{ instant:true }), String(j+1), 'vai pagina '+(n.f||'')));
  add('Azioni','Nuovo trade nel Journal','plus',()=>{ switchFile('Journal'); openForm(); },'N','aggiungi registra reale');
  add('Azioni','Nuovo backtest nell\'EOW','plus',()=>{ switchFile('EOW'); openForm(); },'','aggiungi registra eow');
  if (!NOFILE.includes(S.tab)) add('Azioni','Apri i filtri','filter',openFilters,'F','filtra');
  add('Azioni','Aggiorna le news','refresh',()=>{ navTo('news',{ instant:true }); loadNews(true).catch(()=>{}); },'','forexfactory calendario');
  add('Azioni','Passa a '+(S.file==='EOW'?'Journal':'EOW'),'list',()=>switchFile(S.file==='EOW'?'Journal':'EOW'),'','file cambia');
  add('Azioni','Tema: '+({ auto:'chiaro', light:'scuro', dark:'automatico' }[CFG.theme]||'chiaro'),'sun',()=>{ CFG.theme={ auto:'light', light:'dark', dark:'auto' }[CFG.theme]||'light'; cfgChanged('theme'); toast('Tema '+({ auto:'automatico', light:'chiaro', dark:'scuro' }[CFG.theme])); },'','dark light scuro chiaro');
  if (innerWidth>=1000) add('Azioni',document.documentElement.classList.contains('sbc')?'Espandi la barra laterale':'Comprimi la barra laterale','side',()=>{ const c=document.documentElement.classList.toggle('sbc'); store.set('sbc', c?'1':''); setTimeout(moveInd, 560); });
  if (q.length>=2) {
    const rows=[]; ['Journal','EOW'].forEach(f=>(rowsOf(f)||[]).forEach(t=>rows.push({ t, f })));
    rows.filter(({t,f})=>[t.raw.Data, String(t.raw.Ora).slice(0,5), t.a, t.idea, t.dir, t.news, f, (t.errs||[]).join(' '), t.note].join(' ').toLowerCase().includes(q))
      .sort((a,b)=>(b.t.d-a.t.d)||(b.t.o-a.t.o)).slice(0,8)
      .forEach(({t,f})=>out.push({ g:'Trade', l:t.a+' '+t.raw.Data+' '+String(t.raw.Ora).slice(0,5)+' · '+(t.idea||''), i:f==='EOW'?'list':'book',
        em: f+' · '+(f==='EOW' ? (t.best>=2?'+2':'−1') : fmtN(isFinite(t.rr)?t.rr:0,2,true))+' R', run:()=>{ switchFile(f); openForm(t.row); } }));
  }
  return out;
}
function palToggle(force, ptr) {
  let el=$('pal');
  if (!el) { el=document.createElement('div'); el.id='pal'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-label','Palette comandi');
    el.innerHTML='<div class="pl"><div class="pl-in">'+ic('search',18,2)+'<input id="pal-q" type="text" placeholder="Cerca pagine, azioni, trade…" autocomplete="off" spellcheck="false" aria-controls="pal-list"><kbd>Esc</kbd></div><div class="pl-list" id="pal-list" role="listbox"></div></div>';
    document.body.appendChild(el);
    el.addEventListener('pointerdown', e=>{ if (e.target===el) palToggle(false); });
    $('pal-q').addEventListener('input', ()=>{ PAL.i=0; palRender(); });
    $('pal-q').addEventListener('keydown', e=>{ const n=PAL.items.length;
      if (e.key==='ArrowDown') { e.preventDefault(); PAL.i=(PAL.i+1)%Math.max(n,1); palRender(true); }
      else if (e.key==='ArrowUp') { e.preventDefault(); PAL.i=(PAL.i-1+n)%Math.max(n,1); palRender(true); }
      else if (e.key==='Enter') { e.preventDefault(); palRun(PAL.i); }
      else if (e.key==='Escape') { e.preventDefault(); e.stopPropagation(); palToggle(false); } }); }
  const on = force===undefined ? !PAL.on : !!force;
  if (on===PAL.on) { if (on) $('pal-q').focus(); return; }
  PAL.on=on; el.classList.toggle('on', on); el.classList.toggle('ptr', !!(on && ptr && !reduceMotion()));
  if (on) { PAL.last=document.activeElement; $('pal-q').value=''; PAL.i=0; palRender(); $('pal-q').focus(); }
  else if (PAL.last && PAL.last.focus) PAL.last.focus();
}
function palRender(keep) {
  PAL.items=palAll($('pal-q').value); let g='', h='';
  PAL.items.forEach((it,i)=>{ if (it.g!==g) { g=it.g; h+='<div class="pl-g">'+g+'</div>'; }
    h+='<button type="button" class="pl-i'+(i===PAL.i?' on':'')+'" data-pi="'+i+'" role="option" aria-selected="'+(i===PAL.i)+'">'+ic(it.i,17,2)+'<span>'+esc(it.l)+'</span>'+(it.em?'<em>'+esc(it.em)+'</em>':'')+'</button>'; });
  $('pal-list').innerHTML = h || '<div class="pl-none">Nessun risultato. Prova con una data (15/10), un\'idea (BT) o un errore (FOMO).</div>';
  const on=$('pal-list').querySelector('.pl-i.on'); if (on && keep) on.scrollIntoView({ block:'nearest' });
}
function palRun(i) { const it=PAL.items[i]; if (!it) return; palToggle(false); it.run(); }

// ───────────────────────── PANORAMICA: tutto insieme (Journal + EOW + news) e introduzione alla giornata ─────────────────────────
function renderHome() {
  const el=$('v-home'); loadNews().catch(()=>{}); loadTrump().catch(()=>{});
  const now=new Date(), ses=sessionInfo();
  let h='<div class="hello"><div><div class="eyebrow">'+GIORNI[now.getDay()]+' '+now.getDate()+' '+MESI_F[now.getMonth()]+'</div><h1>'+words(greeting())+'</h1></div>'+
    '<span class="sess'+(ses.open?' open':'')+'" id="sess"><i></i>'+ses.txt+'</span></div>';
  h += revHomeCard();
  if (!S.loaded) { enter(el, h+skeleton()); return; }
  const T=tgt(), m=curModel(), ALL=filtered(m,true), ts=inRange(ALL,periodRange(S.per,0)), prev=inRange(ALL,periodRange(S.per,1));
  const a=agg(ts,m), pa=agg(prev,m), E=S.type==='EOW';
  const dd = d => d.getDate()+' '+MESI[d.getMonth()], cr = S.per==='c' ? periodRange('c',0) : null, cOk = cr && cr[0].getFullYear()>2000;
  const perLbl = { w:wkLbl().toLowerCase(), m: MESI_F[now.getMonth()]+' '+now.getFullYear(), '3m':'ultimi 3 mesi', y:String(now.getFullYear()), all:'da sempre',
                   c: cOk ? dd(cr[0])+' → '+dd(addDays(cr[1],-1)) : 'scegli le date' }[S.per];
  const prevLbl = { w: E ? 'rispetto alla settimana prima' : 'rispetto alla settimana scorsa', m:'rispetto a '+MESI_F[(now.getMonth()+11)%12], '3m':'rispetto ai 3 mesi prima', y:'rispetto al '+(now.getFullYear()-1),
                    c: cOk ? 'rispetto ai '+Math.round((cr[1]-cr[0])/dayMs)+' giorni prima' : '' }[S.per];
  h += fbar(30);
  h += '<div class="perseg">'+seg('per',[{v:'w',l:'Sett.'},{v:'m',l:'Mese'},{v:'3m',l:'3M'},{v:'y',l:'Anno'},{v:'all',l:'Tutto'},{v:'c',h:ic('cal',16,2),l:'Date'}],S.per)+'</div>';
  if (S.per==='c') h += '<div class="card"><div class="g2"><div class="field"><label for="hp-from">Dal</label><input class="inp" id="hp-from" type="date" data-hp="from" value="'+esc(S.cust.from||'')+'"></div>'+
    '<div class="field"><label for="hp-to">Al</label><input class="inp" id="hp-to" type="date" data-hp="to" value="'+esc(S.cust.to||'')+'"></div></div>'+
    (S.cust.from && S.cust.to && !cOk ? '<div class="ferr" style="display:flex;margin-top:8px">'+ic('alert',15,2)+'<span>La data finale è prima di quella iniziale.</span></div>' : '')+'</div>';
  if (!ts.length) h += emptyState('Nessun trade nel periodo', 'Con questi filtri non ci sono trade di '+S.file+' per '+perLbl+'.', 'Aggiungi un trade');
  else {
    const U=usdOn(), uT=U?usdSum(ts,m):0;
    let delta='';
    if (prevLbl && prev.length) { const dv=a.R-pa.R; delta='<span class="delta '+(dv>0?'up':dv<0?'down':'flat')+'">'+ic(dv>=0?'trendUp':'trendDn',14,2.2)+fmtR(dv)+(U?' · '+fmtU(uT-usdSum(prev,m)):'')+'</span><span>'+prevLbl+'</span>'; }
    h += '<div class="hero"><div class="hero-glow"></div><div class="hero-top"><div><div class="eyebrow">Risultato · '+perLbl+'</div>'+
      '<div class="big '+sgn(a.R)+'">'+numEl(a.R,E?0:1,true)+'<small>R</small></div>'+(U?'<div class="hero-usd num '+sgn(uT)+'">'+fmtU(uT)+(usdWhat()?'<small>'+usdWhat()+'</small>':'')+'</div>':'')+'</div><span class="hero-n">'+a.n+' trade</span></div>'+
      '<div class="hero-meta">'+(delta||'<span>'+(E?'esito a '+T+'R':'RR dei trade')+'</span>')+'</div>'+
      '<div class="spark" id="c-spark"></div></div>';
    const ringOff = 94.25*(1-(isFinite(a.wr)?a.wr:0));
    h += '<div class="kgrid">'+
      '<div class="kpi"><div class="eyebrow">Win rate</div><div class="v"><svg class="ring" viewBox="0 0 36 36"><circle class="bgc" cx="18" cy="18" r="15"/><circle class="fgc" cx="18" cy="18" r="15" stroke-dasharray="94.25" stroke-dashoffset="'+ringOff+'"/></svg>'+numEl(a.wr*100,0)+'<small>%</small></div><div class="h">'+a.w+' vinti su '+(a.w+a.l)+(a.be?' · '+a.be+' BE':'')+'</div></div>'+
      '<div class="kpi"><div class="eyebrow">Profit factor</div><div class="v">'+(a.pf===Infinity?'∞':numEl(a.pf,2))+'</div><div class="h">'+(isFinite(a.pf)?'Guadagni '+fmtN(a.pf,1)+' R per ogni R perso':'Nessuna perdita nel periodo')+'</div></div>'+
      '<div class="kpi"><div class="eyebrow">Expectancy</div><div class="v '+sgn(a.exp)+'">'+numEl(a.exp,2,true)+'<small>R</small></div><div class="h">'+(U?fmtU(uT/ts.length)+' in media a trade':'Resa media di ogni trade')+'</div></div>'+
      '<div class="kpi"><div class="eyebrow">Max drawdown</div><div class="v">'+numEl(a.dd,1)+'<small>R</small></div><div class="h">'+(U?usd(usdDD(ts,m))+' dal picco':'Calo massimo dal picco')+'</div></div></div>';
  }
  h += briefing();      // la giornata: piano e news di oggi, checklist, cosa aspettarsi
  const colL=[], colR=[];   // sotto il riepilogo: due colonne che finiscono alla stessa altezza
  const last=ALL.slice(-10);
  if (last.length) {
    let st=0, kind=null; for (let i=ALL.length-1;i>=0;i--) { const k=m.isWin(ALL[i])?'w':m.isLoss(ALL[i])?'l':'b'; if (kind===null) kind=k; if (k!==kind) break; st++; }
    const stTxt = kind==='w' ? st+(st===1?' trade vinto':' vinti di fila') : kind==='l' ? st+(st===1?' trade perso':' persi di fila') : st+' in pareggio';
    colL.push('<div class="card"><div class="card-h"><div class="h2">Ultimi '+last.length+' trade</div><span class="sub">'+stTxt+'</span></div><div class="dots">'+
      last.map((t,i)=>'<i class="'+(m.isWin(t)?'w':m.isLoss(t)?'l':'b')+'" style="--d:'+(i*40)+'ms" title="'+esc(t.raw.Data+' '+t.a)+'"></i>').join('')+'</div></div>');
  }
  if (ts.length>=6) {
    const best=bestGroup(ts,m,t=>t.idea,L.idea,1), band=bestGroup(ts,m,t=>bandOf(t),L.bands.map(b=>b[0]),1), worst=bestGroup(ts,m,t=>bandOf(t),L.bands.map(b=>b[0]),-1);
    let ins='';
    if (best && best.a.R>0) ins+=insRow('target','Setup migliore', best.k, best);
    if (band && band.a.R>0) ins+=insRow('clock','Fascia oraria migliore', band.k, band);
    if (worst && worst.a.R<0 && (!band || worst.k!==band.k)) ins+=insRow('alert','Fascia da rivedere', worst.k, worst, true);
    if (ins) colR.push('<div class="card"><div class="card-h"><div class="h2">Cosa funziona</div><span class="sub">'+perLbl+'</span></div><div class="ins">'+ins+'</div></div>');
  }
  const mi=monthItems(ALL,m,6);
  if (mi.length>1) colL.push('<div class="card"><div class="card-h"><div class="h2">Ultimi mesi</div><span class="sub">R per mese</span></div><div class="chart" id="c-mon"></div></div>');
  colL.push(discMini()); colR.push(lastCard());
  h += cols2(colL, colR);
  enter(el, h, ()=>{ if ($('c-spark')) lineChart($('c-spark'), equityPts(ts,m), { axes:false, h: innerWidth<640 ? 92 : 104 }); if ($('c-mon')) barChart($('c-mon'), mi, { h:150 }); });
}
// note della giornata: cambio dell'ora a New York, com'è andato questo giorno della settimana nel backtest
function dayNotes(t, wdN, cat) {
  const out=[], nyo=nyOpenIt(t);
  if (nyo && nyo!=='15:30') out.push('<b>Attenzione:</b> per il cambio dell\'ora oggi Wall Street apre alle <b>'+nyo+'</b> ora italiana.');
  const X=expectations(L.days[(wdN+6)%7], cat);
  if (X && X.wd.n>=3) out.push('Nel backtest il '+GIORNI[wdN]+' rende in media <b class="'+sgn(X.wd.avg)+'">'+fmtR(X.wd.avg,2)+'</b> ('+X.wd.n+' giornate).');
  return out;
}
// orario italiano dell'apertura di New York (9:30 ET) in una data: cambia di un'ora nelle settimane del cambio d'ora
function nyOpenIt(dIso) { const d=pdIso(dIso); for (let h=12; h<=17; h++) for (const m of [0,30]) { const u=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),h,m), n=nyHM(u);
  if (n.getHours()===9 && n.getMinutes()===30) { const r=romeDate(u); return p2(r.getHours())+':'+p2(r.getMinutes()); } } return ''; }
// Disciplina: giornate del Journal giudicate con le regole del piano (max 2 trade, stop dopo il TP, perdita massima, solo trade validi)
const jModel = { rOf:t=> isFinite(t.rr)?t.rr:0, isWin:t=>t.out==='Win', isLoss:t=>t.out==='Loss' };
function discDays(ts) {
  const rr=t=>isFinite(t.rr)?t.rr:0, lim=num(CFG.lossR), days={};
  ts.forEach(t=>{ const k=iso(t.d); (days[k]=days[k]||[]).push(t); });
  return Object.entries(days).sort((a,b)=>a[0]<b[0]?-1:1).map(([k,g])=>{ const afterTP=g.some((t,i)=>i>0 && g.slice(0,i).some(x=>x.out==='Win'||rr(x)>0)), R=g.reduce((s,t)=>s+rr(t),0);
    const d={ k, n:g.length, R, max2:g.length<=2, tp:!afterTP, loss:!(isFinite(lim)&&lim>0) || R>-lim-1e-9, valid:!g.some(t=>t.exe==='Errore'), hadWin:g.some(x=>x.out==='Win'||rr(x)>0) };
    d.ok = d.max2 && d.tp && d.loss && d.valid; return d; });
}
function discMini() {
  const J=rowsOf('Journal')||[], now=new Date(), jm=J.filter(t=>t.d>=new Date(now.getFullYear(),now.getMonth(),1)), D=discDays(jm), okN=D.filter(d=>d.ok).length;
  let run=0; for (let i=D.length-1;i>=0 && D[i].ok;i--) run++;
  return '<button type="button" class="card disc dmini" data-nav="disc"><div class="card-h"><h2 class="h2">Disciplina</h2><span class="sub">Journal · '+MESI_F[now.getMonth()]+'</span></div>'+
    (D.length ? '<div class="ds-lead"><b class="num">'+okN+' su '+D.length+'</b><span>giornate in regola</span></div><div class="ds-bar"><i style="width:'+(100*okN/D.length)+'%"></i></div>'+
      '<div class="dm-rules">'+[['Solo trade validi',D.filter(d=>d.valid).length,D.length],['Max 2 trade al giorno',D.filter(d=>d.max2).length,D.length],
        ['Stop dopo il TP',D.filter(d=>d.hadWin&&d.tp).length,D.filter(d=>d.hadWin).length]].concat(isFinite(num(CFG.lossR))&&num(CFG.lossR)>0?[['Perdita max −'+fmtN(num(CFG.lossR),1)+' R',D.filter(d=>d.loss).length,D.length]]:[])
        .map(([l,o,t])=>'<span class="'+(o===t?'ok':'ko')+'">'+ic(o===t?'check':'alert',14,2.2)+l+'<b class="num">'+(t?o+'/'+t:'–')+'</b></span>').join('')+'</div>'+
      '<p class="ds-note">'+(run>1?'Sei a <b>'+run+' giornate in regola di fila</b>.':'Errori ed esecuzione nella pagina Disciplina.')+'</p>'
    : '<div class="empty-row">Nessun trade reale questo mese.</div>')+'<span class="link">Apri Disciplina'+ic('chev',15,2)+'</span></button>';
}
function lastCard() {
  const J=rowsOf('Journal')||[], E=rowsOf('EOW')||[];
  const last=[...J.slice(-6).map(t=>({t,f:'Journal'})), ...E.slice(-6).map(t=>({t,f:'EOW'}))].sort((a,b)=>(b.t.d-a.t.d)||(b.t.o-a.t.o)).slice(0,6);
  return last.length ? '<div class="card last"><div class="card-h"><h2 class="h2">Ultimi trade</h2><span class="sub">Journal ed EOW</span></div>'+last.map(x=>mrow(x.t,x.f)).join('')+'</div>' : '';
}
// riga di trade per la Panoramica: indica il file e apre il trade giusto
function mrow(t, f) {
  const E=f==='EOW', r=E?(t.best>=2?2:-1):(isFinite(t.rr)?t.rr:0), w=E?t.best>=2:t.out==='Win', l=E?!(t.best>=2):t.out==='Loss';
  return '<button type="button" class="trow" data-open="'+f+':'+t.row+'">'+tline(t, f, { r, w, l, date:true, tag:true })+'</button>';
}
function openNewPick() {
  S.sheet='newpick'; $('sh-sub').textContent='Nuovo trade'; $('sh-title').innerHTML=words('Dove lo registri?');
  $('sh-body').innerHTML='<div class="more">'+[['Journal','book','Trade reale','Un trade eseguito sul conto'],['EOW','list','Backtest (EOW)','Un setup rivisto a fine settimana']].map((x,k)=>
    '<button type="button" data-newf="'+x[0]+'" style="--k:'+k+'">'+ic(x[1],24,1.8)+'<b>'+x[2]+'</b><span>'+x[3]+'</span></button>').join('')+'</div>';
  $('sh-foot').innerHTML=''; openSheet();
}
// fascia oraria come se Wall Street aprisse alle 15:30 (t.on): nelle settimane del cambio d'ora un trade delle 14:58 conta come 15:58
const bandOf = t => (L.bands.find(b=>t.on>=b[1]&&t.on<b[2])||['altro'])[0];
function bestGroup(ts, m, keyFn, keys, dir) {
  let best=null; keys.forEach(k=>{ const g=ts.filter(t=>{ const v=keyFn(t); return Array.isArray(v) ? v.includes(k) : v===k; }); if (g.length<3) return; const a=agg(g,m); if (!best || dir*a.R>dir*best.a.R) best={k,a}; }); return best;
}
const insRow = (icn, lbl, k, b, bad) => '<div class="ins-row"><div class="ins-ic'+(bad?' bad':'')+'">'+ic(icn,18)+'</div><div><span>'+lbl+'</span><b>'+esc(k)+'</b><span>'+b.a.n+' trade · WR '+pct(b.a.wr)+'</span></div><div class="r '+sgn(b.a.R)+'">'+fmtR(b.a.R)+'</div></div>';

// ───────────────────────── NEWS (calendario economico USD, fonte ForexFactory) ─────────────────────────
const NEWS_TTL = 15*60000;
S.dper = store.get('dper','') || 'm';
S.trump = (()=>{ try { const v=JSON.parse(localStorage.getItem('tj.trump2')||'null'); return v && Date.now()-v.got<6*3600000 ? v : null; } catch(e) { return null; } })();
S.news = (()=>{ try { return JSON.parse(localStorage.getItem('tj.news')||'null'); } catch(e) { return null; } })();
S.nsAI = {};
let newsP=null, newsErr='', newsTry=0, newsRetry=null, newsRetryN=0;
// calendario di un'altra settimana (app rimasta aperta in background, o salvato giorni fa): non va mostrato come se fosse questa
const newsOld = () => { if (!S.news) return false; const t=todayIso(), wd=(pdIso(t).getDay()+6)%7;
  return wd<5 && weekOf(iso(romeDate(S.news.at||S.news.got||0)))!==weekOf(t); };
function loadNews(force) {
  if (newsP) return newsP;
  if (!force && S.news && !newsOld() && Date.now()-S.news.got < NEWS_TTL) return Promise.resolve(S.news);
  if (!force && Date.now()-newsTry < (newsOld() ? 10000 : 60000)) return Promise.reject(new Error(newsErr||'attendi'));   // dopo un errore: al massimo un tentativo al minuto (10 s se il calendario è vecchio)
  newsTry=Date.now();
  newsP = call('news', !!force).then(d=>{ d.got=Date.now(); S.news=d; newsErr=''; newsRetryN=0; try { localStorage.setItem('tj.news', JSON.stringify(d)); } catch(e) {} newsBadge(); return d; })
    .catch(e=>{ newsErr = /Funzione sconosciuta/.test(e.message||'') ? 'OLD' : (e.message||String(e));
      // un errore al primo caricamento capita (script appena svegliato, ForexFactory lento): un secondo tentativo da solo
      if (newsErr!=='OLD' && !newsRetry && newsRetryN++<1) newsRetry=setTimeout(()=>{ newsRetry=null; newsTry=0; loadNews().catch(()=>{}); }, 5000);
      throw e; })
    .finally(()=>{ newsP=null; if ((S.tab==='news' || S.tab==='home') && !S.sheet) renderCurrent(true); });
  return newsP;
}
// ora locale di Roma / New York come Date «da parete»; il formattatore si crea una volta sola (toLocaleString a ogni chiamata era lento)
const TZF={};
function tzDate(t, tz) { const f=TZF[tz]||(TZF[tz]=new Intl.DateTimeFormat('en-US',{ timeZone:tz, hourCycle:'h23', year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', second:'numeric' }));
  const p={}; f.formatToParts(new Date(t)).forEach(x=>{ p[x.type]=x.value; }); return new Date(+p.year, p.month-1, +p.day, +p.hour%24, +p.minute, +p.second); }
const romeDate = t => tzDate(t, 'Europe/Rome');
const nyHM = t => tzDate(t, 'America/New_York');
const p2 = n => String(n).padStart(2,'0');
let TDY={ t:0, v:'' };   // la data di oggi a Roma: ricalcolata al massimo ogni 20 secondi (serve in ogni riga del calendario)
const todayIso = () => { const n=Date.now(); if (n-TDY.t>20000) TDY={ t:n, v:iso(romeDate(n)) }; return TDY.v; };
// nomi in italiano degli eventi principali (il nome originale di ForexFactory resta sempre visibile sotto)
const NEWS_IT = [
  [/^Non-Farm Employment Change/i,'Buste paga non agricole (NFP)'], [/^ADP Non-Farm/i,'Occupazione privata ADP'], [/^Unemployment Rate/i,'Tasso di disoccupazione'],
  [/^Average Hourly Earnings/i,'Salari orari medi'], [/^Unemployment Claims/i,'Richieste di sussidi di disoccupazione'], [/^JOLTS/i,'Posti di lavoro vacanti (JOLTS)'],
  [/^Core CPI/i,'Inflazione core CPI'], [/^CPI/i,'Inflazione CPI'], [/^Core PPI/i,'Prezzi alla produzione core (PPI)'], [/^PPI/i,'Prezzi alla produzione (PPI)'],
  [/^Core PCE/i,'Inflazione core PCE'], [/PCE Price/i,'Inflazione PCE'], [/GDP/i,'PIL'], [/^Core Retail Sales/i,'Vendite al dettaglio core'], [/^Retail Sales/i,'Vendite al dettaglio'],
  [/^ISM Manufacturing PMI/i,'ISM manifatturiero'], [/^ISM Services PMI/i,'ISM servizi'], [/Flash Manufacturing PMI/i,'PMI manifatturiero (flash)'], [/Flash Services PMI/i,'PMI servizi (flash)'],
  [/^Federal Funds Rate/i,'Decisione sui tassi della Fed'], [/^FOMC Statement/i,'Comunicato FOMC'], [/^FOMC Press Conference/i,'Conferenza stampa FOMC'],
  [/^FOMC Meeting Minutes/i,'Verbali FOMC'], [/^FOMC Economic Projections/i,'Proiezioni economiche FOMC'], [/^Fed Chair .* Speaks/i,'Parla il presidente della Fed'],
  [/^FOMC Member .* Speaks/i,'Parla un membro del FOMC'], [/Trump Speaks/i,'Parla il presidente Trump'], [/Trump/i,'Evento con Trump'],
  [/UoM Consumer Sentiment/i,'Fiducia consumatori Michigan'], [/UoM Inflation Expectations/i,'Aspettative d\'inflazione Michigan'], [/CB Consumer Confidence/i,'Fiducia consumatori Conference Board'],
  [/^Durable Goods/i,'Ordini di beni durevoli'], [/^Core Durable Goods/i,'Ordini di beni durevoli core'], [/^Empire State Manufacturing/i,'Manifattura Empire State'],
  [/^Philly Fed Manufacturing/i,'Manifattura Philadelphia Fed'], [/^Crude Oil Inventories/i,'Scorte di petrolio'], [/^Pending Home Sales/i,'Vendite case in corso'],
  [/^New Home Sales/i,'Vendite di case nuove'], [/^Existing Home Sales/i,'Vendite di case esistenti'], [/^Building Permits/i,'Permessi di costruzione'], [/^Housing Starts/i,'Nuovi cantieri'],
  [/^Treasury Currency Report/i,'Rapporto del Tesoro sulle valute'], [/Bond Auction/i,'Asta di titoli di Stato'], [/^Bank Holiday/i,'Festività: mercati USA chiusi'],
  [/^Prelim Nonfarm Productivity/i,'Produttività (preliminare)'], [/^Trade Balance/i,'Bilancia commerciale'], [/^Industrial Production/i,'Produzione industriale'],
];
const newsIt = t => { const m=NEWS_IT.find(x=>x[0].test(t)); return m ? m[1] : t; };
// cosa può comportare ogni tipo di news per ES e NQ (spiegazione generale: la direzione non è mai scontata)
const NEWS_IMPL = [
  [/FOMC Statement|Federal Funds Rate|FOMC Press|FOMC Economic Projections/i,'fomc','Decisione Fed (FOMC)','È l\'evento più importante: decisione sui tassi, comunicato e conferenza stampa. La volatilità esplode all\'uscita e durante la conferenza; nelle ore prima il mercato è spesso compresso e indeciso.'],
  [/FOMC Meeting Minutes/i,'min','Verbali FOMC','Raccontano la discussione dell\'ultima riunione Fed: possono spostare le attese sui tassi, di solito con movimenti più contenuti della decisione.'],
  [/Fed Chair|FOMC Member/i,'fed','Discorsi della Fed','Le parole dei banchieri centrali spostano le attese sui tassi. La durata non è annunciata: un movimento può partire in qualsiasi momento del discorso.'],
  [/Trump/i,'trump','Trump','Dichiarazioni su dazi, Fed o geopolitica possono muovere ES e NQ all\'improvviso. Contenuto e durata non si conoscono in anticipo: tieni aperta la diretta.'],
  [/CPI|PCE|PPI/i,'infl','Inflazione','È il dato che più sposta le attese sui tassi. Inflazione sopra le attese di solito pesa sugli indici (soprattutto NQ, sensibile ai tassi); sotto le attese di solito li aiuta.'],
  [/Non-Farm|Unemployment Rate|Average Hourly/i,'nfp','Lavoro (NFP)','Il dato più volatile del mese. La reazione non è lineare: numeri molto forti possono far scendere gli indici (meno tagli dei tassi), numeri molto deboli fanno temere un rallentamento.'],
  [/ADP|JOLTS|Unemployment Claims|Productivity/i,'job','Mercato del lavoro','Anticipa il quadro dell\'occupazione. Impatto di solito medio; una sorpresa grande può dare la direzione alla giornata.'],
  [/GDP/i,'gdp','PIL','Misura la crescita: conta di più la prima stima. Sorprese forti cambiano il sentiment, ma spesso il mercato le aveva già anticipate.'],
  [/Retail Sales/i,'ret','Consumi','Le vendite al dettaglio misurano la forza del consumatore americano: sorprese ampie muovono indici e rendimenti.'],
  [/ISM|PMI/i,'ism','Sondaggi sulle aziende (ISM/PMI)','Danno il polso di manifattura e servizi; la componente prezzi conta per l\'inflazione. L\'ISM esce alle 16:00 italiane, dentro la sessione.'],
  [/UoM|Consumer Confidence|Consumer Sentiment/i,'conf','Fiducia dei consumatori','Impatto di solito moderato; le aspettative d\'inflazione del Michigan sono la parte che il mercato guarda di più.'],
  [/Bond Auction/i,'bond','Aste di titoli di Stato','Un\'asta debole fa salire i rendimenti, cosa che di solito pesa su NQ.'],
  [/Bank Holiday/i,'hol','Festività','Mercati USA chiusi o con orari ridotti: liquidità bassa, movimenti poco affidabili.'],
];
const implOf = t => NEWS_IMPL.find(x=>x[0].test(t));
const IMP = { High:['hi','Alto'], Medium:['md','Medio'], Low:['lo','Basso'], Holiday:['ho','Festività'] };
const LBL_IT = { 'All Day':'Tutto il giorno', 'Tentative':'Da definire' };
let NEV={ src:undefined, out:[] };   // gli eventi cambiano solo quando arriva un calendario nuovo
function mapEv(e) { const r=romeDate(e.t), ny=nyHM(e.t), tbd = !!e.lbl || (ny.getHours()===0 && ny.getMinutes()===0 && !e.url);
  return Object.assign({}, e, { r, day:iso(r), hm: tbd ? (LBL_IT[e.lbl] || e.lbl || (e.imp==='Holiday'?'Tutto il giorno':'Da definire')) : p2(r.getHours())+':'+p2(r.getMinutes()), mm:r.getHours()*60+r.getMinutes(),
    tbd, trump:/trump/i.test(e.title), imp2:(IMP[e.imp]||['lo',e.imp||''])[0], impL:(IMP[e.imp]||['',e.imp||''])[1] }); }
function newsEvents() {
  if (NEV.src===S.news) return NEV.out;
  NEV={ src:S.news, out:((S.news && S.news.ev) || []).map(mapEv) };
  return NEV.out;
}
const inSess = e => { const x=sessOf(e.day); return !e.tbd && e.mm>=x[0]-15 && e.mm<=x[1]; };   // dentro la sessione (o nei 15 minuti prima dell'apertura)
const when = e => { const x=sessOf(e.day); return e.tbd ? 'orario da definire' : e.mm<x[0]-15 ? 'prima della sessione' : e.mm<=x[1] ? 'in sessione' : 'dopo la sessione'; };
const TRUMP_LINKS = [['Diretta Casa Bianca','https://www.youtube.com/@WhiteHouse/streams'],['C-SPAN','https://www.c-span.org/live/']];
// versione corta per le righe del calendario: «tra 1 h 59 min» → «1h 59m»
const cdS = ms => cdTxt(ms).replace(/^tra /,'').replace(/ h /,'h ').replace(/ min\b/,'m').replace(/ giorn[oi]/,' g');
function cdTxt(ms) { const a=Math.abs(ms), s=Math.floor(a/1000)%60, m=Math.floor(a/60000)%60, h=Math.floor(a/3600000), d=Math.floor(h/24);
  if (ms<0) return a<60000 ? 'adesso' : 'uscita '+(h ? (d ? d+' g' : h+' h '+p2(m)+' min') : m+' min')+' fa';
  if (d>=1) return 'tra '+d+(d===1?' giorno':' giorni'); if (h) return 'tra '+h+' h '+p2(m)+' min'; return 'tra '+m+':'+p2(s); }
const dayLbl = (dIso) => { const t=todayIso(), d=pdIso(dIso); if (dIso===t) return 'Oggi'; if (dIso===iso(addDays(pdIso(t),1))) return 'Domani'; if (dIso===iso(addDays(pdIso(t),-1))) return 'Ieri';
  return GIORNI[d.getDay()].replace(/^./,c=>c.toUpperCase())+' '+d.getDate()+' '+MESI_F[d.getMonth()]; };
const dayShort = dIso => { const d=pdIso(dIso); return dIso===todayIso() ? 'oggi' : GIORNI[d.getDay()].slice(0,3)+' '+d.getDate(); };
const weekOf = dIso => { const d=pdIso(dIso); return iso(addDays(d, -((d.getDay()+6)%7))); };
// categoria di news della giornata, come nella colonna News del foglio
function newsCat(dIso) { if (!S.news) return ''; const ev=newsEvents().filter(e=>e.day===dIso && e.cur==='USD');
  return ev.some(e=>e.imp==='High') ? 'Red News' : ev.some(e=>e.imp==='Medium') ? 'Orange News' : 'No News Day'; }
// ───── Trump: quando parla. Lo script lo ricava dai titoli di FinancialJuice (diretta in corso, interventi annunciati,
// interventi già fatti); in più ci sono gli interventi in calendario su ForexFactory. Nell'app niente titoli, solo questo.
let trP=null, trErr='', trTry=0; const TR_TTL=60000;
function loadTrump(force) {
  if (trP) return trP;
  if (!force && S.trump && Date.now()-S.trump.got < TR_TTL) return Promise.resolve(S.trump);
  if (!force && Date.now()-trTry < 45000) return Promise.reject(new Error(trErr||'attendi'));
  trTry=Date.now(); const wasLive = !!(S.trump && S.trump.live);
  trP = call('trumpNews', !!force).then(d=>{ d.got=Date.now(); S.trump=d; trErr=''; newsBadge();
      try { localStorage.setItem('tj.trump2', JSON.stringify(d)); } catch(e) {}
      if (d.live && !wasLive && !document.hidden) toast('Trump sta parlando ora: la diretta è nella pagina News');
      return d; })
    .catch(e=>{ trErr = /Funzione sconosciuta/.test(e.message||'') ? 'OLD' : (e.message||String(e)); throw e; })
    .finally(()=>{ trP=null; if ((S.tab==='news' || S.tab==='home') && !S.sheet) renderCurrent(true); });
  return trP;
}
setInterval(()=>{ if (!document.hidden) loadTrump().catch(()=>{}); }, 90000);
const hmOf = t => { const d=romeDate(t); return p2(d.getHours())+':'+p2(d.getMinutes()); };
const trLinks = cls => '<div class="tr-l">'+TRUMP_LINKS.map((l,i)=>'<a class="'+(cls&&!i?cls:'lnk')+'" href="'+l[1]+'" target="_blank" rel="noopener">'+ic(cls&&!i?'play':'ext',cls&&!i?16:14,2)+l[0]+'</a>').join('')+'</div>';
// interventi in programma: ForexFactory + annunci rilevati da FinancialJuice (senza doppioni)
function trumpSched(ev) {
  const now=Date.now(), T=S.trump, out=ev.map(e=>({ t:e.tbd?null:e.t, tbd:e.tbd, day:e.day, lbl:newsIt(e.title), src:'ForexFactory' }));
  (T && T.sched || []).forEach(x=>{ if (x.t && out.some(o=>o.t && Math.abs(o.t-x.t)<45*60000)) return;
    if (x.url) { out.push({ t:x.t, tbd:false, day:iso(romeDate(x.t)), lbl:x.title||'Diretta della Casa Bianca', src:'YouTube', url:x.url }); return; }
    out.push({ t:x.t, tbd:!x.t, day:iso(romeDate(x.t||x.a)), lbl:{ conferenza:'Conferenza stampa di Trump', firma:'Trump firma un provvedimento', discorso:'Discorso di Trump' }[x.k]||'Intervento di Trump', src:'FinancialJuice', ann:x.a }); });
  return out.filter(o=>o.tbd || o.t>now-3*3600000).sort((a,b)=>(a.tbd-b.tbd) || ((a.t||a.ann||0)-(b.t||b.ann||0)));   // prima quelli con l'orario
}
function trumpCard(ev) {
  const T=S.trump, now=Date.now(), live=T && T.live, sch=trumpSched(ev), past=(T && T.past) || [];
  let h='<div class="card wide trump rise'+(live?' on':'')+'" id="trump" style="--d:90ms"><div class="card-h"><div class="h2">'+ic('mic',19,2)+' Trump'+(live?'<span class="tr-live"><i></i>In diretta</span>':'')+'</div>'+
    '<span class="sub">'+(T&&T.at?'controllato alle '+hmOf(T.at):'')+'</span></div>';
  if (live) h+='<div class="tr-now"><div><b>Sta parlando ora</b><span>'+(live.title?esc(live.title)+' · ':'')+'dalle '+hmOf(live.since)+(live.yt?'':' · ultima dichiarazione '+agoTxt(now-live.last))+'</span></div>'+
    '<div class="tr-l">'+(live.url?'<a class="btn tr-go" href="'+esc(live.url)+'" target="_blank" rel="noopener">'+ic('play',16,2)+'Guarda la diretta</a>':'<a class="btn tr-go" href="'+TRUMP_LINKS[0][1]+'" target="_blank" rel="noopener">'+ic('play',16,2)+TRUMP_LINKS[0][0]+'</a>')+
    '<a class="lnk" href="'+TRUMP_LINKS[1][1]+'" target="_blank" rel="noopener">'+ic('ext',14,2)+TRUMP_LINKS[1][0]+'</a></div></div>';
  if (sch.length) h+=(live?'<div class="tr-sect">In programma</div>':'')+sch.map(o=>{ const st = o.tbd ? (o.ann?'annunciato alle '+hmOf(o.ann)+', orario non indicato':'orario da definire') : now<o.t ? 'alle '+hmOf(o.t)+' · <b data-cd="'+o.t+'">'+cdTxt(o.t-now)+'</b>' : 'iniziato alle '+hmOf(o.t)+' · la fine non viene annunciata';
      return '<div class="tr-row"><div><b>'+esc(o.lbl)+'</b><span>'+dayLbl(o.day)+' · '+st+'</span></div>'+(o.url?'<div class="tr-l"><a class="lnk" href="'+esc(o.url)+'" target="_blank" rel="noopener">'+ic('play',14,2)+'Apri su YouTube</a></div>':'')+'</div>'; }).join('')+
      (live?'':'<div class="tr-where"><span>Dove vederlo</span>'+trLinks()+'</div>');
  else if (!live && T) h+='<div class="tr-none">'+ic('check',16,2.2)+'<span>Nessun intervento di Trump in programma. Quando inizia a parlare lo vedi qui, con il link alla diretta.</span></div>';
  // controllo non riuscito (e nessun dato salvato): il motivo e «Riprova», anche se ci sono interventi dal calendario
  if (!T) h+= trErr==='OLD' ? '<div class="tr-none ko">'+ic('alert',16,2.2)+'<span>Aggiorna Code.gs per sapere quando Trump parla.</span></div>'
    : trErr && !trP ? '<div class="tr-none ko">'+ic('alert',16,2.2)+'<span>Non riesco a controllare se Trump parla: '+esc(trErr==='NETWORK'?'lo script non ha risposto in tempo':trErr)+'.</span><button type="button" class="btn sec sm" data-act="trretry">'+ic('refresh',15,2)+'Riprova</button></div>'
    : '<div class="tr-none">'+ic('clock',16,2.2)+'<span>Controllo se Trump sta parlando…</span></div>';
  if (past.length) h+='<div class="tr-past">'+ic('clock',14,2)+'<span>Ha già parlato: '+past.map(p=>(iso(romeDate(p.from))===todayIso()?'':dayShort(iso(romeDate(p.from)))+' ')+hmOf(p.from)+'–'+hmOf(p.to)).join(' · ')+'</span></div>';
  // fonte che funziona: spunta; FinancialJuice in pausa (429) mentre YouTube va: grigio e discreto; altri problemi: giallo
  const sv = (n,v,quiet) => v==='ok' ? '<span class="ok">'+ic('check',13,2.4)+n+'</span>'
    : quiet ? '<span class="off">'+ic('clock',13,2.2)+n+' in pausa</span>'
    : '<span class="ko">'+ic('alert',13,2.4)+n+' · '+esc(String(v||'non controllato'))+'</span>';
  // FinancialJuice: se l'ultimo controllo riuscito è recente va bene così (un 429 è solo una pausa che lo script si prende da solo)
  const fjRecent = T && T.src && T.src.fjAt && now-T.src.fjAt < 30*60000, fjV = T && T.src ? (T.src.fj==='ok' || fjRecent ? 'ok' : T.src.fj) : '';
  if (T && T.src && T.src.err) h+='<p class="tr-src"><b>Ultimo controllo non riuscito</b> ('+esc(T.src.err)+'): sto mostrando quello delle '+hmOf(T.at)+'.</p>';
  if (T && T.src) h+='<div class="tr-srcs">'+sv('YouTube Casa Bianca',T.src.yt)+sv('FinancialJuice'+(fjRecent?' · '+hmOf(T.src.fjAt):''),fjV, fjV!=='ok' && T.src.yt==='ok' && /429|troppe richieste/i.test(String(T.src.fj)))+'</div>';
  h+='<p class="tr-src">'+(T && T.src && T.src.yt!=='ok' && fjV!=='ok' ? '<b>Nessuna fonte raggiungibile in questo momento: riprovo da solo.</b> ' : '')+'Diretta e dirette in programma dal canale YouTube della Casa Bianca, dichiarazioni dai titoli di FinancialJuice (qualche minuto di ritardo), interventi dal calendario di ForexFactory.</p>';
  return h+'</div>';
}
const agoTxt = ms => ms<60000 ? 'adesso' : ms<3600000 ? Math.floor(ms/60000)+' min fa' : Math.floor(ms/3600000)+' h fa';
// una news: orario (e quanto manca, solo oggi), pallino dell'impatto sulla linea del tempo, nome, valori
function nrow(e, now, nextT) {
  const past = !e.tbd && e.t<now-60000, nx = e.t===nextT, today = e.day===todayIso();
  const vals = [['Prev.',e.fc],['Prec.',e.pv],['Reale',e.ac]].filter(v=>v[1]).map(v=>'<span'+(v[0]==='Reale'?' class="ac"':'')+'>'+v[0]+' <b>'+esc(v[1])+'</b></span>').join('');
  const meta = (inSess(e)&&!past?'<span class="q">In sessione</span>':'')+vals;
  const tag = e.url ? 'a href="'+esc(e.url)+'" target="_blank" rel="noopener"' : 'div';
  return '<'+tag+' class="nrow '+e.imp2+(past?' past':'')+(nx?' next':'')+(e.trump?' tr':'')+'"><div class="nt"><b>'+e.hm+'</b>'+(today && !e.tbd && !past?'<span data-cd="'+e.t+'" data-cds="1">'+cdS(e.t-now)+'</span>':'')+'</div>'+
    '<i class="ndot" title="Impatto '+esc(e.impL.toLowerCase())+'"></i>'+
    '<div class="nx">'+(nx?'<em class="nnext">Prossima</em>':'')+'<b>'+esc(newsIt(e.title))+'</b><span>'+esc(e.title)+' · '+(e.imp==='Holiday'?'festività':'impatto '+e.impL.toLowerCase())+'</span>'+(meta?'<div class="nm">'+meta+'</div>':'')+'</div></'+tag.split(' ')[0]+'>';
}
// Oggi: in cima alla pagina, con il conto alla rovescia della prossima news importante (anche se non è oggi)
function newsToday(g, all, now, nextT) {
  const t=todayIso(), rn=romeDate(now), wdN=rn.getDay(), cat=wdN===0||wdN===6 ? '' : newsCat(t);
  const nx=all.find(e=>!e.tbd && e.t>now-60000 && (e.imp==='High' || e.trump)), im=nx && implOf(nx.title);
  let h='<div class="card wide hero ntoday" id="nd-'+t+'"><div class="hero-glow"></div><div class="nt-h"><div class="eyebrow">Oggi · '+GIORNI[rn.getDay()]+' '+rn.getDate()+' '+MESI_F[rn.getMonth()]+'</div>'+
    (cat?'<span class="ncat '+(cat==='Red News'?'hi':cat==='Orange News'?'md':'')+'">'+cat+'</span>':'')+'</div>';
  if (nx) h+='<div class="nt-next"><div><span>Prossima ad alto impatto'+(nx.day===t?'':' · '+dayLbl(nx.day).toLowerCase()+' alle '+nx.hm)+'</span><b>'+esc(newsIt(nx.title))+'</b>'+
    (nx.day===t?'<em>'+nx.hm+' · '+when(nx)+'</em>':'')+'</div><div class="nt-cd" data-cd="'+nx.t+'">'+cdTxt(nx.t-now)+'</div></div>'+(im && nx.day===t?'<p class="nh-i">'+esc(im[3])+'</p>':'');
  if (wdN===0 || wdN===6) h+='<p class="nt-none">Mercati chiusi: nessuna news da seguire oggi.</p>';
  else if (!g.length) h+='<p class="nt-none">'+ic('check',16,2.2)+'Nessuna news USD di impatto medio o alto oggi.</p>';
  else h+='<div class="nlist nt-list">'+g.map(e=>nrow(e,now,nextT)).join('')+'</div>';
  return h+'</div>';
}
// sunto del periodo: le news importanti raggruppate per tipo, quando escono rispetto alla sessione e cosa possono comportare
function newsSummary(ev, per) {
  const lab={ d:'oggi', w:'questa settimana', n:'la prossima settimana' }[per], key=ev.filter(e=>e.imp==='High'||e.trump);
  const nyW=[...new Set(ev.map(e=>e.day))].map(d=>[d,nyOpenIt(d)]).filter(x=>x[1] && nyShift(x[0]));
  let h='<div class="card wide nsum rise" style="--d:110ms"><div class="card-h"><div class="h2">'+ic('spark',18,2)+' Cosa può comportare '+lab+'</div><span class="sub">'+key.length+' news ad alto impatto</span></div>';
  if (nyW.length) h+='<p class="ns-warn">'+ic('alert',15,2)+'<span>Cambio dell\'ora: '+[...new Set(nyW.map(x=>x[1]))].map(o=>'Wall Street apre alle <b>'+o+'</b>')+' ora italiana '+(nyW.length>1?'('+nyW.map(x=>dayShort(x[0])).join(', ')+')':dayShort(nyW[0][0]))+'. Anche le news delle 14:30 escono un\'ora prima.</span></p>';
  if (!key.length) h+='<p class="mut">Nessuna news USD ad alto impatto: giornate guidate dal flusso normale del mercato.</p>';
  const groups={}; key.forEach(e=>{ const im=implOf(e.title)||[null,'x'+e.title,newsIt(e.title),'News ad alto impatto secondo ForexFactory.']; (groups[im[1]]=groups[im[1]]||{ im, ev:[] }).ev.push(e); });
  Object.values(groups).sort((a,b)=>a.ev[0].t-b.ev[0].t).forEach(g=>{ const ins=g.ev.some(inSess);
    h+='<div class="ns-row"><div class="ns-h"><b>'+esc(g.im[2])+'</b>'+(ins?'<em class="tag s">In sessione</em>':'')+'</div><div class="ns-w">'+
      [...new Set(g.ev.map(e=>(per==='d'?'':dayShort(e.day)+' ')+e.hm+' · '+when(e)))].slice(0,4).join(' · ')+'</div><p>'+esc(g.im[3])+'</p></div>'; });
  const k=per+'|'+key.map(e=>e.t+e.title+e.ac).join(','), ai=S.nsAI[k];
  if (key.length) h+= ai===1 ? '<div class="ns-ai"><span class="thinking">'+ic('spark',16,2)+'Claude sta leggendo il calendario…</span></div>'
    : ai ? '<div class="ns-ai md">'+md(ai)+'<p class="mut" style="font-size:12px;margin:6px 0 0">Scritto da Claude con i dati di ForexFactory: non è una previsione.</p></div>'
    : '<button type="button" class="btn sec sm" data-act="nsai" data-k="'+esc(k)+'" data-per="'+per+'">'+ic('spark',16,2)+'Approfondisci con Claude</button>';
  return h+'</div>';
}
function askNewsAI(b) {
  const k=b.dataset.k, per=b.dataset.per, t=todayIso(), wk=weekOf(t), nwk=iso(addDays(pdIso(wk),7));
  const ev=newsEvents().filter(e=>(e.imp==='High'||e.imp==='Medium'||e.trump) && (per==='d'?e.day===t:per==='n'?weekOf(e.day)===nwk:weekOf(e.day)===wk));
  const items=ev.map(e=>dayLbl(e.day)+' '+e.hm+' · '+e.impL+' · '+e.title+' · '+[e.fc,e.pv,e.ac].map(x=>x||'–').join(' / '));
  S.nsAI[k]=1; renderCurrent(true);
  call('newsSunto', { d:'oggi ('+dayLbl(t)+')', w:'questa settimana', n:'la prossima settimana' }[per], items)
    .then(txt=>{ S.nsAI[k]=txt; }).catch(e=>{ delete S.nsAI[k]; toast(/NO_CLAUDE_KEY/.test(e.message||'')?'Claude non è collegato allo script':/Funzione sconosciuta/.test(e.message||'')?'Aggiorna Code.gs per usare Claude sulle news':'Claude non ha risposto: '+(e.message||e), true); })
    .finally(()=>{ if (S.tab==='news') renderCurrent(true); });
}
function renderNews() {
  const el=$('v-news'); loadNews().catch(()=>{}); loadTrump().catch(()=>{});
  let h='<div class="stat-h rise"><div><div class="eyebrow">Calendario USD · ora italiana</div><h1>'+words('News')+'</h1></div>'+
    '<button type="button" class="btn sec sm" data-act="newsref"'+(newsP?' disabled':'')+'>'+(newsP?'<span class="spin"></span>Aggiorno…':ic('refresh',16,2)+'Aggiorna')+'</button></div>';
  if (!S.news || newsOld()) {
    if (S.news) h += '<p class="nsrc">'+ic('clock',14,2)+'<span>'+(newsErr && !newsP && !newsRetry ? 'Non riesco ad aggiornare il calendario ('+esc(newsErr)+'): tocca Aggiorna.' : 'Aggiorno il calendario di questa settimana…')+'</span></p>';
    h += S.news ? (newsErr && !newsP && !newsRetry ? '' : skeleton()) : newsErr==='OLD' ? emptyState('Aggiorna lo script', 'Per le news serve il nuovo Code.gs: sostituiscilo nel progetto Apps Script e fai un nuovo deployment (Gestisci deployment → modifica → Nuova versione).')
       : newsErr && !newsRetry && !newsP ? emptyState('News non disponibili', esc(newsErr)+'. Tocca Aggiorna per riprovare.') : skeleton();
    enter(el,h); return;
  }
  // ordine: oggi in cima, poi i prossimi giorni e la settimana prossima; i giorni già passati in fondo, chiusi
  const now=Date.now(), all=newsEvents(), t=todayIso(), wk=weekOf(t), nwk=iso(addDays(pdIso(wk),7));
  const keep = e => e.trump || e.imp==='Holiday' || e.imp==='High' || e.imp==='Medium';
  const pev=all.filter(e=>weekOf(e.day)===wk), ev=all.filter(e=>weekOf(e.day)===wk || weekOf(e.day)===nwk).filter(keep), nextT=(all.find(e=>!e.tbd && e.t>now-60000 && keep(e))||{}).t;
  const byDay = d => ev.filter(e=>e.day===d);
  // la settimana a colpo d'occhio: tocca un giorno per andarci
  h += '<div class="nweek">'+[0,1,2,3,4].map(i=>{ const d=iso(addDays(pdIso(wk),i)), g=byDay(d), cat=newsCat(d), hi=g.filter(e=>e.imp==='High').length, dt=pdIso(d);
    return '<button type="button" class="nwd'+(d===t?' on':'')+(d<t?' past':'')+'" data-nday="'+d+'"><span>'+GIORNI[dt.getDay()].slice(0,3)+'</span><b>'+dt.getDate()+'</b>'+
      '<i class="'+(cat==='Red News'?'hi':cat==='Orange News'?'md':'')+'"></i><em>'+(hi?hi+' alte':g.length?g.length+' medie':'nessuna')+'</em></button>'; }).join('')+'</div>';
  h += newsToday(byDay(t), all, now, nextT);
  h += trumpCard(all.filter(e=>e.trump && (e.tbd || e.t>now-4*3600000)).slice(0,3));
  const dayCard = d => { const g=byDay(d), hi=g.filter(e=>e.imp==='High').length, cat=newsCat(d);
    return '<div class="card wide nday" id="nd-'+d+'"><div class="card-h"><h3 class="h2">'+dayLbl(d)+'</h3><span class="ncat '+(cat==='Red News'?'hi':cat==='Orange News'?'md':'')+'">'+(hi?hi+' alto impatto':cat)+'</span></div><div class="nlist">'+g.map(e=>nrow(e,now,nextT)).join('')+'</div></div>'; };
  const days=[...new Set(ev.map(e=>e.day))], next=days.filter(d=>d>t && weekOf(d)===wk), nw=days.filter(d=>weekOf(d)===nwk), past=days.filter(d=>d<t);
  if (next.length) h += '<h2 class="sect">Prossimi giorni</h2>'+next.map(dayCard).join('');
  h += newsSummary(pev, 'w');
  if (nw.length) h += '<h2 class="sect">Settimana prossima</h2>'+nw.map(dayCard).join('');
  else if (S.news.weeks && S.news.weeks.next && S.news.weeks.next!=='ok') h += '<div class="card wide"><div class="empty-row">Il calendario della settimana prossima non è ancora disponibile su ForexFactory.</div></div>';
  if (past.length) h += '<details class="npast" id="npast"><summary>'+ic('chev',16,2)+'<span>Già uscite questa settimana</span><em>'+past.length+(past.length===1?' giorno':' giorni')+'</em></summary>'+past.map(dayCard).join('')+'</details>';
  const at=S.news.at?romeDate(S.news.at):null;
  h += '<p class="nsrc rise">'+ic('clock',14,2)+'<span>Fonte: calendario ForexFactory'+(at?', aggiornato alle '+p2(at.getHours())+':'+p2(at.getMinutes()):'')+
    (S.news.stale?' · <b>ForexFactory non risponde: sto mostrando l\'ultimo calendario salvato</b>':'')+'. Orari, impatto e valori sono quelli di ForexFactory; tocca una news per aprirla sul sito. La fine dei discorsi non viene mai annunciata.</span></p>';
  enter(el,h);
}
setInterval(()=>{ if (!document.hidden && (S.tab==='news' || S.tab==='home')) loadNews().catch(()=>{}); }, 60000);   // a pagina aperta il calendario si aggiorna da solo (ogni 15 minuti)
setInterval(()=>{ if (document.hidden) return; const now=Date.now(); document.querySelectorAll('[data-cd]').forEach(x=>{ const v=(x.dataset.cds?cdS:cdTxt)(+x.dataset.cd-now); if (x.textContent!==v) x.textContent=v; }); }, 1000);

// ───────────────────────── OGGI: riepilogo della giornata ─────────────────────────
const normCache={};
function rowsOf(f) { if (f===S.file && S.loaded) return all(); const d=S.data[f]; if (!d) return null; if (normCache[f] && normCache[f].d===d) return normCache[f].v;
  const v=d.rows.map(a=>unpack(d.h,a)).filter(only1).map(norm).filter(t=>t.d).sort((x,y)=>(x.d-y.d)||((x.o||0)-(y.o||0))); normCache[f]={ d, v }; return v; }
function expectations(dayName, cat) {
  const E=rowsOf('EOW'); if (!E || E.length<10) return null;
  const F=FILT_DEF('EOW'), m=eModel(2);
  const ts=plan(E.filter(t=>(!F.asset||t.a===F.asset) && (!F.idea.length || F.idea.includes(t.idea))), m.rOf);
  const byDay = g => { const o={}; g.forEach(t=>{ const k=iso(t.d); (o[k]=o[k]||[]).push(m.rOf(t)); }); return Object.values(o).map(a=>a.reduce((x,y)=>x+y,0)); };
  const dstat = g => { const d=byDay(g); return { n:d.length, avg:d.length?d.reduce((x,y)=>x+y,0)/d.length:NaN, pos:d.length?d.filter(x=>x>0).length/d.length:NaN }; };
  const wd=ts.filter(t=>t.day===dayName), nw=cat?ts.filter(t=>t.news===cat):[];
  return { all:dstat(ts), wd:dstat(wd), wdA:agg(wd,m), nw:agg(nw,m), cat, band:bestGroup(ts,m,bandOf,L.bands.map(b=>b[0]),1), idea:bestGroup(ts,m,t=>t.idea,L.idea,1), n:ts.length, F };
}
const chkKey = () => 'chk.'+todayIso();
function chkGet() { try { return JSON.parse(store.get(chkKey(),'[]'))||[]; } catch(e) { return []; } }
function briefing() {
  const now=Date.now(), rn=romeDate(now), t=iso(rn), wdN=rn.getDay(), weekend = wdN===0 || wdN===6, dayName=L.days[(wdN+6)%7];
  const J=rowsOf('Journal'), tj=J ? J.filter(t2=>iso(t2.d)===t) : [], won=tj.some(x=>x.out==='Win' || x.rr>0), n=tj.length, rT=tj.reduce((s,x)=>s+(isFinite(x.rr)?x.rr:0),0);
  const lossLim=num(CFG.lossR);
  let st;
  if (weekend) st={ c:'off', t:'Mercati chiusi', s:'Oggi niente trading: è il momento della revisione della settimana (EOW).' };
  else if (rn.getHours()*60+rn.getMinutes() > sessOf(t)[1]) st={ c:'off', t:'Sessione finita', s: n ? (won?'Giornata chiusa in positivo.':rT<0?'Una giornata storta fa parte del piano.':'Giornata chiusa.') : 'Nessun trade: se non c\'era un setup valido, è la scelta giusta.' };
  else if (won) st={ c:'done', t:'Giornata chiusa', s:'Hai preso il TP: il piano dice stop per oggi.' };
  else if (n>=2) st={ c:'done', t:'Limite raggiunto', s:'Hai fatto i 2 trade massimi del piano.' };
  else if (isFinite(lossLim) && lossLim>0 && rT<=-lossLim) st={ c:'done', t:'Limite di perdita raggiunto', s:'Oggi sei a '+fmtR(rT,2)+': il tuo limite è −'+fmtN(lossLim,1)+' R.' };
  else st={ c:'go', t: n ? 'Al massimo un altro trade' : 'Nessun trade ancora', s:'Entra solo se si presenta un setup valido · ingressi dalle '+hmMin(sessOf(t)[0])+' alle '+hmMin(sessOf(t)[1])+'.' };
  let h='<div class="brief"><div class="bcol">', h2='';
  const ev = S.news && !newsOld() ? newsEvents().filter(e=>e.day===t && (e.imp==='High' || e.trump)) : null, cat = S.news && !newsOld() && !weekend ? newsCat(t) : '';
  const nx = ev && ev.find(e=>!e.tbd && e.t>now-60000), notes = weekend ? [] : dayNotes(t, wdN, cat);
  let nb='';
  if (weekend) nb='';
  else if (!ev) nb = newsErr==='OLD' ? '<p class="mut">Aggiorna Code.gs per vedere le news.</p>' : '<p class="mut">Carico il calendario…</p>';
  else if (!ev.length) nb='<div class="bn-none">'+ic('check',16,2.2)+'Nessuna news USD ad alto impatto</div>';
  else nb=ev.slice(0,5).map(e=>'<div class="bn-row'+(e.t<now-60000&&!e.tbd?' past':'')+(e.trump?' tr':'')+'"><b>'+e.hm+'</b><span>'+esc(newsIt(e.title))+'</span>'+(e.tbd||e.t<now-60000?'':'<em data-cd="'+e.t+'">'+cdTxt(e.t-now)+'</em>')+'</div>').join('');
  h+='<div class="card today '+st.c+'"><div class="td-h"><div class="eyebrow">'+ic('shield',15,2)+' Oggi</div>'+(cat?'<span class="ncat '+(cat==='Red News'?'hi':cat==='Orange News'?'md':'')+'">'+cat+'</span>':'')+'</div>'+
     '<div class="td-main"><div><div class="bp-t">'+st.t+'</div><p>'+st.s+'</p></div>'+(n?'<div class="td-r"><b class="'+sgn(rT)+' num">'+fmtR(rT,2)+'</b><span>'+withU(n+' trade', usdOn(false)?tj.reduce((s,x)=>s+(usdT(x,isFinite(x.rr)?x.rr:0)||0),0):NaN)+'</span></div>':'')+'</div>'+
     (tj.length?'<div class="bp-tr">'+tj.map(x=>'<span class="'+(x.out==='Win'||x.rr>0?'w':x.out==='Loss'||x.rr<0?'l':'b')+'">'+esc(String(x.raw.Ora).slice(0,5))+' · '+esc(x.idea||x.a)+' <b class="num">'+fmtR(x.rr,2)+'</b></span>').join('')+'</div>':'')+
     (nb?'<div class="td-news"><div class="td-sub"><span>News USD</span>'+(nx?'<span>'+esc(newsIt(nx.title))+' <b data-cd="'+nx.t+'">'+cdTxt(nx.t-now)+'</b></span>':'')+'</div>'+nb+'</div>':'')+
     (()=>{ const T=S.trump; if (!T) return '';
        if (T.live) return '<a class="td-tr on" href="'+esc(T.live.url||TRUMP_LINKS[0][1])+'" target="_blank" rel="noopener"><span class="tr-dot"></span><span><b>Trump sta parlando ora</b><span class="trq">dalle '+hmOf(T.live.since)+' · tocca per la diretta</span></span>'+ic('play',16,2)+'</a>';
        const o=trumpSched([]).find(x=>x.day===t && (x.tbd || x.t>Date.now()-30*60000)); if (!o) return '';
        return '<button type="button" class="td-tr" data-nav="news">'+ic('mic',16,2)+'<span><b>'+esc(o.lbl)+(o.tbd?'':' alle '+hmOf(o.t))+'</b><span class="trq">'+(o.tbd?'orario non indicato':'tra '+cdTxt(o.t-Date.now()).replace(/^tra /,''))+' · annunciato su FinancialJuice</span></span>'+ic('chev',15,2)+'</button>'; })()+
     (notes.length?'<p class="td-note">'+notes.join(' ')+'</p>':'')+
     '<div class="td-foot"><span>Piano: 2 trade al giorno, stop dopo il TP'+(isFinite(lossLim)&&lossLim>0?', max −'+fmtN(lossLim,1)+' R':'')+'</span><button type="button" class="link" data-nav="news">Calendario'+ic('chev',15,2)+'</button></div></div>';
  // aspettative dallo storico EOW
  const X = weekend ? null : expectations(dayName, cat);
  if (X) {
    const rows=[];
    if (X.wd.n>=3) rows.push(['cal','Di '+dayName.toLowerCase(), fmtR(X.wd.avg,2)+' al giorno', X.wd.n+' giornate · '+pct(X.wd.pos)+' positive · WR '+pct(X.wdA.wr), X.wd.avg]);
    if (cat && X.nw.n>=5) rows.push(['news','Con '+cat, 'WR '+pct(X.nw.wr), X.nw.n+' trade · expectancy '+fmtN(X.nw.exp,2,true)+' R', X.nw.exp]);
    if (X.band && X.band.a.R>0) rows.push(['clock','Fascia migliore', X.band.k, X.band.a.n+' trade · '+fmtR(X.band.a.R), X.band.a.R]);
    if (X.idea && X.idea.a.R>0) rows.push(['target','Idea migliore', X.idea.k, X.idea.a.n+' trade · WR '+pct(X.idea.a.wr), X.idea.a.R]);
    h2+='<div class="card bexp"><div class="card-h"><div class="eyebrow">'+ic('spark',15,2)+' Cosa aspettarsi</div><span class="sub">storico EOW · '+X.F.asset+' · 2R · max 2 trade</span></div>'+
      '<div class="be-big"><b class="'+sgn(X.all.avg)+'">'+fmtR(X.all.avg,2)+'</b><span>resa media di una giornata con setup<br>'+pct(X.all.pos)+' delle '+X.all.n+' giornate chiuse in positivo</span></div>'+
      rows.map(r=>'<div class="be-row"><span class="be-ic">'+ic(r[0],16,2)+'</span><div><span>'+r[1]+'</span><b>'+esc(r[2])+'</b></div><em class="'+sgn(r[4])+'">'+esc(r[3])+'</em></div>').join('')+'</div>';
  }
  // checklist pre-sessione
  if (st.c!=='off' && CFG.check.length) { const ck=chkGet(), done=CFG.check.filter((_,i)=>ck.includes(i)).length, tot=CFG.check.length;
    h+='<div class="card bchk'+(done===tot?' ok':'')+'"><div class="card-h"><div class="eyebrow">'+ic('check',15,2.2)+' Prima di aprire il grafico</div><span class="sub" id="chk-n">'+done+'/'+tot+'</span></div>'+
      '<div class="chk-bar"><i style="width:'+(100*done/tot)+'%"></i></div>'+CFG.check.map((c,i)=>'<button type="button" class="chk'+(ck.includes(i)?' on':'')+'" data-chk="'+i+'"><span class="box">'+ic('check',14,2.6)+'</span>'+esc(c)+'</button>').join('')+'</div>'; }
  return h+'</div>'+(h2?'<div class="bcol">'+h2+'</div>':'')+'</div>';
}


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['home.js'] = '2026-10-28.1';

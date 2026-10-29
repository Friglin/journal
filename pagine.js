// Edgebook · pagine.js — Calendario, Disciplina, Impostazioni, revisione settimanale EOW, elenco dei trade.
// I file JS sono script classici caricati in ordine da index.html e condividono le stesse variabili globali:
// l'ordine conta (core.js → home.js → pagine.js → analisi.js → simula.js → scheda.js).
// ───────────────────────── CALENDARIO ─────────────────────────
function renderCal() {
  const el=$('v-cal'); if (!S.loaded) { el.innerHTML=skeleton(); return; }
  const m=curModel(), ts=filtered(m,true), now=new Date(); if (!S.calM) S.calM=now.getFullYear()+'-'+p2(now.getMonth()+1);
  const [Y,M]=S.calM.split('-').map(Number), first=new Date(Y,M-1,1), last=new Date(Y,M,0), byDay={};
  ts.forEach(t=>{ if (t.d.getFullYear()===Y && t.d.getMonth()===M-1) { const k=iso(t.d); (byDay[k]=byDay[k]||[]).push(t); } });
  const U=usdOn(), dayU = k => byDay[k] ? usdSum(byDay[k],m) : 0;
  const dayR = k => byDay[k] ? byDay[k].reduce((s,t)=>s+m.rOf(t),0) : 0, ks=Object.keys(byDay), mx=Math.max(1,...ks.map(k=>Math.abs(dayR(k))));
  const mt=ts.filter(t=>t.d>=first && t.d<=last), a=agg(mt,m), pos=ks.filter(k=>dayR(k)>0).length, neg=ks.filter(k=>dayR(k)<0).length;
  // a parità di R decide il risultato in $ (se c'è)
  const tie=(x,y)=>U?dayU(x)-dayU(y):0, best=ks.slice().sort((x,y)=>dayR(y)-dayR(x)||tie(y,x))[0], worst=ks.slice().sort((x,y)=>dayR(x)-dayR(y)||tie(x,y))[0];
  let h='<div class="stat-h rise"><div><div class="eyebrow">'+S.file+' · R per giorno</div><h1>'+words('Calendario')+'</h1></div><span class="mut num">'+mt.length+' trade</span></div>'+fbar(20);
  h+='<div class="card wide calcard rise" style="--d:60ms"><div class="cal-h"><button type="button" class="icon-btn" data-cal="-1" aria-label="Mese precedente">'+ic('chev',18,2).replace('<svg','<svg style="transform:rotate(180deg)"')+'</button>'+
     '<div><b>'+MESI_F[M-1].replace(/^./,c=>c.toUpperCase())+' '+Y+'</b><span class="'+sgn(a.R)+'">'+fmtR(a.R)+(U?' · '+fmtU(usdSum(mt,m)):'')+' · '+pos+' giorni verdi · '+neg+' rossi</span></div>'+
     '<button type="button" class="icon-btn" data-cal="1" aria-label="Mese successivo">'+ic('chev',18,2)+'</button></div>'+
     '<div class="cal-g"><span class="cw">Lun</span><span class="cw">Mar</span><span class="cw">Mer</span><span class="cw">Gio</span><span class="cw">Ven</span><span class="cw">Sett.</span>';
  let d=addDays(first, -((first.getDay()+6)%7)), wi=0;
  while (d<=last) { let wR=0, wn=0, wU=0;
    for (let i=0;i<5;i++) { const x=addDays(d,i), k=iso(x), inM=x.getMonth()===M-1, g=byDay[k]||[], r=dayR(k); wR+=r; wn+=g.length; if (U) wU+=dayU(k);
      h+='<button type="button" class="cd'+(inM?'':' out')+(g.length?(r>0?' p':r<0?' n':' z'):'')+(k===S.calSel?' sel':'')+(k===iso(now)?' td':'')+'" style="--a:'+(g.length?(.25+.75*Math.abs(r)/mx).toFixed(2):0)+';--k:'+(wi*5+i)+'" data-cday="'+k+'"'+(inM?'':' disabled')+'>'+
        '<span class="cn">'+x.getDate()+'</span>'+(g.length?'<b>'+fmtN(r,1,true)+'</b>'+(U?'<span class="cu">'+fmtUk(dayU(k))+'</span>':'')+'<span class="ct">'+g.length+(g.length===1?' trade':' trade')+'</span>':'')+'</button>'; }
    h+='<div class="cd wk'+(wn?(wR>0?' p':wR<0?' n':''):'')+'"><span class="cn">S'+(wi+1)+'</span>'+(wn?'<b>'+fmtN(wR,1,true)+'</b>'+(U?'<span class="cu">'+fmtUk(wU)+'</span>':'')+'<span class="ct">'+wn+' trade</span>':'')+'</div>';
    d=addDays(d,7); wi++; }
  h+='</div></div>';
  if (mt.length) h+='<div class="kgrid">'+kpi('Win rate', numEl(a.wr*100,0)+'<small>%</small>', a.w+' vinti su '+(a.w+a.l), 120)+kpi('Giorni verdi', numEl(ks.length?100*pos/ks.length:0,0)+'<small>%</small>', pos+' su '+ks.length+' giornate', 150)+
    kpi('Giorno migliore', best?fmtR(dayR(best)):'–', best?withU(dayLbl(best), U?dayU(best):NaN):'', 180, best?sgn(dayR(best)):'')+kpi('Giorno peggiore', worst&&dayR(worst)<0?fmtR(dayR(worst)):'–', worst&&dayR(worst)<0?withU(dayLbl(worst), U?dayU(worst):NaN):'Nessun giorno in perdita', 210, worst?sgn(dayR(worst)):'')+'</div>';
  if (S.calSel && byDay[S.calSel]) h+=calDayCard(S.calSel, 'rise');
  else if (mt.length) h+=calHint();
  enter(el,h);
}

// trade del giorno scelto nel calendario
function calDayCard(k, cls) {
  const m=curModel(), g=filtered(m,true).filter(t=>iso(t.d)===k); if (!g.length) return '';
  const R=g.reduce((s,t)=>s+m.rOf(t),0), U=usdOn();
  return '<div class="card wide '+(cls||'')+'" id="cal-day" style="--d:120ms"><div class="card-h"><div class="h2">'+dayLbl(k)+'</div><span class="sub '+sgn(R)+'">'+fmtR(R,2)+(U?' · '+fmtU(usdSum(g,m)):'')+'</span></div>'+g.map(t=>trow(t,m,true)).join('')+'</div>';
}
const calHint = () => '<p class="nsrc" id="cal-day">'+ic('cal',14,2)+'Tocca un giorno: con un trade si apre, con più trade vedi l\'elenco qui sotto.</p>';
// scelta di un giorno senza ridisegnare la pagina: la card entra e la pagina scende fino a lei
function calPick(k, scroll) {
  S.calSel=k; document.querySelectorAll('#v-cal [data-cday]').forEach(b=>b.classList.toggle('sel', b.dataset.cday===k));
  const cell=k && document.querySelector('#v-cal [data-cday="'+k+'"]'); if (cell) { cell.classList.remove('pick'); void cell.offsetWidth; cell.classList.add('pick'); }
  const old=$('cal-day'), html=k ? calDayCard(k, 'cd-in') : calHint(); if (!old) { renderCurrent(true); return; }
  const swap=()=>{ const w=document.createElement('div'); w.innerHTML=html; const el=w.firstElementChild; if (!el) return; old.replaceWith(el);
    if (k && scroll) smoothScroll(el.getBoundingClientRect().top+scrollY-84); };
  if (!k && old.classList.contains('card') && !reduceMotion()) { old.classList.add('cd-out'); setTimeout(swap, 200); } else swap();
}
// scorrimento morbido (ease-in-out, durata in base alla distanza); si ferma se tocchi lo schermo
let scrAnim=0;
const scrStop = () => cancelAnimationFrame(scrAnim);
['touchstart','wheel','keydown'].forEach(ev=>addEventListener(ev, scrStop, { passive:true }));
function smoothScroll(y) {
  scrStop(); const max=document.documentElement.scrollHeight-innerHeight, y0=scrollY, dy=Math.max(0,Math.min(y,max))-y0; if (Math.abs(dy)<2) return;
  if (reduceMotion()) { scrollTo({ top:y0+dy, behavior:'instant' }); return; }
  const ms=Math.min(950, 480+Math.abs(dy)*0.45), t0=performance.now(), ease=t=>t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  const step=now=>{ const p=Math.min(1,(now-t0)/ms); scrollTo({ top:y0+dy*ease(p), behavior:'instant' }); if (p<1) scrAnim=requestAnimationFrame(step); };
  scrAnim=requestAnimationFrame(step);
}

// ───────────────────────── DISCIPLINA ─────────────────────────
// Solo trade reali (Journal). Regole del piano giorno per giorno, trade validi ed errori, ed esecuzione:
// RR teorico (quello che scrivi nel trade) contro RR reale (PnL ÷ rischio delle Impostazioni). La differenza misura
// costi (commissioni e slippage) e size diversa dal previsto. L'RR reale si vede solo in questa pagina.
const dcard = (title, sub, body, cls) => '<div class="card '+(cls||'')+'"><div class="card-h"><h2 class="h2">'+title+'</h2>'+(sub?'<span class="sub">'+sub+'</span>':'')+'</div>'+body+'</div>';
function renderDisc() {
  const el=$('v-disc'), J=rowsOf('Journal');
  let h='<div class="stat-h"><div><div class="eyebrow">Journal · trade reali</div><h1>'+words('Disciplina')+'</h1></div></div>';
  if (!J) { el.innerHTML=h+skeleton();
    if (!S.discLoad) { S.discLoad=true; fetchFile('Journal').then(()=>{ S.discLoad=false; if (S.tab==='disc') renderCurrent(); }).catch(()=>{ S.discLoad=false; if (S.tab==='disc') el.innerHTML=h+emptyState('Journal non raggiungibile', 'Non riesco a leggere il foglio: riprova tra poco.'); }); }
    return; }
  const per=S.dper||'m', now=new Date(), ts=inRange(J, periodRange(per,0));
  const lbl={ w:wkLbl().toLowerCase(), m:MESI_F[now.getMonth()]+' '+now.getFullYear(), '3m':'ultimi 3 mesi', y:String(now.getFullYear()), all:'da sempre' }[per];
  h+='<div class="perseg">'+seg('dper',[{v:'w',l:'Sett.'},{v:'m',l:'Mese'},{v:'3m',l:'3M'},{v:'y',l:'Anno'},{v:'all',l:'Tutto'}],per)+'</div>';
  if (!ts.length) { enter(el, h+emptyState('Nessun trade reale', 'Nel periodo scelto ('+lbl+') non ci sono trade nel Journal.')); return; }
  const ex=discExec(ts);
  h+=rows2([discRules(ts, lbl), discErr(ts)]);
  h+=ex.html;
  enter(el, h, ex.after);
}
function discRules(ts, lbl) {
  const D=discDays(ts), okN=D.filter(d=>d.ok).length, lim=num(CFG.lossR); let run=0, best=0, cur=0;
  for (let i=D.length-1;i>=0 && D[i].ok;i--) run++; D.forEach(d=>{ cur=d.ok?cur+1:0; best=Math.max(best,cur); });
  const rule=(lbl2,ok,tot,bad,hint)=>{ const all=ok===tot; return '<div class="rule '+(all?'ok':'ko')+'">'+ic(all?'check':'alert',16,2.2)+'<div><b>'+lbl2+'</b><span>'+(tot?ok+' su '+tot+' '+hint:'nessun caso nel periodo')+(bad.length?' · non rispettata: '+bad.slice(-6).map(dayShort).join(', ')+(bad.length>6?' e altre '+(bad.length-6):''):'')+'</span></div></div>'; };
  const okR=D.filter(d=>d.ok).reduce((s,d)=>s+d.R,0)/Math.max(1,okN), koN=D.length-okN, koR=D.filter(d=>!d.ok).reduce((s,d)=>s+d.R,0)/Math.max(1,koN);
  return dcard('Giornate in regola', lbl,
    '<div class="ds-lead"><b class="num">'+okN+' su '+D.length+'</b><span>giornate in regola</span></div><div class="ds-bar"><i style="width:'+(100*okN/D.length)+'%"></i></div>'+
    '<p class="ds-note">'+(okN===D.length?'Ogni giornata ha rispettato tutte le regole.':'Una giornata è in regola quando rispetta tutte le regole qui sotto.')+(run>1?' Sei a <b>'+run+' di fila</b>.':'')+(best>1?' Record: <b>'+best+'</b>.':'')+'</p>'+
    '<div class="rules">'+
    rule('Solo trade validi', D.filter(d=>d.valid).length, D.length, D.filter(d=>!d.valid).map(d=>d.k), 'giornate senza errori')+
    rule('Massimo 2 trade al giorno', D.filter(d=>d.max2).length, D.length, D.filter(d=>!d.max2).map(d=>d.k), 'giornate')+
    rule('Stop dopo il TP', D.filter(d=>d.hadWin && d.tp).length, D.filter(d=>d.hadWin).length, D.filter(d=>d.hadWin && !d.tp).map(d=>d.k), 'giornate con un TP')+
    (isFinite(lim)&&lim>0 ? rule('Perdita massima −'+fmtN(lim,1)+' R al giorno', D.filter(d=>d.loss).length, D.length, D.filter(d=>!d.loss).map(d=>d.k), 'giornate') : '')+'</div>'+
    (okN && koN ? '<div class="ds-cost"><div><span>Giornata in regola</span><b class="'+sgn(okR)+' num">'+fmtN(okR,2,true)+' R</b><em>in media · '+okN+' giornate</em></div><div><span>Giornata fuori regola</span><b class="'+sgn(koR)+' num">'+fmtN(koR,2,true)+' R</b><em>in media · '+koN+' giornate</em></div></div>' : ''));
}
function discErr(ts) {
  const tr=ts.filter(t=>t.exe), val=tr.filter(t=>t.exe==='Trade valido'), er=tr.filter(t=>t.exe==='Errore'), rr=t=>isFinite(t.rr)?t.rr:0, av=a=>a.reduce((s,t)=>s+rr(t),0)/a.length;
  if (!tr.length) return dcard('Trade validi ed errori', '', '<div class="empty-row">Nessun trade con l\'esecuzione indicata nel periodo.</div>');
  let b='<div class="ds-lead"><b class="num">'+pct(val.length/tr.length)+'</b><span>trade validi · '+val.length+' su '+tr.length+'</span></div><div class="ds-bar"><i style="width:'+(100*val.length/tr.length)+'%"></i></div>';
  if (val.length && er.length) { const dv=av(val)-av(er);
    b+='<div class="ds-cost"><div><span>Trade valido</span><b class="'+sgn(av(val))+' num">'+fmtN(av(val),2,true)+' R</b><em>in media · '+val.length+' trade</em></div><div><span>Trade con errori</span><b class="'+sgn(av(er))+' num">'+fmtN(av(er),2,true)+' R</b><em>in media · '+er.length+' trade</em></div></div>'+
      '<p class="ds-note">'+(dv>0?'Ogni errore ti costa in media <b>'+fmtN(dv,2)+' R</b> rispetto a un trade fatto bene.':'In questo periodo i trade con errori sono andati bene lo stesso: è fortuna, non un motivo per ripeterli.')+'</p>'; }
  if (er.length) b+='<div style="height:6px"></div>'+bdRows(er, jModel, t=>t.errs.length?t.errs:['Non specificato'], [...L.errs,'Non specificato'], 0, 'Journal');
  else b+='<p class="ds-note">Nessun errore nel periodo.</p>';
  return dcard('Trade validi ed errori', 'esecuzione del piano', b);
}
// esecuzione: quanto vale davvero in R ogni trade, dal PnL scritto e dal rischio delle Impostazioni. La differenza tra RR
// reale e teorico mette insieme commissioni, slippage e size: senza il numero di contratti di ogni trade non si possono
// separare in modo affidabile, quindi non si stimano.
// rischio per R dei trade (mediana di |PnL ÷ RR|, RR di almeno ±0,5): serve solo a capire se il rischio impostato è sbagliato
function riskSeen(P) { const v=P.filter(t=>Math.abs(t.rr)>=0.5).map(t=>Math.abs(t.pnl/t.rr)).sort((x,y)=>x-y);
  return v.length>=3 ? v[Math.floor(v.length/2)] : NaN; }
function discExec(ts) {
  const k=riskUsd(), P=ts.filter(t=>isFinite(t.pnl) && isFinite(t.rr)), miss=ts.length-P.length;
  if (!k) return { html: dcard('RR teorico e RR reale', 'esecuzione', '<p class="ds-note">Imposta il <b>rischio per trade</b> nelle Impostazioni: serve per trasformare il PnL di ogni trade in R e confrontarlo con l\'RR che scrivi.</p><button type="button" class="btn sec sm" data-nav="set">Apri le Impostazioni</button>', 'wide') };
  if (!P.length) return { html: dcard('RR teorico e RR reale', 'esecuzione', '<p class="ds-note">Nessun trade del periodo ha il PnL scritto. Aggiungilo nei trade (campo «PnL su un conto») per vedere quanto ti costano slippage, commissioni e size.</p>', 'wide') };
  const rp=t=>t.pnl/k, gap=t=>rp(t)-t.rr, sum=(a,f)=>a.reduce((s,t)=>s+f(t),0);
  const Rt=sum(P,t=>t.rr), Rp=sum(P,rp), G=Rp-Rt;
  // con pochi trade nel periodo il rischio visto nei trade si guarda su tutto il Journal
  const Pall=(rowsOf('Journal')||[]).filter(t=>isFinite(t.pnl) && isFinite(t.rr)), rsP=riskSeen(P), rs=isFinite(rsP)?rsP:riskSeen(Pall), rsAll=!isFinite(rsP);
  // rischio di ogni trade: |PnL ÷ RR|, sui trade con RR di almeno ±0,5 (commissioni e slippage comprese)
  const RK=P.filter(t=>Math.abs(t.rr)>=0.5).map(t=>({ t, r:Math.abs(t.pnl/t.rr) })), band=0.1;
  const inB=RK.filter(x=>Math.abs(x.r/k-1)<=band).length, over=RK.filter(x=>x.r>k*(1+band)).length, under=RK.length-inB-over;
  const avR=RK.length ? RK.reduce((s,x)=>s+x.r,0)/RK.length : NaN;
  const Ls=P.filter(t=>t.rr<=-0.95 && t.rr>=-1.05), Ws=P.filter(t=>t.rr>0), Bs=P.filter(t=>t.rr===0);
  const lossR=Ls.length ? -sum(Ls,rp)/Ls.length : NaN, winG=Ws.length ? sum(Ws,gap)/Ws.length : NaN, beU=Bs.length ? sum(Bs,t=>t.pnl)/Bs.length : NaN;
  // esempio preso dai tuoi trade: l'ultimo con PnL e RR di almeno ±0,5
  const exT=P.slice().reverse().find(t=>Math.abs(t.rr)>=0.5), exR=exT&&rp(exT);
  const mx=Math.max(Math.abs(Rt),Math.abs(Rp),1e-9), bar=(v,cls)=>'<div class="rr-track"><i class="'+cls+(v<0?' neg':'')+'" style="width:'+(100*Math.abs(v)/mx).toFixed(1)+'%"></i></div>';
  const near=Math.abs(G)<0.05*Math.max(1,Math.abs(Rt)), good=G>=0, nT=P.length, tr=n=>n+(n===1?' trade':' trade');
  const head = near ? 'Il conto torna con quello che hai scritto' : good ? 'Sul conto è entrato più di quanto hai scritto' : 'Sul conto è entrato meno di quanto hai scritto';
  // il rischio delle Impostazioni non torna con i trade: tutto il resto della pagina sarebbe fuori scala
  const bad = isFinite(rs) && Math.abs(rs/k-1)>0.25;
  const warn = bad ? '<div class="rr-warn">'+ic('alert',18,2.2)+'<div><b>Il rischio impostato non torna con i tuoi trade</b><span>Nelle Impostazioni il rischio è <b>'+usd(k)+'</b>, ma dal PnL dei tuoi trade ogni R vale circa <b>'+usd(rs)+'</b>'+(rsAll?' (su tutto il Journal)':'')+'. Se rischi davvero circa '+usd(rs)+' a trade aggiorna il rischio: i numeri qui sotto tornano. Se invece rischi '+usd(k)+', il PnL scritto è più basso del previsto: controlla che sia quello di un solo conto.</span><button type="button" class="btn sec sm" data-nav="set">Apri le Impostazioni</button></div></div>' : '';
  // con pochi trade il dettaglio dice più di ogni media
  const list = nT<=6 ? '<div class="rr-list">'+P.map(t=>'<div><span>'+t.d.getDate()+' '+MESI[t.d.getMonth()]+' · '+esc(t.a)+'</span><span>scritto <b class="'+sgn(t.rr)+'">'+fmtN(t.rr,2,true)+' R</b></span><span>'+fmtU(t.pnl)+' = <b class="'+sgn(rp(t))+'">'+fmtN(rp(t),2,true)+' R</b></span></div>').join('')+'</div>' : '';
  let h=dcard('RR teorico e RR reale', tr(nT)+' con PnL'+(miss?' · '+miss+' senza, esclusi':'')+' · rischio '+usd(k),
    warn+'<div class="rr-cmp">'+
      '<div class="rr-row"><div class="rr-l"><b>RR teorico</b><span>quello che scrivi nel trade</span></div>'+bar(Rt,'t')+'<b class="num rr-v '+sgn(Rt)+'">'+fmtN(Rt,1,true)+' R</b></div>'+
      '<div class="rr-row"><div class="rr-l"><b>RR reale</b><span>il PnL diviso '+usd(k)+'</span></div>'+bar(Rp,'r')+'<b class="num rr-v '+sgn(Rp)+'">'+fmtN(Rp,1,true)+' R</b></div></div>'+
    '<div class="rr-verdict '+(near||good?'ok':'ko')+'">'+ic(near||good?'trendUp':'trendDn',18,2.2)+'<div><b>'+head+'</b><span>'+(near?'Differenza di '+fmtU(G*k)+' in '+tr(nT)+'.':fmtU(G*k)+' in '+tr(nT)+' ('+fmtN(G,2,true)+' R)'+(nT>1?', in media '+fmtU(G*k/nT)+' a trade':'')+'.')+'</span></div></div>'+
    list+
    '<details class="rr-how"><summary>'+ic('chev',15,2.2)+'Come si legge</summary><div>'+
      '<p><b>RR teorico</b> è l\'RR che scrivi tu: −1 allo stop, +2 a 2R; con la gestione in prova +3 a target pieno e +1,5 se il resto torna a +1R. È quello che avresti con un rischio sempre esattamente di '+usd(k)+' e senza costi.</p>'+
      '<p><b>RR reale</b> è quanto è entrato davvero sul conto, misurato in R: PnL ÷ '+usd(k)+'. Una loss da −$230 vale −1,15 R, non −1.</p>'+
      (exT?'<p class="rr-ex"><b>Esempio dal tuo Journal</b> · '+exT.d.getDate()+' '+MESI[exT.d.getMonth()]+' '+esc(exT.a)+': hai scritto <b>'+fmtN(exT.rr,2,true)+' R</b>, il PnL è '+fmtU(exT.pnl)+' → '+fmtU(exT.pnl)+' ÷ '+usd(k)+' = <b>'+fmtN(exR,2,true)+' R</b>.</p>':'')+
      '<p>La differenza mette insieme <b>commissioni</b>, <b>slippage</b> e <b>size</b> diversa dal previsto. Più è vicina a 0, più la tua esecuzione è precisa.</p></div></details>', 'wide');
  const side=[];
  side.push(dcard('Rischio per trade', 'obiettivo '+usd(k)+' ± 10%',
    (RK.length ? '<div class="ds-lead"><b class="num">'+pct(inB/RK.length)+'</b><span>dei trade nel range '+usd(k*(1-band))+'–'+usd(k*(1+band))+'</span></div>'+
      '<div class="rk-bar"><i class="un" style="width:'+(100*under/RK.length)+'%"></i><i class="in" style="width:'+(100*inB/RK.length)+'%"></i><i class="ov" style="width:'+(100*over/RK.length)+'%"></i></div>'+
      '<div class="rk-leg"><span><i class="un"></i>Sotto: '+under+'</span><span><i class="in"></i>Nel range: '+inB+'</span><span><i class="ov"></i>Sopra: '+over+'</span></div>'+
      '<p class="ds-note">Rischio medio <b>'+usd(avR)+'</b> ('+fmtN((avR/k-1)*100,0,true)+'% rispetto a '+usd(k)+'). Si calcola come PnL ÷ RR, sui trade con RR di almeno ±0,5: commissioni e slippage sono compresi, quindi le loss tendono a sembrare un po\' sopra e i vincenti un po\' sotto.</p>'
    : '<div class="empty-row">Servono trade con RR di almeno ±0,5.</div>')));
  side.push(dcard('Loss e trade vincenti', 'quanto pesano davvero',
    '<div class="ds-cost">'+
      '<div><span>Una loss piena (−1 R)</span><b class="num '+(lossR>1.02?'neg':'')+'">'+(isFinite(lossR)?'−'+fmtN(lossR,2)+' R':'–')+'</b><em>'+(isFinite(lossR)?'in media '+usd(lossR*k)+' · '+Ls.length+' loss':'nessuna loss con PnL')+'</em></div>'+
      '<div><span>Un trade vincente</span><b class="num '+sgn(winG)+'">'+(isFinite(winG)?fmtN(winG,2,true)+' R':'–')+'</b><em>'+(isFinite(winG)?'RR reale meno teorico · '+Ws.length+' trade':'nessun trade vincente con PnL')+'</em></div></div>'+
    (Bs.length ? '<p class="ds-note">I pareggi (RR 0) ti lasciano in media <b class="'+sgn(beU)+'">'+fmtU(beU)+'</b> ('+Bs.length+' trade): commissioni e slippage.</p>' : '')+
    '<p class="ds-note">'+(!isFinite(lossR)?'':lossR>1.1?'Le loss ti costano più di 1,1 R: controlla lo stop e la size prima di entrare.':lossR<0.9?'Le loss costano meno di 1 R: rischi meno di '+usd(k)+' a trade, oppure il rischio nelle Impostazioni è troppo alto.':'Le loss restano vicine a 1 R: la size è sotto controllo.')+'</p>'));
  h+=rows2(side);
  // andamento mese per mese: si vede se stai migliorando
  const ms=[...new Set(P.map(t=>t.ym))].sort();
  if (ms.length>1) { let tb='<div class="tbl-wrap"><table class="ex-t"><tr><th>Mese</th><th>Trade</th><th>RR teorico</th><th>RR reale</th><th>Differenza</th><th>Rischio medio</th></tr>';
    ms.slice().reverse().forEach(ym=>{ const g=P.filter(t=>t.ym===ym), a=sum(g,t=>t.rr), b2=sum(g,rp), rk=g.filter(t=>Math.abs(t.rr)>=0.5).map(t=>Math.abs(t.pnl/t.rr)), mo=+ym.slice(5)-1;
      tb+='<tr><td>'+MESI_F[mo].replace(/^./,c=>c.toUpperCase())+'</td><td class="num">'+g.length+'</td><td class="num">'+fmtN(a,1,true)+'</td><td class="num">'+fmtN(b2,1,true)+'</td><td class="num '+sgn(b2-a)+'"><b>'+fmtN(b2-a,2,true)+'</b></td><td class="num">'+(rk.length?usd(rk.reduce((x,y)=>x+y,0)/rk.length):'–')+'</td></tr>'; });
    h+=dcard('Mese per mese', 'più la differenza è vicina a 0, più l\'esecuzione è precisa · rischio = PnL ÷ RR', tb+'</table></div>', 'wide'); }
  // rischio reale trade per trade
  const last=RK.slice(-40);
  if (last.length>=3) h+=dcard('Rischio trade per trade', 'ultimi '+last.length+' · rischio = PnL ÷ RR · barra = differenza da '+usd(k), '<div class="chart" id="c-rk"></div>', 'wide');
  // trade da rivedere: quelli che hanno perso più R rispetto all'RR scritto
  const worst=P.filter(t=>gap(t)<-0.1).sort((a,b)=>gap(a)-gap(b)).slice(0,5);
  if (worst.length) h+=dcard('Trade da rivedere', 'quelli che ti sono costati di più', worst.map(t=>'<button type="button" class="trow" data-open="Journal:'+t.row+'"><span class="badge '+(t.out==='Win'?'w':t.out==='Loss'?'l':'')+'">'+esc(t.a)+'</span><span class="tmain"><span class="t1"><span class="tt">'+esc(t.idea||'Trade')+'</span></span><span class="t2">'+t.d.getDate()+' '+MESI[t.d.getMonth()]+' · teorico '+fmtN(t.rr,2,true)+' · reale '+fmtN(rp(t),2,true)+(Math.abs(t.rr)>=0.5?' · rischio '+usd(Math.abs(t.pnl/t.rr)):'')+'</span></span><span class="tres"><b class="neg">'+fmtN(gap(t),2,true)+' R</b><span>'+fmtU(gap(t)*k)+'</span></span>'+ic('chev',16,2)+'</button>').join(''), 'wide');
  const after = () => { const c=$('c-rk'); if (!c) return;
    barChart(c, last.map(x=>{ const d=x.r-k, o=d>k*band, u=d<-k*band; return { v:d, l:x.t.d.getDate()+' '+MESI[x.t.d.getMonth()], cls:(d>=0?'p':'n')+(o?' ov':u?' un':' z'), tip:' · '+x.t.d.getDate()+' '+MESI[x.t.d.getMonth()]+' '+x.t.a+' · rischio '+usd(x.r)+' (RR '+fmtN(x.t.rr,2,true)+', PnL '+fmtU(x.t.pnl)+')' }; }),
      { h:170, fmt:v=>(v>=0?'+':'')+usd(v), tickFmt:v=>(v>0?'+':'')+fmtN(v,0), aria:'Rischio per trade rispetto al rischio impostato' }); };
  return { html:h, after };
}

// ───────────────────────── IMPOSTAZIONI ─────────────────────────
function renderSet() {
  const el=$('v-set'), C=CFG, sec=(t,s,b,d)=>'<div class="card wide set rise" style="--d:'+d+'ms"><div class="card-h"><div class="h2">'+t+'</div>'+(s?'<span class="sub">'+s+'</span>':'')+'</div>'+b+'</div>';
  const fld2=(l,inp,hint)=>'<div class="field"><label>'+l+'</label>'+inp+(hint?'<span class="hint">'+hint+'</span>':'')+'</div>';
  let h='<div class="stat-h rise"><div><div class="eyebrow">'+APP+'</div><h1>'+words('Impostazioni')+'</h1></div></div>';
  h+=sec('Profilo','',fld2('Il tuo nome','<input class="inp" data-cfg="name" value="'+esc(C.name)+'" maxlength="30">')+
     '<div class="field"><span class="flabel">Tema</span>'+seg('cfg-theme',[{v:'auto',l:'Automatico'},{v:'light',l:'Chiaro'},{v:'dark',l:'Scuro'}],C.theme)+'</div>'+
     '<div class="field"><span class="flabel">Animazioni</span>'+seg('cfg-motion',[{v:'full',l:'Complete'},{v:'auto',l:'Come il sistema'},{v:'reduce',l:'Ridotte'}],C.motion||'full')+
     '<span class="hint">«Come il sistema» le riduce se nel PC o nel telefono è attivo «riduci movimento» (su Windows: effetti di animazione disattivati).</span></div>',40);
  h+=sec('Sessione e piano','ora italiana','<div class="g2">'+fld2('Primo ingresso','<input class="inp" type="time" data-cfg="s0" value="'+esc(C.s0)+'">')+fld2('Ultimo ingresso','<input class="inp" type="time" data-cfg="s1" value="'+esc(C.s1)+'">')+'</div>'+
     '<p class="hint" style="margin:-4px 0 12px">Orari con Wall Street che apre alle 15:30. Nelle settimane del cambio d\'ora, quando apre alle 14:30, l\'app sposta da sola la sessione e le fasce orarie. Nel foglio scrivi sempre l\'ora reale.</p>'+
     fld2('Limite di perdita giornaliero (R)','<input class="inp" inputmode="decimal" data-cfg="lossR" value="'+esc(C.lossR)+'" placeholder="es. 2">','Oltre questo, la Panoramica ti dice di fermarti.'),70);
  h+=sec('Prop firm e dollari','copy trading',propSet(fld2),85);
  h+=sec('Filtri all\'apertura dell\'EOW','il Journal parte sempre senza filtri','<div class="g2"><div class="field"><span class="flabel">Asset</span>'+seg('cfg-asset',[{v:'',l:'Tutti'},'ES','NQ'],C.asset)+'</div>'+
     '<div class="field"><span class="flabel">Piano</span>'+seg('cfg-plan',[{v:'max2',l:'Max 2 al giorno'},{v:'',l:'Nessuno'}],C.plan)+'</div></div>'+
     '<div class="field"><span class="flabel">Idee da includere</span>'+chips('cfg-idea',L.idea,L.idea.filter(i=>!C.exIdea.includes(i)),true)+'</div>'+
     '<button type="button" class="btn sec sm" data-act="cfgapply">Applica subito ai filtri</button>',100);
  h+=sec('Checklist pre-sessione','una voce per riga',fld2('','<textarea class="inp" rows="6" data-cfg="check">'+esc(C.check.join('\n'))+'</textarea>','Compare nella Panoramica finché la sessione è aperta e si azzera ogni giorno.'),160);
  h+=sec('Collegamento','',(viaScript()?'<p class="mut">L\'app gira dentro Apps Script: nessun indirizzo da impostare.</p>':
     '<p class="mut" style="margin:0 0 12px">Collegata a <b>…'+esc(store.get('api','').slice(-24))+'</b></p><button type="button" class="btn sec sm" data-act="setup">Cambia indirizzo e chiave</button>')+
     ' <button type="button" class="btn sec sm" data-act="cacheclear">Svuota i dati salvati</button>',190);
  enter(el,h);
}
// sezione Prop firm: rischio a conto, conti in copy trading con le loro date e i payout ricevuti
function propSet(fld2) {
  const P=CFG.prop, k=riskUsd(), n=nAcc();
  let b='<div class="g2">'+fld2('Rischio per trade, su un conto ($)','<input class="inp" inputmode="decimal" data-cfg="risk" value="'+esc(CFG.risk)+'" placeholder="es. 200">','Vale per i trade senza PnL scritto (RR × rischio) e per l\'EOW.')+
    '<div class="field"><span class="flabel">Conti attivi</span><div class="stepper"><button type="button" class="icon-btn" data-act="nacc" data-d="-1" aria-label="Un conto in meno"'+(n<=1?' disabled':'')+'>−</button>'+
      '<b class="num" id="nacc">'+n+'</b><button type="button" class="icon-btn" data-act="nacc" data-d="1" aria-label="Un conto in più">+</button></div><span class="hint">Conti su cui copi ogni trade.</span></div></div>'+
    '<div class="field"><span class="flabel">Dollari da mostrare</span>'+seg('pcfg-view',[{v:'tot',l:'Totale dei conti'},{v:'one',l:'Un conto'}],P.view)+'</div>';
  b+='<div class="prop-sum">'+ic('shield',17,2)+'<span>'+(n>1?'Copi su <b>'+n+' conti</b>: ':'Un conto: ')+(k?'con '+usd(k)+' a conto rischi <b>'+usd(k*n)+'</b> a trade. ':'')+
    (n>1?'Il PnL di ogni trade conta '+n+' volte nel totale.':'')+'</span></div>';
  b+='<p class="hint" style="margin:12px 0 0">'+(S.noSync?'Aggiorna Code.gs alla versione nuova per avere le stesse impostazioni su telefono e PC.':viaScript()?'':'Rischio e numero di conti sono salvati anche nel foglio: li ritrovi uguali su telefono e PC.')+'</p>';
  return b;
}
function propChanged(rerender) { syncTouch('prop'); if (rerender && S.tab==='set') renderCurrent(true); }
// rischio e conti uguali su tutti i dispositivi, salvati nello script (appSettings). Ogni impostazione ha la sua data
// di modifica e per ciascuna vince la più recente: cambiare il rischio sul PC non riporta indietro i conti cambiati sul telefono.
// Prima di salvare si rilegge il server e si uniscono le due versioni.
const SYNC_KEYS=['risk','prop','rev']; let pushT=0;
const syncTs = () => (CFG.syncTs = CFG.syncTs || {});
function syncTouch(k) { syncTs()[k]=Date.now(); saveCfg(); pushSettings(); }
function syncMerge(o) {
  const T=syncTs(), oT=(o && o.ts) || {}; let changed=false, newer=!o;
  SYNC_KEYS.forEach(k=>{ const st=o ? (oT[k] || 0) : 0, lt=T[k] || 0;
    if (o && (k in o) && st>lt) { CFG[k]=o[k]; T[k]=st; changed=true; } else if (lt>st) newer=true; });
  if (changed) { normProp(); saveCfg(); if (S.loaded && !S.sheet) renderCurrent(true); }
  return newer;
}
function pushSettings() { if (S.noSync) return; clearTimeout(pushT); pushT=setTimeout(async ()=>{
  try { syncMerge(await call('appSettings')); const out={ t:Date.now(), ts:Object.assign({}, syncTs()) }; SYNC_KEYS.forEach(k=>{ out[k]=CFG[k]; });
    await call('appSettings', out); } catch(e) { if (/sconosciuta/i.test(e.message||'')) S.noSync=true; } }, 600); }
async function pullSettings() {
  try { if (syncMerge(await call('appSettings'))) pushSettings(); } catch(e) { if (/sconosciuta/i.test(e.message||'')) S.noSync=true; }
}
function cfgChanged(k) {
  if (k==='risk') syncTouch('risk');
  if (k==='name') USER=CFG.name.trim()||'trader';
  if (k==='s0'||k==='s1') SESS=[mins(CFG.s0), mins(CFG.s1)];
  if (k==='theme' || k==='motion') applyTheme();
  saveCfg();
}

// ───────────────────────── REVISIONE SETTIMANALE (EOW) ─────────────────────────
// Ogni weekend la settimana appena finita si rivede nell'EOW: prima ES da lunedì a venerdì, poi NQ. Parte il venerdì dopo la
// fine della sessione (Impostazioni → sessione) e resta finché non è completa, anche nei giorni dopo. Ogni giorno mostra le
// news USD e le scrive nel trade (Red se c'è almeno un evento ad alto impatto, Orange se medio, anche fuori sessione).
// Lo stato (CFG.rev) è sincronizzato tra i dispositivi come rischio e conti: { wk: lunedì, ES:[giorni fatti], NQ:[…], fin }.
const REV_A = ['ES','NQ'];
function revWeek() {   // lunedì della settimana da rivedere
  const r=romeDate(Date.now()), mon=pdIso(weekOf(iso(r))), wd=(r.getDay()+6)%7;
  const after = wd>4 || (wd===4 && r.getHours()*60+r.getMinutes() >= sessOf(iso(r))[1]);
  return iso(addDays(mon, after ? 0 : -7));
}
function revState() { const wk=revWeek(); let v=CFG.rev;
  if (!v || v.wk!==wk) v={ wk, ES:[], NQ:[], fin:false };
  return v; }
const revDays = wk => [0,1,2,3,4].map(i=>iso(addDays(pdIso(wk),i)));
const revDue = () => !revState().fin;
function revSave(v) { CFG.rev=v; syncTouch('rev'); }
function revPos(v) {   // dove sei: l'asset e il giorno scelti, se no il primo giorno ancora da fare
  const days=revDays(v.wk);
  if (S.revSel && S.revSel.wk===v.wk) return S.revSel;
  for (const a of REV_A) { const d=days.find(x=>!v[a].includes(x)); if (d) return { wk:v.wk, a, d }; }
  return { wk:v.wk, a:'NQ', d:days[4] };
}
S.revLater = (()=>{ try { return sessionStorage.getItem('tj.revLater')===revWeek(); } catch(e) { return false; } })();
// news della settimana: dall'archivio dello script (newsWeek), intanto dal calendario già scaricato
S.nw = (()=>{ try { return JSON.parse(localStorage.getItem('tj.nw')||'{}')||{}; } catch(e) { return {}; } })();
const nwP={};
function revNewsLoad(wk) {
  const c=S.nw[wk], end=pdIso(wk).getTime()+5*dayMs;
  if ((c && c.got>end+6*3600000) || nwP[wk]) return;   // già preso a settimana finita
  nwP[wk]=call('newsWeek', wk).then(d=>{ const o=Object.assign({}, S.nw, { [wk]:{ ev:d.ev, got:Date.now() } }); S.nw={};   // le ultime 8 settimane
    Object.keys(o).sort().slice(-8).forEach(k=>{ S.nw[k]=o[k]; }); try { localStorage.setItem('tj.nw', JSON.stringify(S.nw)); } catch(e) {} if (S.sheet==='form') formNewsAuto(); })
    .catch(e=>{ S.nwErr = /sconosciuta/i.test(e.message||'') ? 'OLD' : (e.message||String(e)); })
    .finally(()=>{ setTimeout(()=>{ delete nwP[wk]; }, 60000); if (S.tab==='list' && !S.sheet) renderCurrent(true); });
}
function revNews(wk) {
  const c=S.nw[wk]; if (c && c.ev && c.ev.length) return c.ev.map(mapEv);
  const ev=newsEvents().filter(e=>weekOf(e.day)===wk); return ev.length ? ev : null;
}
// categoria di news di un giorno dal calendario: dall'archivio della settimana o dal calendario scaricato; '' se non si sa
function newsCatOf(dIso) { const wk=weekOf(dIso), c=S.nw[wk];
  const ev = c && c.ev && c.ev.length ? c.ev.map(mapEv) : (newsEvents().some(e=>weekOf(e.day)===wk) ? newsEvents().filter(e=>weekOf(e.day)===wk) : null);
  return ev ? catOf(ev.filter(e=>e.day===dIso)) : ''; }
const catOf = ev => ev.some(e=>e.cur==='USD' && e.imp==='High') ? 'Red News' : ev.some(e=>e.cur==='USD' && e.imp==='Medium') ? 'Orange News' : 'No News Day';
const catCls = c => c==='Red News'?'hi':c==='Orange News'?'md':'';
const catLbl = c => ({ 'Red News':'Red', 'Orange News':'Orange', 'No News Day':'Nessuna news' })[c] || c;
const revAsset = t => /NQ/i.test(t.a||'') ? 'NQ' : 'ES';
const revTrades = (a, d) => S.file==='EOW' ? all().filter(t=>iso(t.d)===d && revAsset(t)===a) : [];
const dayName = d => { const x=pdIso(d); return GIORNI[x.getDay()].replace(/^./,c=>c.toUpperCase())+' '+x.getDate(); };

// carta in Home finché la revisione non è fatta
function revHomeCard() {
  if (!revDue() || S.revLater) return '';
  const v=revState(), days=revDays(v.wk), n=v.ES.length+v.NQ.length, a=v.ES.length<5?'ES':'NQ', d0=pdIso(days[0]), d4=pdIso(days[4]);
  return '<div class="rv-hero rise"><div class="rv-top"><span>Revisione · '+d0.getDate()+(d0.getMonth()!==d4.getMonth()?' '+MESI[d0.getMonth()]:'')+'–'+d4.getDate()+' '+MESI_F[d4.getMonth()]+'</span><em>'+n+' / 10 giorni</em></div>'+
    '<div class="rv-t">'+(n?'Riprendiamo la revisione':'Pronto a rivedere la settimana?')+'</div>'+
    '<p>'+(n?'Sei a '+a+', '+dayName(revPos(v).d).toLowerCase()+'. ':'Iniziamo da ES, come al solito. ')+'Le news di ogni giorno sono già compilate.</p>'+
    '<div class="rv-bars">'+days.map((d,i)=>'<span class="'+(v.ES.includes(d)&&v.NQ.includes(d)?'on':v.ES.includes(d)?'half':'')+'"><i></i>'+['Lun','Mar','Mer','Gio','Ven'][i]+'</span>').join('')+'</div>'+
    '<div class="rv-acts"><button type="button" class="btn rv-w" data-act="rvgo">'+(n?'Riprendi da '+a:'Inizia da ES')+ic('chev',18,2.2)+'</button><button type="button" class="btn rv-g" data-act="rvlater">Più tardi</button></div></div>';
}

// pagina Trade dell'EOW durante la revisione
function renderReview() {
  const el=$('v-list'), v=revState(), days=revDays(v.wk), m=curModel(), E=true; revNewsLoad(v.wk);
  const nev=revNews(v.wk), dev = d => nev ? nev.filter(e=>e.day===d) : null, cat = d => nev ? catOf(dev(d)) : '';
  const d0=pdIso(days[0]), d4=pdIso(days[4]), wkL=d0.getDate()+(d0.getMonth()!==d4.getMonth()?' '+MESI[d0.getMonth()]:'')+'–'+d4.getDate()+' '+MESI_F[d4.getMonth()];
  const chip = d => { const c=cat(d); return c ? '<span class="ncat '+catCls(c)+'">'+catLbl(c)+'</span>' : '<span class="ncat">…</span>'; };
  const sum = a => { const ts=all().filter(t=>revAsset(t)===a && weekOf(iso(t.d))===v.wk), R=ts.reduce((s,t)=>s+m.rOf(t),0);
    return { n:ts.length, R, empty:days.filter(d=>!ts.some(t=>iso(t.d)===d)).length }; };
  let h='<div class="stat-h rise"><div><div class="eyebrow">Revisione settimanale · EOW</div><h1>'+words('Settimana '+wkL)+'</h1></div></div>';
  const noNews = !nev ? '<p class="rv-note">'+(S.nwErr==='OLD' ? 'Per le news delle settimane passate aggiorna Code.gs (Distribuisci → Nuova versione).' : S.nwErr ? 'News non disponibili ('+esc(S.nwErr)+'): scegli tu il tipo di news nel trade.' : 'Carico le news della settimana…')+'</p>' : '';
  const started = v.ES.length+v.NQ.length>0 || S.revGo;
  if (v.fin) {   // appena completata
    const s1=sum('ES'), s2=sum('NQ');
    h+='<div class="rv-hero done rise"><div class="rv-t">Settimana rivista</div><p>'+wkL+' · ES e NQ completi. La carta in Home torna venerdì prossimo dopo le '+esc(CFG.s1)+'.</p>'+
      '<div class="rv-sum">'+[['ES',s1],['NQ',s2]].map(([a,s])=>'<div><span>'+a+'</span><b>'+s.n+' trade · '+fmtRc(s.R,0)+'</b></div>').join('')+'</div>'+
      '<div class="rv-acts"><button type="button" class="btn rv-w" data-nav="stats">Vai all\'analisi</button><button type="button" class="btn rv-g" data-act="rvall">Vedi i trade</button></div></div>';
    enter(el,h); return;
  }
  if (!started) {
    h+='<div class="card rv-start rise"><span class="rv-ic">'+ic('cal',24,2)+'</span><div class="rv-t">Pronto a rivedere la settimana?</div><p>Iniziamo da <b>ES</b> come al solito, poi passiamo a NQ.</p></div>';
    h+='<h2 class="sect">Il percorso · 10 giorni</h2><div class="card rv-path rise"><div class="rv-ph on">1 · ES <em>si parte da qui</em></div>'+
      days.map(d=>'<div class="rv-pr"><span>'+dayName(d)+'</span>'+chip(d)+'</div>').join('')+
      '<div class="rv-ph">2 · NQ <em>stessi 5 giorni, news già pronte</em></div></div>'+noNews+
      '<p class="rv-note">News USD dal calendario ForexFactory: Red se c\'è almeno un evento ad alto impatto, Orange se ce n\'è uno a medio impatto, altrimenti No News Day.</p>'+
      '<div class="rv-foot"><button type="button" class="btn" data-act="rvstart">Inizia da ES · '+dayName(days[0]).toLowerCase()+ic('chev',18,2.2)+'</button>'+
      '<div class="rv-links"><button type="button" class="lnk" data-act="rvall">Mostra tutti i trade</button><button type="button" class="lnk" data-act="rvskip">Già fatta: segna come completata</button></div></div>';
    enter(el,h); return;
  }
  const p=revPos(v);
  if (p.a==='NQ' && !v.NQ.length && !S.revNQ && !(S.revSel && S.revSel.a==='NQ')) {   // ES finito: passaggio a NQ
    const s=sum('ES');
    h+='<div class="card rv-start rise"><span class="rv-ic ok">'+ic('check',22,2.6)+'</span><div class="rv-t">ES fatto</div>'+
      '<div class="rv-sum g">'+'<div><b>'+s.n+'</b><span>trade</span></div><div><b class="'+sgn(s.R)+'">'+fmtRc(s.R,0)+'</b><span>a '+tgt()+'R</span></div><div><b>'+s.empty+'</b><span>giorni senza trade</span></div></div>'+
      '<p>Ora tocca a <b>NQ</b>: stessi giorni, stesse news.</p><button type="button" class="btn" data-act="rvnq">Passa a NQ · '+dayName(days[0]).toLowerCase()+ic('chev',18,2.2)+'</button></div>';
    enter(el,h); return;
  }
  const a=p.a, d=p.d, k=REV_A.indexOf(a)*5+days.indexOf(d)+1, done=v[a], ev=dev(d), c=cat(d), ts=revTrades(a,d);
  h='<div class="rv-bar rise"><div><span>Revisione '+a+' · giorno '+k+' di 10</span><i><b style="width:'+((v.ES.length+v.NQ.length)*10)+'%"></b></i></div>'+
    '<button type="button" class="lnk" data-act="rvall">Tutti i trade</button></div>';
  h+='<div class="rv-assets rise">'+REV_A.map(x=>'<button type="button" class="chip'+(x===a?' on':'')+'" data-rva="'+x+'">'+x+' <em>'+v[x].length+'/5</em></button>').join('')+'</div>';
  h+='<div class="rv-days rise">'+days.map((x,i)=>{ const n=revTrades(a,x).length, ok=done.includes(x);
    return '<button type="button" class="'+(x===d?'cur':ok?'ok':'')+'" data-rvd="'+x+'">'+['Lun','Mar','Mer','Gio','Ven'][i]+'<span>'+(ok?(n?n+' trade':'nessuno'):x===d?'ora':n?n+' trade':'–')+'</span></button>'; }).join('')+'</div>';
  h+='<div class="stat-h rise"><h1>'+words(GIORNI[pdIso(d).getDay()].replace(/^./,ch=>ch.toUpperCase())+' '+pdIso(d).getDate()+' '+MESI_F[pdIso(d).getMonth()])+'</h1></div>';
  const key = ev ? ev.filter(e=>e.imp==='High'||e.imp==='Medium'||e.imp==='Holiday'||e.trump) : [];
  h+='<div class="card rv-news rise"><div class="card-h"><span class="eyebrow">News del giorno</span>'+(c?'<span class="ncat '+catCls(c)+'">'+c+'</span>':'')+'</div>'+
    (!ev ? noNews : key.length ? '<div class="rv-nl">'+key.map(e=>'<div><span class="num">'+esc(e.hm)+'</span><i class="'+e.imp2+'"></i><span>'+esc(newsIt(e.title))+'</span></div>').join('')+'</div>' : '<p class="mut">Nessuna news USD ad alto o medio impatto.</p>')+
    (c?'<p class="rv-ok">'+ic('check',15,2.4)+'Scritta in automatico in ogni trade di questo giorno</p>':'')+'</div>';
  h+='<div class="dayh rise"><span>Trade '+a+' di questo giorno</span><span>'+(ts.length?ts.length+(ts.length===1?' inserito':' inseriti'):'nessuno')+'</span></div>';
  if (ts.length) h+='<div class="dayc rise">'+ts.map(t=>trow(t,m,true)).join('')+'</div>';
  const last = k===10, nextD = days[days.indexOf(d)+1];
  h+='<div class="rv-foot"><button type="button" class="btn sec" data-act="rvadd">'+ic('plus',18,2.4)+(ts.length?'Aggiungi un altro trade':'Aggiungi un trade')+'</button>'+
    '<button type="button" class="btn" data-act="rvnext">'+(done.includes(d)?'Giorno già fatto · ':'Giorno fatto · ')+(last?'chiudi la revisione':nextD?'avanti a '+GIORNI[pdIso(nextD).getDay()]:'avanti a NQ')+ic('chev',18,2.2)+'</button>'+
    '<p class="rv-note c">Nessun setup? «Giorno fatto» lo segna come giorno senza trade.</p></div>';
  enter(el,h);
}
function revClick(b) {
  const v=revState();
  if (b.dataset.act==='rvgo') { S.revAll=false; navTo('list:EOW'); return true; }
  if (b.dataset.act==='rvlater') { S.revLater=true; try { sessionStorage.setItem('tj.revLater', v.wk); } catch(e) {} renderCurrent(true); return true; }
  if (b.dataset.act==='rvstart') { S.revGo=true; S.revSel=null; renderCurrent(true); window.scrollTo({ top:0 }); return true; }
  if (b.dataset.act==='rvall') { S.revAll=true; renderCurrent(true); window.scrollTo({ top:0 }); return true; }
  if (b.dataset.act==='rvback') { S.revAll=false; renderCurrent(true); window.scrollTo({ top:0 }); return true; }
  if (b.dataset.act==='rvskip') { revSave(Object.assign(v, { ES:revDays(v.wk), NQ:revDays(v.wk), fin:true })); S.revAll=true; toast('Revisione segnata come fatta'); renderCurrent(true); return true; }
  if (b.dataset.act==='rvnq') { S.revNQ=true; S.revSel={ wk:v.wk, a:'NQ', d:revDays(v.wk)[0] }; renderCurrent(true); window.scrollTo({ top:0 }); return true; }
  if (b.dataset.rva) { const a=b.dataset.rva, days=revDays(v.wk); S.revNQ = S.revNQ || a==='NQ'; S.revSel={ wk:v.wk, a, d:days.find(x=>!v[a].includes(x)) || days[0] }; renderCurrent(true); return true; }
  if (b.dataset.rvd) { const p=revPos(v); S.revSel={ wk:v.wk, a:p.a, d:b.dataset.rvd }; renderCurrent(true); return true; }
  const inRev = S.tab==='list' && S.file==='EOW' && revDue() && !S.revAll && (v.ES.length+v.NQ.length>0 || S.revGo);
  if (b.dataset.act==='rvadd' || (b.id==='fab' && inRev)) { const p=revPos(v), ev=revNews(v.wk);
    openForm(null, { Asset:p.a, Data:p.d, News: ev ? catOf(ev.filter(e=>e.day===p.d)) : undefined }); return true; }
  if (b.dataset.act==='rvnext') { const p=revPos(v), days=revDays(v.wk);
    if (!v[p.a].includes(p.d)) v[p.a]=[...v[p.a], p.d];
    v.fin = REV_A.every(a=>days.every(d=>v[a].includes(d)));
    S.revSel=null; if (p.a==='NQ') S.revNQ=true;
    const nx=days[days.indexOf(p.d)+1]; if (!v.fin && nx && v[p.a].includes(nx) === false) S.revSel={ wk:v.wk, a:p.a, d:nx };
    if (v.fin) S.revJust=true; revSave(v); if (v.fin) setTimeout(confetti, 200); renderCurrent(true); window.scrollTo({ top:0 }); return true; }
  return false;
}

// ───────────────────────── TRADE ─────────────────────────
const isFlash = t => t.raw===S.flash && performance.now()-S.flashT < 1800;
// R senza zeri inutili: −1 R, +2 R, +2,84 R
const fmtRc = (x, dec=2) => fmtN(x, dec, true).replace(/,?0+$/, '').replace(/,$/, '')+' R';
const NEWS_S = { 'No News Day':'No news', 'Red News':'Red news', 'Orange News':'Orange news' };
// riga di un trade: idea in alto, sotto ora · direzione · news; a destra l'R e, più piccoli, i dollari (Journal) o il max (EOW).
// Niente «Loss» o «Real 2rr»: lo dicono già colore e segno, e il TP è nel dettaglio del trade
function tline(t, f, o) {
  const E=f==='EOW', r=o.r, when=(o.date?t.d.getDate()+' '+MESI[t.d.getMonth()]+' · ':'')+String(t.raw.Ora).slice(0,5);
  const sub = t.raw._pending ? 'Salvo…' : E ? 'max '+fmtN(t.max,1)+' R' : usdOn(false) ? fmtU(usdT(t,r), isEst(t)) : '';
  return '<span class="badge '+(o.w?'w':o.l?'l':'')+'">'+esc(t.a)+'</span>'+
    '<span class="tmain"><span class="t1"><span class="tt">'+esc(t.idea||t.dir||'Trade')+'</span>'+(o.tag?'<em class="ftag '+f+'">'+(E?'EOW':'Journal')+'</em>':'')+'</span>'+
    '<span class="t2">'+esc([when, t.dir, NEWS_S[t.news]||t.news].filter(Boolean).join(' · '))+'</span></span>'+
    '<span class="tres"><b class="'+(t.raw._pending?'mut':sgn(r))+'">'+fmtRc(r, E?0:2)+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</span>'+ic('chev',16,2);
}
function trow(t, m, noDate) {
  return '<button type="button" class="trow'+(t.raw._pending?' pend':'')+(isFlash(t)?' new" style="animation-delay:-'+Math.round(performance.now()-S.flashT)+'ms':'')+'" data-row="'+(t.row||'')+'">'+
    tline(t, S.file, { r:m.rOf(t), w:m.isWin(t), l:m.isLoss(t), date:!noDate })+'</button>';
}
function renderList() {
  const el=$('v-list'); if (!S.loaded) { el.innerHTML=skeleton(); return; }
  const rv = S.file==='EOW' && (revDue() || S.revJust);
  if (rv && !S.revAll) { renderReview(); return; }
  const m=curModel(), E=S.type==='EOW', base=filtered(m);
  let ts=base.slice().reverse();
  if (S.lo) ts=ts.filter(t=> S.lo==='Win'?m.isWin(t): S.lo==='Loss'?m.isLoss(t): !m.isWin(t)&&!m.isLoss(t));
  const oo=[{v:'',l:'Tutti'},{v:'Win',l:'Vinti'},{v:'Loss',l:'Persi'}]; if (!E) oo.push({v:'BE',l:'Pareggio'});
  let html='<div class="stat-h rise"><div><h1>'+words('Trade')+'</h1></div><span class="mut num">'+ts.length+' su '+S.rows.length+'</span></div>'+fbar(20);
  if (rv && revDue()) html+='<button type="button" class="card rv-back rise" data-act="rvback">'+ic('cal',18,2)+'<span><b>Revisione della settimana in corso</b><em>'+(revState().ES.length+revState().NQ.length)+' / 10 giorni</em></span>'+ic('chev',16,2)+'</button>';
  html+='<div class="toolbar rise" style="--d:40ms" data-lf="1">'+oo.map(o=>'<button type="button" class="chip'+(S.lo===o.v?' on':'')+'" data-k="lo" data-v="'+o.v+'">'+o.l+'</button>').join('')+'</div>';
  if (!ts.length) html+=emptyState('Nessun trade', S.rows.length?'Nessun trade con questi filtri.':'Il foglio '+S.file+' è vuoto: inserisci il primo trade.', S.rows.length?null:'Nuovo trade');
  const shown=ts.slice(0,S.lmore); let day='', grp=[], i=0;
  const flush=()=>{ if (!grp.length) return; const R=grp.reduce((s,t)=>s+m.rOf(t),0), d=grp[0].d;
    html+='<div class="rise dayg" style="--d:'+Math.min(60+i*30,400)+'ms"><div class="dayh"><span>'+GIORNI[d.getDay()].replace(/^./,c=>c.toUpperCase())+' '+d.getDate()+' '+MESI_F[d.getMonth()]+(d.getFullYear()!==new Date().getFullYear()?' '+d.getFullYear():'')+'</span>'+(grp.length?'<span class="dtot"><b class="num '+sgn(R)+'">'+fmtRc(R,E?0:2)+'</b>'+(usdOn()&&!E?'<span class="num">'+fmtU(usdSum(grp,m))+'</span>':'')+'</span>':'')+'</div><div class="dayc">'+grp.map(t=>trow(t,m,true)).join('')+'</div></div>'; grp=[]; i++; };
  shown.forEach(t=>{ const k=t.d.toDateString(); if (k!==day) { flush(); day=k; } grp.push(t); }); flush();
  if (ts.length>S.lmore) html+='<button type="button" class="btn sec more" data-act="more">Mostra altri '+Math.min(60,ts.length-S.lmore)+'</button>';
  enter(el, html);
}


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['pagine.js'] = '2026-10-29.1';

// Edgebook · scheda.js — scheda del trade (nuovo / modifica), apertura e chiusura delle schede, eventi, avvio dell'app (boot).
// I file JS sono script classici caricati in ordine da index.html e condividono le stesse variabili globali:
// l'ordine conta (core.js → home.js → pagine.js → analisi.js → simula.js → scheda.js).
// ───────────────────────── SCHEDA: nuovo / modifica trade ─────────────────────────
function openForm(row, pre) {
  S.sheet='form'; S.edit=null;
  if (row) {
    const r=S.rows.find(x=>x._row===row); if (!r) return; const E=S.type==='EOW', p=String(r.Data).split('/');
    S.f = { Asset:r.Asset, Data:p[2]+'-'+p[1]+'-'+p[0], Ora:String(r.Ora).slice(0,5).padStart(5,'0'), Idea:r['5m Idea'], News:r.News,
            LVN:r['Coming from LVN'], SMT:r.SMT, clean: r['1m Clean STR']===true||r['1m Clean STR']==='TRUE', dd:num(r['SL DD']), maxrr:num(r['Max Real RR']),
            Dir:r.Direzione||'', Esecuzione:r.Esecuzione||'', Errori:splitL(r.Errori), L5:r['5m Link']||'', L1:r['1m Link']||'', Note:r.Note||'' };
    if (E) { S.f.sl=num(r['SL Points']); S.f.PB=String(r['Candele PB']??''); S.f.CC2=/^s[iì]$/i.test(String(r['2° CC']||'').trim())?'Si':'No';
      const o=mins(r.Ora); for (let k=1;k<=5;k++){ const hm=mins(r['Holding time '+k+'rr']); if (isFinite(hm)&&isFinite(o)) S.f['t'+k]=hhmm(o+holdBack(hm)).padStart(5,'0'); } }
    else { S.f.sl=num(r.SL); S.f.rr=num(r.RR); S.f.TP=r.TP; S.f.pnl=num(r['PnL $']); const hm=mins(r['Holding time']), o=mins(r.Ora); if (isFinite(hm) && isFinite(o)) S.f.Uscita=hhmm(o+holdBack(hm)).padStart(5,'0'); }
    ['sl','dd','maxrr','rr','pnl'].forEach(k=>{ S.f[k] = isFinite(S.f[k]) ? String(S.f[k]).replace('.',',') : ''; });
    S.edit = { row, check:{ Asset:r.Asset, Data:r.Data, Ora:String(r.Ora).slice(0,5) } };
  } else {
    const last=all().slice(-1)[0];
    S.f = { Data: iso(new Date()), Asset: last?last.a:'ES', clean:true, Errori:[] };
    if (pre) Object.keys(pre).forEach(k=>{ if (pre[k]!==undefined) S.f[k]=pre[k]; });
    S.f._newsAuto=true;   // trade nuovo: la news si compila dal calendario finché non la scegli tu
  }
  S.f.cleanS = S.f.clean ? 'Sì' : 'No'; S.touched={}; S.tried=false;
  $('sh-sub').textContent = S.file+(S.edit?' · riga '+S.edit.row:pre?' · revisione '+S.f.Asset:''); $('sh-title').innerHTML = words(S.edit ? 'Modifica trade' : 'Nuovo trade');
  renderForm(); openSheet(); formNewsAuto();
}
const fin = (k, type, ph, extra) => '<input class="inp" id="fi-'+k+'" data-k="'+k+'" type="'+type+'" placeholder="'+esc(ph||'')+'" value="'+esc(S.f[k]??'')+'" '+(extra||'')+'>';
const ferr = k => '<div class="ferr" id="err-'+k+'"></div>';
const fld = (k, lbl, inner) => '<div class="field" data-f="'+k+'">'+lbl+inner+ferr(k)+'</div>';
const flbl = (k, t) => '<label for="fi-'+k+'">'+t+'</label>', fspan = t => '<span class="flabel">'+t+'</span>';
const fnum = (k, lbl, ph) => fld(k, flbl(k,lbl), fin(k,'text',ph||'',"inputmode='decimal' autocomplete='off' enterkeyhint='next'"));
const stagger = () => $('sh-body').querySelectorAll('.fsec').forEach((el,i)=>el.style.setProperty('--k', i));
const linksNote = (f, ph) => fld('L5',flbl('L5','Screenshot 5m · link TradingView (facoltativo)'),fin('L5','url','https://www.tradingview.com/x/…'))+
  fld('L1',flbl('L1','Screenshot 1m · link TradingView (facoltativo)'),fin('L1','url','https://www.tradingview.com/x/…'))+'<div class="thumbs" id="fx-th"></div>'+
  '<div class="field"><label for="fi-Note">Note (facoltative)</label><textarea class="inp" id="fi-Note" data-k="Note" placeholder="'+esc(ph)+'">'+esc(f.Note||'')+'</textarea></div>';
// news del trade nuovo dal calendario della sua data (Red se c'è un evento USD ad alto impatto, Orange se medio):
// si aggiorna se cambi la data e si ferma appena scegli tu la news; le settimane passate arrivano dall'archivio dello script
function formNewsAuto() {
  const f=S.f; if (S.sheet!=='form' || S.edit || !f._newsAuto || !f.Data) return;
  const c=newsCatOf(f.Data), wait=!c && weekOf(f.Data)<weekOf(todayIso());
  if (wait) revNewsLoad(weekOf(f.Data));   // settimana passata non ancora in memoria: la chiede allo script
  f.News=c;   // finché non si sa resta vuota: meglio sceglierla che salvare quella di un altro giorno
  const sg=document.querySelector('#sh-body [data-seg="News"]'); if (sg) setSeg(sg, c);
  const l=document.querySelector('#sh-body [data-f="News"] .flabel'); if (l) l.textContent=c ? 'News · dal calendario' : wait ? 'News · carico il calendario…' : 'News';
  if (typeof refresh==='function' && sg) refresh();
}
function renderForm() {
  const E=S.type==='EOW', f=S.f;
  let h='<div class="fsec"><div class="fsec-h"><div class="h2">Trade</div></div>'+fld('Asset','',seg('Asset',L.asset,f.Asset))+
    (hasCol('Direzione')?fld('Dir',fspan('Direzione'),seg('Dir',L.dir,f.Dir)):'')+
    '<div class="g2">'+fld('Data',flbl('Data','Data'),fin('Data','date'))+fld('Ora',flbl('Ora','Ora di ingresso'),fin('Ora','time'))+'</div></div>';
  h+='<div class="fsec"><div class="fsec-h"><div class="h2">Esecuzione</div></div><div class="g2">'+fnum('sl','SL (punti)','es. 6,25')+fnum('dd','SL DD (punti)','0 se mai contro')+'</div>'+
    '<div class="g2">'+fnum('maxrr','Max Real RR','es. 2,4')+(E?'<div></div>':fnum('rr','RR del trade','es. 1,8 o −1'))+'</div>'+
    (E?'':fld('Uscita',flbl('Uscita','Ora di uscita'),'<div class="lv x">'+fin('Uscita','time')+'<button type="button" class="mini" data-now="Uscita">'+ic('clock',15,2)+'Adesso</button><div class="hold" id="hold-x"></div></div>'))+'</div>';
  h+='<div class="fsec"><div class="fsec-h"><div class="h2">Anteprima</div><span id="fx-out"></span></div><div class="ruler" id="fx-ruler"></div><div class="calc" id="fx-calc"></div><div class="warns" id="fx-warn"></div></div>';
  h+='<div class="fsec"><div class="fsec-h"><div class="h2">Contesto</div></div>'+
    fld('Idea',fspan('Idea 5m'),chips('Idea',L.idea,f.Idea))+
    fld('News',fspan(f._newsAuto&&f.News?'News · dal calendario':'News'),seg('News',[{v:'No News Day',l:'Nessuna'},{v:'Orange News',l:'Orange'},{v:'Red News',l:'Red'}],f.News))+
    '<div class="g2">'+fld('LVN',fspan('Coming from LVN'),seg('LVN',[{v:'Si',l:'Sì'},'No'],f.LVN))+fld('cleanS',fspan('1m clean'),seg('cleanS',['Sì','No'],f.cleanS))+'</div>'+
    fld('SMT',fspan('SMT'),seg('SMT',[{v:'SMT a favore',l:'A favore'},{v:'SMT a sfavore',l:'A sfavore'},{v:'No SMT',l:'Nessuna'}],f.SMT))+'</div>';
  if (E) {
    h+='<div class="fsec"><div class="fsec-h"><div class="h2">Livelli raggiunti</div><span class="mut" style="font-size:12.5px">ora in cui li hai toccati</span></div><div id="fx-lv" style="display:flex;flex-direction:column;gap:12px"></div></div>';
    h+='<div class="fsec"><div class="fsec-h"><div class="h2">Dettagli</div></div>'+fld('PB',fspan('Candele di pullback'),chips('PB',L.pb,f.PB))+
      (hasCol('2° CC')?fld('CC2',fspan('2° CC'),seg('CC2',[{v:'Si',l:'Sì'},'No'],f.CC2||'No')):'')+
      linksNote(f, 'Es. raggiunge 2,4R, torna a 1,5R, poi 4R')+'</div>';
  } else {
    h+='<div class="fsec"><div class="fsec-h"><div class="h2">Uscita</div></div><div id="fx-tp"></div>'+
      fld('pnl',flbl('pnl','PnL su un conto ($) · facoltativo'),fin('pnl','text','es. 410 · vuoto = RR × rischio',"inputmode='decimal' autocomplete='off'")+'<div class="hint" id="pnl-x"></div>')+'</div>';
    if (hasCol('Esecuzione')) h+='<div class="fsec"><div class="fsec-h"><div class="h2">Disciplina</div></div>'+fld('Esecuzione',fspan('Come hai eseguito il trade?'),seg('Esecuzione',L.exe,f.Esecuzione))+
      '<div id="fx-errs"'+(f.Esecuzione==='Errore'?'':' hidden')+'>'+fld('Errori',fspan('Errori · anche più di uno'),chips('Errori',L.errs,f.Errori||[],true))+'</div>'+
      '</div>';
    h+='<div class="fsec"><div class="fsec-h"><div class="h2">Dettagli</div></div>'+linksNote(f, 'Es. Trade valido, poco volume però.')+'</div>';
  }
  $('sh-body').innerHTML=h; stagger(); S._k={}; refresh();
  $('sh-foot').innerHTML=(S.edit?'<button type="button" class="btn danger" id="fx-del" data-act="del" aria-label="Elimina trade">'+ic('trash',18,2)+'</button>':'')+'<div class="out" id="fx-sum"></div><button type="button" class="btn" id="fx-save" data-act="save">'+ic('check',18,2.2)+(S.edit?'Salva<span class="xs-hide"> modifiche</span>':'Salva')+'</button>';
  refresh();
}
// holding dei livelli: i minuti si contano dalla candela dopo l'ingresso (15:40 → 15:44 = 3 min),
// ma un livello toccato nella candela subito dopo vale 1 min (15:40 → 15:41 = 1 min)
const holdMin = d => d<=1 ? d : d-1;
const holdBack = h => h>=1 ? h+1 : h;   // inverso, per ricostruire l'orario quando modifichi un trade
// PnL scritto nel modulo: senza segno prende quello del trade (in perdita è negativo), così basta scrivere 210
function pnlVal(v, rr) { if (empty(v) || !isNumStr(v)) return NaN; let x=numS(v); if (!/[-−]/.test(v) && rr<0) x=-Math.abs(x); return x; }
function compute() {
  const f=S.f, E=S.type==='EOW', w=[];
  const sl=numS(f.sl), dd=numS(f.dd), max=numS(f.maxrr), rr=numS(f.rr);
  const best = isFinite(max) ? Math.min(5, Math.floor(max+1e-9)) : NaN;
  const bestLbl = isFinite(best) ? (best<1?'<1rr':best+'rr') : '';
  let out='';
  if (E) out = isFinite(max) ? (max>=2?'Win':'Loss') : '';
  else out = isFinite(rr) ? (rr>0?'Win':rr<0?'Loss':'BE') : '';
  const o=mins(f.Ora), h={};
  if (E) { for (let k=1;k<=5;k++){ const t=mins(f['t'+k]); if (k<=best && isFinite(t) && isFinite(o) && t>=o) h[k]=hhmm(holdMin(t-o)); } }
  const ox=mins(f.Uscita), hold = !E && isFinite(o) && isFinite(ox) && ox>o ? hhmm(holdMin(ox-o)) : '';
  { const x=sessOf(f.Data); if (isFinite(o) && (o<x[0] || o>x[1])) w.push('Ora fuori dalla sessione '+sessTxt(f.Data)+(nyShift(f.Data)?' (quel giorno Wall Street apre alle '+nyOpenIt(f.Data)+')':'')+'.'); }
  if (E && out==='Win' && isFinite(dd) && isFinite(sl) && dd>=sl) w.push('SL DD ≥ SL ma l\'esito è Win: controlla.');
  if (!E) { const pv=pnlVal(f.pnl, rr); if (isFinite(pv) && isFinite(rr) && ((rr>0 && pv<0) || (rr<0 && pv>0))) w.push('PnL e RR hanno segno diverso: controlla.'); }
  const dup = S.rows.find(r => r.Asset===f.Asset && r.Data===fmtIt(f.Data) && String(r.Ora).slice(0,5)===String(f.Ora||'').slice(0,5) && (!S.edit || r._row!==S.edit.row));
  if (dup) w.push('Esiste già un trade '+f.Asset+' con stessa data e ora (riga '+dup._row+').');
  return { sl, dd, max, rr, best, bestLbl, out, h, hold, warn:w };
}
// controlli del modulo: elenco {k: campo, m: messaggio, fmt: errore di formato (mostrato subito)}
function validate(c) {
  const f=S.f, E=S.type==='EOW', e=[], has=k=>e.some(x=>x.k===k), add=(k,m,fmt)=>e.push({k,m,fmt:!!fmt});
  const numF = (k, what, min, minMsg, max) => { const v=f[k];
    if (empty(v)) return add(k, 'Inserisci '+what+'.');
    if (!isNumStr(v)) return add(k, /[a-z]/i.test(v) ? 'Qui vanno solo numeri: hai scritto delle lettere. Esempio: 6 o 6,25.' : 'Numero non valido: usa solo cifre e una virgola, es. 6,25.', true);
    const x=numS(v); if (x<min || (min===0 && k==='sl' && x===0)) return add(k, minMsg, true); if (x>max) add(k, 'Valore troppo alto ('+fmtN(x,2)+'): controlla.', true); };
  if (!f.Asset) add('Asset','Scegli ES o NQ.');
  if (hasCol('Direzione') && !f.Dir) add('Dir','Scegli Long o Short.');
  if (empty(f.Data)) add('Data','Inserisci la data del trade.'); else if (new Date(f.Data+'T00:00') > new Date()) add('Data','La data è nel futuro: controlla.', true);
  if (empty(f.Ora)) add('Ora','Inserisci l\'ora di ingresso.');
  numF('sl','lo SL in punti',0,'Lo SL deve essere maggiore di 0.',500);
  numF('dd','lo SL DD in punti (0 se il prezzo non è mai andato contro)',0,'Lo SL DD non può essere negativo.',500);
  numF('maxrr','il Max Real RR',0,'Il Max Real RR non può essere negativo.',50);
  if (!E) {
    numF('rr','l\'RR del trade',-5,'RR troppo basso: controlla.',50);
    if (!has('rr') && isFinite(c.rr) && isFinite(c.max) && c.rr>c.max+1e-9) add('rr','L\'RR non può superare il Max Real RR ('+fmtN(c.max,2)+').', true);
    if (!empty(f.pnl) && !isNumStr(String(f.pnl).replace('$','').trim())) add('pnl','Scrivi solo il numero in dollari, es. 410 o 205,50.', true);
    else if (Math.abs(pnlVal(f.pnl, numS(f.rr)))>100000) add('pnl','PnL troppo alto: controlla.', true);
    if (empty(f.Uscita)) add('Uscita','Inserisci l\'ora di uscita (oppure tocca Adesso).');
    else if (isFinite(mins(f.Ora)) && mins(f.Uscita)<=mins(f.Ora)) add('Uscita','L\'uscita deve essere dopo l\'ingresso ('+f.Ora+').', true);
  }
  if (!f.Idea) add('Idea','Scegli l\'idea 5m.');
  if (!f.News) add('News','Scegli il tipo di news del giorno.');
  if (!f.LVN) add('LVN','Indica se arriva da un LVN.');
  if (!f.cleanS) add('cleanS','Indica se la struttura 1m è pulita.');
  if (!f.SMT) add('SMT','Scegli la SMT.');
  if (E) {
    let prev=mins(f.Ora);
    for (let k=1; k<=(isFinite(c.best)?c.best:0); k++) { const v=f['t'+k];
      if (empty(v)) { add('t'+k,'Inserisci l\'ora in cui hai toccato '+k+'R (oppure tocca Adesso).'); continue; }
      const t=mins(v); if (isFinite(prev) && t<prev) add('t'+k, k===1 ? 'È prima dell\'ora di ingresso ('+f.Ora+').' : 'È prima dell\'ora di '+(k-1)+'R.', true); prev=t; }
    if (!f.PB) add('PB','Scegli quante candele di pullback.');
  } else {
    if (c.rr>0 && !f.TP) add('TP','Scegli il TP che avevi impostato.');
    if (hasCol('Esecuzione')) { if (!f.Esecuzione) add('Esecuzione','Indica se il trade è valido o se hai commesso un errore.');
      else if (f.Esecuzione==='Errore' && !(f.Errori||[]).length) add('Errori','Scegli almeno un errore.'); }
  }
  ['L5','L1'].forEach(k=>{ if (!empty(f[k]) && !/tradingview\.com\/x\/[A-Za-z0-9]+/.test(f[k])) add(k,'Non è un link di TradingView: deve essere tipo https://www.tradingview.com/x/AbC123/.', true); });
  return e;
}
function showErrors(errs) {
  $('sh-body').querySelectorAll('[data-f]').forEach(el=>{ const k=el.dataset.f, x=errs.find(e=>e.k===k), on = !!x && (S.tried || S.touched[k] || x.fmt);
    el.classList.toggle('bad', on); const m=el.querySelector('.ferr'); if (m) m.innerHTML = on ? ic('alert',15,2)+'<span>'+esc(x.m)+'</span>' : ''; });
}
function rulerSVG(c, E) {
  const el=$('fx-ruler'), W=el.clientWidth||300, H=58, pad=14;
  const ddR = isFinite(c.dd)&&c.sl>0 ? c.dd/c.sl : NaN, lo=-Math.max(1, Math.min(2, isFinite(ddR)?Math.ceil(ddR*2)/2:1)), hi=Math.max(E?5:3, Math.min(8, Math.ceil(isFinite(c.max)?c.max:0)));
  const x=v=>pad+(v-lo)*(W-2*pad)/(hi-lo), yb=24;
  let g='<line class="rk" x1="'+pad+'" x2="'+(W-pad)+'" y1="'+yb+'" y2="'+yb+'" stroke-width="6" stroke-linecap="round"/>';
  if (isFinite(ddR)) g+='<rect class="dd" x="'+x(-Math.min(ddR,-lo))+'" y="'+(yb-3)+'" width="'+(x(0)-x(-Math.min(ddR,-lo)))+'" height="6" rx="3"/>';
  if (isFinite(c.max)) g+='<rect class="mx" x="'+x(0)+'" y="'+(yb-3)+'" width="'+(x(Math.min(c.max,hi))-x(0))+'" height="6" rx="3"/>';
  for (let v=Math.ceil(lo); v<=hi; v++) g+='<text x="'+x(v)+'" y="'+(yb+22)+'" text-anchor="middle">'+(v===0?'0':(v>0?v:'−'+(-v))+'R')+'</text>';
  g+='<line class="zero" x1="'+x(0)+'" x2="'+x(0)+'" y1="'+(yb-10)+'" y2="'+(yb+10)+'"/>';
  if (E) g+='<line class="tg" x1="'+x(2)+'" x2="'+x(2)+'" y1="'+(yb-12)+'" y2="'+(yb+10)+'"/><text x="'+x(2)+'" y="'+(yb-15)+'" text-anchor="middle">target</text>';
  if (!E && isFinite(c.rr)) g+='<circle class="ex" cx="'+x(Math.max(lo,Math.min(hi,c.rr)))+'" cy="'+yb+'" r="6"/><text x="'+x(Math.max(lo,Math.min(hi,c.rr)))+'" y="'+(yb-12)+'" text-anchor="middle">uscita</text>';
  el.innerHTML='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Percorso del trade in R: drawdown in rosso, massimo favorevole in verde">'+g+'</svg>';
}
function refresh() {
  if (S.sheet!=='form' || !$('fx-calc')) return;
  const E=S.type==='EOW', f=S.f, c=compute();
  const cv=(v,l)=>'<div class="cv"><b>'+v+'</b><span>'+l+'</span></div>';
  const ddR = isFinite(c.dd)&&c.sl>0 ? fmtN(c.dd/c.sl,2)+' R' : '–';
  $('fx-calc').innerHTML = cv(isFinite(c.sl)&&c.sl>0?fmtN(c.sl,2):'–','SL · punti')+cv(isFinite(c.dd)?fmtN(c.dd,2):'–','SL DD · punti')+
    (E ? cv(ddR,'SL DD in R')+cv(isFinite(c.max)?fmtN(c.max,2):'–','Max Real RR')+cv(c.bestLbl||'–','Best Real RR')+cv(c.h[2]||'–','Tempo a 2R')
       : cv(isFinite(c.max)?fmtN(c.max,2):'–','Max Real RR')+cv(isFinite(c.rr)?fmtN(c.rr,2,true):'–','RR del trade')+cv(c.bestLbl||'–','Best Real RR')+cv(c.hold||'–','Holding time'));
  const oc = c.out==='Win'?'pos':c.out==='Loss'?'neg':'';
  $('fx-out').innerHTML = c.out ? '<span class="delta '+(c.out==='Win'?'up':c.out==='Loss'?'down':'flat')+'">'+ic(c.out==='Win'?'check':c.out==='Loss'?'x':'clock',14,2.4)+c.out+'</span>' : '';
  rulerSVG(c,E);
  $('fx-warn').innerHTML = c.warn.map(x=>'<div class="warn">'+ic('alert',17,2)+'<span>'+esc(x)+'</span></div>').join('');
  const sum=$('fx-sum'), errs=validate(c), nErr=errs.length;
  if (sum && S.tried && nErr) sum.innerHTML = '<b class="neg">'+(nErr===1?'1 campo da sistemare':nErr+' campi da sistemare')+'</b><span>Sono segnati in rosso</span>';
  else if (sum) sum.innerHTML = c.out ? '<b class="'+oc+'">'+(E?(c.out==='Win'?'Win · 2R':'Loss'):(c.out+' · '+fmtN(c.rr,2,true)+' R'))+'</b><span>'+(isFinite(c.max)?'max '+fmtN(c.max,2)+' R':'')+(isFinite(c.sl)&&c.sl>0?' · SL '+fmtN(c.sl,2)+' pt':'')+'</span>'
                                 : '<b class="mut">Da completare</b><span>'+(E?'SL e Max Real RR':'SL, Max Real RR e RR')+'</span>';
  // sezioni che dipendono dai calcoli: ridisegnate solo quando cambia ciò che mostrano
  const tk=(f.L5||'')+'|'+(f.L1||''); if (S._k.th!==tk) { S._k.th=tk; $('fx-th').innerHTML=['L5','L1'].map(k=>tvImg(f[k])).filter(Boolean).map((u,i)=>'<button type="button" class="th" data-lb="'+i+'"><img src="'+u+'" alt="Screenshot TradingView" loading="lazy"><span>'+lbList(f)[i].t+'</span></button>').join(''); }
  if (E) { const key=String(isFinite(c.best)?c.best:-1); if (S._k.lv!==key) { S._k.lv=key; renderLevels(c); } else updateHolds(c); }
  else { const px=$('pnl-x'); if (px) { const pv=pnlVal(String(f.pnl||'').replace('$','').trim(), c.rr), d0=f.Data?pdIso(f.Data):new Date(), n=nAcc(d0), k=riskUsd();
      px.innerHTML = isFinite(pv) ? '<b class="'+sgn(pv)+'">'+fmtU(pv)+'</b> su un conto'+(n>1?' · <b class="'+sgn(pv)+'">'+fmtU(pv*n)+'</b> sui '+n+' conti':'')+(isFinite(c.rr)&&Math.abs(c.rr)>=0.5?' · rischio reale ≈ '+usd(Math.abs(pv/c.rr)):'')
        : k && isFinite(c.rr) ? 'Se lo lasci vuoto: '+fmtU(c.rr*k)+' ('+fmtN(c.rr,2,true)+' R × '+usd(k)+')'+(n>1?' × '+n+' conti':'') : 'Imposta il rischio per trade nelle Impostazioni per avere una stima quando è vuoto.'; }
    updateHolds(c); const key=String(c.rr>0); if (S._k.tp!==key) { S._k.tp=key; $('fx-tp').innerHTML = c.rr>0 ? fld('TP',fspan('TP · target scelto'),chips('TP',L.tp,f.TP)) : '<div class="mut" style="font-size:13px">Il TP si sceglie quando il trade è in profitto.</div>'; } }
  showErrors(errs);
}
function renderLevels(c) {
  const n=isFinite(c.best)?c.best:0;
  if (!n) { $('fx-lv').innerHTML='<div class="mut" style="font-size:13.5px">Compaiono qui quando il trade raggiunge almeno 1R.</div>'; return; }
  let h=''; for (let k=1;k<=n;k++) h+=fld('t'+k,'','<div class="lv"><b>'+k+'R</b>'+fin('t'+k,'time')+'<button type="button" class="mini" data-now="t'+k+'">'+ic('clock',15,2)+'Adesso</button><div class="hold" id="hold-'+k+'">'+(c.h[k]?'dopo '+c.h[k]:'')+'</div></div>');
  $('fx-lv').innerHTML=h;
}
function updateHolds(c) { const x=$('hold-x'); if (x) x.textContent = c.hold ? 'holding '+c.hold : '';
  for (let k=1;k<=5;k++) { const e=$('hold-'+k); if (e) e.textContent = c.h[k] ? 'dopo '+c.h[k] : ''; } }
function lbList(f) { return [['L5','5 minuti'],['L1','1 minuto']].filter(([k])=>tvImg(f[k])).map(([k,t])=>({u:tvImg(f[k]),l:f[k],t})); }
// visualizzatore a schermo intero: pizzica/rotella per lo zoom, trascina per spostare, doppio tocco per ingrandire
const LB={list:[],i:0,s:1,x:0,y:0,fit:1,pts:new Map(),last:null,tap:0,moved:false};
function lbEl() { let el=$('lb'); if (el) return el;
  el=document.createElement('div'); el.id='lb'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.innerHTML='<div class="lb-top"><button type="button" class="lb-b" data-lbx="prev" aria-label="Precedente">'+ic('chev',16,2.4).replace('<svg','<svg style="transform:rotate(180deg)"')+'</button><b id="lb-t"></b>'+
    '<button type="button" class="lb-b" data-lbx="next" aria-label="Successivo">'+ic('chev',16,2.4)+'</button><a class="lb-b" id="lb-o" target="_blank" rel="noopener">TradingView</a>'+
    '<button type="button" class="lb-b" data-lbx="close" aria-label="Chiudi">'+ic('x',18,2.4)+'</button></div><div class="lb-v" id="lb-v"><img id="lb-i" alt="Screenshot TradingView" draggable="false"></div>'+
    '<div class="lb-hint" id="lb-h"></div>';
  document.body.appendChild(el);
  el.addEventListener('click', e => { const b=e.target.closest('[data-lbx]'); if (!b) return; const a=b.dataset.lbx; if (a==='close') lbClose(); else lbShow(LB.i+(a==='next'?1:-1)); });
  const v=$('lb-v'), img=$('lb-i');
  img.addEventListener('load', lbFit);
  v.addEventListener('wheel', e => { e.preventDefault(); lbZoom(LB.s*Math.exp(-e.deltaY*0.0018), e.clientX, e.clientY); }, {passive:false});
  v.addEventListener('pointerdown', e => { v.setPointerCapture(e.pointerId); LB.pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); LB.last=null; LB.moved=false; });
  v.addEventListener('pointermove', e => { if (!LB.pts.has(e.pointerId)) return; const pr=LB.pts.get(e.pointerId); LB.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if (LB.pts.size===2) { const [a,b]=[...LB.pts.values()], d=Math.hypot(a.x-b.x,a.y-b.y), cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
      if (LB.last) { LB.x+=cx-LB.last.cx; LB.y+=cy-LB.last.cy; lbZoom(LB.s*d/LB.last.d, cx, cy); } LB.last={d,cx,cy}; LB.moved=true; }
    else if (LB.pts.size===1) { const dx=e.clientX-pr.x, dy=e.clientY-pr.y; if (Math.abs(dx)+Math.abs(dy)>2) LB.moved=true; if (LB.s>LB.fit*1.01) { LB.x+=dx; LB.y+=dy; lbApply(); } } });
  const up = e => { const was=LB.pts.size; LB.pts.delete(e.pointerId); LB.last=null;
    if (was===1 && !LB.moved) { const now=Date.now(); if (now-LB.tap<320) { LB.tap=0; lbZoom(LB.s>LB.fit*1.05?LB.fit:LB.fit*2.5, e.clientX, e.clientY); } else LB.tap=now; }
    if (LB.s<LB.fit) lbFit(); };
  v.addEventListener('pointerup', up); v.addEventListener('pointercancel', up);
  return el; }
function lbOpen(list,i,from) { if (!list.length) return; LB.list=list; LB.src=from||null; LB.i0=i; LB.from = from && !reduceMotion() ? from.getBoundingClientRect() : null; lbEl(); $('lb').classList.add('on'); lbShow(i); }
function lbShow(i) { const n=LB.list.length; LB.i=(i+n)%n; const it=LB.list[LB.i], img=$('lb-i');
  $('lb-t').textContent=it.t+(n>1?'  ·  '+(LB.i+1)+'/'+n:''); $('lb-o').href=it.l;
  document.querySelectorAll('#lb [data-lbx=prev],#lb [data-lbx=next]').forEach(b=>b.hidden=n<2);
  $('lb-h').textContent=matchMedia('(hover:hover)').matches?'Rotella per lo zoom · trascina per spostare · doppio clic per ingrandire · Esc per chiudere':'Pizzica per lo zoom · trascina per spostare · doppio tocco per ingrandire';
  img.style.opacity='0'; img.src=it.u; if (img.complete && img.naturalWidth) lbFit(); }
function lbFit() { const v=$('lb-v'), img=$('lb-i'); if (!img.naturalWidth) return; const W=v.clientWidth, H=v.clientHeight;
  LB.fit=Math.min(W/img.naturalWidth, H/img.naturalHeight); LB.s=LB.fit; LB.x=(W-img.naturalWidth*LB.s)/2; LB.y=(H-img.naturalHeight*LB.s)/2;
  const r=LB.from; LB.from=null;
  if (r && r.width) { const vr=v.getBoundingClientRect(), s0=r.width/img.naturalWidth; img.style.transition='none';
    img.style.transform='translate('+(r.left-vr.left)+'px,'+(r.top-vr.top+(r.height-img.naturalHeight*s0)/2)+'px) scale('+s0+')'; img.style.opacity='1'; void img.offsetWidth;
    img.style.transition='transform 480ms var(--e-drawer)'; lbApply(); clearTimeout(LB.tt); LB.tt=setTimeout(()=>{ img.style.transition=''; }, 500); return; }
  lbApply(); img.style.opacity='1'; }
function lbZoom(ns,cx,cy) { if (!$('lb-i').naturalWidth) return; const r=$('lb-v').getBoundingClientRect(); ns=Math.max(LB.fit*0.9, Math.min(LB.fit*8, ns)); const px=cx-r.left, py=cy-r.top;
  LB.x=px-(px-LB.x)*ns/LB.s; LB.y=py-(py-LB.y)*ns/LB.s; LB.s=ns; lbApply(); }
function lbApply() { const img=$('lb-i'), v=$('lb-v'); const W=v.clientWidth, H=v.clientHeight, w=img.naturalWidth*LB.s, h=img.naturalHeight*LB.s;
  LB.x = w<=W ? (W-w)/2 : Math.min(0, Math.max(W-w, LB.x)); LB.y = h<=H ? (H-h)/2 : Math.min(0, Math.max(H-h, LB.y));
  img.style.transform='translate('+LB.x+'px,'+LB.y+'px) scale('+LB.s+')'; v.classList.toggle('z', LB.s>LB.fit*1.01); }
function lbClose() { const el=$('lb'); if (!el) return; LB.pts.clear(); const img=$('lb-i'), src=LB.src;
  if (src && src.isConnected && LB.i===LB.i0 && img.naturalWidth && !reduceMotion()) { const r=src.getBoundingClientRect(), vr=$('lb-v').getBoundingClientRect(), s0=r.width/img.naturalWidth;
    if (r.width && r.bottom>0 && r.top<innerHeight) { img.style.transition='transform 340ms var(--e-drawer)'; img.style.transform='translate('+(r.left-vr.left)+'px,'+(r.top-vr.top+(r.height-img.naturalHeight*s0)/2)+'px) scale('+s0+')';
      clearTimeout(LB.tt); LB.tt=setTimeout(()=>{ img.style.transition=''; }, 360); } }
  el.classList.remove('on'); }
window.addEventListener('resize', () => { const el=$('lb'); if (el && el.classList.contains('on')) lbFit(); });
function tvImg(u) { const m=/tradingview\.com\/x\/([A-Za-z0-9]+)/.exec(u||''); return m ? 'https://s3.tradingview.com/snapshots/'+m[1][0].toLowerCase()+'/'+m[1]+'.png' : null; }
function formClick(b) {
  const sg=b.closest('[data-seg]'), ch=b.closest('[data-chips]');
  if (sg) { const k=sg.dataset.seg, v=b.dataset.v; S.f[k]=v; S.touched[k]=true; setSeg(sg,v); if (k==='News' && S.f._newsAuto) { S.f._newsAuto=false; const l=sg.closest('[data-f]').querySelector('.flabel'); if (l) l.textContent='News'; } if (k==='cleanS') S.f.clean = v==='Sì'; if (k==='Esecuzione') $('fx-errs').hidden = v!=='Errore'; refresh(); return; }
  if (ch && ch.dataset.multi) { const k=ch.dataset.chips, v=b.dataset.v, a=S.f[k]||[]; S.f[k]=a.includes(v)?a.filter(x=>x!==v):[...a,v]; S.touched[k]=true; b.classList.toggle('on'); refresh(); return; }
  if (ch) { const k=ch.dataset.chips, v=b.dataset.v; S.f[k] = S.f[k]===v ? '' : v; S.touched[k]=true; ch.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', c.dataset.v===S.f[k])); refresh(); return; }
  if (b.dataset.now) { const k=b.dataset.now; S.f[k]=nowHM(); S.touched[k]=true; $('fi-'+k).value=S.f[k]; refresh(); }
}
async function save() {
  const f=S.f, c=compute(), E=S.type==='EOW';
  const errs=validate(c);
  if (errs.length) {
    S.tried=true; refresh();
    const first=$('sh-body').querySelector('.field.bad');
    if (first) { first.scrollIntoView({ behavior:'smooth', block:'center' }); first.classList.remove('shake'); void first.offsetWidth; first.classList.add('shake');
      const inp=first.querySelector('input,textarea'); if (inp && !inp.value) setTimeout(()=>inp.focus({ preventScroll:true }), 350); }
    toast(errs.length===1 ? 'Sistema il campo in rosso: '+errs[0].m : errs.length+' campi da sistemare, sono segnati in rosso', true); return;
  }
  const d = { 'Asset':f.Asset, 'Direzione':f.Dir||'', 'Data':f.Data, 'Ora':f.Ora, 'Outcome':c.out, 'EM':EM1, '5m Idea':f.Idea, 'News':f.News||'',
              'Coming from LVN':f.LVN||'', 'SMT':f.SMT||'', 'SL DD':isFinite(c.dd)?c.dd:'', '1m Clean STR':!!f.clean,
              'Best Real RR':c.bestLbl, 'Max Real RR':c.max };
  if (E) { d['SL Points']=c.sl; for (let k=1;k<=5;k++) d['Holding time '+k+'rr']=c.h[k]||''; d['Candele PB']=f.PB||''; if (hasCol('2° CC')) d['2° CC']=f.CC2==='Si'?'Si':''; }
  else { d['SL']=c.sl; d['RR']=c.rr; d['TP']=c.rr>0?(f.TP||''):''; d['Holding time']=c.hold;
    if (hasCol('Esecuzione')) { d['Esecuzione']=f.Esecuzione||''; d['Errori']=f.Esecuzione==='Errore'?(f.Errori||[]).join(', '):''; }
    const pv=pnlVal(String(f.pnl||'').replace('$','').trim(), c.rr); d['PnL $']=isFinite(pv)?pv:''; }
  d['5m Link']=f.L5||''; d['1m Link']=f.L1||''; d['Note']=f.Note||'';
  // la riga compare subito; il foglio viene aggiornato in background
  const file=S.file, edit=S.edit, form=S.f, prov=Object.assign({}, d, { _row: edit?edit.row:null, _pending:true, Data:fmtIt(d.Data) });
  const idx = edit ? S.rows.findIndex(r=>r._row===edit.row) : -1, prev = idx>=0 ? S.rows[idx] : null;
  if (idx>=0) S.rows[idx]=prov; else S.rows.push(prov); touchRows();
  S.flash=prov; S.flashT=performance.now(); closeSheet(); S.edit=null; S.f={}; renderCurrent(true); setSync(true);
  if (c.out==='Win' && !edit) setTimeout(confetti, 260);
  try {
    let res;
    try { res = edit ? await callW('updateTrade', file, edit.row, d, edit.check) : await callW('addTrade', file, d); }
    catch(e) { if (!netErr(e)) throw e; res = await verifySaved(file, d, edit); if (!res) throw e; }
    const D=S.data[file];
    if (D && res.h) D.h=res.h;   // il foglio ha una colonna nuova (PnL $)
    if (D) { const nr=res.row[0], k=D.rows.findIndex(a=>a[0]===nr);
      if (edit || (k>=0 && JSON.stringify(D.rows[k])===JSON.stringify(res.row))) { if (k>=0) D.rows[k]=res.row; else D.rows.push(res.row); }
      else {   // trade più vecchio inserito in mezzo al foglio: i trade da quella riga in giù scendono di uno
        D.rows.forEach(a=>{ if (a[0]>=nr) a[0]++; });
        const j=D.rows.findIndex(a=>a[0]>nr); if (j>=0) D.rows.splice(j,0,res.row); else D.rows.push(res.row);
        if (S.file===file) { S.rows.forEach(r=>{ if (r!==prov && r._row!=null && r._row>=nr) r._row++; }); if (S.edit && S.edit.row>=nr) S.edit.row++; } }
      cacheSet(file,D); }
    if (S.file===file) { const i2=S.rows.indexOf(prov), obj=D?unpack(D.h,res.row):Object.assign({}, prov, { _row:res.row[0], _pending:false });
      if (i2>=0) { S.rows[i2]=obj; touchRows(); } else if (D) { applyData(D); touchRows(); }   // nel frattempo è arrivata una rilettura del foglio
      if (S.flash===prov) S.flash=obj; if (!S.sheet) renderCurrent(true); }
    toast(edit ? 'Modifiche salvate' : 'Trade salvato in '+file);
    if (d['PnL $']!==undefined && d['PnL $']!=='' && !res.h) setTimeout(()=>toast('Il PnL non è stato salvato: aggiorna Code.gs alla versione nuova', true), 2900);
  } catch(e) {
    const i2=S.rows.indexOf(prov); if (i2>=0) { if (prev) S.rows[i2]=prev; else S.rows.splice(i2,1); touchRows(); }
    renderCurrent(true);
    if (S.file===file && !S.sheet) { S.sheet='form'; S.f=form; S.edit=edit; $('sh-title').textContent = edit?'Modifica trade':'Nuovo trade'; renderForm(); openSheet(); }
    toast('Non salvato: '+errTxt(e)+'. Riprova.', true);
  } finally { setSync(false); }
}

// ───────────────────────── scheda: apertura e chiusura ─────────────────────────
function openSheet(panel) { $('sheet').classList.toggle('panel', !!panel);   // «panel»: su PC la scheda è un pannello a destra (non «side», che è la barra laterale)
  $('sheet').classList.add('open'); $('scrim').classList.add('open'); $('fab').classList.add('hide'); $('aifab').classList.add('hide'); document.body.style.overflow='hidden'; $('sh-body').scrollTop=0; }
function closeSheet() { if (S.sheet==='chat') setTimeout(()=>{ if (!S.sheet) { $('sh-body').innerHTML=''; $('sh-foot').innerHTML=''; } }, 520);
  $('sheet').classList.remove('open'); $('scrim').classList.remove('open'); $('fab').classList.toggle('hide', ['mc','coach','news','set'].includes(S.tab)); $('aifab').classList.toggle('hide', S.tab==='coach'); document.body.style.overflow=''; S.sheet=null; }

// ───────────────────────── eventi ─────────────────────────
document.addEventListener('click', e => {
  const b=e.target.closest('button'); if (!b) return;
  S.userT=performance.now();
  if (b.closest('#lb')) return;
  if (b.dataset.lb) { lbOpen(lbList(S.f), +b.dataset.lb, b.querySelector('img')); return; }
  if (b.dataset.act==='pal') { palToggle(true, true); return; }
  if (b.closest('#pal')) { const i=+b.dataset.pi; if (isFinite(i)) palRun(i); return; }
  if (b.dataset.nav) { navTo(b.dataset.nav); return; }
  if (revClick(b)) return;
  if (b.dataset.bar) { if (b.dataset.bar==='more') openMore(); else navTo(b.dataset.bar); return; }
  if (b.closest('#fileSeg')) { switchFile(b.dataset.v); return; }
  if (b.dataset.act==='sbcol') { const c=document.documentElement.classList.toggle('sbc'); store.set('sbc', c?'1':''); setTimeout(moveInd, 60); setTimeout(moveInd, 560); return; }
  if (b.dataset.act==='newsref') { b.disabled=true; loadTrump(true).catch(()=>{}); loadNews(true).then(()=>toast('Calendario aggiornato')).catch(e=>toast('News non disponibili: '+(e.message||e), true)); return; }
  if (b.dataset.chk) { const i=+b.dataset.chk, ck=chkGet(), on=!ck.includes(i), nk=on?[...ck,i]:ck.filter(x=>x!==i); store.set(chkKey(), JSON.stringify(nk)); b.classList.toggle('on', on); b.classList.remove('just'); void b.offsetWidth; b.classList.add('just'); clearTimeout(b._j); b._j=setTimeout(()=>b.classList.remove('just'), 700);
    const c=b.closest('.bchk'), tot=CFG.check.length, done=CFG.check.filter((_,j)=>nk.includes(j)).length; c.querySelector('.chk-bar i').style.width=(100*done/tot)+'%'; $('chk-n').textContent=done+'/'+tot; c.classList.toggle('ok', done===tot);
    c.classList.remove('party'); if (on && done===tot) { void c.offsetWidth; c.classList.add('party'); setTimeout(()=>c.classList.remove('party'), 1600); } return; }
  if (b.dataset.cal) { const [y,mo]=S.calM.split('-').map(Number), d=new Date(y, mo-1+(+b.dataset.cal), 1); S.calM=d.getFullYear()+'-'+p2(d.getMonth()+1); S.calSel=null; renderCurrent(true); return; }
  if (b.dataset.cday) { const k=b.dataset.cday, n=filtered(curModel(),true).filter(t=>iso(t.d)===k).length;
    if (n===1) { calPick(k, false); const t=filtered(curModel(),true).find(t=>iso(t.d)===k); openForm(t.row); return; }   // un solo trade: si apre subito
    calPick(S.calSel===k ? null : k, true); return; }   // più trade: la card entra e la pagina scende fino all'elenco
  if (b.closest('[data-seg="pcfg-view"]')) { CFG.prop.view=b.dataset.v; setSeg(b.closest('[data-seg]'),b.dataset.v); propChanged(); return; }
  if (b.dataset.act==='nacc') { CFG.prop.n=Math.min(50, Math.max(1, nAcc()+(+b.dataset.d))); propChanged(true); return; }
  if (b.dataset.act==='cfgapply') { S.filtBy={ EOW:FILT_DEF('EOW'), Journal:FILT_DEF('Journal') }; S.filt=S.filtBy[S.file]; saveFilt(); toast('Filtri aggiornati'); return; }
  if (b.dataset.act==='cacheclear') { Object.keys(localStorage).filter(k=>/^tj\.(data\.|news)/.test(k)).forEach(k=>localStorage.removeItem(k)); toast('Dati salvati cancellati: ricarico'); setTimeout(()=>location.reload(), 900); return; }
  { const sgc=b.closest('[data-seg]');
    if (sgc && sgc.dataset.seg.indexOf('cfg-')===0) { const k=sgc.dataset.seg.slice(4); CFG[k]=b.dataset.v; setSeg(sgc,b.dataset.v); cfgChanged(k); return; }
    const chc=b.closest('[data-chips="cfg-idea"]');
    if (chc) { b.classList.toggle('on'); CFG.exIdea=L.idea.filter(i=>!chc.querySelector('[data-v="'+i+'"]').classList.contains('on')); saveCfg(); return; } }
  if (b.id==='fab' || b.dataset.act==='new') { if (NOFILE.includes(S.tab)) openNewPick(); else openForm(); return; }
  if (b.dataset.newf) { switchFile(b.dataset.newf); openForm(); return; }
  if (b.dataset.open) { const [f,row]=b.dataset.open.split(':'); if (!(+row>1)) { toast('Il trade si sta ancora salvando: riprova tra un attimo'); return; } switchFile(f); openForm(+row); return; }
  if (b.dataset.bd) { openBd(b); return; }
  if (b.dataset.act==='nsai') { askNewsAI(b); return; }
  if (b.dataset.act==='trretry') { trTry=0; trErr=''; loadTrump(true).catch(()=>{}); renderCurrent(true); return; }
  if (b.dataset.nday) { const el=$('nd-'+b.dataset.nday); if (!el) { toast('Nessuna news di impatto medio o alto quel giorno'); return; } const d=el.closest('details'); if (d) d.open=true;
    const y=el.getBoundingClientRect().top+scrollY-(innerWidth<1000?78:16); window.scrollTo({ top:y, behavior:reduceMotion()?'auto':'smooth' }); return; }
  if (b.id==='sh-close' || b.dataset.act==='close') { closeSheet(); return; }
  if (b.closest('[data-seg=coach-scope]')) { S.coachScope=b.dataset.v; try { sessionStorage.setItem('tj.cscope', S.coachScope); } catch(e) {} renderCoach(); return; }
  if (b.dataset.q) { sendChat(b.dataset.q); return; }
  if (b.dataset.act==='chatclear') { S.chat=[]; saveChat(); renderChat(); return; }
  if (b.id==='aifab') { openChat(); return; }
  if (b.dataset.tabGo) { go(b.dataset.tabGo); return; }
  if (b.dataset.act==='del') { delClick(b); return; }
  if (b.closest('#sh-body')) { if (S.sheet==='form') formClick(b); else if (S.sheet==='filt') filtClick(b); return; }
  if (b.dataset.act==='save') { save(); return; }
  if (b.dataset.act==='freset') { S.filt=FILT_DEF(S.file); saveFilt(); renderFilters(); renderCurrent(true); return; }
  if (b.dataset.rm) { removeFilter(b.dataset.rm); return; }
  if (b.dataset.act==='mc') { go('mc'); return; }
  if (b.dataset.act==='claude') { askClaude(); return; }
  if (b.dataset.act==='mcrun') { runMCClick(); return; }
  if (b.dataset.act==='setup') { showSetup(); return; }
  if (b.dataset.act==='filters') { openFilters(); return; }
  if (b.dataset.act==='more') { S.lmore+=60; renderList(); return; }
  if (b.classList.contains('trow')) { if (b.dataset.row) openForm(+b.dataset.row); return; }
  const sg=b.closest('[data-seg]');
  if (b.closest('[data-seg=dper]')) { S.dper=b.dataset.v; store.set('dper',S.dper); renderCurrent(true); return; }
  if (b.closest('[data-seg=per]')) { setPer(b.dataset.v); renderCurrent(true); return; }
  if (sg && sg.dataset.seg.indexOf('pf-')===0) { const k=sg.dataset.seg.slice(3); S.pf[k]=b.dataset.v; savePF(); if (k==='size'||k==='goal') renderCurrent(true); else setSeg(sg,b.dataset.v); return; }
  if (b.dataset.act==='pfai') { openChat(); sendChat('Commenta il piano che Simula mi consiglia per passare le valutazioni: è sensato per come trado? Cosa cambieresti e perché?'); return; }
  if (b.closest('[data-lf]')) { S[b.dataset.k]=b.dataset.v; S.lmore=60; renderList(); return; }
});
$('sh-body').addEventListener('input', e => {
  const k=e.target.dataset.k, fk=e.target.dataset.fk;
  if (k && S.sheet==='form') { S.f[k]=e.target.value; if (k==='Data') formNewsAuto(); refresh(); }
  if (fk && S.sheet==='filt') { S.cust[fk]=e.target.value; store.set('cust', JSON.stringify(S.cust)); if (S.per!=='c') { setPer('c'); document.querySelectorAll('#sh-body [data-chips=quick] .chip').forEach(c=>c.classList.toggle('on', c.dataset.v==='c')); } renderCurrent(true); filtFoot(); }
});
document.addEventListener('change', e => { const c=e.target.dataset && e.target.dataset.cfg; if (!c) return;
  CFG[c] = c==='check' ? e.target.value.split('\n').map(x=>x.trim()).filter(Boolean) : e.target.value; cfgChanged(c); toast('Impostazione salvata'); });
document.addEventListener('change', e => { const t=e.target, ds=t.dataset||{};
  if (ds.pcfg) { CFG.prop[ds.pcfg]=t.value.trim(); propChanged(); toast('Impostazione salvata'); return; }
});
document.addEventListener('change', e => { const k=e.target.dataset && e.target.dataset.hp; if (!k) return;
  S.cust[k]=e.target.value; store.set('cust', JSON.stringify(S.cust)); renderCurrent(true); });
$('sh-body').addEventListener('focusout', e => { const k=e.target.dataset.k; if (k && S.sheet==='form' && !S.touched[k]) { S.touched[k]=true; refresh(); } });
$('scrim').addEventListener('click', closeSheet);
// scorciatoie (PC): 1–9 pagine della barra laterale, N nuovo trade, F filtri, ⌘K / Ctrl+K palette comandi
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && (e.key==='k' || e.key==='K')) { e.preventDefault(); palToggle(); return; }
  if (PAL.on) return;
  if (e.metaKey || e.ctrlKey || e.altKey || S.sheet || ($('lb') && $('lb').classList.contains('on')) || /INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')) return;
  const items=[...NAV.filter(n=>!n.g), ...NAV_FOOT];
  if (/^[1-9]$/.test(e.key) && items[+e.key-1]) { e.preventDefault(); navTo(navKey(items[+e.key-1]), { instant:true }); }
  else if (e.key==='n' || e.key==='N') { e.preventDefault(); $('fab').click(); }
  else if ((e.key==='f' || e.key==='F') && !NOFILE.includes(S.tab)) { e.preventDefault(); openFilters(); }
});
document.addEventListener('keydown', e => { const lb=$('lb'), on=lb && lb.classList.contains('on');
  if (on) { if (e.key==='Escape') lbClose(); else if (e.key==='ArrowRight') lbShow(LB.i+1); else if (e.key==='ArrowLeft') lbShow(LB.i-1); return; }
  if (e.key==='Escape' && S.sheet) closeSheet(); });
let lastY=0;
window.addEventListener('scroll', () => { const y=window.scrollY; $('top').classList.toggle('scrolled', y>4);
  if (Math.abs(y-lastY)>6) { const dn=y>lastY && y>120; $('fab').classList.toggle('mini', dn); $('aifab').classList.toggle('away', dn); lastY=y; } }, { passive:true });
let lastW=window.innerWidth, rT;
window.addEventListener('resize', () => { clearTimeout(rT); rT=setTimeout(()=>{ if (Math.abs(window.innerWidth-lastW)>20) { lastW=window.innerWidth; if (!S.sheet) renderCurrent(true); } }, 200); });
setInterval(() => { const el=$('sess'); if (el) { const s=sessionInfo(); el.className='sess'+(s.open?' open':''); el.innerHTML='<i></i>'+s.txt; } }, 30000);

S.filtBy=loadFilt(); S.filt=S.filtBy[S.file]; S.pf=loadPF();
try { S.cust=JSON.parse(store.get('cust','{}'))||{}; } catch(e) { S.cust={}; }
(function welcome() {
  const sp=$('splash'); let seen=false; try { seen=sessionStorage.getItem('tj.hi')==='1'; sessionStorage.setItem('tj.hi','1'); } catch(e) {}
  if (seen) { sp.remove(); return; }
  S.introAt=performance.now()+1150;
  sp.innerHTML='<div class="sp-in">'+logo(68)+'<h1>'+words(greeting())+'</h1><p>Preparo i tuoi trade…</p></div>';
  setTimeout(()=>{ sp.classList.add('out'); setTimeout(()=>sp.remove(), 420); }, 1150);
})();
function showSetup(msg) {
  const el=$('setup'); $('setupLogo').innerHTML=logo(52); $('su-url').value=store.get('api',''); $('su-key').value=store.get('key','');
  $('su-err').innerHTML = msg ? ic('alert',15,2)+'<span>'+esc(msg)+'</span>' : ''; el.hidden=false;
}
$('setupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const url=$('su-url').value.trim(), key=$('su-key').value.trim(), err=$('su-err'), b=$('su-go');
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) { err.innerHTML=ic('alert',15,2)+'<span>L\'indirizzo deve essere tipo https://script.google.com/macros/s/…/exec</span>'; return; }
  if (key.length<20) { err.innerHTML=ic('alert',15,2)+'<span>La chiave sembra incompleta: copiala tutta dal log.</span>'; return; }
  store.set('api',url); store.set('key',key); err.innerHTML=''; b.disabled=true; b.innerHTML='<span class="spin"></span>Controllo…';
  try { await call('getTrades', S.file); $('setup').hidden=true; S.data={}; load(); }
  catch(x) { if ($('setup').hidden) showSetup(); $('su-err').innerHTML=ic('alert',15,2)+'<span>'+esc(x.message==='Chiave non valida'?'La chiave non è valida: controllala e riprova.':x.message==='NETWORK'?'Lo script non risponde: apri l\'URL nel browser e controlla che il deployment sia «Chiunque» con il Code.gs nuovo.':'Non riesco a collegarmi: '+x.message)+'</span>'; }
  finally { b.disabled=false; b.textContent='Collega'; }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState==='visible') { checkUpdate(); pullSettings(); loadNews().catch(()=>{}); if (S.tab==='news' || S.tab==='home') renderCurrent(true); } if (document.visibilityState==='visible' && S.loaded && !S.sheet && Date.now()-(fetchedAt[S.file]||0) > FRESH_MS) load(true); });
// avvio: lo chiama index.html (ebStart) dopo aver controllato che tutti i file siano della stessa versione
function boot() {
applyTheme(); if (store.get('sbc','')==='1') document.documentElement.classList.add('sbc');
{ const [t,f]=location.hash.slice(1).split('/'); if (f==='EOW'||f==='Journal') { S.file=f; S.type=f==='EOW'?'EOW':'JOURNAL'; S.filt=S.filtBy[f]; }
  if (VIEWS.includes(t) && t!=='home') { S.tab=t; VIEWS.forEach(v=>{ $('v-'+v).hidden = v!==t; }); } }
{ const b0=Math.max(0,(S.introAt||0)-performance.now()); document.documentElement.style.setProperty('--boot0', Math.round(b0)+'ms'); document.documentElement.classList.add('boot'); setTimeout(()=>document.documentElement.classList.remove('boot'), b0+1600); }
renderChrome();
window.addEventListener('load', moveInd);
setTimeout(checkUpdate, 4000); setTimeout(pullSettings, 1500);
if (!viaScript() && !(store.get('api','') && store.get('key',''))) showSetup(); else { load(); loadNews().then(newsBadge).catch(()=>{}); }
}

// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['scheda.js'] = '2026-10-31.1';

// Edgebook · core.js — costanti, stato, impostazioni, collegamento allo script, utilità, dati normalizzati, grafici, navigazione, filtri.
// I file JS sono script classici caricati in ordine da index.html e condividono le stesse variabili globali:
// l'ordine conta (core.js → home.js → pagine.js → analisi.js → simula.js → scheda.js).
// ───────────────────────── costanti, stato, utilità ─────────────────────────
const L = {
  asset: ['ES','NQ'],
  idea: ['5m BT','5m Momentum Play','5m FTB da BT','5m FTB non da BT','Open Play','Reversal Play'],
  news: ['No News Day','Orange News','Red News'], lvn: ['Si','No'], smt: ['SMT a favore','SMT a sfavore','No SMT'],
  tp: ['Real 1rr','Real 2rr','Real 3rr','Real 4rr','Real 5rr'], pb: ['1','2','3','4','5','6','Altro'],
  bands: [['14:30–15:30',870,930],['15:30–16:00',930,960],['16:00–17:00',960,1020],['17:00–18:00',1020,1080],['18:00–19:00',1080,1140]],
  days: ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì'], dir: ['Long','Short'], exe: ['Trade valido','Errore'],
  errs: ['FOMO','TP spostato','SL spostato','Ingresso anticipato','Uscita anticipata','Size sbagliata','Fuori piano','Altro'],
};
const APP = 'Edgebook';
let updChk=0;
function checkUpdate() {
  if (viaScript() || location.protocol==='file:' || Date.now()-updChk<60000) return; updChk=Date.now();
  fetch(location.pathname+'?u='+Date.now(), { cache:'no-store' }).then(r=>r.ok?r.text():'').then(t=>{
    const m=/const BUILD = '([^']+)'/.exec(t||''); if (!m || m[1]===BUILD || S.sheet==='form') return;   // un trade in scrittura non si interrompe
    try { if (sessionStorage.getItem('tj.upd')===m[1]) return; sessionStorage.setItem('tj.upd', m[1]); } catch(e) {}
    toast('Nuova versione di '+APP+': aggiorno…');
    setTimeout(()=>location.replace(location.pathname+'?v='+encodeURIComponent(m[1])+location.hash), 900);   // indirizzo nuovo: niente copia vecchia in cache
  }).catch(()=>{});
}
const EM1 = '1° EMA';   // unico entry model: sempre scritto così, mai chiesto
const MESI = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const MESI_F = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const GIORNI = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
const store = { get(k,d){ try { const v=localStorage.getItem('tj.'+k); return v===null?d:v; } catch(e){ return d; } }, set(k,v){ try { localStorage.setItem('tj.'+k,v); } catch(e){} } };
let S = { touched:{}, tried:false, file: store.get('file','EOW'), type:'EOW', rows:[], loaded:false, edit:null, f:{}, filt:{}, cust:{}, pf:{}, pfLast:null, tab:'home', per: store.get('per','m'), data:{}, quiet:false,
          lo:'', lmore:60, sheet:null };
S.type = S.file==='EOW' ? 'EOW' : 'JOURNAL';
const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num = v => { if (v===''||v===null||v===undefined) return NaN; return typeof v==='number' ? v : parseFloat(String(v).replace(',','.')); };
const r2 = x => Math.round(x*100)/100;
const isNumStr = v => /^\s*[-−]?\d+(?:[.,]\d+)?\s*$/.test(String(v ?? ''));
const numS = v => isNumStr(v) ? parseFloat(String(v).replace('−','-').replace(',','.')) : NaN;
const empty = v => v===undefined || v===null || String(v).trim()==='';
const mins = s => { if (!s) return NaN; const p=String(s).split(':').map(Number); return p[0]*60+(p[1]||0); };
const hhmm = m => { if (!isFinite(m) || m<0) return ''; m=Math.round(m); return Math.floor(m/60)+':'+String(m%60).padStart(2,'0'); };
const pdate = s => { const p=String(s).split('/'); return p.length===3 ? new Date(+p[2],+p[1]-1,+p[0]) : null; };
const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fmtIt = s => { if (!s) return ''; const p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; };
const bestNum = s => { s=String(s||''); if (s.indexOf('<')===0) return 0; const n=parseInt(s); return isFinite(n)?n:NaN; };
const nowHM = () => { const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
// numeri all'italiana: virgola decimale, segno meno tipografico
function fmtN(x, dec, sign) { if (!isFinite(x)) return '–'; const s=Math.abs(x).toFixed(dec).replace('.',','); return (x<0 && Math.abs(x)>=Math.pow(10,-dec)/2 ? '−' : (sign && x>0 ? '+' : ''))+s; }
const fmtR = (x, dec=1) => fmtN(x, dec, true)+' R';
const pct = x => isFinite(x) ? Math.round(x*100)+'%' : '–';
const sgn = x => x>0 ? 'pos' : x<0 ? 'neg' : '';
// impostazioni dell'utente (pagina Impostazioni), salvate su questo dispositivo
const CFG_DEF = { name:'Gianmarco', theme:'auto', motion:'full', s0:'15:30', s1:'18:30', asset:'ES', plan:'max2', exIdea:['Open Play','Reversal Play'], risk:'', lossR:'2', newsImp:'high', prop:{ view:'tot', n:1 },
  check:['Ho controllato le news di oggi','Ho segnato livelli e LVN su ES e NQ','So quanto rischio su questo trade','Sono riposato e concentrato','Accetto la perdita prima di entrare'] };
let CFG = (()=>{ let c={}; try { c=JSON.parse(localStorage.getItem('tj.cfg')||'{}')||{}; } catch(e) {} return Object.assign({}, CFG_DEF, c); })();
// conti prop in copy trading: conta solo quanti sono (le versioni di prima avevano un elenco di conti con date e payout)
function normProp() { const P=Object.assign({ view:'tot' }, CFG.prop||{});
  if (!(+P.n>=1)) P.n = Array.isArray(P.accts) && P.accts.length ? P.accts.filter(a=>!a.to || a.to>=iso(new Date())).length || 1 : 1;
  CFG.prop={ view:P.view==='one'?'one':'tot', n:Math.min(50, Math.max(1, Math.round(+P.n))) }; }
normProp();
const saveCfg = () => store.set('cfg', JSON.stringify(CFG));
let USER = CFG.name.trim() || 'trader';
let SESS = [mins(CFG.s0), mins(CFG.s1)];   // primo e ultimo ingresso, ora italiana, con Wall Street che apre alle 15:30
// Nelle settimane in cui Italia e USA cambiano l'ora in date diverse (2–3 settimane a marzo, una tra ottobre e novembre)
// Wall Street apre alle 14:30 italiane: sessione, fasce orarie e avvisi si spostano con lei. Nel foglio resta l'ora reale.
const NYSH={};
const nyShift = dIso => { if (!dIso) return 0; if (!(dIso in NYSH)) { const o=mins(nyOpenIt(dIso)); NYSH[dIso]=isFinite(o)?o-930:0; } return NYSH[dIso]; };
const sessOf = dIso => { const sh=nyShift(dIso); return [SESS[0]+sh, SESS[1]+sh]; };
const hmMin = m => p2(Math.floor(m/60))+':'+p2(m%60);
const sessTxt = dIso => { const x=sessOf(dIso); return hmMin(x[0])+'–'+hmMin(x[1]); };
function applyTheme() { if (CFG.theme==='light' || CFG.theme==='dark') document.documentElement.dataset.theme=CFG.theme; else delete document.documentElement.dataset.theme;
  document.documentElement.classList.toggle('rm', CFG.motion==='reduce' || (CFG.motion==='auto' && matchMedia('(prefers-reduced-motion: reduce)').matches)); }
// colonne facoltative (Direzione, Esecuzione…): il modulo e le statistiche le usano solo se esistono nel foglio
const hasCol = h => !!(S.data[S.file] && S.data[S.file].h.indexOf(h)>=0);
const splitL = v => String(v||'').split(',').map(x=>x.trim()).filter(Boolean);
const viaScript = () => !!(window.google && google.script && google.script.run);
// scritture sul foglio una alla volta: il server le esegue comunque in fila (lock), così l'attesa di una non consuma il tempo della successiva
const WRITES=['addTrade','updateTrade','deleteTrade']; let wChain=Promise.resolve();
function callW(fn, ...args) { const p=wChain.then(()=>call(fn, ...args)); wChain=p.catch(()=>{}); return p; }
const netErr = e => /^NETWORK$|Il server ha risposto 5|timed? ?out|Timeout/i.test((e && e.message) || String(e));
const errTxt = e => netErr(e) ? 'connessione persa o server lento' : ((e && e.message) || String(e));
// dopo un errore di rete il trade può essere già nel foglio (il server finisce anche se la risposta si perde): lo cerca prima di dire che non è salvato
async function verifySaved(file, d, edit) {
  const same = r => { if (!r || r.Asset!==d.Asset || r.Data!==fmtIt(d.Data) || mins(r.Ora)!==mins(d.Ora)) return false;
    return ['RR','PnL $','SL','SL Points','Max Real RR'].every(k=>!(k in d) || (d[k]==='' ? empty(r[k]) : Math.abs(num(r[k])-num(d[k]))<0.006)); };
  for (const wait of [1500, 5000, 12000]) {
    await new Promise(r=>setTimeout(r, wait));
    try { const D=await call('getTrades', file), rows=D.rows.map(a=>unpack(D.h,a));
      const r = edit ? rows.find(x=>x._row===edit.row && same(x)) : rows.slice().reverse().find(same);
      if (r) { const a=D.rows.find(x=>x[0]===r._row); return { ok:true, row:a, h:D.h }; }
    } catch(e) {}
  }
  return null;
}
// le risposte di Claude (coach, chat, sunto delle news) devono essere un testo: una risposta vuota diventa un errore leggibile
const AI_FN=['coach','chat','newsSunto'];
const aiOk = (fn, r) => { if (AI_FN.includes(fn) && !(typeof r==='string' && r.trim())) throw new Error('Risposta vuota da Claude: riprova.'); return r; };
function call(fn, ...args) {
  if (viaScript()) return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(e=>rej(e))[fn](...args));
  const url=store.get('api',''), key=store.get('key','');
  if (!url || !key) { showSetup(); return Promise.reject(new Error('Inserisci indirizzo e chiave di accesso')); }
  // corpo in text/plain: è una richiesta «semplice», niente controllo preventivo CORS
  const ctl = 'AbortController' in window ? new AbortController() : null, to = ctl && setTimeout(()=>ctl.abort(), fn==='chat'||fn==='coach'||fn==='news'||fn==='newsSunto'||fn==='trumpNews'||WRITES.includes(fn) ? 90000 : 30000);
  return fetch(url, { method:'POST', body: JSON.stringify({ key, fn, args }), signal: ctl ? ctl.signal : undefined })
    .catch(() => { throw new Error('NETWORK'); })
    .finally(() => clearTimeout(to))
    .then(r => { if (!r.ok) throw new Error('Il server ha risposto '+r.status); return r.json(); })
    .then(d => { if (d.ok) return aiOk(fn, d.result); if (d.error==='CHIAVE_ERRATA') { showSetup('La chiave non è valida: controllala e riprova.'); throw new Error('Chiave non valida'); } throw new Error(d.error); });
}

// icone (tratto 1.8, stile lineare)
const I = {
  home:'<path d="M3.5 10.2 12 3.5l8.5 6.7"/><path d="M5.5 8.8V20h13V8.8"/><path d="M10 20v-5.5h4V20"/>',
  list:'<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="17.5" r="1.2"/>',
  chart:'<path d="M4 4v16h16"/><path d="m7.5 14.5 3.5-4 3 2.5 5-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>', chev:'<path d="m9.5 6 6 6-6 6"/>',
  trendUp:'<path d="m4 16 5.5-5.5 4 4L20 8"/><path d="M15 8h5v5"/>', trendDn:'<path d="m4 8 5.5 5.5 4-4L20 16"/><path d="M15 16h5v-5"/>',
  alert:'<path d="M12 4 2.8 19.5h18.4L12 4z"/><path d="M12 10v4.5M12 17.2v.1"/>', check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  cal:'<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  spark:'<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  send:'<path d="M4.5 12h13M12.5 6l6 6-6 6"/>', trash:'<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5"/>',
  news:'<path d="M5 5.5h11v13a1.5 1.5 0 0 0 1.5 1.5H6.5A1.5 1.5 0 0 1 5 18.5z"/><path d="M16 9h3v9.5a1.5 1.5 0 0 1-3 0"/><path d="M8 9h5M8 12.5h5M8 16h3"/>',
  book:'<path d="M5 4.5h10.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10.5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
  grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
  side:'<rect x="3.5" y="4.5" width="17" height="15" rx="3.5"/><path d="M9.5 4.5v15M14 10l-2 2 2 2"/>',
  play:'<path d="M8 5.5v13l10.5-6.5z"/>',
  ext:'<path d="M14 4.5h5.5V10M19.5 4.5 11 13"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  mic:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
  refresh:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  shield:'<path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  dice:'<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" stroke-width="3"/>',
};
const ic = (n, s=20, w=1.8) => '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[n]+'</svg>';
let logoN=0;
function logo(s) { // monogramma «E» geometrico con un punto (il prezzo che arriva al target), su sfumatura del colore del file
  const id='lg'+(++logoN);
  return '<svg class="logo" width="'+s+'" height="'+s+'" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1">'+
    '<stop offset="0" style="stop-color:var(--glow2)"/><stop offset="1" style="stop-color:var(--accent)"/></linearGradient></defs>'+
    '<rect width="32" height="32" rx="9.5" fill="url(#'+id+')"/><rect x=".5" y=".5" width="31" height="31" rx="9" fill="none" stroke="#fff" stroke-opacity=".22"/>'+
    '<g fill="#fff"><rect x="9" y="7.5" width="3.2" height="17" rx="1.6"/>'+
    '<rect class="bar b1" x="9" y="7.5" width="14" height="3.2" rx="1.6"/><rect class="bar b2" x="9" y="14.4" width="10" height="3.2" rx="1.6"/><rect class="bar b3" x="9" y="21.3" width="14" height="3.2" rx="1.6"/>'+
    '<circle cx="23.2" cy="15.95" r="1.6" opacity=".85"/></g></svg>';
}

// controllo segmentato con indicatore che scorre
function seg(key, opts, val, cls) {
  const i = opts.findIndex(o => String(o.v ?? o) === String(val ?? ''));
  return '<div class="seg '+(cls||'')+(i<0?' none':'')+'" data-seg="'+key+'" style="--n:'+opts.length+';--i:'+Math.max(i,0)+'">'+
    opts.map((o,j)=>'<button type="button" data-v="'+esc(o.v ?? o)+'" class="'+(j===i?'on':'')+'"'+(o.h&&o.l?' aria-label="'+esc(o.l)+'" title="'+esc(o.l)+'"':'')+'>'+(o.h ?? esc(o.l ?? o))+'</button>').join('')+'</div>';   // solo icona: il nome per lettori di schermo e tooltip
}
function setSeg(el, v) {
  const bs=[...el.querySelectorAll('button')], i=bs.findIndex(b=>b.dataset.v===String(v));
  el.style.setProperty('--i', Math.max(i,0)); el.classList.toggle('none', i<0); bs.forEach((b,j)=>b.classList.toggle('on', j===i));
}
function chips(key, opts, val, multi) {
  return '<div class="chips" data-chips="'+key+'"'+(multi?' data-multi="1"':'')+'>'+opts.map(o=>{ const v=o.v ?? o;
    const on = multi ? (val||[]).includes(v) : String(val??'')===String(v);
    return '<button type="button" class="chip'+(on?' on':'')+'" data-v="'+esc(v)+'">'+esc(o.l ?? (v||'Tutti'))+'</button>'; }).join('')+'</div>';
}
// numeri: contano da zero quando il blocco entra; dopo un filtro scorrono dal valore di prima
const NUMSEL='[data-num], .ds-lead b, .be-big b, .ds-cost b, .kpi .v';
function numParse(el) {
  const w=document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
  while ((n=w.nextNode())) { const t=n.nodeValue; if (/[:\/]/.test(t)) return null; const m=/[+−-]?\d+(?:,\d+)?/.exec(t); if (!m) continue;
    const g=m[0], sg=/^[+−-]/.test(g)?g[0]:'', core=sg?g.slice(1):g, v=parseFloat(core.replace(',','.'))*(sg==='+'||!sg?1:-1);
    return isFinite(v) ? { n, t, pre:t.slice(0,m.index), post:t.slice(m.index+g.length), v, dec:(core.split(',')[1]||'').length, plus:sg==='+' } : null; }
  return null;
}
const numFmt = (p, x) => p.pre+(x<0 && Math.abs(x)>=Math.pow(10,-p.dec)/2 ? '−' : p.plus && x>0 ? '+' : '')+Math.abs(x).toFixed(p.dec).replace('.',',')+p.post;
const numEls = root => [...root.querySelectorAll(NUMSEL)].filter(el=>!el.querySelector('[data-num]'));
const numSnap = root => numEls(root).map(numParse);
let numJobs=[], numRaf=0;
function numRun(jobs) {
  if (reduceMotion() || !jobs.length) return; const t0=performance.now();
  jobs.forEach(j=>{ j.t0=t0+(j.delay||0); j.p.n.nodeValue=numFmt(j.p, j.from); }); numJobs.push(...jobs);
  if (numRaf) return;
  const step = t => { numJobs=numJobs.filter(j=>{ if (!j.p.n.isConnected) return false; const k=Math.max(0, Math.min(1, (t-j.t0)/j.dur)), e=k===1?1:1-Math.pow(2,-10*k);
      j.p.n.nodeValue = k>=1 ? j.p.t : numFmt(j.p, j.from+(j.p.v-j.from)*e); return k<1; });
    numRaf = numJobs.length ? requestAnimationFrame(step) : 0; };
  numRaf=requestAnimationFrame(step);
}
function countUp(root, delay) { numRun(numEls(root).map(numParse).filter(p=>p && p.v!==0).map(p=>({ p, from:0, dur:1000, delay }))); }
function numFrom(root, prev) { const now=numSnap(root); numRun(now.map((p,i)=>{ const q=prev[i]; return p && q && q.post===p.post && q.v!==p.v ? { p, from:q.v, dur:650 } : null; }).filter(Boolean)); }
const words = t => String(t).split(' ').map((w,i)=>'<span class="wr" style="--i:'+i+'">'+esc(w)+'</span>').join(' ');
function confetti() { // piccola festa per un trade vinto: ~90 coriandoli, 1,6 secondi, poi il canvas sparisce
  const dpr=Math.min(2, window.devicePixelRatio||1), c=document.createElement('canvas'); c.className='confetti'; document.body.appendChild(c);
  const W=c.width=innerWidth*dpr, H=c.height=innerHeight*dpr, ctx=c.getContext('2d'), cs=getComputedStyle(document.documentElement);
  const cols=['--accent','--win','--glow2','--warn'].map(v=>cs.getPropertyValue(v).trim()||'#888');
  const P=Array.from({ length:90 }, ()=>({ x:W*(.3+Math.random()*.4), y:H*.42, vx:(Math.random()-.5)*16*dpr, vy:-(9+Math.random()*16)*dpr, w:(4+Math.random()*4)*dpr, h:(7+Math.random()*8)*dpr,
    r:Math.random()*6, vr:(Math.random()-.5)*.35, c:cols[(Math.random()*cols.length)|0] }));
  const t0=performance.now();
  (function f(t) { const k=(t-t0)/1600; ctx.clearRect(0,0,W,H);
    P.forEach(p=>{ p.vy+=.55*dpr; p.vx*=.985; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; ctx.save(); ctx.globalAlpha=Math.max(0,1-k*k); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore(); });
    if (k<1) requestAnimationFrame(f); else c.remove(); })(t0);
}
const numEl = (x, dec, sign) => '<span data-num="'+x+'" data-dec="'+dec+'" data-sign="'+(sign?1:0)+'">'+fmtN(x,dec,sign)+'</span>';
let toastT;
function toast(msg, err) {
  const t=$('toast'); t.innerHTML=ic(err?'alert':'check',18,2.2)+'<span>'+esc(msg)+'</span>'; t.className='toast show'+(err?' err':'');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'), 2800);
}

// ───────────────────────── dati normalizzati e aggregati ─────────────────────────
function norm(r) {
  const d=pdate(r.Data), o=mins(r.Ora), max=num(r['Max Real RR']); let best=bestNum(r['Best Real RR']);
  if (!isFinite(best) && isFinite(max)) best=Math.min(5,Math.floor(max+1e-9));
  return { row:r._row, a:r.Asset, d, on: d && isFinite(o) ? o-nyShift(iso(d)) : o, ym: d? d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0') : '', o, out:r.Outcome, em:r.EM, idea:r['5m Idea'], news:r.News,
           lvn:r['Coming from LVN'], smt:r.SMT, clean: r['1m Clean STR']===true||r['1m Clean STR']==='TRUE', best, max, rr:num(r.RR), tp:r.TP,
           h:[1,2,3,4,5].map(k=>mins(r['Holding time '+k+'rr'])), hold:mins(r['Holding time']), day: d? L.days[(d.getDay()+6)%7] : '',
           dir:r.Direzione, exe:r.Esecuzione, pnl:num(r['PnL $']), errs:splitL(r.Errori), note:r.Note, cc2:/^s[iì]$/i.test(String(r['2° CC']||'').trim()), raw:r };
}
let allCache=null, allRows=null, allLen=-1, allRev=-1, rowsRev=0;
const touchRows = () => { rowsRev++; };
function all() {
  if (allRows!==S.rows || allLen!==S.rows.length || allRev!==rowsRev) {
    allCache=S.rows.map(norm).filter(t=>t.d).sort((x,y)=>(x.d-y.d)||((x.o||0)-(y.o||0))); allRows=S.rows; allLen=S.rows.length; allRev=rowsRev; }
  return allCache;
}
// EOW: esito a un target fisso (default 2R) · Journal: RR scritto nel trade
function model(T) {
  if (S.type==='EOW') { T=T||2; return { rOf:t=> t.best>=T ? T : -1, isWin:t=>t.best>=T, isLoss:t=>!(t.best>=T) }; }
  return { rOf:t=> isFinite(t.rr)?t.rr:0, isWin:t=>t.out==='Win', isLoss:t=>t.out==='Loss' };
}
// modelli fissi per file, da usare quando si guarda un file diverso da quello aperto
const eModel = (T=2) => ({ rOf:t=> t.best>=T ? T : -1, isWin:t=>t.best>=T, isLoss:t=>!(t.best>=T) });
function agg(ts, m) {
  const n=ts.length, w=ts.filter(m.isWin).length, l=ts.filter(m.isLoss).length; let R=0,gp=0,gl=0,eq=0,pk=0,dd=0;
  ts.forEach(t=>{ const r=m.rOf(t); R+=r; if (r>0) gp+=r; else gl-=r; eq+=r; pk=Math.max(pk,eq); dd=Math.min(dd,eq-pk); });
  return { n, w, l, be:n-w-l, R, pf: gl>0 ? gp/gl : (gp>0 ? Infinity : NaN), exp: n ? R/n : NaN, dd, wr: (w+l) ? w/(w+l) : NaN, wrAll: n ? w/n : NaN };
}
// EOW = end of week: la «settimana» è quella scorsa, ormai chiusa · Journal: la settimana in corso
const wkOff = () => S.type==='EOW' ? 1 : 0;
const wkLbl = () => S.type==='EOW' ? 'Settimana scorsa' : 'Questa settimana';
const dayMs = 864e5, addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
const pdIso = s => { const p=String(s||'').split('-').map(Number); return p.length===3 && p[0] ? new Date(p[0],p[1]-1,p[2]) : null; };
function periodRange(per, back) { // back=1: periodo precedente
  const now=new Date(); let a,b;
  if (per==='w') { const mon=addDays(now, -((now.getDay()+6)%7)); a=addDays(mon, -7*(back+wkOff())); b=addDays(a, 7); }
  else if (per==='c') { const f=pdIso(S.cust.from), t=pdIso(S.cust.to); if (!f || !t || t<f) return back ? null : [new Date(2000,0,1), new Date(2100,0,1)];
    const len=Math.round((t-f)/dayMs)+1; a=addDays(f, -len*back); b=addDays(a, len); }
  else if (per==='m') { a=new Date(now.getFullYear(), now.getMonth()-back, 1); b=new Date(now.getFullYear(), now.getMonth()-back+1, 1); }
  else if (per==='3m') { a=new Date(now.getFullYear(), now.getMonth()-2-3*back, 1); b=new Date(now.getFullYear(), now.getMonth()+1-3*back, 1); }
  else if (per==='y') { a=new Date(now.getFullYear()-back,0,1); b=new Date(now.getFullYear()-back+1,0,1); }
  else return back ? null : [new Date(2000,0,1), new Date(2100,0,1)];
  return [a,b];
}
const inRange = (ts, rg) => rg ? ts.filter(t=>t.d>=rg[0] && t.d<rg[1]) : [];

// ───────────────────────── grafici SVG ─────────────────────────
function niceStep(x) { const p=Math.pow(10,Math.floor(Math.log10(x||1))), f=x/p; return (f<1.5?1:f<3?2:f<7?5:10)*p; }
function ticks(lo, hi, n) { const s=niceStep((hi-lo)/n), a=[]; for (let v=Math.ceil(lo/s)*s; v<=hi+1e-9; v+=s) a.push(+v.toFixed(6)); return a; }
const fmtTick = t => fmtN(t, Number.isInteger(t)?0:1, false);
let uid=0;
function lineChart(el, pts, o={}) {
  const W=el.clientWidth||320, H=o.h||190, ax=o.axes!==false, padL=ax?36:0, padR=ax?10:0, padT=14, padB=ax?24:2;
  const ys=pts.map(p=>p.y); let lo=Math.min(0,...ys), hi=Math.max(0,...ys); if (hi-lo<1) { hi+=.5; lo-=.5; }
  let tk=[]; if (ax) { tk=ticks(lo,hi,4); lo=Math.min(lo,tk[0]); hi=Math.max(hi,tk[tk.length-1]); } else { const s=hi-lo; lo-=s*.12; hi+=s*.12; }
  const n=pts.length, x=i=> padL + (n<2 ? (W-padL-padR)/2 : i*(W-padL-padR)/(n-1)), y=v=> padT + (hi-v)*(H-padT-padB)/(hi-lo);
  const d=pts.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.y).toFixed(1)).join(' ');
  const base=y(ax?lo:lo), id='g'+(++uid);
  let g='';
  tk.forEach(t=>{ g+='<line class="grid'+(t===0?' zero':'')+'" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+y(t)+'" y2="'+y(t)+'"/><text class="tick" x="'+(padL-8)+'" y="'+(y(t)+3.5)+'" text-anchor="end">'+fmtTick(t)+'</text>'; });
  if (ax && n>1) { g+='<text class="tick" x="'+padL+'" y="'+(H-6)+'">'+esc((o.x0?pts[0].x:pts[1]?.x)||pts[0].x||'')+'</text><text class="tick" x="'+(W-padR)+'" y="'+(H-6)+'" text-anchor="end">'+esc(pts[n-1].x||'')+'</text>'; }
  if (!ax) g+='<line class="grid zero" x1="0" x2="'+W+'" y1="'+y(0)+'" y2="'+y(0)+'" stroke-dasharray="2 4"/>';
  el.innerHTML = '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.aria||'Curva dei risultati in R')+'">'+
    '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.24"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs>'+g+
    '<path class="area" fill="url(#'+id+')" d="'+d+' L'+x(n-1).toFixed(1)+' '+base+' L'+x(0).toFixed(1)+' '+base+' Z"/>'+
    '<path class="line" pathLength="1" d="'+d+'"/><circle class="endpt" r="4.5" cx="'+x(n-1)+'" cy="'+y(pts[n-1].y)+'"/>'+
    '<g class="xh" opacity="0"><line y1="'+padT+'" y2="'+(H-padB)+'"/><circle r="5"/></g></svg><div class="tip"></div>';
  const svg=el.querySelector('svg'), xh=el.querySelector('.xh'), tip=el.querySelector('.tip');
  const show = e => { const r=svg.getBoundingClientRect(), px=e.clientX-r.left; const i=Math.max(0,Math.min(n-1,Math.round((px-padL)/((W-padL-padR)/Math.max(1,n-1)))));
    const cx=x(i), cy=y(pts[i].y); xh.setAttribute('opacity',1); xh.querySelector('line').setAttribute('x1',cx); xh.querySelector('line').setAttribute('x2',cx);
    xh.querySelector('circle').setAttribute('cx',cx); xh.querySelector('circle').setAttribute('cy',cy);
    tip.innerHTML='<b>'+(o.fmt?o.fmt(pts[i].y):fmtR(pts[i].y))+'</b>'+esc(pts[i].tip||''); tip.classList.add('show');
    const tw=tip.offsetWidth; tip.style.left=Math.max(tw/2, Math.min(W-tw/2, cx))+'px'; tip.style.top=Math.max(cy-10, 40)+'px'; };
  const hide = () => { xh.setAttribute('opacity',0); tip.classList.remove('show'); };
  svg.addEventListener('pointermove', show); svg.addEventListener('pointerdown', show); svg.addEventListener('pointerleave', hide);
}
function barPath(x, w, y0, y1) {
  const h=Math.abs(y1-y0); if (h<1) return 'M'+x+' '+(y0-.5)+'h'+w+'v1h'+(-w)+'Z';
  const r=Math.min(4,w/2,h), s=y1<y0?1:-1;
  return 'M'+x+' '+y0+'V'+(y1+s*r)+'Q'+x+' '+y1+' '+(x+r)+' '+y1+'H'+(x+w-r)+'Q'+(x+w)+' '+y1+' '+(x+w)+' '+(y1+s*r)+'V'+y0+'Z';
}
function barChart(el, items, o={}) {
  const W=el.clientWidth||320, H=o.h||170, ax=o.axes!==false, padL=ax?36:2, padR=4, padT=12, padB=22;
  const vs=items.map(i=>i.v); let lo=Math.min(0,...vs), hi=Math.max(0,...vs); if (hi-lo<1) hi=lo+1;
  const tk=ax?ticks(lo,hi,3):[]; if (tk.length) { lo=Math.min(lo,tk[0]); hi=Math.max(hi,tk[tk.length-1]); }
  const y=v=>padT+(hi-v)*(H-padT-padB)/(hi-lo), n=items.length, slot=(W-padL-padR)/n, bw=Math.max(4,Math.min(30,slot*.6)), every=Math.ceil(n/8);
  let g=''; tk.forEach(t=>{ g+='<line class="grid'+(t===0?' zero':'')+'" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+y(t)+'" y2="'+y(t)+'"/><text class="tick" x="'+(padL-8)+'" y="'+(y(t)+3.5)+'" text-anchor="end">'+(o.tickFmt||fmtTick)(t)+'</text>'; });
  if (!ax) g+='<line class="grid zero" x1="0" x2="'+W+'" y1="'+y(0)+'" y2="'+y(0)+'"/>';
  items.forEach((it,i)=>{ const cx=padL+slot*(i+.5);
    g+='<path class="bar '+(it.cls||(it.v>=0?'p':'n'))+'" style="--bi:'+Math.min(i,16)+'" d="'+barPath(cx-bw/2,bw,y(0),y(it.v))+'"/>';
    if ((n-1-i)%every===0) g+='<text class="tick" x="'+cx+'" y="'+(H-6)+'" text-anchor="middle">'+esc(it.l)+'</text>'; });
  el.innerHTML='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.aria||'R per mese')+'">'+g+'</svg><div class="tip"></div>';
  const svg=el.querySelector('svg'), tip=el.querySelector('.tip'), bars=[...svg.querySelectorAll('.bar')];
  const show = e => { const r=svg.getBoundingClientRect(), i=Math.max(0,Math.min(n-1,Math.floor((e.clientX-r.left-padL)/slot)));
    bars.forEach((b,j)=>b.classList.toggle('dim', j!==i)); const it=items[i], cx=padL+slot*(i+.5);
    tip.innerHTML='<b>'+(o.fmt?o.fmt(it.v):fmtR(it.v))+'</b>'+esc(it.tip||it.l); tip.classList.add('show'); const tw=tip.offsetWidth;
    tip.style.left=Math.max(tw/2,Math.min(W-tw/2,cx))+'px'; tip.style.top=Math.max(Math.min(y(it.v),y(0))-6, 44)+'px'; };
  const hide = () => { bars.forEach(b=>b.classList.remove('dim')); tip.classList.remove('show'); };
  svg.addEventListener('pointermove', show); svg.addEventListener('pointerdown', show); svg.addEventListener('pointerleave', hide);
}
function equityPts(ts, m) { let eq=0; const p=[{y:0,x:'',tip:'Inizio'}];
  ts.forEach((t,i)=>{ eq+=m.rOf(t); p.push({ y:eq, x:t.d.getDate()+' '+MESI[t.d.getMonth()], tip:'Trade '+(i+1)+' · '+t.d.getDate()+' '+MESI[t.d.getMonth()]+' · '+t.a+' '+(t.idea||'') }); });
  return p; }
function monthItems(ts, m, last) {
  let ms=[...new Set(ts.map(t=>t.ym))].sort(); if (last) ms=ms.slice(-last);
  return ms.map(k=>{ const g=ts.filter(t=>t.ym===k), a=agg(g,m), mo=+k.slice(5)-1;
    return { l:MESI[mo], v:r2(a.R), tip:MESI_F[mo]+' '+k.slice(0,4)+' · '+a.n+' trade · WR '+pct(a.wr) }; });
}

// ───────────────────────── navigazione ─────────────────────────
// Pagine: barra laterale su PC (gruppi), barra in basso sul telefono (le pagine meno usate stanno in «Altro»)
const NAV = [ { g:'Giornata' }, { id:'home', l:'Panoramica', i:'home' }, { id:'news', l:'News', i:'news' },
  { g:'Registro' }, { id:'list', f:'Journal', l:'Journal', i:'book' }, { id:'list', f:'EOW', l:'EOW', i:'list' },
  { g:'Performance' }, { id:'stats', l:'Analisi', i:'chart' }, { id:'cal', l:'Calendario', i:'cal' }, { id:'mc', l:'Simula', i:'dice' },
  { g:'Crescita' }, { id:'disc', l:'Disciplina', i:'shield' }, { id:'coach', l:'Coach', i:'spark' } ];
const NAV_FOOT = [ { id:'set', l:'Impostazioni', i:'gear' } ];
const BAR = [['home','Home','home'],['news','News','news'],['list','Trade','list'],['stats','Analisi','chart'],['more','Altro','grid']];
const VIEWS = ['home','news','list','stats','cal','mc','disc','coach','set'];
const PTITLE = { home:'Panoramica', news:'News', list:'Trade', stats:'Analisi', cal:'Calendario', mc:'Simula', disc:'Disciplina', coach:'Coach', set:'Impostazioni' };
const NOFILE = ['news','set','disc','mc'];   // pagine che non dipendono da EOW / Journal (la Disciplina usa sempre il Journal, Simula sempre l'EOW)
const FILE_LBL = { EOW:['EOW','End of Week · backtest della settimana'], Journal:['JOURNAL','Trade reali eseguiti'] };
const navKey = n => n.id+(n.f?':'+n.f:'');
const curNavKey = () => S.tab==='list' ? 'list:'+S.file : S.tab;
function fileLook() { document.documentElement.dataset.file=S.file; const l=FILE_LBL[S.file]; $('filebar').innerHTML='<i></i><b>'+l[0]+'</b><span>'+l[1]+'</span>';
  navState(); }
function renderChrome() {
  $('brand').innerHTML = logo(26)+'<span translate="no">'+APP+'</span>';
  if (!$('topSearch')) $('fileSeg').insertAdjacentHTML('afterend', '<button type="button" class="icon-btn top-search" id="topSearch" data-act="pal" aria-label="Cerca pagine, azioni e trade">'+ic('search',18,2)+'</button>');
  let k=0; const item = n => '<button type="button" class="sb-i" data-nav="'+navKey(n)+'" data-tip="'+n.l+' · '+(k+1)+'" title="'+n.l+' (tasto '+(k+1)+')" style="--k:'+(k++)+'">'+ic(n.i,20)+'<span>'+n.l+'</span>'+
    (n.f?'<i class="fdot '+n.f+'"></i>':'')+'<em class="sb-b" id="nb-'+navKey(n).replace(':','-')+'"></em></button>';
  $('side').innerHTML = '<span class="sb-ind" id="sbInd"></span><div class="sb-brand" translate="no">'+logo(30)+'<span>'+APP+'</span></div>'+
    '<button type="button" class="sb-search" data-act="pal" aria-label="Cerca pagine, azioni e trade">'+ic('search',16,2)+'<span>Cerca</span><kbd class="kbd">'+(/Mac|iPhone|iPad/.test(navigator.platform)?'⌘':'Ctrl ')+'K</kbd></button><div class="sb-nav">'+
    NAV.map(n=>n.g?'<div class="sb-g">'+n.g+'</div>':item(n)).join('')+'</div><div class="sb-foot">'+NAV_FOOT.map(item).join('')+
    '<button type="button" class="sb-i sb-col" data-act="sbcol" data-tip="Espandi" style="--k:'+(k++)+'">'+ic('side',20)+'<span>Comprimi</span></button></div>';
  $('nav').firstElementChild.innerHTML = '<span class="ind" id="navInd"></span>'+BAR.map(t=>'<button type="button" data-bar="'+t[0]+'"><span class="pill">'+ic(t[2],21)+'</span>'+t[1]+'</button>').join('');
  $('fab').innerHTML = ic('plus',20,2.2)+'<span>Nuovo trade</span>';
  $('sh-close').innerHTML = ic('x',18,2); $('aifab').innerHTML = ic('spark',24,1.8);
  setSeg($('fileSeg'), S.file); fileLook(); newsBadge();
}
function navState() {
  const key=curNavKey(), root=document.documentElement;
  root.dataset.tab=S.tab;
  document.querySelectorAll('#side [data-nav]').forEach(b=>{ const on=b.dataset.nav===key; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  document.querySelectorAll('#nav [data-bar]').forEach(b=>b.classList.toggle('on', b.dataset.bar===S.tab || (b.dataset.bar==='more' && !BAR.some(x=>x[0]===S.tab))));
  const pt=$('ptitle'); if (pt) pt.innerHTML='<b>'+PTITLE[S.tab]+'</b>';
  $('fab').classList.toggle('hide', ['mc','coach','news','set'].includes(S.tab) || !!S.sheet); $('aifab').classList.toggle('hide', S.tab==='coach' || !!S.sheet);
  moveInd();
}
let indRaf=0;
function moveInd() {
  const bi=BAR.findIndex(t=>t[0]===S.tab), el=$('navInd'); if (el) el.style.setProperty('--i', bi<0?BAR.length-1:bi);
  if (innerWidth<1000 || indRaf) return;   // la barra laterale c'è solo su PC; la misura aspetta il frame (un solo calcolo del layout)
  indRaf=requestAnimationFrame(()=>{ indRaf=0; const side=$('side'), act=side && side.querySelector('.sb-i.on'), ind=$('sbInd'); if (!ind) return;
    const nav=side.querySelector('.sb-nav'); if (nav && !nav._sc) { nav._sc=1; nav.addEventListener('scroll', moveInd, { passive:true }); }
    const vis = act && nav && nav.contains(act) ? (()=>{ const r=act.getBoundingClientRect(), n=nav.getBoundingClientRect(); return r.bottom>n.top+4 && r.top<n.bottom-4; })() : true;
    if (act && act.offsetParent && vis) { ind.style.setProperty('--y', (act.getBoundingClientRect().top-side.getBoundingClientRect().top)+'px'); ind.style.opacity=1; } else ind.style.opacity=0; });
}
let goTok=0;
// animazioni: «full» sempre complete (predefinito), «reduce» ridotte, «auto» come il sistema (riduci movimento)
const reduceMotion = () => CFG.motion==='reduce' || (CFG.motion==='auto' && matchMedia('(prefers-reduced-motion: reduce)').matches);
const hashOf = () => S.tab==='list' ? 'list/'+S.file : S.tab;
function go(tab, o) {
  o=o||{};
  if (tab===(S.goingTo||S.tab)) { window.scrollTo({ top:0, behavior: o.instant||reduceMotion() ? 'auto' : 'smooth' }); navState(); syncHash(o); return; }
  // niente View Transition: congelava lo schermo finché la pagina nuova non era pronta.
  // Gli indicatori si spostano subito (sulla scheda grafica); la pagina nuova si disegna al frame dopo ed entra a blocchi.
  const tok=++goTok; S.goingTo=tab; S.tab=tab; navState(); syncHash(o);
  const show = () => { if (tok!==goTok) return; S.goingTo=null; VIEWS.forEach(v=>{ $('v-'+v).hidden = v!==tab; }); if (window.scrollY) window.scrollTo({ top:0 });
    renderCurrent(!!(o.instant || o.fromPop)); };   // da tastiera o col gesto Indietro: niente entrate
  if (o.instant) show(); else requestAnimationFrame(()=>setTimeout(show, 0));
}
// l'indirizzo segue la pagina: il tasto Indietro e i link diretti funzionano (#news, #list/Journal…)
function syncHash(o) { const h='#'+hashOf(); if (location.hash===h) return; if (o && o.fromPop) return; history.pushState(null, '', h); }
window.addEventListener('popstate', () => {
  const lb=$('lb'), lbOn=lb && lb.classList.contains('on');   // prima si chiude ciò che sta sopra: foto, palette, scheda
  if (lbOn || PAL.on || S.sheet) { if (lbOn) lbClose(); else if (PAL.on) palToggle(false); else closeSheet(); history.pushState(null, '', '#'+hashOf()); return; }
  const [t,f]=location.hash.slice(1).split('/'); if (f && (f==='EOW'||f==='Journal')) switchFile(f); go(VIEWS.includes(t)?t:'home', { fromPop:true }); });
function switchFile(f) { if (f===S.file) return; setSeg($('fileSeg'),f); S.file=f; S.lo=''; S.type=f==='EOW'?'EOW':'JOURNAL'; S.filt=S.filtBy[f]; S.lmore=60; store.set('file',f); fileLook(); load(); }
function navTo(key, o) { const [id,f]=key.split(':'); if (S.sheet) closeSheet(); if (f) switchFile(f); o=o||{}; go(id, o); if (f && id==='list') syncHash(o); }
function openMore() {
  S.sheet='more'; $('sh-sub').textContent=APP; $('sh-title').innerHTML=words('Altro');
  const it=[['list:Journal','Journal','book','Trade reali'],['list:EOW','EOW','list','Backtest della settimana'],['cal','Calendario','cal','R giorno per giorno'],
            ['disc','Disciplina','shield','Regole, errori ed esecuzione'],['coach','Coach','spark','Consigli e chat con Claude'],['mc','Simula','dice','Prop firm: passare le valutazioni'],['set','Impostazioni','gear','Profilo, sessione, filtri']];
  $('sh-body').innerHTML='<div class="more">'+it.map((x,k)=>'<button type="button" data-nav="'+x[0]+'" style="--k:'+k+'" class="'+(curNavKey()===x[0]?'on':'')+'">'+ic(x[2],24,1.8)+'<b>'+x[1]+'</b><span>'+x[3]+'</span></button>').join('')+'</div>';
  $('sh-foot').innerHTML=''; openSheet();
}
function newsBadge() { const b=$('nb-news'); if (!b) return;
  if (S.trump && S.trump.live) { b.textContent='Live'; b.classList.add('on'); b.title='Trump sta parlando ora'; return; } if (!S.news) return; const now=Date.now(), t=todayIso();
  const n=newsEvents().filter(e=>e.day===t && !e.tbd && e.t>now-60000 && (e.imp==='High' || e.trump)).length; b.textContent=n; b.classList.toggle('on', n>0); b.title=n+' news ad alto impatto ancora da uscire oggi'; }
let introRT=0;
function renderCurrent(quiet) {
  // durante il benvenuto non si disegna (ogni disegno ferma l'animazione): un solo disegno, quando il saluto è finito
  const wait=(S.introAt||0)-260-performance.now(); if (wait>0) { if (!introRT) introRT=setTimeout(()=>{ introRT=0; renderCurrent(false); }, wait); return; }
  S.quiet=!!quiet; ({ home:renderHome, news:renderNews, list:renderList, stats:renderStats, cal:renderCal, mc:renderMC, disc:renderDisc, coach:renderCoach, set:renderSet })[S.tab](); S.quiet=false; }
// testi secondari (sotto i numeri e accanto ai titoli): dentro la frase i valori in evidenza e i segni +/− colorati,
// i «·» diventano puntini; le parole restano grigie. Una passata dopo ogni disegno, solo sui nodi di testo.
const META_SEL='.kpi .h, .hero-meta > span:not(.delta), .be-row em, .be-big span, .bd-l small, .card-h .sub, .td-r span, .ds-cost em, .usd-g em, .rk-leg span, .ds-note';
const META_RE=/(\d{1,2}:\d{2}(?:\s?[–-]\s?\d{1,2}:\d{2})?)|([+−-]?\$\s?\d[\d.,]*k?|[+−-]?\d[\d.,]*(?:\s?(?:R|%|rr)(?![\wà-ù]))?)|(\s·\s)/g;
function richMeta(root) {
  root.querySelectorAll(META_SEL).forEach(el=>{ if (el.dataset.rich) return; el.dataset.rich='1';
    const tw=document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes=[]; let n;
    while ((n=tw.nextNode())) if (!n.parentElement.closest('b,strong,[data-num],.mv,.num,a,button')) nodes.push(n);
    nodes.forEach(t=>{ const v=t.nodeValue; if (!/\d|\s·\s/.test(v)) return;
      const html=esc(v).replace(META_RE,(m,tm,val,sep)=> sep ? '<i class="sep"></i>' : tm ? '<span class="mv">'+tm+'</span>'
        : '<span class="mv'+(/^\+/.test(val)?' p':/^[−-]\s?\$?\d/.test(val)&&/^[−-]/.test(val)?' n':'')+'">'+val+'</span>');
      const box=document.createElement('span'); box.innerHTML=html; t.replaceWith(...box.childNodes); });
  });
}
function enter(el, html, after) {
  const user = S.quiet && performance.now()-(S.userT||0) < 450 && !reduceMotion(), prev = user ? numSnap(el) : null;
  el.innerHTML = html; el.classList.toggle('quiet', S.quiet); richMeta(el);
  // sul telefono (una colonna, niente bilanciamento) i grafici si disegnano al frame dopo: la pagina compare prima
  const later = !S.quiet && after && innerWidth<1000;
  masonry(el, later ? null : after);
  if (!S.quiet) blkStagger(el);
  if (later) requestAnimationFrame(()=>{ if (el.isConnected && !el.hidden) after(); });
  else if (user) { numFrom(el, prev); el.classList.remove('redraw'); void el.offsetWidth; el.classList.add('redraw'); clearTimeout(el._rd); el._rd=setTimeout(()=>el.classList.remove('redraw'), 1400); }
}
// I blocchi entrano subito, nell'ordine in cui si leggono (nelle due colonne su PC: riga per riga); oltre il settimo stessa partenza
function blkStagger(el) {
  const k0=Math.max(0, (S.introAt||0)-performance.now()); let base=0;
  [...el.children].forEach(n=>{
    if (n.classList.contains('prow')) { [...n.children].forEach((c,i)=>blkMark(c, Math.min(base+i, 7), k0)); base++; return; }
    if (!n.classList.contains('mcols')) { blkMark(n, Math.min(base++, 7), k0); return; }
    let rows=0; [...n.children].forEach(c=>{ [...c.children].forEach((b,i)=>blkMark(b, Math.min(base+i, 7), k0)); rows=Math.max(rows, c.children.length); }); base+=rows; });
}
function blkMark(b, k, k0) {
  b.style.setProperty('--k', k); if (k0) b.style.setProperty('--k0', Math.round(k0)+'ms');
  b.classList.add('blk'); const ms=k*45+k0; countUp(b, ms+120);
  setTimeout(()=>{ b.classList.remove('blk'); b.style.removeProperty('--k'); b.style.removeProperty('--k0'); }, ms+2000);
}
// Su PC le card consecutive vanno in due colonne di altezza simile (senza buchi); sul telefono resta una colonna
function masonry(el, after) {
  const isC = n => n.nodeType===1 && (n.classList.contains('card') || n.classList.contains('dayg')) && !n.classList.contains('wide');
  const runs=[]; if (innerWidth>=1000) { let cur=[]; [...el.children].forEach(n=>{ if (isC(n)) cur.push(n); else { if (cur.length>1) runs.push(cur); cur=[]; } }); if (cur.length>1) runs.push(cur); }
  const W=runs.map(r=>{ const w=document.createElement('div'); w.className='mcols'; const a=document.createElement('div'), b=document.createElement('div'); a.className=b.className='mcol';
    w.append(a,b); r[0].before(w); r.forEach(n=>a.appendChild(n)); return w; });
  if (after) after();
  W.forEach(w=>{ const [a,b]=w.children, cs=[...a.children], hs=cs.map(n=>n.offsetHeight); let ha=0, hb=0;
    cs.forEach((n,i)=>{ if (ha<=hb) { a.appendChild(n); ha+=hs[i]+16; } else { b.appendChild(n); hb+=hs[i]+16; } }); });
}
const skeleton = () => '<div class="skel" style="height:60px"></div><div class="skel" style="height:230px"></div><div class="kgrid"><div class="skel" style="height:110px"></div><div class="skel" style="height:110px"></div><div class="skel" style="height:110px"></div><div class="skel" style="height:110px"></div></div>';

// Dati: si mostrano subito quelli già in memoria o salvati sul telefono, poi si aggiornano dal foglio in background
const cacheGet = f => { try { const v=localStorage.getItem('tj.data.'+f); return v?JSON.parse(v):null; } catch(e) { return null; } };
const cacheSet = (f, d) => { try { localStorage.setItem('tj.data.'+f, JSON.stringify(d)); } catch(e) {} };
const unpack = (h, a) => { const o={ _row:a[0] }; h.forEach((k,j)=>{ if (k) o[k]=a[j+1]; }); return o; };
const only1 = r => !r.EM || r.EM===EM1;   // i trade con altri entry model non vengono considerati
function applyData(d) { S.type=d.type; S.rows=d.rows.map(a=>unpack(d.h,a)).filter(only1); S.loaded=true; }
let syncN=0;
function setSync(on) { syncN=Math.max(0,syncN+(on?1:-1)); $('brand').classList.toggle('sync', syncN>0); }
// Lettura del foglio: una sola richiesta per file alla volta, un secondo tentativo automatico se la prima non va,
// e niente nuova lettura se i dati sono stati letti da meno di FRESH_MS (cambiare pagina o file è immediato).
const FRESH_MS = 90000, inflight = {}, fetchedAt = {};
function fetchFile(f) {
  if (inflight[f]) return inflight[f];
  setSync(true);
  const once = () => call('getTrades', f);
  inflight[f] = once().catch(e => { if (e.message==='Chiave non valida') throw e; return new Promise(r=>setTimeout(r,1500)).then(once); })
    .then(d=>{ S.data[f]=d; cacheSet(f,d); fetchedAt[f]=Date.now(); return d; })
    .finally(()=>{ delete inflight[f]; setSync(false); });
  return inflight[f];
}
let warned=false;
async function load(quiet) {
  const f=S.file, have = S.data[f] || cacheGet(f);
  if (S.tab==='home') { const o=f==='EOW'?'Journal':'EOW'; if (!S.data[o]) S.data[o]=cacheGet(o); if (!fetchedAt[o] || Date.now()-fetchedAt[o]>FRESH_MS) fetchFile(o).then(()=>{ if (S.tab==='home' && !S.sheet) renderCurrent(true); }).catch(()=>{}); }
  if (have) { S.data[f]=have; applyData(have); renderCurrent(!!quiet); } else { S.loaded=false; renderCurrent(); }
  const before = have ? JSON.stringify(have) : '';
  if (have && Date.now()-(fetchedAt[f]||0) < FRESH_MS) return;   // appena letti: niente nuova richiesta
  try {
    const d = await fetchFile(f);
    $('brand').classList.remove('stale');
    if (S.file===f && JSON.stringify(d)!==before) { applyData(d); if (S.sheet!=='form') renderCurrent(!!have); }
  } catch(e) {
    if (have) { $('brand').classList.add('stale'); if (!warned) { warned=true; toast('Foglio lento a rispondere: uso i dati salvati e riprovo più tardi'); } setTimeout(()=>{ if (S.file===f) { fetchedAt[f]=0; fetchFile(f).then(d=>{ $('brand').classList.remove('stale'); if (JSON.stringify(d)!==before && S.file===f && S.sheet!=='form') { applyData(d); renderCurrent(true); } }).catch(()=>{}); } }, 20000); }
    else if (S.file!==f) {}
    else if (!viaScript() && e.message==='NETWORK') { $('v-'+S.tab).innerHTML = emptyState('Lo script non risponde', 'Apri l\'URL /exec nel browser: deve comparire {"ok":true,…}. Se chiede di accedere a Google o mostra un errore, il deployment non è «Chiunque» o non usa il Code.gs nuovo.')+'<button class="btn sec" type="button" data-act="setup">Controlla indirizzo e chiave</button>'; }
    else { toast('Non riesco a leggere il foglio: '+(e.message||e), true); $('v-'+S.tab).innerHTML = emptyState('Foglio non raggiungibile', 'Controlla gli ID in Code.gs e i permessi, poi ricarica la pagina.'); }
  }
  const o = f==='EOW' ? 'Journal' : 'EOW';   // precarica l'altro file, così il cambio è immediato
  if (!fetchedAt[o]) { if (!S.data[o]) S.data[o]=cacheGet(o); setTimeout(()=>fetchFile(o).then(()=>{ if (S.tab==='home' && !S.sheet) renderCurrent(true); }).catch(()=>{}), S.tab==='home' ? 0 : 1200); }   // la Panoramica usa subito entrambi i file   // dopo, per non rallentare il file aperto
}
const emptyState = (t, p, btn) => '<div class="card empty rise">'+logo(40)+'<div class="h2">'+t+'</div><p>'+p+'</p>'+(btn?'<button class="btn" type="button" data-act="new">'+ic('plus',18,2.2)+btn+'</button>':'')+'</div>';

// ───────────────────────── FILTRI (condivisi da Home, Trade, Analisi e Simula) ─────────────────────────
// All'apertura dell'app i filtri partono sempre da qui; poi ogni file (EOW / Journal) tiene i suoi finché l'app resta aperta
// filtri di partenza: l'EOW segue le impostazioni (asset, piano, idee); il Journal parte senza filtri (ES e NQ, tutti i trade, tutte le idee)
const FILT_DEF = f => (f||S.file)==='Journal' ? { asset:'', plan:'', tgt:2, idea:[] } : { asset:CFG.asset, plan:CFG.plan, tgt:2, idea:L.idea.filter(i=>!CFG.exIdea.includes(i)) };
function loadFilt() { let v=null; try { v=JSON.parse(sessionStorage.getItem('tj.filtBy2')||'null'); } catch(e) {}
  return v && v.EOW && v.Journal ? v : { EOW:FILT_DEF('EOW'), Journal:FILT_DEF('Journal') }; }
const saveFilt = () => { S.filtBy[S.file]=S.filt; try { sessionStorage.setItem('tj.filtBy2', JSON.stringify(S.filtBy)); } catch(e) {} };
const tgt = () => S.type==='EOW' ? (+S.filt.tgt || 2) : 2;
const curModel = () => model(tgt());
function plan(ts, rOf) { // max 2 trade al giorno, stop dopo il primo trade positivo
  const out=[]; let day='', n=0, stop=false;
  ts.forEach(t=>{ const k=t.d.toDateString(); if (k!==day){ day=k; n=0; stop=false; } if (stop||n>=2) return; out.push(t); n++; if (rOf(t)>0) stop=true; });
  return out;
}
function filtered(m, noPer) {
  const F=S.filt; m=m||curModel();
  let ts=all().filter(t=>
    (!F.asset||t.a===F.asset) && (!(F.idea&&F.idea.length)||F.idea.includes(t.idea)) && (!(F.smt&&F.smt.length)||F.smt.includes(t.smt)) &&
    (!F.lvn||t.lvn===F.lvn) && (!F.clean||(F.clean==='Sì')===t.clean) && (!F.band||bandOf(t)===F.band) && (!F.dir||t.dir===F.dir));
  if (!noPer && S.per!=='all') ts=inRange(ts, periodRange(S.per,0));
  if (F.plan==='max2') ts=plan(ts, m.rOf);
  return ts;
}
// il periodo è lo stesso ovunque: la barra Sett./Mese/3M/Anno/Tutto della Panoramica e il «Periodo» dei filtri
function perLabel() { const now=new Date(), cr=S.per==='c'?periodRange('c',0):null;
  return { w:wkLbl(), m:MESI_F[now.getMonth()].replace(/^./,c=>c.toUpperCase())+' '+now.getFullYear(), '3m':'Ultimi 3 mesi', y:'Anno '+now.getFullYear(), all:'Tutto',
    c: cr && cr[0].getFullYear()>2000 ? fmtIt(iso(cr[0]))+' → '+fmtIt(iso(addDays(cr[1],-1))) : 'Date da scegliere' }[S.per]; }
function setPer(v) { S.per=v; store.set('per',v); }
function activeFilters() { const F=S.filt, a=[];
  if (F.plan==='max2') a.push({k:'plan', l:'Max 2 trade al giorno'});
  if (F.asset) a.push({k:'asset', l:F.asset});
  if (F.dir) a.push({k:'dir', l:F.dir});
  if (S.type==='EOW' && tgt()!==2) a.push({k:'tgt', l:'Target '+tgt()+'R'});
  if (S.per!=='all' && S.tab!=='home' && S.tab!=='cal') a.push({k:'per', l:perLabel()});   // in Panoramica c'è già la barra del periodo
  if (F.band) a.push({k:'band', l:F.band}); if (F.lvn) a.push({k:'lvn', l:'LVN '+(F.lvn==='Si'?'sì':'no')});
  if (F.clean) a.push({k:'clean', l:'1m clean '+F.clean.toLowerCase()});
  const sm=F.smt||[]; if (sm.length) a.push({k:'smt', l:sm.length===1?sm[0]:'SMT: '+sm.map(x=>x==='No SMT'?'nessuna':x.replace('SMT a ','a ')).join(' o ')});
  const id=F.idea||[]; if (id.length>2) a.push({k:'idea', l:'Idee: '+id.length+' su '+L.idea.length}); else id.forEach(i=>a.push({k:'idea:'+i, l:i}));
  return a; }
function fbar(d) {
  const af=activeFilters();
  return '<div class="fbar rise" style="--d:'+(d||0)+'ms"><button type="button" class="fbtn" data-act="filters">'+ic('filter',17,2)+'Filtri'+(af.length?'<em>'+af.length+'</em>':'')+'</button>'+
    af.map(x=>'<button type="button" class="fchip" data-rm="'+esc(x.k)+'">'+esc(x.l)+ic('x',13,2.4)+'</button>').join('')+'</div>';
}
function removeFilter(k) { const F=S.filt;
  if (k.indexOf('idea:')===0) F.idea=(F.idea||[]).filter(x=>x!==k.slice(5));
  else if (k==='idea'||k==='smt') F[k]=[]; else if (k==='per') setPer('all'); else if (k==='tgt') F.tgt=2; else F[k]='';
  saveFilt(); renderCurrent(true);
}
function openFilters() {
  S.sheet='filt'; $('sh-sub').textContent=S.file+' · valgono per tutte le pagine'; $('sh-title').innerHTML=words('Filtri'); renderFilters(); openSheet();
}
function renderFilters() {
  const F=S.filt, E=S.type==='EOW';
  let h='<div class="fsec"><div class="field"><span class="flabel">Trading plan</span>'+seg('f-plan',[{v:'max2',l:'Max 2 trade al giorno'},{v:'',l:'Nessuno'}],F.plan||'')+
        '<span class="hint">Max 2 trade al giorno: dopo il primo trade in profitto la giornata si chiude.</span></div>'+
        (E?'<div class="field"><span class="flabel">Target (esito del trade)</span>'+seg('f-tgt',[1,2,3,4,5].map(k=>({v:k,l:k+'R'})),tgt())+'</div>':'')+'</div>';
  h+='<div class="fsec"><div class="flabel">Periodo · lo stesso della barra in Panoramica</div>'+chips('quick',[{v:'all',l:'Tutto'},{v:'w',l:wkLbl()},{v:'m',l:'Questo mese'},{v:'3m',l:'Ultimi 3 mesi'},{v:'y',l:'Quest\'anno'},{v:'c',l:'Date'}],S.per).replace('class="chips"','class="chips scrollx"')+
        '<div class="g2"><div class="field"><label for="ff-from">Dal</label><input class="inp" id="ff-from" type="date" data-fk="from" value="'+esc(S.per==='c'?S.cust.from||'':'')+'"></div><div class="field"><label for="ff-to">Al</label><input class="inp" id="ff-to" type="date" data-fk="to" value="'+esc(S.per==='c'?S.cust.to||'':'')+'"></div></div></div>';
  h+='<div class="fsec"><div class="field"><span class="flabel">Asset</span>'+seg('f-asset',[{v:'',l:'Tutti'},'ES','NQ'],F.asset||'')+'</div>'+
     (hasCol('Direzione')?'<div class="field"><span class="flabel">Direzione</span>'+seg('f-dir',[{v:'',l:'Tutte'},...L.dir],F.dir||'')+'</div>':'')+
     '<div class="field"><span class="flabel">Idea 5m · anche più di una</span>'+chips('f-idea',L.idea,F.idea||[],true)+'</div>'+
     (hasCol('SMT')?'<div class="field"><span class="flabel">SMT · anche più di una</span>'+chips('f-smt',L.smt,F.smt||[],true)+'</div>':'')+
     '<div class="field"><span class="flabel">Fascia oraria</span>'+chips('f-band',[{v:'',l:'Tutte'},...L.bands.map(b=>b[0])],F.band||'')+'</div>'+
     '<div class="g2"><div class="field"><span class="flabel">Coming from LVN</span>'+seg('f-lvn',[{v:'',l:'Tutti'},{v:'Si',l:'Sì'},'No'],F.lvn||'')+'</div>'+
     '<div class="field"><span class="flabel">1m clean</span>'+seg('f-clean',[{v:'',l:'Tutti'},'Sì','No'],F.clean||'')+'</div></div></div>';
  $('sh-body').innerHTML=h; stagger(); filtFoot();
}
function filtFoot() { const n=filtered().length;
  $('sh-foot').innerHTML='<button type="button" class="btn sec" data-act="freset">Predefiniti</button><button type="button" class="btn" style="flex:1" data-act="close">Mostra '+n+' trade</button>'; }
function filtClick(b) {
  const sg=b.closest('[data-seg]'), ch=b.closest('[data-chips]'), F=S.filt;
  if (sg) { const k=sg.dataset.seg.slice(2); F[k]= k==='tgt' ? +b.dataset.v : b.dataset.v; setSeg(sg,b.dataset.v); }
  else if (ch) { const k=ch.dataset.chips, v=b.dataset.v;
    if (k==='quick') { setPer(v); renderFilters(); renderCurrent(true); return; }
    if (ch.dataset.multi) { const f=k.slice(2), a=F[f]||[]; F[f]=a.includes(v)?a.filter(x=>x!==v):[...a,v]; b.classList.toggle('on'); }
    else { F[k.slice(2)]=v; ch.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', c===b)); } }
  saveFilt(); filtFoot(); renderCurrent(true);
}


// questo file è stato letto tutto: versione (la scrive tools/build.py)
EB_V['core.js'] = '2026-10-30.1';

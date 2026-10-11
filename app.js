(()=>{'use strict';
const $=s=>document.querySelector(s),cfg=window.TET_CONFIG||{},subjects=['All','Hindi Content','Hindi Language','English','CDP'];
let topics=[],selected='All',lastLoaded=0,loading=false,seq=0;
const CACHE_KEY='special_tet_2026_directory_v9';
let loadedFromNetwork=false, fallbackStarted=false;
function saveCache(data){try{localStorage.setItem(CACHE_KEY,JSON.stringify({time:Date.now(),data}))}catch(_){}}
function restoreCache(){try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(c&&c.data&&Array.isArray(c.data.topics)){receive(c.data,true);return true}}catch(_){}return false}
function warmQuiz(url){try{const origin=new URL(url).origin;if(![...document.querySelectorAll('link[data-warm]')].some(l=>l.dataset.warm===origin)){const link=document.createElement('link');link.rel='preconnect';link.href=origin;link.dataset.warm=origin;document.head.appendChild(link)}}catch(_){}}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').replace(/[•·]/g,'').replace(/[–—−]/g,'-').replace(/\s+/g,' ').trim().toUpperCase();
function subject(t){const s=norm(t.subject||t.topic);if(s.includes('HINDI CONTENT'))return 'Hindi Content';if(s.includes('HINDI LANGUAGE'))return 'Hindi Language';if(s.includes('ENGLISH'))return 'English';if(s.includes('CDP'))return 'CDP';return 'Other'}
const icons={'Hindi Content':'📕','Hindi Language':'🗣️','English':'🔤','CDP':'🧠'};
function notice(msg){$('#notice').hidden=!msg;$('#notice').textContent=msg||''}
function render(){const q=$('#search').value.toLowerCase().trim();$('#subjects').innerHTML=subjects.map(s=>`<button class="tab ${s===selected?'active':''}" data-subject="${esc(s)}" aria-pressed="${s===selected}">${esc(s)}${s==='All'?'':`<span class="count">${topics.filter(t=>subject(t)===s).length}</span>`}</button>`).join('');
 const visible=topics.filter(t=>(selected==='All'||subject(t)===selected)&&(`${t.topic} ${t.range} ${subject(t)}`).toLowerCase().includes(q));
 $('#cards').innerHTML=visible.map(t=>{const i=topics.indexOf(t),s=subject(t);return `<article class="card"><div class="cardtop"><span class="tag">${esc(s)}</span><span class="cardicon">${icons[s]||'📖'}</span></div><h3>${esc(t.range||t.topic)}</h3><p title="${esc(t.topic)}">${esc(t.topic)}</p><div class="cardbuttons"><button class="quizbtn full" data-index="${i}" data-mode="full" ${t.fullUrl?'':'disabled title="Full quiz link missing"'}>📚 Full Quiz</button><button class="quizbtn short" data-index="${i}" data-mode="short" ${t.shortUrl?'':'disabled title="15-question link missing from short quiz sheet"'}>⚡ 15 MCQs</button></div></article>`}).join('')||'<div class="empty">No matching topics found. Try another subject or search.</div>';
 $('#status').textContent=`${topics.length} topic sets · ${topics.filter(t=>t.fullUrl).length} full quizzes · ${topics.filter(t=>t.shortUrl).length} short quizzes`;
}
function receive(data,fromCache=false){if(!data||!Array.isArray(data.topics)){notice('Directory returned an unexpected response. Check Apps Script deployment.');return}
 const byKey=new Map();data.topics.forEach(t=>{const s=subject(t),m=norm(t.topic).match(/(\d+)\s*-\s*(\d+)/);if(s==='Other'||!m)return;const key=s+'|'+m[1]+'-'+m[2];const old=byKey.get(key)||{topic:t.topic,subject:s,range:m[1]+'–'+m[2],fullUrl:'',shortUrl:''};if(/^https:\/\//.test(t.fullUrl||''))old.fullUrl=t.fullUrl;if(/^https:\/\//.test(t.shortUrl||''))old.shortUrl=t.shortUrl;byKey.set(key,old)});
 topics=[...byKey.values()];lastLoaded=Date.now();render();if(!fromCache){saveCache(data);loadedFromNetwork=true;}notice('');
 
}
function fetchDirectory(force=false){if(loading)return;const api=cfg.DIRECTORY_API_URL;if(!/^https:\/\//.test(api||'')){notice('Set DIRECTORY_API_URL in config.js.');return}loading=true;$('#refresh').disabled=true;if(!topics.length)$('#status').textContent='Loading practice sets…';
 const callback='tetDirectory_'+(++seq);const script=document.createElement('script');let settled=false;
 const finish=()=>{loading=false;$('#refresh').disabled=false;delete window[callback];script.remove()};
 window[callback]=data=>{if(settled)return;settled=true;receive(data);finish()};
 script.onerror=()=>{if(settled)return;settled=true;finish();trySheetFallback()};
 const u=new URL(api);u.searchParams.set('callback',callback);if(force){u.searchParams.set('refresh','1');u.searchParams.set('_',String(Date.now()))}script.src=u.toString();document.head.appendChild(script);
 setTimeout(()=>{if(!settled){settled=true;finish();trySheetFallback()}},8000);
}
// Independent public Google Sheets fallback for new Chrome profiles and mobile.
// Uses Google's JSONP-style visualization response, no CORS fetch required.
function trySheetFallback(){
 if(fallbackStarted||loadedFromNetwork)return;
 fallbackStarted=true;
 const sources=[
  {id:'13_sso_2s96ROaAuZ_yzsITDam7b-9U1dsNQU3v-6nWQ',field:'fullUrl'},
  {id:'1fjDQP6pHKolHBTFFeyvayWP4PNFhgp3RwgHMB9I66Ng',gid:'2120404683',field:'shortUrl'}
 ];
 let completed=0;const combined=[];
 const previous=window.google&&window.google.visualization&&window.google.visualization.Query&&window.google.visualization.Query.setResponse;
 window.google=window.google||{};window.google.visualization=window.google.visualization||{};
 window.google.visualization.Query=window.google.visualization.Query||{};
 const queue=[];
 window.google.visualization.Query.setResponse=function(response){
  const item=queue.shift();if(!item)return;
  try{
   if(response&&response.table){
    const rows=response.table.rows||[];
    const cellText=c=>String((c&&(c.f||c.v))||'').trim();
    rows.forEach(row=>{
     const cells=(row.c||[]).map(cellText);
     const topic=cells.find(x=>/^(?:[•·]\s*)?(HINDI CONTENT|HINDI LANGUAGE|ENGLISH|CDP)\b/i.test(x)&&/\d+\s*[-–—]\s*\d+/.test(x));
     const link=cells.map(x=>x.match(/https:\/\/[^\s"<>]+/i)).find(Boolean);
     if(topic&&link){const o={topic};o[item.field]=link[0];combined.push(o)}
    });
   }
  }catch(_){}
  completed++;
  if(combined.length){receive({topics:combined});}
  if(completed===sources.length&&!topics.length){
    $('#status').textContent='Practice sets could not be loaded';
    $('#cards').innerHTML='<div class="empty">The quiz directory is temporarily unavailable. Please try Refresh.</div>';
  }
 };
 sources.forEach(item=>{
  queue.push(item);
  const el=document.createElement('script');
  const url='https://docs.google.com/spreadsheets/d/'+item.id+'/gviz/tq?tqx=out:json'+(item.gid?'&gid='+item.gid:'')+'&headers=0';
  el.src=url;el.async=false;el.onerror=()=>{
   const pos=queue.indexOf(item);if(pos>=0)queue.splice(pos,1);
   completed++;if(completed===sources.length&&!topics.length){$('#status').textContent='Practice sets could not be loaded';$('#cards').innerHTML='<div class="empty">Unable to access the quiz directory. Check the Apps Script deployment permissions, then tap Refresh.</div>'}
  };
  document.head.appendChild(el);
 });
}
function openQuiz(t,mode){const url=mode==='full'?t.fullUrl:t.shortUrl;if(!/^https:\/\//.test(url||''))return;
 // Full-length Google Apps Script quizzes can fail inside mobile/tablet iframes.
 // Top-level navigation preserves the original URL, cookies and browser session.
 if(mode==='full' && (window.matchMedia('(max-width: 1024px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent))){window.location.assign(url);return;}$('#home').hidden=true;$('#player').hidden=false;$('#playerTitle').textContent=subject(t)+' · '+t.range;$('#playerMode').textContent=mode==='full'?'Full question set':'15-question practice';$('#external').href=url;$('#frameLoading').hidden=false;warmQuiz(url);
 const frame=$('#quizFrame');frame.onload=()=>{$('#frameLoading').hidden=true};frame.src=url;window.scrollTo({top:0,behavior:'instant'});
}
function closeQuiz(){const frame=$('#quizFrame');frame.onload=null;frame.src='about:blank';$('#player').hidden=true;$('#home').hidden=false;$('#frameLoading').hidden=true;}
$('#subjects').addEventListener('click',e=>{const b=e.target.closest('[data-subject]');if(b){selected=b.dataset.subject;render()}});
$('#cards').addEventListener('pointerover',e=>{const b=e.target.closest('[data-index]');if(b&&!b.disabled){const t=topics[Number(b.dataset.index)];if(t)warmQuiz(b.dataset.mode==='full'?t.fullUrl:t.shortUrl)}});
$('#cards').addEventListener('click',e=>{const b=e.target.closest('[data-index]');if(b&&!b.disabled)openQuiz(topics[Number(b.dataset.index)],b.dataset.mode)});
$('#search').addEventListener('input',render);$('#close').onclick=closeQuiz;$('#back').onclick=closeQuiz;$('#refresh').onclick=()=>{fallbackStarted=false;fetchDirectory(true);setTimeout(()=>{if(!loadedFromNetwork)trySheetFallback()},3500)};
$('#logo').onclick=e=>{if(!$('#player').hidden){e.preventDefault();closeQuiz()}};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#player').hidden)closeQuiz()});
if(!restoreCache()){fetchDirectory();setTimeout(()=>{if(!topics.length)trySheetFallback()},3500)}else setTimeout(()=>fetchDirectory(),1800);
})();

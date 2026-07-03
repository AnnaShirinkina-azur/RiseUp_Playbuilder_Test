
function $(i){return document.getElementById(i);}
function sv(i,v){const e=$(i);if(e)e.textContent=v;}
let currentOrientation='portrait';
function setOrientation(or){
  currentOrientation=or;
  const hidden=$('cfg-orientation'); if(hidden) hidden.value=or;
  ['orientation-main','orientation-preview','orientation-editor'].forEach(id=>{const w=$(id); if(!w)return; w.querySelectorAll('.orbtn').forEach(b=>b.classList.toggle('on',b.dataset.or===or));});
  $('phone')?.classList.toggle('landscape',or==='landscape');
  $('editor-phone')?.classList.toggle('landscape',or==='landscape');
  const lab=$('phone-label'); if(lab) lab.textContent=(or==='landscape'?'844×844':'390×844')+' · нажми Update Preview после изменений';
  if(window.RiseLevelEditor)RiseLevelEditor.resize();
}
document.addEventListener('click',e=>{const b=e.target.closest('.orbtn[data-or]'); if(b)setOrientation(b.dataset.or);});

// Luna-like inspector: left side is navigation, right side contains settings
(function initInspector(){
  const ws=document.querySelector('.ws'), sb=document.querySelector('.sb');
  if(!ws||!sb)return;
  const inspector=document.createElement('aside');
  inspector.className='inspector';
  inspector.innerHTML='<div class="inspector-head" id="inspector-title">Player</div>';
  ['panel-player','panel-speed','panel-obstacles-physics','panel-timing','panel-main-ball','panel-shield','panel-obstacles-visual','panel-environment','panel-stage-accents','panel-text-fonts','panel-sounds'].forEach(id=>{const el=$(id); if(el) inspector.appendChild(el);});
  const bbar=document.querySelector('.bbar'); if(bbar) inspector.appendChild(bbar);
  ws.appendChild(inspector);
})();

// left accordions and parameter navigation
document.querySelectorAll('.acc-head[data-acc]').forEach(b=>{
  b.addEventListener('click',()=>{
    b.classList.toggle('on');
    const body=$('acc-'+b.dataset.acc); if(body) body.classList.toggle('on');
  });
});
document.querySelectorAll('.tab[data-panel]').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.tab[data-panel]').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.inspector .pnl').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    const panel=$('panel-'+b.dataset.panel);
    if(panel) panel.classList.add('on');
    const t=$('inspector-title'); if(t)t.textContent=(panel&&panel.dataset.title)||b.textContent.trim();
  });
});

// right tabs
document.querySelectorAll('.rtab[data-rt]').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.rtab[data-rt]').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    $('rp-preview').style.display=b.dataset.rt==='preview'?'':'none';
    $('rp-levels').classList.toggle('on',b.dataset.rt==='levels');
    if(b.dataset.rt==='levels')LE.resize();
  });
});

// sprites
function loadSpr(key,inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    RiseBuilder.setSprite(key,e.target.result);
    document.querySelectorAll(`[id="th-${key}"],[id="th-${key}-visuals"],[id="th-${key}-level"]`).forEach(th=>th.innerHTML=`<img src="${e.target.result}">`);
    if(window.RiseLevelEditor)RiseLevelEditor.draw();
  };
  r.readAsDataURL(f);
}
function clearSpr(key){
  RiseBuilder.setSprite(key,null);
  document.querySelectorAll(`[id="th-${key}"],[id="th-${key}-visuals"],[id="th-${key}-level"]`).forEach(th=>{th.innerHTML=key==='player'?'<img src="Assets/textures/balloon.png" alt="balloon">':key==='shield'?'<img src="Assets/textures/controller.png" alt="controller">':key.indexOf('background')===0?'🖼️':'⬛';});
  if(window.RiseLevelEditor)RiseLevelEditor.draw();
}

// ── Sounds ──────────────────────────────────────────────────────────────────
const SND_DEFAULTS={bgm:'Assets/audio/bgm.wav',win:'Assets/audio/sfx_win.wav',lose:'Assets/audio/sfx_lose.wav',hit:'Assets/audio/sfx_wrong.wav',shield:'Assets/audio/sfx_correct.wav'};
const SND_ICON={bgm:'🎵',win:'🏆',lose:'💀',hit:'💥',shield:'🛡️'};
let sndPreview=null;
function loadSnd(key,inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    RiseBuilder.setSprite('audio_'+key,e.target.result);
    const th=$('th-audio-'+key);if(th){th.textContent='✔';th.title=f.name;th.style.color='var(--acc)';}
  };
  r.readAsDataURL(f);
  inp.value='';
}
function clearSnd(key){
  RiseBuilder.setSprite('audio_'+key,null);
  const th=$('th-audio-'+key);if(th){th.textContent=SND_ICON[key]||'🔊';th.title='';th.style.color='';}
}
function playSnd(key){
  try{if(sndPreview){sndPreview.pause();sndPreview=null;}}catch(e){}
  const sp=RiseBuilder.getSprites();
  const src=sp['audio_'+key]||SND_DEFAULTS[key];
  const volEl=$('cfg-vol-'+key), master=parseFloat($('cfg-soundVolume')?.value)||0;
  sndPreview=new Audio(src);
  sndPreview.volume=Math.max(0,Math.min(1,(volEl?parseFloat(volEl.value):1)*master));
  sndPreview.play().catch(()=>{});
}
function getStageCount(){
  const e=$('cfg-stageCount');
  return Math.max(1,Math.min(20,parseInt(e&&e.value,10)||5));
}

function renderStageAssetRows(){
  const n=getStageCount();
  const st=$('stg-sprs');
  if(st){
    let h='';
    for(let i=0;i<n;i++){
      const k='obstacle_stage'+i;
      h+=`<div class="sp-row" style="padding:3px 0;"><div class="sp-up">
        <div class="thumb" id="th-${k}" style="width:30px;height:30px;font-size:12px;">⬛</div>
        <span style="font-size:12px;color:var(--dim);min-width:48px;">Mini ${i+1}</span>
        <label class="ul-btn" style="font-size:11px;">+ PNG<input type="file" accept="image/*" style="display:none" onchange="loadSpr('${k}',this)"></label>
        <button class="x-btn" style="padding:3px 5px;" onclick="clearSpr('${k}')">✕</button>
      </div></div>`;
    }
    st.innerHTML=h;
  }
}
renderStageAssetRows();

// ── Per-level backgrounds ─────────────────────────────────────────────────
const BG_GRAD_DEFAULTS=[['#39a2d8','#69c5ec'],['#ef5350','#f97f6f'],['#b03c02','#cc4a05'],['#f0a44c','#f9c178'],['#ee4630','#fa6a4b']]; // [нижний, верхний]
function bgStageLabel(i,total){return i===0?'Start':(i===total-1?'Finish':'Mini '+i);}
function renderBgStageRows(){
  const box=$('bg-stage-rows');if(!box)return;
  const total=getStageCount()+2; // Start + minis + Finish
  // preserve already chosen gradient colors across re-render
  const keep={};box.querySelectorAll('input[type=color]').forEach(e=>keep[e.id]=e.value);
  let h='';
  for(let i=0;i<total;i++){
    const k='bg_stage'+i,d=BG_GRAD_DEFAULTS[i%BG_GRAD_DEFAULTS.length];
    const a=keep['cfg-bgg'+i+'a']||d[0],b=keep['cfg-bgg'+i+'b']||d[1],t=keep['cfg-bgt'+i]||'#ffffff';
    h+=`<div class="sp-row" style="padding:3px 0;"><div class="sp-up">
      <div class="thumb" id="th-${k}" style="width:30px;height:30px;font-size:12px;">🖼️</div>
      <span style="font-size:12px;color:var(--dim);min-width:48px;">${bgStageLabel(i,total)}</span>
      <label class="ul-btn" style="font-size:11px;">+ PNG<input type="file" accept="image/*" style="display:none" onchange="loadSpr('${k}',this)"></label>
      <button class="x-btn" style="padding:3px 5px;" onclick="clearSpr('${k}')">✕</button>
      <input type="color" id="cfg-bgg${i}a" value="${a}" title="Нижний цвет градиента">
      <input type="color" id="cfg-bgg${i}b" value="${b}" title="Верхний цвет градиента">
      <input type="color" id="cfg-bgt${i}" value="${t}" title="Тинт картинки уровня (белый = без тинта)" style="margin-left:6px;">
    </div></div>`;
  }
  box.innerHTML=h;
  // restore uploaded thumbnails
  const sp=RiseBuilder.getSprites();
  for(let i=0;i<total;i++){const k='bg_stage'+i;if(sp[k]){const th=$('th-'+k);if(th)th.innerHTML=`<img src="${sp[k]}">`;}}
  box.querySelectorAll('input[type=color]').forEach(e=>{const redraw=()=>{if(window.RiseLevelEditor)RiseLevelEditor.draw();};e.addEventListener('input',redraw);e.addEventListener('change',redraw);});
}
renderBgStageRows();
function getBgMode(){const e=$('cfg-backgroundMode');return (e&&e.value)||'perStage';}
function setBgMode(m){
  const e=$('cfg-backgroundMode');if(e)e.value=m;
  const bar=$('bg-mode-bar');if(bar)bar.querySelectorAll('.orbtn').forEach(b=>b.classList.toggle('on',b.dataset.bgmode===m));
  const ps=$('bg-perstage-box'),sg=$('bg-single-box');
  if(ps)ps.style.display=m==='perStage'?'':'none';
  if(sg)sg.style.display=m==='common'?'':'none';
  if(window.RiseLevelEditor)RiseLevelEditor.draw();
  // авто-обновляем превью, чтобы смена режима была видна сразу
  const pb=$('btn-prev');if(pb&&!pb.disabled)pb.click();
}
// прямые слушатели на кнопки + делегирование (на случай перерисовки панели)
document.querySelectorAll('.orbtn[data-bgmode]').forEach(b=>b.addEventListener('click',()=>setBgMode(b.dataset.bgmode)));
document.addEventListener('click',e=>{const b=e.target.closest('.orbtn[data-bgmode]');if(b&&!b.__bgBound)setBgMode(b.dataset.bgmode);});
document.querySelectorAll('.orbtn[data-bgmode]').forEach(b=>b.__bgBound=true);
setBgMode(getBgMode()); // синхронизируем видимость блоков при загрузке
window.RiseBgUI={getBgMode,renderBgStageRows,BG_GRAD_DEFAULTS};
$('cfg-seamScale')?.addEventListener('input',()=>{if(window.RiseLevelEditor)RiseLevelEditor.draw();});
['cfg-stageAccents','cfg-stage0','cfg-stage1','cfg-stage2','cfg-stage3','cfg-stage4','cfg-bgSpriteColor'].forEach(id=>{const e=$(id);if(!e)return;const redraw=()=>{if(window.RiseLevelEditor)RiseLevelEditor.draw();};e.addEventListener('input',redraw);e.addEventListener('change',redraw);});

function googleFontFamilyFromUrl(url){
  url=String(url||'').trim();
  if(!url)return '';
  try{
    const u=new URL(url);
    let fam=u.searchParams.get('family');
    if(fam)return fam.split(':')[0].replace(/\+/g,' ').trim();
    const parts=u.pathname.split('/').filter(Boolean);
    const specimen=parts.indexOf('specimen');
    if(specimen>=0&&parts[specimen+1])return decodeURIComponent(parts[specimen+1]).replace(/\+/g,' ').trim();
  }catch(e){}
  return '';
}
function googleFontCssUrl(url,family){
  url=String(url||'').trim(); family=String(family||'').trim();
  if(!url&&family)url='https://fonts.googleapis.com/css2?family='+encodeURIComponent(family).replace(/%20/g,'+')+':wght@400;500;600;700;800&display=swap';
  try{
    const u=new URL(url);
    if(u.hostname==='fonts.google.com'){
      const fam=family||googleFontFamilyFromUrl(url);
      return fam?'https://fonts.googleapis.com/css2?family='+encodeURIComponent(fam).replace(/%20/g,'+')+':wght@400;500;600;700;800&display=swap':'';
    }
    if(u.hostname==='fonts.googleapis.com')return url;
  }catch(e){}
  return url;
}
function fontCssFamily(name){name=String(name||'').trim();return name.indexOf(' ')>=0?'"'+name.replace(/"/g,'')+'",sans-serif':name+',sans-serif';}
function syncGoogleFontOption(){
  const urlEl=$('cfg-googleFontUrl'), famEl=$('cfg-googleFontFamily'), st=$('cfg-googleFontStatus'), sel=$('tx-font');
  if(!urlEl||!famEl||!sel)return;
  let fam=famEl.value.trim()||googleFontFamilyFromUrl(urlEl.value);
  if(!fam){if(st)st.textContent='Не удалось определить family. Впишите название шрифта вручную.';return;}
  famEl.value=fam;
  const href=googleFontCssUrl(urlEl.value,fam);
  let link=document.getElementById('google-font-link');
  if(!link){link=document.createElement('link');link.id='google-font-link';link.rel='stylesheet';document.head.appendChild(link);}
  if(href)link.href=href;
  FONT_CSS[fam]=fontCssFamily(fam);
  let opt=[...sel.options].find(o=>o.value===fam);
  if(!opt){opt=document.createElement('option');opt.value=fam;opt.textContent=fam+' (Google)';sel.appendChild(opt);}
  if(st)st.textContent='Loaded: '+fam;
  if(document.fonts&&document.fonts.load)document.fonts.load('700 40px '+fontCssFamily(fam)).then(()=>{if(window.RiseLevelEditor)RiseLevelEditor.draw();}).catch(()=>{});
}
$('cfg-googleFontApply')?.addEventListener('click',syncGoogleFontOption);
$('cfg-googleFontUrl')?.addEventListener('change',syncGoogleFontOption);
$('cfg-googleFontFamily')?.addEventListener('change',syncGoogleFontOption);
function syncLocalFontOption(dataUrl){
  const famEl=$('cfg-localFontFamily'), st=$('cfg-localFontStatus'), sel=$('tx-font');
  const fam=(famEl&&famEl.value.trim())||'CustomFont';
  if(sel && !Array.from(sel.options).some(o=>o.value===fam)){const opt=document.createElement('option');opt.value=fam;opt.textContent=fam+' (local)';sel.appendChild(opt);}
  FONT_CSS[fam]=fontCssFamily(fam);
  if(dataUrl){
    let style=$('local-font-style');
    if(!style){style=document.createElement('style');style.id='local-font-style';document.head.appendChild(style);}
    style.textContent='@font-face{font-family:"'+fam.replace(/"/g,'')+'";src:url("'+dataUrl+'")}';
    RiseBuilder.setSprite('custom_font',dataUrl);
    if(st)st.textContent='Loaded: '+fam;
    if(document.fonts)document.fonts.load('800 40px '+fontCssFamily(fam)).catch(()=>{});
  }
}
$('cfg-localFontFile')?.addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const famEl=$('cfg-localFontFamily');
  if(famEl && (!famEl.value || famEl.value==='CustomFont')) famEl.value=f.name.replace(/\.(ttf|otf|woff2?|font)$/i,'').replace(/[^a-zA-Z0-9 _-]/g,' ').trim()||'CustomFont';
  const r=new FileReader();r.onload=ev=>syncLocalFontOption(ev.target.result);r.readAsDataURL(f);
});
$('cfg-localFontFamily')?.addEventListener('change',()=>syncLocalFontOption());


// progress
function setP(p,msg){$('prog').classList.add('on');$('pf').style.width=(p*100)+'%';$('pm').textContent=msg||'';}
function hideP(){$('prog').classList.remove('on');}
function showErr(msg){const e=$('err');e.textContent='⚠ '+msg;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),6000);}

// download
$('btn-dl').addEventListener('click',async()=>{
  const b=$('btn-dl');b.disabled=true;
  $('sz').classList.remove('on');$('err').classList.remove('on');
  await RiseBuilder.buildAndDownload({
    assetsBase:'Assets',onProgress:setP,
    onDone:kb=>{hideP();const s=$('sz');s.textContent=(kb<5120?'✅':'⚠')+' '+kb+' KB';s.classList.add('on');b.disabled=false;},
    onError:msg=>{hideP();showErr(msg);b.disabled=false;}
  });
});

// preview
let iact=false;
function syncInteractButton(){
  $('phone').classList.toggle('iact',iact);
  $('btn-iact').textContent=iact?'🖱 Interact':'🔒 Lock';
  $('btn-iact').classList.toggle('on',iact);
}
$('btn-prev').addEventListener('click',async()=>{
  const b=$('btn-prev');b.disabled=true;b.textContent='⏳…';
  await RiseBuilder.buildPreview($('pif'),{assetsBase:'Assets',onProgress:setP,onError:showErr});
  hideP();b.disabled=false;b.textContent='▶ Update Preview';
});
$('btn-iact').addEventListener('click',()=>{iact=!iact;syncInteractButton();});
syncInteractButton();

// reset
const DEFS={
  'cfg-lives':3,'cfg-playerSize':2,'cfg-shieldSize':1,
  'cfg-gameSpeed':3.2,'cfg-acceleration':0.4,'cfg-pushForce':7,'cfg-gravityModifier':1,
  'cfg-scatterBounciness':0.35,'cfg-seamScale':1,
  'cfg-hpBarShowTime':2,'cfg-tutorialTime':3.5,
  'cfg-playerColor':'#ffffff','cfg-playerOutline':'#ffffff','cfg-playerSpriteColor':'#ffffff','cfg-playerRopeColor':'#ffffff',
  'cfg-shieldColor':'#4fc3f7','cfg-shieldSpriteColor':'#ffffff',
  'cfg-obstacleColor':'#e05252','cfg-obstacleColorAlt':'#5282e0','cfg-obstacleSpriteColor':'#ffffff',
  'cfg-bgColor':'#1a1a2e','cfg-groundColor':'#2a2a40','cfg-particleColor':'#f5e642','cfg-bgSpriteColor':'#ffffff',
  'cfg-stage0':'#e05252','cfg-stage1':'#52a0e0','cfg-stage2':'#52e08a',
  'cfg-stage3':'#e07d52','cfg-stage4':'#c052e0','cfg-stageAccents':true,'cfg-stageCount':5,'cfg-orientation':'portrait','cfg-googleFontUrl':'','cfg-googleFontFamily':'','cfg-localFontFamily':'CustomFont',
  'cfg-soundEnabled':true,'cfg-soundVolume':0.8,'cfg-vol-bgm':0.7,'cfg-vol-win':1,'cfg-vol-lose':1,'cfg-vol-hit':1,'cfg-vol-shield':0.9
};
$('btn-reset').addEventListener('click',()=>{
  Object.entries(DEFS).forEach(([id,v])=>{const e=$(id);if(!e)return;if(e.type==='checkbox'){e.checked=!!v;e.dispatchEvent(new Event('change'));}else{e.value=v;e.dispatchEvent(new Event('input'));}});
  setOrientation('portrait');
  ['bgm','win','lose','hit','shield'].forEach(clearSnd);
  const l=document.getElementById('google-font-link'); if(l)l.remove();
});

setOrientation('portrait');
// placeholder
$('pif').srcdoc=`<!DOCTYPE html><html><head><style>*{margin:0;padding:0}html,body{width:100%;height:100%;background:#0d0d14;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;font-family:system-ui;color:rgba(232,232,240,.4);font-size:13px}</style></head><body><div style="font-size:44px">🎈</div><div style="font-weight:600;color:rgba(232,232,240,.65)">Rise Playable</div><div>Нажми ▶ Update Preview</div></body></html>`;

// ── Level Editor ──────────────────────────────────────────────────────────
const LE=(function(){
  let NS=getStageCount();
  let GW=390,GH=844;
  let zoom=parseFloat($('le-zoom')?.value)||0.55;
  let autoFitZoom=true;
  let cur=0,sel=null,mode='add',shape='rect',customShape=null,drag=false,doff={x:0,y:0},scaleRef=null;
  let showZones=true;
  // Active zone = central square the level should fit into (design units, square).
  // Passive zone = the screen extension around it: vertical bands in portrait,
  // horizontal bands in landscape. Purely a visual guide — placement is not restricted.
  const ACTIVE_W=1020,ACTIVE_H=1020;
  let customShapeImageSrc=null,customShapeSvgPoints=null,customShapePrefabItems=null;
  const svgTemplates=[];
  let selectedTemplateId=null;
  const lvls=Array.from({length:NS+2},()=>[]);
  const cv=$('ec'),ctx=cv.getContext('2d'),wrap=$('ec-wrap');

  const imageCache=new Map();
  function getEditorImage(src){if(!src)return null;if(imageCache.has(src))return imageCache.get(src);const im=new Image();im.onload=()=>draw();im.onerror=()=>draw();im.src=src;imageCache.set(src,im);return im;}
  function imageReady(im){return im&&im.complete&&im.naturalWidth>0;}

  function syncStageInputs(n){
    n=Math.max(1,Math.min(20,parseInt(n,10)||1));
    const a=$('le-stage-count'),b=$('cfg-stageCount');
    if(a)a.value=n;if(b){b.value=n;b.dispatchEvent(new Event('input',{bubbles:true}));}
    return n;
  }
  function setStageCount(n){
    n=syncStageInputs(n);
    NS=n;
    const total=n+2;
    while(lvls.length<total)lvls.push([]);
    if(lvls.length>total)lvls.length=total;
    if(cur>=total)cur=total-1;
    renderStageAssetRows();
    renderBgStageRows();
    sel=null;resize(true);
  }

  function parseNumList(str){return (str.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/ig)||[]).map(Number);}
  function normalizePts(pts){
    if(!pts||pts.length<3)throw new Error('SVG does not contain enough points.');
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    pts.forEach(p=>{minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);});
    const w=maxX-minX||1,h=maxY-minY||1;
    return pts.map(p=>({x:(p.x-minX)/w-.5,y:(p.y-minY)/h-.5}));
  }
  function parsePathPoints(d){
    const nums=parseNumList(d);const pts=[];
    for(let i=0;i+1<nums.length;i+=2)pts.push({x:nums[i],y:nums[i+1]});
    return pts;
  }
  function parseSvgPoints(svgText){
    const doc=new DOMParser().parseFromString(svgText,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw new Error('Invalid SVG.');
    let pts=[];
    const poly=doc.querySelector('polygon,polyline');
    if(poly){const a=parseNumList(poly.getAttribute('points')||'');for(let i=0;i+1<a.length;i+=2)pts.push({x:a[i],y:a[i+1]});return normalizePts(pts);}
    const path=doc.querySelector('path[d]');
    if(path){pts=parsePathPoints(path.getAttribute('d')||'');if(pts.length>=3)return normalizePts(pts);}
    const r=doc.querySelector('rect');
    if(r){const x=parseFloat(r.getAttribute('x')||0),y=parseFloat(r.getAttribute('y')||0),w=parseFloat(r.getAttribute('width')||1),h=parseFloat(r.getAttribute('height')||1);return normalizePts([{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]);}
    const c=doc.querySelector('circle,ellipse');
    if(c){const cx=parseFloat(c.getAttribute('cx')||0),cy=parseFloat(c.getAttribute('cy')||0),rx=parseFloat(c.getAttribute('r')||c.getAttribute('rx')||1),ry=parseFloat(c.getAttribute('r')||c.getAttribute('ry')||rx);for(let i=0;i<24;i++){const a=Math.PI*2*i/24;pts.push({x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry});}return normalizePts(pts);}
    throw new Error('Supported SVG: polygon, polyline, path, rect, circle, ellipse.');
  }
  function parseSvgPrefabItems(svgText){
    const doc=new DOMParser().parseFromString(svgText,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw new Error('Invalid SVG.');
    const svg=doc.documentElement;
    let rootX=0,rootY=0,rootW=parseFloat(svg.getAttribute('width')||0),rootH=parseFloat(svg.getAttribute('height')||0);
    const vb=(svg.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
    if(vb.length>=4&&vb.every(Number.isFinite)){rootX=vb[0];rootY=vb[1];rootW=vb[2];rootH=vb[3];}
    if(!rootW||!rootH){rootW=1;rootH=1;}
    function mul(m,n){return [m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];}
    function parseTransform(str){
      let m=[1,0,0,1,0,0];
      String(str||'').replace(/(matrix|translate|scale|rotate)\(([^)]*)\)/g,(all,cmd,args)=>{
        const a=parseNumList(args);let t=[1,0,0,1,0,0];
        if(cmd==='matrix'&&a.length>=6)t=[a[0],a[1],a[2],a[3],a[4],a[5]];
        else if(cmd==='translate')t=[1,0,0,1,a[0]||0,a.length>1?a[1]:0];
        else if(cmd==='scale')t=[a[0]||1,0,0,a.length>1?a[1]:(a[0]||1),0,0];
        else if(cmd==='rotate'){
          const ang=(a[0]||0)*Math.PI/180,co=Math.cos(ang),si=Math.sin(ang),cx=a[1]||0,cy=a[2]||0;
          t=mul(mul([1,0,0,1,cx,cy],[co,si,-si,co,0,0]),[1,0,0,1,-cx,-cy]);
        }
        m=mul(m,t);
      });
      return m;
    }
    function applyM(m,p){return{x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]};}
    function matrixFor(el){
      let chain=[],n=el;
      while(n&&n.nodeType===1&&n!==svg){chain.unshift(n);n=n.parentNode;}
      return chain.reduce((m,node)=>mul(m,parseTransform(node.getAttribute('transform'))),[1,0,0,1,0,0]);
    }
    function bbox(points){
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      points.forEach(p=>{minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);});
      return {x:minX,y:minY,w:(maxX-minX)||1,h:(maxY-minY)||1};
    }
    const items=[];
    function elColor(el){
      const val=(el.getAttribute('fill')||el.style&&el.style.fill||'').trim();
      if(/^#[0-9a-f]{3,8}$/i.test(val))return val;
      const st=(el.getAttribute('style')||'').match(/(?:^|;)\s*fill\s*:\s*(#[0-9a-f]{3,8})/i);
      return st?st[1]:null;
    }
    function addItem(shape,x,y,w,h,points,color){
      if(!isFinite(x)||!isFinite(y)||!isFinite(w)||!isFinite(h)||w<=0||h<=0)return;
      items.push({shape:shape||'rect',dx:((x+w/2)-(rootX+rootW/2))/rootW,dy:((y+h/2)-(rootY+rootH/2))/rootH,wRel:w/rootW,hRel:h/rootH,points:points||null,color:color||null});
    }
    doc.querySelectorAll('rect').forEach(r=>{
      const x=parseFloat(r.getAttribute('x')||0),y=parseFloat(r.getAttribute('y')||0),w=parseFloat(r.getAttribute('width')||1),h=parseFloat(r.getAttribute('height')||1);
      const m=matrixFor(r),bb=bbox([{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}].map(p=>applyM(m,p)));
      // Keep SVG rects as rect obstacles. Prefab mode preserves each element's own shape and its position inside the SVG viewBox.
      addItem('rect',bb.x,bb.y,bb.w,bb.h,null,elColor(r));
    });
    doc.querySelectorAll('circle,ellipse').forEach(c=>{
      const cx=parseFloat(c.getAttribute('cx')||0),cy=parseFloat(c.getAttribute('cy')||0),rx=parseFloat(c.getAttribute('r')||c.getAttribute('rx')||1),ry=parseFloat(c.getAttribute('r')||c.getAttribute('ry')||rx);
      const m=matrixFor(c),pts=[];for(let i=0;i<24;i++){const a=Math.PI*2*i/24;pts.push(applyM(m,{x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry}));}
      const bb=bbox(pts);addItem('circle',bb.x,bb.y,bb.w,bb.h,null,elColor(c));
    });
    doc.querySelectorAll('polygon,polyline,path[d]').forEach(el=>{
      let raw=[];
      if(el.matches('polygon,polyline')){const a=parseNumList(el.getAttribute('points')||'');for(let i=0;i+1<a.length;i+=2)raw.push({x:a[i],y:a[i+1]});}
      else raw=parsePathPoints(el.getAttribute('d')||'');
      if(raw.length<3)return;
      const m=matrixFor(el);raw=raw.map(p=>applyM(m,p));
      const bb=bbox(raw),points=raw.map(p=>({x:(p.x-bb.x)/bb.w-.5,y:(p.y-bb.y)/bb.h-.5}));
      addItem('custom',bb.x,bb.y,bb.w,bb.h,points,elColor(el));
    });
    if(items.length<1)throw new Error('Prefab SVG does not contain supported separate elements.');
    return items;
  }
  function applyCustomSvgText(svgText,name){
    customShapeSvgPoints=parseSvgPoints(svgText);
    try{customShapePrefabItems=parseSvgPrefabItems(svgText);}catch(_){customShapePrefabItems=null;}
    customShapeImageSrc='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgText);
    getEditorImage(customShapeImageSrc);
    $('custom-shape-image-preview').innerHTML=`<img src="${customShapeImageSrc}">`;
    if(name)$('custom-shape-name').value=name;
    const info=$('custom-shape-points-info');
    if(info)info.textContent='Custom: '+customShapeSvgPoints.length+' точек. Prefab: '+(customShapePrefabItems?customShapePrefabItems.length:0)+' отдельных объектов.';
  }
  function templateDataUrl(svgText){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgText);}
  function renderTemplateList(){
    const box=$('tpl-list');if(!box)return;box.innerHTML='';
    if(!svgTemplates.length){box.innerHTML='<div class="tpl-empty">No templates yet. Upload SVG files here.</div>';return;}
    svgTemplates.forEach(t=>{
      const card=document.createElement('button');card.type='button';card.className='tpl-card'+(t.id===selectedTemplateId?' on':'');
      card.innerHTML='<div class="thumb"><img src="'+t.imageSrc+'"></div><div><div class="tpl-name"></div><div class="tpl-meta">'+t.items.length+' objects</div></div><span class="tpl-del" title="Delete">×</span>';
      card.querySelector('.tpl-name').textContent=t.name;
      card.addEventListener('click',()=>selectSvgTemplate(t.id));
      card.querySelector('.tpl-del').addEventListener('click',ev=>{ev.stopPropagation();const i=svgTemplates.findIndex(x=>x.id===t.id);if(i>=0)svgTemplates.splice(i,1);if(selectedTemplateId===t.id){selectedTemplateId=null;customShape=null;shape='rect';}renderTemplateList();draw();});
      box.appendChild(card);
    });
  }
  function selectSvgTemplate(id){
    const t=svgTemplates.find(x=>x.id===id);if(!t)return;
    selectedTemplateId=id;customShape={name:t.name,prefab:true,items:t.items,imageSrc:t.imageSrc};
    shape='custom';mode='add';clearToolButtons();
    document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
    const tab=document.querySelector('.tab[data-panel="obstacles-visual"]');if(tab)tab.click();
    const rt=document.querySelector('.rtab[data-rt="levels"]');if(rt)rt.click();
    renderTemplateList();
  }
  function addSvgTemplate(svgText,name){
    const items=parseSvgPrefabItems(svgText);
    const imageSrc=templateDataUrl(svgText);getEditorImage(imageSrc);
    const id='tpl_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
    svgTemplates.push({id,name:name||('svg_template_'+svgTemplates.length),items,imageSrc});
    renderTemplateList();selectSvgTemplate(id);
  }
  $('tpl-svg-upload')?.addEventListener('change',e=>{
    const files=Array.from(e.target.files||[]);if(!files.length)return;
    files.forEach(f=>{
      const r=new FileReader();
      r.onload=ev=>{
        try{addSvgTemplate(String(ev.target.result||''),(f.name||'svg_template').replace(/\.svg$/i,''));}
        catch(err){alert('Не удалось загрузить SVG template '+(f.name||'')+': '+err.message);}
      };
      r.readAsText(f);
    });
    e.target.value='';
  });
  renderTemplateList();
  function addPrefabObstacles(stageIndex,cx,cy,prefab){
    const groupW=parseInt($('ow').value)||180,groupH=parseInt($('oh').value)||170,color=$('oc').value,moveX=parseInt($('om').value)||0;
    const start=(lvls[stageIndex]||[]).length;
    (prefab.items||[]).forEach((it,idx)=>{
      const o={x:Math.round(cx+it.dx*groupW),y:Math.round(cy+it.dy*groupH),coordMode:'center',w:Math.max(6,Math.round(it.wRel*groupW)),h:Math.max(6,Math.round(it.hRel*groupH)),shape:it.shape||'rect',color:it.color||color,moveX,moveSpeed:1800,prefabName:prefab.name||'svg_prefab',prefabIndex:idx};
      if(o.shape==='custom'&&it.points)o.points=it.points.map(p=>({x:p.x,y:p.y}));
      lvls[stageIndex].push(o);
    });
    sel=lvls[stageIndex].length-1;
    if(lvls[stageIndex].length>start)sel=start;
  }

  // shape buttons
  document.querySelectorAll('.et[data-shape]').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');shape=b.dataset.shape;mode='add';selectedTemplateId=null;renderTemplateList();$('et-sel').classList.remove('on');$('et-text').classList.remove('on');$('et-progress')&&$('et-progress').classList.remove('on');$('et-health')&&$('et-health').classList.remove('on');$('et-cta')&&$('et-cta').classList.remove('on');$('et-scale').classList.remove('on');
    });
  });
  $('et-custom').addEventListener('click',()=>{$('shape-modal').classList.add('on');});
  $('et-shape-editor').addEventListener('click',()=>{$('shape-modal').classList.add('on');});
  $('custom-shape-image').addEventListener('change',e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    const isSvg=f.type==='image/svg+xml'||/\.svg$/i.test(f.name);
    if(!isSvg){alert('Можно загрузить только SVG. PNG отключен, потому что коллайдер строится из SVG-координат.');e.target.value='';return;}
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const svgText=String(ev.target.result||'');
        applyCustomSvgText(svgText,(f.name||'custom_svg').replace(/\.svg$/i,''));
      }catch(err){customShapeSvgPoints=null;customShapeImageSrc=null;$('custom-shape-image-preview').textContent='SVG';const info=$('custom-shape-points-info');if(info)info.textContent='Не удалось создать коллайдер: '+err.message;alert('Не удалось прочитать SVG: '+err.message);}
    };
    r.readAsText(f);
  });
  $('custom-shape-image-clear').addEventListener('click',()=>{customShapeImageSrc=null;customShapeSvgPoints=null;customShapePrefabItems=null;$('custom-shape-image').value='';$('custom-shape-image-preview').textContent='SVG';const info=$('custom-shape-points-info');if(info)info.textContent='Коллайдер не создан: загрузите SVG.';});
  $('shape-cancel').addEventListener('click',()=>$('shape-modal').classList.remove('on'));
  $('shape-save').addEventListener('click',()=>{
    const name=($('custom-shape-name').value||'custom_svg').trim();const pts=customShapeSvgPoints||[];
    const asPrefab=$('custom-shape-prefab')&&$('custom-shape-prefab').checked;
    if(!customShapeImageSrc||pts.length<3){alert('Загрузите SVG с координатами polygon/polyline/path/rect/circle.');return;}
    if(asPrefab){
      const items=customShapePrefabItems||[];
      if(items.length<1){alert('Prefab SVG должен содержать отдельные rect/circle/ellipse/path элементы.');return;}
      customShape={name,prefab:true,items,imageSrc:customShapeImageSrc};
    }else customShape={name,points:pts,imageSrc:customShapeImageSrc};
    shape='custom';mode='add';
    document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
    selectedTemplateId=null;renderTemplateList();$('et-custom').classList.add('on');$('et-sel').classList.remove('on');$('shape-modal').classList.remove('on');
  });
  $('et-sel').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='drag';$('et-sel').classList.add('on');$('et-scale').classList.remove('on');$('et-text').classList.remove('on');$('et-progress').classList.remove('on');$('et-health')&&$('et-health').classList.remove('on');$('et-cta')&&$('et-cta').classList.remove('on');document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));});
  $('et-scale').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='scale';$('et-scale').classList.add('on');$('et-sel').classList.remove('on');$('et-text').classList.remove('on');$('et-progress').classList.remove('on');$('et-health')&&$('et-health').classList.remove('on');$('et-cta')&&$('et-cta').classList.remove('on');document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));});
  $('et-del').addEventListener('click',()=>{if(sel===null)return;const s=lvls[cur];s.splice(sel,1);sel=null;syncProps();draw();});
  $('et-clr').addEventListener('click',()=>{if(!confirm('Clear '+stageLabel(cur)+'?'))return;lvls[cur]=[];sel=null;syncProps();draw();});
  $('le-generate')?.addEventListener('click',()=>{setStageCount($('le-stage-count').value);});
  $('le-stage-count')?.addEventListener('input',e=>setStageCount(e.target.value));
  $('cfg-stageCount')?.addEventListener('input',e=>{if(String(e.target.value)!==String(NS))setStageCount(e.target.value);});
  $('le-zones')?.addEventListener('click',()=>{showZones=!showZones;$('le-zones').classList.toggle('on',showZones);draw();});

  // ── Tool buttons helper ───────────────────────────────────────────────────
  function clearToolButtons(){document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));$('et-sel').classList.remove('on');$('et-scale').classList.remove('on');$('et-text').classList.remove('on');$('et-progress').classList.remove('on');$('et-health')&&$('et-health').classList.remove('on');$('et-cta')&&$('et-cta').classList.remove('on');}
  $('le-zoom')?.addEventListener('input',e=>{
    autoFitZoom=false;
    const oldZoom=zoom;
    const cx=(wrap.scrollLeft+wrap.clientWidth/2)/Math.max(.0001,oldZoom);
    const cy=(wrap.scrollTop+wrap.clientHeight/2)/Math.max(.0001,oldZoom);
    zoom=parseFloat(e.target.value)||1;
    sv('le-zoom-v',Math.round(zoom*100)+'%');
    resize(false);
    wrap.scrollLeft=Math.max(0,cx*zoom-wrap.clientWidth/2);
    wrap.scrollTop=Math.max(0,cy*zoom-wrap.clientHeight/2);
  });

  ['ow','oh','oc','om'].forEach(id=>{$(id).addEventListener('input',()=>{if(sel===null||!lvls[cur]||!lvls[cur][sel])return;const o=lvls[cur][sel];if(o.kind==='text')return;if(o.kind==='bg'){o.w=parseInt($('ow').value)||o.w;o.h=parseInt($('oh').value)||o.h;o.tint=$('oc').value;draw();return;}o.w=parseInt($('ow').value)||60;o.h=parseInt($('oh').value)||60;o.color=$('oc').value;o.moveX=parseInt($('om').value)||0;draw();});});

  function resize(keepScroll=false){
    const oldTop=wrap.scrollTop,oldLeft=wrap.scrollLeft;
    GH=844;
    const vw=Math.max(1,wrap&&wrap.clientWidth?wrap.clientWidth:1);
    const vh=Math.max(1,wrap&&wrap.clientHeight?wrap.clientHeight:1);
    if(currentOrientation==='landscape'){
      const r=vw/vh;
      GW=Math.max(390,Math.round(GH*r));
    }else{
      GW=390;
    }
    if(autoFitZoom){
      const fitPad=.98;
      zoom=Math.max(.1,Math.min(3,Math.min((vw*fitPad)/GW,(vh*fitPad)/GH)));
      const zr=$('le-zoom');if(zr)zr.value=Math.max(parseFloat(zr.min)||.1,Math.min(parseFloat(zr.max)||3,zoom));
      sv('le-zoom-v',Math.round(zoom*100)+'%');
    }
    cv.width=Math.max(1,Math.round(GW*zoom));
    cv.height=Math.max(1,Math.round(GH*(NS+2)*zoom));
    cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';
    draw();
    if(!keepScroll){wrap.scrollTop=Math.max(0,rowOf(cur)*GH*zoom-40);wrap.scrollLeft=Math.max(0,(cv.width-wrap.clientWidth)/2);}else{wrap.scrollTop=oldTop;wrap.scrollLeft=(cv.width>wrap.clientWidth)?oldLeft:0;}
  }
  function toG(cx,cy){return{x:cx/zoom-GW/2,globalY:cy/zoom};}
  // Strip is flipped so the STARTING stage (index 0) sits at the BOTTOM and later
  // stages stack upward (matches Rise: you start low and climb). rowOf maps a
  // stage index to its visual row (0 = top of the strip). Data order, exported
  // levelData order is unchanged — this is layout only.
  function totalStages(){return NS+2;}
  function rowOf(si){return totalStages()-1-si;}
  function stageOf(row){return totalStages()-1-row;}
  function rowFromGlobalY(globalY){return Math.max(0,Math.min(totalStages()-1,Math.floor(globalY/GH)));}
  function stageFromGlobalY(globalY){return stageOf(rowFromGlobalY(globalY));}
  function stageLabel(si){return si===0?'Start scene':(si===NS+1?'Finish scene':'Mini-level '+si);}
  function toC(stageIndex,x,localY){return{x:(GW/2+x)*zoom,y:(rowOf(stageIndex)*GH+GH/2+localY)*zoom};}
  function anchorBaseLocal(anchor){
    const a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1);
    return {x:ah==='l'?-GW/2:(ah==='r'?GW/2:0),y:av==='t'?-GH/2:(av==='b'?GH/2:0)};
  }
  function textLocal(o){
    if(o&&o.anchorOffsetX!=null&&o.anchorOffsetY!=null){const b=anchorBaseLocal(o.anchor);return{x:b.x+(parseFloat(o.anchorOffsetX)||0)*GW/100,y:b.y+(parseFloat(o.anchorOffsetY)||0)*GH/100};}
    return {x:(o&&o.x)||0,y:(o&&o.y)||0};
  }
  function setTextLocalFromOffset(o){if(!o||o.kind!=='text')return;const l=textLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  function progressAnchorBaseLocal(anchor){
    const a=anchor||'cl',av=a.charAt(0),ah=a.charAt(1);
    return {x:ah==='l'?-GW/2:(ah==='r'?GW/2:0),y:av==='t'?-GH/2:(av==='b'?GH/2:0)};
  }
  function progressLocal(o){
    // Progress UI is anchored to the full screen area, not the active gameplay square.
    if(o&&o.anchorOffsetX!=null&&o.anchorOffsetY!=null){const b=progressAnchorBaseLocal(o.anchor);return{x:b.x+(parseFloat(o.anchorOffsetX)||0)*GW/100,y:b.y+(parseFloat(o.anchorOffsetY)||0)*GH/100};}
    return {x:(o&&o.x)||0,y:(o&&o.y)||0};
  }
  function setProgressLocalFromOffset(o){if(!o||o.kind!=='progress')return;const l=progressLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  function ctaLocal(o){return progressLocal(o);}
  function setCtaLocalFromOffset(o){if(!o||o.kind!=='cta')return;const l=ctaLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  function healthLocal(o){return progressLocal(o);}
  function setHealthLocalFromOffset(o){if(!o||o.kind!=='health')return;const l=healthLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  function txBox(anchor,cx,cy,w,h){const a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1);return{x:ah==='l'?cx:(ah==='r'?cx-w:cx-w/2),y:av==='t'?cy:(av==='b'?cy-h:cy-h/2)};}
  function obsAt(stageIndex,gx,gyLocal){
    const arr=lvls[stageIndex]||[];
    for(let i=arr.length-1;i>=0;i--){const o=arr[i];
      if(o.kind==='text'){
        const l=textLocal(o),sz=textLabelSize(ctx,o),bp=txBox(o.anchor,l.x,l.y,sz.w,sz.h);
        if(gx>=bp.x-8&&gx<=bp.x+sz.w+8&&gyLocal>=bp.y-8&&gyLocal<=bp.y+sz.h+8)return i;
      } else if(o.kind==='progress'){
        const l=progressLocal(o);
        if(Math.abs(gx-l.x)<=((o.w||64)/2+8)&&Math.abs(gyLocal-l.y)<=((o.h||300)/2+8))return i;
      } else if(o.kind==='health'){
        const l=healthLocal(o),sz=o.heartW||36,gap=(o.gap==null?6:o.gap),cnt=o.count||3,total=cnt*sz+(cnt-1)*gap;
        if(Math.abs(gx-l.x)<=total/2+8&&Math.abs(gyLocal-l.y)<=sz/2+8)return i;
      } else if(o.kind==='cta'){
        const l=ctaLocal(o);
        if(Math.abs(gx-l.x)<=((o.w||260)/2+8)&&Math.abs(gyLocal-l.y)<=((o.h||86)/2+8))return i;
      } else {
        if(Math.abs(gx-o.x)<=o.w/2+8&&Math.abs(gyLocal-o.y)<=o.h/2+8)return i;
      }
    }
    return -1;
  }
  function updateCurrentFromScroll(){const row=Math.max(0,Math.min(totalStages()-1,Math.floor((wrap.scrollTop/zoom+GH*.45)/GH)));cur=stageOf(row);}
  wrap.addEventListener('scroll',()=>{const old=cur;updateCurrentFromScroll();if(old!==cur){sel=null;syncProps();draw();}});

  cv.addEventListener('pointerdown',e=>{
    const rc=cv.getBoundingClientRect();const g=toG(e.clientX-rc.left,e.clientY-rc.top);
    const row=rowFromGlobalY(g.globalY),si=stageOf(row),localY=g.globalY-row*GH-GH/2;cur=si;
    if(mode==='text'){
      const L=newTextLabel(Math.round(g.x),Math.round(localY));
      lvls[si].push(L);sel=lvls[si].length-1;syncProps();draw();return;
    }
    if(mode==='progress'){
      const x=Math.round(g.x),y=Math.round(localY);
      const P={kind:'progress',coordMode:'screen',x,y,w:64,h:300,anchor:'cl',anchorOffsetX:Math.round(((x-progressAnchorBaseLocal('cl').x)/GW)*1000)/10,anchorOffsetY:Math.round((y/GH)*1000)/10,fill:'#b9ff9b',line:'#101625',flaskSrc:null,fillSrc:null};
      lvls[si].push(P);sel=lvls[si].length-1;syncProps();draw();return;
    }
    if(mode==='health'){
      const x=Math.round(g.x),y=Math.round(localY),base=progressAnchorBaseLocal('tc');
      const H={kind:'health',coordMode:'screen',x,y,count:3,heartW:36,gap:6,emptyAlpha:.28,tint:'#ffffff',anchor:'tc',anchorOffsetX:Math.round(((x-base.x)/GW)*1000)/10,anchorOffsetY:Math.round(((y-base.y)/GH)*1000)/10,heartSrc:'Assets/textures/heart.png'};
      lvls[si].push(H);sel=lvls[si].length-1;syncProps();draw();return;
    }
    if(mode==='cta'){
      const x=Math.round(g.x),y=Math.round(localY),base=progressAnchorBaseLocal('bc');
      const C={kind:'cta',coordMode:'screen',x,y,w:260,h:86,anchor:'bc',anchorOffsetX:Math.round(((x-base.x)/GW)*1000)/10,anchorOffsetY:Math.round(((y-base.y)/GH)*1000)/10,bgTint:'#ffffff',textTint:'#ffffff',bgSrc:null,textSrc:null};
      lvls[si].push(C);sel=lvls[si].length-1;syncProps();draw();return;
    }
    if(mode==='drag'||mode==='scale'){
      const idx=obsAt(si,g.x,localY);sel=idx>=0?idx:null;
      if(idx>=0){
        drag=true;const it=lvls[si][idx],l=it.kind==='text'?textLocal(it):(it.kind==='progress'?progressLocal(it):(it.kind==='health'?healthLocal(it):(it.kind==='cta'?ctaLocal(it):it)));doff={x:g.x-l.x,y:localY-l.y};
        // Scale: remember grab distance from the object center and its start size;
        // dragging away from the center grows it, toward the center shrinks it.
        scaleRef=mode==='scale'?{d0:Math.max(8,Math.hypot(g.x-l.x,localY-l.y)),w0:it.w||60,h0:it.h||60,s0:it.size||64}:null;
      }
      syncProps();draw();return;
    }
    if(shape==='custom'&&customShape&&customShape.prefab){
      addPrefabObstacles(si,Math.round(g.x),Math.round(localY),customShape);
      syncProps();draw();return;
    }
    const o={x:Math.round(g.x),y:Math.round(localY),coordMode:'center',w:parseInt($('ow').value)||60,h:parseInt($('oh').value)||60,shape:shape==='custom'?'custom':shape,color:$('oc').value,moveX:parseInt($('om').value)||0,moveSpeed:1800};
    if(shape==='custom'&&customShape){o.customName=customShape.name;o.points=customShape.points.map(p=>({x:p.x,y:p.y}));if(customShape.imageSrc)o.imageSrc=customShape.imageSrc;}
    lvls[si].push(o);sel=lvls[si].length-1;syncProps();draw();
  });
  cv.addEventListener('pointermove',e=>{
    if(!drag||sel===null)return;
    const rc=cv.getBoundingClientRect();const g=toG(e.clientX-rc.left,e.clientY-rc.top);
    const row=rowFromGlobalY(g.globalY),si=stageOf(row),localY=g.globalY-row*GH-GH/2;
    if(si!==cur)return;
    if(mode==='scale'&&scaleRef){
      const it=lvls[cur][sel];if(!it)return;
      const l=it.kind==='text'?textLocal(it):(it.kind==='progress'?progressLocal(it):(it.kind==='health'?healthLocal(it):(it.kind==='cta'?ctaLocal(it):it)));
      const f=Math.hypot(g.x-l.x,localY-l.y)/scaleRef.d0;
      if(it.kind==='text'){
        it.size=Math.max(6,Math.min(400,Math.round(scaleRef.s0*f)));
        $('tx-size').value=it.size;
      }else{
        it.w=Math.max(10,Math.min(1200,Math.round(scaleRef.w0*f)));
        it.h=Math.max(10,Math.min(1200,Math.round(scaleRef.h0*f)));
        if(it.kind==='progress'){$('pb-w').value=it.w;$('pb-h').value=it.h;}else if(it.kind==='health'){it.heartW=Math.max(8,Math.min(180,Math.round(scaleRef.w0*f)));$('hb-size').value=it.heartW;}else if(it.kind==='cta'){$('cta-w').value=it.w;$('cta-h').value=it.h;}else{$('ow').value=it.w;$('oh').value=it.h;}
      }
      draw();return;
    }
    {const it=lvls[cur][sel],nx=Math.round(g.x-doff.x),ny=Math.round(localY-doff.y);if(it.kind==='text'){const b=anchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setTextLocalFromOffset(it);}else if(it.kind==='progress'){const b=progressAnchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setProgressLocalFromOffset(it);}else if(it.kind==='health'){const b=progressAnchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setHealthLocalFromOffset(it);}else if(it.kind==='cta'){const b=progressAnchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setCtaLocalFromOffset(it);}else{it.x=nx;it.y=ny;}draw();}
  });
  cv.addEventListener('pointerup',()=>{drag=false;scaleRef=null;});cv.addEventListener('pointercancel',()=>{drag=false;scaleRef=null;});

  function sprMap(){return (window.RiseBuilder&&RiseBuilder.getSprites&&RiseBuilder.getSprites())||{};}
  function drawCoverImage(im,x,y,w,h){
    if(!imageReady(im))return false;
    const sc=Math.max(w/im.naturalWidth,h/im.naturalHeight);
    const dw=im.naturalWidth*sc,dh=im.naturalHeight*sc;
    ctx.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
    return true;
  }
  function drawCoverImageFade(im,x,y,w,h,fade,tint){
    if(!imageReady(im))return false;
    const off=document.createElement('canvas');
    off.width=Math.max(1,Math.round(w));off.height=Math.max(1,Math.round(h));
    const oc=off.getContext('2d');
    const sc=Math.max(w/im.naturalWidth,h/im.naturalHeight);
    const dw=im.naturalWidth*sc,dh=im.naturalHeight*sc;
    oc.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
    if(tint&&String(tint).toLowerCase()!=='#ffffff'){
      oc.globalCompositeOperation='source-atop';oc.fillStyle=tint;oc.globalAlpha=.45;oc.fillRect(0,0,w,h);oc.globalAlpha=1;oc.globalCompositeOperation='source-over';
    }
    if(fade>0){
      const f=Math.min(fade,h/2);
      const g=oc.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'rgba(0,0,0,0)');
      g.addColorStop(f/h,'rgba(0,0,0,1)');
      g.addColorStop(1-f/h,'rgba(0,0,0,1)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      oc.globalCompositeOperation='destination-in';
      oc.fillStyle=g;oc.fillRect(0,0,w,h);
      oc.globalCompositeOperation='source-over';
    }
    ctx.drawImage(off,x,y);
    return true;
  }
  function drawBgItem(o,si,i){
    const c=toC(si,o.x,o.y),sw=Math.max(1,o.w*zoom),sh=Math.max(1,o.h*zoom);
    const sm=sprMap();
    const im=getEditorImage(sm['bgimg_'+o.imgId]);
    if(imageReady(im)){
      // stretch to exact w/h (not cover) + per-instance tint via alpha mask
      const off=document.createElement('canvas');
      off.width=Math.max(1,Math.round(sw));off.height=Math.max(1,Math.round(sh));
      const oc2=off.getContext('2d');
      oc2.drawImage(im,0,0,off.width,off.height);
      if(o.tint&&String(o.tint).toLowerCase()!=='#ffffff'){
        oc2.globalCompositeOperation='source-atop';oc2.globalAlpha=.55;
        oc2.fillStyle=o.tint;oc2.fillRect(0,0,off.width,off.height);
        oc2.globalAlpha=1;oc2.globalCompositeOperation='source-over';
      }
      ctx.drawImage(off,c.x-sw/2,c.y-sh/2);
    }else{
      ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(c.x-sw/2,c.y-sh/2,sw,sh);
      ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('image?',c.x,c.y);
    }
    if(si===cur&&i===sel){
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);
      ctx.strokeRect(c.x-sw/2,c.y-sh/2,sw,sh);ctx.setLineDash([]);
    }else{
      ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=1;
      ctx.strokeRect(c.x-sw/2,c.y-sh/2,sw,sh);
    }
  }
  function drawCommonBg(){
    // One optional environment image, tinted, covering each screen-sized row
    // of the strip (matches how the playable stretches it over the screen).
    const sm=sprMap();
    const im=getEditorImage(sm.background);
    if(!imageReady(im))return;
    const tint=$('cfg-bgSpriteColor')?$('cfg-bgSpriteColor').value:'#ffffff';
    for(let r=0;r<totalStages();r++)drawCoverImageFade(im,0,r*GH*zoom,GW*zoom,GH*zoom,0,tint);
  }
  function drawPerStageBg(){
    // Per-mini-level bands: uploaded image (cover) or a 2-colour gradient,
    // plus the optional seam sprite over every junction — matches the playable.
    const sm=sprMap();
    const defs=(window.RiseBgUI&&RiseBgUI.BG_GRAD_DEFAULTS)||[['#39a2d8','#69c5ec'],['#ef5350','#f97f6f'],['#b03c02','#cc4a05'],['#f0a44c','#f9c178'],['#ee4630','#fa6a4b']];
    const w=GW*zoom,h=GH*zoom;
    for(let si=0;si<totalStages();si++){
      const top=rowOf(si)*h;
      // градиент рисуется всегда — под картинкой (просвечивает сквозь альфу)
      const a=$('cfg-bgg'+si+'a'),b=$('cfg-bgg'+si+'b'),d=defs[si%defs.length];
      const g=ctx.createLinearGradient(0,top,0,top+h);
      // первый пикер = нижний цвет, второй = верхний
      g.addColorStop(0,(b&&b.value)||d[1]);g.addColorStop(1,(a&&a.value)||d[0]);
      ctx.fillStyle=g;ctx.fillRect(0,top,w,h);
      const im=getEditorImage(sm['bg_stage'+si]);
      if(imageReady(im)){
        const te=$('cfg-bgt'+si);
        drawCoverImageFade(im,0,top,w,h,0,(te&&te.value)||'#ffffff');
      }
    }
    const seam=getEditorImage(sm.bg_seam);
    if(imageReady(seam)){
      const sc=parseFloat($('cfg-seamScale')?.value)||1;
      const iw=seam.naturalWidth||seam.width||1,ih=seam.naturalHeight||seam.height||1;
      const sh=Math.max(8,Math.min(h*.5,w*(ih/iw)*sc));
      // seams sit on the boundary between neighbouring rows
      for(let r=1;r<totalStages();r++)ctx.drawImage(seam,0,r*h-sh/2,w,sh);
    }
  }
  function hr(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?parseInt(r[1],16)+','+parseInt(r[2],16)+','+parseInt(r[3],16):'200,200,200';}
  function drawTextItem(o,si,i){
    const l=textLocal(o),baseX=GW/2+l.x, baseY=rowOf(si)*GH+GH/2+l.y;
    ctx.save();
    ctx.setTransform(zoom,0,0,zoom,0,0);
    drawTextLabel(ctx,o,baseX,baseY);
    if(si===cur&&i===sel){
      const sz=textLabelSize(ctx,o),bp=txBox(o.anchor,baseX,baseY,sz.w,sz.h);
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5/zoom;ctx.setLineDash([5/zoom,4/zoom]);
      ctx.strokeRect(bp.x-6,bp.y-6,sz.w+12,sz.h+12);ctx.setLineDash([]);
    }
    ctx.restore();
  }
  const progressImgCache={};
  function progressImg(src){if(!src)return null;if(!progressImgCache[src]){const im=new Image();im.src=src;progressImgCache[src]=im;}return progressImgCache[src];}
  function flaskPath(ctx,x,y,w,h){
    const r=w*.18,neck=w*.42,nx=x+w/2-neck/2,ny=y+4,bodyBot=y+h-r;
    ctx.beginPath();ctx.moveTo(nx,ny);ctx.quadraticCurveTo(x+w/2,ny-r*.45,nx+neck,ny);ctx.lineTo(nx+neck,bodyBot);ctx.quadraticCurveTo(nx+neck,bodyBot+r*.9,x+w/2,bodyBot+r*.9);ctx.quadraticCurveTo(nx,bodyBot+r*.9,nx,bodyBot);ctx.closePath();
  }
  function drawProgressShape(ctx,x,y,w,h,progress,fill,line,flaskSrc,fillSrc){
    progress=Math.max(0,Math.min(1,progress==null?0:progress));
    const flask=progressImg(flaskSrc),fillIm=progressImg(fillSrc);
    if(flask&&imageReady(flask)){
      const ow=Math.max(1,Math.ceil(w)),oh=Math.max(1,Math.ceil(h));
      const off=document.createElement('canvas');off.width=ow;off.height=oh;const ox=off.getContext('2d');
      const fy=oh-oh*progress;
      if(fillIm&&imageReady(fillIm))ox.drawImage(fillIm,0,fillIm.naturalHeight*(1-progress),fillIm.naturalWidth,fillIm.naturalHeight*progress,0,fy,ow,oh-fy);
      else{ox.fillStyle=fill||'#b9ff9b';ox.fillRect(0,fy,ow,oh-fy);}
      ox.globalCompositeOperation='destination-in';ox.drawImage(flask,0,0,ow,oh);
      ctx.drawImage(off,x,y,w,h);ctx.drawImage(flask,x,y,w,h);return;
    }
    ctx.save();flaskPath(ctx,x,y,w,h);ctx.clip();
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x,y,w,h);
    const fy=y+h-(h*progress);
    if(fillIm&&imageReady(fillIm))ctx.drawImage(fillIm,0,fillIm.naturalHeight*(1-progress),fillIm.naturalWidth,fillIm.naturalHeight*progress,x,fy,w,h*progress);else{ctx.fillStyle=fill||'#b9ff9b';ctx.fillRect(x,fy,w,y+h-fy);}
    ctx.restore();ctx.save();flaskPath(ctx,x,y,w,h);ctx.strokeStyle=line||'#101625';ctx.lineWidth=Math.max(2,w*.045);ctx.stroke();
    ctx.lineWidth=Math.max(1,w*.025);for(let k=1;k<10;k++){const yy=y+h-k*h/10;ctx.beginPath();ctx.moveTo(x+w*.52,yy);ctx.lineTo(x+w*.86,yy);ctx.stroke();}
    ctx.restore();
  }
  function drawProgressItem(o,si,i){
    const l=progressLocal(o),c=toC(si,l.x,l.y),sw=(o.w||64)*zoom,sh=(o.h||300)*zoom;
    drawProgressShape(ctx,c.x-sw/2,c.y-sh/2,sw,sh,.42,o.fill,o.line,o.flaskSrc,o.fillSrc);
    if(si===cur&&i===sel){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(c.x-sw/2-5,c.y-sh/2-5,sw+10,sh+10);ctx.setLineDash([]);}
  }
  function drawTintedImage(im,x,y,w,h,tint){
    if(!imageReady(im))return false;
    ctx.drawImage(im,x,y,w,h);
    if(tint&&String(tint).toLowerCase()!=='#ffffff'){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.65;ctx.fillStyle=tint;ctx.fillRect(x,y,w,h);ctx.restore();}
    return true;
  }

  function drawHealthItem(o,si,i){
    const l=healthLocal(o),c=toC(si,l.x,l.y),size=(o.heartW||36)*zoom,gap=(o.gap==null?6:o.gap)*zoom,cnt=o.count||3,total=cnt*size+(cnt-1)*gap;
    let x=c.x-total/2,y=c.y-size/2;const im=progressImg(o.heartSrc||'Assets/textures/heart.png');
    for(let k=0;k<cnt;k++){
      ctx.save();ctx.globalAlpha=1;
      if(im&&imageReady(im))drawTintedImage(im,x,y,size,size,o.tint||'#ffffff');else{ctx.font=Math.round(size*.86)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ff6b6b';ctx.fillText('♥',x+size/2,y+size/2);}
      ctx.restore();x+=size+gap;
    }
    if(si===cur&&i===sel){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(c.x-total/2-5,c.y-size/2-5,total+10,size+10);ctx.setLineDash([]);}
  }
  function drawCtaItem(o,si,i){
    const l=ctaLocal(o),c=toC(si,l.x,l.y),sw=(o.w||260)*zoom,sh=(o.h||86)*zoom,x=c.x-sw/2,y=c.y-sh/2;
    const bg=progressImg(o.bgSrc),tx=progressImg(o.textSrc);
    if(bg&&imageReady(bg))drawTintedImage(bg,x,y,sw,sh,o.bgTint);else{ctx.fillStyle=o.bgTint||'#e05252';ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,sw,sh,sh*.22):ctx.rect(x,y,sw,sh);ctx.fill();}
    if(tx&&imageReady(tx))drawTintedImage(tx,x,y,sw,sh,o.textTint);else{ctx.fillStyle=o.textTint||'#ffffff';ctx.font='700 '+Math.max(12,sh*.28)+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('PLAY NOW',c.x,c.y);}
    if(si===cur&&i===sel){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(x-5,y-5,sw+10,sh+10);ctx.setLineDash([]);}
  }
  function drawObstacle(o,si,i){
    const c=toC(si,o.x,o.y),sw=o.w*zoom,sh=o.h*zoom;
    ctx.save();ctx.fillStyle=o.color||'#e05252';ctx.strokeStyle=(si===cur&&i===sel)?'#fff':'rgba(255,255,255,.24)';ctx.lineWidth=(si===cur&&i===sel)?2.5:1.5;
    if(o.shape==='circle'){ctx.beginPath();ctx.arc(c.x,c.y,sw/2,0,Math.PI*2);ctx.fill();ctx.stroke();}
    else if(o.shape==='triangle'){ctx.beginPath();ctx.moveTo(c.x,c.y-sh/2);ctx.lineTo(c.x+sw/2,c.y+sh/2);ctx.lineTo(c.x-sw/2,c.y+sh/2);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(o.shape==='custom'&&o.points&&o.points.length>=3){const im=getEditorImage(o.imageSrc);if(imageReady(im))ctx.drawImage(im,c.x-sw/2,c.y-sh/2,sw,sh);else ctx.fillRect(c.x-sw/2,c.y-sh/2,sw,sh);ctx.beginPath();o.points.forEach((p,pi)=>{const px=c.x+p.x*sw,py=c.y+p.y*sh;if(pi===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.stroke();}
    else{ctx.beginPath();ctx.rect(c.x-sw/2,c.y-sh/2,sw,sh);ctx.fill();ctx.stroke();}
    if(o.moveX>0){const mx=o.moveX*zoom;ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(c.x-mx,c.y);ctx.lineTo(c.x+mx,c.y);ctx.stroke();ctx.setLineDash([]);}ctx.restore();
  }
  // ── Active / passive zones ────────────────────────────────────────────────
  // The active zone is a centered square whose side equals the SHORT side of the
  // screen (full width in portrait, full height in landscape). The passive zone
  // is whatever is left of the mini-level rect — the part that only exists to
  // stretch the screen to the portrait/landscape aspect ratio.
  function zoneRect(top,w,h,midX,midY){
    const aw=GW*zoom,ah=GH*zoom;
    const x0=midX-aw/2,y0=midY-ah/2;
    return {sq:Math.min(aw,ah),aw,ah,x0,y0,x1:x0+aw,y1:y0+ah,top,bottom:top+h,w};
  }
  function drawPassiveZone(top,w,h,midX,midY){ // call BEFORE obstacles
    if(!showZones)return;
    const z=zoneRect(top,w,h,midX,midY);
    ctx.save();
    ctx.fillStyle='rgba(6,6,12,.5)';         // dim the extension area
    if(z.y0>z.top+0.5)ctx.fillRect(0,z.top,w,z.y0-z.top);            // top band
    if(z.y1<z.bottom-0.5)ctx.fillRect(0,z.y1,w,z.bottom-z.y1);       // bottom band
    const sy0=Math.max(z.top,z.y0),sy1=Math.min(z.bottom,z.y1);
    if(z.x0>0.5)ctx.fillRect(0,sy0,z.x0,sy1-sy0);                    // left band
    if(z.x1<w-0.5)ctx.fillRect(z.x1,sy0,w-z.x1,sy1-sy0);            // right band
    ctx.restore();
  }
  function drawActiveZone(top,w,h,midX,midY){ // call AFTER obstacles
    if(!showZones)return;
    const z=zoneRect(top,w,h,midX,midY);
    ctx.save();
    // square outline
    ctx.setLineDash([]);ctx.strokeStyle='#52e08a';ctx.lineWidth=2;
    ctx.strokeRect(z.x0,z.y0,z.aw,z.ah);
    // corner brackets
    ctx.lineWidth=3;const cl=Math.min(22,z.sq*0.18);
    [[z.x0,z.y0,1,1],[z.x1,z.y0,-1,1],[z.x0,z.y1,1,-1],[z.x1,z.y1,-1,-1]].forEach(([cx,cy,dx,dy])=>{
      ctx.beginPath();ctx.moveTo(cx+dx*cl,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+dy*cl);ctx.stroke();
    });
    // active label
    if(z.sq>70){
      ctx.fillStyle='#52e08a';ctx.font='600 '+Math.max(10,Math.min(13,11*zoom))+'px system-ui,sans-serif';ctx.textAlign='left';
      ctx.fillText('ACTIVE '+GW+'×'+GH,z.x0+6,z.y0+15);
    }
    // passive label (only where a band actually exists)
    ctx.fillStyle='rgba(224,82,82,.85)';ctx.font='600 10px system-ui,sans-serif';ctx.textAlign='center';
    if(z.y0>z.top+22){ctx.fillText('PASSIVE',w/2,z.top+(z.y0-z.top)/2+3);}
    else if(z.x0>34){ctx.fillText('PASSIVE',z.x0/2,top+h/2+3);}
    ctx.restore();
  }
  function draw(){
    if(!cv.width||!cv.height)return;
    ctx.clearRect(0,0,cv.width,cv.height);ctx.fillStyle='#080810';ctx.fillRect(0,0,cv.width,cv.height);
    if(window.RiseBgUI&&RiseBgUI.getBgMode()==='common')drawCommonBg();else drawPerStageBg();
    const palette=['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'];
    const accentsOn=$('cfg-stageAccents')?$('cfg-stageAccents').checked:true;
    for(let si=0;si<totalStages();si++){
      const top=rowOf(si)*GH*zoom,h=GH*zoom,w=GW*zoom,midX=w/2,midY=top+h/2;
      if(accentsOn){const ce=$('cfg-stage'+(si%5));const sc=(ce&&ce.value)||palette[si%palette.length];ctx.fillStyle='rgba('+hr(sc)+',.08)';ctx.fillRect(0,top,w,h);}
      // background image items — behind grid/obstacles, like in the playable
      (lvls[si]||[]).forEach((o,i)=>{if(o&&o.kind==='bg')drawBgItem(o,si,i);});
      ctx.strokeStyle=si===cur?'rgba(255,255,255,.55)':'rgba(255,255,255,.22)';ctx.lineWidth=si===cur?2:1;ctx.strokeRect(.5,top+.5,w-1,h-1);
      ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;
      for(let x=0;x<=GW;x+=65){ctx.beginPath();ctx.moveTo(x*zoom,top);ctx.lineTo(x*zoom,top+h);ctx.stroke();}
      for(let y=0;y<=GH;y+=65){ctx.beginPath();ctx.moveTo(0,top+y*zoom);ctx.lineTo(w,top+y*zoom);ctx.stroke();}
      ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(midX,top);ctx.lineTo(midX,top+h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,midY);ctx.lineTo(w,midY);ctx.stroke();
      drawPassiveZone(top,w,h,midX,midY);
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.font=Math.max(10,12*zoom)+'px monospace';ctx.textAlign='left';ctx.fillText(stageLabel(si)+'   0;0',8,top+18);
      (lvls[si]||[]).forEach((o,i)=>{if(!o||o.kind==='bg')return;if(o.kind==='text')drawTextItem(o,si,i);else if(o.kind==='progress')drawProgressItem(o,si,i);else if(o.kind==='health')drawHealthItem(o,si,i);else if(o.kind==='cta')drawCtaItem(o,si,i);else drawObstacle(o,si,i);});
      drawActiveZone(top,w,h,midX,midY);
    }
    
    let no=0,nt=0,nb=0,np=0,nh=0,nc=0;lvls.forEach(s=>s.forEach(o=>{if(!o)return;if(o.kind==='text')nt++;else if(o.kind==='bg')nb++;else if(o.kind==='progress')np++;else if(o.kind==='health')nh++;else if(o.kind==='cta')nc++;else no++;}));ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='11px monospace';ctx.textAlign='left';ctx.fillText('Start scene + '+NS+' mini-levels + Finish scene · '+no+' obstacles · '+nb+' images · '+nt+' text · '+np+' progress · '+nh+' health · '+nc+' cta · '+Math.round(zoom*100)+'% zoom',8,cv.height-8);
  }
  function getLevelData(){return lvls.map(s=>s.map(o=>({...o,coordMode:'center'})));}

  // ── Level text labels ─────────────────────────────────────────────────────
  let txColors=[],txBase='#ffffff',txAccent='#52e08a';
  function newTextLabel(x,y){
    return {kind:'text',coordMode:'center',x:x,y:y,anchorOffsetX:Math.round((x/GW)*100),anchorOffsetY:Math.round((y/GH)*100),
      segments:[{t:'TAP TO ',color:'#ffffff'},{t:'PLAY',color:'#52e08a'}],
      baseColor:'#ffffff',accentColor:'#52e08a',
      font:'Baloo2',size:64,anchor:'cc',stroke:'#000000',strokeW:0,shadow:true,letterSpacing:0};
  }
  function selItem(){return (cur>=0&&sel!==null&&lvls[cur])?lvls[cur][sel]:null;}
  function labelText(o){return o.segments.map(s=>String(s.t||'')).join('');}
  function expandColors(o){const a=[];o.segments.forEach(s=>{const t=String(s.t||'');for(let i=0;i<t.length;i++)a.push(s.color||txBase);});return a;}
  function rebuildSegments(o){
    const text=$('tx-text').value,segs=[];
    for(let i=0;i<text.length;i++){const c=txColors[i]||txBase;if(segs.length&&segs[segs.length-1].color===c)segs[segs.length-1].t+=text[i];else segs.push({t:text[i],color:c});}
    if(!segs.length)segs.push({t:'',color:txBase});
    o.segments=segs;o.baseColor=txBase;o.accentColor=txAccent;
  }
  function syncProps(){
    const o=selItem(),isText=!!(o&&o.kind==='text'),isProg=!!(o&&o.kind==='progress'),isHealth=!!(o&&o.kind==='health'),isCta=!!(o&&o.kind==='cta');
    $('txtbar').style.display=isText?'':'none';
    $('pbar').style.display=isProg?'':'none';
    $('hbar').style.display=isHealth?'':'none';
    $('ctabar').style.display=isCta?'':'none';
    $('obs-props').style.display=(isText||isProg||isHealth||isCta)?'none':'flex';
    if(isText){
      $('tx-font').value=o.font||'Baloo2';$('tx-size').value=o.size||64;
      $('tx-stroke').value=o.stroke||'#000000';$('tx-strokeW').value=o.strokeW||0;$('tx-shadow').checked=o.shadow!==false;
      if(o.anchorOffsetX==null||o.anchorOffsetY==null){const l={x:o.x||0,y:o.y||0},b=anchorBaseLocal(o.anchor);o.anchorOffsetX=Math.round(((l.x-b.x)/GW)*1000)/10;o.anchorOffsetY=Math.round(((l.y-b.y)/GH)*1000)/10;}
      $('tx-offx').value=o.anchorOffsetX||0;$('tx-offy').value=o.anchorOffsetY||0;
      txBase=o.baseColor||(o.segments[0]&&o.segments[0].color)||'#ffffff';
      txAccent=o.accentColor||o.segments.map(s=>s.color).find(c=>c&&c!==txBase)||'#52e08a';
      $('tx-base').value=txBase;$('tx-accent').value=txAccent;
      $('tx-text').value=labelText(o);txColors=expandColors(o);
      document.querySelectorAll('#tx-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'cc')));
    } else if(isProg){
      if(o.anchorOffsetX==null||o.anchorOffsetY==null){const l={x:o.x||0,y:o.y||0},b=progressAnchorBaseLocal(o.anchor);o.anchorOffsetX=Math.round(((l.x-b.x)/GW)*1000)/10;o.anchorOffsetY=Math.round(((l.y-b.y)/GH)*1000)/10;}
      $('pb-w').value=o.w||64;$('pb-h').value=o.h||300;$('pb-fill').value=o.fill||'#b9ff9b';$('pb-line').value=o.line||'#101625';$('pb-offx').value=o.anchorOffsetX||0;$('pb-offy').value=o.anchorOffsetY||0;
      document.querySelectorAll('#pb-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'cl')));
    } else if(isHealth){
      if(o.anchorOffsetX==null||o.anchorOffsetY==null){const l={x:o.x||0,y:o.y||0},b=progressAnchorBaseLocal(o.anchor);o.anchorOffsetX=Math.round(((l.x-b.x)/GW)*1000)/10;o.anchorOffsetY=Math.round(((l.y-b.y)/GH)*1000)/10;}
      $('hb-size').value=o.heartW||36;$('hb-gap').value=o.gap==null?6:o.gap;$('hb-empty').value=o.emptyAlpha==null ? .28 : o.emptyAlpha;$('hb-tint').value=o.tint||'#ffffff';$('hb-offx').value=o.anchorOffsetX||0;$('hb-offy').value=o.anchorOffsetY||0;
      document.querySelectorAll('#hb-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'tc')));
    } else if(o&&o.kind==='bg'){
      $('ow').value=o.w;$('oh').value=o.h;$('oc').value=o.tint||'#ffffff';$('om').value=0;
    } else if(o){
      $('ow').value=o.w;$('oh').value=o.h;$('oc').value=o.color||'#e05252';$('om').value=o.moveX||0;
    }
  }
  function paintRange(color){
    const o=selItem();if(!o||o.kind!=='text')return;const inp=$('tx-text');
    let a=inp.selectionStart,b=inp.selectionEnd;if(a==null)a=0;if(b==null)b=inp.value.length;
    if(a===b){a=0;b=inp.value.length;}                 // no selection → whole text
    while(txColors.length<inp.value.length)txColors.push(txBase);
    for(let i=a;i<b;i++)txColors[i]=color;
    rebuildSegments(o);draw();inp.focus();try{inp.setSelectionRange(a,b);}catch(e){}
  }
  $('et-text').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='text';clearToolButtons();$('et-text').classList.add('on');});
  $('tx-text').addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='text')return;rebuildSegments(o);txColors=expandColors(o);draw();});
  $('tx-base').addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='text')return;const old=txBase,nw=$('tx-base').value;for(let i=0;i<txColors.length;i++)if(txColors[i]===old)txColors[i]=nw;txBase=nw;rebuildSegments(o);draw();});
  $('tx-accent').addEventListener('input',()=>{txAccent=$('tx-accent').value;const o=selItem();if(o&&o.kind==='text')o.accentColor=txAccent;});
  // keep the text selection when clicking the paint buttons
  $('tx-paint-acc').addEventListener('mousedown',e=>e.preventDefault());
  $('tx-paint-base').addEventListener('mousedown',e=>e.preventDefault());
  $('tx-paint-acc').addEventListener('click',()=>paintRange($('tx-accent').value));
  $('tx-paint-base').addEventListener('click',()=>paintRange($('tx-base').value));
  document.querySelectorAll('#tx-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='text')return;o.anchor=b.dataset.a;setTextLocalFromOffset(o);document.querySelectorAll('#tx-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  function bindTxOffset(id,field){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='text')return;o[field]=parseFloat(e.value)||0;setTextLocalFromOffset(o);draw();});}
  bindTxOffset('tx-offx','anchorOffsetX');
  bindTxOffset('tx-offy','anchorOffsetY');
  function bindTx(id,field,tf){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='text')return;o[field]=tf?tf(e.value):e.value;draw();});}
  bindTx('tx-font','font');
  bindTx('tx-size','size',v=>Math.max(1,parseFloat(v)||1));
  bindTx('tx-stroke','stroke');
  bindTx('tx-strokeW','strokeW',v=>Math.max(0,parseFloat(v)||0));
  $('tx-shadow').addEventListener('change',()=>{const o=selItem();if(!o||o.kind!=='text')return;o.shadow=$('tx-shadow').checked;draw();});
  if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('800 40px Baloo2'),document.fonts.load('600 40px Kameron'),document.fonts.load('400 40px LiberationSans')]).then(draw).catch(()=>{});}

  $('et-progress').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='progress';clearToolButtons();$('et-progress').classList.add('on');});
  document.querySelectorAll('#pb-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='progress')return;o.anchor=b.dataset.a;setProgressLocalFromOffset(o);document.querySelectorAll('#pb-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  function bindPb(id,field,tf){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='progress')return;o[field]=tf?tf(e.value):e.value;draw();});}
  function bindPbOffset(id,field){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='progress')return;o[field]=parseFloat(e.value)||0;setProgressLocalFromOffset(o);draw();});}
  bindPb('pb-w','w',v=>Math.max(20,parseFloat(v)||64));bindPb('pb-h','h',v=>Math.max(60,parseFloat(v)||300));bindPb('pb-fill','fill');bindPb('pb-line','line');bindPbOffset('pb-offx','anchorOffsetX');bindPbOffset('pb-offy','anchorOffsetY');
  window.loadProgressPart=function(part,inp){const o=selItem();if(!o||o.kind!=='progress'||!inp.files||!inp.files[0])return;const r=new FileReader();r.onload=e=>{if(part==='flask')o.flaskSrc=e.target.result;else o.fillSrc=e.target.result;draw();};r.readAsDataURL(inp.files[0]);inp.value='';};
  $('pb-flask-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='progress'){o.flaskSrc=null;draw();}});
  $('pb-fill-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='progress'){o.fillSrc=null;draw();}});


  $('et-health').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='health';clearToolButtons();$('et-health').classList.add('on');});
  document.querySelectorAll('#hb-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='health')return;o.anchor=b.dataset.a;setHealthLocalFromOffset(o);document.querySelectorAll('#hb-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  function bindHb(id,field,tf){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='health')return;o[field]=tf?tf(e.value):e.value;draw();});}
  function bindHbOffset(id,field){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='health')return;o[field]=parseFloat(e.value)||0;setHealthLocalFromOffset(o);draw();});}
  bindHb('hb-size','heartW',v=>Math.max(8,parseFloat(v)||36));bindHb('hb-gap','gap',v=>parseFloat(v)||0);bindHb('hb-empty','emptyAlpha',v=>Math.max(0,Math.min(1,parseFloat(v)||0)));bindHb('hb-tint','tint');bindHbOffset('hb-offx','anchorOffsetX');bindHbOffset('hb-offy','anchorOffsetY');
  window.loadHealthPart=function(inp){const o=selItem();if(!o||o.kind!=='health'||!inp.files||!inp.files[0])return;const r=new FileReader();r.onload=e=>{o.heartSrc=e.target.result;draw();};r.readAsDataURL(inp.files[0]);inp.value='';};
  $('hb-heart-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='health'){o.heartSrc='Assets/textures/heart.png';draw();}});

  $('et-cta').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='cta';clearToolButtons();$('et-cta').classList.add('on');});
  document.querySelectorAll('#cta-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='cta')return;o.anchor=b.dataset.a;setCtaLocalFromOffset(o);document.querySelectorAll('#cta-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  function bindCta(id,field,tf){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='cta')return;o[field]=tf?tf(e.value):e.value;draw();});}
  function bindCtaOffset(id,field){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='cta')return;o[field]=parseFloat(e.value)||0;setCtaLocalFromOffset(o);draw();});}
  bindCta('cta-w','w',v=>Math.max(30,parseFloat(v)||260));bindCta('cta-h','h',v=>Math.max(20,parseFloat(v)||86));bindCta('cta-bg-tint','bgTint');bindCta('cta-text-tint','textTint');bindCtaOffset('cta-offx','anchorOffsetX');bindCtaOffset('cta-offy','anchorOffsetY');
  window.loadCtaPart=function(part,inp){const o=selItem();if(!o||o.kind!=='cta'||!inp.files||!inp.files[0])return;const r=new FileReader();r.onload=e=>{if(part==='bg')o.bgSrc=e.target.result;else o.textSrc=e.target.result;draw();};r.readAsDataURL(inp.files[0]);inp.value='';};
  $('cta-bg-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='cta'){o.bgSrc=null;draw();}});
  $('cta-text-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='cta'){o.textSrc=null;draw();}});

  setStageCount(NS);sv('le-zoom-v',Math.round(zoom*100)+'%');
  window.addEventListener('resize',()=>{if($('rp-levels').classList.contains('on'))resize(true);});
  return{resize,getLevelData,draw,setStageCount};
})();

window.RiseLevelEditor=LE;

// ── Text labels — level text with per-segment colors (must match playable-template.js) ──
const FONT_CSS={
  'Baloo2':"'Baloo2',sans-serif",
  'Kameron':"'Kameron',serif",
  'LiberationSans':"'LiberationSans',Arial,sans-serif",
  'sans':'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
  'serif':'Georgia,"Times New Roman",serif',
  'mono':'ui-monospace,Menlo,Consolas,monospace'
};
function drawTextLabel(ctx,L,cx,cy){
  var segs=(L.segments&&L.segments.length)?L.segments:[{t:(L.text||''),color:(L.color||'#ffffff')}];
  var fam=(FONT_CSS[L.font]||fontCssFamily(L.font)||'sans-serif');
  var size=L.size||40,weight=800;
  var anchor=L.anchor||'cc',av=anchor.charAt(0),ah=anchor.charAt(1),align=ah==='l'?'left':(ah==='r'?'right':'center');
  var lines=[[]],s,p,col,parts;
  for(s=0;s<segs.length;s++){
    col=segs[s].color||'#ffffff';parts=String(segs[s].t==null?'':segs[s].t).split('\n');
    for(p=0;p<parts.length;p++){if(p>0)lines.push([]);if(parts[p]!=='')lines[lines.length-1].push({t:parts[p],color:col});}
  }
  var lh=size*1.18;
  ctx.save();
  ctx.font=weight+' '+size+'px '+fam;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  try{if('letterSpacing' in ctx)ctx.letterSpacing=(L.letterSpacing||0)+'px';}catch(e){}
  var totalH=lh*lines.length,ascent=size*0.80,firstBase=(av==='t'?(cy+ascent):(av==='b'?(cy-totalH+ascent):(cy-totalH/2+ascent))),li,r,runs,by,lineW,sx,xx;
  for(li=0;li<lines.length;li++){
    runs=lines[li];by=firstBase+li*lh;lineW=0;
    for(r=0;r<runs.length;r++)lineW+=ctx.measureText(runs[r].t).width;
    sx=align==='left'?cx:(align==='right'?cx-lineW:cx-lineW/2);
    if(L.shadow){ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=size*0.14;ctx.shadowOffsetY=size*0.07;xx=sx;for(r=0;r<runs.length;r++){ctx.fillStyle=runs[r].color;ctx.fillText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}ctx.restore();}
    if(L.strokeW&&L.strokeW>0){ctx.lineWidth=L.strokeW;ctx.strokeStyle=L.stroke||'#000';ctx.lineJoin='round';xx=sx;for(r=0;r<runs.length;r++){ctx.strokeText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}}
    xx=sx;for(r=0;r<runs.length;r++){ctx.fillStyle=runs[r].color;ctx.fillText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}
  }
  ctx.restore();
}
// measured size (base units) of a text label, for hit-testing / selection box
function textLabelSize(ctx,L){
  var segs=(L.segments&&L.segments.length)?L.segments:[{t:(L.text||''),color:'#fff'}];
  var fam=(FONT_CSS[L.font]||fontCssFamily(L.font)||'sans-serif'),size=L.size||40,weight=800;
  var lineStrs=[''],s,p,parts;
  for(s=0;s<segs.length;s++){parts=String(segs[s].t==null?'':segs[s].t).split('\n');for(p=0;p<parts.length;p++){if(p>0)lineStrs.push('');lineStrs[lineStrs.length-1]+=parts[p];}}
  ctx.save();ctx.font=weight+' '+size+'px '+fam;try{if('letterSpacing' in ctx)ctx.letterSpacing=(L.letterSpacing||0)+'px';}catch(e){}
  var maxW=1;for(var i=0;i<lineStrs.length;i++)maxW=Math.max(maxW,ctx.measureText(lineStrs[i]).width);ctx.restore();
  return {w:maxW,h:size*1.18*lineStrs.length};
}

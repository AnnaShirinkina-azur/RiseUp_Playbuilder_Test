function $(i){return document.getElementById(i);}
function sv(i,v){const e=$(i);if(e)e.textContent=v;}
function setHexValue(id,v,fallback){const e=$(id);if(e)e.value=normalizeHexColor(v,fallback||e.defaultValue||'#ffffff').toUpperCase();}
function normalizeHexColor(v,fallback){
  fallback=fallback||'#ffffff';
  v=String(v==null?'':v).trim();
  if(!v)return fallback;
  let m=v.match(/^#?([0-9a-fA-F]{3})$/);
  if(m){const a=m[1];return ('#'+a[0]+a[0]+a[1]+a[1]+a[2]+a[2]).toLowerCase();}
  m=v.match(/^#?([0-9a-fA-F]{6})$/);
  if(m)return ('#'+m[1]).toLowerCase();
  m=v.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if(m){
    const parts=[m[1],m[2],m[3]].map(n=>Math.max(0,Math.min(255,parseInt(n,10)||0)));
    return '#'+parts.map(n=>n.toString(16).padStart(2,'0')).join('');
  }
  return fallback;
}
function bindHexColorInputs(root){
  (root||document).querySelectorAll('input.hex-color').forEach(e=>{
    if(e.__hexBound)return;e.__hexBound=true;
    const normalize=()=>{const old=e.value;const next=normalizeHexColor(old,e.dataset.fallback||e.defaultValue||'#ffffff');e.value=next.toUpperCase();e.classList.remove('invalid');};
    e.value=normalizeHexColor(e.value||e.defaultValue||'#ffffff').toUpperCase();
    e.addEventListener('input',()=>{
      const v=String(e.value||'').trim();
      const ok=/^#?[0-9a-fA-F]{3}$/.test(v)||/^#?[0-9a-fA-F]{6}$/.test(v)||/^rgba?\s*\(/i.test(v);
      e.classList.toggle('invalid',!!v&&!ok);
      if(ok){e.value=normalizeHexColor(v,e.dataset.fallback||e.defaultValue||'#ffffff').toUpperCase();e.classList.remove('invalid');}
    });
    e.addEventListener('change',normalize);
    e.addEventListener('blur',normalize);
  });
}
document.addEventListener('DOMContentLoaded',()=>bindHexColorInputs(document));
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
  document.querySelectorAll(`[id="th-${key}"],[id="th-${key}-visuals"],[id="th-${key}-level"]`).forEach(th=>{th.innerHTML=key==='player'?'<img src="Assets/textures/balloon.png" alt="balloon">':key==='shield'?'<img src="Assets/textures/controller.png" alt="controller">':key.indexOf('background')===0?'🖼️':key.indexOf('bg_seam')===0?'〰️':'⬛';});
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

function isSeamMulti(){
  const mode=$('cfg-seamOverlayMode');
  if(mode)return mode.value==='perStage';
  const e=$('cfg-seamMulti');return !!(e&&e.checked);
}
function seamKeyForStage(i){return 'bg_seam_stage'+i;}
function seamKeyForBoundary(i){return seamKeyForStage(i+1);} // legacy helper: boundary uses the incoming level overlay
function renderSeamRows(){
  const box=$('seam-multi-box');if(!box)return;
  const total=getStageCount()+2;
  let h='';
  for(let i=0;i<total;i++){
    const k=seamKeyForStage(i);
    h+=`<div class="sp-row seam-row"><div class="sp-up">
      <div class="thumb" id="th-${k}" style="width:30px;height:30px;font-size:12px;">〰️</div>
      <span class="seam-label">${bgStageLabel(i,total)}</span>
      <label class="ul-btn" style="font-size:11px;">+ PNG<input type="file" accept="image/*" style="display:none" onchange="loadSpr('${k}',this)"></label>
      <button class="x-btn" style="padding:3px 5px;" onclick="clearSpr('${k}')">✕</button>
    </div></div>`;
  }
  box.innerHTML=h;
  const sp=RiseBuilder.getSprites();
  for(let i=0;i<total;i++){const k=seamKeyForStage(i);if(sp[k]){const th=$('th-'+k);if(th)th.innerHTML=`<img src="${sp[k]}">`;}}
}
function syncSeamMode(forcedMode){
  const mode=$('cfg-seamOverlayMode'),legacy=$('cfg-seamMulti');
  let m=forcedMode||(mode&&mode.value)||((legacy&&legacy.checked)?'perStage':'common');
  if(m==='multi')m='perStage';
  if(m!=='perStage'&&m!=='common')m='perStage';
  const multi=m==='perStage';
  const one=$('seam-single-box'),many=$('seam-multi-box'),bar=$('seam-mode-bar');
  if(mode)mode.value=m;
  if(legacy)legacy.checked=multi;
  if(bar)bar.querySelectorAll('.orbtn').forEach(b=>b.classList.toggle('on',b.dataset.seammode===m));
  if(one)one.style.display=multi?'none':'';
  if(many)many.style.display=multi?'':'none';
  if(multi)renderSeamRows();
  if(window.RiseLevelEditor)RiseLevelEditor.draw();
}
function setSeamMode(m){
  m=(m==='perStage'||m==='multi')?'perStage':'common';
  syncSeamMode(m);
  const pb=$('btn-prev');if(pb&&!pb.disabled)pb.click();
}
function renderBgStageRows(){
  const box=$('bg-stage-rows');if(!box)return;
  const total=getStageCount()+2; // Start + minis + Finish
  // preserve already chosen gradient colors across re-render
  const keep={};box.querySelectorAll('input.hex-color').forEach(e=>keep[e.id]=normalizeHexColor(e.value,e.defaultValue||'#ffffff').toUpperCase());
  let h='';
  for(let i=0;i<total;i++){
    const k='bg_stage'+i,d=BG_GRAD_DEFAULTS[i%BG_GRAD_DEFAULTS.length];
    const a=keep['cfg-bgg'+i+'a']||d[0],b=keep['cfg-bgg'+i+'b']||d[1],t=keep['cfg-bgt'+i]||'#ffffff';
    h+=`<div class="sp-row bg-stage-row"><div class="sp-up">
      <div class="thumb" id="th-${k}" style="width:30px;height:30px;font-size:12px;">🖼️</div>
      <span class="bg-label">${bgStageLabel(i,total)}</span>
      <label class="ul-btn" style="font-size:11px;">+ PNG<input type="file" accept="image/*" style="display:none" onchange="loadSpr('${k}',this)"></label>
      <button class="x-btn" style="padding:3px 5px;" onclick="clearSpr('${k}')">✕</button>
    </div><div class="bg-colors">
      <div class="bg-gradient-preview" id="bg-grad-prev-${i}" title="Превью градиента"></div>
      <label class="bg-hex-wrap" title="Нижний цвет градиента"><span class="bg-color-preview" id="bg-chip-${i}a"></span><input type="text" class="hex-color" inputmode="text" spellcheck="false" id="cfg-bgg${i}a" value="${normalizeHexColor(a).toUpperCase()}"></label>
      <label class="bg-hex-wrap" title="Верхний цвет градиента"><span class="bg-color-preview" id="bg-chip-${i}b"></span><input type="text" class="hex-color" inputmode="text" spellcheck="false" id="cfg-bgg${i}b" value="${normalizeHexColor(b).toUpperCase()}"></label>
      <label class="bg-hex-wrap" title="Тинт картинки уровня (белый = без тинта)"><span class="bg-color-preview" id="bg-chip-${i}t"></span><input type="text" class="hex-color" inputmode="text" spellcheck="false" id="cfg-bgt${i}" value="${normalizeHexColor(t).toUpperCase()}"></label>
    </div></div>`;
  }
  box.innerHTML=h;
  // restore uploaded thumbnails
  const sp=RiseBuilder.getSprites();
  for(let i=0;i<total;i++){const k='bg_stage'+i;if(sp[k]){const th=$('th-'+k);if(th)th.innerHTML=`<img src="${sp[k]}">`;}}
  bindHexColorInputs(box);
  updateBgStagePreviews();
  box.querySelectorAll('input.hex-color').forEach(e=>{
    const redraw=()=>{updateBgStagePreviews();if(window.RiseLevelEditor)RiseLevelEditor.draw();};
    e.addEventListener('input',redraw);e.addEventListener('change',redraw);e.addEventListener('blur',redraw);
  });
}
function updateBgStagePreviews(){
  const total=getStageCount()+2;
  for(let i=0;i<total;i++){
    const a=normalizeHexColor($('cfg-bgg'+i+'a')?.value,BG_GRAD_DEFAULTS[i%BG_GRAD_DEFAULTS.length][0]).toUpperCase();
    const b=normalizeHexColor($('cfg-bgg'+i+'b')?.value,BG_GRAD_DEFAULTS[i%BG_GRAD_DEFAULTS.length][1]).toUpperCase();
    const t=normalizeHexColor($('cfg-bgt'+i)?.value,'#ffffff').toUpperCase();
    const ca=$('bg-chip-'+i+'a'),cb=$('bg-chip-'+i+'b'),ct=$('bg-chip-'+i+'t'),gp=$('bg-grad-prev-'+i);
    if(ca)ca.style.background=a;
    if(cb)cb.style.background=b;
    if(ct)ct.style.background=t;
    if(gp)gp.style.background='linear-gradient(180deg,'+b+','+a+')';
  }
}
renderBgStageRows();
renderSeamRows();
bindHexColorInputs(document);
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
window.RiseBgUI={getBgMode,renderBgStageRows,renderSeamRows,isSeamMulti,seamKeyForStage,seamKeyForBoundary,BG_GRAD_DEFAULTS};
$('cfg-seamScale')?.addEventListener('input',()=>{if(window.RiseLevelEditor)RiseLevelEditor.draw();});
document.querySelectorAll('.orbtn[data-seammode]').forEach(b=>b.addEventListener('click',()=>setSeamMode(b.dataset.seammode)));
document.addEventListener('click',e=>{const b=e.target.closest('.orbtn[data-seammode]');if(b&&!b.__seamBound)setSeamMode(b.dataset.seammode);});
document.querySelectorAll('.orbtn[data-seammode]').forEach(b=>b.__seamBound=true);
$('cfg-seamMulti')?.addEventListener('change',syncSeamMode);
syncSeamMode();
$('cfg-playerSize')?.addEventListener('input',()=>{if(window.RiseLevelEditor)RiseLevelEditor.draw();});
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

// preview controls
let previewBuilt=false;
let previewDirty=true;
let previewBuilding=false;
function previewApi(){
  try{return $('pif').contentWindow&&$('pif').contentWindow.RisePreviewControl;}catch(e){return null;}
}
function markPreviewDirty(){previewDirty=true;}
document.addEventListener('input',e=>{if(!e.target.closest('.pact'))markPreviewDirty();},true);
document.addEventListener('change',e=>{if(!e.target.closest('.pact'))markPreviewDirty();},true);
document.addEventListener('pointerup',e=>{if(e.target&&e.target.id==='ec')markPreviewDirty();},true);
document.addEventListener('keyup',e=>{if(['Delete','Backspace'].includes(e.key))markPreviewDirty();},true);
async function buildPreviewNow(){
  if(previewBuilding)return false;
  previewBuilding=true;
  const updBtn=$('btn-prev');
  const playBtn=$('btn-play');
  const oldUpd=updBtn?updBtn.textContent:'';
  if(updBtn){updBtn.disabled=true;updBtn.textContent='⏳…';}
  if(playBtn){playBtn.disabled=true;}
  try{
    await RiseBuilder.buildPreview($('pif'),{assetsBase:'Assets',onProgress:setP,onError:showErr});
    hideP();
    previewBuilt=true;
    previewDirty=false;
    $('btn-play')?.classList.remove('on');
    $('btn-pause')?.classList.remove('on');
    return true;
  }finally{
    previewBuilding=false;
    if(updBtn){updBtn.disabled=false;updBtn.textContent=oldUpd||'▶ Update Preview';}
    if(playBtn){playBtn.disabled=false;}
  }
}
async function ensurePreviewBuilt(){
  if(previewBuilt&&!previewDirty&&previewApi())return true;
  return await buildPreviewNow();
}
$('btn-prev').addEventListener('click',async()=>{await buildPreviewNow();});
$('btn-play').addEventListener('click',async()=>{
  let api=previewApi();
  const canResume=api&&api.isPaused&&api.isPaused()&&!previewDirty;
  if(!canResume){
    if(!(await ensurePreviewBuilt()))return;
    api=previewApi();
  }
  if(api&&api.play)api.play();
  $('btn-play').classList.add('on');
  $('btn-pause').classList.remove('on');
});
$('btn-pause').addEventListener('click',()=>{
  const api=previewApi();
  if(api&&api.pause)api.pause();
  $('btn-pause').classList.add('on');
  $('btn-play').classList.remove('on');
});
$('btn-stop').addEventListener('click',()=>{
  const api=previewApi();
  if(api&&api.stop)api.stop();
  $('btn-play').classList.remove('on');
  $('btn-pause').classList.remove('on');
});

// reset
const DEFS={
  'cfg-lives':3,'cfg-playerSize':2,'cfg-playerDeathAnimSpeed':1,'cfg-shieldSize':1,
  'cfg-gameSpeed':3.2,'cfg-acceleration':0.4,'cfg-pushForce':7,'cfg-gravityModifier':1,
  'cfg-scatterBounciness':0.35,'cfg-seamScale':1,'cfg-seamMulti':true,'cfg-seamOverlayMode':'perStage',
  'cfg-hpBarShowTime':2,'cfg-tutorialTime':3.5,'cfg-tutorialAnimEnabled':true,'cfg-tutorialObstacleShape':'square',
  'cfg-playerSpriteColor':'#ffffff','cfg-playerRopeColor':'#ffffff',
  'cfg-shieldSpriteColor':'#ffffff',
  'cfg-bgSpriteColor':'#ffffff',
  'cfg-stage0':'#e05252','cfg-stage1':'#52a0e0','cfg-stage2':'#52e08a',
  'cfg-stage3':'#e07d52','cfg-stage4':'#c052e0','cfg-stageAccents':true,'cfg-stageCount':5,'cfg-orientation':'portrait','cfg-googleFontUrl':'','cfg-googleFontFamily':'','cfg-localFontFamily':'CustomFont',
  'cfg-soundEnabled':true,'cfg-soundVolume':0.8,'cfg-vol-bgm':0.7,'cfg-vol-win':1,'cfg-vol-lose':1,'cfg-vol-hit':1,'cfg-vol-shield':0.9
};
$('btn-reset').addEventListener('click',()=>{
  Object.entries(DEFS).forEach(([id,v])=>{const e=$(id);if(!e)return;if(e.type==='checkbox'){e.checked=!!v;e.dispatchEvent(new Event('change'));}else{e.value=v;e.dispatchEvent(new Event('input'));}});
  setOrientation('portrait');
  syncSeamMode();
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
  let cur=0,sel=null,selSet=new Set(),mode='add',shape='rect',customShape=null,drag=false,doff={x:0,y:0},scaleRef=null,dragStart=null,groupAnchorUI={anchor:'cc'};
  let showZones=true;
  let showGrid=true;
  // Active zone = central square the level should fit into (design units, square).
  // Passive zone = the screen extension around it: vertical bands in portrait,
  // horizontal bands in landscape. Purely a visual guide — placement is not restricted.
  const ACTIVE_W=1020,ACTIVE_H=1020;
  let customShapeImageSrc=null,customShapeSvgPoints=null,customShapePrefabItems=null;
  const BUILTIN_SHAPES={
    rect:{name:'Rectangle',svg:"<svg width=\"128\" height=\"128\" viewBox=\"0 0 128 128\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect width=\"128\" height=\"128\" fill=\"white\"/>\n</svg>",baseW:60,baseH:60,points:[{x:-.5,y:-.5},{x:.5,y:-.5},{x:.5,y:.5},{x:-.5,y:.5}]},
    circle:{name:'Circle',svg:"<svg width=\"128\" height=\"128\" viewBox=\"0 0 128 128\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<circle cx=\"64\" cy=\"64\" r=\"64\" fill=\"white\"/>\n</svg>",baseW:60,baseH:60,points:Array.from({length:32},(_,i)=>{const a=Math.PI*2*i/32;return {x:Math.cos(a)*.5,y:Math.sin(a)*.5};})},
    triangle:{name:'Triangle',svg:"<svg width=\"111\" height=\"96\" viewBox=\"0 0 111 96\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M55.4256 0L110.851 96H-2.67029e-05L55.4256 0Z\" fill=\"white\"/>\n</svg>",baseW:70,baseH:60,points:[{x:0,y:-.5},{x:.5,y:.5},{x:-.5,y:.5}]}
  };
  Object.values(BUILTIN_SHAPES).forEach(b=>{b.imageSrc='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(b.svg);});
  function isObstacleItem(o){return !!(o&&(!o.kind||o.kind==='svgTemplate'));}
  function clampScale(v){v=parseFloat(v);return isFinite(v)?Math.max(.05,Math.min(20,v)):1;}
  function ensureObstacleScale(o){
    if(!isObstacleItem(o))return o;
    if(o.baseW==null)o.baseW=Math.max(1,parseFloat(o.w)||60);
    if(o.baseH==null)o.baseH=Math.max(1,parseFloat(o.h)||60);
    if(o.scale==null)o.scale=1;
    if(o.scaleX==null)o.scaleX=Math.max(.05,(parseFloat(o.w)||o.baseW)/(o.baseW*(parseFloat(o.scale)||1)));
    if(o.scaleY==null)o.scaleY=Math.max(.05,(parseFloat(o.h)||o.baseH)/(o.baseH*(parseFloat(o.scale)||1)));
    applyObstacleScale(o);return o;
  }
  function applyObstacleScale(o){
    if(!isObstacleItem(o))return;
    const oldX=parseFloat(o.x)||0,oldY=parseFloat(o.y)||0,oldW=parseFloat(o.w)||parseFloat(o.baseW)||60,oldH=parseFloat(o.h)||parseFloat(o.baseH)||60;
    let anchorPoint=null;
    if(o.anchorOffsetX!=null&&o.anchorOffsetY!=null)anchorPoint=obstacleAnchorPointLocal(o);
    else if(o.anchor)anchorPoint=obstacleAnchorPointFromCenter(o.anchor,oldX,oldY,oldW,oldH);
    const sc=clampScale(o.scale),sx=clampScale(o.scaleX),sy=clampScale(o.scaleY);
    o.scale=sc;o.scaleX=sx;o.scaleY=sy;
    // Keep fractional design sizes while dragging. Rounding every pointermove made
    // scale feel steppy and caused objects to drift by a pixel at a time.
    o.w=Math.max(6,(parseFloat(o.baseW)||60)*sc*sx);
    o.h=Math.max(6,(parseFloat(o.baseH)||60)*sc*sy);
    if(anchorPoint){setObstacleCenterFromAnchorPoint(o,anchorPoint.x,anchorPoint.y);writeObstacleAnchorOffsetFromPoint(o,anchorPoint.x,anchorPoint.y);}
  }
  function scaleUiValues(){return {scale:clampScale($('os')?.value),scaleX:clampScale($('osx')?.value),scaleY:clampScale($('osy')?.value)};}
  function makeBuiltInObstacle(kind,x,y){const b=BUILTIN_SHAPES[kind]||BUILTIN_SHAPES.rect,v=scaleUiValues();const o={x,y,coordMode:'center',shape:'custom',customName:b.name,points:b.points.map(p=>({x:p.x,y:p.y})),imageSrc:b.imageSrc,baseW:b.baseW,baseH:b.baseH,scale:v.scale,scaleX:v.scaleX,scaleY:v.scaleY,color:$('oc')?.value||'#ffffff',moveX:parseInt($('om')?.value)||0,moveSpeed:1800,anchor:'cc'};applyObstacleScale(o);writeObstacleAnchorOffsetFromPoint(o,x,y);return o;}
  const svgTemplates=[];
  let selectedTemplateId=null;
  const lvls=Array.from({length:NS+2},()=>[]);
  const PLAYER_KIND='playerStart';
  function defaultPlayerLocal(){return {x:0,y:Math.round(GH*.20),anchor:'cc',anchorOffsetX:0,anchorOffsetY:20};}
  function ensurePlayerObject(){
    if(!lvls[0])lvls[0]=[];
    const existing=lvls[0].find(o=>o&&o.kind===PLAYER_KIND);
    if(existing)return existing;
    const d=defaultPlayerLocal();
    const p={kind:PLAYER_KIND,coordMode:'center',x:d.x,y:d.y,anchor:d.anchor,anchorOffsetX:d.anchorOffsetX,anchorOffsetY:d.anchorOffsetY,locked:true,lockedSingleton:true};
    lvls[0].unshift(p);
    if(cur===0){selSet=new Set(Array.from(selSet).map(i=>i+1));if(sel!=null)sel++;}
    return p;
  }
  function playerLocal(o){if(o&&o.anchorOffsetX!=null&&o.anchorOffsetY!=null){const b=progressAnchorBaseLocal(o.anchor||'cc');return {x:b.x+(parseFloat(o.anchorOffsetX)||0)*GW/100,y:b.y+(parseFloat(o.anchorOffsetY)||0)*GH/100};}return {x:(o&&o.x!=null)?o.x:0,y:(o&&o.y!=null)?o.y:Math.round(GH*.22)};}
  function ensurePlayerAnchor(o){if(!o||o.kind!==PLAYER_KIND)return;if(!o.anchor)o.anchor='cc';if(o.anchorOffsetX==null||o.anchorOffsetY==null){const l={x:o.x||0,y:o.y==null?Math.round(GH*.20):o.y},b=progressAnchorBaseLocal(o.anchor);o.anchorOffsetX=Math.round(((l.x-b.x)/GW)*1000)/10;o.anchorOffsetY=Math.round(((l.y-b.y)/GH)*1000)/10;}}
  function setPlayerLocalFromOffset(o){if(!o||o.kind!==PLAYER_KIND)return;const l=playerLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  const cv=$('ec'),ctx=cv.getContext('2d'),wrap=$('ec-wrap');

  const imageCache=new Map();
  function getEditorImage(src){if(!src)return null;if(imageCache.has(src))return imageCache.get(src);const im=new Image();im.onload=()=>draw();im.onerror=()=>draw();im.src=src;imageCache.set(src,im);return im;}
  function imageReady(im){return im&&im.complete&&im.naturalWidth>0;}
  function selectionIndices(){return Array.from(selSet).filter(i=>lvls[cur]&&lvls[cur][i]).sort((a,b)=>a-b);}
  function hasMultiSelection(){return selectionIndices().length>1;}
  function isSelected(si,i){return si===cur && selSet.has(i);}
  function setSelection(idx,additive){
    if(idx==null||idx<0){sel=null;selSet.clear();return;}
    if(additive){
      if(selSet.has(idx))selSet.delete(idx);else selSet.add(idx);
      sel=selectionIndices()[0]??null;
    }else{sel=idx;selSet=new Set([idx]);}
  }
  function clearSelection(){sel=null;selSet.clear();}
  function itemLocal(it){return it.kind===PLAYER_KIND?playerLocal(it):(it.kind==='text'?textLocal(it):(it.kind==='progress'?progressLocal(it):(it.kind==='health'?healthLocal(it):(it.kind==='cta'?ctaLocal(it):(it.kind==='tutorial'?tutorialLocal(it):it)))));}
  function moveItemTo(it,nx,ny){
    nx=Math.round(nx);ny=Math.round(ny);
    if(it.kind===PLAYER_KIND){ensurePlayerAnchor(it);it.anchorOffsetX=Math.round(((nx-progressAnchorBaseLocal(it.anchor).x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-progressAnchorBaseLocal(it.anchor).y)/GH)*1000)/10;setPlayerLocalFromOffset(it);}
    else if(it.kind==='text'){const b=anchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setTextLocalFromOffset(it);}
    else if(it.kind==='progress'){const b=progressAnchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setProgressLocalFromOffset(it);}
    else if(it.kind==='health'){const b=progressAnchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setHealthLocalFromOffset(it);}
    else if(it.kind==='cta'){const b=progressAnchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setCtaLocalFromOffset(it);}
    else if(it.kind==='tutorial'){const b=progressAnchorBaseLocal(it.anchor);it.anchorOffsetX=Math.round(((nx-b.x)/GW)*1000)/10;it.anchorOffsetY=Math.round(((ny-b.y)/GH)*1000)/10;setTutorialLocalFromOffset(it);}
    else if(isObstacleItem(it)){ensureObstacleAnchor(it);it.x=nx;it.y=ny;const p=obstacleAnchorPointFromCenter(it.anchor||'cc',it.x,it.y,it.w||60,it.h||60);writeObstacleAnchorOffsetFromPoint(it,p.x,p.y);}
    else{it.x=nx;it.y=ny;}
  }


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
    renderSeamRows();
    syncSeamMode();
bindHexColorInputs(document);
    ensurePlayerObject();clearSelection();resize(true);
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
    const sv=scaleUiValues(),groupW=Math.round(180*sv.scale*sv.scaleX),groupH=Math.round(170*sv.scale*sv.scaleY),color=$('oc').value,moveX=parseInt($('om').value)||0;
    const wrapper={kind:'svgTemplate',x:cx,y:cy,coordMode:'center',w:Math.max(6,groupW),h:Math.max(6,groupH),baseW:180,baseH:170,scale:sv.scale,scaleX:sv.scaleX,scaleY:sv.scaleY,color,moveX,moveSpeed:1800,templateName:prefab.name||'svg_template',imageSrc:prefab.imageSrc,items:(prefab.items||[]).map(it=>({shape:it.shape||'rect',dx:it.dx||0,dy:it.dy||0,wRel:it.wRel||.1,hRel:it.hRel||.1,points:it.points?it.points.map(p=>({x:p.x,y:p.y})):null,color:it.color||null}))};
    // Templates are inserted unlocked: in the editor they are immediately separate obstacles,
    // but they are selected together so the user can still move/scale the just-placed template as a group.
    if(!wrapper.templateGroupId)wrapper.templateGroupId='tpl_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
    const children=flattenSvgTemplate(wrapper);
    const start=lvls[stageIndex].length;
    lvls[stageIndex].push(...children);
    selSet=new Set(children.map((_,k)=>start+k));
    sel=start;
  }
  function flattenSvgTemplate(o){
    ensureObstacleScale(o);
    const out=[];
    const gid=o.templateGroupId||('tpl_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2));
    (o.items||[]).forEach((it,idx)=>{
      const child={x:Math.round((o.x||0)+(it.dx||0)*(o.w||180)),y:Math.round((o.y||0)+(it.dy||0)*(o.h||170)),coordMode:'center',baseW:Math.max(6,(it.wRel||.1)*(o.w||180)),baseH:Math.max(6,(it.hRel||.1)*(o.h||170)),scale:1,scaleX:1,scaleY:1,shape:it.shape||'rect',color:it.color||o.color||'#ffffff',moveX:o.moveX||0,moveSpeed:o.moveSpeed||1800,prefabName:o.templateName||'svg_template',prefabIndex:idx,templateGroupId:gid,templateUnlocked:true,anchor:'cc'};
      child.w=child.baseW;child.h=child.baseH;writeObstacleAnchorOffsetFromPoint(child,child.x,child.y);
      if(child.shape==='custom'&&it.points)child.points=it.points.map(p=>({x:p.x,y:p.y}));
      out.push(child);
    });
    return out;
  }
  function unlockSelectedTemplate(){
    const idx=sel;
    const stage=lvls[cur];
    const o=stage&&stage[idx];
    if(!o||o.kind!=='svgTemplate')return;
    if(!o.templateGroupId)o.templateGroupId='tpl_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
    const children=flattenSvgTemplate(o);
    stage.splice(idx,1,...children);
    selSet=new Set(children.map((_,k)=>idx+k));
    sel=idx;
    syncProps();
    draw();
  }

  // shape buttons
  document.querySelectorAll('.et[data-shape]').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');shape=b.dataset.shape;mode='add';selectedTemplateId=null;customShape=null;renderTemplateList();$('et-sel').classList.remove('on');$('et-text').classList.remove('on');$('et-progress')&&$('et-progress').classList.remove('on');$('et-health')&&$('et-health').classList.remove('on');$('et-cta')&&$('et-cta').classList.remove('on');$('et-scale').classList.remove('on');$('et-tutorial')&&$('et-tutorial').classList.remove('on');
    });
  });
  document.querySelectorAll('[data-shape-pick]').forEach(card=>card.addEventListener('click',()=>{
    const btn=document.querySelector('.et[data-shape="'+card.dataset.shapePick+'"]');
    if(btn)btn.click();
    const rt=document.querySelector('.rtab[data-rt="levels"]');if(rt)rt.click();
  }));
  // Tutorial: единый настраиваемый шаблон (пирамида + рука + надпись), один на игру.
  const TUT_UNITS=[[-0.674,4.651],[0,4.651],[0.649,4.651],[-0.338,5.28],[0.338,5.28],[0,5.882]];
  const TUT_TEXT_DEFAULT='Move the circle\nto break the block';
  function tutorialUnitPx(o){return Math.min(GW,GH)*0.14*(parseFloat(o&&o.scale)||1);}
  function tutorialLocal(o){return progressLocal(o);}
  function setTutorialLocalFromOffset(o){if(!o||o.kind!=='tutorial')return;const l=tutorialLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  function tutorialBoxLocal(o){
    const l=tutorialLocal(o),S=tutorialUnitPx(o);
    // композиция в юнитах: x -1.6..1.6, y (uy) 2.4(низ текста)..6.15(верх пирамиды); центр бокса uy=4.28
    const w=3.2*S,h=3.75*S;
    return {x:l.x-w/2,y:l.y-(6.15-4.28)*S,w,h};
  }
  $('et-tutorial')?.addEventListener('click',()=>{
    selectedTemplateId=null;renderTemplateList();mode='tutorial';clearToolButtons();$('et-tutorial').classList.add('on');
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
  $('et-del').addEventListener('click',()=>{const s=lvls[cur],ids=selectionIndices().filter(i=>!(s[i]&&s[i].kind===PLAYER_KIND));if(!ids.length)return;ids.sort((a,b)=>b-a).forEach(i=>s.splice(i,1));clearSelection();syncProps();draw();});
  $('et-clr').addEventListener('click',()=>{if(!confirm('Clear '+stageLabel(cur)+'?'))return;lvls[cur]=lvls[cur].filter(o=>o&&o.kind===PLAYER_KIND);clearSelection();syncProps();draw();});
  $('le-generate')?.addEventListener('click',()=>{setStageCount($('le-stage-count').value);});
  $('le-stage-count')?.addEventListener('input',e=>setStageCount(e.target.value));
  $('cfg-stageCount')?.addEventListener('input',e=>{if(String(e.target.value)!==String(NS))setStageCount(e.target.value);});
  $('le-zones')?.addEventListener('click',()=>{showZones=!showZones;$('le-zones').classList.toggle('on',showZones);draw();});
  $('le-grid')?.addEventListener('change',e=>{showGrid=!!e.target.checked;draw();});

  // ── Tool buttons helper ───────────────────────────────────────────────────
  function clearToolButtons(){document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));$('et-sel').classList.remove('on');$('et-scale').classList.remove('on');$('et-text').classList.remove('on');$('et-progress').classList.remove('on');$('et-health')&&$('et-health').classList.remove('on');$('et-cta')&&$('et-cta').classList.remove('on');$('et-tutorial')&&$('et-tutorial').classList.remove('on');}
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

  ['os','osx','osy','oc','om'].forEach(id=>{$(id)?.addEventListener('input',()=>{const ids=selectionIndices();if(!ids.length)return;ids.forEach(i=>{const o=lvls[cur][i];if(!o||o.kind==='text'||o.kind==='progress'||o.kind==='health'||o.kind==='cta'||o.kind==='tutorial')return;if(o.kind==='bg'){o.tint=$('oc').value;return;}ensureObstacleAnchor(o);o.scale=clampScale($('os').value);o.scaleX=clampScale($('osx').value);o.scaleY=clampScale($('osy').value);applyObstacleScale(o);o.color=$('oc').value;o.moveX=parseInt($('om').value)||0;});draw();});});
  document.querySelectorAll('#ob-anchor button').forEach(b=>b.addEventListener('click',()=>{const ids=selectionIndices();if(!ids.length)return;if(hasMultiSelection()){groupAnchorUI.anchor=b.dataset.a;const base=obstacleAnchorBaseLocal(groupAnchorUI.anchor),ox=parseFloat($('ob-offx').value)||0,oy=parseFloat($('ob-offy').value)||0;moveSelectionCenterTo(base.x+ox*GW/100,base.y+oy*GH/100);syncGroupAnchorFields();}
    else{const o=selItem();if(!isObstacleItem(o))return;ensureObstacleScale(o);const keep={x:o.x||0,y:o.y||0,w:o.w||60,h:o.h||60};o.anchor=b.dataset.a;const p=obstacleAnchorPointFromCenter(o.anchor,keep.x,keep.y,keep.w,keep.h);writeObstacleAnchorOffsetFromPoint(o,p.x,p.y);setObstacleLocalFromOffset(o);document.querySelectorAll('#ob-anchor button').forEach(x=>x.classList.toggle('on',x===b));}
    draw();}));
  ['ob-offx','ob-offy'].forEach(id=>{$(id)?.addEventListener('input',()=>{const ids=selectionIndices();if(!ids.length)return;if(hasMultiSelection()){const base=obstacleAnchorBaseLocal(groupAnchorUI.anchor||'cc'),ox=parseFloat($('ob-offx').value)||0,oy=parseFloat($('ob-offy').value)||0;moveSelectionCenterTo(base.x+ox*GW/100,base.y+oy*GH/100);}else{const o=selItem();if(!o||o.kind)return;ensureObstacleAnchor(o);o.anchorOffsetX=parseFloat($('ob-offx').value)||0;o.anchorOffsetY=parseFloat($('ob-offy').value)||0;setObstacleLocalFromOffset(o);}draw();});});

  function resize(keepScroll=false){
    const oldTop=wrap.scrollTop,oldLeft=wrap.scrollLeft;
    // Keep the editor layout in sync with the visible orientation controls.
    // Previous builds could leave currentOrientation as landscape while the
    // Portrait button was visually selected, which made stages look like they
    // were split horizontally.
    const activeEditorOr=document.querySelector('#orientation-editor .orbtn.on')?.dataset?.or;
    const hiddenOr=$('cfg-orientation')?.value;
    if(activeEditorOr==='portrait'||activeEditorOr==='landscape')currentOrientation=activeEditorOr;
    else if(hiddenOr==='portrait'||hiddenOr==='landscape')currentOrientation=hiddenOr;
    GH=844;
    const vw=Math.max(1,wrap&&wrap.clientWidth?wrap.clientWidth:1);
    const vh=Math.max(1,wrap&&wrap.clientHeight?wrap.clientHeight:1);
    if(currentOrientation==='landscape'){
      const r=vw/vh;
      GW=Math.max(844,Math.round(GH*r));
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
  function obstacleAnchorBaseLocal(anchor){return progressAnchorBaseLocal(anchor||'cc');}
  function obstacleAnchorPointFromCenter(anchor,cx,cy,w,h){
    const a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1);
    return {x:ah==='l'?cx-w/2:(ah==='r'?cx+w/2:cx),y:av==='t'?cy-h/2:(av==='b'?cy+h/2:cy)};
  }
  function setObstacleCenterFromAnchorPoint(o,ax,ay){
    const a=o.anchor||'cc',av=a.charAt(0),ah=a.charAt(1),w=parseFloat(o.w)||60,h=parseFloat(o.h)||60;
    o.x=ah==='l'?ax+w/2:(ah==='r'?ax-w/2:ax);
    o.y=av==='t'?ay+h/2:(av==='b'?ay-h/2:ay);
  }
  function writeObstacleAnchorOffsetFromPoint(o,ax,ay){
    const b=obstacleAnchorBaseLocal(o.anchor||'cc');
    o.anchorOffsetX=Math.round(((ax-b.x)/GW)*1000)/10;
    o.anchorOffsetY=Math.round(((ay-b.y)/GH)*1000)/10;
  }
  function obstacleAnchorPointLocal(o){
    if(o&&o.anchorOffsetX!=null&&o.anchorOffsetY!=null){const b=obstacleAnchorBaseLocal(o.anchor||'cc');return{x:b.x+(parseFloat(o.anchorOffsetX)||0)*GW/100,y:b.y+(parseFloat(o.anchorOffsetY)||0)*GH/100};}
    return obstacleAnchorPointFromCenter(o&&o.anchor,o&&o.x||0,o&&o.y||0,o&&o.w||60,o&&o.h||60);
  }
  function ensureObstacleAnchor(o){
    if(!isObstacleItem(o))return;
    ensureObstacleScale(o);
    if(!o.anchor)o.anchor='cc';
    if(o.anchorOffsetX==null||o.anchorOffsetY==null){const p=obstacleAnchorPointFromCenter(o.anchor,o.x||0,o.y||0,o.w||60,o.h||60);writeObstacleAnchorOffsetFromPoint(o,p.x,p.y);}
    setObstacleLocalFromOffset(o);
  }
  function setObstacleLocalFromOffset(o){if(!isObstacleItem(o))return;const p=obstacleAnchorPointLocal(o);setObstacleCenterFromAnchorPoint(o,p.x,p.y);}
  function selectionBounds(){const ids=selectionIndices();if(!ids.length)return null;let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;ids.forEach(i=>{const o=lvls[cur][i];let bx,by,bw,bh;if(o.kind==='text'){const l=textLocal(o),sz=textLabelSize(ctx,o),bp=txBox(o.anchor,l.x,l.y,sz.w,sz.h);bx=bp.x;by=bp.y;bw=sz.w;bh=sz.h;}else if(o.kind==='progress'){const b=progressBoxLocal(o);bx=b.x;by=b.y;bw=b.w;bh=b.h;}else if(o.kind==='health'){const b=healthBoxLocal(o);bx=b.x;by=b.y;bw=b.w;bh=b.h;}else if(o.kind==='cta'){const b=ctaBoxLocal(o);bx=b.x;by=b.y;bw=b.w;bh=b.h;}else if(o.kind==='tutorial'){const b=tutorialBoxLocal(o);bx=b.x;by=b.y;bw=b.w;bh=b.h;}else{const l=itemLocal(o),w=o.kind===PLAYER_KIND?Math.max(40,(20*(parseFloat($('cfg-playerSize')?.value)||2)*4.15)):(o.w||o.heartW||60),h=o.kind===PLAYER_KIND?Math.max(80,(20*(parseFloat($('cfg-playerSize')?.value)||2)*7.4)):(o.h||o.heartW||60);bx=l.x-w/2;by=l.y-h/2;bw=w;bh=h;}minX=Math.min(minX,bx);maxX=Math.max(maxX,bx+bw);minY=Math.min(minY,by);maxY=Math.max(maxY,by+bh);});return {x:(minX+maxX)/2,y:(minY+maxY)/2,w:maxX-minX,h:maxY-minY};}
  function moveSelectionCenterTo(nx,ny){const b=selectionBounds();if(!b)return;const dx=nx-b.x,dy=ny-b.y;selectionIndices().forEach(i=>{const it=lvls[cur][i],l=uiCenterLocal(it);if(it.kind==='progress'||it.kind==='health'||it.kind==='cta'||it.kind==='tutorial')moveUiCenterTo(it,l.x+dx,l.y+dy);else moveItemTo(it,l.x+dx,l.y+dy);});}
  function syncGroupAnchorFields(){const b=selectionBounds();if(!b)return;const base=obstacleAnchorBaseLocal(groupAnchorUI.anchor||'cc');$('ob-offx').value=Math.round(((b.x-base.x)/GW)*1000)/10;$('ob-offy').value=Math.round(((b.y-base.y)/GH)*1000)/10;document.querySelectorAll('#ob-anchor button').forEach(bt=>bt.classList.toggle('on',bt.dataset.a===(groupAnchorUI.anchor||'cc')));}
  function progressLocal(o){
    // Anchor point of the UI object. The object's own anchor corner/edge is
    // attached to this point; the visual center is derived from its current
    // responsive size. This keeps text/bars glued to their selected anchors
    // when the runtime canvas is squeezed.
    if(o&&o.anchorOffsetX!=null&&o.anchorOffsetY!=null){const b=progressAnchorBaseLocal(o.anchor);return{x:b.x+(parseFloat(o.anchorOffsetX)||0)*GW/100,y:b.y+(parseFloat(o.anchorOffsetY)||0)*GH/100};}
    return {x:(o&&o.x)||0,y:(o&&o.y)||0};
  }
  function setProgressLocalFromOffset(o){if(!o||o.kind!=='progress')return;const l=progressLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  function ctaLocal(o){return progressLocal(o);}
  function setCtaLocalFromOffset(o){if(!o||o.kind!=='cta')return;const l=ctaLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  function healthLocal(o){return progressLocal(o);}
  function setHealthLocalFromOffset(o){if(!o||o.kind!=='health')return;const l=healthLocal(o);o.x=Math.round(l.x);o.y=Math.round(l.y);}
  function anchorBoxLocal(anchor,ax,ay,w,h){const a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1);return{x:ah==='l'?ax:(ah==='r'?ax-w:ax-w/2),y:av==='t'?ay:(av==='b'?ay-h:ay-h/2),w,h};}
  function progressBoxLocal(o){const l=progressLocal(o),d=progressDrawSize(o);return anchorBoxLocal(o.anchor||'cl',l.x,l.y,d.w,d.h);}
  function healthBoxLocal(o){const l=healthLocal(o),d=healthDrawSize(o),cnt=o.count||3,w=cnt*d.heartW+(cnt-1)*d.gap,h=d.heartW;return anchorBoxLocal(o.anchor||'tc',l.x,l.y,w,h);}
  function ctaDrawSize(o){ensureResponsiveBase(o);const k=uiBaseScale(o);return {w:(o.baseW||o.w||260)*k,h:(o.baseH||o.h||86)*k};}
  function ctaBoxLocal(o){const l=ctaLocal(o),d=ctaDrawSize(o);return anchorBoxLocal(o.anchor||'bc',l.x,l.y,d.w,d.h);}
  function uiCenterLocal(o){if(o.kind==='progress'){const b=progressBoxLocal(o);return{x:b.x+b.w/2,y:b.y+b.h/2};}if(o.kind==='health'){const b=healthBoxLocal(o);return{x:b.x+b.w/2,y:b.y+b.h/2};}if(o.kind==='cta'){const b=ctaBoxLocal(o);return{x:b.x+b.w/2,y:b.y+b.h/2};}if(o.kind==='tutorial'){const b=tutorialBoxLocal(o);return{x:b.x+b.w/2,y:b.y+b.h/2};}return itemLocal(o);}
  function moveUiCenterTo(o,nx,ny){let box=null;if(o.kind==='progress')box=progressBoxLocal(o);else if(o.kind==='health')box=healthBoxLocal(o);else if(o.kind==='cta')box=ctaBoxLocal(o);else if(o.kind==='tutorial')box=tutorialBoxLocal(o);if(!box){moveItemTo(o,nx,ny);return;}const ax=progressLocal(o).x+(nx-(box.x+box.w/2)),ay=progressLocal(o).y+(ny-(box.y+box.h/2));const b=progressAnchorBaseLocal(o.anchor);o.anchorOffsetX=Math.round(((ax-b.x)/GW)*1000)/10;o.anchorOffsetY=Math.round(((ay-b.y)/GH)*1000)/10;if(o.kind==='progress')setProgressLocalFromOffset(o);else if(o.kind==='health')setHealthLocalFromOffset(o);else if(o.kind==='tutorial')setTutorialLocalFromOffset(o);else setCtaLocalFromOffset(o);}
  function uiBaseScale(o){const dw=parseFloat(o&&o.designW)||390,dh=parseFloat(o&&o.designH)||844;let k=Math.min(GW/dw,GH/dh);if(!isFinite(k)||k<=0)k=1;return Math.min(1,k);}
  function ensureResponsiveBase(o){if(!o)return o;o.designW=o.designW||GW;o.designH=o.designH||GH;if(o.kind==='text'){if(o.baseSize==null)o.baseSize=o.size||64;if(o.baseStrokeW==null)o.baseStrokeW=o.strokeW||0;if(o.baseLetterSpacing==null)o.baseLetterSpacing=o.letterSpacing||0;}else if(o.kind==='progress'){if(o.baseW==null)o.baseW=o.w||64;if(o.baseH==null)o.baseH=o.h||300;}else if(o.kind==='health'){if(o.baseHeartW==null)o.baseHeartW=o.heartW||36;if(o.baseGap==null)o.baseGap=o.gap==null?6:o.gap;}else if(o.kind==='cta'){if(o.baseW==null)o.baseW=o.w||260;if(o.baseH==null)o.baseH=o.h||86;}return o;}
  function textDrawSize(o){ensureResponsiveBase(o);const k=uiBaseScale(o);return {size:(o.baseSize||o.size||64)*k,strokeW:(o.baseStrokeW!=null?o.baseStrokeW:(o.strokeW||0))*k,letterSpacing:(o.baseLetterSpacing!=null?o.baseLetterSpacing:(o.letterSpacing||0))*k};}
  function progressDrawSize(o){ensureResponsiveBase(o);const k=uiBaseScale(o);return {w:(o.baseW||o.w||64)*k,h:(o.baseH||o.h||300)*k};}
  function healthDrawSize(o){ensureResponsiveBase(o);const k=uiBaseScale(o);return {heartW:(o.baseHeartW||o.heartW||36)*k,gap:(o.baseGap!=null?o.baseGap:(o.gap==null?6:o.gap))*k};}
  function txBox(anchor,cx,cy,w,h){const a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1);return{x:ah==='l'?cx:(ah==='r'?cx-w:cx-w/2),y:av==='t'?cy:(av==='b'?cy-h:cy-h/2)};}
  function obsAt(stageIndex,gx,gyLocal){
    const arr=lvls[stageIndex]||[];
    for(let i=arr.length-1;i>=0;i--){const o=arr[i];
      if(o.kind===PLAYER_KIND){
        const l=playerLocal(o),r=20*(parseFloat($('cfg-playerSize')?.value)||2),w=r*2.2,h=r*5.4;
        if(Math.abs(gx-l.x)<=w/2+8&&gyLocal>=l.y-r*.8-8&&gyLocal<=l.y+h+8)return i;
      } else if(o.kind==='text'){
        const l=textLocal(o),sz=textLabelSize(ctx,o),bp=txBox(o.anchor,l.x,l.y,sz.w,sz.h);
        if(gx>=bp.x-8&&gx<=bp.x+sz.w+8&&gyLocal>=bp.y-8&&gyLocal<=bp.y+sz.h+8)return i;
      } else if(o.kind==='progress'){
        const b=progressBoxLocal(o);if(gx>=b.x-8&&gx<=b.x+b.w+8&&gyLocal>=b.y-8&&gyLocal<=b.y+b.h+8)return i;
      } else if(o.kind==='health'){
        const b=healthBoxLocal(o);if(gx>=b.x-8&&gx<=b.x+b.w+8&&gyLocal>=b.y-8&&gyLocal<=b.y+b.h+8)return i;
      } else if(o.kind==='cta'){
        const b=ctaBoxLocal(o);if(gx>=b.x-8&&gx<=b.x+b.w+8&&gyLocal>=b.y-8&&gyLocal<=b.y+b.h+8)return i;
      } else if(o.kind==='tutorial'){
        const b=tutorialBoxLocal(o);if(gx>=b.x-8&&gx<=b.x+b.w+8&&gyLocal>=b.y-8&&gyLocal<=b.y+b.h+8)return i;
      } else {
        if(Math.abs(gx-o.x)<=o.w/2+8&&Math.abs(gyLocal-o.y)<=o.h/2+8)return i;
      }
    }
    return -1;
  }
  function updateCurrentFromScroll(){const row=Math.max(0,Math.min(totalStages()-1,Math.floor((wrap.scrollTop/zoom+GH*.45)/GH)));cur=stageOf(row);}
  wrap.addEventListener('scroll',()=>{const old=cur;updateCurrentFromScroll();if(old!==cur){clearSelection();syncProps();draw();}});

  cv.addEventListener('pointerdown',e=>{
    const rc=cv.getBoundingClientRect();const g=toG(e.clientX-rc.left,e.clientY-rc.top);
    const row=rowFromGlobalY(g.globalY),si=stageOf(row),localY=g.globalY-row*GH-GH/2;cur=si;
    if(mode==='text'){
      const L=newTextLabel(Math.round(g.x),Math.round(localY));
      lvls[si].push(L);setSelection(lvls[si].length-1,false);syncProps();draw();return;
    }
    if(mode==='progress'){
      const x=Math.round(g.x),y=Math.round(localY);
      const P={kind:'progress',coordMode:'screen',x,y,w:64,h:300,baseW:64,baseH:300,designW:GW,designH:GH,anchor:'cl',anchorOffsetX:Math.round(((x-progressAnchorBaseLocal('cl').x)/GW)*1000)/10,anchorOffsetY:Math.round((y/GH)*1000)/10,fill:'#b9ff9b',line:'#101625',flaskSrc:null,fillSrc:null};
      lvls[si].push(P);setSelection(lvls[si].length-1,false);syncProps();draw();return;
    }
    if(mode==='health'){
      const x=Math.round(g.x),y=Math.round(localY),base=progressAnchorBaseLocal('tc');
      const H={kind:'health',coordMode:'screen',x,y,count:3,heartW:36,baseHeartW:36,gap:6,baseGap:6,designW:GW,designH:GH,emptyAlpha:.28,tint:'#ffffff',anchor:'tc',anchorOffsetX:Math.round(((x-base.x)/GW)*1000)/10,anchorOffsetY:Math.round(((y-base.y)/GH)*1000)/10,heartSrc:'Assets/textures/heart.png'};
      lvls[si].push(H);setSelection(lvls[si].length-1,false);syncProps();draw();return;
    }
    if(mode==='cta'){
      const x=Math.round(g.x),y=Math.round(localY),base=progressAnchorBaseLocal('bc');
      const C={kind:'cta',coordMode:'screen',x,y,w:260,h:86,baseW:260,baseH:86,designW:GW,designH:GH,anchor:'bc',anchorOffsetX:Math.round(((x-base.x)/GW)*1000)/10,anchorOffsetY:Math.round(((y-base.y)/GH)*1000)/10,bgTint:'#ffffff',textTint:'#ffffff',bgSrc:null,textSrc:null};
      lvls[si].push(C);setSelection(lvls[si].length-1,false);syncProps();draw();return;
    }
    if(mode==='tutorial'){
      // один туториал на игру: убрать прежний из всех уровней
      lvls.forEach(st=>{for(let i=st.length-1;i>=0;i--)if(st[i]&&st[i].kind==='tutorial')st.splice(i,1);});
      const x=Math.round(g.x),y=Math.round(localY),base=progressAnchorBaseLocal('cc');
      const T={kind:'tutorial',coordMode:'screen',x,y,designW:GW,designH:GH,anchor:'cc',
        anchorOffsetX:Math.round(((x-base.x)/GW)*1000)/10,anchorOffsetY:Math.round(((y-base.y)/GH)*1000)/10,
        scale:1,blockShape:'square',blockColor:'#373843',text:TUT_TEXT_DEFAULT,textColor:'#ffffff',textSize:18};
      lvls[si].push(T);setSelection(lvls[si].length-1,false);syncProps();draw();return;
    }
    if(mode==='drag'||mode==='scale'){
      const idx=obsAt(si,g.x,localY);
      if(idx>=0){
        if(e.shiftKey){setSelection(idx,true);if(!selSet.has(idx)){syncProps();draw();return;}}
        if(!selSet.has(idx))setSelection(idx,false);
        const it=lvls[si][idx];
        if(it&&it.kind===PLAYER_KIND&&it.locked){syncProps();draw();return;}
        drag=true;const l=uiCenterLocal(it);doff={x:g.x-l.x,y:localY-l.y};
        dragStart={clicked:idx,items:selectionIndices().map(j=>{const q=lvls[si][j],ql=uiCenterLocal(q);return {idx:j,x:ql.x,y:ql.y};}),clickedStart:{x:l.x,y:l.y}};
        // Scale from the selected anchor/pivot. Keeping the pivot fixed makes
        // objects grow away from their anchor instead of expanding from the
        // center and drifting on resize.
        let pivot={x:l.x,y:l.y};
        if(mode==='scale'&&isObstacleItem(it)){ensureObstacleAnchor(it);pivot=obstacleAnchorPointLocal(it);}
        scaleRef=mode==='scale'?{pivot,d0:Math.max(24,Math.hypot(g.x-pivot.x,localY-pivot.y)),w0:it.baseW||it.w||it.baseHeartW||it.heartW||60,h0:it.baseH||it.h||60,s0:it.baseSize||it.size||64,gap0:it.baseGap==null?it.gap:it.baseGap,scale0:it.scale||1,scaleX0:it.scaleX||1,scaleY0:it.scaleY||1}:null;
      }else{clearSelection();}
      syncProps();draw();return;
    }
    if(shape==='custom'&&customShape&&customShape.prefab){
      addPrefabObstacles(si,Math.round(g.x),Math.round(localY),customShape);
      syncProps();draw();return;
    }
    let o;
    if(shape==='custom'&&customShape){const v=scaleUiValues();o={x:Math.round(g.x),y:Math.round(localY),coordMode:'center',shape:'custom',customName:customShape.name,points:customShape.points.map(p=>({x:p.x,y:p.y})),imageSrc:customShape.imageSrc,baseW:60,baseH:60,scale:v.scale,scaleX:v.scaleX,scaleY:v.scaleY,color:$('oc').value,moveX:parseInt($('om').value)||0,moveSpeed:1800,anchor:'cc'};applyObstacleScale(o);writeObstacleAnchorOffsetFromPoint(o,o.x,o.y);} 
    else o=makeBuiltInObstacle(shape,Math.round(g.x),Math.round(localY));
    lvls[si].push(o);setSelection(lvls[si].length-1,false);syncProps();draw();
  });
  cv.addEventListener('pointermove',e=>{
    if(!drag||sel===null)return;
    const rc=cv.getBoundingClientRect();const g=toG(e.clientX-rc.left,e.clientY-rc.top);
    const row=rowFromGlobalY(g.globalY),si=stageOf(row),localY=g.globalY-row*GH-GH/2;
    if(si!==cur)return;
    if(mode==='scale'&&scaleRef){
      const it=lvls[cur][sel];if(!it)return;
      const pivot=scaleRef.pivot||((it.kind==='progress'||it.kind==='health'||it.kind==='cta'||it.kind==='tutorial')?uiCenterLocal(it):(it.kind==='text'?textLocal(it):it));
      const f=Math.max(.05,Math.min(20,Math.hypot(g.x-pivot.x,localY-pivot.y)/scaleRef.d0));
      if(it.kind===PLAYER_KIND){
        draw();return;
      }else if(it.kind==='text'){
        it.baseSize=Math.max(6,Math.min(400,Math.round(scaleRef.s0*f)));it.size=it.baseSize;
        $('tx-size').value=it.baseSize;
      }else if(it.kind==='tutorial'){
        it.scale=Math.max(.3,Math.min(3,Math.round(scaleRef.scale0*f*100)/100));
        const e=$('tut-scale');if(e)e.value=it.scale;
      }else{
        if(!it.kind||it.kind==='svgTemplate'){ensureObstacleScale(it);it.scale=Math.max(.05,Math.min(20,scaleRef.scale0*f));applyObstacleScale(it);$('os').value=Number(it.scale).toFixed(2);$('osx').value=Number(it.scaleX).toFixed(2);$('osy').value=Number(it.scaleY).toFixed(2);}
        else {it.w=Math.max(10,Math.min(1200,Math.round(scaleRef.w0*f)));it.h=Math.max(10,Math.min(1200,Math.round(scaleRef.h0*f)));if(it.kind==='progress'){it.baseW=it.w;it.baseH=it.h;$('pb-w').value=it.w;$('pb-h').value=it.h;}else if(it.kind==='health'){it.baseHeartW=Math.max(8,Math.min(180,Math.round(scaleRef.w0*f)));it.heartW=it.baseHeartW;if(scaleRef.gap0!=null){it.baseGap=Math.max(0,Math.min(180,Math.round(scaleRef.gap0*f)));it.gap=it.baseGap;$('hb-gap').value=it.gap;}$('hb-size').value=it.heartW;}else if(it.kind==='cta'){it.baseW=it.w;it.baseH=it.h;$('cta-w').value=it.w;$('cta-h').value=it.h;}}
      }
      draw();return;
    }
    {const nx=Math.round(g.x-doff.x),ny=Math.round(localY-doff.y);
      if(dragStart&&dragStart.items&&dragStart.items.length>1){
        const dx=nx-dragStart.clickedStart.x,dy=ny-dragStart.clickedStart.y;
        dragStart.items.forEach(st=>{const it=lvls[cur][st.idx];if(it&&!(it.kind===PLAYER_KIND&&it.locked)){if(it.kind==='progress'||it.kind==='health'||it.kind==='cta'||it.kind==='tutorial')moveUiCenterTo(it,st.x+dx,st.y+dy);else moveItemTo(it,st.x+dx,st.y+dy);}});
      }else{const it=lvls[cur][sel];if(it&&!(it.kind===PLAYER_KIND&&it.locked)){if(it.kind==='progress'||it.kind==='health'||it.kind==='cta'||it.kind==='tutorial')moveUiCenterTo(it,nx,ny);else moveItemTo(it,nx,ny);}}
      draw();}
  });
  cv.addEventListener('pointerup',()=>{drag=false;scaleRef=null;dragStart=null;});cv.addEventListener('pointercancel',()=>{drag=false;scaleRef=null;dragStart=null;});

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
      oc.globalCompositeOperation='multiply';oc.fillStyle=tint;oc.fillRect(0,0,w,h);
      oc.globalCompositeOperation='destination-in';oc.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
      oc.globalCompositeOperation='source-over';
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
        oc2.globalCompositeOperation='multiply';
        oc2.fillStyle=o.tint;oc2.fillRect(0,0,off.width,off.height);
        oc2.globalCompositeOperation='destination-in';
        oc2.drawImage(im,0,0,off.width,off.height);
        oc2.globalCompositeOperation='source-over';
      }
      ctx.drawImage(off,c.x-sw/2,c.y-sh/2);
    }else{
      ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(c.x-sw/2,c.y-sh/2,sw,sh);
      ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('image?',c.x,c.y);
    }
    if(isSelected(si,i)){
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
  }
  function drawSeamOverlays(){
    if(!(window.RiseBgUI&&RiseBgUI.getBgMode()==='perStage'))return;
    const sm=sprMap();
    const w=GW*zoom,h=GH*zoom;
    const sc=parseFloat($('cfg-seamScale')?.value)||1;
    const multi=window.RiseBgUI&&RiseBgUI.isSeamMulti&&RiseBgUI.isSeamMulti();
    const drawOverlay=(seam,r)=>{
      if(!imageReady(seam))return;
      const iw=seam.naturalWidth||seam.width||1,ih=seam.naturalHeight||seam.height||1;
      const sh=Math.max(8,Math.min(h*.5,w*(ih/iw)*sc));
      // The editor strip is visually flipped: Start is the bottom row and
      // Finish is the top row. Start has no previous level, so its overlay is
      // fully inside Start and flush to the bottom. Every later level draws
      // its overlay centered on its lower boundary: half on this/new level,
      // half on the previous level below.
      const top=rowOf(r)*h;
      const bottom=top+h;
      const y=(r===0)?(bottom-sh):(bottom-sh*0.5);
      ctx.drawImage(seam,0,y,w,sh);
    };
    if(multi){
      for(let r=0;r<totalStages();r++){
        const key=RiseBgUI.seamKeyForStage?RiseBgUI.seamKeyForStage(r):('bg_seam_stage'+r);
        drawOverlay(getEditorImage(sm[key]),r);
      }
    }else{
      const seam=getEditorImage(sm.bg_seam);
      for(let r=0;r<totalStages();r++)drawOverlay(seam,r);
    }
  }
  function hr(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?parseInt(r[1],16)+','+parseInt(r[2],16)+','+parseInt(r[3],16):'200,200,200';}
  function drawTextItem(o,si,i){
    // Render text in the same coordinate system as the rest of the level strip.
    // The previous pixel-space shortcut made text disappear in the editor on
    // some zoom/orientation states because measurement and drawing used
    // different coordinate spaces.
    const l=textLocal(o),baseX=GW/2+l.x, baseY=rowOf(si)*GH+GH/2+l.y;
    ctx.save();
    ctx.setTransform(zoom,0,0,zoom,0,0);
    drawTextLabel(ctx,o,baseX,baseY);
    if(isSelected(si,i)){
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
    const b=progressBoxLocal(o),x=(GW/2+b.x)*zoom,y=(rowOf(si)*GH+GH/2+b.y)*zoom,sw=b.w*zoom,sh=b.h*zoom;
    drawProgressShape(ctx,x,y,sw,sh,.42,o.fill,o.line,o.flaskSrc,o.fillSrc);
    if(isSelected(si,i)){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(x-5,y-5,sw+10,sh+10);ctx.setLineDash([]);}
  }
  const _tintCache=new Map();
  function tintedSprite(im,tint){
    const key=(im.src||'')+'|'+tint;
    const hit=_tintCache.get(key);
    if(hit)return hit;
    const w=Math.max(1,im.naturalWidth||1),h=Math.max(1,im.naturalHeight||1);
    const oc=document.createElement('canvas');oc.width=w;oc.height=h;
    const ox=oc.getContext('2d');
    ox.drawImage(im,0,0,w,h);
    ox.globalCompositeOperation='multiply';
    ox.fillStyle=tint;ox.fillRect(0,0,w,h);
    ox.globalCompositeOperation='destination-in';
    ox.drawImage(im,0,0,w,h);
    if(_tintCache.size>64)_tintCache.clear();
    _tintCache.set(key,oc);
    return oc;
  }
  function drawTintedImage(im,x,y,w,h,tint){
    if(!imageReady(im))return false;
    if(!tint||String(tint).toLowerCase()==='#ffffff')ctx.drawImage(im,x,y,w,h);
    else ctx.drawImage(tintedSprite(im,tint),x,y,w,h);
    return true;
  }

  function drawHealthItem(o,si,i){
    const b=healthBoxLocal(o),ds=healthDrawSize(o),size=ds.heartW*zoom,gap=ds.gap*zoom,cnt=o.count||3,total=cnt*size+(cnt-1)*gap;
    let x=(GW/2+b.x)*zoom,y=(rowOf(si)*GH+GH/2+b.y)*zoom;const im=progressImg(o.heartSrc||'Assets/textures/heart.png');
    for(let k=0;k<cnt;k++){
      ctx.save();ctx.globalAlpha=1;
      if(im&&imageReady(im))drawTintedImage(im,x,y,size,size,o.tint||'#ffffff');else{ctx.font=Math.round(size*.86)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ff6b6b';ctx.fillText('♥',x+size/2,y+size/2);}
      ctx.restore();x+=size+gap;
    }
    if(isSelected(si,i)){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect((GW/2+b.x)*zoom-5,(rowOf(si)*GH+GH/2+b.y)*zoom-5,total+10,size+10);ctx.setLineDash([]);}
  }
  function drawCtaItem(o,si,i){
    const b=ctaBoxLocal(o),ds=ctaDrawSize(o),sw=ds.w*zoom,sh=ds.h*zoom,x=(GW/2+b.x)*zoom,y=(rowOf(si)*GH+GH/2+b.y)*zoom,c={x:x+sw/2,y:y+sh/2};
    const bg=progressImg(o.bgSrc),tx=progressImg(o.textSrc);
    if(bg&&imageReady(bg))drawTintedImage(bg,x,y,sw,sh,o.bgTint);else{ctx.fillStyle=o.bgTint||'#e05252';ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,sw,sh,sh*.22):ctx.rect(x,y,sw,sh);ctx.fill();}
    if(tx&&imageReady(tx))drawTintedImage(tx,x,y,sw,sh,o.textTint);else{ctx.fillStyle=o.textTint||'#ffffff';ctx.font='700 '+Math.max(12,sh*.28)+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('PLAY NOW',c.x,c.y);}
    if(isSelected(si,i)){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(x-5,y-5,sw+10,sh+10);ctx.setLineDash([]);}
  }
  const TUT_HAND_SVG='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ffffff" stroke="#1c2030" stroke-width="0.8" stroke-linejoin="round" d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/></svg>');
  function drawTutorialItem(o,si,i){
    const l=tutorialLocal(o),c=toC(si,l.x,l.y),S=tutorialUnitPx(o)*zoom;
    const U=(ux,uy)=>({x:c.x+ux*S,y:c.y-(uy-4.28)*S});
    // пирамида
    ctx.save();
    ctx.fillStyle=o.blockColor||'#373843';
    const bs=0.5224*S,shp=o.blockShape||'square';
    TUT_UNITS.forEach(u=>{
      const q=U(u[0],u[1]);
      ctx.beginPath();
      if(shp==='circle')ctx.arc(q.x,q.y,bs/2,0,Math.PI*2);
      else if(shp==='triangle'){ctx.moveTo(q.x,q.y-bs/2);ctx.lineTo(q.x+bs/2,q.y+bs/2);ctx.lineTo(q.x-bs/2,q.y+bs/2);ctx.closePath();}
      else ctx.rect(q.x-bs/2,q.y-bs/2,bs,bs);
      ctx.fill();
    });
    // свайп (статично, середина траектории)
    const A=U(1.5,4.16),Bm=U(0.22,4.77);
    ctx.save();ctx.globalAlpha*=.4;
    const len=Math.hypot(Bm.x-A.x,Bm.y-A.y);
    ctx.translate(A.x,A.y);ctx.rotate(Math.atan2(Bm.y-A.y,Bm.x-A.x));
    const gr=ctx.createLinearGradient(0,0,len,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,1)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,-0.19*S);ctx.lineTo(len,0.19*S);ctx.closePath();ctx.fill();
    ctx.restore();
    // рука (статично, середина анимации)
    const hand=getEditorImage(TUT_HAND_SVG);
    if(imageReady(hand)){
      const H=U(0.125,4.595),hw=1.7*S;
      ctx.save();ctx.translate(H.x,H.y);ctx.rotate(-(-3.7*Math.PI/180));
      ctx.drawImage(hand,-hw*0.48,-hw*0.12,hw,hw);
      ctx.restore();
    }
    // текст
    const fs=Math.max(6,(parseFloat(o.textSize)||18)*(parseFloat(o.scale)||1)*zoom);
    ctx.fillStyle=o.textColor||'#ffffff';ctx.font='bold '+fs+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    const lines=String(o.text==null?TUT_TEXT_DEFAULT:o.text).split('\n');
    let ty=U(0,2.9).y;
    lines.forEach(ln=>{ctx.fillText(ln,c.x,ty);ty+=fs*1.25;});
    ctx.restore();
    // рамка выделения
    if(isSelected(si,i)){
      const b=tutorialBoxLocal(o),bx=toC(si,b.x,b.y);
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);
      ctx.strokeRect(bx.x-5,bx.y-5,b.w*zoom+10,b.h*zoom+10);ctx.setLineDash([]);
    }
  }
  function drawObstacle(o,si,i){
    if(o.kind==='svgTemplate')ensureObstacleScale(o);else if(!o.kind)ensureObstacleScale(o);
    const c=toC(si,o.x,o.y),sw=o.w*zoom,sh=o.h*zoom;
    ctx.save();ctx.fillStyle=o.color||'#e05252';ctx.strokeStyle=(isSelected(si,i))?'#fff':'rgba(255,255,255,.24)';ctx.lineWidth=(isSelected(si,i))?2.5:1.5;
    if(o.kind==='svgTemplate'){
      const im=getEditorImage(o.imageSrc);
      if(imageReady(im))drawTintedImage(im,c.x-sw/2,c.y-sh/2,sw,sh,o.color||'#ffffff');
      else{ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(c.x-sw/2,c.y-sh/2,sw,sh);}
      ctx.strokeRect(c.x-sw/2,c.y-sh/2,sw,sh);
      if(isSelected(si,i)){ctx.setLineDash([6,4]);ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.strokeRect(c.x-sw/2-5,c.y-sh/2-5,sw+10,sh+10);ctx.setLineDash([]);}
    }
    else if(o.shape==='circle'){ctx.beginPath();ctx.arc(c.x,c.y,sw/2,0,Math.PI*2);ctx.fill();ctx.stroke();}
    else if(o.shape==='triangle'){ctx.beginPath();ctx.moveTo(c.x,c.y-sh/2);ctx.lineTo(c.x+sw/2,c.y+sh/2);ctx.lineTo(c.x-sw/2,c.y+sh/2);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(o.shape==='custom'&&o.points&&o.points.length>=3){const im=getEditorImage(o.imageSrc);if(imageReady(im))drawTintedImage(im,c.x-sw/2,c.y-sh/2,sw,sh,o.color||'#ffffff');else{ctx.fillStyle=o.color||'#ffffff';ctx.fillRect(c.x-sw/2,c.y-sh/2,sw,sh);}ctx.beginPath();o.points.forEach((p,pi)=>{const px=c.x+p.x*sw,py=c.y+p.y*sh;if(pi===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.stroke();}
    else{ctx.beginPath();ctx.rect(c.x-sw/2,c.y-sh/2,sw,sh);ctx.fill();ctx.stroke();}
    if(o.moveX>0){const mx=o.moveX*zoom;ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(c.x-mx,c.y);ctx.lineTo(c.x+mx,c.y);ctx.stroke();ctx.setLineDash([]);}ctx.restore();
  }

  function drawPlayerItem(o,si,i){
    const l=playerLocal(o),c=toC(si,l.x,l.y);
    const playerSize=Math.max(.1,parseFloat($('cfg-playerSize')?.value)||2);
    const r=20*playerSize*zoom;
    const im=getEditorImage('Assets/textures/balloon.png');
    ctx.save();
    ctx.globalAlpha=.92;
    if(imageReady(im)){
      const iw=im.naturalWidth||im.width||1,ih=im.naturalHeight||im.height||1;
      const h=r*4.15,w=h*(iw/ih);
      const bx=c.x,by=c.y+r*.15;
      ctx.strokeStyle=$('cfg-playerRopeColor')?.value||'#ffffff';
      ctx.lineWidth=Math.max(1,r*.045);
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(bx,by+r*1.02);
      ctx.bezierCurveTo(bx,by+r*1.75,bx,by+r*2.5,bx,by+r*3.25);
      ctx.stroke();
      drawTintedImage(im,bx-w/2,by-h*.58,w,h,$('cfg-playerSpriteColor')?.value||'#ffffff');
      if(isSelected(si,i)){
        ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);
        ctx.strokeRect(bx-w/2-6,by-h*.58-6,w+12,h+r*3.25+12);ctx.setLineDash([]);
      }
    }else{
      const g=ctx.createRadialGradient(c.x-r*.3,c.y-r*.3,r*.1,c.x,c.y,r);
      g.addColorStop(0,'#ffffff');g.addColorStop(1,'rgba(255,255,255,.65)');
      ctx.fillStyle=g;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(c.x,c.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(isSelected(si,i)){ctx.strokeStyle='#fff';ctx.setLineDash([5,4]);ctx.strokeRect(c.x-r-6,c.y-r-6,r*2+12,r*2+12);ctx.setLineDash([]);}
    }
    ctx.restore();
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
      if(showGrid){
        ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;
        for(let x=0;x<=GW;x+=65){ctx.beginPath();ctx.moveTo(x*zoom,top);ctx.lineTo(x*zoom,top+h);ctx.stroke();}
        for(let y=0;y<=GH;y+=65){ctx.beginPath();ctx.moveTo(0,top+y*zoom);ctx.lineTo(w,top+y*zoom);ctx.stroke();}
        ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(midX,top);ctx.lineTo(midX,top+h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,midY);ctx.lineTo(w,midY);ctx.stroke();
      }
      drawPassiveZone(top,w,h,midX,midY);
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.font=Math.max(10,12*zoom)+'px monospace';ctx.textAlign='left';ctx.fillText(stageLabel(si)+'   0;0',8,top+18);
      (lvls[si]||[]).forEach((o,i)=>{if(!o||o.kind==='bg'||o.kind===PLAYER_KIND)return;if(o.kind==='text')drawTextItem(o,si,i);else if(o.kind==='progress')drawProgressItem(o,si,i);else if(o.kind==='health')drawHealthItem(o,si,i);else if(o.kind==='cta')drawCtaItem(o,si,i);else if(o.kind==='tutorial')drawTutorialItem(o,si,i);else drawObstacle(o,si,i);});
      drawActiveZone(top,w,h,midX,midY);
    }
    drawSeamOverlays();
    // Keep the hero/player marker above any seam overlay in the level editor.
    for(let si=0;si<totalStages();si++){
      (lvls[si]||[]).forEach((o,i)=>{if(o&&o.kind===PLAYER_KIND)drawPlayerItem(o,si,i);});
    }
    
    let no=0,nt=0,nb=0,np=0,nh=0,nc=0;lvls.forEach(s=>s.forEach(o=>{if(!o)return;if(o.kind==='text')nt++;else if(o.kind==='bg')nb++;else if(o.kind==='progress')np++;else if(o.kind==='health')nh++;else if(o.kind==='cta')nc++;else if(o.kind===PLAYER_KIND){}else no++;}));ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='11px monospace';ctx.textAlign='left';ctx.fillText('Start scene + '+NS+' mini-levels + Finish scene · '+no+' obstacles · '+nb+' images · '+nt+' text · '+np+' progress · '+nh+' health · '+nc+' cta · '+Math.round(zoom*100)+'% zoom',8,cv.height-8);
  }
  function getLevelData(){ensurePlayerObject();return lvls.map(stage=>{const out=[];stage.forEach(o=>{if(!o||o.kind===PLAYER_KIND)return;if(o.kind==='svgTemplate'){flattenSvgTemplate(o).forEach(x=>out.push({...x,coordMode:'center'}));}else{if(!o.kind)ensureObstacleScale(o);if(['text','progress','health','cta'].includes(o.kind))ensureResponsiveBase(o);out.push({...o,coordMode:'center'});}});return out;});}
  function getPlayerStart(){const p=ensurePlayerObject();ensurePlayerAnchor(p);setPlayerLocalFromOffset(p);return {coordMode:'center',x:Math.round(p.x||0),y:Math.round(p.y==null?Math.round(GH*.20):p.y)};}

  // ── Level text labels ─────────────────────────────────────────────────────
  let txColors=[],txBase='#ffffff',txAccent='#52e08a';
  function newTextLabel(x,y){
    return {kind:'text',coordMode:'center',x:x,y:y,anchorOffsetX:Math.round((x/GW)*100),anchorOffsetY:Math.round((y/GH)*100),
      segments:[{t:'TAP TO ',color:'#ffffff'},{t:'PLAY',color:'#52e08a'}],
      baseColor:'#ffffff',accentColor:'#52e08a',
      font:'Baloo2',size:64,baseSize:64,anchor:'cc',stroke:'#000000',strokeW:0,baseStrokeW:0,shadow:true,letterSpacing:0,baseLetterSpacing:0,designW:GW,designH:GH};
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
    const o=selItem(),isPlayer=!!(o&&o.kind===PLAYER_KIND),isText=!!(o&&o.kind==='text'),isProg=!!(o&&o.kind==='progress'),isHealth=!!(o&&o.kind==='health'),isCta=!!(o&&o.kind==='cta'),isTut=!!(o&&o.kind==='tutorial');
    if($('playerbar'))$('playerbar').style.display=isPlayer?'':'none';
    $('txtbar').style.display=isText?'':'none';
    $('pbar').style.display=isProg?'':'none';
    $('hbar').style.display=isHealth?'':'none';
    $('ctabar').style.display=isCta?'':'none';
    if($('tutbar'))$('tutbar').style.display=isTut?'':'none';
    if(isTut){
      $('tut-text').value=(o.text==null?TUT_TEXT_DEFAULT:o.text);
      $('tut-tsize').value=o.textSize||18;
      setHexValue('tut-tcolor',o.textColor,'#ffffff');
      $('tut-shape').value=o.blockShape||'square';
      setHexValue('tut-bcolor',o.blockColor,'#373843');
      $('tut-scale').value=o.scale||1;
      $('tut-offx').value=o.anchorOffsetX||0;$('tut-offy').value=o.anchorOffsetY||0;
      document.querySelectorAll('#tut-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'cc')));
    }
    $('obs-props').style.display=(!o||isPlayer||isText||isProg||isHealth||isCta||isTut)?'none':'flex';
    if($('tpl-unlock'))$('tpl-unlock').style.display='none';
    if(isPlayer){
      ensurePlayerAnchor(o);setPlayerLocalFromOffset(o);
      $('pl-offx').value=o.anchorOffsetX||0;$('pl-offy').value=o.anchorOffsetY||0;
      document.querySelectorAll('#pl-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'cc')));
      if($('pl-lock'))$('pl-lock').classList.toggle('on',!!o.locked);
      if($('pl-unlock'))$('pl-unlock').classList.toggle('on',!o.locked);
      if($('pl-lock-note'))$('pl-lock-note').textContent=o.locked?'Locked: шар нельзя двигать мышью. Позицию можно менять через anchors/offset.':'Unlocked: шар можно двигать мышью. Anchor/offset задают стартовую позицию.';
    } else if(isText){
      ensureResponsiveBase(o);$('tx-font').value=o.font||'Baloo2';$('tx-size').value=o.baseSize||o.size||64;
      setHexValue('tx-stroke',o.stroke,'#000000');$('tx-strokeW').value=o.strokeW||0;$('tx-shadow').checked=o.shadow!==false;
      if(o.anchorOffsetX==null||o.anchorOffsetY==null){const l={x:o.x||0,y:o.y||0},b=anchorBaseLocal(o.anchor);o.anchorOffsetX=Math.round(((l.x-b.x)/GW)*1000)/10;o.anchorOffsetY=Math.round(((l.y-b.y)/GH)*1000)/10;}
      $('tx-offx').value=o.anchorOffsetX||0;$('tx-offy').value=o.anchorOffsetY||0;
      txBase=o.baseColor||(o.segments[0]&&o.segments[0].color)||'#ffffff';
      txAccent=o.accentColor||o.segments.map(s=>s.color).find(c=>c&&c!==txBase)||'#52e08a';
      setHexValue('tx-base',txBase,'#ffffff');setHexValue('tx-accent',txAccent,'#52e08a');txBase=$('tx-base').value.toLowerCase();txAccent=$('tx-accent').value.toLowerCase();
      $('tx-text').value=labelText(o);txColors=expandColors(o);
      document.querySelectorAll('#tx-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'cc')));
    } else if(isProg){
      if(o.anchorOffsetX==null||o.anchorOffsetY==null){const l={x:o.x||0,y:o.y||0},b=progressAnchorBaseLocal(o.anchor);o.anchorOffsetX=Math.round(((l.x-b.x)/GW)*1000)/10;o.anchorOffsetY=Math.round(((l.y-b.y)/GH)*1000)/10;}
      ensureResponsiveBase(o);$('pb-w').value=o.baseW||o.w||64;$('pb-h').value=o.baseH||o.h||300;setHexValue('pb-fill',o.fill,'#b9ff9b');setHexValue('pb-line',o.line,'#101625');$('pb-offx').value=o.anchorOffsetX||0;$('pb-offy').value=o.anchorOffsetY||0;
      document.querySelectorAll('#pb-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'cl')));
    } else if(isHealth){
      if(o.anchorOffsetX==null||o.anchorOffsetY==null){const l={x:o.x||0,y:o.y||0},b=progressAnchorBaseLocal(o.anchor);o.anchorOffsetX=Math.round(((l.x-b.x)/GW)*1000)/10;o.anchorOffsetY=Math.round(((l.y-b.y)/GH)*1000)/10;}
      ensureResponsiveBase(o);$('hb-size').value=o.baseHeartW||o.heartW||36;$('hb-gap').value=o.baseGap==null?(o.gap==null?6:o.gap):o.baseGap;$('hb-empty').value=o.emptyAlpha==null ? .28 : o.emptyAlpha;setHexValue('hb-tint',o.tint,'#ffffff');$('hb-offx').value=o.anchorOffsetX||0;$('hb-offy').value=o.anchorOffsetY||0;
      document.querySelectorAll('#hb-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'tc')));
    } else if(o&&o.kind==='bg'){
      $('os').value=1;$('osx').value=1;$('osy').value=1;setHexValue('oc',o.tint,'#ffffff');$('om').value=0;
    } else if(o){
      ensureObstacleScale(o);$('os').value=Number(o.scale||1).toFixed(2);$('osx').value=Number(o.scaleX||1).toFixed(2);$('osy').value=Number(o.scaleY||1).toFixed(2);setHexValue('oc',o.color,'#ffffff');$('om').value=o.moveX||0;
      if(hasMultiSelection())syncGroupAnchorFields();else{ensureObstacleAnchor(o);$('ob-offx').value=o.anchorOffsetX||0;$('ob-offy').value=o.anchorOffsetY||0;document.querySelectorAll('#ob-anchor button').forEach(b=>b.classList.toggle('on',b.dataset.a===(o.anchor||'cc')));}
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
  $('tx-base').addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='text')return;const old=txBase,nw=normalizeHexColor($('tx-base').value,txBase);for(let i=0;i<txColors.length;i++)if(txColors[i]===old)txColors[i]=nw;txBase=nw;rebuildSegments(o);draw();});
  $('tx-accent').addEventListener('input',()=>{txAccent=normalizeHexColor($('tx-accent').value,txAccent);const o=selItem();if(o&&o.kind==='text')o.accentColor=txAccent;});
  // keep the text selection when clicking the paint buttons

  function selectedPlayer(){const o=selItem();return o&&o.kind===PLAYER_KIND?o:null;}
  $('pl-lock')?.addEventListener('click',()=>{const o=selectedPlayer();if(!o)return;o.locked=true;syncProps();draw();});
  $('pl-unlock')?.addEventListener('click',()=>{const o=selectedPlayer();if(!o)return;o.locked=false;syncProps();draw();});
  document.querySelectorAll('#pl-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selectedPlayer();if(!o)return;ensurePlayerAnchor(o);o.anchor=b.dataset.a;setPlayerLocalFromOffset(o);syncProps();draw();}));
  ['pl-offx','pl-offy'].forEach(id=>{$(id)?.addEventListener('input',()=>{const o=selectedPlayer();if(!o)return;ensurePlayerAnchor(o);o.anchorOffsetX=parseFloat($('pl-offx').value)||0;o.anchorOffsetY=parseFloat($('pl-offy').value)||0;setPlayerLocalFromOffset(o);draw();});});

  $('tx-paint-acc').addEventListener('mousedown',e=>e.preventDefault());
  $('tx-paint-base').addEventListener('mousedown',e=>e.preventDefault());
  $('tx-paint-acc').addEventListener('click',()=>paintRange(normalizeHexColor($('tx-accent').value,txAccent)));
  $('tx-paint-base').addEventListener('click',()=>paintRange(normalizeHexColor($('tx-base').value,txBase)));
  document.querySelectorAll('#tx-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='text')return;o.anchor=b.dataset.a;setTextLocalFromOffset(o);document.querySelectorAll('#tx-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  function bindTxOffset(id,field){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='text')return;o[field]=parseFloat(e.value)||0;setTextLocalFromOffset(o);draw();});}
  bindTxOffset('tx-offx','anchorOffsetX');
  bindTxOffset('tx-offy','anchorOffsetY');
  function bindTx(id,field,tf){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='text')return;o[field]=tf?tf(e.value):(e.classList&&e.classList.contains('hex-color')?normalizeHexColor(e.value,o[field]||e.defaultValue||'#ffffff'):e.value);if(field==='baseSize')o.size=o.baseSize;if(field==='strokeW')o.baseStrokeW=o.strokeW;if(field==='letterSpacing')o.baseLetterSpacing=o.letterSpacing;draw();});}
  bindTx('tx-font','font');
  bindTx('tx-size','baseSize',v=>Math.max(1,parseFloat(v)||1));
  bindTx('tx-stroke','stroke');
  bindTx('tx-strokeW','strokeW',v=>Math.max(0,parseFloat(v)||0));
  $('tx-shadow').addEventListener('change',()=>{const o=selItem();if(!o||o.kind!=='text')return;o.shadow=$('tx-shadow').checked;draw();});
  if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('800 40px Baloo2'),document.fonts.load('600 40px Kameron'),document.fonts.load('400 40px LiberationSans')]).then(draw).catch(()=>{});}

  $('et-progress').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='progress';clearToolButtons();$('et-progress').classList.add('on');});
  document.querySelectorAll('#pb-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='progress')return;o.anchor=b.dataset.a;setProgressLocalFromOffset(o);document.querySelectorAll('#pb-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  function bindPb(id,field,tf){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='progress')return;o[field]=tf?tf(e.value):(e.classList&&e.classList.contains('hex-color')?normalizeHexColor(e.value,o[field]||e.defaultValue||'#ffffff'):e.value);if(field==='baseW')o.w=o.baseW;if(field==='baseH')o.h=o.baseH;draw();});}
  function bindPbOffset(id,field){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='progress')return;o[field]=parseFloat(e.value)||0;setProgressLocalFromOffset(o);draw();});}
  bindPb('pb-w','baseW',v=>Math.max(20,parseFloat(v)||64));bindPb('pb-h','baseH',v=>Math.max(60,parseFloat(v)||300));bindPb('pb-fill','fill');bindPb('pb-line','line');bindPbOffset('pb-offx','anchorOffsetX');bindPbOffset('pb-offy','anchorOffsetY');
  window.loadProgressPart=function(part,inp){const o=selItem();if(!o||o.kind!=='progress'||!inp.files||!inp.files[0])return;const r=new FileReader();r.onload=e=>{if(part==='flask')o.flaskSrc=e.target.result;else o.fillSrc=e.target.result;draw();};r.readAsDataURL(inp.files[0]);inp.value='';};
  $('pb-flask-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='progress'){o.flaskSrc=null;draw();}});
  $('pb-fill-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='progress'){o.fillSrc=null;draw();}});


  $('et-health').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='health';clearToolButtons();$('et-health').classList.add('on');});
  document.querySelectorAll('#hb-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='health')return;o.anchor=b.dataset.a;setHealthLocalFromOffset(o);document.querySelectorAll('#hb-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  // Tutorial bar bindings
  function bindTut(id,field,parse){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='tutorial')return;o[field]=parse?parse(e.value):e.value;draw();});}
  bindTut('tut-text','text');
  bindTut('tut-tsize','textSize',v=>Math.max(8,Math.min(72,parseFloat(v)||18)));
  bindTut('tut-tcolor','textColor');
  bindTut('tut-shape','blockShape');
  bindTut('tut-bcolor','blockColor');
  bindTut('tut-scale','scale',v=>Math.max(.3,Math.min(3,parseFloat(v)||1)));
  ['tut-offx','tut-offy'].forEach((id,k)=>{const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='tutorial')return;o[k?'anchorOffsetY':'anchorOffsetX']=parseFloat(e.value)||0;setTutorialLocalFromOffset(o);draw();});});
  document.querySelectorAll('#tut-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='tutorial')return;o.anchor=b.dataset.a;setTutorialLocalFromOffset(o);document.querySelectorAll('#tut-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  function bindHb(id,field,tf){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='health')return;o[field]=tf?tf(e.value):(e.classList&&e.classList.contains('hex-color')?normalizeHexColor(e.value,o[field]||e.defaultValue||'#ffffff'):e.value);if(field==='baseHeartW')o.heartW=o.baseHeartW;if(field==='baseGap')o.gap=o.baseGap;draw();});}
  function bindHbOffset(id,field){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='health')return;o[field]=parseFloat(e.value)||0;setHealthLocalFromOffset(o);draw();});}
  bindHb('hb-size','baseHeartW',v=>Math.max(8,parseFloat(v)||36));bindHb('hb-gap','baseGap',v=>parseFloat(v)||0);bindHb('hb-empty','emptyAlpha',v=>Math.max(0,Math.min(1,parseFloat(v)||0)));bindHb('hb-tint','tint');bindHbOffset('hb-offx','anchorOffsetX');bindHbOffset('hb-offy','anchorOffsetY');
  window.loadHealthPart=function(inp){const o=selItem();if(!o||o.kind!=='health'||!inp.files||!inp.files[0])return;const r=new FileReader();r.onload=e=>{o.heartSrc=e.target.result;draw();};r.readAsDataURL(inp.files[0]);inp.value='';};
  $('hb-heart-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='health'){o.heartSrc='Assets/textures/heart.png';draw();}});

  $('et-cta').addEventListener('click',()=>{selectedTemplateId=null;renderTemplateList();mode='cta';clearToolButtons();$('et-cta').classList.add('on');});
  document.querySelectorAll('#cta-anchor button').forEach(b=>b.addEventListener('click',()=>{const o=selItem();if(!o||o.kind!=='cta')return;o.anchor=b.dataset.a;setCtaLocalFromOffset(o);document.querySelectorAll('#cta-anchor button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
  function bindCta(id,field,tf){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='cta')return;o[field]=tf?tf(e.value):(e.classList&&e.classList.contains('hex-color')?normalizeHexColor(e.value,o[field]||e.defaultValue||'#ffffff'):e.value);if(field==='w')o.baseW=o.w;if(field==='h')o.baseH=o.h;draw();});}
  function bindCtaOffset(id,field){const e=$(id);if(!e)return;e.addEventListener('input',()=>{const o=selItem();if(!o||o.kind!=='cta')return;o[field]=parseFloat(e.value)||0;setCtaLocalFromOffset(o);draw();});}
  bindCta('cta-w','w',v=>Math.max(30,parseFloat(v)||260));bindCta('cta-h','h',v=>Math.max(20,parseFloat(v)||86));bindCta('cta-bg-tint','bgTint');bindCta('cta-text-tint','textTint');bindCtaOffset('cta-offx','anchorOffsetX');bindCtaOffset('cta-offy','anchorOffsetY');
  window.loadCtaPart=function(part,inp){const o=selItem();if(!o||o.kind!=='cta'||!inp.files||!inp.files[0])return;const r=new FileReader();r.onload=e=>{if(part==='bg')o.bgSrc=e.target.result;else o.textSrc=e.target.result;draw();};r.readAsDataURL(inp.files[0]);inp.value='';};
  $('cta-bg-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='cta'){o.bgSrc=null;draw();}});
  $('cta-text-clear').addEventListener('click',()=>{const o=selItem();if(o&&o.kind==='cta'){o.textSrc=null;draw();}});

  setStageCount(NS);sv('le-zoom-v',Math.round(zoom*100)+'%');
  window.addEventListener('resize',()=>{if($('rp-levels').classList.contains('on'))resize(true);});
  return{resize,getLevelData,getPlayerStart,draw,setStageCount};
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

// Global text sizing helper for editor/playable label renderer.
// drawTextLabel/drawTextLabelScaled live in the global scope, while the editor
// has its own scoped textDrawSize(). Without this global fallback, text objects
// throw ReferenceError during Level Editor rendering and disappear.
function textDrawSize(L){
  L=L||{};
  var or=(document.getElementById('cfg-orientation')&&document.getElementById('cfg-orientation').value)||'portrait';
  var gw=or==='landscape'?844:390, gh=844;
  var dw=parseFloat(L.designW)||gw, dh=parseFloat(L.designH)||gh;
  var k=Math.min(gw/dw, gh/dh);
  if(!isFinite(k)||k<=0)k=1;
  k=Math.min(1,k);
  return {
    size:(L.baseSize||L.size||64)*k,
    strokeW:(L.baseStrokeW!=null?L.baseStrokeW:(L.strokeW||0))*k,
    letterSpacing:(L.baseLetterSpacing!=null?L.baseLetterSpacing:(L.letterSpacing||0))*k
  };
}

function drawTextLabel(ctx,L,cx,cy){
  drawTextLabelScaled(ctx,L,cx,cy,1);
}
function drawTextLabelScaled(ctx,L,cx,cy,scale){
  scale=(isFinite(scale)&&scale>0)?scale:1;
  var segs=(L.segments&&L.segments.length)?L.segments:[{t:(L.text||''),color:(L.color||'#ffffff')}];
  var fam=(FONT_CSS[L.font]||fontCssFamily(L.font)||'sans-serif');
  var ds=textDrawSize(L),size=Math.max(1,(ds.size||0)*scale),weight=800;
  var strokeW=Math.max(0,(ds.strokeW||0)*scale),letterSpacing=(ds.letterSpacing||0)*scale;
  var anchor=L.anchor||'cc',av=anchor.charAt(0),ah=anchor.charAt(1),align=ah==='l'?'left':(ah==='r'?'right':'center');
  var lines=[[]],s,p,col,parts;
  for(s=0;s<segs.length;s++){
    col=segs[s].color||'#ffffff';parts=String(segs[s].t==null?'':segs[s].t).split('\n');
    for(p=0;p<parts.length;p++){if(p>0)lines.push([]);if(parts[p]!=='')lines[lines.length-1].push({t:parts[p],color:col});}
  }
  var lh=size*1.18;
  ctx.save();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.font=weight+' '+size+'px '+fam;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  try{if('letterSpacing' in ctx)ctx.letterSpacing=letterSpacing+'px';}catch(e){}
  var totalH=lh*lines.length,ascent=size*0.80,firstBase=(av==='t'?(cy+ascent):(av==='b'?(cy-totalH+ascent):(cy-totalH/2+ascent))),li,r,runs,by,lineW,sx,xx;
  for(li=0;li<lines.length;li++){
    runs=lines[li];by=firstBase+li*lh;lineW=0;
    for(r=0;r<runs.length;r++)lineW+=ctx.measureText(runs[r].t).width;
    sx=align==='left'?cx:(align==='right'?cx-lineW:cx-lineW/2);
    if(L.shadow){ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=size*0.14;ctx.shadowOffsetY=size*0.07;xx=sx;for(r=0;r<runs.length;r++){ctx.fillStyle=runs[r].color;ctx.fillText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}ctx.restore();}
    if(strokeW&&strokeW>0){ctx.lineWidth=strokeW;ctx.strokeStyle=L.stroke||'#000';ctx.lineJoin='round';xx=sx;for(r=0;r<runs.length;r++){ctx.strokeText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}}
    xx=sx;for(r=0;r<runs.length;r++){ctx.fillStyle=runs[r].color;ctx.fillText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}
  }
  ctx.restore();
}
// measured size (base units) of a text label, for hit-testing / selection box
function textLabelSize(ctx,L){
  var segs=(L.segments&&L.segments.length)?L.segments:[{t:(L.text||''),color:'#fff'}];
  var fam=(FONT_CSS[L.font]||fontCssFamily(L.font)||'sans-serif'),ds=textDrawSize(L),size=ds.size,weight=800;
  var lineStrs=[''],s,p,parts;
  for(s=0;s<segs.length;s++){parts=String(segs[s].t==null?'':segs[s].t).split('\n');for(p=0;p<parts.length;p++){if(p>0)lineStrs.push('');lineStrs[lineStrs.length-1]+=parts[p];}}
  ctx.save();ctx.font=weight+' '+size+'px '+fam;try{if('letterSpacing' in ctx)ctx.letterSpacing=(ds.letterSpacing||0)+'px';}catch(e){}
  var maxW=1;for(var i=0;i<lineStrs.length;i++)maxW=Math.max(maxW,ctx.measureText(lineStrs[i]).width);ctx.restore();
  return {w:maxW,h:size*1.18*lineStrs.length};
}

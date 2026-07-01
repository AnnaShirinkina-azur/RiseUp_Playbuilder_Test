(function(W){'use strict';

// ── Читаем все настройки из UI ────────────────────────────────────────────
function readConfig(){
  function g(id){
    const e=document.getElementById(id);if(!e)return undefined;
    if(e.type==='checkbox')return e.checked;
    if(e.type==='number'||e.type==='range')return parseFloat(e.value);
    return e.value;
  }
  // levelData берём из редактора в момент сборки
  let levelData=null;
  if(W.RiseLevelEditor){
    const ld=W.RiseLevelEditor.getLevelData();
    if(ld)levelData=ld;
  }
  return{
    lives:g('cfg-lives'),gameSpeed:g('cfg-gameSpeed'),acceleration:g('cfg-acceleration'),stageCount:g('cfg-stageCount')||5,
    obstaclePushForce:g('cfg-pushForce'),gravityModifier:g('cfg-gravityModifier'),hpBarShowTime:g('cfg-hpBarShowTime')*1000,
    tutorialDisplayTime:g('cfg-tutorialTime')*1000,
    playerColor:g('cfg-playerColor'),playerOutlineColor:g('cfg-playerOutline'),playerSize:g('cfg-playerSize'),playerSpriteColor:g('cfg-playerSpriteColor'),
    shieldColor:g('cfg-shieldColor'),shieldSize:g('cfg-shieldSize'),shieldSpriteColor:g('cfg-shieldSpriteColor'),
    obstacleColor:g('cfg-obstacleColor'),obstacleColorAlt:g('cfg-obstacleColorAlt'),obstacleSpriteColor:g('cfg-obstacleSpriteColor'),
    bgColor:g('cfg-bgColor'),groundColor:g('cfg-groundColor'),particleColor:g('cfg-particleColor'),backgroundSpriteColor:g('cfg-bgSpriteColor'),
    stageColors:['cfg-stage0','cfg-stage1','cfg-stage2','cfg-stage3','cfg-stage4'].map(g),
    stageAccents:(function(){var e=document.getElementById('cfg-stageAccents');return e?e.checked:true;})(),
    orientation:g('cfg-orientation')||'portrait',
    backgroundMode:g('cfg-bgMode')||'perStage',
    googleFontUrl:g('cfg-googleFontUrl')||'',
    googleFontFamily:g('cfg-googleFontFamily')||'',
    localFontFamily:g('cfg-localFontFamily')||'CustomFont',
    backgroundStartColor:g('cfg-bgStartColor')||'#ffffff',
    backgroundFinishColor:g('cfg-bgFinishColor')||'#ffffff',
    backgroundStageColors:Array.from({length:g('cfg-stageCount')||5},(_,i)=>g('cfg-bgStageColor'+i)||'#ffffff'),
    levelData,
  };
}

// ── fetch → base64 dataURL ─────────────────────────────────────────────────
function toB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob);});}
function fetchB64(url){return fetch(url).then(r=>{if(!r.ok)throw new Error(r.status+' '+url);return r.blob();}).then(toB64);}
function googleFontFamilyFromUrl(url){url=String(url||'').trim();if(!url)return '';try{const u=new URL(url);let fam=u.searchParams.get('family');if(fam)return fam.split(':')[0].replace(/\+/g,' ').trim();const parts=u.pathname.split('/').filter(Boolean),i=parts.indexOf('specimen');if(i>=0&&parts[i+1])return decodeURIComponent(parts[i+1]).replace(/\+/g,' ').trim();}catch(e){}return '';}
function googleFontCssUrl(url,family){url=String(url||'').trim();family=String(family||'').trim();if(!url&&family)url='https://fonts.googleapis.com/css2?family='+encodeURIComponent(family).replace(/%20/g,'+')+':wght@400;500;600;700;800&display=swap';try{const u=new URL(url);if(u.hostname==='fonts.google.com'){const fam=family||googleFontFamilyFromUrl(url);return fam?'https://fonts.googleapis.com/css2?family='+encodeURIComponent(fam).replace(/%20/g,'+')+':wght@400;500;600;700;800&display=swap':'';}if(u.hostname==='fonts.googleapis.com')return url;}catch(e){}return url;}
function fontCssFamily(name){name=String(name||'').trim();return name.indexOf(' ')>=0?'\"'+name.replace(/\"/g,'')+'\",sans-serif':name+',sans-serif';}

// ── Бандл ассетов ─────────────────────────────────────────────────────────
const BUNDLE=[
  'textures/bg_bathroom.png','textures/bg_light_overlay.png','textures/bg_sky.png',
  'textures/endcard_lose_image.png','textures/endcard_win_image.png',
  'textures/hand.png','textures/obj_brush.png','textures/obj_brush_mask.png',
  'audio/bgm.wav','audio/bgm_fail_loop.wav','audio/sfx_confetti.wav',
  'audio/sfx_correct.wav','audio/sfx_lose.wav','audio/sfx_win.wav','audio/sfx_wrong.wav',
  'fonts/Baloo2-Bold.ttf','fonts/Kameron-SemiBold.ttf',
];
async function loadBundle(base,onP){
  const m={};let done=0;
  await Promise.allSettled(BUNDLE.map(async p=>{
    try{m[p]=await fetchB64(`${base}/${p}`);}catch(e){m[p]=null;}
    onP&&onP(++done/BUNDLE.length);
  }));
  return m;
}

// ── Пользовательские спрайты ──────────────────────────────────────────────
const SPRS={};
function setSprite(key,b64){if(b64==null)delete SPRS[key];else SPRS[key]=b64;}
function getSprites(){return Object.assign({},SPRS);}

// ── Собираем итоговый HTML ────────────────────────────────────────────────
function buildHTML(cfg,assetMap,sprMap,gameSrc){
  const googleFamily=cfg.googleFontFamily||googleFontFamilyFromUrl(cfg.googleFontUrl);
  if(googleFamily)cfg.googleFontFamily=googleFamily;
  const googleHref=googleFontCssUrl(cfg.googleFontUrl,googleFamily);
  const googleFontFamilyCss=googleFamily?fontCssFamily(googleFamily):'';
  const googleFontJs=googleFamily?('RiseFontCSS['+JSON.stringify(googleFamily)+']='+JSON.stringify(googleFontFamilyCss)+';') : '';
  const localFamily=(cfg.localFontFamily||'CustomFont').trim();
  const localFontCss=(sprMap.custom_font&&localFamily)?fontCssFamily(localFamily):'';
  const localFontJs=localFontCss?('RiseFontCSS['+JSON.stringify(localFamily)+']='+JSON.stringify(localFontCss)+';') : '';
  const ff=[
    assetMap['fonts/Baloo2-Bold.ttf']?`@font-face{font-family:'Baloo2';font-weight:700;src:url('${assetMap['fonts/Baloo2-Bold.ttf']}')}`:'',
    assetMap['fonts/Kameron-SemiBold.ttf']?`@font-face{font-family:'Kameron';font-weight:600;src:url('${assetMap['fonts/Kameron-SemiBold.ttf']}')}`:'',
    assetMap['fonts/LiberationSans.ttf']?`@font-face{font-family:'LiberationSans';src:url('${assetMap['fonts/LiberationSans.ttf']}')}`:'',
    localFontCss?`@font-face{font-family:'${localFamily.replace(/'/g,'')}';src:url('${sprMap.custom_font}')}`:'',
  ].filter(Boolean).join('\n');

  const aLines=Object.entries(assetMap).filter(([,v])=>v)
    .map(([k,v])=>`a[${JSON.stringify(k)}]=${JSON.stringify(v)};`).join('\n');
  const sLines=Object.entries(sprMap).filter(([,v])=>v)
    .map(([k,v])=>`sp[${JSON.stringify(k)}]=${JSON.stringify(v)};`).join('\n');

  return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Rise – Playable</title>
<style>
${googleHref?'@import url("'+googleHref.replace(/"/g,'')+'");':''}
${ff}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;background:${JSON.stringify(cfg.bgColor||'#0d0d14')};display:flex;align-items:center;justify-content:center;overflow:hidden}
#gr{width:var(--gw);height:var(--gh);max-width:100vw;max-height:100vh;position:relative;overflow:hidden;background:${JSON.stringify(cfg.bgColor||'#0d0d14')}}
#loader{position:absolute;inset:0;background:${JSON.stringify(cfg.bgColor||'#0d0d14')};display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.72);font:600 14px system-ui,sans-serif;z-index:5;overflow:hidden}
#loader::before{content:'';position:absolute;inset:0;background-image:var(--loader-bg);background-size:cover;background-position:center;opacity:.96;transform:scale(1.02)}
#loader::after{content:'Loading...';position:relative;padding:8px 12px;border-radius:999px;background:rgba(0,0,0,.22);backdrop-filter:blur(4px)}
#gr.portrait{--gw:390px;--gh:844px}
#gr.landscape{--gw:844px;--gh:390px}
@media(max-aspect-ratio:390/844){#gr.portrait{width:100vw;height:calc(100vw*844/390)}}
@media(min-aspect-ratio:390/844){#gr.portrait{height:100vh;width:calc(100vh*390/844)}}
@media(max-aspect-ratio:844/390){#gr.landscape{width:100vw;height:calc(100vw*390/844)}}
@media(min-aspect-ratio:844/390){#gr.landscape{height:100vh;width:calc(100vh*844/390)}}
</style>
</head>
<body>
<div id="gr"><div id="loader"></div></div>
<script>
${gameSrc}
${googleFontJs}
${localFontJs}
var a={};${aLines}
var sp={};${sLines}
var cfg=${JSON.stringify(cfg)};
(function(){
  var root=document.getElementById('gr');
  root.className=(cfg.orientation==='landscape')?'landscape':'portrait';
  var loader=document.getElementById('loader');
  var firstBg=sp.background;
  if(!firstBg){
    var bgKeys=Object.keys(sp).filter(function(k){return /^background_stage\d+$/.test(k);}).sort(function(a,b){return parseInt(a.replace('background_stage',''),10)-parseInt(b.replace('background_stage',''),10);});
    if(bgKeys.length)firstBg=sp[bgKeys[0]];
  }
  if(firstBg)root.style.setProperty('--loader-bg','url('+JSON.stringify(firstBg)+')');
  else root.style.setProperty('--loader-bg','none');
  var imgs={};
  var keys=Object.keys(sp);
  function boot(){
    if(loader)loader.style.display='none';
    var go=function(){
      RisePlayable.init(root,cfg,imgs,{
        onCTA:function(){try{if(typeof mraid!=='undefined')mraid.open('https://example.com');else window.open('https://example.com','_blank');}catch(e){}},
        onWin:function(){try{if(typeof mraid!=='undefined')mraid.open('https://example.com');}catch(e){}},
        onLose:function(){},onStageChange:function(){}
      });
    };
    if(document.fonts&&document.fonts.load){
      Promise.all([document.fonts.load("700 40px Baloo2"),document.fonts.load("600 40px Kameron"),document.fonts.load("400 40px LiberationSans")${googleFontFamilyCss?`,document.fonts.load(${JSON.stringify('700 40px '+googleFontFamilyCss)})`:''}${localFontCss?`,document.fonts.load(${JSON.stringify('700 40px '+localFontCss)})`:''}]).then(go).catch(go);
    }else{go();}
  }
  function loadImage(k){
    return new Promise(function(resolve){
      var img=new Image();
      img.onload=function(){
        var done=function(){imgs[k]=img;resolve();};
        if(img.decode)img.decode().then(done).catch(done);else done();
      };
      img.onerror=function(){resolve();};
      img.src=sp[k];
    });
  }
  if(!keys.length){boot();return;}
  Promise.all(keys.map(loadImage)).then(boot);
})();
</script>
</body>
</html>`;
}

function dlHTML(html,name){
  const b=new Blob([html],{type:'text/html'});
  const u=URL.createObjectURL(b);
  const a=document.createElement('a');
  a.href=u;a.download=name||'rise_playable.html';a.click();
  setTimeout(()=>URL.revokeObjectURL(u),3000);
}

async function buildAndDownload(opts){
  const{assetsBase='Assets',onProgress,onDone,onError}=opts||{};
  try{
    onProgress&&onProgress(0,'Reading config…');
    const cfg=readConfig();
    onProgress&&onProgress(.05,'Loading engine…');
    const src=await fetch('src/playable-template.js?v='+Date.now()).then(r=>r.text());
    onProgress&&onProgress(.1,'Loading assets…');
    const map=await loadBundle(assetsBase,p=>onProgress&&onProgress(.1+p*.8,`Assets ${Math.round(p*100)}%…`));
    onProgress&&onProgress(.92,'Building HTML…');
    const html=buildHTML(cfg,map,getSprites(),src);
    const kb=Math.round(html.length/1024);
    dlHTML(html,`rise_playable_${Date.now()}.html`);
    onProgress&&onProgress(1,`Done — ${kb} KB`);
    onDone&&onDone(kb);
  }catch(e){console.error(e);onError&&onError(e.message);}
}

async function buildPreview(iframe,opts){
  const{assetsBase='Assets',onProgress,onError}=opts||{};
  try{
    onProgress&&onProgress(0,'Building preview…');
    const cfg=readConfig();
    const src=await fetch('src/playable-template.js?v='+Date.now()).then(r=>r.text());
    const map=await loadBundle(assetsBase,p=>onProgress&&onProgress(p*.9,`${Math.round(p*100)}%…`));
    const html=buildHTML(cfg,map,getSprites(),src);
    iframe.srcdoc=html;
    onProgress&&onProgress(1,'Ready');
  }catch(e){console.error(e);onError&&onError(e.message);}
}

W.RiseBuilder={buildAndDownload,buildPreview,readConfig,setSprite,getSprites};
})(window);
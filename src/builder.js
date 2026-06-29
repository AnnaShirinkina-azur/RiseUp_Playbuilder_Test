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
    obstaclePushForce:g('cfg-pushForce'),gravityModifier:g('cfg-gravityModifier'),hpBarShowTime:g('cfg-hpBarShowTime'),
    tutorialDisplayTime:g('cfg-tutorialTime'),
    playerColor:g('cfg-playerColor'),playerOutlineColor:g('cfg-playerOutline'),playerSize:g('cfg-playerSize'),
    shieldColor:g('cfg-shieldColor'),shieldSize:g('cfg-shieldSize'),
    obstacleColor:g('cfg-obstacleColor'),obstacleColorAlt:g('cfg-obstacleColorAlt'),
    bgColor:g('cfg-bgColor'),groundColor:g('cfg-groundColor'),particleColor:g('cfg-particleColor'),
    stageColors:['cfg-stage0','cfg-stage1','cfg-stage2','cfg-stage3','cfg-stage4'].map(g),
    orientation:g('cfg-orientation')||'portrait',
    backgroundMode:g('cfg-bgMode')||'perStage',
    levelData,
  };
}

// ── fetch → base64 dataURL ─────────────────────────────────────────────────
function toB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob);});}
function fetchB64(url){return fetch(url).then(r=>{if(!r.ok)throw new Error(r.status+' '+url);return r.blob();}).then(toB64);}

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
  const ff=[
    assetMap['fonts/Baloo2-Bold.ttf']?`@font-face{font-family:'Baloo2';font-weight:700;src:url('${assetMap['fonts/Baloo2-Bold.ttf']}')}`:'',
    assetMap['fonts/Kameron-SemiBold.ttf']?`@font-face{font-family:'Kameron';font-weight:600;src:url('${assetMap['fonts/Kameron-SemiBold.ttf']}')}`:'',
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
${ff}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden}
#gr{width:var(--gw);height:var(--gh);max-width:100vw;max-height:100vh;position:relative;overflow:hidden}
#gr.portrait{--gw:390px;--gh:844px}
#gr.landscape{--gw:844px;--gh:390px}
@media(max-aspect-ratio:390/844){#gr.portrait{width:100vw;height:calc(100vw*844/390)}}
@media(min-aspect-ratio:390/844){#gr.portrait{height:100vh;width:calc(100vh*390/844)}}
@media(max-aspect-ratio:844/390){#gr.landscape{width:100vw;height:calc(100vw*390/844)}}
@media(min-aspect-ratio:844/390){#gr.landscape{height:100vh;width:calc(100vh*844/390)}}
</style>
</head>
<body>
<div id="gr"></div>
<script>
${gameSrc}
var a={};${aLines}
var sp={};${sLines}
var cfg=${JSON.stringify(cfg)};
(function(){
  var root=document.getElementById('gr');
  root.className=(cfg.orientation==='landscape')?'landscape':'portrait';
  var imgs={};
  var keys=Object.keys(sp);
  var left=keys.length;
  function boot(){
    RisePlayable.init(root,cfg,imgs,{
      onCTA:function(){try{if(typeof mraid!=='undefined')mraid.open('https://example.com');else window.open('https://example.com','_blank');}catch(e){}},
      onWin:function(){try{if(typeof mraid!=='undefined')mraid.open('https://example.com');}catch(e){}},
      onLose:function(){},onStageChange:function(){}
    });
  }
  if(left===0){boot();return;}
  keys.forEach(function(k){
    var img=new Image();
    img.onload=img.onerror=function(){imgs[k]=img;if(--left<=0)boot();};
    img.src=sp[k];
  });
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

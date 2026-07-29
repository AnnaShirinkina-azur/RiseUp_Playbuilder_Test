(function(W){'use strict';

// Read UI settings.
function readField(id){
  const e=document.getElementById(id);if(!e)return undefined;
  if(e.type==='checkbox')return e.checked;
  if(e.type==='number'||e.type==='range')return parseFloat(e.value);
  return e.value;
}
function readValue(id,fallback){
  const v=readField(id);
  if(v===undefined||v===null)return fallback;
  if(typeof v==='number'&&!Number.isFinite(v))return fallback;
  return v;
}
// Backward-compatible helper: some cached/intermediate builder versions called val(...).
// Keeping it defined prevents the preview from crashing with "ReferenceError: val is not defined".
if(!W.val)W.val=readValue;
function readConfig(){
  const g=readField;
  const val=readValue;
  // levelData берём из редактора в момент сборки
  let levelData=null;
  let playerStart=null;
  if(W.RiseLevelEditor){
    const ld=W.RiseLevelEditor.getLevelData();
    if(ld)levelData=ld;
    if(W.RiseLevelEditor.getPlayerStart)playerStart=W.RiseLevelEditor.getPlayerStart();
  }
  return{
    lives:g('cfg-lives'),gameSpeed:g('cfg-gameSpeed'),acceleration:g('cfg-acceleration'),stageCount:g('cfg-stageCount')||1,
    heightIndicatorEnabled:(function(){var e=document.getElementById('cfg-heightIndicatorEnabled');return e?e.checked:true;})(),
    heightStart:(function(){var v=g('cfg-heightStart');return isNaN(v)?66:v;})(),
    heightFeetPerStage:(function(){var v=g('cfg-heightFeetPerStage');return isNaN(v)?100:Math.max(0,v);})(),
    deathPause:(function(){var v=g('cfg-deathPause');return isNaN(v)?2500:Math.max(0,v*1000);})(),
    obstaclePushForce:g('cfg-pushForce'),gravityModifier:g('cfg-gravityModifier'),
    // Backward-compatible config key: now controls rigid side-group squeeze speed on level 1.
    level1CenterSpeed:(function(){var v=g('cfg-level1CenterSpeed');return isNaN(v)?33:Math.max(0,v);})(),
    level3BasketPower:(function(){var v=g('cfg-level3BasketPower');return isNaN(v)?0.6:Math.max(.2,v);})(),
    level3BallGravity:(function(){var v=g('cfg-level3BallGravity');return isNaN(v)?0.34:Math.max(0,v);})(),
    hpBarShowTime:g('cfg-hpBarShowTime')*1000,
    chainReaction:false,
    scatterBounciness:(function(){var v=g('cfg-scatterBounciness');return isNaN(v)?0.1:v;})(),
    tutorialDisplayTime:g('cfg-tutorialTime')*1000,
    tutorialText:(function(){var e=document.getElementById('cfg-tutorialText');return (e&&e.value!=null)?e.value:'protect your balloon!';})(),
    tutorialTextSize:(function(){var v=g('cfg-tutorialTextSize');return isNaN(v)?30:Math.max(8,Math.min(96,v));})(),
    tutorialX:(function(){var v=g('cfg-tutorialX');return isNaN(v)?50:Math.max(0,Math.min(100,v));})(),
    tutorialY:(function(){var v=g('cfg-tutorialY');return isNaN(v)?35:Math.max(0,Math.min(100,v));})(),
    tutorialCaptionGap:(function(){var v=g('cfg-tutorialCaptionGap');return isNaN(v)?-0.5:Math.max(-2,Math.min(5,v));})(),
    tutorialEnabled:(function(){var e=document.getElementById('cfg-tutorialEnabled');return e?e.checked:true;})(),
    tutorialFont:(function(){var e=document.getElementById('cfg-tutorialFont');return (e&&e.value)||'Baloo2';})(),
    tutorialAnimEnabled:(function(){var e=document.getElementById('cfg-tutorialEnabled');return e?e.checked:true;})(),
    tutorialFailEnabled:(function(){var e=document.getElementById('cfg-tutorialFailEnabled');return e?e.checked:true;})(),
    tutorialObstacleShape:(function(){var e=document.getElementById('cfg-tutorialObstacleShape');return (e&&e.value)||'square';})(),
    tutorialObstacleTint:(function(){var e=document.getElementById('cfg-tutorialObstacleTint');return (e&&e.value)||'#ffffff';})(),
    playerSize:g('cfg-playerSize'),balloonCount:(function(){var v=g('cfg-balloonCount');return isNaN(v)?1:Math.max(1,Math.round(v));})(),balloonSpacing:(function(){var v=g('cfg-balloonSpacing');return isNaN(v)?30:Math.max(0,v);})(),playerDeathAnimSpeed:g('cfg-playerDeathAnimSpeed'),playerDeathFrames:4,playerSpriteColor:g('cfg-playerSpriteColor'),playerRopeColor:g('cfg-playerRopeColor'),playerStart,
    shieldSize:g('cfg-shieldSize'),shieldSpriteColor:g('cfg-shieldSpriteColor'),
    backgroundSpriteColor:g('cfg-bgSpriteColor'),
    stageColors:['cfg-stage0','cfg-stage1','cfg-stage2','cfg-stage3','cfg-stage4'].map(g),
    stageAccents:(function(){var e=document.getElementById('cfg-stageAccents');return e?e.checked:true;})(),
    showGrid:false,
    orientation:g('cfg-orientation')||'landscape',
    backgroundMode:(function(){var e=document.getElementById('cfg-backgroundMode');return (e&&e.value)||'perStage';})(),
    stageBgGradients:(function(){var a=[],i=0;for(;;){var x=document.getElementById('cfg-bgg'+i+'a'),y=document.getElementById('cfg-bgg'+i+'b');if(!x||!y)break;a.push([x.value,y.value]);i++;}return a.length?a:null;})(),
    seamScale:(function(){var e=document.getElementById('cfg-seamScale');var v=e?parseFloat(e.value):1;return isNaN(v)?0.5:Math.max(0.3,v);})(),
    seamOverlayMode:(function(){var e=document.getElementById('cfg-seamOverlayMode');return (e&&e.value)||'perStage';})(),
    seamMulti:(function(){var m=document.getElementById('cfg-seamOverlayMode');if(m)return m.value==='perStage';var e=document.getElementById('cfg-seamMulti');return !!(e&&e.checked);})(),
    seamTint:(function(){var e=document.getElementById('cfg-seamTint');return (e&&e.value)||'#ffffff';})(),
    stageSeamTints:(function(){var a=[],i=0;for(;;){var e=document.getElementById('cfg-seamt'+i);if(!e)break;a.push(e.value||'#ffffff');i++;}return a.length?a:null;})(),
    bgStageTint:(function(){var e=document.getElementById('cfg-bgStageTint');return (e&&e.value)||'#ffffff';})(),
    stageBgTints:(function(){var a=[],i=0;for(;;){var e=document.getElementById('cfg-bgt'+i);if(!e)break;a.push(e.value||'#ffffff');i++;}return a.length?a:null;})(),
    googleFontUrl:g('cfg-googleFontUrl')||'',
    googleFontFamily:g('cfg-googleFontFamily')||'',
    localFontFamily:g('cfg-localFontFamily')||'CustomFont',
    soundEnabled:(function(){var e=document.getElementById('cfg-soundEnabled');return e?e.checked:true;})(),
    soundVolume:(g('cfg-soundVolume')!=null?g('cfg-soundVolume'):0.8),
    soundVolumes:{
      bgm:(g('cfg-vol-bgm')!=null?g('cfg-vol-bgm'):0.7),
      win:(g('cfg-vol-win')!=null?g('cfg-vol-win'):1),
      lose:(g('cfg-vol-lose')!=null?g('cfg-vol-lose'):1),
      hit:(g('cfg-vol-hit')!=null?g('cfg-vol-hit'):1),
      shield:(g('cfg-vol-shield')!=null?g('cfg-vol-shield'):0.9),
    },
    levelData,
    endCard:{
      enabled:true,
      winEnabled:(function(){var e=document.getElementById('cfg-winEndCardEnabled');return e?e.checked:true;})(),
      loseEnabled:(function(){var e=document.getElementById('cfg-loseEndCardEnabled');return e?e.checked:true;})(),
      tryAgainEnabled:(function(){var e=document.getElementById('cfg-tryAgainEnabled');return e?e.checked:true;})(),
      tryAgainDelay:(function(){var v=g('cfg-tryAgainDelay');return isNaN(v)?0:v*1000;})(),
      countdownFrom:(function(){var v=g('cfg-endCardCountdown');return isNaN(v)?10:Math.max(1,Math.round(v));})(),
      tryAgainDuration:(function(){var v=g('cfg-tryAgainDuration');return isNaN(v)?0:Math.max(0,v*1000);})(),
      scale:(function(){var v=g('cfg-endCardScale');return isNaN(v)?1:v;})(),
      x:(function(){var v=g('cfg-endCardX');return isNaN(v)?0:v;})(),
      y:(function(){var v=g('cfg-endCardY');return isNaN(v)?0:v;})(),
      overlay:(function(){var v=g('cfg-endCardOverlay');return isNaN(v)?0.55:v;})(),
      overlayColor:(function(){var e=document.getElementById('cfg-endCardOverlayColor');return (e&&e.value)||'#000000';})(),
      showCta:(function(){var e=document.getElementById('cfg-endCardCta');return e?e.checked:true;})(),
      ctaText:(function(){var layouts=(window.RiseEndCardEditor&&window.RiseEndCardEditor.getData)?window.RiseEndCardEditor.getData():null;var or=(g('cfg-orientation')==='portrait'?'portrait':'landscape');var group=layouts&&layouts.lose;var layout=group&&(group[or]||group.landscape||group.portrait);var value=layout&&layout.cta&&layout.cta.text;return (typeof value==='string'&&value.trim())?value:'TRY AGAIN';})(),
      fontFamily:(function(){var e=document.getElementById('cfg-endCardFont')||document.getElementById('tx-font');return (e&&e.value)||'Baloo2';})(),
      ctaY:(function(){var v=g('cfg-endCardCtaY');return isNaN(v)?74:v;})(),
      layouts:(window.RiseEndCardEditor&&window.RiseEndCardEditor.getData)?window.RiseEndCardEditor.getData():null
    },
  };
}

// ── fetch → base64 dataURL ─────────────────────────────────────────────────
function toB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob);});}
function fetchB64(url){return fetch(url).then(r=>{if(!r.ok)throw new Error(r.status+' '+url);return r.blob();}).then(toB64);}
function googleFontFamilyFromUrl(url){url=String(url||'').trim();if(!url)return '';try{const u=new URL(url);let fam=u.searchParams.get('family');if(fam)return fam.split(':')[0].replace(/\+/g,' ').trim();const parts=u.pathname.split('/').filter(Boolean),i=parts.indexOf('specimen');if(i>=0&&parts[i+1])return decodeURIComponent(parts[i+1]).replace(/\+/g,' ').trim();}catch(e){}return '';}
function googleFontCssUrl(url,family){url=String(url||'').trim();family=String(family||'').trim();if(!url&&family)url='https://fonts.googleapis.com/css2?family='+encodeURIComponent(family).replace(/%20/g,'+')+':wght@400;500;600;700;800&display=swap';try{const u=new URL(url);if(u.hostname==='fonts.google.com'){const fam=family||googleFontFamilyFromUrl(url);return fam?'https://fonts.googleapis.com/css2?family='+encodeURIComponent(fam).replace(/%20/g,'+')+':wght@400;500;600;700;800&display=swap':'';}if(u.hostname==='fonts.googleapis.com')return url;}catch(e){}return url;}
function fontCssFamily(name){name=String(name||'').trim();return name.indexOf(' ')>=0?'\"'+name.replace(/\"/g,'')+'\",sans-serif':name+',sans-serif';}

// ── Бандл ассетов ─────────────────────────────────────────────────────────
// Export only the fallbacks that the playable can actually use. Large editor-only
// textures and unused sounds must never be embedded in the final HTML.
const IMAGE_FALLBACK_BUNDLE=[
  'textures/heart.png','textures/balloon.png','textures/balloon_death.png',
  'textures/controller.png','textures/tutorial_hand.svg','textures/tutorial_triangle.png',
  'textures/height_arrow.png','textures/endcard_countdown_badge.png'
];
const AUDIO_FALLBACKS={
  bgm:'audio/optimized/bgm.mp3',
  win:'audio/optimized/sfx_win.mp3',
  lose:'audio/optimized/sfx_lose.mp3',
  hit:'audio/optimized/sfx_wrong.mp3',
  shield:'audio/optimized/sfx_correct.mp3'
};
const FONT_FALLBACKS={
  Baloo2:'fonts/optimized/Baloo2-Bold.woff2',
  Kameron:'fonts/optimized/Kameron-SemiBold.woff2',
  LiberationSans:'fonts/optimized/LiberationSans.woff2'
};
function bundleForConfig(cfg,sprMap){
  const out=IMAGE_FALLBACK_BUNDLE.slice();
  if(cfg.soundEnabled!==false){
    Object.keys(AUDIO_FALLBACKS).forEach(k=>{if(!sprMap['audio_'+k])out.push(AUDIO_FALLBACKS[k]);});
  }
  const serialized=JSON.stringify(cfg||{});
  Object.keys(FONT_FALLBACKS).forEach(name=>{if(serialized.indexOf(name)>=0)out.push(FONT_FALLBACKS[name]);});
  return Array.from(new Set(out));
}
async function loadBundle(base,paths,onP){
  const list=paths||[],m={};let done=0;
  if(!list.length){onP&&onP(1);return m;}
  await Promise.allSettled(list.map(async p=>{
    try{m[p]=await fetchB64(`${base}/${p}`);}catch(e){m[p]=null;}
    onP&&onP(++done/list.length);
  }));
  return m;
}

// ── Export optimisation ───────────────────────────────────────────────────
const OPTIMIZED_DATA_URLS=new Map();
function dataUrlByteLength(src){
  if(typeof src!=='string')return 0;
  const comma=src.indexOf(',');if(comma<0)return src.length;
  return /;base64/i.test(src.slice(0,comma))?Math.floor((src.length-comma-1)*3/4):src.length-comma-1;
}
function blobToDataUrl(blob){return toB64(blob);}
function loadDataImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
async function optimiseRasterDataUrl(src){
  if(!/^data:image\/(?:png|jpe?g|webp);/i.test(src)||dataUrlByteLength(src)<12*1024)return src;
  try{
    const im=await loadDataImage(src),maxDim=1280,scale=Math.min(1,maxDim/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height));
    const w=Math.max(1,Math.round((im.naturalWidth||im.width)*scale)),h=Math.max(1,Math.round((im.naturalHeight||im.height)*scale));
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    const cx=cv.getContext('2d',{alpha:true});cx.clearRect(0,0,w,h);cx.drawImage(im,0,0,w,h);
    const quality=dataUrlByteLength(src)>500*1024?.74:.84;
    const blob=await new Promise(resolve=>cv.toBlob(resolve,'image/webp',quality));
    if(!blob)return src;
    const packed=await blobToDataUrl(blob);
    return dataUrlByteLength(packed)<dataUrlByteLength(src)*.97?packed:src;
  }catch(e){return src;}
}
function encodeMonoWav(buffer,targetRate){
  const channels=buffer.numberOfChannels||1,srcRate=buffer.sampleRate||44100,length=Math.max(1,Math.floor(buffer.duration*targetRate));
  const out=new ArrayBuffer(44+length*2),view=new DataView(out);
  function str(off,v){for(let i=0;i<v.length;i++)view.setUint8(off+i,v.charCodeAt(i));}
  str(0,'RIFF');view.setUint32(4,36+length*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,targetRate,true);view.setUint32(28,targetRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,length*2,true);
  const data=[];for(let c=0;c<channels;c++)data.push(buffer.getChannelData(c));
  const ratio=srcRate/targetRate;
  for(let i=0;i<length;i++){
    const pos=i*ratio,lo=Math.floor(pos),hi=Math.min(buffer.length-1,lo+1),t=pos-lo;let sample=0;
    for(let c=0;c<channels;c++){const a=data[c][lo]||0,b=data[c][hi]||0;sample+=a+(b-a)*t;}
    sample=Math.max(-1,Math.min(1,sample/channels));view.setInt16(44+i*2,sample<0?sample*32768:sample*32767,true);
  }
  return new Blob([out],{type:'audio/wav'});
}
async function optimiseAudioDataUrl(src,path){
  if(!/^data:audio\//i.test(src)||dataUrlByteLength(src)<140*1024||/^data:audio\/(?:mpeg|mp3|ogg|webm)/i.test(src))return src;
  let ctx=null;
  try{
    const bytes=await fetch(src).then(r=>r.arrayBuffer());
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    const decoded=await ctx.decodeAudioData(bytes.slice(0));
    const rate=/bgm/i.test(path)?18000:16000,blob=encodeMonoWav(decoded,rate),packed=await blobToDataUrl(blob);
    return dataUrlByteLength(packed)<dataUrlByteLength(src)*.94?packed:src;
  }catch(e){return src;}finally{try{ctx&&ctx.close();}catch(e){}}
}
async function optimiseDataTree(value,path,onStep){
  if(typeof value==='string'&&/^data:/i.test(value)){
    if(!OPTIMIZED_DATA_URLS.has(value))OPTIMIZED_DATA_URLS.set(value,(async()=>{
      if(/^data:image\//i.test(value))return optimiseRasterDataUrl(value);
      if(/^data:audio\//i.test(value))return optimiseAudioDataUrl(value,path);
      return value;
    })());
    const out=await OPTIMIZED_DATA_URLS.get(value);onStep&&onStep();return out;
  }
  if(Array.isArray(value)){
    const out=new Array(value.length);for(let i=0;i<value.length;i++)out[i]=await optimiseDataTree(value[i],path+'['+i+']',onStep);return out;
  }
  if(value&&typeof value==='object'){
    const out={};for(const k of Object.keys(value))out[k]=await optimiseDataTree(value[k],path+'.'+k,onStep);return out;
  }
  return value;
}
function countDataUrls(value){let n=0;(function walk(v){if(typeof v==='string'&&/^data:/i.test(v))n++;else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);})(value);return n;}
async function optimiseExportPayload(cfg,assetMap,sprMap,onProgress){
  const total=Math.max(1,countDataUrls(cfg)+countDataUrls(assetMap)+countDataUrls(sprMap)),state={done:0};
  const step=()=>{state.done++;onProgress&&onProgress(Math.min(1,state.done/total));};
  return{
    cfg:await optimiseDataTree(cfg,'cfg',step),
    assetMap:await optimiseDataTree(assetMap,'assets',step),
    sprMap:await optimiseDataTree(sprMap,'sprites',step)
  };
}

// Store each data URL once. Configuration objects use compact references that are
// expanded before the game starts. This removes repeated CTA, background, prefab,
// heart and End Card images from the generated HTML.
const ASSET_REF_PREFIX='\u0001R';
function packDataUrls(value,registry,index){
  if(typeof value==='string'&&/^data:/i.test(value)){
    let id=index.get(value);if(id==null){id=registry.length;registry.push(value);index.set(value,id);}
    return ASSET_REF_PREFIX+id.toString(36);
  }
  if(Array.isArray(value))return value.map(v=>packDataUrls(v,registry,index));
  if(value&&typeof value==='object'){const out={};Object.keys(value).forEach(k=>out[k]=packDataUrls(value[k],registry,index));return out;}
  return value;
}
function packPayload(cfg,assetMap,sprMap){
  const registry=[],index=new Map();
  return{registry,payload:{cfg:packDataUrls(cfg,registry,index),a:packDataUrls(assetMap,registry,index),sp:packDataUrls(sprMap,registry,index)}};
}

// ── Пользовательские спрайты ──────────────────────────────────────────────
const SPRS={};
function setSprite(key,b64){if(b64==null)delete SPRS[key];else SPRS[key]=b64;}
function getSprites(){return Object.assign({},SPRS);}

// ── Собираем итоговый HTML ────────────────────────────────────────────────
function buildHTML(cfg,assetMap,sprMap,gameSrc){
  if(assetMap['textures/heart.png'])cfg.defaultHeartSrc=assetMap['textures/heart.png'];
  if(assetMap['textures/balloon.png'])cfg.defaultPlayerSrc=assetMap['textures/balloon.png'];
  if(assetMap['textures/balloon_death.png'])cfg.defaultPlayerDeathSrc=assetMap['textures/balloon_death.png'];
  if(assetMap['textures/controller.png'])cfg.defaultShieldSrc=assetMap['textures/controller.png'];
  if(assetMap['textures/tutorial_hand.svg'])cfg.defaultTutorialHandSrc=assetMap['textures/tutorial_hand.svg'];
  if(assetMap['textures/tutorial_triangle.png'])cfg.defaultTutorialTriangleSrc=assetMap['textures/tutorial_triangle.png'];
  if(assetMap['textures/height_arrow.png'])cfg.defaultHeightArrowSrc=assetMap['textures/height_arrow.png'];
  if(assetMap['textures/endcard_countdown_badge.png'])cfg.defaultEndCardCountdownBadgeSrc=assetMap['textures/endcard_countdown_badge.png'];
  const googleFamily=cfg.googleFontFamily||googleFontFamilyFromUrl(cfg.googleFontUrl);
  if(googleFamily)cfg.googleFontFamily=googleFamily;
  const googleHref=googleFontCssUrl(cfg.googleFontUrl,googleFamily);
  const googleFontFamilyCss=googleFamily?fontCssFamily(googleFamily):'';
  const googleFontJs=googleFamily?('RiseFontCSS['+JSON.stringify(googleFamily)+']='+JSON.stringify(googleFontFamilyCss)+';') : '';
  const localFamily=(cfg.localFontFamily||'CustomFont').trim();
  const localFontCss=(sprMap.custom_font&&localFamily)?fontCssFamily(localFamily):'';
  const localFontJs=localFontCss?('RiseFontCSS['+JSON.stringify(localFamily)+']='+JSON.stringify(localFontCss)+';') : '';
  const ff=[
    assetMap['fonts/optimized/Baloo2-Bold.woff2']?`@font-face{font-family:'Baloo2';font-weight:700;src:url('${assetMap['fonts/optimized/Baloo2-Bold.woff2']}') format('woff2')}`:'',
    assetMap['fonts/optimized/Kameron-SemiBold.woff2']?`@font-face{font-family:'Kameron';font-weight:600;src:url('${assetMap['fonts/optimized/Kameron-SemiBold.woff2']}') format('woff2')}`:'',
    assetMap['fonts/optimized/LiberationSans.woff2']?`@font-face{font-family:'LiberationSans';src:url('${assetMap['fonts/optimized/LiberationSans.woff2']}') format('woff2')}`:'',
    localFontCss?`@font-face{font-family:'${localFamily.replace(/'/g,'')}';src:url('${sprMap.custom_font}')}`:'',
  ].filter(Boolean).join('\n');

  const runtimeAssets={};Object.keys(assetMap).forEach(k=>{if(!/^fonts\//.test(k))runtimeAssets[k]=assetMap[k];});
  const runtimeSprites=Object.assign({},sprMap);delete runtimeSprites.custom_font;
  const packed=packPayload(cfg,runtimeAssets,runtimeSprites);
  const registryJson=JSON.stringify(packed.registry),payloadJson=JSON.stringify(packed.payload);

  return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Rise – Playable</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@700&display=swap");
${googleHref?'@import url("'+googleHref.replace(/"/g,'')+'");':''}
${ff}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;background:${JSON.stringify(cfg.bgColor||'#0d0d14')};display:flex;align-items:center;justify-content:center;overflow:hidden}
#gr{width:var(--gw);height:var(--gh);max-width:100vw;max-height:100vh;position:relative;overflow:hidden;background:${JSON.stringify(cfg.bgColor||'#0d0d14')}}
#loader{position:absolute;inset:0;background:${JSON.stringify(cfg.bgColor||'#0d0d14')};display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.72);font:600 14px system-ui,sans-serif;z-index:5;overflow:hidden}
#loader::before{content:'';position:absolute;inset:0;background-image:var(--loader-bg);background-size:cover;background-position:center;opacity:.96;transform:scale(1.02)}
#loader::after{content:'Loading...';position:relative;padding:8px 12px;border-radius:999px;background:rgba(0,0,0,.22);backdrop-filter:blur(4px)}
#gr.portrait{--gw:390px;--gh:844px}
#gr.landscape{--gw:100vw;--gh:100vh;max-width:none;max-height:none}
@media(max-aspect-ratio:390/844){#gr.portrait{width:100vw;height:calc(100vw*844/390)}}
@media(min-aspect-ratio:390/844){#gr.portrait{height:100vh;width:calc(100vh*390/844)}}
</style>
</head>
<body>
<div id="gr"><div id="loader"></div></div>
<script>
${gameSrc}
${googleFontJs}
${localFontJs}
var __R=${registryJson},__P=${payloadJson};
function __U(v){
  if(typeof v==='string'&&v.slice(0,2)==='\u0001R')return __R[parseInt(v.slice(2),36)];
  if(Array.isArray(v)){for(var i=0;i<v.length;i++)v[i]=__U(v[i]);return v;}
  if(v&&typeof v==='object'){Object.keys(v).forEach(function(k){v[k]=__U(v[k]);});return v;}
  return v;
}
var a=__U(__P.a),sp=__U(__P.sp),cfg=__U(__P.cfg);__R=null;__P=null;
(function(){
  var root=document.getElementById('gr');
  // Adaptive: one file serves both orientations (like Luna playground previews).
  // Orientation is detected from the viewport and updated live on rotate/resize.
  function orNow(){return window.innerWidth>window.innerHeight?'landscape':'portrait';}
  cfg.orientation=orNow();
  root.className=cfg.orientation;
  // Audio: custom sounds from the builder (sp.audio_*) win over bundled defaults.
  cfg.audioSources={
    bgm:sp.audio_bgm||a['audio/optimized/bgm.mp3']||null,
    win:sp.audio_win||a['audio/optimized/sfx_win.mp3']||null,
    lose:sp.audio_lose||a['audio/optimized/sfx_lose.mp3']||null,
    hit:sp.audio_hit||a['audio/optimized/sfx_wrong.mp3']||null,
    shield:sp.audio_shield||a['audio/optimized/sfx_correct.mp3']||null
  };
  var game=null;
  function onOrient(){
    var o=orNow();
    cfg.orientation=o;root.className=o;
    if(game&&game.setOrientation)game.setOrientation(o);
  }
  window.addEventListener('resize',onOrient);
  window.addEventListener('orientationchange',onOrient);
  var loader=document.getElementById('loader');
  var firstBg=sp.background;
  if(!firstBg){
    var bgKeys=Object.keys(sp).filter(function(k){return /^bgimg_/.test(k);}).sort();
    if(bgKeys.length)firstBg=sp[bgKeys[0]];
  }
  if(firstBg)root.style.setProperty('--loader-bg','url('+JSON.stringify(firstBg)+')');
  else root.style.setProperty('--loader-bg','none');
  var imgs={};
  var keys=Object.keys(sp).filter(function(k){return !/^audio_/.test(k)&&k!=='custom_font';});
  function boot(){
    if(loader)loader.style.display='none';
    var go=function(){
      onOrient();
      game=RisePlayable.init(root,cfg,imgs,{
        onCTA:function(){try{if(typeof mraid!=='undefined')mraid.open('https://play.google.com/store/apps/details?id=com.riseup.game&hl=en');else window.open('https://play.google.com/store/apps/details?id=com.riseup.game&hl=en','_blank');}catch(e){}},
        // Level 4 already has its own one-shot conversion trigger. Keep the
        // completion callback passive so an enabled Win Card remains visible
        // until the player presses its CTA.
        onWin:function(){},
        onLose:function(){},onStageChange:function(){}
      });
      window.RiseGame=game;
      window.RisePreviewControl={
        play:function(){if(game&&game.play)game.play();},
        pause:function(){if(game&&game.pause)game.pause();},
        stop:function(){if(game&&game.stop)game.stop();},
        isPaused:function(){return !!(game&&game.isPaused&&game.isPaused());},
        state:function(){return game&&game.getState?game.getState():null;}
      };
    };
    if(document.fonts&&document.fonts.load){
      Promise.all([document.fonts.load("700 40px Baloo2"),document.fonts.load("600 40px Kameron"),document.fonts.load("400 40px LiberationSans"),document.fonts.load('700 40px "Roboto Mono"')${googleFontFamilyCss?`,document.fonts.load(${JSON.stringify('700 40px '+googleFontFamilyCss)})`:''}${localFontCss?`,document.fonts.load(${JSON.stringify('700 40px '+localFontCss)})`:''}]).then(go).catch(go);
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
    const cfg=readConfig(),sprites=getSprites();
    onProgress&&onProgress(.04,'Loading engine…');
    const src=await fetch('src/playable-template.js?v='+Date.now()).then(r=>r.text());
    const bundle=bundleForConfig(cfg,sprites);
    onProgress&&onProgress(.08,'Loading required assets…');
    const map=await loadBundle(assetsBase,bundle,p=>onProgress&&onProgress(.08+p*.32,`Assets ${Math.round(p*100)}%…`));
    onProgress&&onProgress(.42,'Compressing textures and audio…');
    const optimised=await optimiseExportPayload(cfg,map,sprites,p=>onProgress&&onProgress(.42+p*.48,`Optimising ${Math.round(p*100)}%…`));
    onProgress&&onProgress(.92,'Deduplicating assets…');
    const html=buildHTML(optimised.cfg,optimised.assetMap,optimised.sprMap,src);
    const bytes=new Blob([html],{type:'text/html'}).size,kb=Math.round(bytes/1024),mb=bytes/1048576;
    dlHTML(html,`rise_playable_${Date.now()}.html`);
    onProgress&&onProgress(1,(bytes<=5*1048576?'Done':'Warning: over 5 MB')+' — '+mb.toFixed(2)+' MB');
    onDone&&onDone(kb,{bytes,mb,withinLimit:bytes<=5*1048576});
  }catch(e){console.error(e);onError&&onError(e.message);}
}

async function buildPreview(iframe,opts){
  const{assetsBase='Assets',onProgress,onError}=opts||{};
  try{
    onProgress&&onProgress(0,'Building preview…');
    const cfg=readConfig(),sprites=getSprites();
    const src=await fetch('src/playable-template.js?v='+Date.now()).then(r=>r.text());
    const bundle=bundleForConfig(cfg,sprites);
    const map=await loadBundle(assetsBase,bundle,p=>onProgress&&onProgress(p*.35,`${Math.round(p*100)}%…`));
    const optimised=await optimiseExportPayload(cfg,map,sprites,p=>onProgress&&onProgress(.35+p*.55,`Optimising ${Math.round(p*100)}%…`));
    const html=buildHTML(optimised.cfg,optimised.assetMap,optimised.sprMap,src);
    iframe.srcdoc=html;
    onProgress&&onProgress(1,'Ready — '+(new Blob([html]).size/1048576).toFixed(2)+' MB');
  }catch(e){console.error(e);onError&&onError(e.message);}
}

W.RiseBuilder={buildAndDownload,buildPreview,readConfig,setSprite,getSprites,_buildHTML:buildHTML,_packPayload:packPayload,_bundleForConfig:bundleForConfig};
})(window);
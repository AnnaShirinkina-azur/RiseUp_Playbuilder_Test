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
    orientation:g('cfg-orientation')||'portrait',
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
      enabled:(function(){var e=document.getElementById('cfg-endCardEnabled');return e?e.checked:true;})(),
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
const BUNDLE=[
  'textures/bg_bathroom.png','textures/bg_light_overlay.png','textures/bg_sky.png',
  'textures/endcard_lose_image.png','textures/endcard_win_image.png',
  'textures/hand.png','textures/tutorial_hand.svg','textures/tutorial_triangle.png','textures/height_arrow.png','textures/endcard_countdown_badge.png','textures/heart.png','textures/balloon.png','textures/balloon_death.png','textures/controller.png','textures/obj_brush.png','textures/obj_brush_mask.png',
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
var a={};${aLines}
var sp={};${sLines}
var cfg=${JSON.stringify(cfg)};
(function(){
  var root=document.getElementById('gr');
  // Adaptive: one file serves both orientations (like Luna playground previews).
  // Orientation is detected from the viewport and updated live on rotate/resize.
  function orNow(){return window.innerWidth>window.innerHeight?'landscape':'portrait';}
  cfg.orientation=orNow();
  root.className=cfg.orientation;
  // Audio: custom sounds from the builder (sp.audio_*) win over bundled defaults.
  cfg.audioSources={
    bgm:sp.audio_bgm||a['audio/bgm.wav']||null,
    win:sp.audio_win||a['audio/sfx_win.wav']||null,
    lose:sp.audio_lose||a['audio/sfx_lose.wav']||null,
    hit:sp.audio_hit||a['audio/sfx_wrong.wav']||null,
    shield:sp.audio_shield||a['audio/sfx_correct.wav']||null
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
        onWin:function(){try{if(typeof mraid!=='undefined')mraid.open('https://play.google.com/store/apps/details?id=com.riseup.game&hl=en');else window.open('https://play.google.com/store/apps/details?id=com.riseup.game&hl=en','_blank');}catch(e){}},
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
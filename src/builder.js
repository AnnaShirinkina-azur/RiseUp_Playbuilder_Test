/**
 * RISE Builder — reads UI config, embeds assets, builds self-contained HTML
 */
(function(global) {
  'use strict';

  // ── Read config from UI ────────────────────────────────────────────────────
  function readConfig() {
    function val(id) {
      const el=document.getElementById(id); if(!el) return undefined;
      if(el.type==='checkbox') return el.checked;
      if(el.type==='number'||el.type==='range') return parseFloat(el.value);
      return el.value;
    }
    return {
      lives:       val('cfg-lives'),
      gameSpeed:   val('cfg-gameSpeed'),
      acceleration:val('cfg-acceleration'),
      obstaclePushForce: val('cfg-pushForce'),
      hpBarShowTime:     val('cfg-hpBarShowTime'),
      tutorialDisplayTime: val('cfg-tutorialTime'),
      playerColor:      val('cfg-playerColor'),
      playerOutlineColor: val('cfg-playerOutline'),
      playerSize:       val('cfg-playerSize'),
      obstacleColor:    val('cfg-obstacleColor'),
      obstacleColorAlt: val('cfg-obstacleColorAlt'),
      bgColor:          val('cfg-bgColor'),
      groundColor:      val('cfg-groundColor'),
      particleColor:    val('cfg-particleColor'),
      stageColors: ['cfg-stage0','cfg-stage1','cfg-stage2','cfg-stage3','cfg-stage4'].map(val),
      levelData: global.RiseLevelEditor ? global.RiseLevelEditor.getLevelData() : null,
    };
  }

  // ── File → base64 ──────────────────────────────────────────────────────────
  function fileToB64(file) {
    return new Promise((res,rej)=>{
      const r=new FileReader();
      r.onload=()=>res(r.result);
      r.onerror=rej;
      r.readAsDataURL(file);
    });
  }

  function fetchB64(url) {
    return fetch(url).then(r=>r.blob()).then(b=>new Promise((res,rej)=>{
      const r=new FileReader();
      r.onload=()=>res(r.result);
      r.onerror=rej;
      r.readAsDataURL(b);
    }));
  }

  // ── Load bundled assets ────────────────────────────────────────────────────
  const BUNDLED = [
    'textures/bg_bathroom.png','textures/bg_light_overlay.png','textures/bg_sky.png',
    'textures/endcard_lose_image.png','textures/endcard_win_image.png',
    'textures/hand.png','textures/obj_brush.png','textures/obj_brush_mask.png',
    'audio/bgm.wav','audio/bgm_fail_loop.wav','audio/sfx_confetti.wav',
    'audio/sfx_correct.wav','audio/sfx_lose.wav','audio/sfx_win.wav','audio/sfx_wrong.wav',
    'fonts/Baloo2-Bold.ttf','fonts/Kameron-SemiBold.ttf',
  ];

  async function loadBundled(base, onProg) {
    const map={};
    let done=0;
    await Promise.allSettled(BUNDLED.map(async p=>{
      try { map[p]=await fetchB64(`${base}/${p}`); } catch(e){ map[p]=null; }
      onProg&&onProg(++done/BUNDLED.length);
    }));
    return map;
  }

  // ── Custom sprite registry (set from UI) ───────────────────────────────────
  const customSprites = {};   // key → base64 dataURL

  function setCustomSprite(key, b64) { customSprites[key]=b64; }
  function getCustomSprites() { return Object.assign({}, customSprites); }

  // ── Build final HTML ───────────────────────────────────────────────────────
  function buildHTML(cfg, assetMap, customSpr, gameSource) {
    const fontFace = [
      assetMap['fonts/Baloo2-Bold.ttf']
        ? `@font-face{font-family:'Baloo2';font-weight:700;src:url('${assetMap['fonts/Baloo2-Bold.ttf']}');}` : '',
      assetMap['fonts/Kameron-SemiBold.ttf']
        ? `@font-face{font-family:'Kameron';font-weight:600;src:url('${assetMap['fonts/Kameron-SemiBold.ttf']}');}` : '',
    ].join('\n');

    const assetLines = Object.entries(assetMap)
      .filter(([,v])=>v)
      .map(([k,v])=>`  a[${JSON.stringify(k)}]=${JSON.stringify(v)};`)
      .join('\n');

    const spriteLines = Object.entries(customSpr)
      .filter(([,v])=>v)
      .map(([k,v])=>`  sp[${JSON.stringify(k)}]=${JSON.stringify(v)};`)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Rise – Playable</title>
<style>
${fontFace}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden}
#gr{width:390px;height:844px;max-width:100vw;max-height:100vh;position:relative;overflow:hidden}
@media(max-aspect-ratio:390/844){#gr{width:100vw;height:calc(100vw*844/390)}}
@media(min-aspect-ratio:390/844){#gr{height:100vh;width:calc(100vh*390/844)}}
</style>
</head>
<body>
<div id="gr"></div>
<script>
${gameSource}
var a={};
${assetLines}
var sp={};
${spriteLines}
var cfg=${JSON.stringify(cfg,null,2)};

// Load images from base64 and boot
(function(){
  var root=document.getElementById('gr');
  var assets={};
  var toLoad=[];

  function loadImg(key, src, cb){
    var img=new Image();
    img.onload=cb; img.onerror=cb;
    img.src=src;
    assets[key]=img;
  }

  // custom sprites override
  var sprKeys=Object.keys(sp);
  var pending=sprKeys.length;
  if(pending===0) boot();
  sprKeys.forEach(function(k){
    loadImg(k, sp[k], function(){ if(--pending<=0) boot(); });
  });

  function boot(){
    RisePlayable.init(root, cfg, assets, {
      onWin:function(){ try{ if(typeof mraid!=='undefined') mraid.open('https://example.com'); }catch(e){} },
      onCTA:function(){ try{ if(typeof mraid!=='undefined') mraid.open('https://example.com'); else window.open('https://example.com','_blank'); }catch(e){} },
      onLose:function(){},
      onStageChange:function(i){}
    });
  }
})();
</script>
</body>
</html>`;
  }

  function download(html, name) {
    const b=new Blob([html],{type:'text/html'});
    const u=URL.createObjectURL(b);
    const a=document.createElement('a');
    a.href=u; a.download=name||'rise_playable.html'; a.click();
    setTimeout(()=>URL.revokeObjectURL(u),2000);
  }

  async function buildAndDownload(opts) {
    const {assetsBase='Assets', onProgress, onDone, onError}=opts||{};
    try {
      onProgress&&onProgress(0,'Reading config…');
      const cfg=readConfig();
      onProgress&&onProgress(.05,'Loading engine…');
      const src=await fetch('src/playable-template.js').then(r=>r.text());
      onProgress&&onProgress(.1,'Loading assets…');
      const map=await loadBundled(assetsBase, p=>onProgress&&onProgress(.1+p*.8,`Assets ${Math.round(p*100)}%…`));
      onProgress&&onProgress(.92,'Building…');
      const html=buildHTML(cfg, map, getCustomSprites(), src);
      const kb=Math.round(html.length/1024);
      download(html,`rise_playable_${Date.now()}.html`);
      onProgress&&onProgress(1,`Done — ${kb} KB`);
      onDone&&onDone(kb);
    } catch(e) { onError&&onError(e.message); }
  }

  async function buildPreview(iframe, opts) {
    const {assetsBase='Assets', onProgress, onError}=opts||{};
    try {
      onProgress&&onProgress(0,'Building preview…');
      const cfg=readConfig();
      const src=await fetch('src/playable-template.js').then(r=>r.text());
      const map=await loadBundled(assetsBase, p=>onProgress&&onProgress(p*.9,`${Math.round(p*100)}%…`));
      const html=buildHTML(cfg, map, getCustomSprites(), src);
      iframe.srcdoc=html;
      onProgress&&onProgress(1,'Ready');
    } catch(e) { onError&&onError(e.message); }
  }

  global.RiseBuilder={buildAndDownload, buildPreview, readConfig, setCustomSprite, getCustomSprites};
})(window);

function $(i){return document.getElementById(i);}
function sv(i,v){const e=$(i);if(e)e.textContent=v;}
let currentOrientation='portrait';
function setOrientation(or){
  currentOrientation=or;
  const hidden=$('cfg-orientation'); if(hidden) hidden.value=or;
  ['orientation-main','orientation-preview','orientation-editor'].forEach(id=>{const w=$(id); if(!w)return; w.querySelectorAll('.orbtn').forEach(b=>b.classList.toggle('on',b.dataset.or===or));});
  $('phone')?.classList.toggle('landscape',or==='landscape');
  $('editor-phone')?.classList.toggle('landscape',or==='landscape');
  const lab=$('phone-label'); if(lab) lab.textContent=(or==='landscape'?'844×390':'390×844')+' · нажми Update Preview после изменений';
  if(window.RiseLevelEditor)RiseLevelEditor.resize();
}
document.addEventListener('click',e=>{const b=e.target.closest('.orbtn[data-or]'); if(b)setOrientation(b.dataset.or);});

// left tabs
document.querySelectorAll('.tab[data-tab]').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.tab[data-tab]').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.pnl').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');$('tab-'+b.dataset.tab).classList.add('on');
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
  };
  r.readAsDataURL(f);
}
function clearSpr(key){
  RiseBuilder.setSprite(key,null);
  document.querySelectorAll(`[id="th-${key}"],[id="th-${key}-visuals"],[id="th-${key}-level"]`).forEach(th=>{th.innerHTML=key==='player'?'🎈':key==='shield'?'🛡️':key.indexOf('background')===0?'🖼️':'⬛';});
}
function getStageCount(){
  const e=$('cfg-stageCount');
  return Math.max(1,Math.min(20,parseInt(e&&e.value,10)||5));
}

function renderStageAssetRows(){
  const n=getStageCount();
  const bgTargets=[$('bg-sprs'),$('bg-sprs-visuals'),$('le-bg-stage-list')].filter(Boolean);
  if(bgTargets.length){
    let h='';
    for(let i=0;i<n;i++){
      const k='background_stage'+i;
      h+=`<div class="sp-row" style="padding:3px 0;"><div class="sp-up">
        <div class="thumb" id="th-${k}" style="width:30px;height:30px;font-size:12px;">🖼️</div>
        <span style="font-size:12px;color:var(--dim);min-width:48px;">Mini ${i+1}</span>
        <label class="ul-btn" style="font-size:11px;">+ Img<input type="file" accept="image/*" style="display:none" onchange="loadSpr('${k}',this)"></label>
        <button class="x-btn" style="padding:3px 5px;" onclick="clearSpr('${k}')">✕</button>
      </div></div>`;
    }
    bgTargets.forEach(el=>el.innerHTML=h);
  }
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
function updateBackgroundModeUI(){
  const mode=($('cfg-bgMode')&&$('cfg-bgMode').value)||'perStage';
  const showCommon=mode==='common';
  const commonIds=['le-bg-common'];
  const perIds=['le-bg-per'];
  commonIds.forEach(id=>{const e=$(id);if(e)e.style.display=showCommon?'flex':'none';});
  perIds.forEach(id=>{const e=$(id);if(e)e.style.display=showCommon?'none':'flex';});
}
$('cfg-bgMode')?.addEventListener('change',()=>{updateBackgroundModeUI(); if(window.RiseLevelEditor)RiseLevelEditor.draw();});
updateBackgroundModeUI();

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
$('btn-prev').addEventListener('click',async()=>{
  const b=$('btn-prev');b.disabled=true;b.textContent='⏳…';
  await RiseBuilder.buildPreview($('pif'),{assetsBase:'Assets',onProgress:setP,onError:showErr});
  hideP();b.disabled=false;b.textContent='▶ Update Preview';
});
$('btn-iact').addEventListener('click',()=>{
  iact=!iact;$('phone').classList.toggle('iact',iact);
  $('btn-iact').textContent=iact?'🔒 Lock':'🖱 Interact';
});

// reset
const DEFS={
  'cfg-lives':3,'cfg-playerSize':1,'cfg-shieldSize':1,
  'cfg-gameSpeed':3.2,'cfg-acceleration':0.4,'cfg-pushForce':7,'cfg-gravityModifier':1,
  'cfg-hpBarShowTime':2000,'cfg-tutorialTime':3500,
  'cfg-playerColor':'#f5e642','cfg-playerOutline':'#ffffff',
  'cfg-shieldColor':'#4fc3f7',
  'cfg-obstacleColor':'#e05252','cfg-obstacleColorAlt':'#5282e0',
  'cfg-bgColor':'#1a1a2e','cfg-groundColor':'#2a2a40','cfg-particleColor':'#f5e642',
  'cfg-stage0':'#e05252','cfg-stage1':'#52a0e0','cfg-stage2':'#52e08a',
  'cfg-stage3':'#e07d52','cfg-stage4':'#c052e0','cfg-stageCount':5,'cfg-orientation':'portrait'
};
$('btn-reset').addEventListener('click',()=>{
  Object.entries(DEFS).forEach(([id,v])=>{const e=$(id);if(e){e.value=v;e.dispatchEvent(new Event('input'));}});
  setOrientation('portrait');
});

setOrientation('portrait');
// placeholder
$('pif').srcdoc=`<!DOCTYPE html><html><head><style>*{margin:0;padding:0}html,body{width:100%;height:100%;background:#0d0d14;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;font-family:system-ui;color:rgba(232,232,240,.4);font-size:13px}</style></head><body><div style="font-size:44px">🎈</div><div style="font-weight:600;color:rgba(232,232,240,.65)">Rise Playable</div><div>Нажми ▶ Update Preview</div></body></html>`;

// ── Level Editor ──────────────────────────────────────────────────────────
const LE=(function(){
  let NS=getStageCount();
  let GW=390,GH=844;
  let zoom=parseFloat($('le-zoom')?.value)||0.55;
  let cur=0,sel=null,mode='add',shape='rect',customShape=null,drag=false,doff={x:0,y:0};
  let customShapeImageSrc=null,customShapeSvgPoints=null;
  const lvls=Array.from({length:NS},()=>[]);
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
    while(lvls.length<n)lvls.push([]);
    if(lvls.length>n)lvls.length=n;
    if(cur>=n)cur=n-1;
    renderStageAssetRows();
    updateBackgroundModeUI();
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

  // shape buttons
  document.querySelectorAll('.et[data-shape]').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');shape=b.dataset.shape;mode='add';$('et-sel').classList.remove('on');
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
        customShapeSvgPoints=parseSvgPoints(svgText);
        customShapeImageSrc='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgText);
        getEditorImage(customShapeImageSrc);
        $('custom-shape-image-preview').innerHTML=`<img src="${customShapeImageSrc}">`;
        const info=$('custom-shape-points-info');if(info)info.textContent='Коллайдер создан из SVG: '+customShapeSvgPoints.length+' точек.';
      }catch(err){customShapeSvgPoints=null;customShapeImageSrc=null;$('custom-shape-image-preview').textContent='SVG';const info=$('custom-shape-points-info');if(info)info.textContent='Не удалось создать коллайдер: '+err.message;alert('Не удалось прочитать SVG: '+err.message);}
    };
    r.readAsText(f);
  });
  $('custom-shape-image-clear').addEventListener('click',()=>{customShapeImageSrc=null;customShapeSvgPoints=null;$('custom-shape-image').value='';$('custom-shape-image-preview').textContent='SVG';const info=$('custom-shape-points-info');if(info)info.textContent='Коллайдер не создан: загрузите SVG.';});
  $('shape-cancel').addEventListener('click',()=>$('shape-modal').classList.remove('on'));
  $('shape-save').addEventListener('click',()=>{
    const name=($('custom-shape-name').value||'custom_svg').trim();const pts=customShapeSvgPoints||[];
    if(!customShapeImageSrc||pts.length<3){alert('Загрузите SVG с координатами polygon/polyline/path/rect/circle.');return;}
    customShape={name,points:pts,imageSrc:customShapeImageSrc};shape='custom';mode='add';
    document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
    $('et-custom').classList.add('on');$('et-sel').classList.remove('on');$('shape-modal').classList.remove('on');
  });
  $('et-sel').addEventListener('click',()=>{mode='select';$('et-sel').classList.add('on');document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));});
  $('et-del').addEventListener('click',()=>{if(sel===null)return;const s=lvls[cur];s.splice(sel,1);sel=null;draw();});
  $('et-clr').addEventListener('click',()=>{if(!confirm('Clear mini-level '+(cur+1)+'?'))return;lvls[cur]=[];sel=null;draw();});
  $('le-generate')?.addEventListener('click',()=>{setStageCount($('le-stage-count').value);});
  $('le-stage-count')?.addEventListener('input',e=>setStageCount(e.target.value));
  $('cfg-stageCount')?.addEventListener('input',e=>{if(String(e.target.value)!==String(NS))setStageCount(e.target.value);});
  $('le-zoom')?.addEventListener('input',e=>{
    const oldZoom=zoom;
    const cx=(wrap.scrollLeft+wrap.clientWidth/2)/Math.max(.0001,oldZoom);
    const cy=(wrap.scrollTop+wrap.clientHeight/2)/Math.max(.0001,oldZoom);
    zoom=parseFloat(e.target.value)||1;
    sv('le-zoom-v',Math.round(zoom*100)+'%');
    resize(false);
    wrap.scrollLeft=Math.max(0,cx*zoom-wrap.clientWidth/2);
    wrap.scrollTop=Math.max(0,cy*zoom-wrap.clientHeight/2);
  });

  ['ow','oh','oc','om'].forEach(id=>{$(id).addEventListener('input',()=>{if(sel===null||!lvls[cur]||!lvls[cur][sel])return;const o=lvls[cur][sel];o.w=parseInt($('ow').value)||60;o.h=parseInt($('oh').value)||60;o.color=$('oc').value;o.moveX=parseInt($('om').value)||0;draw();});});

  function resize(keepScroll=false){
    const oldTop=wrap.scrollTop,oldLeft=wrap.scrollLeft;
    GW=currentOrientation==='landscape'?844:390;
    GH=currentOrientation==='landscape'?390:844;
    cv.width=Math.max(1,Math.round(GW*zoom));
    cv.height=Math.max(1,Math.round(GH*NS*zoom));
    cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';
    draw();
    if(!keepScroll){wrap.scrollTop=Math.max(0,cur*GH*zoom-40);wrap.scrollLeft=Math.max(0,(cv.width-wrap.clientWidth)/2);}else{wrap.scrollTop=oldTop;wrap.scrollLeft=oldLeft;}
  }
  function toG(cx,cy){return{x:cx/zoom-GW/2,globalY:cy/zoom};}
  function stageFromGlobalY(globalY){return Math.max(0,Math.min(NS-1,Math.floor(globalY/GH)));}
  function toC(stageIndex,x,localY){return{x:(GW/2+x)*zoom,y:(stageIndex*GH+GH/2+localY)*zoom};}
  function obsAt(stageIndex,gx,gyLocal){
    const obs=lvls[stageIndex]||[];
    for(let i=obs.length-1;i>=0;i--){const o=obs[i];if(Math.abs(gx-o.x)<=o.w/2+8&&Math.abs(gyLocal-o.y)<=o.h/2+8)return i;}
    return -1;
  }
  function updateCurrentFromScroll(){cur=Math.max(0,Math.min(NS-1,Math.floor((wrap.scrollTop/zoom+GH*.45)/GH)));}
  wrap.addEventListener('scroll',()=>{const old=cur;updateCurrentFromScroll();if(old!==cur){sel=null;draw();}});

  cv.addEventListener('pointerdown',e=>{
    const rc=cv.getBoundingClientRect();const g=toG(e.clientX-rc.left,e.clientY-rc.top);
    const si=stageFromGlobalY(g.globalY),localY=g.globalY-si*GH-GH/2;cur=si;
    if(mode==='select'){
      const idx=obsAt(si,g.x,localY);sel=idx>=0?idx:null;
      if(idx>=0){drag=true;doff={x:g.x-lvls[si][idx].x,y:localY-lvls[si][idx].y};const o=lvls[si][idx];$('ow').value=o.w;$('oh').value=o.h;$('oc').value=o.color||'#e05252';$('om').value=o.moveX||0;}
      draw();return;
    }
    const o={x:Math.round(g.x),y:Math.round(localY),coordMode:'center',w:parseInt($('ow').value)||60,h:parseInt($('oh').value)||60,shape:shape==='custom'?'custom':shape,color:$('oc').value,moveX:parseInt($('om').value)||0,moveSpeed:1800};
    if(shape==='custom'&&customShape){o.customName=customShape.name;o.points=customShape.points.map(p=>({x:p.x,y:p.y}));if(customShape.imageSrc)o.imageSrc=customShape.imageSrc;}
    lvls[si].push(o);sel=lvls[si].length-1;draw();
  });
  cv.addEventListener('pointermove',e=>{
    if(!drag||sel===null)return;
    const rc=cv.getBoundingClientRect();const g=toG(e.clientX-rc.left,e.clientY-rc.top);
    const si=stageFromGlobalY(g.globalY),localY=g.globalY-si*GH-GH/2;
    if(si!==cur)return;
    lvls[cur][sel].x=Math.round(g.x-doff.x);lvls[cur][sel].y=Math.round(localY-doff.y);draw();
  });
  cv.addEventListener('pointerup',()=>drag=false);cv.addEventListener('pointercancel',()=>drag=false);

  function sprMap(){return (window.RiseBuilder&&RiseBuilder.getSprites&&RiseBuilder.getSprites())||{};}
  function drawCoverImage(im,x,y,w,h){
    if(!imageReady(im))return false;
    const sc=Math.max(w/im.naturalWidth,h/im.naturalHeight);
    const dw=im.naturalWidth*sc,dh=im.naturalHeight*sc;
    ctx.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
    return true;
  }
  function drawCoverImageFade(im,x,y,w,h,fade){
    if(!imageReady(im))return false;
    const off=document.createElement('canvas');
    off.width=Math.max(1,Math.round(w));off.height=Math.max(1,Math.round(h));
    const oc=off.getContext('2d');
    const sc=Math.max(w/im.naturalWidth,h/im.naturalHeight);
    const dw=im.naturalWidth*sc,dh=im.naturalHeight*sc;
    oc.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
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
  function drawBackgroundForStage(si,top,w,h,totalH){
    const mode=($('cfg-bgMode')&&$('cfg-bgMode').value)||'perStage';
    const sm=sprMap();
    if(mode==='common'){
      const src=sm.background;
      const im=getEditorImage(src);
      if(src&&imageReady(im)){
        const sc=Math.max(w/im.naturalWidth,totalH/im.naturalHeight);
        const dw=im.naturalWidth*sc,dh=im.naturalHeight*sc;
        ctx.drawImage(im,(w-dw)/2,(totalH-dh)/2,dw,dh);
        return true;
      }
      return false;
    }
    const src=sm['background_stage'+si];
    const im=getEditorImage(src);
    const fade=Math.max(24,Math.min(110*zoom,h*.22));
    return src?drawCoverImageFade(im,0,top-fade,w,h+fade*2,fade):false;
  }
  function hr(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?parseInt(r[1],16)+','+parseInt(r[2],16)+','+parseInt(r[3],16):'200,200,200';}
  function drawObstacle(o,si,i){
    const c=toC(si,o.x,o.y),sw=o.w*zoom,sh=o.h*zoom;
    ctx.save();ctx.fillStyle=o.color||'#e05252';ctx.strokeStyle=(si===cur&&i===sel)?'#fff':'rgba(255,255,255,.24)';ctx.lineWidth=(si===cur&&i===sel)?2.5:1.5;
    if(o.shape==='circle'){ctx.beginPath();ctx.arc(c.x,c.y,sw/2,0,Math.PI*2);ctx.fill();ctx.stroke();}
    else if(o.shape==='triangle'){ctx.beginPath();ctx.moveTo(c.x,c.y-sh/2);ctx.lineTo(c.x+sw/2,c.y+sh/2);ctx.lineTo(c.x-sw/2,c.y+sh/2);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(o.shape==='custom'&&o.points&&o.points.length>=3){const im=getEditorImage(o.imageSrc);if(imageReady(im))ctx.drawImage(im,c.x-sw/2,c.y-sh/2,sw,sh);else ctx.fillRect(c.x-sw/2,c.y-sh/2,sw,sh);ctx.beginPath();o.points.forEach((p,pi)=>{const px=c.x+p.x*sw,py=c.y+p.y*sh;if(pi===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.stroke();}
    else{ctx.beginPath();ctx.rect(c.x-sw/2,c.y-sh/2,sw,sh);ctx.fill();ctx.stroke();}
    if(o.moveX>0){const mx=o.moveX*zoom;ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(c.x-mx,c.y);ctx.lineTo(c.x+mx,c.y);ctx.stroke();ctx.setLineDash([]);}ctx.restore();
  }
  function draw(){
    if(!cv.width||!cv.height)return;
    ctx.clearRect(0,0,cv.width,cv.height);ctx.fillStyle='#080810';ctx.fillRect(0,0,cv.width,cv.height);
    const palette=['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'];
    for(let si=0;si<NS;si++){
      const top=si*GH*zoom,h=GH*zoom,w=GW*zoom,midX=w/2,midY=top+h/2;
      const sc=palette[si%palette.length];
      ctx.fillStyle='rgba('+hr(sc)+',.08)';ctx.fillRect(0,top,w,h);
      drawBackgroundForStage(si,top,w,h,cv.height);
      ctx.strokeStyle=si===cur?'rgba(255,255,255,.55)':'rgba(255,255,255,.22)';ctx.lineWidth=si===cur?2:1;ctx.strokeRect(.5,top+.5,w-1,h-1);
      ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;
      for(let x=0;x<=GW;x+=65){ctx.beginPath();ctx.moveTo(x*zoom,top);ctx.lineTo(x*zoom,top+h);ctx.stroke();}
      for(let y=0;y<=GH;y+=65){ctx.beginPath();ctx.moveTo(0,top+y*zoom);ctx.lineTo(w,top+y*zoom);ctx.stroke();}
      ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(midX,top);ctx.lineTo(midX,top+h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,midY);ctx.lineTo(w,midY);ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.font=Math.max(10,12*zoom)+'px monospace';ctx.textAlign='left';ctx.fillText('Mini-level '+(si+1)+'   0;0',8,top+18);
      (lvls[si]||[]).forEach((o,i)=>drawObstacle(o,si,i));
    }
    const total=lvls.reduce((a,s)=>a+s.length,0);ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='11px monospace';ctx.textAlign='left';ctx.fillText(NS+' mini-levels · '+total+' obstacles · '+Math.round(zoom*100)+'% zoom',8,cv.height-8);
  }
  function getLevelData(){return lvls.map(s=>s.map(o=>({...o,coordMode:'center'})));}

  setStageCount(NS);sv('le-zoom-v',Math.round(zoom*100)+'%');
  window.addEventListener('resize',()=>{if($('rp-levels').classList.contains('on'))resize(true);});
  return{resize,getLevelData,draw,setStageCount};
})();

window.RiseLevelEditor=LE;

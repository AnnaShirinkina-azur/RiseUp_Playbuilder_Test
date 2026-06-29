
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
    const th=$('th-'+key);
    if(th)th.innerHTML=`<img src="${e.target.result}">`;
  };
  r.readAsDataURL(f);
}
function clearSpr(key){
  RiseBuilder.setSprite(key,null);
  ['th-'+key,'th-'+key+'-visuals'].forEach(id=>{const th=$(id);if(th)th.innerHTML=key==='player'?'🎈':key==='shield'?'🛡️':key.indexOf('background')===0?'🖼️':'⬛';});
}
// per-stage backgrounds
(function(){
  const w=$('bg-sprs');let h='';
  for(let i=0;i<5;i++){
    const k='background_stage'+i;
    h+=`<div class="sp-row" style="padding:3px 0;"><div class="sp-up">
      <div class="thumb" id="th-${k}" style="width:30px;height:30px;font-size:12px;">🖼️</div>
      <span style="font-size:12px;color:var(--dim);min-width:48px;">Stage ${i+1}</span>
      <label class="ul-btn" style="font-size:11px;">+ Img<input type="file" accept="image/*" style="display:none" onchange="loadSpr('${k}',this)"></label>
      <button class="x-btn" style="padding:3px 5px;" onclick="clearSpr('${k}')">✕</button>
    </div></div>`;
  }
  w.innerHTML=h;
})();

// per-stage sprites
(function(){
  const w=$('stg-sprs');let h='';
  for(let i=0;i<5;i++){
    const k='obstacle_stage'+i;
    h+=`<div class="sp-row" style="padding:3px 0;"><div class="sp-up">
      <div class="thumb" id="th-${k}" style="width:30px;height:30px;font-size:12px;">⬛</div>
      <span style="font-size:12px;color:var(--dim);min-width:48px;">Stage ${i+1}</span>
      <label class="ul-btn" style="font-size:11px;">+ PNG<input type="file" accept="image/*" style="display:none" onchange="loadSpr('${k}',this)"></label>
      <button class="x-btn" style="padding:3px 5px;" onclick="clearSpr('${k}')">✕</button>
    </div></div>`;
  }
  w.innerHTML=h;
})();

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
  'cfg-stage3':'#e07d52','cfg-stage4':'#c052e0','cfg-orientation':'portrait'
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
  const NS=5; let GW=390,GH=844;
  let cur=0;
  const lvls=Array.from({length:NS},()=>[]);
  let sel=null,mode='add',shape='rect',customShape=null,drag=false,doff={x:0,y:0};
  let customShapeImageSrc=null;
  let customShapeSvgPoints=null;
  const customShapes=[];
  const imageCache=new Map();
  const cv=$('ec'),ctx=cv.getContext('2d');
  function getEditorImage(src){
    if(!src)return null;
    if(imageCache.has(src))return imageCache.get(src);
    const img=new Image();
    img.onload=()=>draw();
    img.src=src;
    imageCache.set(src,img);
    return img;
  }
  function imageReady(img){return img&&img.complete&&img.naturalWidth>0;}

  function decodeSvgDataUrl(src){
    if(!src)return '';
    const comma=src.indexOf(',');
    if(src.startsWith('data:image/svg+xml')&&comma>=0){
      const meta=src.slice(0,comma),body=src.slice(comma+1);
      try{return meta.includes(';base64')?atob(body):decodeURIComponent(body);}catch(e){try{return decodeURIComponent(body);}catch(_){return body;}}
    }
    return src;
  }
  function nums(str){return (str||'').match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number)||[];}
  function parseSvgPoints(svgText){
    const txt=decodeSvgDataUrl(svgText);
    const doc=new DOMParser().parseFromString(txt,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw new Error('SVG parse error');
    let pts=[];
    const add=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y))pts.push({x,y});};
    doc.querySelectorAll('polygon,polyline').forEach(el=>{
      const a=nums(el.getAttribute('points'));
      for(let i=0;i<a.length-1;i+=2)add(a[i],a[i+1]);
    });
    doc.querySelectorAll('path').forEach(el=>{
      const d=el.getAttribute('d')||'';
      const tokens=d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[];
      let i=0,cmd='',x=0,y=0,sx0=0,sy0=0;
      const isCmd=t=>/^[a-zA-Z]$/.test(t);
      while(i<tokens.length){
        if(isCmd(tokens[i]))cmd=tokens[i++];
        const rel=cmd===cmd.toLowerCase();
        const C=cmd.toUpperCase();
        if(C==='M'||C==='L'||C==='T'){
          while(i+1<tokens.length&&!isCmd(tokens[i])){let nx=parseFloat(tokens[i++]),ny=parseFloat(tokens[i++]);if(rel){nx+=x;ny+=y;}x=nx;y=ny;add(x,y);if(C==='M'){sx0=x;sy0=y;cmd=rel?'l':'L';}}
        }else if(C==='H'){
          while(i<tokens.length&&!isCmd(tokens[i])){let nx=parseFloat(tokens[i++]);if(rel)nx+=x;x=nx;add(x,y);}
        }else if(C==='V'){
          while(i<tokens.length&&!isCmd(tokens[i])){let ny=parseFloat(tokens[i++]);if(rel)ny+=y;y=ny;add(x,y);}
        }else if(C==='C'){
          while(i+5<tokens.length&&!isCmd(tokens[i])){let x1=parseFloat(tokens[i++]),y1=parseFloat(tokens[i++]),x2=parseFloat(tokens[i++]),y2=parseFloat(tokens[i++]),x3=parseFloat(tokens[i++]),y3=parseFloat(tokens[i++]);if(rel){x1+=x;y1+=y;x2+=x;y2+=y;x3+=x;y3+=y;}for(let t=.25;t<=1;t+=.25){const mt=1-t;add(mt*mt*mt*x+3*mt*mt*t*x1+3*mt*t*t*x2+t*t*t*x3,mt*mt*mt*y+3*mt*mt*t*y1+3*mt*t*t*y2+t*t*t*y3);}x=x3;y=y3;}
        }else if(C==='Q'){
          while(i+3<tokens.length&&!isCmd(tokens[i])){let x1=parseFloat(tokens[i++]),y1=parseFloat(tokens[i++]),x2=parseFloat(tokens[i++]),y2=parseFloat(tokens[i++]);if(rel){x1+=x;y1+=y;x2+=x;y2+=y;}for(let t=.25;t<=1;t+=.25){const mt=1-t;add(mt*mt*x+2*mt*t*x1+t*t*x2,mt*mt*y+2*mt*t*y1+t*t*y2);}x=x2;y=y2;}
        }else if(C==='Z'){add(sx0,sy0);}else{i++;}
      }
    });
    doc.querySelectorAll('rect').forEach(el=>{const x=+el.getAttribute('x')||0,y=+el.getAttribute('y')||0,w=+el.getAttribute('width')||0,h=+el.getAttribute('height')||0;if(w&&h){add(x,y);add(x+w,y);add(x+w,y+h);add(x,y+h);}});
    doc.querySelectorAll('circle,ellipse').forEach(el=>{const cx=+el.getAttribute('cx')||0,cy=+el.getAttribute('cy')||0,rx=+(el.getAttribute('r')||el.getAttribute('rx')||0),ry=+(el.getAttribute('r')||el.getAttribute('ry')||rx);if(rx&&ry){for(let k=0;k<24;k++){const a=Math.PI*2*k/24;add(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry);}}});
    if(pts.length<3)throw new Error('Не нашла координаты polygon/path/rect/circle в SVG');
    // remove near duplicate consecutive points
    pts=pts.filter((p,i,a)=>i===0||Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)>0.001);
    const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));
    const w=maxX-minX||1,h=maxY-minY||1,cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    return pts.map(p=>({x:(p.x-cx)/w,y:(p.y-cy)/h}));
  }


  // stage tabs
  const stabsEl=$('stabs');
  for(let i=0;i<NS;i++){
    const b=document.createElement('button');
    b.className='stab'+(i===0?' on':'');
    b.textContent='Stage '+(i+1);
    b.addEventListener('click',()=>{
      document.querySelectorAll('.stab').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');cur=i;sel=null;draw();
    });
    stabsEl.appendChild(b);
  }

  // shape buttons
  document.querySelectorAll('.et[data-shape]').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');shape=b.dataset.shape;mode='add';
      $('et-sel').classList.remove('on');
    });
  });
  $('et-custom').addEventListener('click',()=>{ $('shape-modal').classList.add('on'); });
  $('et-shape-editor').addEventListener('click',()=>{ $('shape-modal').classList.add('on'); });
  $('custom-shape-image').addEventListener('change',e=>{
    const f=e.target.files&&e.target.files[0];
    if(!f)return;
    const isSvg=f.type==='image/svg+xml'||/\.svg$/i.test(f.name);
    if(!isSvg){alert('Можно загрузить только SVG. PNG отключен, потому что коллайдер строится из SVG-координат.');e.target.value='';return;}
    const textReader=new FileReader();
    textReader.onload=ev=>{
      try{
        const svgText=String(ev.target.result||'');
        customShapeSvgPoints=parseSvgPoints(svgText);
        customShapeImageSrc='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgText);
        getEditorImage(customShapeImageSrc);
        $('custom-shape-image-preview').innerHTML=`<img src="${customShapeImageSrc}">`;
        $('custom-shape-points').value=customShapeSvgPoints.map(p=>p.x.toFixed(4)+','+p.y.toFixed(4)).join('\n');
        const info=$('custom-shape-points-info'); if(info)info.textContent='Коллайдер создан из SVG: '+customShapeSvgPoints.length+' точек.';
      }catch(err){
        customShapeSvgPoints=null;customShapeImageSrc=null;
        $('custom-shape-image-preview').textContent='SVG';
        const info=$('custom-shape-points-info'); if(info)info.textContent='Не удалось создать коллайдер: '+err.message;
        alert('Не удалось прочитать SVG: '+err.message);
      }
    };
    textReader.readAsText(f);
  });
  $('custom-shape-image-clear').addEventListener('click',()=>{
    customShapeImageSrc=null;customShapeSvgPoints=null;
    $('custom-shape-image').value='';
    $('custom-shape-image-preview').textContent='SVG';
    $('custom-shape-points').value='';
    const info=$('custom-shape-points-info'); if(info)info.textContent='Коллайдер не создан: загрузите SVG.';
  });
  $('shape-cancel').addEventListener('click',()=>$('shape-modal').classList.remove('on'));
  $('shape-save').addEventListener('click',()=>{
    const name=($('custom-shape-name').value||'custom_svg').trim();
    const pts=customShapeSvgPoints||[];
    if(!customShapeImageSrc||pts.length<3){alert('Загрузите SVG с координатами polygon/polyline/path/rect/circle.');return;}
    customShape={name,points:pts,imageSrc:customShapeImageSrc};customShapes.push(customShape);shape='custom';mode='add';
    document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
    $('et-custom').classList.add('on');$('et-sel').classList.remove('on');$('shape-modal').classList.remove('on');
  });
  $('et-sel').addEventListener('click',()=>{
    mode='select';$('et-sel').classList.add('on');
    document.querySelectorAll('.et[data-shape]').forEach(x=>x.classList.remove('on'));
  });
  $('et-del').addEventListener('click',()=>{if(sel===null)return;lvls[cur].splice(sel,1);sel=null;draw();});
  $('et-clr').addEventListener('click',()=>{if(!confirm('Clear stage '+(cur+1)+'?'))return;lvls[cur]=[];sel=null;draw();});

  // prop live update
  ['ow','oh','oc','om'].forEach(id=>{
    $(id).addEventListener('input',()=>{
      if(sel===null||!lvls[cur][sel])return;
      const o=lvls[cur][sel];
      o.w=parseInt($('ow').value)||60;o.h=parseInt($('oh').value)||60;
      o.color=$('oc').value;o.moveX=parseInt($('om').value)||0;
      draw();
    });
  });

  function resize(){
    GW=currentOrientation==='landscape'?844:390;
    GH=currentOrientation==='landscape'?390:844;
    const w=$('ec-wrap');
    cv.width=w.clientWidth;
    cv.height=w.clientHeight;
    draw();
  }
  function sx(){return cv.width/GW;}
  function sy(){return cv.height/GH;}
  function toG(cx,cy){return{x:(cx-cv.width/2)/sx(),y:(cy-cv.height/2)/sy()};}
  function toC(gx,gy){return{x:cv.width/2+gx*sx(),y:cv.height/2+gy*sy()};}
  function obsAt(gx,gy){
    const obs=lvls[cur];
    for(let i=obs.length-1;i>=0;i--){const o=obs[i];if(Math.abs(gx-o.x)<=o.w/2+8&&Math.abs(gy-o.y)<=o.h/2+8)return i;}
    return -1;
  }

  cv.addEventListener('pointerdown',e=>{
    const rc=cv.getBoundingClientRect();
    const g=toG(e.clientX-rc.left,e.clientY-rc.top);
    if(mode==='select'){
      const idx=obsAt(g.x,g.y);sel=idx>=0?idx:null;
      if(idx>=0){drag=true;doff={x:g.x-lvls[cur][idx].x,y:g.y-lvls[cur][idx].y};const o=lvls[cur][idx];$('ow').value=o.w;$('oh').value=o.h;$('oc').value=o.color||'#e05252';$('om').value=o.moveX||0;}
      draw();return;
    }
    const o={x:Math.round(g.x),y:Math.round(g.y),coordMode:'center',w:parseInt($('ow').value)||60,h:parseInt($('oh').value)||60,shape:shape==='custom'?'custom':shape,color:$('oc').value,moveX:parseInt($('om').value)||0,moveSpeed:1800}; if(shape==='custom'&&customShape){o.customName=customShape.name;o.points=customShape.points.map(p=>({x:p.x,y:p.y}));if(customShape.imageSrc)o.imageSrc=customShape.imageSrc;}
    lvls[cur].push(o);sel=lvls[cur].length-1;draw();
  });
  cv.addEventListener('pointermove',e=>{
    if(!drag||sel===null)return;
    const rc=cv.getBoundingClientRect();const g=toG(e.clientX-rc.left,e.clientY-rc.top);
    lvls[cur][sel].x=Math.round(g.x-doff.x);lvls[cur][sel].y=Math.round(g.y-doff.y);draw();
  });
  cv.addEventListener('pointerup',()=>drag=false);

  function hr(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?parseInt(r[1],16)+','+parseInt(r[2],16)+','+parseInt(r[3],16):'200,200,200';}

  function draw(){
    if(!cv.width||!cv.height)return;
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.fillStyle='#0d0d14';ctx.fillRect(0,0,cv.width,cv.height);
    ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;
    for(let x=0;x<cv.width;x+=cv.width/6){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cv.height);ctx.stroke();}
    for(let y=0;y<cv.height;y+=cv.height/8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cv.width,y);ctx.stroke();}
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cv.width/2,0);ctx.lineTo(cv.width/2,cv.height);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,cv.height/2);ctx.lineTo(cv.width,cv.height/2);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText('0;0',cv.width/2+5,cv.height/2-5);
    const sc=['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'][cur];
    ctx.fillStyle='rgba('+hr(sc)+',.05)';ctx.fillRect(0,0,cv.width,cv.height);
    lvls[cur].forEach((o,i)=>{
      const c=toC(o.x,o.y);const sw=o.w*sx(),sh=o.h*sy();
      ctx.save();ctx.fillStyle=o.color||'#e05252';
      ctx.strokeStyle=i===sel?'#fff':'rgba(255,255,255,.2)';ctx.lineWidth=i===sel?2.5:1.5;
      if(o.shape==='circle'){ctx.beginPath();ctx.arc(c.x,c.y,sw/2,0,Math.PI*2);ctx.fill();ctx.stroke();}
      else if(o.shape==='triangle'){ctx.beginPath();ctx.moveTo(c.x,c.y-sh/2);ctx.lineTo(c.x+sw/2,c.y+sh/2);ctx.lineTo(c.x-sw/2,c.y+sh/2);ctx.closePath();ctx.fill();ctx.stroke();}
      else if(o.shape==='custom'&&o.points&&o.points.length>=3){
        const im=getEditorImage(o.imageSrc);
        if(imageReady(im))ctx.drawImage(im,c.x-sw/2,c.y-sh/2,sw,sh);
        else ctx.fill();
        ctx.beginPath();o.points.forEach((p,pi)=>{const px=c.x+p.x*sw,py=c.y+p.y*sh;if(pi===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();
        if(!imageReady(im))ctx.fill();
        ctx.stroke();
      }
      else{ctx.beginPath();ctx.rect(c.x-sw/2,c.y-sh/2,sw,sh);ctx.fill();ctx.stroke();}
      if(o.moveX>0){const mx=o.moveX*sx();ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(c.x-mx,c.y);ctx.lineTo(c.x+mx,c.y);ctx.stroke();ctx.setLineDash([]);}
      ctx.restore();
    });
    ctx.fillStyle='rgba(255,255,255,.18)';ctx.font='11px monospace';ctx.textAlign='left';
    ctx.fillText('Stage '+(cur+1)+' · '+lvls[cur].length+' obs · center origin',8,16);
    if(lvls[cur].length===0){ctx.fillStyle='rgba(255,255,255,.15)';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('Click to place obstacles',cv.width/2,cv.height/2);}
    if(mode==='select'&&sel!==null&&lvls[cur][sel]){
      const o=lvls[cur][sel];ctx.fillStyle='rgba(255,255,255,.08)';ctx.font='11px monospace';ctx.textAlign='right';
      ctx.fillText(`x:${o.x} y:${o.y} w:${o.w} h:${o.h}`,cv.width-8,cv.height-8);
    }
  }

  // Public — getLevelData вызывается в момент сборки
  function getLevelData(){
    const hasAny=lvls.some(s=>s.length>0);
    if(!hasAny)return null;
    return lvls.map(s=>s.map(o=>({...o,coordMode:'center'}))); 
  }

  window.addEventListener('resize',()=>{if($('rp-levels').classList.contains('on'))resize();});
  return{resize,getLevelData,draw};
})();

window.RiseLevelEditor=LE;

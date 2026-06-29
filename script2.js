
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
  const customShapes=[];
  const cv=$('ec'),ctx=cv.getContext('2d');

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
  $('shape-cancel').addEventListener('click',()=>$('shape-modal').classList.remove('on'));
  $('shape-save').addEventListener('click',()=>{
    const name=($('custom-shape-name').value||'custom_poly').trim();
    const pts=($('custom-shape-points').value||'').split(/\n+/).map(l=>l.trim()).filter(Boolean).map(l=>{const a=l.split(/[ ,;]+/).map(Number);return{x:a[0],y:a[1]};}).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(pts.length<3){alert('Need at least 3 points');return;}
    customShape={name,points:pts};customShapes.push(customShape);shape='custom';mode='add';
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
    GW=currentOrientation==='landscape'?844:390;GH=currentOrientation==='landscape'?390:844;const w=$('ec-wrap');cv.width=w.clientWidth;cv.height=w.clientHeight;draw();
  }
  function toG(cx,cy){return{x:cx*(GW/cv.width),y:cy*(GH/cv.height)};}
  function toC(gx,gy){return{x:gx*(cv.width/GW),y:gy*(cv.height/GH)};}
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
    const o={x:Math.round(g.x),y:Math.round(g.y),w:parseInt($('ow').value)||60,h:parseInt($('oh').value)||60,shape:shape==='custom'?'custom':shape,color:$('oc').value,moveX:parseInt($('om').value)||0,moveSpeed:1800}; if(shape==='custom'&&customShape){o.customName=customShape.name;o.points=customShape.points.map(p=>({x:p.x,y:p.y}));}
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
    const sc=['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'][cur];
    ctx.fillStyle='rgba('+hr(sc)+',.05)';ctx.fillRect(0,0,cv.width,cv.height);
    lvls[cur].forEach((o,i)=>{
      const c=toC(o.x,o.y);const sw=o.w*(cv.width/GW),sh=o.h*(cv.height/GH);
      ctx.save();ctx.fillStyle=o.color||'#e05252';
      ctx.strokeStyle=i===sel?'#fff':'rgba(255,255,255,.2)';ctx.lineWidth=i===sel?2.5:1.5;
      if(o.shape==='circle'){ctx.beginPath();ctx.arc(c.x,c.y,sw/2,0,Math.PI*2);ctx.fill();ctx.stroke();}
      else if(o.shape==='triangle'){ctx.beginPath();ctx.moveTo(c.x,c.y-sh/2);ctx.lineTo(c.x+sw/2,c.y+sh/2);ctx.lineTo(c.x-sw/2,c.y+sh/2);ctx.closePath();ctx.fill();ctx.stroke();}
      else if(o.shape==='custom'&&o.points&&o.points.length>=3){ctx.beginPath();o.points.forEach((p,pi)=>{const px=c.x+p.x*sw,py=c.y+p.y*sh;if(pi===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.fill();ctx.stroke();}
      else{ctx.beginPath();ctx.rect(c.x-sw/2,c.y-sh/2,sw,sh);ctx.fill();ctx.stroke();}
      if(o.moveX>0){const mx=o.moveX*(cv.width/GW);ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(c.x-mx,c.y);ctx.lineTo(c.x+mx,c.y);ctx.stroke();ctx.setLineDash([]);}
      ctx.restore();
    });
    ctx.fillStyle='rgba(255,255,255,.18)';ctx.font='11px monospace';ctx.textAlign='left';
    ctx.fillText('Stage '+(cur+1)+' · '+lvls[cur].length+' obs',8,16);
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
    return lvls.map(s=>s.map(o=>({...o})));
  }

  window.addEventListener('resize',()=>{if($('rp-levels').classList.contains('on'))resize();});
  return{resize,getLevelData,draw};
})();

window.RiseLevelEditor=LE;

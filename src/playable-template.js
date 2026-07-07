(function(W){'use strict';
let CW=390,CH=844;
function viewAspect(){
  try{
    const w=Math.max(1,window.innerWidth||0),h=Math.max(1,window.innerHeight||0);
    return w/h;
  }catch(e){return 1;}
}
function setView(orientation){
  CH=844;
  if(orientation==='landscape'){
    // Same vertical game height as portrait; landscape only reveals/uses extra width.
    // This matches the playable behaviour: no zoom-out / no vertical squashing.
    CW=Math.max(390,Math.round(CH*viewAspect()));
  }else{
    CW=390;
  }
}
function lerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
function clamp(v,l,h){return Math.max(l,Math.min(h,v));}
// Default per-mini-level background gradients (bottom,top), cycled by stage
// index while no bg_stage{i} image is uploaded. Index 0 = Start scene.
const BG_GRADS=[['#39a2d8','#69c5ec'],['#ef5350','#f97f6f'],['#b03c02','#cc4a05'],['#f0a44c','#f9c178'],['#ee4630','#fa6a4b']];
function hr(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?[parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)]:[180,180,180];}
function rgba(h,a){const[r,g,b]=hr(h);return`rgba(${r},${g},${b},${a})`;}
function imgOk(s){return s&&s.complete&&s.naturalWidth>0;}
function makeImg(src){if(!src)return null;const im=new Image();im.src=src;return im;}
const _tintCache=new Map();
function tintedSprite(img,color){
  // Full-strength tint: multiply keeps the sprite's shading/highlights while a
  // white sprite becomes exactly the picked color. destination-in restores the
  // original alpha so nothing leaks outside the sprite. Cached per img+color.
  const key=(img.src||'')+'|'+color;
  const hit=_tintCache.get(key);
  if(hit)return hit;
  const w=Math.max(1,img.naturalWidth||1),h=Math.max(1,img.naturalHeight||1);
  const oc=document.createElement('canvas');oc.width=w;oc.height=h;
  const ox=oc.getContext('2d');
  ox.drawImage(img,0,0,w,h);
  ox.globalCompositeOperation='multiply';
  ox.fillStyle=color;
  ox.fillRect(0,0,w,h);
  ox.globalCompositeOperation='destination-in';
  ox.drawImage(img,0,0,w,h);
  if(_tintCache.size>64)_tintCache.clear();
  _tintCache.set(key,oc);
  return oc;
}
function drawTintedImage(ctx,img,x,y,w,h,color){
  if(!color||String(color).toLowerCase()==='#ffffff'){ctx.drawImage(img,x,y,w,h);return;}
  ctx.drawImage(tintedSprite(img,color),x,y,w,h);
}
function pointInPoly(px,py,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;if(((yi>py)!=(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi+1e-9)+xi))inside=!inside;}return inside;}
function distToSegSq(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;let t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1);t=clamp(t,0,1);const x=ax+t*dx,y=ay+t*dy;return(px-x)**2+(py-y)**2;}
function circlePolyHit(cx,cy,cr,pts){if(pointInPoly(cx,cy,pts))return true;const r2=cr*cr;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if(distToSegSq(cx,cy,a.x,a.y,b.x,b.y)<=r2)return true;}return false;}
function layoutX(o){return o&&o.coordMode==='center'?CW/2+(o.x||0):(o&&o.x!=null?o.x:195);}
function layoutY(o){return o&&o.coordMode==='center'?CH/2+(o.y||0):(o&&o.y!=null?o.y:200);}
function obstacleAnchorBaseLocal(anchor){var a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1);return {x:ah==='l'?-CW/2:(ah==='r'?CW/2:0),y:av==='t'?-CH/2:(av==='b'?CH/2:0)};}
function obstacleCenterLocal(o){
  if(o&&o.anchorOffsetX!=null&&o.anchorOffsetY!=null){
    var a=o.anchor||'cc',av=a.charAt(0),ah=a.charAt(1),w=parseFloat(o.w)||60,h=parseFloat(o.h)||60;
    var b=obstacleAnchorBaseLocal(a),ax=b.x+(parseFloat(o.anchorOffsetX)||0)*CW/100,ay=b.y+(parseFloat(o.anchorOffsetY)||0)*CH/100;
    return {x:ah==='l'?ax+w/2:(ah==='r'?ax-w/2:ax),y:av==='t'?ay+h/2:(av==='b'?ay-h/2:ay)};
  }
  return {x:(o&&o.x)||0,y:(o&&o.y)||0};
}
function obstacleLayoutX(o){var l=obstacleCenterLocal(o);return o&&o.coordMode==='center'?CW/2+l.x:(o&&o.x!=null?o.x:195);}
function obstacleLayoutY(o){var l=obstacleCenterLocal(o);return o&&o.coordMode==='center'?CH/2+l.y:(o&&o.y!=null?o.y:200);}
function playerStartPoint(cfg){const p=cfg&&cfg.playerStart;return p?{x:layoutX(p),y:layoutY(p)}:{x:CW/2,y:CH*.70};}
function anchorBaseLocal(anchor){
  var a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1);
  return {x:ah==='l'?-CW/2:(ah==='r'?CW/2:0),y:av==='t'?-CH/2:(av==='b'?CH/2:0)};
}
function textLocal(L){
  if(L&&L.anchorOffsetX!=null&&L.anchorOffsetY!=null){var b=anchorBaseLocal(L.anchor);return{x:b.x+(parseFloat(L.anchorOffsetX)||0)*CW/100,y:b.y+(parseFloat(L.anchorOffsetY)||0)*CH/100};}
  return {x:(L&&L.x)||0,y:(L&&L.y)||0};
}
function progressAnchorBaseLocal(anchor){
  var a=anchor||'cl',av=a.charAt(0),ah=a.charAt(1);
  return {x:ah==='l'?-CW/2:(ah==='r'?CW/2:0),y:av==='t'?-CH/2:(av==='b'?CH/2:0)};
}
function progressLocal(L){
  // Anchor point of the UI object. The object's own anchor corner/edge is
  // attached to this point; the visual center is derived from the responsive
  // draw size. This keeps editor UI elements glued to their selected anchors
  // when the runtime canvas is squeezed.
  if(L&&L.anchorOffsetX!=null&&L.anchorOffsetY!=null){var b=progressAnchorBaseLocal(L.anchor);return{x:b.x+(parseFloat(L.anchorOffsetX)||0)*CW/100,y:b.y+(parseFloat(L.anchorOffsetY)||0)*CH/100};}
  return {x:(L&&L.x)||0,y:(L&&L.y)||0};
}
function ctaLocal(L){return progressLocal(L);}
function healthLocal(L){return progressLocal(L);}
function anchorBoxLocal(anchor,ax,ay,w,h){var a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1);return{x:ah==='l'?ax:(ah==='r'?ax-w:ax-w/2),y:av==='t'?ay:(av==='b'?ay-h:ay-h/2),w:w,h:h};}
function uiBaseScale(L){
  var dw=parseFloat(L&&L.designW)||390, dh=parseFloat(L&&L.designH)||844;
  // Objects authored in the level editor keep their design size on the base
  // 390x844 canvas, but shrink proportionally if the runtime canvas is
  // compressed below that authored size. Never auto-grow in wider layouts.
  var k=Math.min(CW/dw,CH/dh);
  if(!isFinite(k)||k<=0)k=1;
  return Math.min(1,k);
}
function textDrawSize(L){var k=uiBaseScale(L);return {size:(L.baseSize||L.size||40)*k,strokeW:(L.baseStrokeW!=null?L.baseStrokeW:(L.strokeW||0))*k,letterSpacing:(L.baseLetterSpacing!=null?L.baseLetterSpacing:(L.letterSpacing||0))*k};}
function progressDrawSize(L){var k=uiBaseScale(L);return {w:(L.baseW||L.w||64)*k,h:(L.baseH||L.h||300)*k};}
function healthDrawSize(L){var k=uiBaseScale(L);return {heartW:(L.baseHeartW||L.heartW||36)*k,gap:(L.baseGap!=null?L.baseGap:(L.gap==null?6:L.gap))*k};}
function ctaDrawSize(L){var k=uiBaseScale(L);return {w:(L.baseW||L.w||260)*k,h:(L.baseH||L.h||86)*k};}
function progressBoxLocal(L){var a=progressLocal(L),d=progressDrawSize(L);return anchorBoxLocal(L.anchor||'cl',a.x,a.y,d.w,d.h);}
function healthBoxLocal(L){var a=healthLocal(L),d=healthDrawSize(L),cnt=L.count||3,w=cnt*d.heartW+(cnt-1)*d.gap;return anchorBoxLocal(L.anchor||'tc',a.x,a.y,w,d.heartW);}
function ctaBoxLocal(L){var a=ctaLocal(L),d=ctaDrawSize(L);return anchorBoxLocal(L.anchor||'bc',a.x,a.y,d.w,d.h);}

// ── Text labels — level text with per-segment colors (must match index.html) ──
var FONT_CSS=W.RiseFontCSS={
  'Baloo2':"'Baloo2',sans-serif",
  'Kameron':"'Kameron',serif",
  'LiberationSans':"'LiberationSans',Arial,sans-serif",
  'sans':'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
  'serif':'Georgia,"Times New Roman",serif',
  'mono':'ui-monospace,Menlo,Consolas,monospace'
};
function fontCssFamily(name){name=String(name||'').trim();return name.indexOf(' ')>=0?'\"'+name.replace(/\"/g,'')+'\",sans-serif':name+',sans-serif';}
// Draw a text label centered on (cx,cy). Text is a list of segments {t,color};
// each segment keeps its own solid color. Newlines split lines.
function drawTextLabel(ctx,L,cx,cy){
  var segs=(L.segments&&L.segments.length)?L.segments:[{t:(L.text||''),color:(L.color||'#ffffff')}];
  var fam=(FONT_CSS[L.font]||fontCssFamily(L.font)||'sans-serif');
  var ds=textDrawSize(L),size=ds.size,weight=800;
  var anchor=L.anchor||'cc',av=anchor.charAt(0),ah=anchor.charAt(1),align=ah==='l'?'left':(ah==='r'?'right':'center');
  var lines=[[]],s,p,col,parts;
  for(s=0;s<segs.length;s++){
    col=segs[s].color||'#ffffff';parts=String(segs[s].t==null?'':segs[s].t).split('\n');
    for(p=0;p<parts.length;p++){if(p>0)lines.push([]);if(parts[p]!=='')lines[lines.length-1].push({t:parts[p],color:col});}
  }
  var lh=size*1.18;
  ctx.save();
  ctx.font=weight+' '+size+'px '+fam;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  try{if('letterSpacing' in ctx)ctx.letterSpacing=(ds.letterSpacing||0)+'px';}catch(e){}
  var totalH=lh*lines.length,ascent=size*0.80,firstBase=(av==='t'?(cy+ascent):(av==='b'?(cy-totalH+ascent):(cy-totalH/2+ascent))),li,r,runs,by,lineW,sx,xx;
  for(li=0;li<lines.length;li++){
    runs=lines[li];by=firstBase+li*lh;lineW=0;
    for(r=0;r<runs.length;r++)lineW+=ctx.measureText(runs[r].t).width;
    sx=align==='left'?cx:(align==='right'?cx-lineW:cx-lineW/2);
    if(L.shadow){ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=size*0.14;ctx.shadowOffsetY=size*0.07;xx=sx;for(r=0;r<runs.length;r++){ctx.fillStyle=runs[r].color;ctx.fillText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}ctx.restore();}
    if(ds.strokeW&&ds.strokeW>0){ctx.lineWidth=ds.strokeW;ctx.strokeStyle=L.stroke||'#000';ctx.lineJoin='round';xx=sx;for(r=0;r<runs.length;r++){ctx.strokeText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}}
    xx=sx;for(r=0;r<runs.length;r++){ctx.fillStyle=runs[r].color;ctx.fillText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}
  }
  ctx.restore();
}

//── Particles ────────────────────────────────────────────────────────────────
class FX{
  constructor(){this.p=[];}
  burst(x,y,col,n=14){
    for(let i=0;i<n;i++){
      const a=Math.PI*2*i/n+Math.random()*.5,s=2+Math.random()*5;
      this.p.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,d:.024+Math.random()*.016,r:2+Math.random()*4,col});
    }
  }
  update(){for(let i=this.p.length-1;i>=0;i--){const p=this.p[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.life-=p.d;if(p.life<=0)this.p.splice(i,1);}}
  draw(ctx){for(const p of this.p){ctx.globalAlpha=p.life;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
}

//── Sound manager ────────────────────────────────────────────────────────────
// Keys: bgm (loop), win, lose, hit (ball × obstacle), shield (protector × obstacle).
// Sources come from cfg.audioSources (base64 data URLs embedded by the builder).
class SND{
  constructor(cfg){
    this.enabled=cfg.soundEnabled!==false;
    this.master=cfg.soundVolume==null?1:Math.max(0,Math.min(1,+cfg.soundVolume||0));
    this.vol=cfg.soundVolumes||{};
    this.base={};
    const srcs=cfg.audioSources||{};
    for(const k in srcs){
      if(!srcs[k])continue;
      try{const au=new Audio();au.src=srcs[k];au.preload='auto';this.base[k]=au;}catch(e){}
    }
    if(this.base.bgm)this.base.bgm.loop=true;
  }
  _v(k){const v=this.vol[k];return clamp(this.master*(v==null?1:+v),0,1);}
  play(k){
    if(!this.enabled)return;
    const b=this.base[k];if(!b)return;
    try{
      if(k==='bgm'){b.volume=this._v(k);const p=b.play();if(p&&p.catch)p.catch(function(){});return;}
      // clone so overlapping sfx (quick shield touches) can play simultaneously
      const au=b.cloneNode(true);au.volume=this._v(k);
      const p=au.play();if(p&&p.catch)p.catch(function(){});
    }catch(e){}
  }
  stopBgm(){const b=this.base.bgm;if(!b)return;try{b.pause();b.currentTime=0;}catch(e){}}
}

//── Background image item ────────────────────────────────────────────────────
// Decorative image placed in the level editor: no collisions, drawn behind
// obstacles/labels, moves with its wave. Freely positioned, stretched (w/h
// independent) and tinted per instance.
class BgImg{
  constructor(o,img){
    this.coordMode=o.coordMode||'center';
    this.layoutLocalX=o.x??0;this.layoutLocalY=o.y??0;
    this.x=layoutX(o);this.y=layoutY(o);
    this.w=o.w||200;this.h=o.h||200;
    this.tint=o.tint||'#ffffff';
    this.img=img||null;
  }
  relayout(){
    this.x=layoutX({coordMode:this.coordMode,x:this.layoutLocalX});
    this.y=layoutY({coordMode:this.coordMode,y:this.layoutLocalY});
  }
  draw(ctx,top){
    if(!imgOk(this.img))return;
    drawTintedImage(ctx,this.img,this.x-this.w/2,this.y+top-this.h/2,this.w,this.h,this.tint);
  }
}

//── Obstacle ─────────────────────────────────────────────────────────────────
class Obs{
  constructor(o){
    this.cfg=o.cfg||{};
    this.coordMode=o.coordMode||'screen';
    this.w=o.w||60;this.h=o.h||60;
    this.anchor=o.anchor||'cc';this.anchorOffsetX=o.anchorOffsetX;this.anchorOffsetY=o.anchorOffsetY;
    const lc=obstacleCenterLocal({coordMode:this.coordMode,x:o.x??0,y:o.y??0,w:this.w,h:this.h,anchor:this.anchor,anchorOffsetX:this.anchorOffsetX,anchorOffsetY:this.anchorOffsetY});
    this.layoutLocalX=lc.x;this.layoutLocalY=lc.y;
    this.x=obstacleLayoutX({coordMode:this.coordMode,x:o.x??0,y:o.y??0,w:this.w,h:this.h,anchor:this.anchor,anchorOffsetX:this.anchorOffsetX,anchorOffsetY:this.anchorOffsetY});this.y=obstacleLayoutY({coordMode:this.coordMode,x:o.x??0,y:o.y??0,w:this.w,h:this.h,anchor:this.anchor,anchorOffsetX:this.anchorOffsetX,anchorOffsetY:this.anchorOffsetY});
    this.shape=o.shape||'rect';
    this.points=(o.points||null);
    this.color=o.color||'#e05252';
    this.spr=o.sprite||null;
    this.imageSrc=o.imageSrc||null;
    this.customImg=makeImg(this.imageSrc);
    this.moveX=o.moveX||0;
    this.moveSpeed=o.moveSpeed||1800;
    this.t=o.phaseOffset||0;
    this.ix=this.x;this.iy=this.y;
    this.vx=0;this.vy=0;this.av=0;this.rot=0;this.live=true;this.kin=true;
  }
  reset(){this.x=this.ix;this.y=this.iy;this.t=0;this.vx=0;this.vy=0;this.av=0;this.rot=0;this.live=true;this.kin=true;}
  // Approximate collision radius for obstacle-vs-obstacle contacts.
  get cr(){return (this.w+this.h)*.27;}
  push(fx,fy,spin=0){if(!this.kin||!this.live)return;this.kin=false;this.vx=fx;this.vy=fy;this.av=spin;}
  update(dt,gravityModifier=1){
    if(this.kin&&this.live&&this.moveX>0){this.t+=dt;this.x=this.ix+Math.sin(this.t/this.moveSpeed*Math.PI*2)*this.moveX;}
    if(!this.kin){
      // Free-body motion after the protector hits the obstacle
      // (Unity Rigidbody2D-style: gravity + small linear/angular drag,
      // integrated per dt so the arc looks the same at any framerate).
      const f=dt/16.6667;
      this.vy+=.42*gravityModifier*f;
      this.x+=this.vx*f;this.y+=this.vy*f;
      const ld=Math.pow(.992,f);
      this.vx*=ld;this.vy*=Math.pow(.998,f);
      this.rot+=this.av*f;this.av*=Math.pow(.992,f);
      if(this.y>3000||this.y<-4000||this.x<-1200||this.x>CW+1200)this.live=false;
    }
  }
  hits(cx,cy,cr){
    if(!this.kin||!this.live)return false;
    if(this.shape==='circle'){const dx=this.x-cx,dy=this.y-cy,r=this.w/2;return dx*dx+dy*dy<(r+cr)*(r+cr);}
    if(this.shape==='custom'&&this.points&&this.points.length>=3){const pts=this.points.map(p=>({x:this.x+p.x*this.w,y:this.y+p.y*this.h}));return circlePolyHit(cx,cy,cr,pts);}
    const nx=clamp(cx,this.x-this.w/2,this.x+this.w/2),ny=clamp(cy,this.y-this.h/2,this.y+this.h/2);
    return(cx-nx)**2+(cy-ny)**2<cr*cr;
  }
  draw(ctx,sy){
    if(!this.live)return;
    const dx=this.x,dy=this.y+sy;
    ctx.save();
    ctx.translate(dx,dy);
    if(!this.kin)ctx.rotate(this.rot);
    const im=imgOk(this.customImg)?this.customImg:this.spr;
    if(imgOk(im)){drawTintedImage(ctx,im,-this.w/2,-this.h/2,this.w,this.h,this.color||((this.cfg&&this.cfg.obstacleSpriteColor)||'#ffffff'));}
    else{
      ctx.fillStyle=this.color;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=2;
      if(this.shape==='circle'){ctx.beginPath();ctx.arc(0,0,this.w/2,0,Math.PI*2);ctx.fill();ctx.stroke();}
      else if(this.shape==='triangle'){const hw=this.w/2,hh=this.h/2;ctx.beginPath();ctx.moveTo(0,-hh);ctx.lineTo(hw,hh);ctx.lineTo(-hw,hh);ctx.closePath();ctx.fill();ctx.stroke();}
      else if(this.shape==='custom'&&this.points&&this.points.length>=3){ctx.beginPath();this.points.forEach((p,i)=>{const px=p.x*this.w,py=p.y*this.h;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.fill();ctx.stroke();}
      else{ctx.beginPath();ctx.rect(-this.w/2,-this.h/2,this.w,this.h);ctx.fill();ctx.stroke();}
    }
    ctx.restore();
  }
}

//── Stage ─────────────────────────────────────────────────────────────────────
class Stage{
  constructor(idx,obs,color,labels,bgs){this.idx=idx;this.obs=obs;this.color=color;this.labels=labels||[];this.bgs=bgs||[];this.H=CH+6;this.worldY=idx*this.H;this.done=false;}
  reset(){this.done=false;this.obs.forEach(o=>o.reset());}
  resetAt(worldY){this.done=false;this.worldY=worldY;this.reset();}
  complete(){this.done=true;this.worldY=CH+this.H*4;}
  update(dt,fallSpeed=0,gravityModifier=1){
    if(this.done)return;
    // Stages are now falling waves: obstacles keep their local layout,
    // while the whole wave moves from the top of the screen downward.
    this.worldY+=fallSpeed*dt;
    this.obs.forEach(o=>o.update(dt,gravityModifier));
  }
  draw(ctx,top){
    if(this.done)return;
    if(this.color){
      const g=ctx.createLinearGradient(0,top,0,top+this.H);
      g.addColorStop(0,rgba(this.color,.08));g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(0,top,CW,this.H);
    }
    this.bgs.forEach(b=>b.draw(ctx,top));
    this.obs.forEach(o=>o.draw(ctx,top));
    for(let i=0;i<this.labels.length;i++){const L=this.labels[i],p=textLocal(L);drawTextLabel(ctx,L,CW/2+p.x,top+CH/2+p.y);}
  }
  hit(px,py,pr,top){if(this.done)return null;for(const o of this.obs){if(o.hits(px,py-top,pr))return o;}return null;}
}

//── Shield — двигается по X и Y за пальцем, защищает шарик ──────────────────
class Shield{
  constructor(cfg){
    this.cfg=cfg;
    this.x=CW/2;this.y=CH*.5;
    this.tx=this.x;this.ty=this.y;
    this.vx=0;this.vy=0;this._px=this.x;this._py=this.y;
    this.dragging=false;
    this.dead=false;this.da=0;this.ra=0;this.flash=0;
    this.spr=null;
  }
  get r(){return 26*this.cfg.shieldSize;}
  down(x,y){this.dragging=true;this.tx=x;this.ty=y;}
  move(x,y){if(this.dragging&&!this.dead){this.tx=x;this.ty=y;}}
  up(){this.dragging=false;}
  die(){this.dead=true;this.dragging=false;this.da=0;}
  respawn(){this.dead=false;this.x=CW/2;this.y=CH*.5;this.tx=this.x;this.ty=this.y;this.vx=0;this.vy=0;this._px=this.x;this._py=this.y;this.da=0;this.ra=0;this.flash=0;}
  update(dt){
    const ox=this.x,oy=this.y;
    if(this.dead){this.da=Math.min(1,this.da+dt/500);this.vx=0;this.vy=0;return;}
    if(this.ra<1)this.ra=Math.min(1,this.ra+dt/300);
    if(this.flash>0)this.flash-=dt;
    if(this.dragging){
      this.x=lerp(this.x,this.tx,.2);
      this.y=lerp(this.y,this.ty,.2);
    }
    const r=this.r;
    this.x=clamp(this.x,r,CW-r);
    this.y=clamp(this.y,r,CH*.8);
    const k=16.6667/Math.max(1,dt);
    this.vx=(this.x-ox)*k;
    this.vy=(this.y-oy)*k;
  }
  draw(ctx){
    if(this.dead){
      ctx.save();ctx.globalAlpha=lerp(1,0,this.da);
      ctx.translate(this.x,this.y);ctx.scale(lerp(1,.05,this.da),lerp(1,.05,this.da));
      this._paint(ctx,0,0);ctx.restore();return;
    }
    const pop=this.ra<1?(.5+.5*Math.sin(this.ra*Math.PI)):1;
    ctx.save();ctx.translate(this.x,this.y);ctx.scale(pop,pop);
    if(this.flash>0)ctx.globalAlpha=.5+.5*Math.sin(this.flash*.04);
    this._paint(ctx,0,0);ctx.restore();
  }
  _paint(ctx,x,y){
    const r=this.r;
    if(imgOk(this.spr)){
      const iw=this.spr.naturalWidth||this.spr.width||1, ih=this.spr.naturalHeight||this.spr.height||1;
      const h=r*2.25, w=h*(iw/ih);
      drawTintedImage(ctx,this.spr,x-w/2,y-h/2,w,h,this.cfg.shieldSpriteColor);
      return;
    }
    // glow ring
    ctx.strokeStyle=rgba(this.cfg.shieldColor,.55);ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(x,y,r+5,0,Math.PI*2);ctx.stroke();
    // body
    const g=ctx.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r);
    g.addColorStop(0,rgba(this.cfg.shieldColor,.92));g.addColorStop(1,rgba(this.cfg.shieldColor,.5));
    ctx.fillStyle=g;ctx.strokeStyle=this.cfg.shieldColor;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.3)';
    ctx.beginPath();ctx.ellipse(x-r*.28,y-r*.28,r*.2,r*.12,-.5,0,Math.PI*2);ctx.fill();
  }
}

//── Ball — движется только по Y ───────────────────────────────────────────────
class Ball{
  constructor(cfg){
    this.cfg=cfg;
    const ps=playerStartPoint(this.cfg);
    this.x=ps.x;
    this.ty=ps.y;              // fixed gameplay line after the first tap
    this.idleY=Math.min(CH-this.r-8,this.ty+80); // before tap: 50-100px lower
    this.y=this.idleY;
    this.dead=false;this.da=0;this.ra=0;this.flash=0;
    this.flying=false;this.finalFly=false;this.fy=0;this.introT=0;
    this.travel=0;this.speed=0;this.animT=0;
    this.deathT=0;
    this.spr=null;
    this.deathSpr=null;
  }
  get r(){return 20*this.cfg.playerSize;}
  get worldY(){return this.travel;}
  die(){this.dead=true;this.da=0;this.deathT=0;}
  respawn(){
    const ps=playerStartPoint(this.cfg);
    this.dead=false;this.x=ps.x;this.ty=ps.y;this.idleY=Math.min(CH-this.r-8,this.ty+80);this.y=this.idleY;
    this.da=0;this.deathT=0;this.ra=0;this.flash=0;this.flying=false;this.finalFly=false;this.fy=0;this.introT=0;this.travel=0;this.speed=0;this.animT=0;
  }
  start(speed,travel=0){this.flying=true;this.finalFly=false;this.speed=speed;this.travel=travel;this.introT=0;}
  flyAway(){this.flying=true;this.finalFly=true;this.fy=0;}
  update(dt){
    this.animT+=dt;
    if(this.dead){this.deathT+=dt;const ds=Math.max(.05,parseFloat(this.cfg.playerDeathAnimSpeed)||1);this.da=Math.min(1,this.deathT/((this.cfg.playerDeathDuration||900)/ds));return;}
    if(this.ra<1)this.ra=Math.min(1,this.ra+dt/300);
    if(this.flash>0)this.flash-=dt;
    if(this.finalFly){
      this.y-=Math.max(.75,this.speed*1.15)*dt;
      this.travel+=this.speed*dt;
      return;
    }
    if(this.flying){
      this.travel+=this.speed*dt;
      this.introT=Math.min(1,this.introT+dt/520);
      const t=1-Math.pow(1-this.introT,3);
      this.y=lerp(this.idleY,this.ty,t);
      if(this.introT>=1)this.y=this.ty;
    }else{
      this.y=this.idleY;
    }
  }
  draw(ctx){
    if(this.dead){
      if(this._paintDeath(ctx))return;
      ctx.save();ctx.globalAlpha=lerp(1,0,this.da);
      ctx.translate(this.x,this.y);ctx.scale(lerp(1,.05,this.da),lerp(1,.05,this.da));
      this._paint(ctx,0,0);ctx.restore();return;
    }
    const pop=this.ra<1?(.5+.5*Math.sin(this.ra*Math.PI)):1;
    ctx.save();ctx.translate(this.x,this.y);ctx.scale(pop,pop);
    if(this.flash>0)ctx.globalAlpha=.5+.5*Math.sin(this.flash*.04);
    this._paint(ctx,0,0);ctx.restore();
  }
  _paintDeath(ctx){
    const sheet=this.deathSpr;
    if(!imgOk(sheet))return false;
    const r=this.r;
    const frames=Math.max(1,parseInt(this.cfg.playerDeathFrames,10)||8);
    const frameW=(sheet.naturalWidth||sheet.width||1)/frames;
    const frameH=sheet.naturalHeight||sheet.height||1;
    const speed=Math.max(.05,parseFloat(this.cfg.playerDeathAnimSpeed)||1);
    const animDur=(this.cfg.playerDeathAnimDuration||720)/speed;
    const fadeStart=(this.cfg.playerDeathFadeStart||650)/speed;
    const fadeDur=260/speed;
    const fi=clamp(Math.floor((this.deathT/animDur)*frames),0,frames-1);
    const h=r*4.15,w=h*(frameW/frameH);
    const alpha=this.deathT>fadeStart?clamp(1-(this.deathT-fadeStart)/fadeDur,0,1):1;
    const t=(this.animT||0)/1000;
    const sway=Math.sin(t*2.2)*r*.075;
    const rot=Math.sin(t*1.65)*0.035;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(this.x+sway,this.y+r*.15);
    ctx.rotate(rot);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0,-r*.05,r*.92,r*1.18,0,0,Math.PI*2);
    ctx.clip();
    ctx.drawImage(sheet,fi*frameW,0,frameW,frameH,-w/2,-h*.58,w,h);
    ctx.restore();
    if(this.deathT<fadeStart){
      ctx.globalAlpha=alpha*.85;
      ctx.strokeStyle=rgba(this.cfg.playerRopeColor||this.cfg.playerOutlineColor||'#ffffff',.9);
      ctx.lineWidth=Math.max(1,r*.045);ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,r*1.02);ctx.bezierCurveTo(0,r*1.75,0,r*2.5,Math.sin(t*2.2)*r*.10,r*3.25);ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  _paint(ctx,x,y){
    const r=this.r;
    if(imgOk(this.spr)){
      // Default player is now a balloon PNG. It is drawn with its real aspect
      // ratio and a light Spine-like idle deformation: soft sway, squash and
      // a wavy string so the playable matches the balloon reference even
      // without a separate Spine runtime in the exported HTML.
      const iw=this.spr.naturalWidth||this.spr.width||1,ih=this.spr.naturalHeight||this.spr.height||1;
      const t=(this.animT||0)/1000;
      const sway=Math.sin(t*2.2)*r*.075;
      const rot=Math.sin(t*1.65)*0.035;
      const sx=1+Math.sin(t*2.4)*0.018;
      const sy=1-Math.sin(t*2.4)*0.012;
      const h=r*4.15,w=h*(iw/ih);
      ctx.save();
      ctx.translate(x+sway,y+r*.15);
      ctx.rotate(rot);
      ctx.scale(sx,sy);
      // Rope lives in the same local transform as the balloon and uses exactly
      // the same rotation/sway/squash values. Draw it BEFORE the sprite so the
      // string is visually behind the balloon body.
      ctx.strokeStyle=rgba(this.cfg.playerRopeColor||this.cfg.playerOutlineColor||'#ffffff',.9);
      ctx.lineWidth=Math.max(1,r*.045);ctx.lineCap='round';
      const ropeTopY=r*1.02;
      const ropeEndY=r*3.25;
      const bend=Math.sin(t*2.2)*r*.10;
      ctx.beginPath();
      ctx.moveTo(0,ropeTopY);
      ctx.bezierCurveTo(bend*.35,r*1.75,bend*.65,r*2.5,bend,ropeEndY);
      ctx.stroke();
      drawTintedImage(ctx,this.spr,-w/2,-h*.58,w,h,this.cfg.playerSpriteColor);
      ctx.restore();
      return;
    }
    const g=ctx.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r);
    g.addColorStop(0,this.cfg.playerColor);g.addColorStop(1,rgba(this.cfg.playerColor,.75));
    ctx.fillStyle=g;ctx.strokeStyle=this.cfg.playerOutlineColor;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.28)';
    ctx.beginPath();ctx.ellipse(x-r*.28,y-r*.28,r*.18,r*.1,-.5,0,Math.PI*2);ctx.fill();
    // string up to shield
    ctx.strokeStyle=rgba(this.cfg.playerOutlineColor,.35);ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x,y-r-16);ctx.stroke();
  }
}

//── Game ──────────────────────────────────────────────────────────────────────
class Game{
  constructor(el,cfg,assets,cb){
    this.cfg=Object.assign({},DEF,cfg);
    setView(this.cfg.orientation);
    this.assets=assets||{};
    this.cb=cb||{};
    // canvas
    this.cv=document.createElement('canvas');
    this.cv.width=CW;this.cv.height=CH;
    this.cv.style.cssText='display:block;width:100%;height:100%;touch-action:none;user-select:none;-webkit-user-select:none;';
    el.appendChild(this.cv);
    this.ctx=this.cv.getContext('2d');
    this.fx=new FX();
    this.snd=new SND(this.cfg);
    this._buildStages();
    this._bindInput();
    this._reset();
  }

  _spr(key){const s=this.assets[key];return imgOk(s)?s:null;}

  _buildStages(){
    const c=this.cfg;
    const sc=c.stageColors||['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'];
    const sh=['rect','circle','triangle'];
    this.stages=[];
    this.progressBars=[];
    this.healthBars=[];
    this.ctaButtons=[];
    this.tutorialObj=null;
    const requestedCount=Math.max(1,Math.min(20,parseInt(c.stageCount,10)||5));
    // levelData may include fixed Start scene at index 0 and Finish scene at the last index.
    const ld=c.levelData;
    const hasLD=Array.isArray(ld);
    const stageCount=Array.isArray(ld)&&ld.length>=requestedCount+2?ld.length:requestedCount+2;
    for(let si=0;si<stageCount;si++){
      let obs=[],labels=[],bgs=[];
      if(hasLD&&Array.isArray(ld[si])&&ld[si].length>0){
        ld[si].forEach(o=>{
          if(o&&o.kind==='text'){labels.push(o);return;}
          if(o&&o.kind==='progress'){var po=Object.assign({},o);po.flaskImg=makeImg(po.flaskSrc);po.fillImg=makeImg(po.fillSrc);this.progressBars.push(po);return;}
          if(o&&o.kind==='health'){var ho=Object.assign({},o);ho.heartImg=makeImg(ho.heartSrc||this.cfg.defaultHeartSrc);this.healthBars.push(ho);return;}
          if(o&&o.kind==='cta'){var co=Object.assign({},o);co.bgImg=makeImg(co.bgSrc);co.textImg=makeImg(co.textSrc);this.ctaButtons.push(co);return;}
          if(o&&o.kind==='tutorial'){this.tutorialObj=Object.assign({},o);return;}
          if(o&&o.kind==='bg'){bgs.push(new BgImg(o,this._spr('bgimg_'+o.imgId)));return;}
          const ob=new Obs({...o,cfg:c,color:o.color||(si%2===0?c.obstacleColor:c.obstacleColorAlt)});
          ob.spr=this._spr('obstacle_stage'+si)||this._spr('obstacle');
          obs.push(ob);
        });
      } else {
        const isFixedEdge=(si===0||si===stageCount-1);
        const n=isFixedEdge?0:2+Math.max(0,si-1);
        for(let oi=0;oi<n;oi++){
          const ob=new Obs({
            coordMode:'center',x:-115+(oi%2)*230,y:-CH/2+160+Math.floor(oi/2)*200+si*15,
            w:55+si*5,h:55+si*5,shape:sh[(oi+si)%3],
            color:oi%2===0?c.obstacleColor:c.obstacleColorAlt,
            moveX:si>1&&oi%2===0?80:0,moveSpeed:1800-si*120,phaseOffset:oi*600,cfg:c,
          });
          ob.spr=this._spr('obstacle_stage'+si)||this._spr('obstacle');
          obs.push(ob);
        }
      }
      this.stages.push(new Stage(si,obs,c.stageAccents===false?null:sc[si%sc.length],labels,bgs));
    }
  }

  _reset(){
    this.camY=0;
    this.state='start';
    this.lives=this.cfg.lives;
    this.si=0;
    this.dtimer=0;this.fadeA=0;this.fadeDir=0;
    this.endA=0;this.isWin=false;
    this.tutA=1;this.tutT=0;this.tutDone=false;
    this.tutBlocks=null;this._tutAnchor=null;this._tutSmashed=false;
    this.hpA=0;this.hpT=0;
    this.fx=new FX();
    this.shield=new Shield(this.cfg);
    this.ball=new Ball(this.cfg);
    this.shield.spr=this._spr('shield')||makeImg(this.cfg.defaultShieldSrc);
    this.ball.spr=this._spr('player')||makeImg(this.cfg.defaultPlayerSrc);
    this.ball.deathSpr=this._spr('player_death')||makeImg(this.cfg.defaultPlayerDeathSrc);
    this._resetFallingStages();
    this.completedStages=0;
    this.paused=false;
    if(this._raf)cancelAnimationFrame(this._raf);
    this._last=null;
    this._raf=requestAnimationFrame(t=>this._loop(t));
  }

  _cxy(e){
    const rc=this.cv.getBoundingClientRect();
    return{x:(e.clientX-rc.left)*(CW/rc.width),y:(e.clientY-rc.top)*(CH/rc.height)};
  }

  _bindInput(){
    const cv=this.cv;
    const down=(x,y)=>{
      if(this.state==='start'){this._start();return;}
      if(this.state==='playing'){
        if(this._pointInCta(x,y)){this.cb.onCTA&&this.cb.onCTA();return;}
        this.shield.down(x,y);
      }
      if(this.state==='endcard'){this.cb.onCTA&&this.cb.onCTA();}
    };
    const move=(x,y)=>{
      if(this.state==='playing'){this.shield.move(x,y);}
    };
    const up=()=>this.shield.up();

    // Pointer events (mouse + most touch)
    cv.addEventListener('pointerdown',e=>{
      e.preventDefault();
      try{cv.setPointerCapture(e.pointerId);}catch(_){}
      const p=this._cxy(e);down(p.x,p.y);
    },{passive:false});
    cv.addEventListener('pointermove',e=>{
      e.preventDefault();
      const p=this._cxy(e);move(p.x,p.y);
    },{passive:false});
    cv.addEventListener('pointerup',e=>{e.preventDefault();up();},{passive:false});
    cv.addEventListener('pointercancel',()=>up());

    // Touch fallback (older mobile webviews where pointer events misbehave)
    const tcxy=t=>{const rc=cv.getBoundingClientRect();return{x:(t.clientX-rc.left)*(CW/rc.width),y:(t.clientY-rc.top)*(CH/rc.height)};};
    cv.addEventListener('touchstart',e=>{e.preventDefault();const p=tcxy(e.touches[0]);down(p.x,p.y);},{passive:false});
    cv.addEventListener('touchmove',e=>{e.preventDefault();const p=tcxy(e.touches[0]);move(p.x,p.y);},{passive:false});
    cv.addEventListener('touchend',e=>{e.preventDefault();up();},{passive:false});

    // Mouse fallback (desktop webviews without pointer events)
    cv.addEventListener('mousedown',e=>{const p=this._cxy(e);down(p.x,p.y);});
    cv.addEventListener('mousemove',e=>{if(this.state==='playing'){const p=this._cxy(e);move(p.x,p.y);}});
    cv.addEventListener('mouseup',()=>up());
  }

  _ballSpeed(){return this.cfg.gameSpeed/16.6667;}
  _obstacleFallSpeed(){return this.cfg.gameSpeed/16.6667;}
  _resetFallingStages(){
    // First wave starts just above the visible area; each following wave is
    // placed farther upward. They later fall down into the screen.
    const H=this.stages[0].H;
    const firstTop=-160;
    this.stages.forEach((s,i)=>s.resetAt(firstTop-i*H));
    this.spawnTop=firstTop-(this.stages.length-1)*H;
    this.completedStages=0;
    this.si=0;
  }
  _start(){this.state='playing';this.ball.start(this._ballSpeed(),this.camY);this.snd.play('bgm');}

  _loop(ts){
    if(!this._last)this._last=ts;
    const dt=Math.min(50,ts-this._last);this._last=ts;
    if(!this.paused)this._update(dt);
    this._draw();
    this._raf=requestAnimationFrame(t=>this._loop(t));
  }

  play(){
    this.paused=false;
    if(this.state==='start')this._start();
    else if((this.state==='playing'||this.state==='respawning')&&this.snd)this.snd.play('bgm');
  }
  pause(){
    this.paused=true;
    if(this.snd&&this.snd.base&&this.snd.base.bgm){try{this.snd.base.bgm.pause();}catch(e){}}
  }
  stop(){
    if(this.snd)this.snd.stopBgm();
    this._reset();
    this.paused=true;
  }
  isPaused(){return !!this.paused;}
  getState(){return this.state;}

  _sst(i){return this.stages[i].worldY;}

  _updateCamera(){
    // Obstacles move toward the player, so the camera no longer lifts the ball
    // above its gameplay line. The ball only rises once from idleY to ty after
    // the first tap; on the last stage _win() switches it to finalFly.
    this.camY=0;
  }

  _recycleStages(){
    const H=this.stages[0].H;
    let highest=Math.min(...this.stages.map(s=>s.worldY));
    for(const st of this.stages){
      // Completed waves are parked far below the screen (worldY=CH+H*4), so
      // without this guard they would re-trigger the threshold check on every
      // frame and inflate completedStages — the game "won" a split second
      // after the first wave passed. Count each wave exactly once.
      if(st.done)continue;
      // When a wave has fallen below the screen, move it back above every
      // other wave. This creates new obstacles at the top instead of moving
      // old level chunks upward with the camera.
      if(st.worldY>CH+CH*.35){
        highest-=H;
        this.completedStages++;
        // Win as soon as the FINISH scene is the one on screen (i.e. start +
        // all mini-levels have passed), so the ball flies up through the
        // finish scene — not after it has already fallen past the player.
        if(this.completedStages>=this.stages.length-1){
          this.si=this.stages.length-1;
          this.cb.onStageChange&&this.cb.onStageChange(this.si);
          this._win();
          return;
        }
        // Do not recycle completed mini-levels: playable flow is
        // START stage -> exactly stageCount mini-levels -> FINISH stage.
        st.complete();
        this.si=this.completedStages;
        this.cb.onStageChange&&this.cb.onStageChange(this.si);
      }
    }
    this.spawnTop=highest;
  }

  _update(dt){
    const st=this.state;
    this.shield.update(dt);
    this.ball.update(dt);
    if(st==='playing'||st==='respawning'){
      this._updateCamera();
    }
    if(st==='playing'||st==='respawning'||st==='won'){
      const fall=this._obstacleFallSpeed();
      this.stages.forEach(s=>s.update(dt,fall,this.cfg.gravityModifier));
      this._scatterPhysics();
    }
    this.fx.update();

    // tutorial
    if(st==='playing'&&!this.tutDone){
      this.tutT+=dt;
      this._updateTutorial(dt);
      if(this.tutT>this.cfg.tutorialDisplayTime)this.tutDone=true;
      const fs=this.cfg.tutorialDisplayTime-600;
      if(this.tutT>fs)this.tutA=Math.max(0,1-(this.tutT-fs)/600);
    }
    // hp bar
    if(this.hpA>0){this.hpT+=dt;if(this.hpT>this.cfg.hpBarShowTime)this.hpA=Math.max(0,this.hpA-dt/400);}

    // collisions: shield blocks obstacles; if shield misses, ball also checks
    if(st==='playing'&&!this.shield.dead){
      outer:for(let i=0;i<this.stages.length;i++){
        const top=this._sst(i);
        const sh=this.stages[i].hit(this.shield.x,this.shield.y,this.shield.r,top);
        if(sh){this._hit(sh,top,'shield');break outer;}
        const bh=this.stages[i].hit(this.ball.x,this.ball.y,this.ball.r,top);
        if(bh){this._hit(bh,top,'ball');break outer;}
      }
    }

    // keep falling obstacle waves spawning above the screen
    if(st==='playing')this._recycleStages();

    // death sequence
    if(st==='dying'){this.dtimer+=dt;const ds=Math.max(.05,parseFloat(this.cfg.playerDeathAnimSpeed)||1);if(this.dtimer>((this.cfg.playerDeathDuration||900)/ds))this._afterDeath();}

    // fade
    if(this.fadeDir!==0){
      this.fadeA=clamp(this.fadeA+this.fadeDir*dt/300,0,1);
      if(this.fadeA>=1&&this.fadeDir>0){this._onFadeIn();this.fadeDir=-1;}
      if(this.fadeA<=0&&this.fadeDir<0)this.fadeDir=0;
    }
    if(st==='endcard')this.endA=Math.min(1,this.endA+dt/500);
  }

  _hit(obs,top,who){
    const hx=who==='shield'?this.shield.x:this.ball.x;
    const hy=who==='shield'?this.shield.y:this.ball.y;
    const dx=obs.x-hx,dy=(obs.y+top)-hy;
    const len=Math.sqrt(dx*dx+dy*dy)||1;
    const f=this.cfg.obstaclePushForce;
    if(who==='shield'){
      // Luna/Unity-style protector collision: the obstacle inherits the
      // shield's swipe velocity (fast flick -> flies far, gentle touch ->
      // small nudge) plus a separation impulse along the contact normal.
      // No forced downward velocity: hit from below sends the piece UP,
      // then gravity pulls it back in an arc.
      const svx=this.shield.vx||0,svy=this.shield.vy||0;
      let nx=dx/len,ny=dy/len;
      const base=f*.55;                       // softer minimum kick, closer to Luna preview
      const drive=Math.max(0,svx*nx+svy*ny);  // swipe speed towards the obstacle
      const vx=nx*(base+drive*.35)+svx*.35;
      const vy=ny*(base+drive*.35)+svy*.35;
      // Torque from an off-centre contact point (r x J / inertia):
      // clipping a corner spins the piece hard, a dead-centre hit barely does.
      const cxp=clamp(hx,obs.x-obs.w/2,obs.x+obs.w/2);
      const cyp=clamp(hy,(obs.y+top)-obs.h/2,(obs.y+top)+obs.h/2);
      const rx=cxp-obs.x,ry=cyp-(obs.y+top);
      const inertia=Math.max(300,(obs.w*obs.w+obs.h*obs.h)/12);
      const spin=clamp((rx*vy-ry*vx)/(inertia*3.8),-.16,.16);
      obs.push(vx,vy,spin);
      this.shield.flash=400;
      this.snd.play('shield');
    } else {
      obs.push(dx/len*f*.65,dy/len*f*.65-1.1,clamp(dx*.006,-.10,.10));
      this.ball.flash=400;
      this._die();
    }
    this.fx.burst(obs.x,obs.y+top,this.cfg.particleColor);
    this.tutDone=true;
  }

  // Chain-reaction scatter physics, matching the Unity original:
  // a knocked-out obstacle collides with its neighbours — kinematic pieces
  // get knocked free (momentum transfer), already-flying pieces bounce off
  // each other with a bit of restitution. One good swipe scatters a cluster.
  _scatterPhysics(){
    if(this.cfg.chainReaction===false)return;
    const list=[];
    for(let i=0;i<this.stages.length;i++){
      const st=this.stages[i];if(st.done)continue;
      const top=this._sst(i);
      for(const o of st.obs){if(o.live)list.push({o,top});}
    }
    const rest=Math.min(.18,this.cfg.scatterBounciness??.08);
    for(let a=0;a<list.length;a++){
      const A=list[a];if(A.o.kin)continue;      // only flying pieces initiate
      const ar=A.o.cr,ax=A.o.x,ay=A.o.y+A.top;
      for(let b=0;b<list.length;b++){
        if(b===a)continue;
        const B=list[b],br=B.o.cr;
        const dx=B.o.x-ax,dy=(B.o.y+B.top)-ay,rr=ar+br;
        if(dx*dx+dy*dy>rr*rr)continue;
        const d=Math.sqrt(dx*dx+dy*dy)||1,nx=dx/d,ny=dy/d;
        if(B.o.kin){
          const sp=Math.hypot(A.o.vx,A.o.vy);
          if(sp<3.2)continue;                   // too slow to knock anything out
          B.o.push(A.o.vx*.28+nx*sp*.10,A.o.vy*.28+ny*sp*.10,
                   clamp(nx*.025+(Math.random()-.5)*.06,-.10,.10));
          A.o.vx*=.78;A.o.vy*=.78;              // light momentum transfer
          this.fx.burst(B.o.x,B.o.y+B.top,this.cfg.particleColor);
        }else{
          // both flying: separate the overlap + exchange impulse
          const rel=(B.o.vx-A.o.vx)*nx+(B.o.vy-A.o.vy)*ny;
          if(rel<0){
            const j=-rel*(1+rest)/2;
            A.o.vx-=nx*j;A.o.vy-=ny*j;B.o.vx+=nx*j;B.o.vy+=ny*j;
            A.o.av+=(Math.random()-.5)*.015;B.o.av+=(Math.random()-.5)*.015;
          }
          const ov=(rr-d)*.35;
          A.o.x-=nx*ov;A.o.y-=ny*ov;B.o.x+=nx*ov;B.o.y+=ny*ov;
        }
      }
    }
  }

  _die(){if(this.state!=='playing')return;this.state='dying';this.shield.die();this.ball.die();this.dtimer=0;this.snd.play('hit');}  _afterDeath(){this.lives--;if(this.lives<=0){this._lose();return;}this.hpA=1;this.hpT=0;this.fadeDir=1;}
  _onFadeIn(){
    this.camY=Math.max(0,this.camY-this.stages[0].H*.25);
    this._resetFallingStages();
    this.shield.respawn();this.ball.respawn();
    this.state='respawning';this.ball.start(this._ballSpeed(),this.camY);
    setTimeout(()=>{if(this.state==='respawning')this.state='playing';},500);
  }
  _advance(){
    const n=this.si+1;
    if(n>=this.stages.length){this._win();return;}
    this.si=n;
    this.cb.onStageChange&&this.cb.onStageChange(n);
  }
  _win(){this.state='won';this.isWin=true;this.snd.stopBgm();this.snd.play('win');this.ball.flyAway();setTimeout(()=>{this.state='endcard';this.cb.onWin&&this.cb.onWin();},1400);}
  _lose(){this.state='endcard';this.isWin=false;this.snd.stopBgm();this.snd.play('lose');this.cb.onLose&&this.cb.onLose();}

  _drawCover(ctx,bg,x,y,w,h){
    if(!imgOk(bg))return false;
    const sc=Math.max(w/bg.naturalWidth,h/bg.naturalHeight);
    const dw=bg.naturalWidth*sc,dh=bg.naturalHeight*sc;
    ctx.drawImage(bg,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
    return true;
  }

  _drawCoverFade(ctx,bg,x,y,w,h,fade,tint){
    if(!imgOk(bg))return false;
    const off=document.createElement('canvas');
    off.width=Math.max(1,Math.round(w));off.height=Math.max(1,Math.round(h));
    const oc=off.getContext('2d');
    const sc=Math.max(w/bg.naturalWidth,h/bg.naturalHeight);
    const dw=bg.naturalWidth*sc,dh=bg.naturalHeight*sc;
    oc.drawImage(bg,(w-dw)/2,(h-dh)/2,dw,dh);
    if(tint&&String(tint).toLowerCase()!=='#ffffff'){
      oc.globalCompositeOperation='multiply';
      oc.fillStyle=tint;
      oc.fillRect(0,0,w,h);
      oc.globalCompositeOperation='destination-in';
      oc.drawImage(bg,(w-dw)/2,(h-dh)/2,dw,dh);
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

  _drawBackground(ctx){
    ctx.fillStyle=this.cfg.bgColor;ctx.fillRect(0,0,CW,CH);
    // Two background modes:
    //  'common'   — one static full-screen image for the whole game.
    //  'perStage' — every mini-level carries its own background band that
    //               travels with its wave; until an image is uploaded the
    //               band shows a 2-colour gradient (its own per stage), and
    //               an optional seam sprite covers the junction between bands.
    if(this.cfg.backgroundMode==='common'){
      const bg=this._spr('background');
      if(imgOk(bg))this._drawCoverFade(ctx,bg,0,0,CW,CH,0,this.cfg.backgroundSpriteColor);
      return;
    }
    const grads=(this.cfg.stageBgGradients&&this.cfg.stageBgGradients.length)?this.cfg.stageBgGradients:BG_GRADS;
    const vis=[];
    for(let i=0;i<this.stages.length;i++){
      const s=this.stages[i];if(s.done)continue;
      vis.push({i,top:s.worldY,H:s.H});
    }
    if(!vis.length)return;
    vis.sort((a,b)=>a.top-b.top);
    for(let k=0;k<vis.length;k++){
      const v=vis[k];
      let top=v.top,bot=v.top+v.H;
      if(k===0)top=Math.min(top,0);              // extend edge bands so no
      if(k===vis.length-1)bot=Math.max(bot,CH);  // bgColor gaps show through
      if(bot<0||top>CH)continue;
      // The gradient is ALWAYS drawn: it fills the edge extensions and shows
      // through transparent areas of the band image. Stops are anchored to the
      // natural band, so the gradient doesn't shift while an extension shrinks.
      const g=grads[v.i%grads.length]||grads[0];
      const lg=ctx.createLinearGradient(0,v.top,0,v.top+v.H);
      // pair order: [bottom colour, top colour]
      lg.addColorStop(0,g[1]);lg.addColorStop(1,g[0]);
      ctx.fillStyle=lg;ctx.fillRect(0,top,CW,bot-top);
      // The image is cover-fitted into the band's NATURAL rect and travels
      // with the wave at a constant scale — no zoom-out effect at the start
      // while the edge extension collapses.
      const img=this._spr('bg_stage'+v.i);
      if(imgOk(img)){
        const tint=(this.cfg.stageBgTints&&this.cfg.stageBgTints[v.i])||this.cfg.bgStageTint;
        this._drawCoverFade(ctx,img,0,v.top,CW,v.H,0,tint);
      }
    }
  }

  _drawSeamOverlays(ctx){
    if(this.cfg.backgroundMode==='common')return;
    const vis=[];
    for(let i=0;i<this.stages.length;i++){
      const s=this.stages[i];if(s.done)continue;
      vis.push({i,top:s.worldY,H:s.H});
    }
    if(!vis.length)return;
    vis.sort((a,b)=>a.top-b.top);
    const sc=this.cfg.seamScale||1;
    const multi=(this.cfg.seamOverlayMode==='perStage')||!!this.cfg.seamMulti;
    const drawAt=(seam,y)=>{
      if(!imgOk(seam))return;
      const iw=seam.naturalWidth||seam.width||1,ih=seam.naturalHeight||seam.height||1;
      const sh=clamp(CW*(ih/iw)*sc,20,CH*.5);
      if(y<-sh||y>CH+sh)return;
      ctx.drawImage(seam,0,y,CW,sh);
    };
    const overlayY=(k,seam)=>{
      const v=vis[k];
      const iw=seam&&(seam.naturalWidth||seam.width)||1;
      const ih=seam&&(seam.naturalHeight||seam.height)||1;
      const sh=clamp(CW*(ih/iw)*sc,20,CH*.5);
      const stageBottom=v.top+v.H;
      if(v.i===0){
        // Start has no previous level below it, so its overlay stays fully
        // inside the start band and is flush with the visible bottom edge.
        let bottom=stageBottom;
        if(k===vis.length-1)bottom=Math.max(bottom,CH);
        return bottom-sh;
      }
      // Every later level owns the overlay on its lower junction. Center the
      // image on the boundary: 50% stays on this/new level, 50% drops onto
      // the previous level below.
      return stageBottom-sh*0.5;
    };
    if(multi){
      for(let k=0;k<vis.length;k++){
        const seam=this._spr('bg_seam_stage'+vis[k].i);
        drawAt(seam,overlayY(k,seam));
      }
    }else{
      const seam=this._spr('bg_seam');
      for(let k=0;k<vis.length;k++)drawAt(seam,overlayY(k,seam));
    }
  }

  _draw(){
    const ctx=this.ctx;
    this._drawBackground(ctx);
    // stages
    for(let i=0;i<this.stages.length;i++){if(!this.stages[i].done)this.stages[i].draw(ctx,this._sst(i));}
    this.fx.draw(ctx);
    // Seam overlays cover the backgrounds/stage content, but the two balls
    // must always stay above them.
    this._drawSeamOverlays(ctx);
    // ball below shield, both above seam overlays
    this.ball.draw(ctx);
    this.shield.draw(ctx);
    // Level progress dots removed: progress indicators should be placed manually in the editor.
    this._drawProgressBars(ctx);
    this._drawHealthBars(ctx);
    this._drawCtas(ctx);
    if(!this.tutDone&&this.state==='playing'&&this.tutA>0)this._drawTut(ctx);
    if(this.hpA>0&&!(this.healthBars&&this.healthBars.length))this._drawHp(ctx);
    if(this.fadeA>0){ctx.fillStyle=`rgba(0,0,0,${this.fadeA})`;ctx.fillRect(0,0,CW,CH);}
    if(this.state==='start')this._drawStart(ctx);
    if(this.state==='endcard')this._drawEnd(ctx);
  }

  _flaskPath(ctx,x,y,w,h){
    const r=w*.18,neck=w*.42,nx=x+w/2-neck/2,ny=y+4,bodyBot=y+h-r;
    ctx.beginPath();ctx.moveTo(nx,ny);ctx.quadraticCurveTo(x+w/2,ny-r*.45,nx+neck,ny);ctx.lineTo(nx+neck,bodyBot);ctx.quadraticCurveTo(nx+neck,bodyBot+r*.9,x+w/2,bodyBot+r*.9);ctx.quadraticCurveTo(nx,bodyBot+r*.9,nx,bodyBot);ctx.closePath();
  }

  _drawFlask(ctx,x,y,w,h,progress,fill,line,b){
    progress=clamp(progress==null?0:progress,0,1);
    const flask=b&&imgOk(b.flaskImg)?b.flaskImg:null, fillImg=b&&imgOk(b.fillImg)?b.fillImg:null;
    if(flask){
      const ow=Math.max(1,Math.ceil(w)),oh=Math.max(1,Math.ceil(h));
      const off=document.createElement('canvas');off.width=ow;off.height=oh;const ox=off.getContext('2d');
      const fy=oh-oh*progress;
      if(fillImg)ox.drawImage(fillImg,0,fillImg.naturalHeight*(1-progress),fillImg.naturalWidth,fillImg.naturalHeight*progress,0,fy,ow,oh-fy);
      else{ox.fillStyle=fill||'#b9ff9b';ox.fillRect(0,fy,ow,oh-fy);}
      ox.globalCompositeOperation='destination-in';ox.drawImage(flask,0,0,ow,oh);
      ctx.drawImage(off,x,y,w,h);ctx.drawImage(flask,x,y,w,h);return;
    }
    ctx.save();this._flaskPath(ctx,x,y,w,h);ctx.clip();ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(x,y,w,h);
    const fy=y+h-h*progress;
    if(fillImg)ctx.drawImage(fillImg,0,fillImg.naturalHeight*(1-progress),fillImg.naturalWidth,fillImg.naturalHeight*progress,x,fy,w,h*progress);else{ctx.fillStyle=fill||'#b9ff9b';ctx.fillRect(x,fy,w,y+h-fy);}
    ctx.restore();
    ctx.save();this._flaskPath(ctx,x,y,w,h);ctx.strokeStyle=line||'#101625';ctx.lineWidth=Math.max(2,w*.045);ctx.stroke();ctx.lineWidth=Math.max(1,w*.025);
    for(let k=1;k<10;k++){const yy=y+h-k*h/10;ctx.beginPath();ctx.moveTo(x+w*.52,yy);ctx.lineTo(x+w*.86,yy);ctx.stroke();}
    ctx.restore();
  }

  _drawProgressBars(ctx){
    // Progress bars are editor elements, just like text labels: no hard-coded
    // flask is drawn unless the user placed one in Level Editor. Position is
    // always resolved from the selected anchor + percentage offsets.
    const bars=(this.progressBars&&this.progressBars.length)?this.progressBars:[];
    if(!bars.length)return;
    const denom=Math.max(1,this.stages.length-1);
    const H=this.stages[0]?this.stages[0].H:CH,firstTop=-160,threshold=CH+CH*.35;
    let frac=0;
    const st=this.stages[this.completedStages];
    if(st&&!st.done)frac=clamp((st.worldY-firstTop)/(threshold-firstTop),0,1);
    const p=clamp(((this.completedStages||0)+frac)/denom,0,1);
    for(const b of bars){
      const box=progressBoxLocal(b),x=CW/2+box.x,y=CH/2+box.y;
      this._drawFlask(ctx,x,y,box.w,box.h,p,b.fill,b.line,b);
    }
  }


  _drawHealthBars(ctx){
    const bars=(this.healthBars&&this.healthBars.length)?this.healthBars:[];
    if(!bars.length)return;
    for(const b of bars){
      const count=Math.max(1,parseInt(b.count,10)||3), ds=healthDrawSize(b), size=ds.heartW, gap=ds.gap;
      const box=healthBoxLocal(b), total=count*size+(count-1)*gap;
      let x=CW/2+box.x, y=CH/2+box.y;
      for(let i=0;i<count;i++){
        ctx.save();
        ctx.globalAlpha=i<this.lives?1:(b.emptyAlpha==null ? .28 : b.emptyAlpha);
        const im=b.heartImg;
        if(imgOk(im))drawTintedImage(ctx,im,x,y,size,size,b.tint||'#ffffff');
        else{ctx.font=Math.round(size*.86)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=i<this.lives?'#ff6b6b':'#444';ctx.fillText('♥',x+size/2,y+size/2);}
        ctx.restore();
        x+=size+gap;
      }
    }
  }

  _drawDots(ctx){
    const n=this.stages.length,r=5,gap=12,sc=this.cfg.stageColors||['#e05252'];
    const accents=this.cfg.stageAccents!==false;
    let x=(CW-n*(r*2)-(n-1)*gap)/2,y=CH-22;
    for(let i=0;i<n;i++){ctx.beginPath();ctx.arc(x+r,y,r,0,Math.PI*2);ctx.fillStyle=i===this.si?(accents?sc[i%sc.length]:rgba('#fff',.55)):rgba('#fff',.2);ctx.fill();x+=r*2+gap;}
  }

  _drawTut(ctx){
    ctx.save();ctx.globalAlpha=this.tutA;
    if(this.cfg.tutorialAnimEnabled!==false)this._drawTutAnim(ctx);
    else{
      ctx.fillStyle='rgba(255,255,255,.88)';ctx.font='bold 15px sans-serif';ctx.textAlign='center';
      ctx.fillText('Hold & drag to move',CW/2,this.shield.y-this.shield.r-24);
      const ay=this.shield.y-this.shield.r-8+Math.sin(Date.now()/500)*4;
      ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(CW/2,ay);ctx.lineTo(CW/2-7,ay+11);ctx.moveTo(CW/2,ay);ctx.lineTo(CW/2+7,ay+11);ctx.stroke();
    }
    ctx.restore();
  }

  // Ported from Tutorial.prefab + TutorialStage1.anim (1s loop, 60fps):
  // block pyramid (Obstacle y=4.68), Hand pos (1.48,3.58)->(-1.23,5.61)
  // rot -25.4deg->+18deg alpha 0->1@0.42 hold 1->0@1, Swipe streak from
  // (1.5,4.16) growing to (-1.05,5.71) scaleX 0->1@0.75 alpha .4 fade@.75-.92.
  // Blocks are interactive: the shield smashes them with scatter physics.
  _tutInit(){
    const T=this.tutorialObj;
    let S,ax,ay;
    if(T){
      // позиция/масштаб из объекта Level Editor (anchor + offset; центр композиции = uy 4.28)
      S=Math.min(CW,CH)*0.14*(parseFloat(T.scale)||1);
      const b=progressAnchorBaseLocal(T.anchor||'cc');
      const cx=CW/2+b.x+(parseFloat(T.anchorOffsetX)||0)*CW/100;
      const cy=CH/2+b.y+(parseFloat(T.anchorOffsetY)||0)*CH/100;
      ax=cx;ay=cy-(4.28-4.6)*S;
    }else{
      S=Math.min(CW,CH)*0.14;
      ax=CW/2;ay=clamp(this.shield.y-this.shield.r-120,CH*0.16,CH*0.5);
    }
    this._tutAnchor={ax,ay,S};
    const U=(ux,uy)=>({x:ax+ux*S,y:ay-(uy-4.6)*S});
    const bs=0.5224*S;
    this.tutBlocks=[[-0.674,4.651],[0,4.651],[0.649,4.651],[-0.338,5.28],[0.338,5.28],[0,5.882]]
      .map(c=>{const q=U(c[0],c[1]);return{x:q.x,y:q.y,s:bs,hit:false,vx:0,vy:0,rot:0,vr:0,a:1};});
    this._tutSmashed=false;
  }
  _tutU(ux,uy){const a=this._tutAnchor;return{x:a.ax+ux*a.S,y:a.ay-(uy-4.6)*a.S};}
  _updateTutorial(dt){
    if(this.cfg.tutorialAnimEnabled===false)return;
    if(!this.tutBlocks)this._tutInit();
    const sh=this.shield,g=900*(parseFloat(this.cfg.gravityModifier)||1);
    let alive=0;
    for(const b of this.tutBlocks){
      if(!b.hit){
        alive++;
        const dx=b.x-sh.x,dy=b.y-sh.y,rr=sh.r+b.s*0.62;
        if(!sh.dead&&dx*dx+dy*dy<rr*rr){
          const len=Math.sqrt(dx*dx+dy*dy)||1,f=(this.cfg.obstaclePushForce||7)*26;
          b.hit=true;
          b.vx=sh.vx*0.9+dx/len*f;
          b.vy=sh.vy*0.9+dy/len*f-120;
          b.vr=(Math.random()*8-4);
          this.fx.burst(b.x,b.y,this.cfg.particleColor);
          this.snd&&this.snd.play('shield');
          alive--;
        }
      }else if(b.a>0){
        b.x+=b.vx*dt/1000;b.y+=b.vy*dt/1000;
        b.vy+=g*dt/1000;b.rot+=b.vr*dt/1000;
        if(b.y>CH+b.s)b.a=0;
      }
    }
    // pyramid destroyed -> wrap the tutorial up early (start the fade)
    if(alive===0&&!this._tutSmashed){
      this._tutSmashed=true;
      const fs=this.cfg.tutorialDisplayTime-600;
      if(this.tutT<fs)this.tutT=fs;
    }
  }
  _drawTutAnim(ctx){
    if(!this._tutHand){
      const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ffffff" stroke="#1c2030" stroke-width="0.8" stroke-linejoin="round" d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/></svg>';
      this._tutHand=makeImg('data:image/svg+xml,'+encodeURIComponent(svg));
    }
    if(!this.tutBlocks)this._tutInit();
    const S=this._tutAnchor.S;
    const p=((this.tutT||0)/1000)%1;                     // 1s loop (WrapMode 2)
    const ss=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
    // blocks (interactive)
    const T=this.tutorialObj;
    const shape=(T&&T.blockShape)||this.cfg.tutorialObstacleShape||'square';
    const blockColor=(T&&T.blockColor)||'#373843';
    for(const b of this.tutBlocks){
      if(b.a<=0)continue;
      ctx.save();ctx.globalAlpha*=b.a;
      ctx.translate(b.x,b.y);ctx.rotate(b.rot);
      ctx.fillStyle=blockColor;
      this._tutShape(ctx,0,0,b.s,shape);
      ctx.restore();
    }
    const smashed=this._tutSmashed;
    // swipe streak (hidden once the pyramid is destroyed)
    if(!smashed){
      const A=this._tutU(1.5,4.16),E=this._tutU(-1.05,5.71);
      const gr8=ss(Math.min(1,p/0.75));
      const sa=p<0.75?0.4:(p<0.92?0.4*(1-(p-0.75)/0.17):0);
      if(sa>0&&gr8>0.03){
        const bx=A.x+(E.x-A.x)*gr8,by=A.y+(E.y-A.y)*gr8;
        const len=Math.hypot(bx-A.x,by-A.y);
        ctx.save();ctx.globalAlpha*=sa;
        ctx.translate(A.x,A.y);ctx.rotate(Math.atan2(by-A.y,bx-A.x));
        const gr=ctx.createLinearGradient(0,0,len,0);
        gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,1)');
        ctx.fillStyle=gr;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,-0.19*S);ctx.lineTo(len,0.19*S);ctx.closePath();ctx.fill();
        ctx.restore();
      }
      // hand
      const ha=p<0.42?p/0.42:(p<0.58?1:Math.max(0,1-(p-0.58)/0.42));
      if(ha>0&&imgOk(this._tutHand)){
        const H=this._tutU(1.48+(-1.23-1.48)*ss(p),3.58+(5.61-3.58)*ss(p));
        const rot=-((-25.4+(18+25.4)*ss(p))*Math.PI/180);// Unity CCW -> canvas
        const hw=1.7*S;
        ctx.save();ctx.globalAlpha*=ha;
        ctx.translate(H.x,H.y);ctx.rotate(rot);
        ctx.drawImage(this._tutHand,-hw*0.48,-hw*0.12,hw,hw); // fingertip at pivot
        ctx.restore();
      }
    }
    // text
    const fs=Math.max(6,((T&&parseFloat(T.textSize))||18)*(S/(Math.min(CW,CH)*0.14)));
    ctx.fillStyle=(T&&T.textColor)||'rgba(255,255,255,.92)';
    ctx.font='bold '+fs+'px sans-serif';ctx.textAlign='center';
    const lines=String((T&&T.text!=null)?T.text:'Move the circle\nto break the block').split('\n');
    let ty=this._tutU(0,2.9).y;
    const tx=this._tutAnchor.ax;
    for(const ln of lines){ctx.fillText(ln,tx,ty);ty+=fs*1.25;}
  }

  _tutShape(ctx,x,y,s,shape){
    ctx.beginPath();
    if(shape==='circle')ctx.arc(x,y,s/2,0,Math.PI*2);
    else if(shape==='triangle'){ctx.moveTo(x,y-s/2);ctx.lineTo(x+s/2,y+s/2);ctx.lineTo(x-s/2,y+s/2);ctx.closePath();}
    else ctx.rect(x-s/2,y-s/2,s,s);
    ctx.fill();
  }

  _drawHp(ctx){
    ctx.save();ctx.globalAlpha=this.hpA;
    const bw=130,bh=44,bx=(CW-bw)/2,by=16;
    ctx.fillStyle='rgba(0,0,0,.7)';ctx.beginPath();ctx.rect(bx,by,bw,bh);ctx.fill();
    const hs=22,tot=this.cfg.lives,gap=5;
    let hx=(CW-tot*hs-(tot-1)*gap)/2;
    for(let i=0;i<tot;i++){ctx.font=hs+'px serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=i<this.lives?'#ff6b6b':'#444';ctx.globalAlpha=this.hpA*(i<this.lives?1:.3);ctx.fillText('♥',hx,by+bh/2);hx+=hs+gap;}
    ctx.restore();
  }

  _drawStart(ctx){
    ctx.save();
    const startBg=this._spr('background_start');
    if(imgOk(startBg))this._drawCoverFade(ctx,startBg,0,0,CW,CH,0,this.cfg.backgroundSpriteColor);
    const g=ctx.createRadialGradient(CW/2,CH/2,CH*.1,CW/2,CH/2,CH*.8);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');
    ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);
    ctx.restore();
  }


  _ctaRect(b){
    const box=ctaBoxLocal(b);
    return {x:CW/2+box.x,y:CH/2+box.y,w:box.w,h:box.h,cx:CW/2+box.x+box.w/2,cy:CH/2+box.y+box.h/2};
  }

  _pointInCta(x,y){
    if(!this.ctaButtons||!this.ctaButtons.length)return false;
    for(let i=this.ctaButtons.length-1;i>=0;i--){
      const r=this._ctaRect(this.ctaButtons[i]);
      if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return true;
    }
    return false;
  }

  _drawCustomCta(ctx,b){
    const r=this._ctaRect(b),x=r.x,y=r.y,w=r.w,h=r.h;
    if(imgOk(b.bgImg))drawTintedImage(ctx,b.bgImg,x,y,w,h,b.bgTint||'#ffffff');
    else{ctx.fillStyle=b.bgTint||this.cfg.obstacleColor;ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,h*.22):ctx.rect(x,y,w,h);ctx.fill();}
    if(imgOk(b.textImg))drawTintedImage(ctx,b.textImg,x,y,w,h,b.textTint||'#ffffff');
    else{ctx.fillStyle=b.textTint||'#ffffff';ctx.font='bold '+Math.max(12,h*.28)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('PLAY NOW',r.cx,r.cy);}
  }

  _drawCtas(ctx){
    if(!this.ctaButtons||!this.ctaButtons.length)return;
    for(let i=0;i<this.ctaButtons.length;i++)this._drawCustomCta(ctx,this.ctaButtons[i]);
  }

  _drawEnd(ctx){
    const ec=this.cfg.endCard||{};
    const finishBg=this._spr('background_finish');
    const W=CW,H=CH;
    ctx.save();ctx.globalAlpha=this.endA;
    if(this.isWin){
      if(imgOk(finishBg))this._drawCoverFade(ctx,finishBg,0,0,W,H,0,this.cfg.backgroundSpriteColor);
      else{ctx.fillStyle='#111827';ctx.fillRect(0,0,W,H);}
      const frame=this._spr('endcard_win_frame');
      if(imgOk(frame)){ctx.globalAlpha=this.endA*.55;this._drawCover(ctx,frame,0,0,W,H);ctx.globalAlpha=this.endA;}
      ctx.fillStyle='rgba(0,0,0,'+(ec.overlay==null?.55:ec.overlay)+')';ctx.fillRect(0,0,W,H);
      const card=this._spr('endcard_win');
      if(imgOk(card)){
        const sc=(ec.scale==null?1:ec.scale),cx=W/2+(ec.x||0)*W/100,cy=H*.45+(ec.y||0)*H/100;
        const bw=W*.88*sc,bh=H*.38*sc,cs=Math.min(bw/card.naturalWidth,bh/card.naturalHeight),dw=card.naturalWidth*cs,dh=card.naturalHeight*cs;
        ctx.drawImage(card,cx-dw/2,cy-dh/2,dw,dh);
      }else{
        ctx.fillStyle='#fff';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText('YOU WIN!',W/2,H*.35);
      }
    }else{
      const bg=this._spr('endcard_lose_bg');
      if(imgOk(bg))this._drawCover(ctx,bg,0,0,W,H);else{ctx.fillStyle='#10252e';ctx.fillRect(0,0,W,H);}
      ctx.fillStyle='rgba(0,0,0,'+(ec.overlay==null?.55:ec.overlay)+')';ctx.fillRect(0,0,W,H);
      const logo=this._spr('endcard_lose_logo');
      if(imgOk(logo)){
        const sc=(ec.scale==null?1:ec.scale),cx=W/2+(ec.x||0)*W/100,cy=H*.28+(ec.y||0)*H/100;
        const bw=W*.78*sc,bh=H*.28*sc,ls=Math.min(bw/logo.naturalWidth,bh/logo.naturalHeight),dw=logo.naturalWidth*ls,dh=logo.naturalHeight*ls;
        ctx.drawImage(logo,cx-dw/2,cy-dh/2,dw,dh);
      }
      ctx.fillStyle='#fff';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText('TRY AGAIN',W/2+(ec.x||0)*W/100,H*.47+(ec.y||0)*H/100);
    }
    if(ec.showCta!==false){
      const bw=220,bh=54,bx=(W-bw)/2,by=(ec.ctaY==null?74:ec.ctaY)*H/100;
      const btn=this._spr('endcard_lose_button');
      if(imgOk(btn))drawTintedImage(ctx,btn,bx,by,bw,bh,this.isWin?'#52e08a':'#59cbe8');
      else{ctx.fillStyle=this.isWin?'#52e08a':'#59cbe8';ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,bw,bh,12):ctx.rect(bx,by,bw,bh);ctx.fill();}
      ctx.fillStyle='#fff';ctx.font='800 17px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ec.ctaText||'PLAY NOW',W/2,by+bh/2);
    }
    ctx.restore();
  }

  destroy(){if(this._raf)cancelAnimationFrame(this._raf);this.cv.remove();}

  // Live orientation switch: one exported HTML serves both portrait and
  // landscape. Game state (lives, progress, flying obstacles) is preserved;
  // positions are re-derived from center-based layout coords or scaled.
  setOrientation(or){
    or=or==='landscape'?'landscape':'portrait';
    const oldW=CW,oldH=CH,oldOr=this.cfg.orientation;
    this.cfg.orientation=or;setView(or);
    if(or===oldOr&&CW===oldW&&CH===oldH)return;
    const kx=CW/oldW,ky=CH/oldH;
    this.cv.width=CW;this.cv.height=CH;
    // ball: recompute its fixed lines for the new screen
    const b=this.ball;
    const ps=playerStartPoint(this.cfg);
    b.x=ps.x;b.ty=ps.y;b.idleY=Math.min(CH-b.r-8,b.ty+80);
    if(b.finalFly)b.y*=ky;
    else if(b.flying)b.y=b.introT>=1?b.ty:lerp(b.idleY,b.ty,1-Math.pow(1-b.introT,3));
    else b.y=b.idleY;
    // shield: keep relative position
    const s=this.shield;
    s.x*=kx;s.y*=ky;s.tx*=kx;s.ty*=ky;s._px=s.x;s._py=s.y;
    s.x=clamp(s.x,s.r,CW-s.r);s.y=clamp(s.y,s.r,CH*.8);
    // stages: wave height follows CH; kinematic obstacles re-derive layout
    // from their local (center-based) coords, free-flying ones just scale
    for(const st of this.stages){
      st.H=CH+6;
      st.worldY*=ky;
      st.bgs.forEach(b=>b.relayout());
      for(const o of st.obs){
        if(o.kin&&o.live){
          o.ix=obstacleLayoutX({coordMode:o.coordMode,x:o.layoutLocalX,y:o.layoutLocalY,w:o.w,h:o.h,anchor:o.anchor,anchorOffsetX:o.anchorOffsetX,anchorOffsetY:o.anchorOffsetY});
          o.iy=obstacleLayoutY({coordMode:o.coordMode,x:o.layoutLocalX,y:o.layoutLocalY,w:o.w,h:o.h,anchor:o.anchor,anchorOffsetX:o.anchorOffsetX,anchorOffsetY:o.anchorOffsetY});
          o.x=o.ix;o.y=o.iy;
        }else{o.x*=kx;o.y*=ky;}
      }
    }
    if(this.spawnTop!=null)this.spawnTop*=ky;
  }
}

const DEF={
  lives:3,gameSpeed:3.2,acceleration:0.4,obstaclePushForce:7,gravityModifier:1,
  chainReaction:true,scatterBounciness:0.35,
  hpBarShowTime:2000,tutorialDisplayTime:3500,tutorialAnimEnabled:true,tutorialObstacleShape:'square',
  playerColor:'#ffffff',playerOutlineColor:'#ffffff',playerSize:2.0,playerDeathAnimSpeed:1,playerSpriteColor:'#ffffff',playerRopeColor:'#ffffff',playerStart:null,
  shieldColor:'#4fc3f7',shieldSize:1.0,shieldSpriteColor:'#ffffff',
  obstacleColor:'#e05252',obstacleColorAlt:'#5282e0',obstacleSpriteColor:'#ffffff',
  playerDeathFrames:8,playerDeathDuration:900,playerDeathAnimDuration:720,playerDeathFadeStart:650,
  bgColor:'#1a1a2e',groundColor:'#2a2a40',particleColor:'#f5e642',backgroundSpriteColor:'#ffffff',
  backgroundMode:'perStage',stageBgGradients:null,seamScale:1,seamOverlayMode:'perStage',seamMulti:true,bgStageTint:'#ffffff',stageBgTints:null,
  stageColors:['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'],stageAccents:true,showGrid:false,stageCount:5,orientation:'portrait',
  soundEnabled:true,soundVolume:0.8,soundVolumes:null,audioSources:null,
  levelData:null,
  endCard:{scale:1,x:0,y:0,overlay:.55,showCta:true,ctaText:'PLAY NOW',ctaY:74},
};

W.RisePlayable={DEF,init(el,cfg,assets,cb){return new Game(el,cfg,assets||{},cb||{});}};
})(window);

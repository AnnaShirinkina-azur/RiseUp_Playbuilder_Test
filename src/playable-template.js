(function(W){'use strict';
let CW=390,CH=844;
const START_STAGE_INITIAL_TOP=-160;
// Empty transition band inserted before every numbered mini-level. At the
// default speed, half a stage creates a clear beat for the large numeral
// without freezing input, physics or animation.
const LEVEL_INTERLUDE_RATIO=.5;
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
function endCardActiveRect(){const w=CW>CH?Math.min(844,CW):CW;return{x:(CW-w)/2,y:0,w,h:CH};}
function lerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
function clamp(v,l,h){return Math.max(l,Math.min(h,v));}
// Default per-mini-level background gradients (bottom,top), cycled by stage
// index while no bg_stage{i} image is uploaded. Index 0 = Start scene.
const BG_GRADS=[['#39a2d8','#69c5ec'],['#ef5350','#f97f6f'],['#b03c02','#cc4a05'],['#f0a44c','#f9c178'],['#ee4630','#fa6a4b']];
function hr(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?[parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)]:[180,180,180];}
function rgba(h,a){const[r,g,b]=hr(h);return`rgba(${r},${g},${b},${a})`;}
function imgOk(s){return !!(s&&((s.complete&&s.naturalWidth>0)||(typeof s.getContext==='function'&&s.width>0&&s.height>0)));}
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
  oc.__seamCacheKey=key;
  if(_tintCache.size>64)_tintCache.clear();
  _tintCache.set(key,oc);
  return oc;
}
function drawTintedImage(ctx,img,x,y,w,h,color){
  if(!color||String(color).toLowerCase()==='#ffffff'){ctx.drawImage(img,x,y,w,h);return;}
  ctx.drawImage(tintedSprite(img,color),x,y,w,h);
}
const _seamPreviousColorCache=new Map();
function seamCompositedOnPreviousColor(img,color){
  if(!imgOk(img)||!color)return img;
  const key=(img.__seamCacheKey||img.src||'canvas')+'|prev|'+String(color).toLowerCase();
  const hit=_seamPreviousColorCache.get(key);if(hit)return hit;
  const w=Math.max(1,img.naturalWidth||img.width||1),h=Math.max(1,img.naturalHeight||img.height||1);
  const oc=document.createElement('canvas');oc.width=w;oc.height=h;
  const ox=oc.getContext('2d',{willReadFrequently:true});ox.drawImage(img,0,0,w,h);
  try{
    const px=ox.getImageData(0,0,w,h),d=px.data,rgb=hr(color);
    for(let i=0;i<d.length;i+=4){
      const a=d[i+3]/255;
      if(a<=.002){d[i+3]=0;continue;}
      d[i]=Math.round(d[i]*a+rgb[0]*(1-a));
      d[i+1]=Math.round(d[i+1]*a+rgb[1]*(1-a));
      d[i+2]=Math.round(d[i+2]*a+rgb[2]*(1-a));
      d[i+3]=Math.min(255,Math.round(d[i+3]*4));
    }
    ox.putImageData(px,0,0);
  }catch(e){return img;}
  if(_seamPreviousColorCache.size>64)_seamPreviousColorCache.clear();
  _seamPreviousColorCache.set(key,oc);return oc;
}
function pointInPoly(px,py,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;if(((yi>py)!=(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi+1e-9)+xi))inside=!inside;}return inside;}
function distToSegSq(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;let t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1);t=clamp(t,0,1);const x=ax+t*dx,y=ay+t*dy;return(px-x)**2+(py-y)**2;}
function circlePolyHit(cx,cy,cr,pts){if(pointInPoly(cx,cy,pts))return true;const r2=cr*cr;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if(distToSegSq(cx,cy,a.x,a.y,b.x,b.y)<=r2)return true;}return false;}
function _alphaChamfer(source,w,h){
  const inf=1e6,d=new Float32Array(w*h),rt=Math.SQRT2;
  for(let i=0;i<d.length;i++)d[i]=source[i]?0:inf;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;let v=d[i];
    if(x>0)v=Math.min(v,d[i-1]+1);
    if(y>0){v=Math.min(v,d[i-w]+1);if(x>0)v=Math.min(v,d[i-w-1]+rt);if(x+1<w)v=Math.min(v,d[i-w+1]+rt);}
    d[i]=v;
  }
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){
    const i=y*w+x;let v=d[i];
    if(x+1<w)v=Math.min(v,d[i+1]+1);
    if(y+1<h){v=Math.min(v,d[i+w]+1);if(x>0)v=Math.min(v,d[i+w-1]+rt);if(x+1<w)v=Math.min(v,d[i+w+1]+rt);}
    d[i]=v;
  }
  return d;
}
function buildAlphaCollider(img){
  if(!imgOk(img))return null;
  const iw=Math.max(1,img.naturalWidth||img.width||1),ih=Math.max(1,img.naturalHeight||img.height||1);
  const scale=Math.min(1,180/Math.max(iw,ih)),w=Math.max(24,Math.round(iw*scale)),h=Math.max(24,Math.round(ih*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d',{willReadFrequently:true});x.clearRect(0,0,w,h);x.drawImage(img,0,0,w,h);
  let data;try{data=x.getImageData(0,0,w,h).data;}catch(e){return null;}
  const solid=new Uint8Array(w*h),free=new Uint8Array(w*h);
  for(let i=0,j=0;i<data.length;i+=4,j++){solid[j]=data[i+3]>96?1:0;free[j]=solid[j]?0:1;}
  const ds=_alphaChamfer(solid,w,h),df=_alphaChamfer(free,w,h),sdf=new Float32Array(w*h);
  for(let i=0;i<sdf.length;i++)sdf[i]=solid[i]?-df[i]:ds[i];
  return {w,h,sdf};
}
function sampleAlphaSdf(c,x,y){
  if(!c)return 1e6;
  const ox=x<0?-x:(x>c.w-1?x-(c.w-1):0),oy=y<0?-y:(y>c.h-1?y-(c.h-1):0);
  const cx=clamp(x,0,c.w-1),cy=clamp(y,0,c.h-1),x0=Math.floor(cx),y0=Math.floor(cy),x1=Math.min(c.w-1,x0+1),y1=Math.min(c.h-1,y0+1),tx=cx-x0,ty=cy-y0;
  const a=c.sdf[y0*c.w+x0],b=c.sdf[y0*c.w+x1],d=c.sdf[y1*c.w+x0],e=c.sdf[y1*c.w+x1];
  const v=lerp(lerp(a,b,tx),lerp(d,e,tx),ty);
  return v+Math.hypot(ox,oy);
}
function layoutX(o){return o&&o.coordMode==='center'?CW/2+(o.x||0):(o&&o.x!=null?o.x:195);}
function layoutY(o){return o&&o.coordMode==='center'?CH/2+(o.y||0):(o&&o.y!=null?o.y:200);}
function obstacleDesignSize(){return 844;}
function obstacleDesignWidth(){return obstacleDesignSize();}
function obstacleAnchorBaseLocal(anchor){var a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1),ds=obstacleDesignSize();return {x:ah==='l'?-ds/2:(ah==='r'?ds/2:0),y:av==='t'?-ds/2:(av==='b'?ds/2:0)};}
function obstacleCenterLocal(o){
  if(o&&o.anchorOffsetX!=null&&o.anchorOffsetY!=null){
    var a=o.anchor||'cc',av=a.charAt(0),ah=a.charAt(1),w=parseFloat(o.w)||60,h=parseFloat(o.h)||60;
    var b=obstacleAnchorBaseLocal(a),ax=b.x+(parseFloat(o.anchorOffsetX)||0)*obstacleDesignWidth()/100,ay=b.y+(parseFloat(o.anchorOffsetY)||0)*obstacleDesignSize()/100;
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
function hudCounterScale(){
  // CTA and health are HUD elements, just like the height counter. Their size
  // follows the vertical game canvas and must not shrink when an item was
  // authored on an extra-wide landscape editor canvas (large designW).
  var k=CH/844;
  if(!isFinite(k)||k<=0)k=1;
  return clamp(k,.78,1.18);
}
function textDrawSize(L){var k=uiBaseScale(L);return {size:(L.baseSize||L.size||40)*k,strokeW:(L.baseStrokeW!=null?L.baseStrokeW:(L.strokeW||0))*k,letterSpacing:(L.baseLetterSpacing!=null?L.baseLetterSpacing:(L.letterSpacing||0))*k};}
function progressDrawSize(L){var k=uiBaseScale(L);return {w:(L.baseW||L.w||64)*k,h:(L.baseH||L.h||300)*k};}
function healthDrawSize(L){var k=hudCounterScale();return {heartW:(L.baseHeartW||L.heartW||36)*k,gap:(L.baseGap!=null?L.baseGap:(L.gap==null?6:L.gap))*k};}
function ctaDrawSize(L){var portrait=CW<CH,k=hudCounterScale()*(portrait?.8:1);return {w:(L.baseW||L.w||260)*k,h:(L.baseH||L.h||86)*k};}
function progressBoxLocal(L){var a=progressLocal(L),d=progressDrawSize(L);return anchorBoxLocal(L.anchor||'cl',a.x,a.y,d.w,d.h);}
function healthBoxLocal(L){var a=healthLocal(L),d=healthDrawSize(L),cnt=L.count||3,w=cnt*d.heartW+(cnt-1)*d.gap;return anchorBoxLocal(L.anchor||'tc',a.x,a.y,w,d.heartW);}
function ctaBoxLocal(L){var a=ctaLocal(L),d=ctaDrawSize(L),anchor=L.anchor||'bc';if(CW<CH)anchor=anchor.charAt(0)+'c';return anchorBoxLocal(anchor,CW<CH?0:a.x,a.y,d.w,d.h);}

// ── Text labels — level text with per-segment colors (must match index.html) ──
var FONT_CSS=W.RiseFontCSS={
  'Baloo2':"'Baloo2',sans-serif",
  'RobotoMono':"'Roboto Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
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
    this.tint=o.tint||o.color||'#e05252';this.color=this.tint;
    this.spr=o.sprite||null;
    this.imageSrc=o.imageSrc||null;
    this.customImg=makeImg(this.imageSrc);
    this.moveX=o.moveX||0;
    this.moveSpeed=o.moveSpeed||1800;
    this.t=o.phaseOffset||0;
    this.ix=this.x;this.iy=this.y;
    // Authored rotation from the level editor (radians). Kept separate from
    // `rot`, which is the physics spin accumulated after the protector push.
    this.baseRot=(parseFloat(o.rotation)||0)*Math.PI/180;
    this.interactable=o.interactable!==false;
    // `interactable` controls whether the protector may move the object.
    // Non-interactable artwork still remains a solid collider.
    this.solid=o.solid!==false;this._alphaCollider=null;this._alphaColliderTried=false;
    this.vx=0;this.vy=0;this.av=0;this.rot=0;this.live=true;this.kin=true;this.prevX=this.x;this.prevY=this.y;
    // Contact latches rearm only after the protector and obstacle separate.
    // This lets every new touch apply another impulse while preventing a
    // sustained overlap from applying the same hit on every animation frame.
    this.shieldTouching=false;
    this.protectorTouching=false;
    // Runtime-only role used by the Level 3 basket simulation.
    this.physicsPrefab=o.physicsPrefab||null;this.physicsGroupId=o.physicsGroupId||null;this.physicsRole=o.physicsRole||null;this.physicsCollisionMode=o.physicsCollisionMode||null;
    this.level3Role=null;this.level3Follow=null;this.level3Safe=false;this.level4Role=null;
  }
  reset(){this.x=this.ix;this.y=this.iy;this.prevX=this.x;this.prevY=this.y;this.t=0;this.vx=0;this.vy=0;this.av=0;this.rot=0;this.live=true;this.kin=true;this.shieldTouching=false;this.protectorTouching=false;}
  // Approximate collision radius for obstacle-vs-obstacle contacts.
  get cr(){return (this.w+this.h)*.27;}
  push(fx,fy,spin=0,allowDynamic=false){
    if(!this.interactable||!this.live||(!allowDynamic&&!this.kin))return;
    if(this.kin){
      this.kin=false;this.vx=fx;this.vy=fy;this.av=spin;
    }else{
      // A repeat hit changes the current trajectory instead of being ignored.
      // Keep a little existing momentum so glancing contacts still feel round,
      // while the new protector impulse remains clearly visible.
      this.vx=this.vx*.28+fx;this.vy=this.vy*.28+fy;this.av=this.av*.35+spin;
    }
  }
  update(dt,gravityModifier=1){
    this.prevX=this.x;this.prevY=this.y;
    // Level 3 basket/balls are integrated together by Stage so the U-shaped
    // basket can contain, scoop and throw the balls. Decorative inner ball
    // pieces follow their physical circle body there as well.
    if(this.level3Role)return;
    if(this.kin&&this.live&&this.moveX>0){
      this.t+=dt;this.x=this.ix+Math.sin(this.t/this.moveSpeed*Math.PI*2)*this.moveX;
    }
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
  _ensureAlphaCollider(){
    if(this._alphaCollider||this._alphaColliderTried)return this._alphaCollider;
    if(!imgOk(this.customImg))return null;
    this._alphaColliderTried=true;this._alphaCollider=buildAlphaCollider(this.customImg);return this._alphaCollider;
  }
  alphaCircleContact(cx,cy,cr){
    const c=this._ensureAlphaCollider();if(!c)return null;
    const ang=this.baseRot+(this.kin?0:this.rot),co=Math.cos(ang),si=Math.sin(ang),rx=cx-this.x,ry=cy-this.y;
    const lx=rx*co+ry*si,ly=-rx*si+ry*co,sx=(c.w-1)/Math.max(1,this.w),sy=(c.h-1)/Math.max(1,this.h);
    const gx=(lx/this.w+.5)*(c.w-1),gy=(ly/this.h+.5)*(c.h-1),sp=(sx+sy)*.5;
    const sd=sampleAlphaSdf(c,gx,gy)/Math.max(.0001,sp);if(sd>=cr)return null;
    const ex=sampleAlphaSdf(c,gx+1,gy)-sampleAlphaSdf(c,gx-1,gy),ey=sampleAlphaSdf(c,gx,gy+1)-sampleAlphaSdf(c,gx,gy-1);
    let nlx=ex*sx,nly=ey*sy,nl=Math.hypot(nlx,nly);
    if(nl<1e-5){nlx=lx||1;nly=ly;nl=Math.hypot(nlx,nly)||1;}
    nlx/=nl;nly/=nl;
    return {nx:nlx*co-nly*si,ny:nlx*si+nly*co,pen:Math.max(.01,cr-sd),distance:sd};
  }
  circleContact(cx,cy,cr){
    if(!this.live||!this.solid)return null;
    // Sprite obstacles use their alpha silhouette when it is available. Until
    // the image has loaded, fall back to the authored primitive collider so a
    // wall never temporarily becomes pass-through.
    if(this.customImg){const alpha=this._ensureAlphaCollider();if(alpha)return this.alphaCircleContact(cx,cy,cr);}
    const ang=this.baseRot+(this.kin?0:this.rot),co=Math.cos(ang),si=Math.sin(ang),rx=cx-this.x,ry=cy-this.y;
    const lx=rx*co+ry*si,ly=-rx*si+ry*co;
    if(this.shape==='circle'){
      const rr=Math.max(5,Math.min(this.w,this.h)*.5)+cr,d=Math.hypot(lx,ly);if(d>=rr)return null;
      const nx=d>1e-5?lx/d:1,ny=d>1e-5?ly/d:0;
      return {nx:nx*co-ny*si,ny:nx*si+ny*co,pen:Math.max(.01,rr-d),distance:d};
    }
    let pts=null;
    if(this.shape==='custom'&&this.points&&this.points.length>=3)pts=this.points.map(p=>({x:p.x*this.w,y:p.y*this.h}));
    else if(this.shape==='triangle')pts=[{x:0,y:-this.h/2},{x:this.w/2,y:this.h/2},{x:-this.w/2,y:this.h/2}];
    if(pts){
      let bestD2=Infinity,bx=0,by=0;
      for(let i=0;i<pts.length;i++){
        const a=pts[i],b=pts[(i+1)%pts.length],dx=b.x-a.x,dy=b.y-a.y;
        let t=((lx-a.x)*dx+(ly-a.y)*dy)/(dx*dx+dy*dy||1);t=clamp(t,0,1);
        const qx=a.x+t*dx,qy=a.y+t*dy,d2=(lx-qx)**2+(ly-qy)**2;
        if(d2<bestD2){bestD2=d2;bx=qx;by=qy;}
      }
      const inside=pointInPoly(lx,ly,pts),d=Math.sqrt(bestD2);
      if(!inside&&d>=cr)return null;
      let nx,ny;
      if(d>1e-5){nx=inside?(bx-lx)/d:(lx-bx)/d;ny=inside?(by-ly)/d:(ly-by)/d;}
      else{nx=lx||1;ny=ly;const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;}
      return {nx:nx*co-ny*si,ny:nx*si+ny*co,pen:Math.max(.01,inside?cr+d:cr-d),distance:inside?-d:d};
    }
    const hw=this.w/2,hh=this.h/2;
    const qx=clamp(lx,-hw,hw),qy=clamp(ly,-hh,hh),dx=lx-qx,dy=ly-qy,d=Math.hypot(dx,dy);
    const inside=Math.abs(lx)<hw&&Math.abs(ly)<hh;
    if(!inside&&d>=cr)return null;
    let nx,ny,pen;
    if(inside){
      const dl=lx+hw,dr=hw-lx,dtp=ly+hh,db=hh-ly,m=Math.min(dl,dr,dtp,db);
      if(m===dl){nx=-1;ny=0;}else if(m===dr){nx=1;ny=0;}else if(m===dtp){nx=0;ny=-1;}else{nx=0;ny=1;}
      pen=cr+m;
    }else if(d>1e-5){nx=dx/d;ny=dy/d;pen=cr-d;}
    else{nx=1;ny=0;pen=cr;}
    return {nx:nx*co-ny*si,ny:nx*si+ny*co,pen:Math.max(.01,pen),distance:inside?-pen:d};
  }
  hits(cx,cy,cr,includeDynamic=false,includeStatic=false){
    // `interactable` means movable by the protector, not non-solid. Static
    // image obstacles still collide with gameplay bodies when requested.
    if(!this.live||!this.solid||(!this.interactable&&!includeStatic))return false;
    if(!this.interactable&&includeStatic)return !!this.circleContact(cx,cy,cr);
    // Protector contact turns a kinematic obstacle into a flying body.
    // The protector should not keep re-hitting that same body every frame,
    // but the player ball must still be able to collide with it and lose a life.
    // The Level 3 basket is a tool, not a damaging full-box obstacle. Its
    // actual U-shaped walls are handled by the dedicated basket simulation.
    if(this.level3Role==='basket'||this.level3Role==='ballVisual')return false;
    // Level 3 balls damage the balloon, but are intentionally not launched by
    // direct shield contact: the player has to use the basket.
    if(this.level3Role==='ball'&&!includeDynamic)return false;
    if(!includeDynamic&&!this.kin)return false;
    // Level 3 ball sprites may be authored as custom image objects. Their
    // gameplay body is still circular, regardless of the editor shape type.
    if(this.shape==='circle'||this.level3Role==='ball'){const dx=this.x-cx,dy=this.y-cy,r=Math.max(5,Math.min(this.w,this.h)*.5);return dx*dx+dy*dy<(r+cr)*(r+cr);}
    const ang=this.baseRot+(this.kin?0:this.rot),co=Math.cos(ang),si=Math.sin(ang);
    if(this.shape==='custom'&&this.points&&this.points.length>=3){const pts=this.points.map(p=>{const lx=p.x*this.w,ly=p.y*this.h;return{x:this.x+lx*co-ly*si,y:this.y+lx*si+ly*co};});return circlePolyHit(cx,cy,cr,pts);}
    // Rotate the test point into the box's local (unrotated) frame, then do the
    // usual closest-point-on-AABB check. Circle radius is rotation-invariant.
    const rx=cx-this.x,ry=cy-this.y,lx=rx*co+ry*si,ly=-rx*si+ry*co;
    const nx=clamp(lx,-this.w/2,this.w/2),ny=clamp(ly,-this.h/2,this.h/2);
    return(lx-nx)**2+(ly-ny)**2<cr*cr;
  }
  draw(ctx,sy){
    if(!this.live)return;
    const dx=this.x,dy=this.y+sy;
    ctx.save();
    ctx.translate(dx,dy);
    const ang=this.baseRot+((this.level3Role==='basket'||this.level3Role==='ball'||this.level3Role==='ballVisual'||!this.kin)?this.rot:0);
    if(ang)ctx.rotate(ang);
    const im=imgOk(this.customImg)?this.customImg:this.spr;
    if(imgOk(im)){drawTintedImage(ctx,im,-this.w/2,-this.h/2,this.w,this.h,this.tint||this.color||((this.cfg&&this.cfg.obstacleSpriteColor)||'#ffffff'));}
    else{
      ctx.fillStyle=this.tint||this.color;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=2;
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
  constructor(idx,obs,color,labels,bgs,winLines){
    this.idx=idx;this.obs=obs;this.color=color;this.labels=labels||[];this.bgs=bgs||[];this.winLines=winLines||[];
    this.H=CH+6;this.worldY=idx*this.H;this.done=false;
    // Level 1 is a pair of horizontal side assemblies. Every item on one side
    // receives exactly the same X translation, so the large rectangle keeps
    // its authored gap to the triangles instead of overtaking them.
    this.level1Systems=[];
    this.cfg=(obs&&obs.length&&obs[0].cfg)||{};
    this.level3=null;this.level4=null;
    if(this._hasLevel1Physics())this._buildLevel1Groups();
    if(this._hasLevel3Physics())this._buildLevel3Physics();
    if(this._hasLevel4Physics())this._buildLevel4Physics();
  }
  reset(){
    this.done=false;this.obs.forEach(o=>o.reset());this.winLines.forEach(l=>{l.triggered=false;l.prevScreenY=null;});
    this.level1Systems=[];
    if(this._hasLevel1Physics())this._buildLevel1Groups();
    if(this._hasLevel3Physics())this._buildLevel3Physics();
    if(this._hasLevel4Physics())this._buildLevel4Physics();
  }
  resetAt(worldY){this.done=false;this.worldY=worldY;this.reset();}
  complete(){this.done=true;this.worldY=CH+this.H*4;}
  _hasLevel1Physics(){return this.idx===1||this.obs.some(o=>o.physicsPrefab==='level1_squeeze');}
  _hasLevel3Physics(){return this.idx===3||this.obs.some(o=>o.physicsPrefab==='level3_basket');}
  _hasLevel4Physics(){return this.idx===4;}
  _buildLevel4Physics(){
    if(!this._hasLevel4Physics())return;
    const movers=this.obs.filter(o=>o&&o.interactable!==false&&o.solid!==false);
    const ball=movers.find(o=>Math.max(o.w,o.h)/Math.max(1,Math.min(o.w,o.h))<1.35)||movers[0]||null;
    const walls=this.obs.filter(o=>o&&o!==ball&&o.interactable===false&&o.solid!==false);
    if(ball){ball.level4Role='ball';ball.shieldTouching=false;}
    for(const wall of walls)wall.level4Role='wall';
    this.level4={ball,walls,contactCooldown:0};
  }
  _buildLevel1Groups(){
    if(!this._hasLevel1Physics())return;
    const tagged=this.obs.filter(o=>o.physicsPrefab==='level1_squeeze');
    const buckets=new Map();
    if(tagged.length){for(const o of tagged){const key=o.physicsGroupId||'physics_level1';if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}}
    else buckets.set('legacy_level1',this.obs.slice());
    this.level1Systems=[];
    for(const items of buckets.values()){
      if(!items.length)continue;
      const minX=Math.min(...items.map(o=>o.ix)),maxX=Math.max(...items.map(o=>o.ix)),cx=(minX+maxX)/2;
      const groups={left:{items:[],dir:1,target:0},right:{items:[],dir:-1,target:0}};
      for(const o of items){const role=o.physicsRole;const side=role==='left'?'left':(role==='right'?'right':(o.ix<cx-1?'left':(o.ix>cx+1?'right':null)));if(side)groups[side].items.push(o);}
      let activationBottom=-Infinity;
      for(const side of ['left','right']){
        const g=groups[side];if(!g.items.length)continue;
        const nearest=Math.min(...g.items.map(o=>Math.abs(o.ix-cx)));g.target=g.dir*nearest*.9;
        const source=g.items.filter(o=>o.interactable!==false);for(const o of (source.length?source:g.items))activationBottom=Math.max(activationBottom,o.iy+o.h/2);
      }
      this.level1Systems.push({active:false,sideProgress:{left:0,right:0},groups,activationBottom:isFinite(activationBottom)?activationBottom:CH/2});
    }
  }
  refreshLevel1Groups(){if(!this._hasLevel1Physics())return;this._buildLevel1Groups();}
  _updateLevel1Squeeze(dt,speed,activationY){
    if(!this._hasLevel1Physics())return;if(!this.level1Systems.length)this._buildLevel1Groups();if(speed<=0)return;
    const step=Math.max(0,speed)*dt/1000;
    for(const sys of this.level1Systems){
      if(!sys.active&&this.worldY+sys.activationBottom>=activationY)sys.active=true;if(!sys.active)continue;
      for(const side of ['left','right']){const g=sys.groups&&sys.groups[side];if(!g||!g.items.length||Math.abs(g.target)<.001)continue;let p=clamp(sys.sideProgress[side]||0,0,1);p=Math.min(1,p+step/Math.abs(g.target));sys.sideProgress[side]=p;for(const o of g.items)if(o.kin&&o.live)o.x=o.ix+g.target*p;}
    }
  }
  _buildLevel3Physics(){
    if(!this._hasLevel3Physics())return;
    // The authored Level 3 prefab contains one wide U-shaped basket, eight
    // circle bodies and eight smaller decorative inner polygons placed on top
    // of those circles. Only the circles must participate in physics.
    const tagged=this.obs.filter(o=>o.physicsPrefab==='level3_basket');
    const pool=tagged.length?tagged:this.obs;
    const roleBasket=pool.filter(o=>o.physicsRole==='basket');
    const candidates=roleBasket.length?roleBasket:pool.filter(o=>o.interactable!==false&&o.w>150&&o.h>80);
    const basket=candidates.sort((a,b)=>b.w*b.h-a.w*a.h)[0]||null;
    // Older level data used primitive circles plus a decorative custom layer.
    // The current prefab stores each visible ball as one custom image object.
    // Prefer authored circles when they exist; otherwise promote compact,
    // near-square custom objects above the basket to circular physics bodies.
    const roleBalls=pool.filter(o=>o.physicsRole==='ball');
    const circleBalls=roleBalls.length?roleBalls:pool.filter(o=>o.interactable!==false&&o!==basket&&o.shape==='circle');
    const customBalls=pool.filter(o=>{
      if(o.interactable===false||o===basket||o.shape!=='custom')return false;
      const min=Math.min(o.w,o.h),max=Math.max(o.w,o.h),aspect=max/Math.max(1,min);
      const smallEnough=basket?max<=Math.max(84,basket.w*.36):max<=84;
      const aboveBasket=!basket||o.iy<=basket.iy+basket.h*.12;
      return min>=10&&smallEnough&&aspect<=1.35&&aboveBasket;
    });
    const balls=circleBalls.length?circleBalls:customBalls;
    const visuals=[];
    if(basket){
      basket.level3Role='basket';basket.level3Safe=true;basket.kin=false;
      basket.vx=0;basket.vy=0;basket.av=0;basket.rot=0;
    }
    for(const ball of balls){
      // Balls are suspended at their authored positions until the moving
      // U-basket physically touches them. Activation is tracked per ball so
      // one contact does not release the whole cluster at once.
      ball.level3Role='ball';ball.level3Activated=false;ball.kin=true;
      ball.vx=0;ball.vy=0;ball.av=0;ball.rot=0;
      // Match the inner prefab polygon by authored centre. It remains visible
      // but no longer creates a second collider at the same location.
      let best=null,bd=1e9;
      for(const o of pool){
        if(o===basket||o===ball||o.shape!=='custom'||o.w>=80)continue;
        const d=(o.ix-ball.ix)**2+(o.iy-ball.iy)**2;
        if(d<bd){bd=d;best=o;}
      }
      if(best&&bd<16){
        best.level3Role='ballVisual';best.level3Follow=ball;best.interactable=false;best.kin=true;
        visuals.push(best);
      }
    }
    const activeBottom=Math.max(...([basket].filter(Boolean).concat(balls)).map(o=>o.iy+o.h/2),CH/2);
    this.level3={basket,balls,visuals,active:false,touched:false,activeBottom,contactCooldown:0};
    this._syncLevel3Visuals();
  }
  _syncLevel3Visuals(){
    const l=this.level3;if(!l)return;
    for(const v of l.visuals){
      const b=v.level3Follow;if(!b)continue;
      v.x=b.x;v.y=b.y;v.rot=b.rot;v.live=b.live;
    }
  }
  _level3Walls(){
    const l=this.level3,b=l&&l.basket;if(!b)return [];
    // Ratios come from the opaque geometry of the authored Frame 20 PNG:
    // two tall side posts and one thick bottom bar, open at the top.
    const side=Math.max(18,b.w*.215),bottom=Math.max(22,b.h*.36);
    return [
      {x:-b.w/2+side/2,y:0,w:side,h:b.h},
      {x: b.w/2-side/2,y:0,w:side,h:b.h},
      {x:0,y:b.h/2-bottom/2,w:b.w,h:bottom}
    ];
  }
  _level3CircleRect(body,r,rect,basket,worldTop,dt,driveBody){
    const ang=basket.baseRot+basket.rot,co=Math.cos(ang),si=Math.sin(ang);
    const bx=basket.x,by=basket.y+worldTop;
    const wx=body.x,wy=body.y+worldTop;
    const dx=wx-bx,dy=wy-by;
    const lx=dx*co+dy*si,ly=-dx*si+dy*co;
    const qx=clamp(lx,rect.x-rect.w/2,rect.x+rect.w/2);
    const qy=clamp(ly,rect.y-rect.h/2,rect.y+rect.h/2);
    let nx=lx-qx,ny=ly-qy,dist=Math.hypot(nx,ny),insideDepth=0;
    if(dist>=r)return false;
    if(dist<1e-5){
      // Circle centre is inside a solid wall. Pick the cheapest exit axis and
      // include the distance to that edge in the separation depth; using only
      // the radius here would let a fast ball tunnel through the bottom bar.
      const dl=Math.abs(lx-(rect.x-rect.w/2)),dr=Math.abs(rect.x+rect.w/2-lx);
      const dtp=Math.abs(ly-(rect.y-rect.h/2)),db=Math.abs(rect.y+rect.h/2-ly);
      const m=Math.min(dl,dr,dtp,db);insideDepth=m;
      if(m===dl){nx=-1;ny=0;}else if(m===dr){nx=1;ny=0;}else if(m===dtp){nx=0;ny=-1;}else{nx=0;ny=1;}
      dist=0;
    }else{nx/=dist;ny/=dist;}
    const pen=insideDepth>0?r+insideDepth:r-dist;
    const nwx=nx*co-ny*si,nwy=nx*si+ny*co;
    if(driveBody){
      // Ball leaves the wall along its normal. It inherits the translating and
      // rotating basket velocity, which is what makes a quick reversal toss it.
      body.x+=nwx*pen;body.y+=nwy*pen;
      const crx=qx*co-qy*si,cry=qx*si+qy*co;
      const svx=basket.vx-basket.av*cry,svy=basket.vy+basket.av*crx;
      const rvx=body.vx-svx,rvy=body.vy-svy;
      const vn=rvx*nwx+rvy*nwy;
      if(vn<0){
        const bounce=.38,imp=-(1+bounce)*vn;
        body.vx+=nwx*imp;body.vy+=nwy*imp;
      }
      const tx=-nwy,ty=nwx;
      const vt=(body.vx-svx)*tx+(body.vy-svy)*ty;
      body.vx-=tx*vt*.08;body.vy-=ty*vt*.08;
      // Strong but bounded carry from the basket surface.
      body.vx+=svx*.055;body.vy+=svy*.055;
    }
    return {nwx,nwy,pen,qx,qy};
  }
  _updateLevel3(dt,gravityModifier=1){
    const l=this.level3;if(!l||!l.basket||!l.balls.length)return;
    if(!l.active&&this.worldY+l.activeBottom>=-24){
      l.active=true;
      for(const ball of l.balls){
        ball.level3Activated=false;ball.kin=true;
        ball.x=ball.ix;ball.y=ball.iy;ball.vx=0;ball.vy=0;ball.av=0;ball.rot=0;
      }
    }
    if(l.contactCooldown>0)l.contactCooldown-=dt;
    if(!l.active){this._syncLevel3Visuals();return;}
    const f=dt/16.6667,b=l.basket;
    // Until the protector reaches the level the basket stays locked to its
    // authored position and travels only with the stage. The balls remain
    // suspended at their authored positions until the basket touches each one.
    // After first protector contact the basket becomes a heavy dynamic body.
    if(!l.touched){
      b.x=b.ix;b.y=b.iy;b.vx=0;b.vy=0;b.av=0;b.rot=0;
    }else{
      b.vy+=.018*gravityModifier*f;
      b.x+=b.vx*f;b.y+=b.vy*f;b.rot+=b.av*f;
      b.vx*=Math.pow(.965,f);b.vy*=Math.pow(.975,f);b.av*=Math.pow(.955,f);
      b.av=clamp(b.av,-.085,.085);
    }
    const walls=this._level3Walls();
    const ballGravity=Math.max(0,parseFloat(this.cfg.level3BallGravity)||.34);
    for(const o of l.balls){
      if(!o.live)continue;
      const r=Math.max(5,Math.min(o.w,o.h)*.5);
      if(!o.level3Activated){
        // A locked ball is a visual/static target: no gravity, no drift and no
        // rotation. Only a real overlap with a basket wall releases it.
        o.kin=true;o.x=o.ix;o.y=o.iy;o.vx=0;o.vy=0;o.av=0;o.rot=0;
        // Before the protector has engaged the basket, authored near-tangent
        // placement must not count as gameplay contact.
        if(!l.touched)continue;
        let contactWall=null;
        for(const wall of walls){
          const hit=this._level3CircleRect(o,r,wall,b,this.worldY,dt,false);
          if(!hit)continue;
          // Existing near-tangent authoring is not enough: the wall must be
          // moving into the ball. This prevents a mere shield tap on the
          // basket from releasing balls that the basket has not scooped yet.
          const ang=b.baseRot+b.rot,co=Math.cos(ang),si=Math.sin(ang);
          const crx=hit.qx*co-hit.qy*si,cry=hit.qx*si+hit.qy*co;
          const svx=b.vx-b.av*cry,svy=b.vy+b.av*crx;
          const approach=svx*hit.nwx+svy*hit.nwy;
          if(approach>.005){contactWall=wall;break;}
        }
        if(!contactWall)continue;
        o.level3Activated=true;o.kin=false;
        // Resolve the first contact immediately and inherit the basket surface
        // velocity, so the release feels like a physical scoop rather than a
        // delayed gravity switch.
        this._level3CircleRect(o,r,contactWall,b,this.worldY,dt,true);
      }
      o.vy+=ballGravity*gravityModifier*f;
      o.x+=o.vx*f;o.y+=o.vy*f;o.rot+=o.av*f;
      o.vx*=Math.pow(.997,f);o.vy*=Math.pow(.998,f);o.av*=Math.pow(.98,f);
      if(o.y>CH+700||o.y<-900||o.x<-900||o.x>CW+900)o.live=false;
    }
    // A few inexpensive solver iterations keep the small balls inside the U
    // even when the player flicks the basket quickly.
    for(let it=0;it<3;it++){
      for(const o of l.balls){
        if(!o.live||!o.level3Activated)continue;
        const r=Math.max(5,Math.min(o.w,o.h)*.5);
        for(const w of walls)this._level3CircleRect(o,r,w,b,this.worldY,dt,true);
      }
      for(let i=0;i<l.balls.length;i++){
        const A=l.balls[i];if(!A.live)continue;
        const ar=Math.max(5,Math.min(A.w,A.h)*.5);
        for(let j=i+1;j<l.balls.length;j++){
          const B=l.balls[j];if(!B.live)continue;
          const aFree=!!A.level3Activated,bFree=!!B.level3Activated;
          // Two suspended balls stay exactly at their authored positions.
          if(!aFree&&!bFree)continue;
          const br=Math.max(5,Math.min(B.w,B.h)*.5),dx=B.x-A.x,dy=B.y-A.y,rr=ar+br;
          const d2=dx*dx+dy*dy;if(d2>=rr*rr)continue;
          const d=Math.sqrt(d2)||1,nx=dx/d,ny=dy/d,overlap=rr-d;
          if(aFree&&bFree){
            const ov=overlap*.5;
            A.x-=nx*ov;A.y-=ny*ov;B.x+=nx*ov;B.y+=ny*ov;
            const rel=(B.vx-A.vx)*nx+(B.vy-A.vy)*ny;
            if(rel<0){const imp=-rel*.68;A.vx-=nx*imp;A.vy-=ny*imp;B.vx+=nx*imp;B.vy+=ny*imp;}
          }else if(aFree){
            // B is still suspended, so resolve only the released body A.
            A.x-=nx*overlap;A.y-=ny*overlap;
            const vn=A.vx*nx+A.vy*ny;
            if(vn>0){A.vx-=nx*vn*1.45;A.vy-=ny*vn*1.45;}
          }else{
            // A is still suspended, so resolve only the released body B.
            B.x+=nx*overlap;B.y+=ny*overlap;
            const vn=B.vx*nx+B.vy*ny;
            if(vn<0){B.vx-=nx*vn*1.45;B.vy-=ny*vn*1.45;}
          }
        }
      }
    }
    this._syncLevel3Visuals();
  }
  _resolveLevel4Walls(dt){
    const l=this.level4,b=l&&l.ball;if(!b||!b.live||b.kin||!l.walls.length)return false;
    const r=Math.max(6,Math.min(b.w,b.h)*.43);let touched=false;
    // Several lightweight solver passes keep the large ball outside thin,
    // alpha-shaped static walls even during a fast protector movement.
    for(let pass=0;pass<4;pass++){
      let passHit=false;
      for(const wall of l.walls){
        if(!wall.live)continue;
        const hit=wall.circleContact(b.x,b.y,r);if(!hit)continue;
        passHit=true;touched=true;b.x+=hit.nx*hit.pen;b.y+=hit.ny*hit.pen;
        const vn=b.vx*hit.nx+b.vy*hit.ny;
        if(vn<0){const bounce=.08;b.vx-=hit.nx*vn*(1+bounce);b.vy-=hit.ny*vn*(1+bounce);}
        const tx=-hit.ny,ty=hit.nx,vt=b.vx*tx+b.vy*ty;b.vx-=tx*vt*.025;b.vy-=ty*vt*.025;
      }
      if(!passHit)break;
    }
    return touched;
  }
  level4ShieldContact(shield,worldTop,dt){
    const l=this.level4,b=l&&l.ball;if(!b||!b.live)return false;
    if(l.contactCooldown>0)l.contactCooldown-=dt;
    const bx=b.x,by=b.y+worldTop,dx=bx-shield.x,dy=by-shield.y;
    const br=Math.max(6,Math.min(b.w,b.h)*.43),rr=br+shield.r,d=Math.hypot(dx,dy);
    if(d>=rr){b.shieldTouching=false;l.justTouched=false;return false;}
    const wasTouching=!!b.shieldTouching;
    let nx,ny;if(d<1e-5){nx=0;ny=-1;}else{nx=dx/d;ny=dy/d;}
    const pen=rr-d;
    if(b.kin){b.kin=false;b.vx=0;b.vy=0;b.av=0;}
    // Continuous support instead of repeated kicks: remove penetration and
    // cancel only the closing normal velocity relative to the protector.
    b.x+=nx*pen;b.y+=ny*pen;
    const svx=shield.vx||0,svy=shield.vy||0,rvx=b.vx-svx,rvy=b.vy-svy,vn=rvx*nx+rvy*ny;
    if(vn<0){const restitution=.06,imp=-(1+restitution)*vn;b.vx+=nx*imp;b.vy+=ny*imp;}
    const tx=-ny,ty=nx,vt=(b.vx-svx)*tx+(b.vy-svy)*ty;
    b.vx-=tx*vt*.11;b.vy-=ty*vt*.11;
    // Match the moving support gradually; no velocity is added every frame,
    // so the protector can hold the ball indefinitely without launching it.
    b.vx=lerp(b.vx,svx,.10);b.vy=lerp(b.vy,svy,.10);
    b.av*=.9;b.shieldTouching=true;l.justTouched=!wasTouching;
    this._resolveLevel4Walls(dt);
    return true;
  }
  level3ShieldContact(shield,worldTop){
    const l=this.level3;if(!l||!l.active||!l.basket||!l.basket.live)return false;
    const b=l.basket,walls=this._level3Walls();let touched=false;
    // Use a temporary circle body in stage-local coordinates so the same
    // oriented wall test can resolve the protector against each U wall.
    const p={x:shield.x,y:shield.y-worldTop};
    for(const w of walls){
      const hit=this._level3CircleRect(p,shield.r,w,b,worldTop,16.6667,false);
      if(!hit)continue;touched=true;l.touched=true;
      // Move the basket away from the protector rather than teleporting the
      // protector. This makes the U feel like a physical tool being pushed.
      b.x-=hit.nwx*hit.pen*.88;b.y-=hit.nwy*hit.pen*.88;
      const power=Math.max(.2,parseFloat(this.cfg.level3BasketPower)||1.35);
      const relx=(shield.vx||0)-b.vx,rely=(shield.vy||0)-b.vy;
      const toward=Math.max(0,-(relx*hit.nwx+rely*hit.nwy));
      // Follow the protector's swipe velocity instead of adding it every frame;
      // this keeps continuous contact controllable and prevents runaway speed.
      const targetVx=(shield.vx||0)*power,targetVy=(shield.vy||0)*power;
      b.vx=lerp(b.vx,targetVx,.34)-hit.nwx*Math.min(5.5,.8+toward*.18)*power;
      b.vy=lerp(b.vy,targetVy,.34)-hit.nwy*Math.min(5.5,.8+toward*.18)*power;
      const ang=b.baseRot+b.rot,co=Math.cos(ang),si=Math.sin(ang);
      const rx=hit.qx*co-hit.qy*si,ry=hit.qx*si+hit.qy*co;
      const fx=-hit.nwx*(toward*.4+1),fy=-hit.nwy*(toward*.4+1);
      b.av=clamp(b.av+(rx*fy-ry*fx)/Math.max(9000,b.w*b.w+b.h*b.h)*power,-.085,.085);
    }
    return touched;
  }
  update(dt,fallSpeed=0,gravityModifier=1,level1CenterSpeed=0,level1ActivationY=CH){
    if(this.done)return;
    // Stages are falling waves: obstacle local layouts stay intact while the
    // whole level band moves downward relative to the player.
    this.worldY+=fallSpeed*dt;
    this.obs.forEach(o=>o.update(dt,gravityModifier));
    this._resolveLevel4Walls(dt);
    this._updateLevel1Squeeze(dt,level1CenterSpeed,level1ActivationY);
    this._updateLevel3(dt,gravityModifier);
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
  resolveShieldStatics(shield,top){
    if(this.done||!shield||shield.dead)return false;
    let touched=false;
    for(let pass=0;pass<4;pass++){
      let passHit=false;
      for(const o of this.obs){
        if(!o||!o.live||o.solid===false||o.interactable!==false||o.level3Role==='ballVisual')continue;
        const hit=o.circleContact(shield.x,shield.y-top,shield.r);if(!hit)continue;
        passHit=true;touched=true;
        shield.x+=hit.nx*hit.pen;shield.y+=hit.ny*hit.pen;
        const vn=shield.vx*hit.nx+shield.vy*hit.ny;
        if(vn<0){shield.vx-=hit.nx*vn;shield.vy-=hit.ny*vn;}
      }
      if(!passHit)break;
    }
    return touched;
  }
  hit(px,py,pr,top,includeDynamic=false,includeStatic=false){if(this.done)return null;for(const o of this.obs){if(o.hits(px,py-top,pr,includeDynamic,includeStatic))return o;}return null;}
  hits(px,py,pr,top,includeDynamic=false,includeStatic=false){
    if(this.done)return [];
    const out=[];
    for(const o of this.obs){if(o.hits(px,py-top,pr,includeDynamic,includeStatic))out.push(o);}
    return out;
  }
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
    this.count=Math.max(1,Math.round((cfg&&cfg.balloonCount)||1));
  }
  get r(){return 20*this.cfg.playerSize;}
  get worldY(){return this.travel;}
  _rows(){const n=Math.max(1,this.count|0);if(n<=2)return [n];const bottom=Math.ceil(n/2);return [n-bottom,bottom];}
  offsets(){const r=this.r,rows=this._rows(),gap=(this.cfg.balloonSpacing!=null?this.cfg.balloonSpacing:30),dx=2*r+gap,dy=2*r+gap,out=[];for(let ri=0;ri<rows.length;ri++){const cnt=rows[ri],rowW=(cnt-1)*dx;for(let ci=0;ci<cnt;ci++)out.push({dx:-rowW/2+ci*dx,dy:ri*dy});}return out;}
  points(){return this.offsets().map(p=>({x:this.x+p.dx,y:this.y+p.dy}));}
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
    const offs=this.offsets();
    if(this.dead){
      const al=lerp(1,0,this.da),sc=lerp(1,.05,this.da);
      offs.forEach(p=>{
        if(this._paintDeath(ctx,p.dx,p.dy))return;
        ctx.save();ctx.globalAlpha=al;
        ctx.translate(this.x+p.dx,this.y+p.dy);ctx.scale(sc,sc);
        this._paint(ctx,0,0);ctx.restore();
      });
      return;
    }
    const pop=this.ra<1?(.5+.5*Math.sin(this.ra*Math.PI)):1;
    const al=this.flash>0?(.5+.5*Math.sin(this.flash*.04)):1;
    offs.forEach(p=>{ctx.save();ctx.translate(this.x+p.dx,this.y+p.dy);ctx.scale(pop,pop);ctx.globalAlpha=al;this._paint(ctx,0,0);ctx.restore();});
  }
  _paintDeath(ctx,ox,oy){
    ox=ox||0;oy=oy||0;
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
    ctx.translate(this.x+ox+sway,this.y+oy+r*.15);
    ctx.rotate(rot);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0,-r*.05,r*.92,r*1.18,0,0,Math.PI*2);
    ctx.clip();
    // Death frames use the same player tint as the living balloon. Tint the
    // complete sprite sheet once through the shared cache, then crop the
    // active frame from the tinted sheet so animation timing stays unchanged.
    const deathSheet=(!this.cfg.playerSpriteColor||String(this.cfg.playerSpriteColor).toLowerCase()==='#ffffff')
      ?sheet:tintedSprite(sheet,this.cfg.playerSpriteColor);
    ctx.drawImage(deathSheet,fi*frameW,0,frameW,frameH,-w/2,-h*.58,w,h);
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
  _revealAlpha(mode){if(mode==='tap')return this._startedAt?clamp((Date.now()-this._startedAt)/400,0,1):0;if(mode==='death')return this._firstDeathAt?clamp((Date.now()-this._firstDeathAt)/400,0,1):0;return 1;}

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
      let obs=[],labels=[],bgs=[],winLines=[];
      if(hasLD&&Array.isArray(ld[si])&&ld[si].length>0){
        ld[si].forEach(o=>{
          if(o&&o.kind==='text'){labels.push(o);return;}
          if(o&&o.kind==='progress'){var po=Object.assign({},o);po.flaskImg=makeImg(po.flaskSrc);po.fillImg=makeImg(po.fillSrc);this.progressBars.push(po);return;}
          if(o&&o.kind==='health'){var ho=Object.assign({},o);ho.count=Math.max(1,parseInt(this.cfg.lives,10)||ho.count||3);ho.heartImg=makeImg(ho.heartSrc||this.cfg.defaultHeartSrc);ho.bgImg=ho.bgSrc?makeImg(ho.bgSrc):null;ho.breakLImg=ho.breakLSrc?makeImg(ho.breakLSrc):null;ho.breakRImg=ho.breakRSrc?makeImg(ho.breakRSrc):null;this.healthBars.push(ho);return;}
          if(o&&o.kind==='cta'){var co=Object.assign({},o);co.bgImg=makeImg(co.bgSrc);co.textImg=makeImg(co.textSrc);this.ctaButtons.push(co);return;}
          if(o&&o.kind==='tutorial'){this.tutorialObj=Object.assign({},o);return;}
          if(o&&o.kind==='winTrigger'){winLines.push({y:layoutY(o),triggered:false,prevScreenY:null});return;}
          if(o&&o.kind==='bg'){bgs.push(new BgImg(o,this._spr('bgimg_'+o.imgId)));return;}
          const ob=new Obs({...o,cfg:c,tint:o.tint||o.color||(si%2===0?c.obstacleColor:c.obstacleColorAlt),color:o.tint||o.color||(si%2===0?c.obstacleColor:c.obstacleColorAlt)});
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
      this.stages.push(new Stage(si,obs,c.stageAccents===false?null:sc[si%sc.length],labels,bgs,winLines));
    }
  }

  _reset(){
    this.camY=0;
    this.state='start';
    this._startedAt=0;this._firstDeathAt=0;this._heartBreakAt=0;this._heartBreakIdx=-1;this._breakPauseT=0;this._pendingLoseAfterBreak=false;this._afterDeathDone=false;
    this.lives=this.cfg.lives;
    this.si=0;
    this.dtimer=0;this.fadeA=0;this.fadeDir=0;
    this.endA=0;this.isWin=false;
    this.tutA=0;this.tutT=0;this.tutDone=false;
    this.tutPhase='wait';this.tutPhaseT=0;this._tutCruiseSpeed=0;
    this.tutBlocks=null;this._tutAnchor=null;this._tutSmashed=false;this._tutorialFailed=false;
    this.hpA=0;this.hpT=0;
    this.fx=new FX();
    this.shield=new Shield(this.cfg);
    this.ball=new Ball(this.cfg);
    this.shield.spr=this._spr('shield')||makeImg(this.cfg.defaultShieldSrc);
    this.ball.spr=this._spr('player')||makeImg(this.cfg.defaultPlayerSrc);
    this.ball.deathSpr=this._spr('player_death')||makeImg(this.cfg.defaultPlayerDeathSrc);
    this._resetFallingStages();
    this.completedStages=0;
    // Large Rise Up-style level numerals. Each mini-level shows its number
    // once, as soon as the stage begins entering the viewport after tutorial.
    this._shownLevelNumbers=new Set();
    this._levelNumberIndex=0;
    this._levelNumberT=0;
    this._levelNumberDuration=1100;
    // Win Card is controlled by one authored, invisible win line placed on
    // Start, any mini-level or Finish scene. The legacy Level 04 store trigger remains available when
    // Win Card is disabled.
    this._level4StoreTriggered=false;
    this._level4WinTriggered=false;
    this._respawnStageIndex=1;
    // Height HUD starts at the configured real-world value and advances by
    // actual world travel measured in normal-stage heights. Each numbered
    // level stores the accumulator value at the entrance to its interlude, so
    // a checkpoint respawn restores the height at the beginning of the failed
    // level instead of always returning to the global 66 ft start value.
    this._heightTravelStages=0;
    this._heightLevelStarts=Object.create(null);
    this._respawnHeightStages=0;
    this._heightArrow=null;
    // Lose Card uses a 10 -> 1 countdown on the supplied round badge. Win
    // Card is opened independently when Level 04 is reached and its toggle is on.
    this._loseCountdownStart=0;
    this._loseCtaRect=null;
    this._endCountdownBadge=null;
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
        // Once Level 4 is current, its first new tap is the conversion action.
        // This check precedes shield dragging so the same gesture cannot also
        // move the protector or create a second interaction.
        if(this._isLevel4TapActive()){this._triggerLevel4Store('tap');return;}
        if(this._pointInCta(x,y)){this.cb.onCTA&&this.cb.onCTA();return;}
        if(this.tutDone||this.tutPhase==='learn')this.shield.down(x,y);
      }
      if(this.state==='endcard'){
        if(this.isWin&&this._pointInWinEndCta(x,y)){
          this.cb.onCTA&&this.cb.onCTA({source:'win_play_now'});
        }else if(!this.isWin&&this._pointInLoseEndCta(x,y)){
          this.cb.onCTA&&this.cb.onCTA({source:'lose_try_again'});
        }
      }
    };
    const move=(x,y)=>{
      if(this.state==='playing'&&(this.tutDone||this.tutPhase==='learn')){this.shield.move(x,y);}
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
    // First wave starts just above the visible area. Numbered mini-levels are
    // separated by a real empty band equal to half a normal stage. FINISH
    // follows level 4 directly, so no unused blank screen is added at the end.
    const H=this.stages[0].H, gap=this._levelInterludeHeight();
    const firstTop=START_STAGE_INITIAL_TOP;
    this.stages.forEach((s,i)=>s.resetAt(firstTop-i*H-this._levelGapCountBefore(i)*gap));
    this.spawnTop=Math.min(...this.stages.map(s=>s.worldY));
    this.completedStages=0;
    this.si=0;
  }
  _resetFallingStagesFrom(levelIndex){
    // Respawn at the checkpoint immediately before the failed numbered level.
    // Completed stages stay parked below the screen; the failed level and all
    // following stages are rebuilt in their authored order above a half-stage
    // empty corridor that already surrounds the player on fade-in.
    const last=this._lastMiniIndex();
    const target=Math.max(1,Math.min(last,parseInt(levelIndex,10)||1));
    const H=this.stages[0].H,gap=this._levelInterludeHeight();
    const corridorTop=CH*.34;
    const targetTop=corridorTop-H;
    const targetGapCount=this._levelGapCountBefore(target);
    this.stages.forEach((stage,i)=>{
      if(i<target){stage.complete();return;}
      const rel=i-target;
      const extraGaps=this._levelGapCountBefore(i)-targetGapCount;
      stage.resetAt(targetTop-rel*H-extraGaps*gap);
    });
    this.spawnTop=Math.min(...this.stages.filter(s=>!s.done).map(s=>s.worldY));
    this.completedStages=target;
    this.si=target;
    this.cb.onStageChange&&this.cb.onStageChange(target);
  }
  _start(){
    this.state='playing';
    this._startedAt=this._startedAt||Date.now();
    if(this.cfg.tutorialEnabled===false){
      // No tutorial: go straight to gameplay, no learn phase, no delay.
      this.tutDone=true;this.tutA=0;this.tutPhase='done';
      this.ball.start(this._ballSpeed(),this.camY);
      this.snd.play('bgm');
      return;
    }
    this.tutPhase='fly';this.tutPhaseT=0;this.tutT=0;this.tutA=0;
    this._tutCruiseSpeed=this._ballSpeed()*.72;
    this.ball.start(this._tutCruiseSpeed,this.camY);
    this.snd.play('bgm');
  }

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
  _lastMiniIndex(){return Math.min(this.stages.length-2,Math.max(1,parseInt(this.cfg.stageCount,10)||1));}
  _levelInterludeHeight(){
    const H=this.stages&&this.stages[0]?this.stages[0].H:CH;
    return H*LEVEL_INTERLUDE_RATIO;
  }
  _levelGapCountBefore(stageIndex){
    // Add a gap before levels 1..N, but not between the last numbered level
    // and the FINISH scene. This yields exactly N numbered interludes.
    return Math.max(0,Math.min(stageIndex,this._lastMiniIndex()));
  }
  _levelGapRect(levelIndex){
    const stage=this.stages[levelIndex];
    if(!stage||stage.done||levelIndex<1||levelIndex>this._lastMiniIndex())return null;
    const h=this._levelInterludeHeight();
    return {top:stage.worldY+stage.H,h,bottom:stage.worldY+stage.H+h};
  }
  _rememberHeightCheckpoint(levelIndex){
    const i=Math.max(1,Math.min(this._lastMiniIndex(),parseInt(levelIndex,10)||1));
    if(!this._heightLevelStarts)this._heightLevelStarts=Object.create(null);
    if(!Object.prototype.hasOwnProperty.call(this._heightLevelStarts,i)){
      const travel=Number(this._heightTravelStages);
      this._heightLevelStarts[i]=isFinite(travel)?Math.max(0,travel):0;
    }
    return this._heightLevelStarts[i];
  }
  _heightCheckpointFor(levelIndex){
    const i=Math.max(1,Math.min(this._lastMiniIndex(),parseInt(levelIndex,10)||1));
    if(this._heightLevelStarts&&Object.prototype.hasOwnProperty.call(this._heightLevelStarts,i)){
      const saved=Number(this._heightLevelStarts[i]);
      if(isFinite(saved))return Math.max(0,saved);
    }
    // Level 1 can fail during the tutorial before its numbered interlude has
    // crossed the checkpoint line. Its authored start is the global baseline.
    if(i===1)return 0;
    // Defensive fallback for unusual overlapping stages: use the nearest
    // previously recorded level start rather than jumping all the way to 66.
    for(let n=i-1;n>=1;n--){
      if(this._heightLevelStarts&&Object.prototype.hasOwnProperty.call(this._heightLevelStarts,n)){
        const saved=Number(this._heightLevelStarts[n]);
        if(isFinite(saved))return Math.max(0,saved);
      }
    }
    return Math.max(0,Number(this._heightTravelStages)||0);
  }

  _updateLevelNumber(dt){
    if(this.state!=='playing'||!this.tutDone){this._levelNumberIndex=0;this._levelNumberT=0;return;}
    // The numeral is screen-space, but its lifetime is controlled by the real
    // half-stage empty band. It stays fixed while that band crosses the label
    // line, so faster/slower gameplay naturally changes the transition time.
    const labelY=CH*.34;
    let active=0;
    for(let i=1;i<=this._lastMiniIndex();i++){
      const gap=this._levelGapRect(i);
      if(gap&&gap.top<=labelY&&gap.bottom>=labelY){active=i;break;}
    }
    this._levelNumberIndex=active;
    this._levelNumberT=active?1:0;
    if(active){
      this._shownLevelNumbers.add(active);
      // The respawn layout places this same interlude edge back on labelY, so
      // saving here keeps the visual height and physical checkpoint aligned.
      this._rememberHeightCheckpoint(active);
    }
  }

  _drawLevelNumeral(ctx,value,y,a){
    if(a<=0)return;
    const size=Math.round(Math.min(CW,CH)*.18);
    const family=(typeof RiseFontCSS!=='undefined'&&RiseFontCSS.RobotoMono)?RiseFontCSS.RobotoMono:'"Roboto Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    const numeric=parseInt(value,10);
    // The intro corridor remains `0`; numbered gameplay corridors use a
    // fixed two-character label: 01, 02, 03, 04, ...
    const label=numeric===0?'0':String(isFinite(numeric)?numeric:value).padStart(2,'0');
    ctx.save();
    ctx.globalAlpha=a;
    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='700 '+size+'px '+family;
    ctx.shadowColor='rgba(0,0,0,.08)';ctx.shadowBlur=Math.max(2,size*.035);ctx.shadowOffsetY=Math.max(1,size*.015);
    ctx.fillText(label,CW/2,y);
    ctx.restore();
  }


  _drawLevelNumber(ctx){
    const i=this._levelNumberIndex;
    if(this.state!=='playing'||!i||this._levelNumberT<=0)return;
    const gap=this._levelGapRect(i);if(!gap)return;
    const y=CH*.34,p=clamp((y-gap.top)/Math.max(1,gap.h),0,1);
    // Fade only near the physical edges of the transition band. The middle
    // remains fully readable for most of the half-screen pause.
    const edge=.16,a=Math.min(1,p/edge,(1-p)/edge)*.62;
    this._drawLevelNumeral(ctx,i,y,a);
  }

  _level4Index(){return 4;}
  _level4FirstObstacle(){
    const s=this.stages[this._level4Index()];
    return s&&s.obs?s.obs.find(o=>o&&o.interactable!==false&&o.live)||null:null;
  }
  _isLevel4Reached(){
    const i=this._level4Index(),s=this.stages[i];
    if(this.state!=='playing'||!this.tutDone||!s||s.done)return false;
    // Geometry is used instead of `si`: the stage counter advances only after
    // the previous band has completely left the viewport, which is too late
    // for the authored Level 04 entrance.
    const playerY=this.ball?this.ball.y:CH*.8;
    return s.worldY+s.H>=playerY;
  }
  _triggerWinLineIfReady(){
    if(this._level4WinTriggered||!this._endCardsEnabled('win')||this.state!=='playing'||!this.tutDone)return false;
    const playerY=this.ball?this.ball.y:CH*.8;
    for(let i=0;i<this.stages.length;i++){
      const stage=this.stages[i];if(!stage||stage.done||!stage.winLines||!stage.winLines.length)continue;
      for(const line of stage.winLines){
        if(line.triggered)continue;
        const screenY=stage.worldY+line.y,prev=line.prevScreenY;line.prevScreenY=screenY;
        // Level bands move downward. Trigger exactly when the authored line
        // crosses the player's gameplay height; an already-lower line also
        // triggers on its first active frame.
        if((prev==null&&screenY>=playerY)||(prev!=null&&prev<playerY&&screenY>=playerY)){
          line.triggered=true;this._level4WinTriggered=true;this._level4StoreTriggered=true;
          this.shield.up();this.si=i;this.cb.onStageChange&&this.cb.onStageChange(i);this._win();return true;
        }
      }
    }
    return false;
  }
  _isLevel4TapActive(){
    // When Win Card is enabled, the authored Win line owns the completion
    // flow; Level 04 tap/collision must not bypass it with a store redirect.
    if(this._endCardsEnabled('win'))return false;
    return !this._level4StoreTriggered&&this._isLevel4Reached();
  }
  _triggerLevel4Store(reason){
    if(this._endCardsEnabled('win')||this._level4StoreTriggered)return false;
    this._level4StoreTriggered=true;
    this.shield.up();
    try{if(this.cb.onCTA)this.cb.onCTA({source:'level4_'+reason});}catch(e){}
    return true;
  }

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
        highest-=H+this._levelInterludeHeight();
        this.completedStages++;
        // Win as soon as the FINISH scene is the one on screen (i.e. start +
        // all mini-levels have passed), so the ball flies up through the
        // finish scene — not after it has already fallen past the player.
        const hasAuthoredWinLine=this.stages.some(s=>s&&s.winLines&&s.winLines.length);
        // Without an authored line, preserve the legacy behaviour and win as
        // soon as Finish enters. With a line, let every scene keep moving until
        // that exact line crosses the player — including a line inside Finish.
        if(this.completedStages>=this.stages.length-1&&!hasAuthoredWinLine){
          this.si=this.stages.length-1;
          this.cb.onStageChange&&this.cb.onStageChange(this.si);
          this._win();
          return;
        }
        // Safety fallback: if a malformed/out-of-range authored line somehow
        // misses the player, never leave the playable running after Finish.
        if(this.completedStages>=this.stages.length&&hasAuthoredWinLine){
          this.si=this.stages.length-1;
          this.cb.onStageChange&&this.cb.onStageChange(this.si);
          this._win();
          return;
        }
        // Do not recycle completed mini-levels: playable flow is
        // START stage -> exactly stageCount mini-levels -> FINISH stage.
        st.complete();
        this.si=this.completedStages;
        // Usually the numbered interlude already recorded this checkpoint.
        // Keep a fallback here for very fast/custom layouts that skip it.
        if(this.si>=1&&this.si<=this._lastMiniIndex())this._rememberHeightCheckpoint(this.si);
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
    const tutorialLocksWorld=(st==='playing'&&!this.tutDone&&this.tutPhase==='learn');
    if((st==='playing'||st==='respawning'||st==='won')&&!tutorialLocksWorld){
      let fall=this._obstacleFallSpeed();
      // During the opening flight the level visibly moves past the balloon.
      // In the brake phase the world speed eases down together with the balloon,
      // so the tutorial does not pop in over a static scene.
      if(st==='playing'&&!this.tutDone){
        if(this.tutPhase==='fly') fall*=0.82;
        else if(this.tutPhase==='brake'){
          const bk=clamp(this.tutPhaseT/400,0,1);
          const ease=bk*bk*(3-2*bk);
          fall*=lerp(0.82,0.03,ease);
        }
      }
      this.stages.forEach(s=>s.update(dt,fall,this.cfg.gravityModifier,this.cfg.level1CenterSpeed,this.ball.y-this.ball.r));
      // Keep the whole tutorial inside the fixed START zone. While the intro
      // is active, the first playable level must not enter the viewport.
      // All stage bands move together, so clamp their shared travel exactly
      // when the interlude before stage 1 reaches the top edge.
      if(st==='playing'&&!this.tutDone&&this.stages.length>1){
        const next=this.stages[1];
        // Keep START aligned to the viewport during the tutorial. The new
        // half-stage number band waits immediately above y=0 and only begins
        // entering after the tutorial has completed.
        const limit=-next.H-this._levelInterludeHeight();
        if(next.worldY>limit){
          const overshoot=next.worldY-limit;
          this.stages.forEach(s=>{if(!s.done)s.worldY-=overshoot;});
        }
      }
      // The height counter starts at 66 ft and follows actual world movement.
      // Tutorial clamping is intentionally excluded, so the visible value does
      // not rise before the player reaches real gameplay.
      if(this.tutDone){
        const stageH=this.stages&&this.stages[0]?this.stages[0].H:CH;
        this._heightTravelStages+=Math.max(0,fall*dt/Math.max(1,stageH));
      }
      this._scatterPhysics();
    }
    this.fx.update();

    // Rise Up intro tutorial: short launch, quick brake, then teach the swipe.
    // No modal/window is shown. The real obstacle waves stay frozen until training ends.
    if(st==='playing'&&!this.tutDone){
      this.tutPhaseT+=dt;
      if(this.tutPhase==='fly'){
        this.tutA=0;
        if(this.tutPhaseT>=550){this.tutPhase='brake';this.tutPhaseT=0;}
      }else if(this.tutPhase==='brake'){
        const k=clamp(this.tutPhaseT/400,0,1);
        this.ball.speed=lerp(this._tutCruiseSpeed,this._tutCruiseSpeed*.08,k*k*(3-2*k));
        if(k>=1){
          this.tutPhase='learn';this.tutPhaseT=0;this.tutT=0;this.tutA=0;
          this.ball.speed=0;
          this.shield.up();
        }
      }else if(this.tutPhase==='learn'){
        this.ball.speed=0;
        this.tutT+=dt;
        // Fast reveal matching the reference playable: the tutorial becomes
        // readable almost immediately after the short launch motion.
        const reveal=clamp(this.tutT/250,0,1);
        this.tutA=reveal*reveal*(3-2*reveal);
        this._updateTutorial(dt);
        if(this.tutT>this.cfg.tutorialDisplayTime){
          if(this.cfg.tutorialFailEnabled!==false&&this.cfg.tutorialAnimEnabled!==false&&!this._tutSmashed&&!this._tutorialFailed){
            this._tutorialFailed=true;this.tutDone=true;this._die();
          }else{
            this.tutDone=true;this.tutA=0;this.ball.speed=this._ballSpeed();
          }
        }
        const fs=this.cfg.tutorialDisplayTime-600;
        if(this.tutT>fs)this.tutA=Math.max(0,1-(this.tutT-fs)/600);
      }
    }
    this._updateLevelNumber(dt);
    // The invisible Win line may be authored on any scene. It owns the exact
    // completion point and is checked before collision/store logic.
    if(st==='playing'&&this.tutDone&&this._triggerWinLineIfReady())return;
    // hp bar
    if(this.hpA>0){this.hpT+=dt;if(this.hpT>this.cfg.hpBarShowTime)this.hpA=Math.max(0,this.hpA-dt/400);}

    // collisions: the protector pushes every obstacle it touches; the ball
    // only loses a life when an unblocked obstacle reaches it.
    if(st==='playing'&&!this.shield.dead&&this.tutDone){
      // Non-interactable objects are solid only for obstacle physics. The
      // protector intentionally passes through them and may still push any
      // interactable obstacle that overlaps on the other side of a wall.
      // Level 3 uses continuous shield-vs-U-wall contact. Unlike a normal
      // obstacle hit, the basket can be pushed repeatedly, caught again and
      // sharply reversed to throw the balls out.
      for(let i=0;i<this.stages.length;i++){
        const stage=this.stages[i],top=this._sst(i);
        if(stage.level3ShieldContact&&stage.level3ShieldContact(this.shield,top)){
          this.shield.flash=180;
          if(stage.level3&&stage.level3.contactCooldown<=0){this.snd.play('shield');stage.level3.contactCooldown=120;}
        }
      }
      for(let i=0;i<this.stages.length;i++){
        const stage=this.stages[i],top=this._sst(i),level4Ball=stage.level4&&stage.level4.ball;
        // Level 4 uses a persistent support contact, like the Level 3 basket:
        // the protector carries the ball instead of applying a fresh kick.
        if(stage.level4ShieldContact&&stage.level4ShieldContact(this.shield,top,dt)){
          this.shield.flash=180;
          if(stage.level4&&stage.level4.justTouched&&stage.level4.contactCooldown<=0){this.snd.play('shield');stage.level4.contactCooldown=120;}
        }
        // Include already-flying obstacles. Each object has its own contact
        // latch: one continuous overlap counts as one hit, separation rearms
        // it, and the next touch applies a fresh impulse.
        const hits=stage.hits?stage.hits(this.shield.x,this.shield.y,this.shield.r,top,true,false):[];
        // Level 3 loose balls are controlled only through the basket and must
        // not become directly hittable because dynamic contacts are enabled.
        const repeatHits=hits.filter(o=>o!==level4Ball&&o.level3Role!=='ball');
        const touching=new Set(repeatHits);
        for(const o of stage.obs){
          if(o!==level4Ball&&o.level3Role!=='ball'&&!touching.has(o))o.protectorTouching=false;
        }
        for(const sh of repeatHits){
          if(!sh.protectorTouching){
            sh.protectorTouching=true;
            this._hit(sh,top,'shield',i);
          }
        }
      }
      outer:for(let i=0;i<this.stages.length;i++){
        const top=this._sst(i);
        // Ball checks include already-pushed / dynamic obstacles too.
        // Every balloon in the pyramid can be popped by an unblocked obstacle.
        const bpts=this.ball.points();
        for(let bi=0;bi<bpts.length;bi++){
          const bh=this.stages[i].hit(bpts[bi].x,bpts[bi].y,this.ball.r,top,true,true);
          if(bh){this._hit(bh,top,'ball',i);break outer;}
        }
      }
    }

    // keep falling obstacle waves spawning above the screen
    if(st==='playing'&&this.tutDone)this._recycleStages();

    // death sequence
    if(st==='dying'){this.dtimer+=dt;const ds=Math.max(.05,parseFloat(this.cfg.playerDeathAnimSpeed)||1);if(!this._afterDeathDone&&this.dtimer>((this.cfg.playerDeathDuration||900)/ds)){this._afterDeathDone=true;this._afterDeath();}}
    // pause after death so the heart-break animation is fully visible before fading to respawn
    if(this._breakPauseT>0){this._breakPauseT-=dt;if(this._breakPauseT<=0){this._breakPauseT=0;if(this._pendingLoseAfterBreak){this._pendingLoseAfterBreak=false;this._lose();}else this.fadeDir=1;}}

    // fade
    if(this.fadeDir!==0){
      this.fadeA=clamp(this.fadeA+this.fadeDir*dt/300,0,1);
      if(this.fadeA>=1&&this.fadeDir>0){this._onFadeIn();this.fadeDir=-1;}
      if(this.fadeA<=0&&this.fadeDir<0)this.fadeDir=0;
    }
    if(st==='endcard')this.endA=Math.min(1,this.endA+dt/500);
  }

  _hit(obs,top,who,stageIndex){
    // Collision is the fallback Level 4 conversion trigger. It does not wait
    // for the stage counter: touching the authored first obstacle is itself
    // proof that the player has reached the final level.
    if(who==='shield'&&stageIndex===this._level4Index()&&obs===this._level4FirstObstacle()&&!this._endCardsEnabled('win')){
      this._triggerLevel4Store('collision');
      return;
    }
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
      // Every interactable obstacle can be touched and redirected again after
      // it separates from the protector, including while it is already flying.
      const repeatable=true;
      let nx=dx/len,ny=dy/len;
      const base=f*.55; // softer minimum kick, closer to Luna preview
      // Relative velocity makes a second touch alter the current trajectory
      // instead of merely adding the same one-time launch vector.
      const rvx=svx-(obs.vx||0);
      const rvy=svy-(obs.vy||0);
      const drive=Math.max(0,rvx*nx+rvy*ny);
      const vx=nx*(base+drive*.35)+svx*.35;
      const vy=ny*(base+drive*.35)+svy*.35;
      // Torque from an off-centre contact point (r x J / inertia):
      // clipping a corner spins the piece hard, a dead-centre hit barely does.
      const cxp=clamp(hx,obs.x-obs.w/2,obs.x+obs.w/2);
      const cyp=clamp(hy,(obs.y+top)-obs.h/2,(obs.y+top)+obs.h/2);
      const rx=cxp-obs.x,ry=cyp-(obs.y+top);
      const inertia=Math.max(300,(obs.w*obs.w+obs.h*obs.h)/12);
      const spin=clamp((rx*vy-ry*vx)/(inertia*3.8),-.16,.16);
      obs.push(vx,vy,spin,repeatable);
      this.shield.flash=400;
      this.snd.play('shield');
    } else {
      // Ball contact is damage, not a new physics impulse: the balloon pops,
      // one life is consumed after the death animation, and shield/level reset
      // continues unless lives reach zero.
      this.ball.flash=400;
      this.fx.burst(this.ball.x,this.ball.y,this.cfg.particleColor);
      this.fx.burst(obs.x,obs.y+top,this.cfg.particleColor);
      this._die(stageIndex);
      this.tutDone=true;
      return;
    }
    this.fx.burst(obs.x,obs.y+top,this.cfg.particleColor);
    this.tutDone=true;
  }

  // Rigid obstacle interaction. A protector hit wakes one obstacle; after
  // that, contacts transfer momentum through the whole cluster. Kinematic
  // interactable pieces can be knocked free, dynamic pieces exchange impulses,
  // and non-interactable pieces remain immovable solid colliders.
  _scatterPhysics(){
    const chainEnabled=this.cfg.chainReaction!==false;
    const bodies=[],statics=[];
    for(let i=0;i<this.stages.length;i++){
      const st=this.stages[i];if(st.done)continue;
      const top=this._sst(i);
      for(const o of st.obs){
        if(!o.live||o.level3Role||o.solid===false)continue;
        // Level 2 keeps the original pre-chain-reaction behaviour: shield hits
        // can launch and redirect each obstacle, but obstacles never collide
        // with one another. The Level 2 prefab carries the same opt-out when
        // it is placed on another stage.
        if(st.idx===2||o.physicsCollisionMode==='none'||o.physicsPrefab==='level2_grid')continue;
        const ref={o,top};
        if(o.interactable)bodies.push(ref);else statics.push(ref);
      }
    }
    const restitution=clamp(parseFloat(this.cfg.scatterBounciness)||0,0,.72);
    const collisionForce=clamp(Number.isFinite(parseFloat(this.cfg.collisionForce))?parseFloat(this.cfg.collisionForce):.01,0,1);
    // A soft, non-linear response gives much finer control near zero.
    // At the maximum setting the transferred impulse is still only 55% of
    // the previous implementation; low values become almost imperceptible.
    const collisionImpulseScale=collisionForce*collisionForce*.55;
    const bodyRadius=o=>o.level4Role==='ball'?Math.max(6,Math.min(o.w,o.h)*.43):Math.max(5,o.cr);
    const bodyMass=o=>clamp((Math.max(8,o.w)*Math.max(8,o.h))/3600,.45,18);

    // Fast dynamic bodies are swept against immovable colliders before the
    // iterative pair solver. This prevents tunnelling through thin walls.
    for(const A of bodies){
      if(A.o.kin)continue;
      const ar=bodyRadius(A.o);
      const sx=Number.isFinite(A.o.prevX)?A.o.prevX:A.o.x;
      const sy=(Number.isFinite(A.o.prevY)?A.o.prevY:A.o.y)+A.top;
      const ex=A.o.x,ey=A.o.y+A.top,travel=Math.hypot(ex-sx,ey-sy);
      const sweepSteps=Math.min(40,Math.max(1,Math.ceil(travel/Math.max(2.5,ar*.25))));
      let stopped=false;
      for(let step=1;step<=sweepSteps&&!stopped;step++){
        const q=step/sweepSteps,qx=lerp(sx,ex,q),qy=lerp(sy,ey,q);
        for(const B of statics){
          const hit=B.o.circleContact(qx,qy-B.top,ar);if(!hit)continue;
          A.o.x=qx+hit.nx*hit.pen;A.o.y=qy-A.top+hit.ny*hit.pen;
          const vn=A.o.vx*hit.nx+A.o.vy*hit.ny;
          if(vn<0){A.o.vx-=hit.nx*vn*(1+restitution);A.o.vy-=hit.ny*vn*(1+restitution);}
          const tx=-hit.ny,ty=hit.nx,vt=A.o.vx*tx+A.o.vy*ty;
          A.o.vx-=tx*vt*.045;A.o.vy-=ty*vt*.045;
          A.o.av*=.96;stopped=true;break;
        }
      }
    }

    // Four light solver passes are enough for piles and clusters while keeping
    // the exported HTML inexpensive on ad-network devices.
    for(let pass=0;pass<4;pass++){
      // Dynamic against immovable geometry.
      for(const A of bodies){
        if(A.o.kin)continue;
        const ar=bodyRadius(A.o),ax=A.o.x,ay=A.o.y+A.top;
        for(const B of statics){
          const hit=B.o.circleContact(ax,ay-B.top,ar);if(!hit)continue;
          const correction=Math.max(0,hit.pen-.01)*.92;
          A.o.x+=hit.nx*correction;A.o.y+=hit.ny*correction;
          const vn=A.o.vx*hit.nx+A.o.vy*hit.ny;
          if(vn<0){A.o.vx-=hit.nx*vn*(1+restitution);A.o.vy-=hit.ny*vn*(1+restitution);}
          const tx=-hit.ny,ty=hit.nx,vt=A.o.vx*tx+A.o.vy*ty;
          A.o.vx-=tx*vt*.035;A.o.vy-=ty*vt*.035;
        }
      }

      if(!chainEnabled)continue;
      for(let a=0;a<bodies.length;a++){
        const A=bodies[a],ar=bodyRadius(A.o);
        for(let b=a+1;b<bodies.length;b++){
          const B=bodies[b];
          if(A.o.kin&&B.o.kin)continue;
          const ax=A.o.x,ay=A.o.y+A.top;
          const br=bodyRadius(B.o),bx=B.o.x,by=B.o.y+B.top,rr=ar+br;
          let dx=bx-ax,dy=by-ay,d2=dx*dx+dy*dy;
          if(d2>=rr*rr)continue;
          let d=Math.sqrt(d2),nx,ny;
          if(d>1e-5){nx=dx/d;ny=dy/d;}else{nx=1;ny=0;d=0;}

          // A moving piece wakes a kinematic neighbour. The new body inherits
          // the impact velocity immediately, so the reaction continues through
          // tightly packed obstacles instead of stopping at the first contact.
          if(A.o.kin!==B.o.kin){
            const mover=A.o.kin?B:A,target=A.o.kin?A:B;
            const dir=A.o.kin?-1:1;
            const toward=Math.max(0,(mover.o.vx*nx+mover.o.vy*ny)*dir);
            const speed=Math.hypot(mover.o.vx,mover.o.vy);
            if(collisionImpulseScale>.0001&&(speed>.35||toward>.18)){
              const txv=(mover.o.vx*.72+nx*dir*Math.max(.25,toward*.24))*collisionImpulseScale;
              const tyv=(mover.o.vy*.72+ny*dir*Math.max(.25,toward*.24))*collisionImpulseScale;
              const spin=clamp(((nx*mover.o.vy-ny*mover.o.vx)*.012+(Math.random()-.5)*.018)*collisionImpulseScale,-.12,.12);
              target.o.push(txv,tyv,spin);
              const retained=clamp(1-.08*collisionImpulseScale,.82,1);
              mover.o.vx*=retained;mover.o.vy*=retained;
              this.fx.burst(target.o.x,target.o.y+target.top,this.cfg.particleColor);
            }
          }

          const invA=A.o.kin?0:1/bodyMass(A.o),invB=B.o.kin?0:1/bodyMass(B.o),invSum=invA+invB;
          if(invSum<=0)continue;
          const overlap=rr-d;
          const correction=Math.max(0,overlap-.02)*.82/invSum;
          if(invA){A.o.x-=nx*correction*invA;A.o.y-=ny*correction*invA;}
          if(invB){B.o.x+=nx*correction*invB;B.o.y+=ny*correction*invB;}

          const rvx=B.o.vx-A.o.vx,rvy=B.o.vy-A.o.vy,velN=rvx*nx+rvy*ny;
          if(velN<0){
            const impulse=-(1+restitution)*velN/invSum*collisionImpulseScale;
            const ix=nx*impulse,iy=ny*impulse;
            if(invA){A.o.vx-=ix*invA;A.o.vy-=iy*invA;}
            if(invB){B.o.vx+=ix*invB;B.o.vy+=iy*invB;}

            // Coulomb-like tangential impulse keeps glancing collisions from
            // looking like frictionless circles and produces visible spin.
            let tx=rvx-nx*velN,ty=rvy-ny*velN,tl=Math.hypot(tx,ty);
            if(tl>1e-5){
              tx/=tl;ty/=tl;
              const jt=clamp(-(rvx*tx+rvy*ty)/invSum,-impulse*.16,impulse*.16);
              if(invA){A.o.vx-=tx*jt*invA;A.o.vy-=ty*jt*invA;A.o.av-=jt*.0018;}
              if(invB){B.o.vx+=tx*jt*invB;B.o.vy+=ty*jt*invB;B.o.av+=jt*.0018;}
            }
          }
        }
      }
    }
  }

  _die(stageIndex){if(this.state!=='playing')return;const hitIndex=parseInt(stageIndex,10);const failed=isFinite(hitIndex)&&hitIndex>=1&&hitIndex<=this._lastMiniIndex()?hitIndex:(parseInt(this.si,10)||1);this._respawnStageIndex=Math.max(1,Math.min(this._lastMiniIndex(),failed));this._respawnHeightStages=this._heightCheckpointFor(this._respawnStageIndex);this.state='dying';this.shield.die();this.ball.die();this.dtimer=0;this._afterDeathDone=false;this._breakPauseT=0;this._pendingLoseAfterBreak=false;this.hpA=0;this.hpT=0;this.snd.play('hit');}  _afterDeath(){if(!this._firstDeathAt)this._firstDeathAt=Date.now();this.lives--;this._heartBreakAt=Date.now();this._heartBreakIdx=this.lives;this.hpA=0;this.hpT=0;const pause=Math.max(0,this.cfg.deathPause!=null?parseFloat(this.cfg.deathPause)||0:2500);if(this.lives<=0){this._pendingLoseAfterBreak=true;if(pause>0)this._breakPauseT=pause;else{this._pendingLoseAfterBreak=false;this._lose();}return;}if(pause>0)this._breakPauseT=pause;else this.fadeDir=1;}
  _onFadeIn(){
    this.camY=Math.max(0,this.camY-this.stages[0].H*.25);
    // Keep the death-frame value visible during the animation and pause. On
    // the actual restart, restore the accumulator saved at the entrance to the
    // failed level (for example 100 ft), not the global 66 ft game baseline.
    this._heightTravelStages=Math.max(0,Number(this._respawnHeightStages)||0);
    this._shownLevelNumbers=new Set();this._levelNumberIndex=0;this._levelNumberT=0;
    this._resetFallingStagesFrom(this._respawnStageIndex);
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
  _endCardsEnabled(kind){
    const ec=this.cfg.endCard||{};
    if(ec.enabled===false)return false;
    if(kind==='win')return ec.winEnabled!==false;
    if(kind==='lose')return ec.loseEnabled!==false;
    return true;
  }
  _win(){
    this.state='won';this.isWin=true;this.snd.stopBgm();this.snd.play('win');this.ball.flyAway();
    setTimeout(()=>{
      if(this._endCardsEnabled('win')){this.state='endcard';this.endA=0;}
      else this.state='finished';
      this.cb.onWin&&this.cb.onWin();
    },1400);
  }
  _lose(){
    this.isWin=false;this.snd.stopBgm();this.snd.play('lose');
    const ec=this.cfg.endCard||{};
    const show=this._endCardsEnabled('lose')&&ec.tryAgainEnabled!==false;
    this.state='lost';
    const delay=Math.max(0,parseFloat(ec.tryAgainDelay)||0);
    const duration=Math.max(0,parseFloat(ec.tryAgainDuration)||0);
    setTimeout(()=>{
      if(this.state!=='lost')return;
      if(show){
        this.state='endcard';this.endA=0;
        this._loseCountdownStart=Date.now();
        this._loseCtaRect=null;
        if(duration>0)setTimeout(()=>{if(this.state==='endcard'&&!this.isWin)this.state='finished';},duration);
      }else this.state='finished';
      this.cb.onLose&&this.cb.onLose();
    },delay);
  }

  _drawCover(ctx,bg,x,y,w,h){
    if(!imgOk(bg))return false;
    const sc=Math.max(w/bg.naturalWidth,h/bg.naturalHeight);
    const dw=bg.naturalWidth*sc,dh=bg.naturalHeight*sc;
    ctx.drawImage(bg,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
    return true;
  }

  _drawCoverFade(ctx,bg,x,y,w,h,fade,tint,valign){
    if(!imgOk(bg))return false;
    const off=document.createElement('canvas');
    off.width=Math.max(1,Math.round(w));off.height=Math.max(1,Math.round(h));
    const oc=off.getContext('2d');
    const sc=Math.max(w/bg.naturalWidth,h/bg.naturalHeight);
    const dw=bg.naturalWidth*sc,dh=bg.naturalHeight*sc;
    const dx=(w-dw)/2;
    const dy=valign==='bottom'?(h-dh):(h-dh)/2;
    oc.drawImage(bg,dx,dy,dw,dh);
    if(tint&&String(tint).toLowerCase()!=='#ffffff'){
      oc.globalCompositeOperation='multiply';
      oc.fillStyle=tint;
      oc.fillRect(0,0,w,h);
      oc.globalCompositeOperation='destination-in';
      oc.drawImage(bg,dx,dy,dw,dh);
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
      if(imgOk(bg)){
        // Seamless vertical tiling: stretch to screen width, keep aspect for the
        // tile height, and repeat down the screen scrolling with the world so a
        // seamless texture continues across every stage (no blur, no per-stage cut).
        const iw=bg.naturalWidth||bg.width||1, ih=bg.naturalHeight||bg.height||1;
        const tileW=CW, tileH=Math.max(1,tileW*(ih/iw));
        const scroll=((this.ball&&this.ball.travel)||0)*0.5;
        let off=((scroll%tileH)+tileH)%tileH;
        const tint=this.cfg.backgroundSpriteColor;
        for(let y=off-tileH;y<CH+1;y+=tileH){
          if(tint&&String(tint).toLowerCase()!=='#ffffff')drawTintedImage(ctx,bg,0,y,tileW,tileH,tint);
          else ctx.drawImage(bg,0,y,tileW,tileH);
        }
      }
      return;
    }
    const grads=(this.cfg.stageBgGradients&&this.cfg.stageBgGradients.length)?this.cfg.stageBgGradients:BG_GRADS;
    // Draw the empty number interludes as proper background bands. Use the
    // upcoming level's gradient so there is no dark/base-colour hole between
    // two stage rectangles in per-stage background mode.
    for(let i=1;i<=this._lastMiniIndex();i++){
      const gap=this._levelGapRect(i);if(!gap||gap.bottom<0||gap.top>CH)continue;
      const top=Math.max(0,gap.top),bot=Math.min(CH,gap.bottom),g=grads[i%grads.length]||grads[0];
      const lg=ctx.createLinearGradient(0,gap.top,0,gap.bottom);
      lg.addColorStop(0,g[1]);lg.addColorStop(1,g[0]);
      ctx.fillStyle=lg;ctx.fillRect(0,top,CW,bot-top);
    }
    const vis=[];
    for(let i=0;i<this.stages.length;i++){
      const s=this.stages[i];if(s.done)continue;
      vis.push({i,top:s.worldY,H:s.H});
    }
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

  _drawSeamOverlays(ctx,layer){
    if(this.cfg.backgroundMode==='common')return;
    const vis=[];
    for(let i=0;i<this.stages.length;i++){
      const s=this.stages[i];if(s.done)continue;
      vis.push({i,top:s.worldY,H:s.H});
    }
    vis.sort((a,b)=>a.top-b.top);
    const rawScale=Number(this.cfg.seamScale)||0.5;
    const sizeFactor=clamp(rawScale/0.5,0.6,2.4);
    const multi=(this.cfg.seamOverlayMode==='perStage')||!!this.cfg.seamMulti;
    const grads=this.cfg.stageBgGradients||BG_GRADS;
    const previousTopColor=(stageIndex)=>{
      const prev=Math.max(0,stageIndex-1),pair=grads[prev%grads.length]||BG_GRADS[prev%BG_GRADS.length]||BG_GRADS[0];
      return pair[1]||pair[0]||'#ffffff';
    };

    const sourceSize=(source)=>({
      iw:source.naturalWidth||source.width||1,
      ih:source.naturalHeight||source.height||1
    });

    const tileAcrossWidth=(source,y)=>{
      const {iw,ih}=sourceSize(source);
      // Keep the standard portrait tile size in every orientation. Tiles
      // overlap by 5% to eliminate visible gaps at transparent edges.
      const tileW=390*sizeFactor;
      const tileH=tileW*(ih/iw);
      const step=tileW*0.95;
      for(let x=0;x<CW;x+=step)ctx.drawImage(source,x,y,tileW,tileH);
      return tileH;
    };

    const drawMountain=(source,v)=>{
      if(!imgOk(source)||!v)return;
      const {iw,ih}=sourceSize(source);
      const tileW=390*sizeFactor;
      const tileH=tileW*(ih/iw);
      // Mountains belong to the START scene rather than the viewport. They
      // begin flush with the bottom of the opening screen, then travel down
      // with stage 0 and naturally leave the frame as gameplay progresses.
      // Stage 0 starts above the viewport. Compensate that authored offset so
      // the mountains are flush with the physical bottom edge on frame one.
      // As stage 0 falls, the same delta moves the mountains down and out.
      const stageBottom=CH+(v.top-START_STAGE_INITIAL_TOP);
      const y=stageBottom-tileH;
      if(y>CH||y+tileH<0)return;
      tileAcrossWidth(source,y);
    };

    const drawCloudBand=(source,v)=>{
      if(!imgOk(source))return;
      const {iw,ih}=sourceSize(source);
      const tileW=390*sizeFactor;
      const tileH=tileW*(ih/iw);
      // The transition image belongs to the numbered corridor after this stage.
      // Anchor it to the corridor's LOWER edge, not to the stage/corridor seam.
      // This keeps the artwork next to the following level instead of floating
      // at the top of the empty interlude.
      const gap=this._levelGapRect(v.i);
      const boundary=gap?gap.bottom:(v.top+v.H);
      const y=boundary-tileH*0.70;
      if(y>CH||y+tileH<0)return;
      tileAcrossWidth(source,y);
    };

    const seamFor=(stageIndex)=>{
      const im=multi?this._spr('bg_seam_stage'+stageIndex):this._spr('bg_seam');
      if(!imgOk(im))return im;
      const tint=multi?((this.cfg.stageSeamTints&&this.cfg.stageSeamTints[stageIndex])||'#ffffff'):(this.cfg.seamTint||'#ffffff');
      return (!tint||String(tint).toLowerCase()==='#ffffff')?im:tintedSprite(im,tint);
    };
    // Mountains are part of stage 0. Use its live world position so the image
    // stays at the opening scene and disappears below the viewport as that
    // scene moves past the player.
    if(layer==='mountains'){
      const mountain=seamFor(0),start=this.stages&&this.stages[0];
      if(imgOk(mountain)&&start&&!start.done){
        drawMountain(mountain,{i:0,top:start.worldY,H:start.H});
      }
      return;
    }
    if(!vis.length)return;
    for(let k=0;k<vis.length;k++){
      const v=vis[k];
      if(v.i===0)continue;
      const seam=seamFor(v.i);
      if(!imgOk(seam))continue;
      drawCloudBand(seamCompositedOnPreviousColor(seam,previousTopColor(v.i)),v);
    }
  }

  _draw(){
    const ctx=this.ctx;
    this._drawBackground(ctx);
    // START mountains move with the opening scene and remain behind gameplay;
    // transition clouds stay above stage content.
    this._drawSeamOverlays(ctx,'mountains');
    // stages
    for(let i=0;i<this.stages.length;i++){if(!this.stages[i].done)this.stages[i].draw(ctx,this._sst(i));}
    this.fx.draw(ctx);
    // Transition clouds stay above stage content. Numbered level numerals are
    // held in screen-space while their physical half-stage interludes pass.
    this._drawSeamOverlays(ctx,'clouds');
    this._drawLevelNumber(ctx);
    // ball below shield, both above seam overlays and level numeral
    this.ball.draw(ctx);
    this.shield.draw(ctx);
    // Gameplay UI must not bleed through the End Card. The stage remains as
    // the darkened background, while HUD, gameplay CTA and tutorial are hidden.
    if(this.state!=='endcard'){
      // Level progress dots removed: progress indicators should be placed manually in the editor.
      this._drawProgressBars(ctx);
      this._drawHealthBars(ctx);
      this._drawCtas(ctx);
      this._drawHeightIndicator(ctx);
      if(!this.tutDone&&this.state==='playing'&&this.tutPhase==='learn'&&this.tutA>0)this._drawTut(ctx);
      if(this.hpA>0&&!(this.healthBars&&this.healthBars.length))this._drawHp(ctx);
    }
    if(this.fadeA>0){ctx.fillStyle=`rgba(0,0,0,${this.fadeA})`;ctx.fillRect(0,0,CW,CH);}
    if(this.state==='start')this._drawStart(ctx);
    if(this.state==='endcard')this._drawEnd(ctx);
  }

  _heightValue(){
    const start=parseFloat(this.cfg.heightStart);
    const perStage=parseFloat(this.cfg.heightFeetPerStage);
    const base=isFinite(start)?start:66;
    const rate=isFinite(perStage)?Math.max(0,perStage):100;
    return Math.max(0,Math.floor(base+(this._heightTravelStages||0)*rate));
  }

  _drawHeightIndicator(ctx){
    if(this.cfg.heightIndicatorEnabled===false||!this._startedAt)return;
    if(this.state==='endcard'||this.state==='finished'||this.state==='lost')return;
    const elapsed=Date.now()-this._startedAt;
    const raw=clamp(elapsed/720,0,1),show=raw*raw*(3-2*raw);
    if(show<=0)return;

    if(!this._heightArrow)this._heightArrow=this._spr('height_arrow')||makeImg(this.cfg.defaultHeightArrowSrc);
    const portrait=CW<=CH;
    const scale=hudCounterScale();
    const right=(portrait?18:28)*scale;
    const top=(portrait?30:24)*scale;
    const numberSize=(portrait?54:50)*scale;
    const ftSize=21*scale;
    const arrowSize=64*scale;
    const numberX=CW-right-48*scale-(1-show)*125*scale;
    const numberY=top+numberSize*.53;
    const arrowX=numberX-88*scale;
    const arrowY=top+40*scale;
    const purple=this.cfg.heightAccentColor||'#a552ff';
    const outline=this.cfg.heightOutlineColor||'#7d33ce';

    ctx.save();
    ctx.globalAlpha=show;
    if(imgOk(this._heightArrow)){
      ctx.save();ctx.translate(arrowX,arrowY);ctx.rotate(-Math.PI/2);
      drawTintedImage(ctx,this._heightArrow,-arrowSize/2+3*scale,-arrowSize/2+3*scale,arrowSize,arrowSize,purple);
      drawTintedImage(ctx,this._heightArrow,-arrowSize/2,-arrowSize/2,arrowSize,arrowSize,'#ffffff');
      ctx.restore();
    }else{
      // Fallback keeps the HUD usable if a custom export strips the source PNG.
      const arrowPath=()=>{ctx.beginPath();ctx.moveTo(-10*scale,22*scale);ctx.lineTo(-10*scale,-5*scale);ctx.lineTo(-23*scale,-5*scale);ctx.lineTo(0,-29*scale);ctx.lineTo(23*scale,-5*scale);ctx.lineTo(10*scale,-5*scale);ctx.lineTo(10*scale,22*scale);ctx.closePath();};
      ctx.save();ctx.translate(arrowX+3*scale,arrowY+3*scale);ctx.fillStyle=purple;arrowPath();ctx.fill();ctx.restore();
      ctx.save();ctx.translate(arrowX,arrowY);ctx.fillStyle='#fff';arrowPath();ctx.fill();ctx.restore();
    }

    const family='Arial, Helvetica, sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
    ctx.font='900 '+Math.round(numberSize)+'px '+family;
    ctx.lineWidth=Math.max(3,5*scale);ctx.strokeStyle=outline;ctx.fillStyle='#ffffff';
    const value=String(this._heightValue());
    ctx.strokeText(value,numberX,numberY);ctx.fillText(value,numberX,numberY);
    ctx.font='900 '+Math.round(ftSize)+'px '+family;
    ctx.lineWidth=Math.max(2,3.5*scale);
    const ftY=top+numberSize+20*scale;
    ctx.strokeText('FT',numberX,ftY);ctx.fillText('FT',numberX,ftY);
    ctx.restore();
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
      const ra=this._revealAlpha(b.appear||'start');if(ra<=0)continue;
      const box=progressBoxLocal(b),x=CW/2+box.x,y=CH/2+box.y;
      ctx.save();ctx.globalAlpha=ra;this._drawFlask(ctx,x,y,box.w,box.h,p,b.fill,b.line,b);ctx.restore();
    }
  }


  _drawHealthBars(ctx){
    const bars=(this.healthBars&&this.healthBars.length)?this.healthBars:[];
    if(!bars.length)return;
    for(const b of bars){
      const count=Math.max(1,parseInt(this.cfg.lives,10)||parseInt(b.count,10)||3), ds=healthDrawSize(b), size=ds.heartW, gap=ds.gap;
      const box=healthBoxLocal(b), total=count*size+(count-1)*gap;
      let ra=this._revealAlpha(b.appear||'start');
      if(b.hideAfterBreak){if(!this._heartBreakAt)ra=0;else{const el=Date.now()-this._heartBreakAt,B=650,O=400;ra=el<B?1:(el<B+O?1-(el-B)/O:0);}}
      if(ra<=0)continue;
      let x=CW/2+box.x, y=CH/2+box.y;
      if(imgOk(b.bgImg)){ctx.save();ctx.globalAlpha=ra;const kk=size/Math.max(1,(b.baseHeartW||b.heartW||36));let pw,ph,px,py;if(b.bgW>0&&b.bgH>0){pw=b.bgW*kk;ph=b.bgH*kk;px=x+total/2-pw/2;py=y+size/2-ph/2;}else{const pad=(b.bgPad==null?12:b.bgPad);pw=total+pad*2;ph=size+pad*2;px=x-pad;py=y-pad;}drawTintedImage(ctx,b.bgImg,px,py,pw,ph,b.bgTint||'#ffffff');ctx.restore();}
      for(let i=0;i<count;i++){
        if(b.breakAnim!==false&&i===this._heartBreakIdx&&this._heartBreakAt&&imgOk(b.breakLImg)&&imgOk(b.breakRImg)){
          const bt=(Date.now()-this._heartBreakAt)/650;
          if(bt<1){
            const al=(1-bt)*ra,sep=bt*size*0.55,drop=bt*bt*size*1.3,rot=bt*0.6,hw=size/2,hh=size;
            ctx.save();ctx.globalAlpha=al;ctx.translate(x+size*0.25-sep,y+size*0.5+drop);ctx.rotate(-rot);drawTintedImage(ctx,b.breakLImg,-hw/2,-hh/2,hw,hh,b.tint||'#ffffff');ctx.restore();
            ctx.save();ctx.globalAlpha=al;ctx.translate(x+size*0.75+sep,y+size*0.5+drop);ctx.rotate(rot);drawTintedImage(ctx,b.breakRImg,-hw/2,-hh/2,hw,hh,b.tint||'#ffffff');ctx.restore();
            x+=size+gap;continue;
          }
        }
        ctx.save();
        ctx.globalAlpha=(i<this.lives?1:(b.emptyAlpha==null ? .28 : b.emptyAlpha))*ra;
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
      const _tfs=Math.max(8,Math.min(96,parseFloat(this.cfg.tutorialTextSize)||30));
      ctx.fillStyle='rgba(255,255,255,.88)';ctx.font='bold '+_tfs+'px sans-serif';ctx.textAlign='center';
      const _tCap=(this.cfg.tutorialText!=null&&String(this.cfg.tutorialText).trim()!=='')?this.cfg.tutorialText:'protect your balloon!';
      let _ty=Math.max(_tfs*1.5,CH*.105);
      String(_tCap).split('\n').forEach(function(ln){ctx.fillText(ln,CW/2,_ty);_ty+=_tfs*1.25;});
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
    S=Math.min(CW,CH)*0.14*(T?(parseFloat(T.scale)||1):1);
    const cfgX=parseFloat(this.cfg.tutorialX),cfgY=parseFloat(this.cfg.tutorialY);
    if(Number.isFinite(cfgX)&&Number.isFinite(cfgY)){
      // Global Tutorial controls use viewport percentages and therefore stay
      // predictable in both portrait and landscape exports.
      ax=CW*clamp(cfgX,0,100)/100;
      ay=CH*clamp(cfgY,0,100)/100;
    }else if(T){
      // Backward compatibility for projects exported before the global controls.
      const b=progressAnchorBaseLocal(T.anchor||'cc');
      const cx=CW/2+b.x+(parseFloat(T.anchorOffsetX)||0)*CW/100;
      const cy=CH/2+b.y+(parseFloat(T.anchorOffsetY)||0)*CH/100;
      ax=cx;ay=cy-(4.28-4.6)*S;
    }else{
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
      this._tutHand=this._spr('tutorial_hand')||makeImg(this.cfg.defaultTutorialHandSrc);
      if(!this._tutHand){
        const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ffffff" stroke="#1c2030" stroke-width="0.8" stroke-linejoin="round" d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/></svg>';
        this._tutHand=makeImg('data:image/svg+xml,'+encodeURIComponent(svg));
      }
    }
    if(!this._tutTriangle)this._tutTriangle=this._spr('tutorial_triangle')||makeImg(this.cfg.defaultTutorialTriangleSrc);
    if(!this.tutBlocks)this._tutInit();
    const S=this._tutAnchor.S;
    const p=((this.tutT||0)/1000)%1;                     // 1s loop (WrapMode 2)
    const ss=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
    // blocks (interactive)
    const T=this.tutorialObj;
    const shape=(T&&T.blockShape)||this.cfg.tutorialObstacleShape||'triangle';
    const blockColor=(T&&T.blockColor)||'#373843';
    const triangleTint=this.cfg.tutorialObstacleTint||'#ffffff';
    for(const b of this.tutBlocks){
      if(b.a<=0)continue;
      ctx.save();ctx.globalAlpha*=b.a;
      ctx.translate(b.x,b.y);ctx.rotate(b.rot);
      if(shape==='triangle'&&imgOk(this._tutTriangle)){
        const ds=b.s*1.16;
        drawTintedImage(ctx,this._tutTriangle,-ds/2,-ds/2,ds,ds,triangleTint);
      }else{
        ctx.fillStyle=blockColor;
        this._tutShape(ctx,0,0,b.s,shape);
      }
      ctx.restore();
    }
    const smashed=this._tutSmashed;
    // swipe streak (hidden once the pyramid is destroyed)
    if(!smashed){
      const hp=ss(p);
      const H0=this._tutU(1.48,3.58);
      const H=this._tutU(1.48+(-1.23-1.48)*hp,3.58+(5.61-3.58)*hp);
      const sa=p<0.75?0.4:(p<0.92?0.4*(1-(p-0.75)/0.17):0);
      const len=Math.hypot(H.x-H0.x,H.y-H0.y);
      if(sa>0&&len>0.03*S){
        ctx.save();ctx.globalAlpha*=sa;
        ctx.translate(H0.x,H0.y);ctx.rotate(Math.atan2(H.y-H0.y,H.x-H0.x));
        const gr=ctx.createLinearGradient(0,0,len,0);
        gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,1)');
        ctx.fillStyle=gr;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,-0.19*S);ctx.lineTo(len,0.19*S);ctx.closePath();ctx.fill();
        ctx.restore();
      }
      // hand: H is also the trail endpoint, so the streak is always attached to the fingertip
      const ha=p<0.42?p/0.42:(p<0.58?1:Math.max(0,1-(p-0.58)/0.42));
      if(ha>0&&imgOk(this._tutHand)){
        const rot=-((-25.4+(18+25.4)*hp)*Math.PI/180);// Unity CCW -> canvas
        const hw=1.7*S;
        ctx.save();ctx.globalAlpha*=ha;
        ctx.translate(H.x,H.y);ctx.rotate(rot);
        ctx.drawImage(this._tutHand,-hw*0.48,-hw*0.12,hw,hw); // fingertip at pivot
        ctx.restore();
      }
    }
    // text
    const cfgTextSize=parseFloat(this.cfg.tutorialTextSize);
    const baseTextSize=Number.isFinite(cfgTextSize)?clamp(cfgTextSize,8,96):((T&&parseFloat(T.textSize))||30);
    const fs=Math.max(6,baseTextSize*(S/(Math.min(CW,CH)*0.14)));
    ctx.fillStyle=(T&&T.textColor)||'rgba(255,255,255,.92)';
    var _tf=(typeof RiseFontCSS!=='undefined'&&RiseFontCSS[this.cfg.tutorialFont])?RiseFontCSS[this.cfg.tutorialFont]:(this.cfg.tutorialFont||'sans-serif');
    ctx.font='bold '+fs+'px '+_tf;ctx.textAlign='center';
    const _cfgTut=(this.cfg.tutorialText!=null&&String(this.cfg.tutorialText).trim()!=='')?this.cfg.tutorialText:null;
    const _tutCaption=(_cfgTut!=null)?_cfgTut:((T&&T.text!=null)?T.text:'protect your balloon!');
    const lines=String(_tutCaption).split('\n');
    // Caption follows the tutorial centre. Its vertical gap is configurable in
    // rendered triangle heights, which makes the same value usable in portrait
    // and landscape without relying on viewport height.
    const tutorialTop=this._tutAnchor.ay-2.19*S;
    const tutorialBlockHeight=0.5224*S*(shape==='triangle'?1.16:1);
    const captionGapRaw=parseFloat(this.cfg.tutorialCaptionGap);
    const captionGap=Number.isFinite(captionGapRaw)?clamp(captionGapRaw,-2,5):-0.5;
    const lineH=fs*1.25;
    const textDescent=fs*.22;
    const lastBaseline=tutorialTop-tutorialBlockHeight*captionGap-textDescent;
    let ty=lastBaseline-(lines.length-1)*lineH;
    const tx=this._tutAnchor.ax;
    for(const ln of lines){ctx.fillText(ln,tx,ty);ty+=lineH;}
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
    // Before gameplay starts, show the scene at full brightness.
    // The previous radial darkening made the preview look inactive.
    const startBg=this._spr('background_start');
    if(imgOk(startBg))this._drawCoverFade(ctx,startBg,0,0,CW,CH,0,this.cfg.backgroundSpriteColor);
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
    else{ctx.fillStyle=b.textTint||'#ffffff';var _cf=(typeof RiseFontCSS!=='undefined'&&RiseFontCSS[b.font])?RiseFontCSS[b.font]:(b.font||'sans-serif');ctx.font='bold '+Math.max(12,h*(b.fontSize!=null?b.fontSize/Math.max(1,(b.baseH||b.h||86)):0.28))+'px '+_cf;ctx.textAlign='center';ctx.textBaseline='alphabetic';var _t=(b.text==null||b.text==='')?'PLAY NOW':b.text,_m=ctx.measureText(_t),_a=_m.actualBoundingBoxAscent||0,_d=_m.actualBoundingBoxDescent||0;if(!_a){_a=Math.max(12,h*(b.fontSize!=null?b.fontSize/Math.max(1,(b.baseH||b.h||86)):0.28))*0.7;_d=_a*0.28;}ctx.fillText(_t,r.cx,r.cy+(_a-_d)/2);}
  }

  _drawCtas(ctx){
    if(!this.ctaButtons||!this.ctaButtons.length)return;
    for(let i=0;i<this.ctaButtons.length;i++)this._drawCustomCta(ctx,this.ctaButtons[i]);
  }

  _loseCountdownValue(){
    const ec=this.cfg.endCard||{};
    const raw=parseFloat(ec.countdownFrom);
    const from=clamp(Math.round(isFinite(raw)?raw:10),1,99);
    const elapsed=this._loseCountdownStart?Math.max(0,Date.now()-this._loseCountdownStart):0;
    return Math.max(1,from-Math.floor(elapsed/1000));
  }

  _loseEndLayout(){
    const ec=this.cfg.endCard||{},portrait=CW<CH;
    return ec.layouts&&ec.layouts.lose&&ec.layouts.lose[portrait?'portrait':'landscape'];
  }

  _endLayoutSettings(layout){
    const ec=this.cfg.endCard||{},s=layout&&layout.settings||{};
    return{
      showCta:s.showCta==null?ec.showCta!==false:s.showCta!==false,
      overlay:isFinite(parseFloat(s.overlay))?clamp(parseFloat(s.overlay),0,1):(ec.overlay==null?.68:clamp(parseFloat(ec.overlay)||0,0,1)),
      overlayColor:s.overlayColor||ec.overlayColor||'#000000',
      fontFamily:s.fontFamily||ec.fontFamily||'Baloo2'
    };
  }

  _loseLayoutDelta(o,ref){
    const r=endCardActiveRect();
    const point=(v)=>{v=Object.assign({},ref,v||{});const a=v.anchor||'cc',bx=a[1]==='l'?r.x:(a[1]==='r'?r.x+r.w:r.x+r.w/2),by=a[0]==='t'?r.y:(a[0]==='b'?r.y+r.h:r.y+r.h/2);return{x:bx+(parseFloat(v.x)||0)*r.w/100,y:by+(parseFloat(v.y)||0)*r.h/100};};
    const a=point(o||ref),b=point(ref);return{x:a.x-b.x,y:a.y-b.y};
  }

  _loseEndCtaRect(){
    const portrait=CW<CH,scale=hudCounterScale(),portraitScale=portrait?.8:1;
    const baseW=Math.min(CW*(portrait ? .72 : .42),300*scale)*portraitScale;
    const baseH=Math.max(52,60*scale)*portraitScale;
    const bottom=(portrait?48:24)*scale;
    const layout=this._loseEndLayout(),co=layout&&layout.cta;
    const ref={anchor:'bc',x:.18055992668838863,y:-18.90053185993494,scale:1,width:220,height:110,fontSize:36};
    const d=this._loseLayoutDelta(co,ref),cs=co&&co.scale!=null?Math.max(.05,parseFloat(co.scale)||1):1;
    const w=baseW*Math.max(.05,parseFloat(co&&co.width)||220)/220*cs;
    const h=baseH*Math.max(.05,parseFloat(co&&co.height)||110)/110*cs;
    return{x:(CW-w)/2+d.x,y:CH-bottom-baseH+(baseH-h)/2+d.y,w,h};
  }

  _pointInLoseEndCta(x,y){
    const layout=this._loseEndLayout(),co=layout&&layout.cta,ls=this._endLayoutSettings(layout);
    if(!ls.showCta||(co&&co.hidden))return false;
    const r=this._loseEndCtaRect();
    return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
  }

  _pointInWinEndCta(x,y){
    const r=this._winCtaRect;
    return !!r&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
  }

  _drawWinEnd(ctx){
    const ec=this.cfg.endCard||{},W=CW,H=CH,orientation=W>H?'landscape':'portrait';
    const layout=ec.layouts&&ec.layouts.win&&ec.layouts.win[orientation],ls=this._endLayoutSettings(layout),active=endCardActiveRect();
    const anchorPoint=(a)=>{a=a||'cc';return{x:a[1]==='l'?active.x:(a[1]==='r'?active.x+active.w:active.x+active.w/2),y:a[0]==='t'?active.y:(a[0]==='b'?active.y+active.h:active.y+active.h/2)};};
    const point=(o)=>{const b=anchorPoint(o&&o.anchor);return{x:b.x+((o&&o.x)||0)*active.w/100,y:b.y+((o&&o.y)||0)*active.h/100};};
    const joined=(o)=>Array.isArray(o&&o.segments)?o.segments.map(v=>String(v&&v.t!=null?v.t:'')).join(''):'';
    const richLines=(o,fallback)=>{const text=typeof(o&&o.text)==='string'?o.text:fallback,base=(o&&o.baseColor)||(o&&o.color)||'#ffffff',segs=Array.isArray(o&&o.segments)&&joined(o)===text?o.segments:[{t:text,color:base}],lines=[[]];segs.forEach(seg=>{const color=seg.color||base,parts=String(seg.t==null?'':seg.t).split('\n');parts.forEach((part,i)=>{if(i>0)lines.push([]);if(part!=='')lines[lines.length-1].push({t:part,color});});});return lines;};
    const drawRich=(o,cx,cy,size,family,scale,fallback,boxW,boxH)=>{const lines=richLines(o,fallback),lineH=size*1.16,totalH=Math.max(lineH,lines.length*lineH);ctx.save();ctx.font='800 '+size+'px '+family;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.lineJoin='round';let maxW=1;const info=lines.map(runs=>{const lineText=runs.map(r=>r.t).join(''),m=ctx.measureText(lineText||' '),w=runs.reduce((sum,r)=>sum+ctx.measureText(r.t).width,0),asc=m.actualBoundingBoxAscent||size*.75,desc=m.actualBoundingBoxDescent||size*.2;maxW=Math.max(maxW,w);return{runs,w,asc,desc};});const targetW=parseFloat(boxW)>0?parseFloat(boxW):maxW,targetH=parseFloat(boxH)>0?parseFloat(boxH):totalH,sx=targetW/maxW,sy=targetH/totalH;ctx.translate(cx,cy);ctx.scale(sx,sy);info.forEach((line,i)=>{const centerY=-totalH/2+lineH*(i+.5),baseline=centerY+(line.asc-line.desc)/2,start=-line.w/2;let xx=start;if(((o&&o.strokeW)||0)>0){ctx.lineWidth=((o&&o.strokeW)||0)*scale;ctx.strokeStyle=(o&&o.stroke)||'#000000';line.runs.forEach(r=>{ctx.strokeText(r.t,xx,baseline);xx+=ctx.measureText(r.t).width;});}xx=start;line.runs.forEach(r=>{ctx.fillStyle=r.color||((o&&o.baseColor)||(o&&o.color)||'#ffffff');ctx.fillText(r.t,xx,baseline);xx+=ctx.measureText(r.t).width;});});ctx.restore();};
    const fam=(typeof RiseFontCSS!=='undefined'&&RiseFontCSS[ls.fontFamily])?RiseFontCSS[ls.fontFamily]:(ls.fontFamily||'sans-serif');
    const famOf=(o)=>{const fn=(o&&o.font)||ls.fontFamily;return(typeof RiseFontCSS!=='undefined'&&RiseFontCSS[fn])?RiseFontCSS[fn]:(fn||'sans-serif');};
    ctx.save();ctx.globalAlpha=this.endA;
    const bgo=(layout&&layout.background)||{},bgHidden=!!bgo.hidden,bgFill=bgo.fillMode||'image';
    if(!bgHidden&&(bgFill==='solid'||bgFill==='gradient')){if(bgFill==='gradient'){const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,bgo.colorA||'#69c5ec');gr.addColorStop(1,bgo.colorB||'#39a2d8');ctx.fillStyle=gr;}else ctx.fillStyle=bgo.colorA||'#69c5ec';ctx.fillRect(0,0,W,H);}else{const bg=!bgHidden?this._spr('endcard_win_'+orientation+'_background'):null;if(imgOk(bg))this._drawCover(ctx,bg,0,0,W,H);else{ctx.fillStyle='#111827';ctx.fillRect(0,0,W,H);}}
    ctx.fillStyle=rgba(ls.overlayColor,ls.overlay);ctx.fillRect(0,0,W,H);
    if(layout){
      const io=layout.image||{},ip=point(io),art=this._spr('endcard_win_'+orientation+'_image')||this._spr('endcard_win'),is=io.scale==null?1:io.scale,iw=(orientation==='landscape'?W*.48:W*.84)*is,ih=(orientation==='landscape'?H*.58:H*.34)*is;
      if(!io.hidden&&imgOk(art)){const sc=Math.min(iw/art.naturalWidth,ih/art.naturalHeight),dw=art.naturalWidth*sc,dh=art.naturalHeight*sc;drawTintedImage(ctx,art,ip.x-dw/2,ip.y-dh/2,dw,dh,io.tint||'#ffffff');}
      const to=layout.text||{},tp=point(to),ts=to.scale==null?1:to.scale,tfz=(to.fontSize==null?(orientation==='landscape'?26:28):to.fontSize)*ts,tw=parseFloat(to.width)>0?to.width*ts:null,th=parseFloat(to.height)>0?to.height*ts:null;
      if(!to.hidden)drawRich(to,tp.x,tp.y,tfz,famOf(to),ts,'YOU WIN!',tw,th);
      this._winCtaRect=null;
      if(ls.showCta&&!(layout.cta&&layout.cta.hidden)){const co=layout.cta||{},cp=point(co),cs=co.scale==null?1:co.scale,portrait=W<H,portraitScale=portrait?.8:1,baseW=Math.max(20,co.width==null?220:co.width),baseH=Math.max(12,co.height==null?54:co.height),bw=baseW*cs*portraitScale,bh=baseH*cs*portraitScale,bx=cp.x-bw/2,by=cp.y-bh/2,btn=this._spr('endcard_win_'+orientation+'_cta_bg')||this._spr('endcard_lose_button'),tint=co.bgTint||'#ffffff';this._winCtaRect={x:bx,y:by,w:bw,h:bh};if(imgOk(btn))drawTintedImage(ctx,btn,bx,by,bw,bh,tint);else{ctx.fillStyle=tint;ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,bw,bh,12):ctx.rect(bx,by,bw,bh);ctx.fill();}drawRich(co,bx+bw/2,by+bh/2,(co.fontSize==null?17:co.fontSize)*cs*portraitScale,famOf(co),cs*portraitScale,'PLAY NOW');}
    }else{
      const card=this._spr('endcard_win'),sc=ec.scale==null?1:ec.scale,cx=W/2+(ec.x||0)*W/100,cy=H*.45+(ec.y||0)*H/100;
      if(imgOk(card)){const k=Math.min(W*.88*sc/card.naturalWidth,H*.38*sc/card.naturalHeight),dw=card.naturalWidth*k,dh=card.naturalHeight*k;ctx.drawImage(card,cx-dw/2,cy-dh/2,dw,dh);}else{ctx.fillStyle='#fff';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('YOU WIN!',W/2,H*.35);}
      this._winCtaRect=null;
      if(ec.showCta!==false){const portrait=W<H,k=portrait?.8:1,bw=220*k,bh=54*k,bx=(W-bw)/2,by=(ec.ctaY==null?74:ec.ctaY)*H/100;this._winCtaRect={x:bx,y:by,w:bw,h:bh};const btn=this._spr('endcard_lose_button');if(imgOk(btn))drawTintedImage(ctx,btn,bx,by,bw,bh,'#52e08a');else{ctx.fillStyle='#52e08a';ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,bw,bh,12):ctx.rect(bx,by,bw,bh);ctx.fill();}drawRich({text:'PLAY NOW',baseColor:'#ffffff'},bx+bw/2,by+bh/2,17*k,fam,k,'PLAY NOW');}
    }
    ctx.restore();
  }

  _drawEnd(ctx){
    if(this.isWin){this._drawWinEnd(ctx);return;}
    const ec=this.cfg.endCard||{},a=this.endA,portrait=CW<CH,scale=hudCounterScale(),active=endCardActiveRect(),baseCx=active.x+active.w/2,baseCy=portrait?CH*.39:CH*.43,layout=this._loseEndLayout()||{},ls=this._endLayoutSettings(layout),overlay=ls.overlay,overlayColor=ls.overlayColor;
    const io=layout.image||{},to=layout.text||{},co=layout.cta||{};
    const imageRef={anchor:'cc',x:0,y:0,scale:1},textRef={anchor:'cc',x:0,y:0,scale:1,fontSize:72,width:95,height:86};
    const famOf=(o)=>{const n=(o&&o.font)||ls.fontFamily||'Baloo2';return(typeof RiseFontCSS!=='undefined'&&RiseFontCSS[n])?RiseFontCSS[n]:(n==='Baloo2'?'Baloo2, Arial, sans-serif':n||'sans-serif');};

    ctx.save();ctx.globalAlpha=a;ctx.fillStyle=rgba(overlayColor,overlay);ctx.fillRect(0,0,CW,CH);

    const id=this._loseLayoutDelta(io,imageRef),imageScale=io.scale==null?1:Math.max(.05,parseFloat(io.scale)||1),baseBadgeSize=Math.min(portrait?CW*.64:CW*.28,portrait?CH*.30:CH*.56,303*scale),badgeSize=baseBadgeSize*imageScale,badgeCx=baseCx+id.x,badgeCy=baseCy+id.y,imageTint=io.tint||ec.imageTint||'#ffffff';
    if(!io.hidden){
      const badge=this._spr('endcard_lose_'+(portrait?'portrait':'landscape')+'_image')||(this._endCountdownBadge||(this._endCountdownBadge=this._spr('endcard_countdown_badge')||makeImg(this.cfg.defaultEndCardCountdownBadgeSrc)));
      if(imgOk(badge))drawTintedImage(ctx,badge,badgeCx-badgeSize/2,badgeCy-badgeSize/2,badgeSize,badgeSize,imageTint);
      else{const g=ctx.createRadialGradient(badgeCx,badgeCy-badgeSize*.10,badgeSize*.06,badgeCx,badgeCy,badgeSize*.5);g.addColorStop(0,'rgba(255,255,255,.96)');g.addColorStop(.72,'rgba(245,245,245,.95)');g.addColorStop(1,'rgba(255,255,255,.98)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(badgeCx,badgeCy,badgeSize*.5,0,Math.PI*2);ctx.fill();}
    }

    if(!to.hidden){
      const td=this._loseLayoutDelta(to,textRef),elapsed=this._loseCountdownStart?Math.max(0,Date.now()-this._loseCountdownStart):0,phase=(elapsed%1000)/1000,pulse=1+Math.sin(Math.PI*phase)*.025;
      const textScale=to.scale==null?1:Math.max(.05,parseFloat(to.scale)||1),fontScale=Math.max(.05,(parseFloat(to.fontSize)||72)/72)*textScale,numberSize=baseBadgeSize*.38*pulse*fontScale,numberCx=baseCx+td.x,numberCy=baseCy+td.y+baseBadgeSize*.015;
      const widthScale=Math.max(.05,(parseFloat(to.width)||95)/95),heightScale=Math.max(.05,(parseFloat(to.height)||86)/86),strokeW=Math.max(0,(to.strokeW==null?6:parseFloat(to.strokeW)||0)*fontScale);
      ctx.save();ctx.translate(numberCx,numberCy);ctx.scale(widthScale,heightScale);ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.font='900 '+Math.round(numberSize)+'px '+famOf(to);ctx.lineWidth=strokeW/Math.max(.05,(widthScale+heightScale)*.5);ctx.strokeStyle=to.stroke||this.cfg.heightOutlineColor||'#7d33ce';ctx.fillStyle=to.baseColor||to.color||'#ffffff';const value=String(this._loseCountdownValue());if(strokeW>0)ctx.strokeText(value,0,0);ctx.fillText(value,0,0);ctx.restore();
    }

    const showCta=ls.showCta&&!co.hidden;
    this._loseCtaRect=showCta?this._loseEndCtaRect():null;
    if(showCta){
      const r=this._loseCtaRect,cs=co.scale==null?1:Math.max(.05,parseFloat(co.scale)||1),purple=co.bgTint||this.cfg.heightAccentColor||'#a552ff';
      ctx.save();ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=16*scale;ctx.shadowOffsetY=7*scale;ctx.fillStyle=purple;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(r.x,r.y,r.w,r.h,r.h*.34);else ctx.rect(r.x,r.y,r.w,r.h);ctx.fill();ctx.restore();
      ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=Math.max(2,2.5*scale);ctx.beginPath();if(ctx.roundRect)ctx.roundRect(r.x,r.y,r.w,r.h,r.h*.34);else ctx.rect(r.x,r.y,r.w,r.h);ctx.stroke();
      const fontScale=Math.max(.05,(parseFloat(co.fontSize)||36)/36)*cs;ctx.fillStyle=co.baseColor||co.color||'#ffffff';ctx.font='800 '+Math.round(Math.max(18,22*scale)*fontScale)+'px '+famOf(co);ctx.textAlign='center';ctx.textBaseline='middle';const ctaLabel=(typeof co.text==='string'&&co.text.trim())?co.text:(ec.ctaText||'TRY AGAIN');ctx.fillText(String(ctaLabel).toUpperCase(),r.x+r.w/2,r.y+r.h/2+1*scale);
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
        const level3Locked=o.level3Role==='basket'&&st.level3&&!st.level3.touched;
        if((o.kin||level3Locked)&&o.live){
          o.ix=obstacleLayoutX({coordMode:o.coordMode,x:o.layoutLocalX,y:o.layoutLocalY,w:o.w,h:o.h,anchor:o.anchor,anchorOffsetX:o.anchorOffsetX,anchorOffsetY:o.anchorOffsetY});
          o.iy=obstacleLayoutY({coordMode:o.coordMode,x:o.layoutLocalX,y:o.layoutLocalY,w:o.w,h:o.h,anchor:o.anchor,anchorOffsetX:o.anchorOffsetX,anchorOffsetY:o.anchorOffsetY});
          o.x=o.ix;o.y=o.iy;
        }else{o.x*=kx;o.y*=ky;}
      }
      if(st.refreshLevel1Groups)st.refreshLevel1Groups();
    }
    if(this.spawnTop!=null)this.spawnTop*=ky;
  }
}

const DEF={
  lives:3,gameSpeed:3.2,acceleration:0.4,deathPause:2500,obstaclePushForce:7,gravityModifier:1,level1CenterSpeed:18,level3BasketPower:0.6,level3BallGravity:0.34,
  chainReaction:true,collisionForce:.01,scatterBounciness:0.1,
  hpBarShowTime:2000,tutorialDisplayTime:4800,tutorialAnimEnabled:true,tutorialFailEnabled:true,tutorialObstacleShape:"triangle",tutorialObstacleTint:"#c800ff",tutorialText:"PROTECT YOUR BALLOON!",tutorialTextSize:30,tutorialX:50,tutorialY:35,tutorialCaptionGap:-0.5,
  heightIndicatorEnabled:true,heightStart:66,heightFeetPerStage:100,heightAccentColor:'#a552ff',heightOutlineColor:'#7d33ce',
  playerColor:'#ffffff',playerOutlineColor:'#ffffff',playerSize:2,playerDeathAnimSpeed:1,playerSpriteColor:"#00eeff",playerRopeColor:"#84ebfc",playerStart:null,
  shieldColor:'#4fc3f7',shieldSize:1,shieldSpriteColor:"#00eeff",
  obstacleColor:'#e05252',obstacleColorAlt:'#5282e0',obstacleSpriteColor:'#ffffff',
  playerDeathFrames:4,playerDeathDuration:900,playerDeathAnimDuration:720,playerDeathFadeStart:650,
  bgColor:'#1a1a2e',groundColor:'#2a2a40',particleColor:'#f5e642',backgroundSpriteColor:"#ffffff",
  backgroundMode:"common",stageBgGradients:null,seamScale:0.5,seamOverlayMode:"perStage",seamMulti:true,seamTint:"#ffffff",stageSeamTints:null,bgStageTint:'#ffffff',stageBgTints:null,
  stageColors:["#e05252", "#52a0e0", "#52e08a", "#e07d52", "#c052e0"],stageAccents:false,showGrid:false,stageCount:4,orientation:"landscape",
  soundEnabled:true,soundVolume:0.8,soundVolumes:null,audioSources:null,
  levelData:null,
  endCard:{"enabled":true,"winEnabled":true,"loseEnabled":true,"tryAgainEnabled":true,"tryAgainDelay":0,"countdownFrom":10,"tryAgainDuration":0,"scale":1,"x":0,"y":10,"overlay":0.68,"overlayColor":"#000000","showCta":true,"ctaText":"TRY AGAIN","fontFamily":"Baloo2","ctaY":"74"},
};

W.RisePlayable={DEF,init(el,cfg,assets,cb){return new Game(el,cfg,assets||{},cb||{});}};
})(window);

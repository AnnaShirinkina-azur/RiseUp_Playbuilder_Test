(function(W){'use strict';
let CW=390,CH=844;
function setView(orientation){if(orientation==='landscape'){CW=844;CH=390;}else{CW=390;CH=844;}}
function lerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
function clamp(v,l,h){return Math.max(l,Math.min(h,v));}
function hr(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?[parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)]:[180,180,180];}
function rgba(h,a){const[r,g,b]=hr(h);return`rgba(${r},${g},${b},${a})`;}
function imgOk(s){return s&&s.complete&&s.naturalWidth>0;}
function makeImg(src){if(!src)return null;const im=new Image();im.src=src;return im;}
function drawTintedImage(ctx,img,x,y,w,h,color){
  // Draw custom sprite first, then apply color only inside the sprite alpha.
  // The tint is composed in an isolated offscreen canvas; using source-atop
  // directly on the game canvas would also see the already drawn background as
  // destination and could paint a square behind/around transparent sprites.
  ctx.drawImage(img,x,y,w,h);
  if(!color||String(color).toLowerCase()==='#ffffff')return;
  const ow=Math.max(1,Math.ceil(Math.abs(w))),oh=Math.max(1,Math.ceil(Math.abs(h)));
  const oc=document.createElement('canvas');oc.width=ow;oc.height=oh;
  const ox=oc.getContext('2d');
  ox.drawImage(img,0,0,ow,oh);
  ox.globalCompositeOperation='source-atop';
  ox.fillStyle=color;
  ox.globalAlpha=.55;
  ox.fillRect(0,0,ow,oh);
  ctx.drawImage(oc,x,y,w,h);
}
function pointInPoly(px,py,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;if(((yi>py)!=(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi+1e-9)+xi))inside=!inside;}return inside;}
function distToSegSq(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;let t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1);t=clamp(t,0,1);const x=ax+t*dx,y=ay+t*dy;return(px-x)**2+(py-y)**2;}
function circlePolyHit(cx,cy,cr,pts){if(pointInPoly(cx,cy,pts))return true;const r2=cr*cr;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if(distToSegSq(cx,cy,a.x,a.y,b.x,b.y)<=r2)return true;}return false;}
function layoutX(o){return o&&o.coordMode==='center'?CW/2+(o.x||0):(o&&o.x!=null?o.x:195);}
function layoutY(o){return o&&o.coordMode==='center'?CH/2+(o.y||0):(o&&o.y!=null?o.y:200);}
function activeSq(){return Math.min(CW,CH);}
function anchorBaseLocal(anchor){
  var a=anchor||'cc',av=a.charAt(0),ah=a.charAt(1),sq=activeSq();
  return {x:ah==='l'?-sq/2:(ah==='r'?sq/2:0),y:av==='t'?-sq/2:(av==='b'?sq/2:0)};
}
function textLocal(L){
  if(L&&L.anchorOffsetX!=null&&L.anchorOffsetY!=null){var b=anchorBaseLocal(L.anchor),sq=activeSq();return{x:b.x+(parseFloat(L.anchorOffsetX)||0)*sq/100,y:b.y+(parseFloat(L.anchorOffsetY)||0)*sq/100};}
  return {x:(L&&L.x)||0,y:(L&&L.y)||0};
}
function progressAnchorBaseLocal(anchor){
  var a=anchor||'cl',av=a.charAt(0),ah=a.charAt(1);
  return {x:ah==='l'?-CW/2:(ah==='r'?CW/2:0),y:av==='t'?-CH/2:(av==='b'?CH/2:0)};
}
function progressLocal(L){
  // Progress UI is anchored to the whole screen, not to the square gameplay area.
  if(L&&L.anchorOffsetX!=null&&L.anchorOffsetY!=null){var b=progressAnchorBaseLocal(L.anchor);return{x:b.x+(parseFloat(L.anchorOffsetX)||0)*CW/100,y:b.y+(parseFloat(L.anchorOffsetY)||0)*CH/100};}
  return {x:(L&&L.x)||0,y:(L&&L.y)||0};
}

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
  var size=L.size||40,weight=800;
  var anchor=L.anchor||'cc',av=anchor.charAt(0),ah=anchor.charAt(1),align=ah==='l'?'left':(ah==='r'?'right':'center');
  var lines=[[]],s,p,col,parts;
  for(s=0;s<segs.length;s++){
    col=segs[s].color||'#ffffff';parts=String(segs[s].t==null?'':segs[s].t).split('\n');
    for(p=0;p<parts.length;p++){if(p>0)lines.push([]);if(parts[p]!=='')lines[lines.length-1].push({t:parts[p],color:col});}
  }
  var lh=size*1.18;
  ctx.save();
  ctx.font=weight+' '+size+'px '+fam;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  try{if('letterSpacing' in ctx)ctx.letterSpacing=(L.letterSpacing||0)+'px';}catch(e){}
  var totalH=lh*lines.length,ascent=size*0.80,firstBase=(av==='t'?(cy+ascent):(av==='b'?(cy-totalH+ascent):(cy-totalH/2+ascent))),li,r,runs,by,lineW,sx,xx;
  for(li=0;li<lines.length;li++){
    runs=lines[li];by=firstBase+li*lh;lineW=0;
    for(r=0;r<runs.length;r++)lineW+=ctx.measureText(runs[r].t).width;
    sx=align==='left'?cx:(align==='right'?cx-lineW:cx-lineW/2);
    if(L.shadow){ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=size*0.14;ctx.shadowOffsetY=size*0.07;xx=sx;for(r=0;r<runs.length;r++){ctx.fillStyle=runs[r].color;ctx.fillText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}ctx.restore();}
    if(L.strokeW&&L.strokeW>0){ctx.lineWidth=L.strokeW;ctx.strokeStyle=L.stroke||'#000';ctx.lineJoin='round';xx=sx;for(r=0;r<runs.length;r++){ctx.strokeText(runs[r].t,xx,by);xx+=ctx.measureText(runs[r].t).width;}}
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
    this.layoutLocalX=o.x??0;this.layoutLocalY=o.y??0;
    this.x=layoutX(o);this.y=layoutY(o);
    this.w=o.w||60;this.h=o.h||60;
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
  push(fx,fy,spin=0){if(!this.kin||!this.live)return;this.kin=false;this.vx=fx;this.vy=fy;this.av=spin;}
  update(dt,gravityModifier=1){
    if(this.kin&&this.live&&this.moveX>0){this.t+=dt;this.x=this.ix+Math.sin(this.t/this.moveSpeed*Math.PI*2)*this.moveX;}
    if(!this.kin){
      // Free-body motion after the protector hits the obstacle.
      // X keeps inertia with damping, Y is pulled down by gravity.
      this.vy+=.38*gravityModifier;
      this.x+=this.vx;this.y+=this.vy;
      this.vx*=.985;this.vy*=.995;
      this.rot+=this.av;this.av*=.985;
      if(this.y>3000)this.live=false;
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
    if(imgOk(im)){drawTintedImage(ctx,im,-this.w/2,-this.h/2,this.w,this.h,this.cfg&&this.cfg.obstacleSpriteColor);}
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
    if(imgOk(this.spr)){drawTintedImage(ctx,this.spr,x-r,y-r,r*2,r*2,this.cfg.shieldSpriteColor);return;}
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
    this.x=CW/2;
    this.ty=CH*.72;              // fixed gameplay line after the first tap
    this.idleY=Math.min(CH-this.r-8,this.ty+80); // before tap: 50-100px lower
    this.y=this.idleY;
    this.dead=false;this.da=0;this.ra=0;this.flash=0;
    this.flying=false;this.finalFly=false;this.fy=0;this.introT=0;
    this.travel=0;this.speed=0;
    this.spr=null;
  }
  get r(){return 20*this.cfg.playerSize;}
  get worldY(){return this.travel;}
  die(){this.dead=true;this.da=0;}
  respawn(){
    this.dead=false;this.x=CW/2;this.ty=CH*.72;this.idleY=Math.min(CH-this.r-8,this.ty+80);this.y=this.idleY;
    this.da=0;this.ra=0;this.flash=0;this.flying=false;this.finalFly=false;this.fy=0;this.introT=0;this.travel=0;this.speed=0;
  }
  start(speed,travel=0){this.flying=true;this.finalFly=false;this.speed=speed;this.travel=travel;this.introT=0;}
  flyAway(){this.flying=true;this.finalFly=true;this.fy=0;}
  update(dt){
    if(this.dead){this.da=Math.min(1,this.da+dt/500);return;}
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
    if(imgOk(this.spr)){drawTintedImage(ctx,this.spr,x-r,y-r,r*2,r*2,this.cfg.playerSpriteColor);return;}
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
    const requestedCount=Math.max(1,Math.min(20,parseInt(c.stageCount,10)||5));
    // levelData may include fixed Start scene at index 0 and Finish scene at the last index.
    const ld=c.levelData;
    const hasLD=Array.isArray(ld)&&ld.some(s=>Array.isArray(s)&&s.length>0);
    const stageCount=Array.isArray(ld)&&ld.length>=requestedCount+2?ld.length:requestedCount+2;
    for(let si=0;si<stageCount;si++){
      let obs=[],labels=[],bgs=[];
      if(hasLD&&Array.isArray(ld[si])&&ld[si].length>0){
        ld[si].forEach(o=>{
          if(o&&o.kind==='text'){labels.push(o);return;}
          if(o&&o.kind==='progress'){var po=Object.assign({},o);po.flaskImg=makeImg(po.flaskSrc);po.fillImg=makeImg(po.fillSrc);this.progressBars.push(po);return;}
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
    this.hpA=0;this.hpT=0;
    this.fx=new FX();
    this.shield=new Shield(this.cfg);
    this.ball=new Ball(this.cfg);
    this.shield.spr=this._spr('shield');
    this.ball.spr=this._spr('player');
    this._resetFallingStages();
    this.completedStages=0;
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
      if(this.state==='playing'){this.shield.down(x,y);}
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
    this._update(dt);this._draw();
    this._raf=requestAnimationFrame(t=>this._loop(t));
  }

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
    }
    this.fx.update();

    // tutorial
    if(st==='playing'&&!this.tutDone){
      this.tutT+=dt;
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
    if(st==='dying'){this.dtimer+=dt;if(this.dtimer>900)this._afterDeath();}

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
      // Protector collision: impulse goes away from the shield, with a bit of
      // the shield's current swipe velocity. After that gravity pulls it down.
      const svx=this.shield.vx||0,svy=this.shield.vy||0;
      const awayX=dx/len,awayY=dy/len;
      const impulse=f*1.25;
      let vx=awayX*impulse+svx*.55;
      let vy=awayY*impulse+svy*.55;
      // Even if the hit comes from below/side, the obstacle should then fall.
      vy=Math.max(vy,2.2);
      const spin=clamp((svx*.018)+(awayX*.08),-.22,.22);
      obs.push(vx,vy,spin);
      this.shield.flash=400;
      this.snd.play('shield');
    } else {
      obs.push(dx/len*f,dy/len*f-2,clamp(dx*.01,-.18,.18));
      this.ball.flash=400;
      this._die();
    }
    this.fx.burst(obs.x,obs.y+top,this.cfg.particleColor);
    this.tutDone=true;
  }

  _die(){if(this.state!=='playing')return;this.state='dying';this.shield.die();this.ball.die();this.dtimer=0;this.snd.play('hit');}
  _afterDeath(){this.lives--;if(this.lives<=0){this._lose();return;}this.hpA=1;this.hpT=0;this.fadeDir=1;}
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
      oc.globalCompositeOperation='source-atop';
      oc.fillStyle=tint;
      oc.globalAlpha=.45;
      oc.fillRect(0,0,w,h);
      oc.globalAlpha=1;
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
    // One optional full-screen environment image; all other background art is
    // placed in the level editor as BgImg items and travels with its wave.
    const bg=this._spr('background');
    if(imgOk(bg))this._drawCoverFade(ctx,bg,0,0,CW,CH,0,this.cfg.backgroundSpriteColor);
  }

  _draw(){
    const ctx=this.ctx;
    this._drawBackground(ctx);
    // grid
    const sp=90,off=this.camY*.25%sp;
    ctx.strokeStyle=rgba(this.cfg.groundColor,.38);ctx.lineWidth=1;
    for(let y=off%sp;y<CH;y+=sp){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
    // stages
    for(let i=0;i<this.stages.length;i++){if(!this.stages[i].done)this.stages[i].draw(ctx,this._sst(i));}
    this.fx.draw(ctx);
    // ball below shield
    this.ball.draw(ctx);
    this.shield.draw(ctx);
    this._drawDots(ctx);
    this._drawProgressBars(ctx);
    if(!this.tutDone&&this.state==='playing'&&this.tutA>0)this._drawTut(ctx);
    if(this.hpA>0)this._drawHp(ctx);
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
      const l=progressLocal(b),x=CW/2+l.x-(b.w||64)/2,y=CH/2+l.y-(b.h||300)/2;
      this._drawFlask(ctx,x,y,b.w||64,b.h||300,p,b.fill,b.line,b);
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
    ctx.fillStyle='rgba(255,255,255,.88)';ctx.font='bold 15px sans-serif';ctx.textAlign='center';
    ctx.fillText('Hold & drag to move',CW/2,this.shield.y-this.shield.r-24);
    const ay=this.shield.y-this.shield.r-8+Math.sin(Date.now()/500)*4;
    ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(CW/2,ay);ctx.lineTo(CW/2-7,ay+11);ctx.moveTo(CW/2,ay);ctx.lineTo(CW/2+7,ay+11);ctx.stroke();
    ctx.restore();
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
    ctx.globalAlpha=.8+.2*Math.sin(Date.now()/400);
    ctx.fillStyle='#fff';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('TAP TO PLAY',CW/2,CH*.84);ctx.restore();
  }

  _drawEnd(ctx){
    const finishBg=this._spr('background_finish');
    if(imgOk(finishBg))this._drawCoverFade(ctx,finishBg,0,0,CW,CH,0,this.cfg.backgroundSpriteColor);
    ctx.save();ctx.globalAlpha=this.endA;
    ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(0,0,CW,CH);
    const cw=300,ch=360,cx=(CW-cw)/2,cy=(CH-ch)/2;
    ctx.fillStyle=this.isWin?'#172117':'#211717';
    ctx.strokeStyle=this.isWin?'#52e08a':this.cfg.obstacleColor;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.rect(cx,cy,cw,ch);ctx.fill();ctx.stroke();
    ctx.font='56px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(this.isWin?'🎉':'😔',CW/2,cy+80);
    ctx.fillStyle='#fff';ctx.font='bold 26px sans-serif';ctx.fillText(this.isWin?'You Win!':'Game Over',CW/2,cy+150);
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='14px sans-serif';ctx.fillText(this.isWin?'Amazing!':'Better luck next time',CW/2,cy+182);
    const bw=200,bh=50,bx2=(CW-bw)/2,by2=cy+ch-72;
    const bg=ctx.createLinearGradient(bx2,0,bx2+bw,0);
    bg.addColorStop(0,this.cfg.obstacleColor);bg.addColorStop(1,this.cfg.obstacleColorAlt||'#5282e0');
    ctx.fillStyle=bg;ctx.beginPath();ctx.rect(bx2,by2,bw,bh);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 17px sans-serif';ctx.fillText('PLAY NOW',CW/2,by2+bh/2);
    ctx.restore();
  }

  destroy(){if(this._raf)cancelAnimationFrame(this._raf);this.cv.remove();}

  // Live orientation switch: one exported HTML serves both portrait and
  // landscape. Game state (lives, progress, flying obstacles) is preserved;
  // positions are re-derived from center-based layout coords or scaled.
  setOrientation(or){
    or=or==='landscape'?'landscape':'portrait';
    if(or===this.cfg.orientation)return;
    const oldW=CW,oldH=CH;
    this.cfg.orientation=or;setView(or);
    const kx=CW/oldW,ky=CH/oldH;
    this.cv.width=CW;this.cv.height=CH;
    // ball: recompute its fixed lines for the new screen
    const b=this.ball;
    b.x=CW/2;b.ty=CH*.72;b.idleY=Math.min(CH-b.r-8,b.ty+80);
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
          o.ix=layoutX({coordMode:o.coordMode,x:o.layoutLocalX});
          o.iy=layoutY({coordMode:o.coordMode,y:o.layoutLocalY});
          o.x=o.ix;o.y=o.iy;
        }else{o.x*=kx;o.y*=ky;}
      }
    }
    if(this.spawnTop!=null)this.spawnTop*=ky;
  }
}

const DEF={
  lives:3,gameSpeed:3.2,acceleration:0.4,obstaclePushForce:7,gravityModifier:1,
  hpBarShowTime:2000,tutorialDisplayTime:3500,
  playerColor:'#f5e642',playerOutlineColor:'#ffffff',playerSize:1.0,playerSpriteColor:'#ffffff',
  shieldColor:'#4fc3f7',shieldSize:1.0,shieldSpriteColor:'#ffffff',
  obstacleColor:'#e05252',obstacleColorAlt:'#5282e0',obstacleSpriteColor:'#ffffff',
  bgColor:'#1a1a2e',groundColor:'#2a2a40',particleColor:'#f5e642',backgroundSpriteColor:'#ffffff',
  stageColors:['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'],stageAccents:true,stageCount:5,orientation:'portrait',
  soundEnabled:true,soundVolume:0.8,soundVolumes:null,audioSources:null,
  levelData:null,
};

W.RisePlayable={DEF,init(el,cfg,assets,cb){return new Game(el,cfg,assets||{},cb||{});}};
})(window);

(function(W){'use strict';
const CW=390,CH=844;
function lerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
function clamp(v,l,h){return Math.max(l,Math.min(h,v));}
function hr(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?[parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)]:[180,180,180];}
function rgba(h,a){const[r,g,b]=hr(h);return`rgba(${r},${g},${b},${a})`;}
function imgOk(s){return s&&s.complete&&s.naturalWidth>0;}

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

//── Obstacle ─────────────────────────────────────────────────────────────────
class Obs{
  constructor(o){
    this.x=o.x??195;this.y=o.y??200;
    this.w=o.w||60;this.h=o.h||60;
    this.shape=o.shape||'rect';
    this.color=o.color||'#e05252';
    this.spr=o.sprite||null;
    this.moveX=o.moveX||0;
    this.moveSpeed=o.moveSpeed||1800;
    this.t=o.phaseOffset||0;
    this.ix=this.x;this.iy=this.y;
    this.vx=0;this.vy=0;this.av=0;this.rot=0;this.live=true;this.kin=true;
  }
  reset(){this.x=this.ix;this.y=this.iy;this.t=0;this.vx=0;this.vy=0;this.av=0;this.rot=0;this.live=true;this.kin=true;}
  push(fx,fy,spin=0){if(!this.kin||!this.live)return;this.kin=false;this.vx=fx;this.vy=fy;this.av=spin;}
  update(dt){
    if(this.kin&&this.live&&this.moveX>0){this.t+=dt;this.x=this.ix+Math.sin(this.t/this.moveSpeed*Math.PI*2)*this.moveX;}
    if(!this.kin){
      // Free-body motion after the protector hits the obstacle.
      // X keeps inertia with damping, Y is pulled down by gravity.
      this.vy+=.38;
      this.x+=this.vx;this.y+=this.vy;
      this.vx*=.985;this.vy*=.995;
      this.rot+=this.av;this.av*=.985;
      if(this.y>3000)this.live=false;
    }
  }
  hits(cx,cy,cr){
    if(!this.kin||!this.live)return false;
    if(this.shape==='circle'){const dx=this.x-cx,dy=this.y-cy,r=this.w/2;return dx*dx+dy*dy<(r+cr)*(r+cr);}
    const nx=clamp(cx,this.x-this.w/2,this.x+this.w/2),ny=clamp(cy,this.y-this.h/2,this.y+this.h/2);
    return(cx-nx)**2+(cy-ny)**2<cr*cr;
  }
  draw(ctx,sy){
    if(!this.live)return;
    const dx=this.x,dy=this.y+sy;
    ctx.save();
    ctx.translate(dx,dy);
    if(!this.kin)ctx.rotate(this.rot);
    if(imgOk(this.spr)){ctx.drawImage(this.spr,-this.w/2,-this.h/2,this.w,this.h);}
    else{
      ctx.fillStyle=this.color;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=2;
      if(this.shape==='circle'){ctx.beginPath();ctx.arc(0,0,this.w/2,0,Math.PI*2);ctx.fill();ctx.stroke();}
      else if(this.shape==='triangle'){const hw=this.w/2,hh=this.h/2;ctx.beginPath();ctx.moveTo(0,-hh);ctx.lineTo(hw,hh);ctx.lineTo(-hw,hh);ctx.closePath();ctx.fill();ctx.stroke();}
      else{ctx.beginPath();ctx.rect(-this.w/2,-this.h/2,this.w,this.h);ctx.fill();ctx.stroke();}
    }
    ctx.restore();
  }
}

//── Stage ─────────────────────────────────────────────────────────────────────
class Stage{
  constructor(idx,obs,color){this.idx=idx;this.obs=obs;this.color=color;this.H=850;this.worldY=idx*this.H;}
  reset(){this.obs.forEach(o=>o.reset());}
  resetAt(worldY){this.worldY=worldY;this.reset();}
  update(dt,fallSpeed=0){
    // Stages are now falling waves: obstacles keep their local layout,
    // while the whole wave moves from the top of the screen downward.
    this.worldY+=fallSpeed*dt;
    this.obs.forEach(o=>o.update(dt));
  }
  draw(ctx,top){
    const g=ctx.createLinearGradient(0,top,0,top+this.H);
    g.addColorStop(0,rgba(this.color,.08));g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(0,top,CW,this.H);
    this.obs.forEach(o=>o.draw(ctx,top));
  }
  hit(px,py,pr,top){for(const o of this.obs){if(o.hits(px,py-top,pr))return o;}return null;}
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
    if(imgOk(this.spr)){ctx.drawImage(this.spr,x-r,y-r,r*2,r*2);return;}
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
    this.x=CW/2;this.y=CH*.72;
    this.ty=this.y;
    this.dead=false;this.da=0;this.ra=0;this.flash=0;
    this.flying=false;this.fy=0;
    this.travel=0;this.speed=0;
    this.spr=null;
  }
  get r(){return 20*this.cfg.playerSize;}
  get worldY(){return this.travel;}
  die(){this.dead=true;this.da=0;}
  respawn(){this.dead=false;this.x=CW/2;this.y=CH*.72;this.ty=this.y;this.da=0;this.ra=0;this.flash=0;this.flying=false;this.fy=0;this.travel=0;this.speed=0;}
  start(speed,travel=0){this.flying=true;this.speed=speed;this.travel=travel;}
  flyAway(){this.flying=true;this.fy=0;}
  update(dt){
    if(this.dead){this.da=Math.min(1,this.da+dt/500);return;}
    if(this.ra<1)this.ra=Math.min(1,this.ra+dt/300);
    if(this.flash>0)this.flash-=dt;
    if(this.flying){this.travel+=this.speed*dt;}
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
    if(imgOk(this.spr)){ctx.drawImage(this.spr,x-r,y-r,r*2,r*2);return;}
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
    this.assets=assets||{};
    this.cb=cb||{};
    // canvas
    this.cv=document.createElement('canvas');
    this.cv.width=CW;this.cv.height=CH;
    this.cv.style.cssText='display:block;width:100%;height:100%;touch-action:none;user-select:none;-webkit-user-select:none;';
    el.appendChild(this.cv);
    this.ctx=this.cv.getContext('2d');
    this.fx=new FX();
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
    // levelData: array[5] of obs-config arrays from level editor
    const ld=c.levelData;
    const hasLD=Array.isArray(ld)&&ld.some(s=>Array.isArray(s)&&s.length>0);
    for(let si=0;si<5;si++){
      let obs=[];
      if(hasLD&&Array.isArray(ld[si])&&ld[si].length>0){
        obs=ld[si].map(o=>{
          const ob=new Obs({...o,color:o.color||(si%2===0?c.obstacleColor:c.obstacleColorAlt)});
          ob.spr=this._spr('obstacle_stage'+si)||this._spr('obstacle');
          return ob;
        });
      } else {
        const n=2+si;
        for(let oi=0;oi<n;oi++){
          const ob=new Obs({
            x:80+(oi%2)*230,y:160+Math.floor(oi/2)*200+si*15,
            w:55+si*5,h:55+si*5,shape:sh[(oi+si)%3],
            color:oi%2===0?c.obstacleColor:c.obstacleColorAlt,
            moveX:si>1&&oi%2===0?80:0,moveSpeed:1800-si*120,phaseOffset:oi*600,
          });
          ob.spr=this._spr('obstacle_stage'+si)||this._spr('obstacle');
          obs.push(ob);
        }
      }
      this.stages.push(new Stage(si,obs,sc[si%sc.length]));
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
  _start(){this.state='playing';this.ball.start(this._ballSpeed(),this.camY);}

  _loop(ts){
    if(!this._last)this._last=ts;
    const dt=Math.min(50,ts-this._last);this._last=ts;
    this._update(dt);this._draw();
    this._raf=requestAnimationFrame(t=>this._loop(t));
  }

  _sst(i){return this.stages[i].worldY;}

  _updateCamera(){
    const targetScreenY=CH*.38;
    const followDistance=this.ball.ty-targetScreenY;
    const targetCamY=Math.max(0,this.ball.travel-followDistance);
    this.camY=lerp(this.camY,targetCamY,.12);
    this.ball.y=this.ball.ty-(this.ball.travel-this.camY);
  }

  _recycleStages(){
    const H=this.stages[0].H;
    let highest=Math.min(...this.stages.map(s=>s.worldY));
    for(const st of this.stages){
      // When a wave has fallen below the screen, move it back above every
      // other wave. This creates new obstacles at the top instead of moving
      // old level chunks upward with the camera.
      if(st.worldY>CH+CH*.35){
        highest-=H;
        st.resetAt(highest);
        this.completedStages++;
        this.si=this.completedStages%this.stages.length;
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
    } else {
      this.ball.y=this.ball.ty-(this.ball.travel-this.camY);
    }
    if(st==='playing'||st==='respawning'){
      const fall=this._obstacleFallSpeed();
      this.stages.forEach(s=>s.update(dt,fall));
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
    } else {
      obs.push(dx/len*f,dy/len*f-2,clamp(dx*.01,-.18,.18));
      this.ball.flash=400;
      this._die();
    }
    this.fx.burst(obs.x,obs.y+top,this.cfg.particleColor);
    this.tutDone=true;
  }

  _die(){if(this.state!=='playing')return;this.state='dying';this.shield.die();this.ball.die();this.dtimer=0;}
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
  _win(){this.state='won';this.isWin=true;this.ball.flyAway();setTimeout(()=>{this.state='endcard';this.cb.onWin&&this.cb.onWin();},1400);}
  _lose(){this.state='endcard';this.isWin=false;this.cb.onLose&&this.cb.onLose();}

  _draw(){
    const ctx=this.ctx;
    ctx.fillStyle=this.cfg.bgColor;ctx.fillRect(0,0,CW,CH);
    // grid
    const sp=90,off=this.camY*.25%sp;
    ctx.strokeStyle=rgba(this.cfg.groundColor,.38);ctx.lineWidth=1;
    for(let y=off%sp;y<CH;y+=sp){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
    // stages
    for(let i=0;i<this.stages.length;i++)this.stages[i].draw(ctx,this._sst(i));
    this.fx.draw(ctx);
    // ball below shield
    this.ball.draw(ctx);
    this.shield.draw(ctx);
    this._drawDots(ctx);
    if(!this.tutDone&&this.state==='playing'&&this.tutA>0)this._drawTut(ctx);
    if(this.hpA>0)this._drawHp(ctx);
    if(this.fadeA>0){ctx.fillStyle=`rgba(0,0,0,${this.fadeA})`;ctx.fillRect(0,0,CW,CH);}
    if(this.state==='start')this._drawStart(ctx);
    if(this.state==='endcard')this._drawEnd(ctx);
  }

  _drawDots(ctx){
    const n=this.stages.length,r=5,gap=12,sc=this.cfg.stageColors||['#e05252'];
    let x=(CW-n*(r*2)-(n-1)*gap)/2,y=CH-22;
    for(let i=0;i<n;i++){ctx.beginPath();ctx.arc(x+r,y,r,0,Math.PI*2);ctx.fillStyle=i===this.si?sc[i%sc.length]:rgba('#fff',.2);ctx.fill();x+=r*2+gap;}
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
    const g=ctx.createRadialGradient(CW/2,CH/2,CH*.1,CW/2,CH/2,CH*.8);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');
    ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);
    ctx.globalAlpha=.8+.2*Math.sin(Date.now()/400);
    ctx.fillStyle='#fff';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('TAP TO PLAY',CW/2,CH*.84);ctx.restore();
  }

  _drawEnd(ctx){
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
}

const DEF={
  lives:3,gameSpeed:3.2,acceleration:0.4,obstaclePushForce:7,
  hpBarShowTime:2000,tutorialDisplayTime:3500,
  playerColor:'#f5e642',playerOutlineColor:'#ffffff',playerSize:1.0,
  shieldColor:'#4fc3f7',shieldSize:1.0,
  obstacleColor:'#e05252',obstacleColorAlt:'#5282e0',
  bgColor:'#1a1a2e',groundColor:'#2a2a40',particleColor:'#f5e642',
  stageColors:['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'],
  levelData:null,
};

W.RisePlayable={DEF,init(el,cfg,assets,cb){return new Game(el,cfg,assets||{},cb||{});}};
})(window);

/**
 * RISE Playable — HTML5/Canvas game engine
 * Self-contained, no dependencies
 */
(function (global) {
  'use strict';

  const CW = 390, CH = 844;

  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function hexRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1],16), parseInt(r[2],16), parseInt(r[3],16)] : [255,255,255];
  }
  function rgba(hex, a) { const [r,g,b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }

  // ── Particle ───────────────────────────────────────────────────────────────
  class Particles {
    constructor() { this.list = []; }
    burst(x, y, color, n=12) {
      for (let i=0;i<n;i++) {
        const a = Math.PI*2*i/n + Math.random()*.6;
        const s = 2+Math.random()*5;
        this.list.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s-3,
          life:1, d:.025+Math.random()*.02, r:2+Math.random()*4, color });
      }
    }
    update() {
      for (let i=this.list.length-1;i>=0;i--) {
        const p=this.list[i];
        p.x+=p.vx; p.y+=p.vy; p.vy+=.18; p.life-=p.d;
        if(p.life<=0) this.list.splice(i,1);
      }
    }
    draw(ctx) {
      for (const p of this.list) {
        ctx.globalAlpha=p.life;
        ctx.fillStyle=p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
    }
  }

  // ── Obstacle ───────────────────────────────────────────────────────────────
  class Obs {
    constructor(o) {
      this.x=o.x||195; this.y=o.y||200;
      this.w=o.w||60;  this.h=o.h||60;
      this.shape=o.shape||'rect';       // rect|circle|triangle
      this.color=o.color||'#e05252';
      this.sprite=o.sprite||null;       // HTMLImageElement
      this.moveX=o.moveX||0;            // amplitude px (0=static)
      this.moveSpeed=o.moveSpeed||1800; // ms full cycle
      this.ix=this.x; this.iy=this.y;
      this.t=o.phaseOffset||0;
      // physics
      this.vx=0; this.vy=0; this.live=true; this.kinematic=true;
    }
    reset() {
      this.x=this.ix; this.y=this.iy;
      this.vx=0; this.vy=0; this.live=true; this.kinematic=true;
    }
    push(fx,fy) {
      if(!this.kinematic||!this.live) return;
      this.kinematic=false; this.vx=fx; this.vy=fy;
    }
    update(dt) {
      if(this.kinematic&&this.live&&this.moveX>0) {
        this.t+=dt;
        this.x=this.ix+Math.sin(this.t/this.moveSpeed*Math.PI*2)*this.moveX;
      }
      if(!this.kinematic) {
        this.vy+=.5; this.x+=this.vx; this.y+=this.vy; this.vx*=.97;
        if(this.y>2000) this.live=false;
      }
    }
    hitsCircle(cx,cy,cr) {
      if(!this.kinematic||!this.live) return false;
      if(this.shape==='circle') {
        const dx=this.x-cx, dy=this.y-cy, r=this.w/2;
        return dx*dx+dy*dy<(r+cr)*(r+cr);
      }
      const nx=clamp(cx,this.x-this.w/2,this.x+this.w/2);
      const ny=clamp(cy,this.y-this.h/2,this.y+this.h/2);
      const dx=cx-nx, dy=cy-ny;
      return dx*dx+dy*dy<cr*cr;
    }
    draw(ctx, sy) {
      if(!this.live) return;
      const dx=this.x, dy=this.y+sy;
      ctx.save();
      if(this.sprite) {
        ctx.drawImage(this.sprite, dx-this.w/2, dy-this.h/2, this.w, this.h);
      } else {
        ctx.fillStyle=this.color;
        ctx.strokeStyle='rgba(255,255,255,0.25)';
        ctx.lineWidth=2;
        if(this.shape==='circle') {
          ctx.beginPath(); ctx.arc(dx,dy,this.w/2,0,Math.PI*2); ctx.fill(); ctx.stroke();
        } else if(this.shape==='triangle') {
          const hw=this.w/2, hh=this.h/2;
          ctx.beginPath(); ctx.moveTo(dx,dy-hh); ctx.lineTo(dx+hw,dy+hh); ctx.lineTo(dx-hw,dy+hh);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.rect(dx-this.w/2, dy-this.h/2, this.w, this.h); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // ── Player (balloon) ───────────────────────────────────────────────────────
  class Player {
    constructor(cfg) {
      this.cfg=cfg;
      this.x=CW/2; this.y=CH*0.68;
      this.ty=this.y; this.dragging=false;
      this.dead=false; this.da=0; this.ra=0;
      this.flash=0; this.flying=false; this.fy=0;
      this.sprite=null;
    }
    get r() { return 22*this.cfg.playerSize; }
    down(y) { this.dragging=true; this.ty=y; }
    move(y) { if(this.dragging&&!this.dead) this.ty=y; }
    up()   { this.dragging=false; }
    die()  { this.dead=true; this.dragging=false; this.da=0; }
    respawn() { this.dead=false; this.x=CW/2; this.y=CH*0.68; this.ty=this.y; this.da=0; this.ra=0; }
    flyAway() { this.flying=true; }
    update(dt) {
      if(this.dead) { this.da=Math.min(1,this.da+dt/500); return; }
      if(this.flying) { this.fy=Math.min(1,this.fy+dt/700); this.y-=5*this.fy; return; }
      if(this.ra<1) this.ra=Math.min(1,this.ra+dt/300);
      if(this.flash>0) this.flash-=dt;
      if(this.dragging) this.y=lerp(this.y,this.ty,.2);
    }
    draw(ctx) {
      if(!this.y) return;
      const r=this.r, x=this.x, y=this.y;
      if(this.dead) {
        ctx.save();
        ctx.globalAlpha=lerp(1,0,this.da);
        ctx.translate(x,y); ctx.scale(lerp(1,.05,this.da),lerp(1,.05,this.da));
        this._balloon(ctx,0,0,r); ctx.restore(); return;
      }
      const pop=this.ra<1?(.5+.5*Math.sin(this.ra*Math.PI)):1;
      ctx.save();
      ctx.translate(x,y); ctx.scale(pop,pop);
      if(this.flash>0) ctx.globalAlpha=.5+.5*Math.sin(this.flash*.03);
      this._balloon(ctx,0,0,r);
      ctx.restore();
    }
    _balloon(ctx,x,y,r) {
      if(this.sprite) {
        ctx.drawImage(this.sprite, x-r, y-r, r*2, r*2); return;
      }
      const g=ctx.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r);
      g.addColorStop(0,this.cfg.playerColor);
      g.addColorStop(1,rgba(this.cfg.playerColor,.7));
      ctx.fillStyle=g;
      ctx.strokeStyle=this.cfg.playerOutlineColor;
      ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.3)';
      ctx.beginPath(); ctx.ellipse(x-r*.28,y-r*.28,r*.2,r*.12,-.5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=rgba(this.cfg.playerOutlineColor,.4);
      ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(x,y+r); ctx.quadraticCurveTo(x+5,y+r+10,x,y+r+20); ctx.stroke();
    }
  }

  // ── Stage ──────────────────────────────────────────────────────────────────
  // offsetY = position in world space (stage 0 starts at y=0)
  // During gameplay, camera scrolls: screenY = worldY + obstacleY - cameraY
  class Stage {
    constructor(idx, obstacles, color) {
      this.idx=idx; this.obstacles=obstacles; this.color=color;
      this.STAGE_H=850;
    }
    reset() { for(const o of this.obstacles) o.reset(); }
    update(dt) { for(const o of this.obstacles) o.update(dt); }
    // screenTop = where top of this stage is on screen right now
    draw(ctx, screenTop) {
      // subtle tint band
      const g=ctx.createLinearGradient(0,screenTop,0,screenTop+this.STAGE_H);
      g.addColorStop(0,rgba(this.color,.07)); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(0,screenTop,CW,this.STAGE_H);
      // obstacles: their y is relative to stage top
      for(const o of this.obstacles) o.draw(ctx, screenTop);
    }
    hits(px, py, pr, screenTop) {
      for(const o of this.obstacles) {
        if(o.hitsCircle(px, py-screenTop, pr)) return o;
      }
      return null;
    }
  }

  // ── Game ───────────────────────────────────────────────────────────────────
  class RiseGame {
    constructor(el, cfg, assets, cb) {
      this.cfg=Object.assign({},DEFAULT_CONFIG,cfg);
      this.assets=assets||{};
      this.cb=cb||{};
      this.el=el;

      // canvas
      this.cv=document.createElement('canvas');
      this.cv.width=CW; this.cv.height=CH;
      this.cv.style.cssText='display:block;width:100%;height:100%;touch-action:none;';
      el.appendChild(this.cv);
      this.ctx=this.cv.getContext('2d');

      this.fx=new Particles();
      this._buildStages();
      this._bindInput();
      this._reset();
    }

    _buildStages() {
      const cfg=this.cfg;
      const shapes=['rect','circle','triangle'];
      const sc=cfg.stageColors||['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'];
      this.stages=[];

      // Use levelData if provided (from level editor), else generate
      if(cfg.levelData && cfg.levelData.length>0) {
        cfg.levelData.forEach((stageObs,si)=>{
          const obs=stageObs.map(o=>new Obs({
            ...o,
            color: o.color||(si%2===0?cfg.obstacleColor:cfg.obstacleColorAlt),
          }));
          this.stages.push(new Stage(si, obs, sc[si%sc.length]));
        });
      } else {
        // Auto-generate 5 stages
        for(let si=0;si<5;si++) {
          const obs=[];
          const n=2+si;
          for(let oi=0;oi<n;oi++) {
            const col=oi%2;
            const row=Math.floor(oi/2);
            obs.push(new Obs({
              x: 80+col*230,
              y: 160+row*180+si*20,
              w: 55+si*5, h: 55+si*5,
              shape: shapes[(oi+si)%3],
              color: oi%2===0?cfg.obstacleColor:cfg.obstacleColorAlt,
              moveX: si>1&&oi%2===0?80:0,
              moveSpeed: 1800-si*150,
              phaseOffset: oi*500,
            }));
          }
          this.stages.push(new Stage(si, obs, sc[si%sc.length]));
        }
      }

      // Assign player sprite if available
      this._playerSprite=this.assets['player']||null;
      // Assign obs sprites
      for(const st of this.stages)
        for(const o of st.obstacles)
          if(!o.sprite && this.assets['obstacle']) o.sprite=this.assets['obstacle'];
    }

    _reset() {
      // Camera: cameraY is the world-Y that maps to screen top
      // Stage 0 top is at world Y=0. Player sits at CH*0.68.
      // Initial camera: show stage 0 from top.
      this.cameraY=0;
      this.speed=0;      // px/ms
      this.targetSpeed=0;
      this.state='start';// start|playing|dying|respawning|won|endcard
      this.lives=this.cfg.lives;
      this.stageIdx=0;
      this.deathTimer=0;
      this.fadeA=0; this.fadeDir=0;
      this.endA=0; this.isWin=false;
      this.tutA=1; this.tutTimer=0; this.tutDone=false;
      this.hpA=0; this.hpTimer=0;

      this.player=new Player(this.cfg);
      if(this._playerSprite) this.player.sprite=this._playerSprite;

      for(const s of this.stages) s.reset();
      this.fx=new Particles();

      if(this._raf) cancelAnimationFrame(this._raf);
      this._last=null;
      this._raf=requestAnimationFrame(t=>this._loop(t));
    }

    _bindInput() {
      const cv=this.cv;
      const sy=e=>{
        const rc=cv.getBoundingClientRect();
        return ((e.clientY||e.touches[0].clientY)-rc.top)*(CH/rc.height);
      };
      cv.addEventListener('pointerdown',e=>{
        e.preventDefault();
        if(this.state==='start')    { this._start(); return; }
        if(this.state==='playing')  { this.player.down(sy(e)); }
        if(this.state==='endcard')  { this.cb.onCTA&&this.cb.onCTA(); }
      });
      cv.addEventListener('pointermove',e=>{ e.preventDefault(); this.player.move(sy(e)); });
      cv.addEventListener('pointerup',  e=>{ e.preventDefault(); this.player.up(); });
      cv.addEventListener('pointerleave',e=>this.player.up());
    }

    _start() {
      this.state='playing';
      this.targetSpeed=this.cfg.gameSpeed/1000;
      this.stages[0]&&this.stages[0].reset();
    }

    _loop(ts) {
      if(!this._last) this._last=ts;
      const dt=Math.min(50,ts-this._last); this._last=ts;
      this._update(dt);
      this._draw();
      this._raf=requestAnimationFrame(t=>this._loop(t));
    }

    // stageScreenTop(i): where stage i's top appears on screen
    _sst(i) {
      return i*this.stages[0].STAGE_H - this.cameraY;
    }

    _update(dt) {
      const st=this.state;

      // scroll camera
      if(st==='playing'||st==='respawning') {
        this.speed=lerp(this.speed,this.targetSpeed,dt*.004);
        this.cameraY+=this.speed*dt;
      }

      this.player.update(dt);
      for(const s of this.stages) s.update(dt);
      this.fx.update();

      // tutorial
      if(st==='playing'&&!this.tutDone) {
        this.tutTimer+=dt;
        if(this.tutTimer>this.cfg.tutorialDisplayTime) this.tutDone=true;
        if(this.tutTimer>this.cfg.tutorialDisplayTime-600)
          this.tutA=lerp(1,0,(this.tutTimer-(this.cfg.tutorialDisplayTime-600))/600);
      }

      // hp bar
      if(this.hpA>0) {
        this.hpTimer+=dt;
        if(this.hpTimer>this.cfg.hpBarShowTime)
          this.hpA=Math.max(0,this.hpA-dt/400);
      }

      // collision
      if(st==='playing'&&!this.player.dead) {
        const px=this.player.x, py=this.player.y, pr=this.player.r;
        for(let i=0;i<this.stages.length;i++) {
          const top=this._sst(i);
          const hit=this.stages[i].hits(px,py,pr,top);
          if(hit) { this._hitObs(hit, top); break; }
        }
      }

      // stage advance: when current stage's top scrolls above -STAGE_H*0.4
      if(st==='playing') {
        const cur=this.stages[this.stageIdx];
        if(cur && this._sst(this.stageIdx) < -cur.STAGE_H*0.4) {
          this._advanceStage();
        }
      }

      // death sequence
      if(st==='dying') {
        this.deathTimer+=dt;
        if(this.deathTimer>800) this._afterDeath();
      }

      // fade
      if(this.fadeDir!==0) {
        this.fadeA=clamp(this.fadeA+this.fadeDir*dt/350,0,1);
        if(this.fadeA>=1&&this.fadeDir>0) { this._onFadeIn(); this.fadeDir=-1; }
        if(this.fadeA<=0&&this.fadeDir<0)   this.fadeDir=0;
      }

      // endcard
      if(st==='endcard') this.endA=Math.min(1,this.endA+dt/600);
    }

    _hitObs(obs, stageTop) {
      const dx=obs.x-this.player.x;
      const dy=(obs.y+stageTop)-this.player.y;
      const len=Math.sqrt(dx*dx+dy*dy)||1;
      const f=this.cfg.obstaclePushForce;
      obs.push(dx/len*f, dy/len*f-2);
      this.fx.burst(obs.x, obs.y+stageTop, this.cfg.particleColor);
      this.player.flash=400;
      this.tutDone=true;
      this._triggerDeath();
    }

    _triggerDeath() {
      if(this.state!=='playing') return;
      this.state='dying';
      this.player.die();
      this.deathTimer=0;
      this.speed=0; this.targetSpeed=0;
    }

    _afterDeath() {
      this.lives--;
      if(this.lives<=0) { this._lose(); return; }
      this.hpA=1; this.hpTimer=0;
      this.fadeDir=1;
    }

    _onFadeIn() {
      // reset current stage, rewind camera to show it
      const STAGE_H=this.stages[0].STAGE_H;
      this.cameraY=this.stageIdx*STAGE_H;
      this.stages[this.stageIdx].reset();
      this.player.respawn();
      this.state='respawning';
      this.targetSpeed=this.cfg.gameSpeed/1000;
      setTimeout(()=>{ if(this.state==='respawning') this.state='playing'; },400);
    }

    _advanceStage() {
      const next=this.stageIdx+1;
      if(next>=this.stages.length) { this._win(); return; }
      this.stageIdx=next;
      this.targetSpeed=(this.cfg.gameSpeed+this.cfg.acceleration*next)/1000;
      this.cb.onStageChange&&this.cb.onStageChange(next);
    }

    _win() {
      this.state='won'; this.isWin=true;
      this.player.flyAway();
      setTimeout(()=>{ this.state='endcard'; this.cb.onWin&&this.cb.onWin(); },1400);
    }
    _lose() {
      this.state='endcard'; this.isWin=false;
      this.cb.onLose&&this.cb.onLose();
    }

    _draw() {
      const ctx=this.ctx;
      ctx.fillStyle=this.cfg.bgColor;
      ctx.fillRect(0,0,CW,CH);

      // bg grid lines (parallax)
      const sp=90, off=(this.cameraY*.25)%sp;
      ctx.strokeStyle=rgba(this.cfg.groundColor,.35);
      ctx.lineWidth=1;
      for(let y=off%sp;y<CH;y+=sp) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CW,y); ctx.stroke();
      }

      // stages
      for(let i=0;i<this.stages.length;i++)
        this.stages[i].draw(ctx, this._sst(i));

      this.fx.draw(ctx);
      this.player.draw(ctx);

      // progress dots
      this._drawProgress(ctx);

      // tutorial hint
      if(!this.tutDone && this.state==='playing' && this.tutA>0) this._drawTut(ctx);

      // hp bar
      if(this.hpA>0) this._drawHp(ctx);

      // fade
      if(this.fadeA>0) {
        ctx.fillStyle=`rgba(0,0,0,${this.fadeA})`; ctx.fillRect(0,0,CW,CH);
      }

      // start screen
      if(this.state==='start') this._drawStart(ctx);

      // endcard
      if(this.state==='endcard') this._drawEndcard(ctx);
    }

    _drawProgress(ctx) {
      const n=this.stages.length, r=5, gap=12;
      const tw=n*(r*2)+(n-1)*gap;
      let x=(CW-tw)/2, y=CH-22;
      for(let i=0;i<n;i++) {
        ctx.beginPath(); ctx.arc(x+r,y,r,0,Math.PI*2);
        ctx.fillStyle=i<=this.stageIdx
          ? (this.cfg.stageColors||['#e05252'])[i%5]
          : rgba('#ffffff',.2);
        ctx.fill(); x+=r*2+gap;
      }
    }

    _drawTut(ctx) {
      ctx.save(); ctx.globalAlpha=this.tutA;
      ctx.fillStyle='rgba(255,255,255,.9)';
      ctx.font='bold 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Hold & drag to move',CW/2,this.player.y-70);
      const t=Date.now()/500;
      ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2;
      const ay=this.player.y-52+Math.sin(t)*5;
      ctx.beginPath(); ctx.moveTo(CW/2,ay); ctx.lineTo(CW/2-8,ay+13); ctx.moveTo(CW/2,ay); ctx.lineTo(CW/2+8,ay+13); ctx.stroke();
      ctx.restore();
    }

    _drawHp(ctx) {
      ctx.save(); ctx.globalAlpha=this.hpA;
      const bw=130,bh=46,bx=(CW-bw)/2,by=18;
      ctx.fillStyle='rgba(0,0,0,.65)';
      ctx.beginPath(); ctx.rect(bx,by,bw,bh); ctx.fill();
      const hs=22, total=this.cfg.lives, gap=5;
      const tw2=total*hs+(total-1)*gap;
      let hx=(CW-tw2)/2;
      for(let i=0;i<total;i++) {
        ctx.font=hs+'px serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillStyle=i<this.lives?'#ff6b6b':'#444';
        ctx.globalAlpha=this.hpA*(i<this.lives?1:.35);
        ctx.fillText('♥',hx,by+bh/2); hx+=hs+gap;
      }
      ctx.restore();
    }

    _drawStart(ctx) {
      ctx.save();
      const g=ctx.createRadialGradient(CW/2,CH/2,CH*.15,CW/2,CH/2,CH*.75);
      g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.6)');
      ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
      ctx.globalAlpha=.8+.2*Math.sin(Date.now()/380);
      ctx.fillStyle='#fff'; ctx.font='bold 22px sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('TAP TO PLAY',CW/2,CH*.82);
      ctx.restore();
    }

    _drawEndcard(ctx) {
      ctx.save(); ctx.globalAlpha=this.endA;
      ctx.fillStyle='rgba(0,0,0,.78)'; ctx.fillRect(0,0,CW,CH);
      const cw=310,ch=380,cx=(CW-cw)/2,cy=(CH-ch)/2;
      ctx.fillStyle=this.isWin?'#172117':'#211717';
      ctx.strokeStyle=this.isWin?'#52e08a':'#e05252'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.rect(cx,cy,cw,ch); ctx.fill(); ctx.stroke();
      ctx.font='60px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(this.isWin?'🎉':'😔',CW/2,cy+85);
      ctx.fillStyle='#fff'; ctx.font='bold 28px sans-serif';
      ctx.fillText(this.isWin?'You Win!':'Game Over',CW/2,cy+160);
      ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='15px sans-serif';
      ctx.fillText(this.isWin?'Amazing!':'Tap to try again',CW/2,cy+196);
      // CTA button
      const bw=210,bh=52,bx2=(CW-bw)/2,by2=cy+ch-80;
      const bg=ctx.createLinearGradient(bx2,0,bx2+bw,0);
      bg.addColorStop(0,this.cfg.obstacleColor); bg.addColorStop(1,this.cfg.obstacleColorAlt);
      ctx.fillStyle=bg; ctx.beginPath(); ctx.rect(bx2,by2,bw,bh); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 18px sans-serif';
      ctx.fillText('PLAY NOW',CW/2,by2+bh/2);
      ctx.restore();
    }

    destroy() {
      if(this._raf) cancelAnimationFrame(this._raf);
      this.cv.remove();
    }
  }

  const DEFAULT_CONFIG = {
    lives:3, gameSpeed:3.2, acceleration:0.4,
    obstaclePushForce:7, hpBarShowTime:2000, tutorialDisplayTime:3500,
    playerColor:'#f5e642', playerOutlineColor:'#ffffff', playerSize:1.0,
    obstacleColor:'#e05252', obstacleColorAlt:'#5282e0',
    bgColor:'#1a1a2e', groundColor:'#2a2a40', particleColor:'#f5e642',
    stageColors:['#e05252','#52a0e0','#52e08a','#e07d52','#c052e0'],
    levelData: null,  // array of stages, each array of obstacle configs
  };

  global.RisePlayable = {
    DEFAULT_CONFIG,
    init(el, cfg, assets, cb) { return new RiseGame(el, cfg, assets||{}, cb||{}); },
  };
})(window);

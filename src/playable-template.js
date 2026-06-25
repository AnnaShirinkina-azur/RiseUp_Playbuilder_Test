/**
 * RISE Playable — Pure HTML5/JS game engine
 * Ported from Unity scripts: Player.cs, Stages.cs, Stage.cs,
 * Obstacle.cs, ObstacleMover.cs, Level.cs, DeathTrigger.cs
 *
 * Entry point: window.RisePlayable.init(config, assets)
 */

(function (global) {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  const STAGE_HEIGHT = 900;       // px, logical height between stages
  const CANVAS_WIDTH = 390;
  const CANVAS_HEIGHT = 844;
  const PLAYER_RADIUS = 22;
  const OBSTACLE_GRAVITY = 0.45;
  const PLAYER_TAG = 'player';
  const DEATH_ZONE_Y = CANVAS_HEIGHT + 60;

  // ─── Default config (mirrors all LunaInspector fields) ────────────────────
  const DEFAULT_CONFIG = {
    // Gameplay
    lives: 3,
    gameSpeed: 3.2,
    acceleration: 0.4,
    obstaclePushForce: 6,
    hpBarShowTime: 2000,
    tutorialDisplayTime: 3000,
    obstacleMoveDuration: 1800,   // ms

    // Visuals
    playerColor: '#f5e642',
    playerOutlineColor: '#ffffff',
    playerSize: 1.0,
    ballColor: '#f5e642',
    ballSize: 1.0,
    obstacleColor: '#e05252',
    obstacleColorAlt: '#5282e0',
    bgColor: '#1a1a2e',
    groundColor: '#2a2a40',
    particleColor: '#f5e642',
    stageColors: ['#e05252', '#52a0e0', '#52e08a', '#e07d52', '#c052e0'],
  };

  // ─── Utility helpers ──────────────────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 255, g: 255, b: 255 };
  }
  function colorWithAlpha(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ─── Particle system ──────────────────────────────────────────────────────
  class ParticleSystem {
    constructor() { this.particles = []; }
    emit(x, y, color, count = 12) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1, decay: 0.02 + Math.random() * 0.02,
          r: 3 + Math.random() * 4,
          color,
        });
      }
    }
    update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.15;
        p.life -= p.decay;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    draw(ctx) {
      for (const p of this.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  // ─── Obstacle ─────────────────────────────────────────────────────────────
  // Mirrors Obstacle.cs + ObstacleMover.cs
  class Obstacle {
    constructor(opts) {
      Object.assign(this, {
        x: 0, y: 0, w: 60, h: 60,
        shape: 'rect',       // 'rect' | 'circle' | 'triangle'
        color: '#e05252',
        vx: 0, vy: 0,
        mass: 10,
        isKinematic: true,   // Kinematic until hit
        gravityScale: 0,
        isActivated: false,
        isAlive: true,
        initX: 0, initY: 0,
        // motion (ObstacleMover)
        hasMotion: false,
        motionTargetX: 0,
        motionDuration: 1800,
        motionElapsed: 0,
        motionStartX: 0,
        motionStarted: false,
        motionDelay: 0,
        motionDelayElapsed: 0,
      }, opts);
      this.initX = this.x;
      this.initY = this.y;
      this.motionStartX = this.x;
    }

    enterStage() {
      // Called when stage becomes active (mirrors StageEntering event)
      if (this.hasMotion) {
        this.motionStarted = false;
        this.motionElapsed = 0;
        this.motionDelayElapsed = 0;
      }
    }

    reset() {
      this.x = this.initX;
      this.y = this.initY;
      this.vx = 0; this.vy = 0;
      this.isKinematic = true;
      this.gravityScale = 0;
      this.isActivated = false;
      this.isAlive = true;
      this.motionStarted = false;
      this.motionElapsed = 0;
      this.motionDelayElapsed = 0;
      this.motionStartX = this.initX;
    }

    enablePhysics(impulseX, impulseY) {
      if (this.isActivated) return;
      this.isActivated = true;
      this.isKinematic = false;
      this.gravityScale = 1;
      this.vx = impulseX;
      this.vy = impulseY;
    }

    update(dt, stageOffsetY) {
      // Motion (ObstacleMover)
      if (this.hasMotion && this.isKinematic && this.isAlive) {
        if (!this.motionStarted) {
          this.motionDelayElapsed += dt;
          if (this.motionDelayElapsed >= this.motionDelay) {
            this.motionStarted = true;
          }
        } else {
          this.motionElapsed += dt;
          const t = Math.min(1, this.motionElapsed / this.motionDuration);
          this.x = lerp(this.motionStartX, this.motionTargetX, t);
          if (t >= 1) {
            // ping-pong
            const tmp = this.motionTargetX;
            this.motionTargetX = this.motionStartX;
            this.motionStartX = tmp;
            this.motionElapsed = 0;
          }
        }
      }

      // Physics
      if (!this.isKinematic) {
        this.vy += OBSTACLE_GRAVITY * this.gravityScale;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        if (this.y > stageOffsetY + STAGE_HEIGHT + 200) {
          this.isAlive = false;
        }
      }
    }

    getBounds() {
      return { left: this.x - this.w / 2, right: this.x + this.w / 2, top: this.y - this.h / 2, bottom: this.y + this.h / 2 };
    }

    hitTestCircle(cx, cy, cr) {
      if (!this.isKinematic || !this.isAlive) return false;
      if (this.shape === 'circle') {
        const r = this.w / 2;
        const dx = this.x - cx, dy = this.y - cy;
        return dx * dx + dy * dy < (r + cr) * (r + cr);
      }
      // AABB vs circle
      const b = this.getBounds();
      const nearX = clamp(cx, b.left, b.right);
      const nearY = clamp(cy, b.top, b.bottom);
      const dx = cx - nearX, dy = cy - nearY;
      return dx * dx + dy * dy < cr * cr;
    }

    draw(ctx, offsetY) {
      if (!this.isAlive) return;
      const drawX = this.x;
      const drawY = this.y + offsetY;

      ctx.save();
      ctx.fillStyle = this.color;
      ctx.strokeStyle = colorWithAlpha('#ffffff', 0.3);
      ctx.lineWidth = 2;

      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.w / 2, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      } else if (this.shape === 'triangle') {
        const hw = this.w / 2, hh = this.h / 2;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY - hh);
        ctx.lineTo(drawX + hw, drawY + hh);
        ctx.lineTo(drawX - hw, drawY + hh);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(drawX - this.w / 2, drawY - this.h / 2, this.w, this.h, 6);
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ─── Stage ────────────────────────────────────────────────────────────────
  // Mirrors Stage.cs
  class Stage {
    constructor(opts) {
      Object.assign(this, {
        index: 0,
        offsetY: 0,       // absolute Y position of stage top
        obstacles: [],
        isLast: false,
        color: '#e05252',
      }, opts);
    }

    reset() {
      for (const o of this.obstacles) o.reset();
    }

    enterStage() {
      for (const o of this.obstacles) o.enterStage();
    }

    update(dt, worldY) {
      // worldY = current scroll offset (negative = scrolled down)
      const stageScreenY = this.offsetY + worldY;
      for (const o of this.obstacles) {
        o.update(dt, stageScreenY);
      }
    }

    draw(ctx, worldY) {
      const stageScreenY = this.offsetY + worldY;
      // Draw stage background band
      const bandTop = stageScreenY;
      const bandH = STAGE_HEIGHT;
      // subtle gradient per stage
      const grad = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandH);
      grad.addColorStop(0, colorWithAlpha(this.color, 0.06));
      grad.addColorStop(1, colorWithAlpha(this.color, 0.0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, bandTop, CANVAS_WIDTH, bandH);

      // Obstacles
      for (const o of this.obstacles) {
        o.draw(ctx, stageScreenY);
      }
    }

    // Check if stage should trigger "switch to next" (stage scrolled past top)
    // Mirrors Stage.cs → Update() checking transform.position.y < _minHeight
    isPastTop(worldY) {
      return this.offsetY + worldY < -STAGE_HEIGHT * 0.5;
    }
  }

  // ─── Player (cursor/balloon) ───────────────────────────────────────────────
  // Mirrors Player.cs
  class Player {
    constructor(config) {
      this.cfg = config;
      this.x = CANVAS_WIDTH / 2;
      this.y = CANVAS_HEIGHT * 0.65;
      this.targetY = this.y;
      this.isDragging = false;
      this.isDead = false;
      this.isVisible = true;
      this.deathAnim = 0;      // 0..1 death animation progress
      this.respawnAnim = 0;    // 0..1 respawn pop
      this.flyAnim = 0;        // 0..1 fly away
      this.isFlyingAway = false;
      this.flashTimer = 0;
    }

    get radius() {
      return PLAYER_RADIUS * this.cfg.playerSize;
    }

    startMove() {
      this.isDragging = true;
    }

    stopMove() {
      this.isDragging = false;
    }

    moveTo(y) {
      if (!this.isDragging || this.isDead) return;
      this.targetY = y;
    }

    death() {
      this.isDead = true;
      this.isDragging = false;
      this.deathAnim = 0;
    }

    respawn() {
      this.isDead = false;
      this.x = CANVAS_WIDTH / 2;
      this.y = CANVAS_HEIGHT * 0.65;
      this.targetY = this.y;
      this.deathAnim = 0;
      this.respawnAnim = 0;
      this.flyAnim = 0;
    }

    flyAway() {
      this.isFlyingAway = true;
    }

    hide() {
      this.isVisible = false;
    }

    update(dt) {
      if (this.isDead) {
        this.deathAnim = Math.min(1, this.deathAnim + dt / 400);
        return;
      }
      if (this.isFlyingAway) {
        this.flyAnim = Math.min(1, this.flyAnim + dt / 800);
        this.y -= 6 * this.flyAnim;
        return;
      }
      if (this.respawnAnim < 1) {
        this.respawnAnim = Math.min(1, this.respawnAnim + dt / 300);
      }
      if (this.flashTimer > 0) this.flashTimer -= dt;

      // Smooth follow
      if (this.isDragging) {
        this.y = lerp(this.y, this.targetY, 0.18);
      }
    }

    draw(ctx) {
      if (!this.isVisible) return;
      const r = this.radius;
      const x = this.x;
      const y = this.y;

      if (this.isDead) {
        // Death: scale down + fade
        const scale = lerp(1, 0.1, this.deathAnim);
        const alpha = lerp(1, 0, this.deathAnim);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        this._drawBalloon(ctx, 0, 0, r);
        ctx.restore();
        return;
      }

      // Respawn pop
      const popScale = this.respawnAnim < 1
        ? 0.5 + 0.5 * Math.sin(this.respawnAnim * Math.PI)
        : 1;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(popScale, popScale);

      // Flash effect after hit
      if (this.flashTimer > 0) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.flashTimer * 0.03);
      }

      this._drawBalloon(ctx, 0, 0, r);
      ctx.restore();
    }

    _drawBalloon(ctx, x, y, r) {
      // Body
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      grad.addColorStop(0, colorWithAlpha(this.cfg.playerColor, 1));
      grad.addColorStop(0.7, this.cfg.playerColor);
      grad.addColorStop(1, colorWithAlpha(this.cfg.playerColor, 0.8));

      ctx.fillStyle = grad;
      ctx.strokeStyle = this.cfg.playerOutlineColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.28, y - r * 0.28, r * 0.22, r * 0.14, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // String
      ctx.strokeStyle = colorWithAlpha(this.cfg.playerOutlineColor, 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.quadraticCurveTo(x + 6, y + r + 12, x, y + r + 22);
      ctx.stroke();
    }
  }

  // ─── Main Game ────────────────────────────────────────────────────────────
  class RiseGame {
    constructor(container, config, assetMap, callbacks) {
      this.container = container;
      this.cfg = Object.assign({}, DEFAULT_CONFIG, config);
      this.assets = assetMap;    // { key: HTMLImageElement | AudioBuffer }
      this.cb = callbacks || {};  // onWin, onLose, onStageChange

      this._setupCanvas();
      this._buildStages();
      this._reset();
    }

    _setupCanvas() {
      this.canvas = document.createElement('canvas');
      this.canvas.width = CANVAS_WIDTH;
      this.canvas.height = CANVAS_HEIGHT;
      this.canvas.style.cssText = `
        display:block; width:100%; height:100%;
        object-fit:contain; touch-action:none;
        border-radius: inherit;
      `;
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      // Input
      this.canvas.addEventListener('pointerdown', e => this._onDown(e));
      this.canvas.addEventListener('pointermove', e => this._onMove(e));
      this.canvas.addEventListener('pointerup', e => this._onUp(e));
      this.canvas.addEventListener('pointerleave', e => this._onUp(e));
    }

    _canvasY(clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = CANVAS_HEIGHT / rect.height;
      return (clientY - rect.top) * scaleY;
    }

    _onDown(e) {
      e.preventDefault();
      if (this.state === 'start') {
        this._startGame();
        return;
      }
      if (this.state === 'playing') {
        this.player.startMove();
        this.player.moveTo(this._canvasY(e.clientY));
      }
      if (this.state === 'endcard') {
        this.cb.onCTA && this.cb.onCTA();
      }
    }

    _onMove(e) {
      e.preventDefault();
      if (this.state === 'playing') {
        this.player.moveTo(this._canvasY(e.clientY));
      }
    }

    _onUp(e) {
      this.player && this.player.stopMove();
    }

    // ── Build stages from config ──────────────────────────────────────────
    _buildStages() {
      this.stages = [];
      const shapes = ['rect', 'circle', 'triangle'];
      const colors = this.cfg.stageColors;

      // 5 stages, each with a set of obstacles
      for (let si = 0; si < 5; si++) {
        const stageColor = colors[si % colors.length];
        const obstacles = [];
        const numObs = 3 + si;  // escalate complexity

        for (let oi = 0; oi < numObs; oi++) {
          const row = Math.floor(oi / 2);
          const col = oi % 2;
          const baseX = 80 + col * 230;
          const baseY = 180 + row * 200;
          const shape = shapes[oi % shapes.length];

          const isMoving = si > 0 && oi % 2 === 0;
          const obs = new Obstacle({
            x: baseX,
            y: baseY,
            w: 55 + si * 4,
            h: 55 + si * 4,
            shape,
            color: oi % 2 === 0
              ? this.cfg.obstacleColor
              : this.cfg.obstacleColorAlt,
            hasMotion: isMoving,
            motionTargetX: CANVAS_WIDTH - baseX,
            motionDuration: this.cfg.obstacleMoveDuration - si * 100,
            motionDelay: oi * 300,
          });
          obstacles.push(obs);
        }

        this.stages.push(new Stage({
          index: si,
          offsetY: si * STAGE_HEIGHT,
          obstacles,
          isLast: si === 4,
          color: stageColor,
        }));
      }
    }

    // ── Game state machine ────────────────────────────────────────────────
    _reset() {
      this.state = 'start';      // 'start' | 'playing' | 'dying' | 'respawning' | 'won' | 'endcard'
      this.worldY = 0;           // scroll offset (increases = world moves up)
      this.scrollSpeed = 0;      // current scroll speed px/ms
      this.targetSpeed = 0;
      this.lives = this.cfg.lives;
      this.currentStageIndex = 0;
      this.particles = new ParticleSystem();
      this.player = new Player(this.cfg);
      this.tutorialAlpha = 1;
      this.tutorialTimer = 0;
      this.tutorialDismissed = false;
      this.hpBarAlpha = 0;
      this.hpBarTimer = 0;
      this.deathSequenceTimer = 0;
      this.lastTime = null;
      this.stageTransitionTimer = 0;
      this.fadeAlpha = 0;
      this.fadeDir = 0;
      this.endcardAlpha = 0;
      this.isWin = false;

      for (const s of this.stages) s.reset();

      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(t => this._loop(t));
    }

    _startGame() {
      this.state = 'playing';
      this.targetSpeed = this.cfg.gameSpeed / 1000;  // px/ms
      this.stages[0].enterStage();
    }

    // ── Main loop ────────────────────────────────────────────────────────
    _loop(timestamp) {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min(50, timestamp - this.lastTime);
      this.lastTime = timestamp;

      this._update(dt);
      this._draw();

      this._raf = requestAnimationFrame(t => this._loop(t));
    }

    _update(dt) {
      const st = this.state;

      // Scroll
      if (st === 'playing') {
        this.scrollSpeed = lerp(this.scrollSpeed, this.targetSpeed, dt * 0.003);
        this.worldY -= this.scrollSpeed * dt;
      }

      // Player
      this.player.update(dt);

      // Stages
      for (const stage of this.stages) {
        stage.update(dt, this.worldY);
      }

      // Particles
      this.particles.update();

      // Tutorial
      if (st === 'playing' && !this.tutorialDismissed) {
        this.tutorialTimer += dt;
        if (this.tutorialTimer > this.cfg.tutorialDisplayTime) {
          this.tutorialDismissed = true;
        }
        // Fade out
        if (this.tutorialTimer > this.cfg.tutorialDisplayTime - 500) {
          this.tutorialAlpha = lerp(1, 0, (this.tutorialTimer - (this.cfg.tutorialDisplayTime - 500)) / 500);
        }
      }

      // HP bar
      if (this.hpBarAlpha > 0) {
        this.hpBarTimer += dt;
        if (this.hpBarTimer > this.cfg.hpBarShowTime) {
          this.hpBarAlpha = Math.max(0, this.hpBarAlpha - dt / 300);
        }
      }

      // Stage switching
      if (st === 'playing') {
        const cur = this.stages[this.currentStageIndex];
        if (cur && cur.isPastTop(this.worldY)) {
          this._nextStage();
        }
      }

      // Collision detection
      if (st === 'playing' && !this.player.isDead) {
        this._checkCollisions();
        this._checkDeathZone();
      }

      // Death sequence
      if (st === 'dying') {
        this.deathSequenceTimer += dt;
        if (this.deathSequenceTimer > 800) {
          this._respawnOrLose();
        }
      }

      // Fade
      if (this.fadeDir !== 0) {
        this.fadeAlpha = clamp(this.fadeAlpha + this.fadeDir * dt / 300, 0, 1);
        if (this.fadeAlpha >= 1 && this.fadeDir > 0) {
          this._onFadeIn();
          this.fadeDir = -1;
        }
        if (this.fadeAlpha <= 0 && this.fadeDir < 0) {
          this.fadeDir = 0;
        }
      }

      // Endcard fade
      if (st === 'endcard') {
        this.endcardAlpha = Math.min(1, this.endcardAlpha + dt / 500);
      }
    }

    _checkCollisions() {
      const px = this.player.x;
      const py = this.player.y;
      const pr = this.player.radius;

      for (const stage of this.stages) {
        for (const obs of stage.obstacles) {
          if (obs.hitTestCircle(px, py, pr)) {
            this._onObstacleHit(obs, stage);
          }
        }
      }
    }

    _checkDeathZone() {
      // DeathTrigger.cs equivalent — obstacles that fall onto player zone
      for (const stage of this.stages) {
        for (const obs of stage.obstacles) {
          if (!obs.isKinematic && obs.isAlive) {
            const screenY = obs.y + stage.offsetY + this.worldY;
            if (screenY > CANVAS_HEIGHT * 0.85 && obs.y > 0) {
              const dx = obs.x - this.player.x;
              if (Math.abs(dx) < obs.w / 2 + this.player.radius) {
                this._triggerDeath();
                return;
              }
            }
          }
        }
      }
    }

    _onObstacleHit(obs, stage) {
      // Push obstacle away (Obstacle.cs → OnTriggerEnter2D)
      const dx = obs.x - this.player.x;
      const dy = obs.y - this.player.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = this.cfg.obstaclePushForce;
      obs.enablePhysics((dx / len) * force, (dy / len) * force - 2);

      // Particles
      this.particles.emit(obs.x, obs.y + stage.offsetY + this.worldY, this.cfg.particleColor);

      // If obstacle was a "tutorial" one, dismiss tutorial
      this.tutorialDismissed = true;
    }

    _triggerDeath() {
      if (this.state !== 'playing') return;
      this.state = 'dying';
      this.player.death();
      this.deathSequenceTimer = 0;
      this.scrollSpeed = 0;
      this.targetSpeed = 0;
    }

    _respawnOrLose() {
      this.lives--;

      // Was it the last stage?
      const cur = this.stages[this.currentStageIndex];
      if (cur && cur.isLast) {
        this.lives = 0;
      }

      if (this.lives <= 0) {
        this._lose();
      } else {
        this._showHpBar();
        this._fadeAndRespawn();
      }
    }

    _showHpBar() {
      this.hpBarAlpha = 1;
      this.hpBarTimer = 0;
    }

    _fadeAndRespawn() {
      this.fadeDir = 1;
    }

    _onFadeIn() {
      // Respawn (Level.cs → sequence)
      this.player.respawn();
      const cur = this.stages[this.currentStageIndex];
      if (cur) cur.reset();
      this.targetSpeed = this.cfg.gameSpeed / 1000;
      this.state = 'respawning';
      setTimeout(() => {
        this.state = 'playing';
        cur && cur.enterStage();
      }, 500);
    }

    _nextStage() {
      const nextIndex = this.currentStageIndex + 1;
      if (nextIndex >= this.stages.length - 1) {
        // Win
        this._win();
        return;
      }
      this.currentStageIndex = nextIndex;
      this.targetSpeed = (this.cfg.gameSpeed + this.cfg.acceleration * nextIndex) / 1000;
      this.stages[nextIndex].enterStage();

      if (this.cb.onStageChange) this.cb.onStageChange(nextIndex);
    }

    _win() {
      this.state = 'won';
      this.isWin = true;
      this.player.flyAway();
      setTimeout(() => {
        this.state = 'endcard';
        this.cb.onWin && this.cb.onWin();
      }, 1500);
    }

    _lose() {
      this.state = 'endcard';
      this.isWin = false;
      this.cb.onLose && this.cb.onLose();
    }

    // ── Draw ────────────────────────────────────────────────────────────
    _draw() {
      const ctx = this.ctx;
      const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;

      // Background
      ctx.fillStyle = this.cfg.bgColor;
      ctx.fillRect(0, 0, W, H);

      // Scrolling bg lines (subtle parallax feel)
      this._drawBgLines(ctx);

      // Stages
      for (const stage of this.stages) {
        stage.draw(ctx, this.worldY);
      }

      // Particles
      this.particles.draw(ctx);

      // Player
      this.player.draw(ctx);

      // Tutorial
      if (!this.tutorialDismissed && this.state === 'playing' && this.tutorialAlpha > 0) {
        this._drawTutorial(ctx);
      }

      // HP Bar
      if (this.hpBarAlpha > 0) {
        this._drawHpBar(ctx);
      }

      // Stage indicator
      this._drawProgress(ctx);

      // Fade overlay
      if (this.fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Start screen
      if (this.state === 'start') {
        this._drawStartScreen(ctx);
      }

      // Endcard
      if (this.state === 'endcard') {
        this._drawEndcard(ctx);
      }
    }

    _drawBgLines(ctx) {
      const spacing = 80;
      const offset = (this.worldY * 0.3) % spacing;
      ctx.strokeStyle = colorWithAlpha(this.cfg.groundColor, 0.4);
      ctx.lineWidth = 1;
      for (let y = offset; y < CANVAS_HEIGHT; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    }

    _drawTutorial(ctx) {
      const cx = CANVAS_WIDTH / 2;
      const cy = this.player.y - 80;
      ctx.save();
      ctx.globalAlpha = this.tutorialAlpha;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Hold & drag to move', cx, cy);
      // Arrow
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      const t = Date.now() / 600;
      const arrowY = cy + 20 + Math.sin(t) * 5;
      ctx.beginPath();
      ctx.moveTo(cx, arrowY);
      ctx.lineTo(cx - 8, arrowY + 14);
      ctx.moveTo(cx, arrowY);
      ctx.lineTo(cx + 8, arrowY + 14);
      ctx.stroke();
      ctx.restore();
    }

    _drawHpBar(ctx) {
      const W = CANVAS_WIDTH;
      ctx.save();
      ctx.globalAlpha = this.hpBarAlpha;
      // Panel
      const bw = 120, bh = 44;
      const bx = (W - bw) / 2, by = 20;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 10);
      ctx.fill();

      // Hearts
      const heartSize = 22;
      const total = this.cfg.lives;
      const remaining = this.lives;
      const gap = 6;
      const totalW = total * heartSize + (total - 1) * gap;
      let hx = (W - totalW) / 2;
      const hy = by + bh / 2;
      for (let i = 0; i < total; i++) {
        ctx.font = `${heartSize}px serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = i < remaining ? '#ff6b6b' : '#555';
        ctx.globalAlpha = this.hpBarAlpha * (i < remaining ? 1 : 0.4);
        ctx.fillText('♥', hx, hy);
        hx += heartSize + gap;
      }
      ctx.restore();
    }

    _drawProgress(ctx) {
      const W = CANVAS_WIDTH;
      const total = this.stages.length;
      const dotR = 5;
      const gap = 14;
      const totalW = total * dotR * 2 + (total - 1) * gap;
      let dx = (W - totalW) / 2;
      const dy = CANVAS_HEIGHT - 24;

      for (let i = 0; i < total; i++) {
        ctx.beginPath();
        ctx.arc(dx + dotR, dy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i <= this.currentStageIndex
          ? this.cfg.stageColors[i % this.cfg.stageColors.length]
          : colorWithAlpha('#ffffff', 0.25);
        ctx.fill();
        dx += dotR * 2 + gap;
      }
    }

    _drawStartScreen(ctx) {
      const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
      // Dark vignette
      const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Tap to play
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 400);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAP TO PLAY', W / 2, H * 0.82);
      ctx.restore();
    }

    _drawEndcard(ctx) {
      const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
      ctx.save();
      ctx.globalAlpha = this.endcardAlpha;

      // Backdrop
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, W, H);

      // Card
      const cw = 320, ch = 400;
      const cx = (W - cw) / 2, cy = (H - ch) / 2;
      ctx.fillStyle = this.isWin ? '#1a2e1a' : '#2e1a1a';
      ctx.strokeStyle = this.isWin
        ? this.cfg.stageColors[0]
        : this.cfg.obstacleColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch, 20);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.font = '64px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.isWin ? '🎉' : '😔', W / 2, cy + 90);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(this.isWin ? 'You Win!' : 'Try Again', W / 2, cy + 170);

      // Subtitle
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '16px sans-serif';
      ctx.fillText(
        this.isWin ? 'Amazing balloon skills!' : `${this.cfg.lives - this.lives} lives used`,
        W / 2, cy + 205
      );

      // CTA button
      const btnW = 220, btnH = 52;
      const bx = (W - btnW) / 2, by = cy + ch - 90;
      const btnGrad = ctx.createLinearGradient(bx, by, bx + btnW, by);
      btnGrad.addColorStop(0, this.cfg.obstacleColor);
      btnGrad.addColorStop(1, this.cfg.obstacleColorAlt);
      ctx.fillStyle = btnGrad;
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 26);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PLAY NOW', W / 2, by + btnH / 2);

      ctx.restore();
    }

    destroy() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this.canvas.remove();
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  global.RisePlayable = {
    DEFAULT_CONFIG,
    init(container, config, assetMap, callbacks) {
      return new RiseGame(container, config, assetMap || {}, callbacks || {});
    },
  };

})(window);

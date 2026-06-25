/**
 * RISE Playable Builder
 * Reads config from UI, loads assets as base64, injects into template → downloads .html
 */

(function (global) {
  'use strict';

  // ─── Asset list ──────────────────────────────────────────────────────────
  // All asset paths relative to Assets/ folder
  const ASSET_MANIFEST = {
    textures: [
      'textures/bg_bathroom.png',
      'textures/bg_light_overlay.png',
      'textures/bg_sky.png',
      'textures/endcard_lose_image.png',
      'textures/endcard_win_image.png',
      'textures/hand.png',
      'textures/obj_brush.png',
      'textures/obj_brush_mask.png',
    ],
    audio: [
      'audio/bgm.wav',
      'audio/bgm_fail_loop.wav',
      'audio/sfx_confetti.wav',
      'audio/sfx_correct.wav',
      'audio/sfx_lose.wav',
      'audio/sfx_win.wav',
      'audio/sfx_wrong.wav',
    ],
    fonts: [
      'fonts/Baloo2-Bold.ttf',
      'fonts/Kameron-SemiBold.ttf',
    ],
  };

  // ─── Read config from the UI ──────────────────────────────────────────────
  function readConfig() {
    function val(id) {
      const el = document.getElementById(id);
      if (!el) return undefined;
      if (el.type === 'checkbox') return el.checked;
      if (el.type === 'number' || el.type === 'range') return parseFloat(el.value);
      return el.value;
    }

    return {
      // Gameplay
      lives: val('cfg-lives'),
      gameSpeed: val('cfg-gameSpeed'),
      acceleration: val('cfg-acceleration'),
      obstaclePushForce: val('cfg-pushForce'),
      hpBarShowTime: val('cfg-hpBarShowTime'),
      tutorialDisplayTime: val('cfg-tutorialTime'),
      obstacleMoveDuration: val('cfg-moveDuration'),

      // Visuals — player
      playerColor: val('cfg-playerColor'),
      playerOutlineColor: val('cfg-playerOutline'),
      playerSize: val('cfg-playerSize'),

      // Obstacles
      obstacleColor: val('cfg-obstacleColor'),
      obstacleColorAlt: val('cfg-obstacleColorAlt'),

      // Environment
      bgColor: val('cfg-bgColor'),
      groundColor: val('cfg-groundColor'),
      particleColor: val('cfg-particleColor'),

      // Stage palette (read as array)
      stageColors: [
        val('cfg-stage0'),
        val('cfg-stage1'),
        val('cfg-stage2'),
        val('cfg-stage3'),
        val('cfg-stage4'),
      ],
    };
  }

  // ─── Load a single file as base64 data URL ────────────────────────────────
  function fetchAsBase64(url) {
    return fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`Failed: ${url}`);
        return r.blob();
      })
      .then(blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url, data: reader.result });
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  }

  // ─── Load all assets ─────────────────────────────────────────────────────
  async function loadAllAssets(assetsBase, onProgress) {
    const allPaths = [
      ...ASSET_MANIFEST.textures,
      ...ASSET_MANIFEST.audio,
      ...ASSET_MANIFEST.fonts,
    ];

    const results = {};
    let done = 0;

    await Promise.allSettled(
      allPaths.map(async (path) => {
        try {
          const { url, data } = await fetchAsBase64(`${assetsBase}/${path}`);
          results[path] = data;
        } catch (e) {
          console.warn('Asset skipped:', path, e.message);
          results[path] = null;
        }
        done++;
        onProgress && onProgress(done / allPaths.length);
      })
    );

    return results;
  }

  // ─── Fetch the playable-template.js source ────────────────────────────────
  async function fetchPlayableSource() {
    const r = await fetch('src/playable-template.js');
    return r.text();
  }

  // ─── Generate the self-contained HTML ────────────────────────────────────
  function buildHTML(config, assetMap, gameSource) {
    const configJSON = JSON.stringify(config, null, 2);

    // Asset injection snippet: replaces 'assets/X' with base64 data
    const assetInjections = Object.entries(assetMap)
      .filter(([, v]) => v)
      .map(([k, v]) => `  assetMap[${JSON.stringify(k)}] = ${JSON.stringify(v)};`)
      .join('\n');

    // Font face declarations
    const fontFaces = (assetMap['fonts/Baloo2-Bold.ttf']
      ? `@font-face { font-family: 'Baloo2'; font-weight: 700; src: url('${assetMap['fonts/Baloo2-Bold.ttf']}'); }`
      : '') + '\n' +
      (assetMap['fonts/Kameron-SemiBold.ttf']
        ? `@font-face { font-family: 'Kameron'; font-weight: 600; src: url('${assetMap['fonts/Kameron-SemiBold.ttf']}'); }`
        : '');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>Rise – Playable Ad</title>
<style>
${fontFaces}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%; height: 100%;
  background: #000;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  font-family: 'Baloo2', 'Kameron', sans-serif;
}
#game-root {
  width: 390px; height: 844px;
  max-width: 100vw; max-height: 100vh;
  position: relative;
  overflow: hidden;
  border-radius: 32px;
}
@media (max-aspect-ratio: 390/844) {
  #game-root { width: 100vw; height: calc(100vw * 844 / 390); border-radius: 0; }
}
@media (min-aspect-ratio: 390/844) {
  #game-root { height: 100vh; width: calc(100vh * 390 / 844); border-radius: 0; }
}
</style>
</head>
<body>
<div id="game-root"></div>

<script>
/* ── Playable Engine ─────────────────────────────────── */
${gameSource}

/* ── Asset Map ───────────────────────────────────────── */
var assetMap = {};
${assetInjections}

/* ── Config ──────────────────────────────────────────── */
var playableConfig = ${configJSON};

/* ── Boot ────────────────────────────────────────────── */
(function() {
  var root = document.getElementById('game-root');
  var game = RisePlayable.init(root, playableConfig, assetMap, {
    onWin: function() {
      // CTA redirect – swap URL before publishing
      if (typeof mraid !== 'undefined') {
        try { mraid.open('https://example.com'); } catch(e) {}
      }
    },
    onLose: function() {},
    onCTA: function() {
      if (typeof mraid !== 'undefined') {
        try { mraid.open('https://example.com'); } catch(e) {}
      } else {
        window.open('https://example.com', '_blank');
      }
    },
    onStageChange: function(i) {}
  });
})();
</script>
</body>
</html>`;
  }

  // ─── Download helper ─────────────────────────────────────────────────────
  function downloadHTML(html, filename) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'rise_playable.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ─── Main build function (called from UI) ─────────────────────────────────
  async function buildAndDownload(opts) {
    const { assetsBase = 'Assets', onProgress, onDone, onError } = opts || {};

    try {
      onProgress && onProgress(0, 'Reading config…');
      const config = readConfig();

      onProgress && onProgress(0.05, 'Loading game engine…');
      const gameSource = await fetchPlayableSource();

      onProgress && onProgress(0.1, 'Loading assets…');
      const assetMap = await loadAllAssets(assetsBase, (p) => {
        onProgress && onProgress(0.1 + p * 0.8, `Loading assets ${Math.round(p * 100)}%…`);
      });

      onProgress && onProgress(0.92, 'Building HTML…');
      const html = buildHTML(config, assetMap, gameSource);

      // Estimate size
      const sizeKB = Math.round(html.length / 1024);

      onProgress && onProgress(1, `Done — ${sizeKB} KB`);
      downloadHTML(html, `rise_playable_${Date.now()}.html`);
      onDone && onDone(sizeKB);
    } catch (err) {
      console.error('Build failed:', err);
      onError && onError(err.message);
    }
  }

  // ─── Preview function (in iframe) ─────────────────────────────────────────
  async function buildPreview(iframe, opts) {
    const { assetsBase = 'Assets', onProgress, onError } = opts || {};
    try {
      onProgress && onProgress(0, 'Building preview…');
      const config = readConfig();
      const gameSource = await fetchPlayableSource();
      const assetMap = await loadAllAssets(assetsBase, (p) => {
        onProgress && onProgress(p * 0.9, `Loading ${Math.round(p * 100)}%…`);
      });
      const html = buildHTML(config, assetMap, gameSource);
      iframe.srcdoc = html;
      onProgress && onProgress(1, 'Preview ready');
    } catch (err) {
      onError && onError(err.message);
    }
  }

  // ─── Export ───────────────────────────────────────────────────────────────
  global.RiseBuilder = { buildAndDownload, buildPreview, readConfig, ASSET_MANIFEST };

})(window);

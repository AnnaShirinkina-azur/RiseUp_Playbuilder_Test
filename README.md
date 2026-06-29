# Rise Playable Builder

Браузерный инструмент для создания HTML5 playable-рекламы на базе игры Rise.
Без зависимостей от Luna или любых других SDK — чистый HTML/JS/Canvas.

## Структура

```
rise-playbuilder/
├── index.html              ← Панель маркетолога (открыть в браузере)
├── src/
│   ├── playable-template.js  ← Движок игры (порт Unity-скриптов)
│   └── builder.js            ← Сборщик: читает настройки → встраивает ассеты → отдаёт .html
└── Assets/
    ├── textures/             ← PNG спрайты
    ├── audio/                ← WAV звуки
    └── fonts/                ← TTF шрифты
```

## Как запустить

### Вариант 1 — GitHub Pages (рекомендуется)

1. Залить репозиторий на GitHub
2. Settings → Pages → Source: `main` / `root`
3. Открыть `https://<username>.github.io/<repo>/`

### Вариант 2 — локально

Нужен локальный сервер (из-за fetch ассетов):

```bash
# Python 3
python -m http.server 8080

# Node (npx)
npx serve .
```

Открыть `http://localhost:8080`

> ⚠️ Просто открыть `index.html` двойным кликом **не сработает** —
> браузер блокирует fetch локальных файлов из соображений безопасности.

## Рабочий процесс

1. Открыть панель в браузере
2. Настроить параметры во вкладках **Gameplay** и **Visuals**
3. Нажать **▶ Update Preview** — увидеть результат в превью (390×844)
4. Включить **🖱 Interact** чтобы потыкать игру прямо в панели
5. Нажать **⬇ Download Playable HTML** — скачается единый самодостаточный файл
6. Скачанный файл можно:
   - Открыть в браузере напрямую (всё встроено)
   - Загрузить в рекламную сеть (Meta, Google, Mintegral, AppLovin, ...)

## Настройки

### Gameplay
| Параметр | Что делает | По умолчанию |
|---|---|---|
| Lives | Количество жизней | 3 |
| Player size | Размер шарика | 1.0 |
| Game speed | Начальная скорость скролла (px/s) | 3.2 |
| Acceleration | Прибавка скорости за каждый стейдж | 0.4 |
| Push force | Сила отталкивания препятствий | 6 |
| Move duration | Скорость бокового движения препятствий (мс) | 1800 |
| HP bar time | Сколько мс показывать полоску жизней | 2000 |
| Tutorial time | Сколько мс показывать подсказку | 3000 |

### Visuals
- Цвет/контур шарика-игрока
- Цвета препятствий (основной + альтернативный)
- Фон, наземные линии, частицы
- Акцентный цвет каждого из 5 стейджей

## Технические ограничения

- Финальный HTML ~2–4 MB (ассеты встроены как base64)
- Лимит большинства рекламных сетей: 5 MB
- Для уменьшения размера: заменить WAV → MP3 128kbps в `Assets/audio/`

## Архитектура движка

Механика портирована из Unity C# скриптов:

| Unity | JS |
|---|---|
| `Player.cs` | класс `Player` в `playable-template.js` |
| `Stages.cs` | класс `RiseGame._buildStages()` |
| `Stage.cs` | класс `Stage` |
| `Obstacle.cs` + `ObstacleMover.cs` | класс `Obstacle` |
| `Level.cs` | класс `RiseGame` (state machine) |
| `DeathTrigger.cs` | `RiseGame._checkDeathZone()` |
| `LunaColorSettings.cs` | config object → `DEFAULT_CONFIG` |


## Important when updating logic

The editor page loads `src/playable-template.js` and `src/builder.js`. The downloaded playable HTML contains the game code inline, so after changing `playable-template.js` you must open/reload the editor and click **Update Preview** or **Download Playable HTML** again. Replacing only `playable-template.js` will not change an already-exported playable HTML file.

For the latest changes, keep these files together:

- `index.html` — contains the UI controls for Gravity modifier and per-level background uploads.
- `src/builder.js` — reads those UI values and embeds selected images into the exported playable.
- `src/playable-template.js` — uses `gravityModifier`, `background`, and `background_stage0...background_stage4`.

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
2. Настроить параметры во вкладках **Gameplay**, **Visuals** и **Audio**
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

### Audio
- Enable sounds + master volume
- 5 звуков, каждый с кастомной загрузкой (audio/*) и своей громкостью:
  - Background music (loop, по умолчанию `bgm.wav`)
  - Win (`sfx_win.wav`), Lose (`sfx_lose.wav`)
  - Ball hit — столкновение шара с препятствием / потеря жизни (`sfx_wrong.wav`)
  - Shield touch — соприкасание шара-защитника и препятствия (`sfx_correct.wav`)
- Кнопка ▶ рядом с каждым звуком — прослушать прямо в редакторе

### Background images (новая логика)
- **Environment image** (панель Environment / «One image» в редакторе) — одна
  опциональная картинка-окружение на весь экран, с общим тинтом.
- **Images library** (Level Editor → Images) — картинки загружаются в проект,
  затем кликом ставятся на любой мини-уровень как объекты. Каждую копию можно:
  - перетаскивать (Drag),
  - растягивать/сжимать (Scale или поля W/H — независимо по осям),
  - тонировать (поле Color для выбранной картинки = tint),
  - удалять (Del). Удаление из библиотеки убирает и все копии с уровней.
- Размещённые картинки рисуются за препятствиями и текстом, едут вместе со
  своей волной и не участвуют в коллизиях. Встраиваются в выгружаемый HTML.

### Orientation / выгрузка
- Выгружается **один адаптивный HTML**: ориентация определяется по viewport
  при запуске и меняется на лету при повороте (`resize`/`orientationchange`),
  без перезапуска игры — как в превью Luna Playground.
- Переключатель Portrait/Landscape в панели влияет только на превью и редактор.

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

### Update: SVG obstacle prefabs
- Added the `● Pyramid` obstacle prefab tool.
- Custom SVG import now has `Prefab mode`: every supported SVG element (`rect`, `circle`, `ellipse`, `polygon`, `polyline`, `path`) is converted into a separate obstacle, so collisions are calculated per ball/piece instead of one whole SVG bounds.
- Square SVG `rect` elements are treated as circle obstacles in prefab mode, which matches exported ball pyramids.

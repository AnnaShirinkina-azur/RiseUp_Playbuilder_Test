Patch: dynamic obstacles can still kill the player ball

Changes:
- The shield still pushes only untouched/kinematic obstacles, so it does not keep re-hitting the same flying piece every frame.
- The player ball now checks collisions against both untouched obstacles and already-pushed/dynamic obstacles.
- Result: after the shield touches an obstacle, that obstacle can still fly/fall into the player ball and trigger the normal death/life-loss flow.
- index.html cache-bust version for playable-template.js was bumped.

Files changed:
- src/playable-template.js
- index.html

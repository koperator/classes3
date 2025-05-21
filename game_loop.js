// --- START OF FILE game_loop.js ---

// Assumes globals: document, window, requestAnimationFrame, performance, console, canvas, ctx, GameState, gameState, input, lastTime, deltaTime, NORMAL_TIME_SCALE
// Assumes functions: updateCharacterSelection, drawCharacterSelection, updatePlaying, drawPlaying, drawMinimap, drawUI, drawGameOver, drawGameWon, startGame (from game_logic.js or ui.js), initScreen (from game_logic.js)
// Assumes constants: MINIMAP_VISUAL_UPDATE_INTERVAL (from game_setup.js)
// Assumes variables: lastMinimapUpdateTime (from game_setup.js)

window.frameCount = 0;

// --- Input Handling ---
function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (gameState === GameState.CharacterSelection && typeof classes !== 'undefined') {
            const numberKey = parseInt(key);
            if (!isNaN(numberKey) && numberKey >= 1 && numberKey <= classes.length) {
                const index = numberKey - 1;
                startGame(index);
            }
        } else if (gameState === GameState.Playing && window.player && window.player.active) {
            if (e.key === ' ') e.preventDefault();
            if (key === 'w') input.w = true;
            else if (key === 'a') input.a = true;
            else if (key === 's') input.s = true;
            else if (key === 'd') input.d = true;
            else if (key === 'shift') input.shift = true;
            else if (key === 'r') input.r = true;
            else if (key === ' ') input.space = true;
        } else if (gameState === GameState.GameOver || gameState === GameState.GameWon) {
            // <<<< MODIFIED: No action on keydown for Game Over/Won screens >>>>
            // gameState = GameState.Preloading;
            // initScreen();
        }
        input.keys[key] = true;
    });
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (gameState === GameState.Playing) {
            if (key === 'w') input.w = false;
            else if (key === 'a') input.a = false;
            else if (key === 's') input.s = false;
            else if (key === 'd') input.d = false;
            else if (key === 'shift') input.shift = false;
            else if (key === 'r') input.r = false;
            else if (key === ' ') input.space = false;
        }
        delete input.keys[key];
    });
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            if (gameState === GameState.CharacterSelection && window.selectionBoxes && window.selectionBoxes.length > 0) {
                const rect = canvas.getBoundingClientRect();
                const mouseCanvasX = e.clientX - rect.left;
                const mouseCanvasY = e.clientY - rect.top;
                window.selectionBoxes.forEach(box => {
                    if (mouseCanvasX >= box.rect.x && mouseCanvasX <= box.rect.x + box.rect.w &&
                        mouseCanvasY >= box.rect.y && mouseCanvasY <= box.rect.y + box.rect.h) {
                        startGame(box.classIndex);
                    }
                });
            } else if (gameState === GameState.Playing && window.player && window.player.active) {
                input.mouseDown = true;
                if (window.player.isPsion) {
                    window.player.attackedThisClick = false;
                }
            } else if (gameState === GameState.GameOver || gameState === GameState.GameWon) {
                 // <<<< MODIFIED: No action on mousedown for Game Over/Won screens >>>>
                // gameState = GameState.Preloading;
                // initScreen();
            }
        }
    });
    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            if (gameState === GameState.Playing && window.player && window.player.active) {
                input.mouseDown = false;
                if (window.player.isPsion) {
                    window.player.attackedThisClick = false;
                }
            }
        }
    });
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        input.mouseX = e.clientX - rect.left;
        input.mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// --- Game Loop ---
function gameLoop(timestamp) {
    if (!lastTime) { lastTime = timestamp; }
    deltaTime = (timestamp - lastTime) / 1000;
    deltaTime = Math.min(deltaTime, 0.1); // Max delta time / frame cap
    lastTime = timestamp;
    const now = performance.now();

    window.frameCount++;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === GameState.Playing || gameState === GameState.GameOver || gameState === GameState.GameWon) {
        if (now - lastMinimapUpdateTime > MINIMAP_VISUAL_UPDATE_INTERVAL) {
            if (typeof setMinimapNeedsUpdateFlag === 'function') {
                setMinimapNeedsUpdateFlag();
            }
            lastMinimapUpdateTime = now;
        }
    }


    switch (gameState) {
        case GameState.Preloading:
            break;
        case GameState.CharacterSelection:
            if (typeof updateCharacterSelection === 'function') updateCharacterSelection();
            if (typeof drawCharacterSelection === 'function') drawCharacterSelection();
            break;
        case GameState.Initializing:
            ctx.fillStyle = 'white'; ctx.font = '40px Arial'; ctx.textAlign = 'center';
            ctx.fillText("Initializing Level...", canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
            break;
        case GameState.Playing:
            updatePlaying(deltaTime);
            drawPlaying();
            if (typeof drawMinimap === 'function') drawMinimap(ctx, canvas);
            if (typeof drawUI === 'function') drawUI();
            break;
        case GameState.GameOver:
            window.gameTimeScale = NORMAL_TIME_SCALE;
            drawPlaying();
            if (typeof drawMinimap === 'function') drawMinimap(ctx, canvas);
            if (typeof drawGameOver === 'function') drawGameOver();
            break;
        case GameState.GameWon:
             window.gameTimeScale = NORMAL_TIME_SCALE;
            drawPlaying();
            if (typeof drawMinimap === 'function') drawMinimap(ctx, canvas);
            if (typeof drawGameWon === 'function') drawGameWon();
            break;
    }
    requestAnimationFrame(gameLoop);
}
// --- END OF FILE game_loop.js ---
// --- START OF FILE game_logic.js ---

// Assumes globals: window, performance, PF, console, Math, canvas, ctx, GameState, gameState, input, TILE_SIZE, NORMAL_TIME_SCALE, FOG_STATE, RAILGUN_EFFECT_DURATION, RAILGUN_PARTICLE_SPAWN_DELAY, RAILGUN_COLOR, RAILGUN_WIDTH, MG_WALL_SPARK_COUNT, MG_WALL_SPARK_SPEED_MIN, MG_WALL_SPARK_SPEED_MAX, AssetManager, CLASS_ID, Mercenary, distance, getRandomInt, WEAPON_ID, Player, TurretState, RailgunParticle, FlameParticle, loadAllGameSounds, assignLoadedGameSounds, playSound (from sounds.js)
// Assumes core game state variables from game_setup.js (player, zombies, projectiles, level, camera, gameOver, gameWon, powerups, audio, classes, powerupDisplayMessages etc.)
// Assumes functions: isWall, isSolidForPlayer, generateLevel, updateFogOfWar, drawLevel, spawnZombies, setTurretGlobals, setMinimapNeedsUpdateFlag, setupInputListeners (from game_loop.js), gameLoop (from game_loop.js), loadTileImages (from level_assets.js), loadZombieSprites (from zombie_sprites.js), spawnPowerups (from level_generator.js)

// --- Update Functions per State ---
function updatePlaying(dt) {
    if(window.gameOver) {
        if(gameState !== GameState.GameOver) {
            gameState = GameState.GameOver;
        }
        return;
    }
    if(gameWon) {
        if(gameState !== GameState.GameWon) {
            gameState = GameState.GameWon;
            if (typeof playSound === 'function') playSound('LEVEL_WIN', { volume: 0.8 });
        }
        return;
    }
    if (!window.player || !window.player.active) return;

    const effectiveDt = dt * window.gameTimeScale;

    const isWallFunc = (gx, gy) => isWall(gx, gy);
    const isSolidFunc = (gx, gy) => isSolidForPlayer(gx, gy);
    window.elapsedTime = (performance.now() - window.gameStartTime) / 1000;

    if (typeof updateFogOfWar === 'function') updateFogOfWar();

    window.player.update(effectiveDt, input, window.camera, isSolidFunc, isWallFunc, window.projectiles, window.grenades, window.rpgProjectiles, window.psiBlastParticles, window.psiBladeEffects, window.turrets, window.zombies, window.mercenaries, window.flameParticles);
    window.mercenaries.forEach(m => m.update(effectiveDt, window.player, window.zombies, window.turrets, window.mercenaries, isWallFunc, window.level.pathfinderGrid, window.level.finder, window.projectiles));
    window.turrets.forEach(t => t.update(effectiveDt, window.zombies, isWallFunc, window.level.pathfinderGrid, window.level.finder, window.projectiles, window.player));
    window.zombies.forEach(z => z.update(effectiveDt, window.player, window.mercenaries, window.turrets, window.level.pathfinderGrid, window.level.finder, isWallFunc, window.zombies, window.projectiles, window.shockwaves));

    for (let i = window.projectiles.length - 1; i >= 0; i--) {
        const p = window.projectiles[i];
        p.update(effectiveDt, isWallFunc);
        if (!p.active) { window.projectiles.splice(i, 1); continue; }

        if (p.hitWallThisFrame) {
            if (p.weaponId === WEAPON_ID.MACHINEGUN && typeof WallSparkParticle !== 'undefined' && typeof getRandomInt !== 'undefined') {
                for (let j = 0; j < MG_WALL_SPARK_COUNT; j++) {
                    const sparkAngle = p.wallHitAngle + Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
                    const sparkSpeed = getRandomInt(MG_WALL_SPARK_SPEED_MIN, MG_WALL_SPARK_SPEED_MAX);
                    window.wallSparkParticles.push(new WallSparkParticle(p.wallHitX, p.wallHitY, sparkAngle, sparkSpeed));
                }
            } else if (p.weaponId === WEAPON_ID.AUTOSHOTGUN && typeof WallSparkParticle !== 'undefined' && typeof getRandomInt !== 'undefined') {
                 for (let j = 0; j < SHOTGUN_WALL_SPARK_COUNT; j++) {
                    const sparkAngle = p.wallHitAngle + Math.PI + (Math.random() - 0.5) * Math.PI * 0.7;
                    const sparkSpeed = getRandomInt(SHOTGUN_WALL_SPARK_SPEED_MIN, SHOTGUN_WALL_SPARK_SPEED_MAX);
                    window.wallSparkParticles.push(new WallSparkParticle(
                        p.wallHitX, p.wallHitY, sparkAngle, sparkSpeed,
                        SHOTGUN_WALL_SPARK_RADIUS, SHOTGUN_WALL_SPARK_LIFESPAN,
                        SHOTGUN_WALL_SPARK_BOUNCES, SHOTGUN_WALL_SPARK_DAMPING
                    ));
                }
            }
        }
    }

    for (let i = window.flameParticles.length - 1; i >= 0; i--) {
        const p = window.flameParticles[i];
        p.update(effectiveDt, isWallFunc, window.zombies, window.turrets);
        if (p.hitWall && p.ownerWeapon && typeof FlameParticle !== 'undefined') { for (let j = 0; j < p.ownerWeapon.wallHitParticleCount; j++) { const burstAngle = Math.random() * Math.PI * 2; const burstSpeed = p.ownerWeapon.particleSpeed * 0.4 * (0.5 + Math.random()); const burstLifespan = p.ownerWeapon.wallHitAOELifespan * (0.7 + Math.random()); window.flameParticles.push(new FlameParticle(p.wallHitX, p.wallHitY, burstAngle, burstSpeed, burstLifespan, p.ownerWeapon, true)); } p.active = false; }
        if (!p.active) { window.flameParticles.splice(i, 1); }
    }

    window.grenades.forEach(g => { g.update(effectiveDt, isWallFunc); });
    window.grenadeParticles.forEach(p => p.update(effectiveDt, isWallFunc, window.zombies, window.player, window.mercenaries, window.turrets));
    window.rpgProjectiles.forEach(r => { r.update(effectiveDt, isWallFunc); });
    window.explosionParticles.forEach(p => p.update(effectiveDt, isWallFunc, window.zombies, window.player, window.mercenaries, window.turrets));
    window.smokeParticles.forEach(p => p.update(effectiveDt));
    window.wallSparkParticles.forEach(p => p.update(effectiveDt, isWallFunc));
    window.flashParticles.forEach(p => p.update(effectiveDt));
    window.psiBlastParticles.forEach(p => p.update(effectiveDt, isWallFunc, window.zombies));
    // window.psiBladeEffects.forEach(e => e.update(effectiveDt));
    window.railgunParticles.forEach(p => p.update(effectiveDt));
    window.shockwaves.forEach(s => s.update(effectiveDt));
    window.afterimages.forEach(a => a.update(effectiveDt));
    if (window.powerups) window.powerups.forEach(p => p.update(effectiveDt));
    if (window.temporarySpriteEffects) window.temporarySpriteEffects.forEach(s => s.update(effectiveDt));


    window.railgunEffects = window.railgunEffects.filter(effect => effect.timer > 0);
    window.smokeParticles = window.smokeParticles.filter(p => p.active);
    window.railgunParticles = window.railgunParticles.filter(p => p.active);
    window.flameParticles = window.flameParticles.filter(p => p.active);
    window.wallSparkParticles = window.wallSparkParticles.filter(p => p.active);
    window.grenades = window.grenades.filter(g => g.active);
    window.flashParticles = window.flashParticles.filter(p => p.active);
    window.grenadeParticles = window.grenadeParticles.filter(p => p.active);
    window.rpgProjectiles = window.rpgProjectiles.filter(r => r.active);
    window.explosionParticles = window.explosionParticles.filter(p => p.active);
    window.psiBlastParticles = window.psiBlastParticles.filter(p => p.active);
    window.psiBladeEffects = window.psiBladeEffects.filter(e => e.active);
    window.shockwaves = window.shockwaves.filter(s => s.active);
    window.afterimages = window.afterimages.filter(a => a.active);
    if (window.powerups) window.powerups = window.powerups.filter(p => p.active);
    if (window.temporarySpriteEffects) window.temporarySpriteEffects = window.temporarySpriteEffects.filter(s => s.active);
    window.zombies = window.zombies.filter(z => z.hp > 0);
    window.mercenaries = window.mercenaries.filter(m => m.active);
    if (typeof TurretState !== 'undefined') {
        window.turrets = window.turrets.filter(t => t.state !== TurretState.DESTROYED);
        if (window.player && window.player.isEngineer) { window.player.turrets = window.player.turrets.filter(t => t.state !== TurretState.DESTROYED); }
    }
    if (window.player && window.player.drones) { window.player.drones = window.player.drones.filter(d => d.active); }

    if (window.powerupDisplayMessages && window.powerupDisplayMessages.length > 0) {
        for (let i = window.powerupDisplayMessages.length - 1; i >= 0; i--) {
            const msg = window.powerupDisplayMessages[i];
            msg.timer -= effectiveDt * 1000;
            if (msg.timer <= 0) {
                window.powerupDisplayMessages.splice(i, 1);
            }
        }
    }

    if (typeof spawnZombies === 'function') spawnZombies();

    window.camera.x = window.player.x - canvas.width / 2;
    window.camera.y = window.player.y - canvas.height / 2;
    window.camera.x = Math.max(0, Math.min(window.level.width * TILE_SIZE - canvas.width, window.camera.x));
    window.camera.y = Math.max(0, Math.min(window.level.height * TILE_SIZE - canvas.height, window.camera.y));

    if (!gameWon && window.level.endX > 0) { const playerGridX = Math.floor(window.player.x / TILE_SIZE); const playerGridY = Math.floor(window.player.y / TILE_SIZE); const endGridX = Math.floor(window.level.endX / TILE_SIZE); const endGridY = Math.floor(window.level.endY / TILE_SIZE); if (playerGridX === endGridX && playerGridY === endGridY) { gameWon = true; window.gameTimeScale = NORMAL_TIME_SCALE; } }
}

// --- Drawing Function ---
function drawPlaying() {
     if (!window.player || !window.player.active) return;
     const camOffsetX = window.camera.x; const camOffsetY = window.camera.y;
     if (typeof drawLevel === 'function') drawLevel(ctx, window.level, camOffsetX, camOffsetY);

     if(window.powerups) window.powerups.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));

     window.afterimages.forEach(a => a.draw(ctx, camOffsetX, camOffsetY));
     window.shockwaves.forEach(s => s.draw(ctx, camOffsetX, camOffsetY));
     window.smokeParticles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     window.explosionParticles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     window.flashParticles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     window.wallSparkParticles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     window.grenadeParticles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     window.railgunParticles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     if (window.temporarySpriteEffects) window.temporarySpriteEffects.forEach(s => s.draw(ctx, camOffsetX, camOffsetY, window.player.angle));


     ctx.globalCompositeOperation = 'lighter';
     window.psiBlastParticles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     // window.psiBladeEffects.forEach(e => e.draw(ctx, camOffsetX, camOffsetY)); // Old arc visual
     window.flameParticles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     ctx.globalCompositeOperation = 'source-over';

     window.grenades.forEach(g => g.draw(ctx, camOffsetX, camOffsetY));
     window.rpgProjectiles.forEach(r => r.draw(ctx, camOffsetX, camOffsetY));
     window.projectiles.forEach(p => p.draw(ctx, camOffsetX, camOffsetY));
     window.turrets.forEach(t => t.draw(ctx, camOffsetX, camOffsetY));
     window.zombies.forEach(z => z.draw(ctx, camOffsetX, camOffsetY, window.player));
     window.mercenaries.forEach(m => m.draw(ctx, camOffsetX, camOffsetY));

    let originalLineWidth = ctx.lineWidth;
    let originalGlobalAlpha = ctx.globalAlpha;
    window.railgunEffects.forEach(effect => {
        const startGridX = Math.floor(effect.startX / TILE_SIZE);
        const startGridY = Math.floor(effect.startY / TILE_SIZE);
        const endGridX = Math.floor(effect.endX / TILE_SIZE);
        const endGridY = Math.floor(effect.endY / TILE_SIZE);

        if (typeof window.level !== 'undefined' && window.level.fogGrid &&
            (window.level.fogGrid[startGridY]?.[startGridX] === FOG_STATE.REVEALED ||
             window.level.fogGrid[startGridY]?.[startGridX] === FOG_STATE.WALL_VISIBLE ||
             window.level.fogGrid[endGridY]?.[endGridX] === FOG_STATE.REVEALED ||
             window.level.fogGrid[endGridY]?.[endGridX] === FOG_STATE.WALL_VISIBLE)) {

            if (effect.timer > RAILGUN_EFFECT_DURATION - RAILGUN_PARTICLE_SPAWN_DELAY * 1.5) {
                const alpha = Math.min(1, effect.timer / (RAILGUN_EFFECT_DURATION * 0.5));
                ctx.strokeStyle = RAILGUN_COLOR;
                ctx.lineWidth = RAILGUN_WIDTH * alpha;
                ctx.beginPath();
                ctx.moveTo(effect.startX - camOffsetX, effect.startY - camOffsetY);
                ctx.lineTo(effect.endX - camOffsetX, effect.endY - camOffsetY);
                ctx.stroke();
            }
        }
    });
    ctx.lineWidth = originalLineWidth;
    ctx.globalAlpha = originalGlobalAlpha;


     window.player.draw(ctx, camOffsetX, camOffsetY);
     if (window.player.drones) window.player.drones.forEach(drone => drone.draw(ctx, camOffsetX, camOffsetY));

     if (window.player.isBulletTimeActive) { ctx.fillStyle = 'rgba(0, 100, 255, 0.10)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
}


function assignDirectAssetsFromManager() {
    if (typeof assignLoadedGameSounds === 'function') {
        assignLoadedGameSounds();
    } else {
        console.error("assignLoadedGameSounds function from sounds.js is not available!");
    }
    if (typeof AssetManager.getAsset === 'function' && typeof window !== 'undefined') {
        window.imgCharSelectBg = AssetManager.getAsset('charSelectBg');
        if (!window.imgCharSelectBg) {
            console.warn("Character selection background image 'charSelectBg' not found in AssetManager.");
        }
        window.imgRPGExplosionSprite = AssetManager.getAsset('rpgExplosionSprite');
        if (!window.imgRPGExplosionSprite) console.warn("RPG Explosion Sprite 'rpgExplosionSprite' not found.");
        window.imgGrenadeExplosionSprite = AssetManager.getAsset('grenadeExplosionSprite');
        if (!window.imgGrenadeExplosionSprite) console.warn("Grenade Explosion Sprite 'grenadeExplosionSprite' not found.");
        window.imgPsiBladeSprite = AssetManager.getAsset('psiBladeSprite');
        if (!window.imgPsiBladeSprite) console.warn("Psi Blade Sprite 'psiBladeSprite' not found.");
        window.imgPsiBlastSprite = AssetManager.getAsset('psiBlastSprite');
        if (!window.imgPsiBlastSprite) console.warn("Psi Blast Sprite 'psiBlastSprite' not found.");

        // Individual character sprites are no longer primary for selection boxes
        // but keep this logic if they are used elsewhere or as fallback.
        window.charSelectionImages = [];
        if (typeof classes !== 'undefined' && classes.length > 0) {
            for (let i = 0; i < classes.length; i++) {
                const alias = `charSprite${i}`;
                const img = AssetManager.getAsset(alias);
                // This will show a warning if char_X.png are not found, which is expected if you're only using the char_select_bg.jpg strip.
                if (!img) console.warn(`Character selection sprite '${alias}' not found. This may be intended if using a sprite strip.`);
                window.charSelectionImages[i] = img || null; // Assign if loaded, else null
            }
        }
    }
}

function actualGameInitialization() {
    if (!window.inputListenersAttached) {
         setupInputListeners();
         window.inputListenersAttached = true;
    }
    gameState = GameState.CharacterSelection;
    if (typeof setTurretGlobals === 'function' && window.player) {
      setTurretGlobals(window.player, window.zombies, window.mercenaries, window.turrets);
    }
    if(typeof setMinimapNeedsUpdateFlag === 'function') setMinimapNeedsUpdateFlag();

    requestAnimationFrame(gameLoop);
}


// --- Initialization & Game Start ---
function startGame(selectedClassIndex) {
    if (gameState === GameState.Initializing || gameState === GameState.Playing) return;
    gameState = GameState.Initializing;

    window.zombies = []; window.projectiles = []; window.grenades = []; window.grenadeParticles = []; window.rpgProjectiles = [];
    window.explosionParticles = []; window.smokeParticles = []; window.railgunEffects = []; window.mercenaries = [];
    window.railgunParticles = []; window.flameParticles = []; window.wallSparkParticles = []; window.flashParticles = [];
    window.shockwaves = []; window.afterimages = []; window.psiBlastParticles = []; //window.psiBladeEffects = [];
    window.turrets = [];
    window.powerups = [];
    window.powerupDisplayMessages = [];
    window.temporarySpriteEffects = [];

    if (typeof window !== 'undefined') {
        window.staticBufferNeedsRedraw = true;
        if (window.previouslyRevealedStaticTiles) window.previouslyRevealedStaticTiles.clear();
        else window.previouslyRevealedStaticTiles = new Set();
    }


    let levelWidthTiles = 180; let levelHeightTiles = 180;
    if (levelWidthTiles % 2 === 0) levelWidthTiles++; if (levelHeightTiles % 2 === 0) levelHeightTiles++;

    if (typeof PF !== 'undefined' && typeof PF.AStarFinder === 'function') {
        if (window.level) window.level.finder = new PF.AStarFinder({ allowDiagonal: true, dontCrossCorners: true });
    } else {
        console.error("Pathfinding library (PF) or AStarFinder not loaded! Game cannot start properly.");
        gameState = GameState.CharacterSelection; return;
    }
    if (typeof generateLevel === 'function') {
        generateLevel(window.level, levelWidthTiles, levelHeightTiles);
    } else {
        console.error("generateLevel function is not defined! Check level.js. Game cannot start.");
        gameState = GameState.CharacterSelection; return;
    }

    window.player = new Player(window.level.startX, window.level.startY, classes[selectedClassIndex]);
    window.mercenaries = [];
    if (typeof Mercenary !== 'undefined' && typeof getRandomInt !== 'undefined' && typeof distance !== 'undefined' && typeof CLASS_ID !== 'undefined' && typeof MERC_SEPARATION_DISTANCE !== 'undefined' && typeof TILE !== 'undefined') {
        let mercCountToSpawn = 0;
        const playerClassId = window.player.classData.id;
        if (playerClassId === CLASS_ID.MARINE) { mercCountToSpawn = 6; }
        else if (playerClassId === CLASS_ID.DEVASTATOR ) { mercCountToSpawn = 0; }
        else if (playerClassId === CLASS_ID.BRAWLER) { mercCountToSpawn = 3; }

        if (mercCountToSpawn > 0) {
            let mercSpawnedCount = 0; const maxSpawnAttemptsMerc = 50; let attemptsMerc = 0;
            const startGridX = Math.floor(window.player.x / TILE_SIZE); const startGridY = Math.floor(window.player.y / TILE_SIZE);
            while (mercSpawnedCount < mercCountToSpawn && attemptsMerc < maxSpawnAttemptsMerc) {
                attemptsMerc++; const offsetX = getRandomInt(-3, 3); const offsetY = getRandomInt(-3, 3); if (offsetX === 0 && offsetY === 0) continue;
                const gridX = startGridX + offsetX; const gridY = startGridY + offsetY;
                if (gridX > 0 && gridX < window.level.width - 1 && gridY > 0 && gridY < window.level.height - 1 && window.level.grid[gridY]?.[gridX] === TILE.FLOOR) {
                    const spawnX = gridX * TILE_SIZE + TILE_SIZE / 2; const spawnY = gridY * TILE_SIZE + TILE_SIZE / 2;
                    let tooClose = distance(spawnX, spawnY, window.player.x, window.player.y) < TILE_SIZE * 1.5;
                    if (!tooClose) { for(const merc of window.mercenaries){ if(distance(spawnX, spawnY, merc.x, merc.y) < MERC_SEPARATION_DISTANCE * 1.5) { tooClose = true; break; } } }
                    if (!tooClose) { window.mercenaries.push(new Mercenary(spawnX, spawnY, mercSpawnedCount)); mercSpawnedCount++; }
                }
            }
        }
    }

    if (typeof spawnPowerups === 'function') {
        spawnPowerups(window.level, window.player.classData.id);
    }

     window.gameOver = false; gameWon = false; window.kills = 0;
     window.gameStartTime = performance.now(); window.elapsedTime = 0;
     if(typeof lastTime !== 'undefined') lastTime = window.gameStartTime;
     window.lastZombieSpawnTime = window.gameStartTime;
     window.gameTimeScale = NORMAL_TIME_SCALE;

     if(typeof lastMinimapUpdateTime !== 'undefined') lastMinimapUpdateTime = 0;
     if(typeof setMinimapNeedsUpdateFlag === 'function') setMinimapNeedsUpdateFlag();

     if (typeof setTurretGlobals === 'function') { setTurretGlobals(window.player, window.zombies, window.mercenaries, window.turrets); }

     window.camera.x = window.player.x - canvas.width / 2; window.camera.y = window.player.y - canvas.height / 2;
     window.camera.x = Math.max(0, Math.min(window.level.width * TILE_SIZE - canvas.width, window.camera.x));
     window.camera.y = Math.max(0, Math.min(window.level.height * TILE_SIZE - canvas.height, window.camera.y));

     if (typeof updateFogOfWar === 'function') updateFogOfWar();
     gameState = GameState.Playing;
     console.log("Game Starting!");
     if (typeof playSound === 'function') playSound('GAME_START');


     if (window.gameSounds && window.gameSounds.BACKGROUND_MUSIC) {
        playSound('BACKGROUND_MUSIC', { loop: true });
    } else {
        console.warn("Background music not loaded or available in window.gameSounds.BACKGROUND_MUSIC.");
    }
 }

function initScreen() {
    if (typeof GameState === 'undefined') {
        console.error("CRITICAL: GameState is not defined. Aborting initScreen.");
        if(ctx && canvas) { ctx.fillStyle='red'; ctx.font=`20px ${DEFAULT_FONT_FAMILY}`; ctx.textAlign='center'; ctx.fillText("ERROR: GameState missing!", canvas.width/2, canvas.height/2); }
        return;
    }
    gameState = GameState.Preloading;
    if (typeof AssetManager === 'undefined') {
        console.error("CRITICAL: AssetManager is not defined. Aborting initScreen.");
         if(ctx && canvas) { ctx.fillStyle='red'; ctx.font=`20px ${DEFAULT_FONT_FAMILY}`; ctx.textAlign='center'; ctx.fillText("ERROR: AssetManager missing!", canvas.width/2, canvas.height/2); }
        return;
    }
    AssetManager.reset();

    AssetManager.addExternalLoadingTask('tileImages');
    AssetManager.addExternalLoadingTask('zombieSprites');

    AssetManager.addAsset('char_select_bg.jpg', 'image', 'charSelectBg'); // Assumed to be the strip of all characters
    AssetManager.addAsset('_r_explosion.png', 'image', 'rpgExplosionSprite');
    AssetManager.addAsset('_g_explosion.png', 'image', 'grenadeExplosionSprite');
    AssetManager.addAsset('_psi_blades.png', 'image', 'psiBladeSprite');
    AssetManager.addAsset('_psi_blast.png', 'image', 'psiBlastSprite');

    // REMOVED loading for individual char_0.png etc., if char_select_bg.jpg contains the full strip.
    // If you still intend to use individual char_X.png for some reason, uncomment and ensure paths are correct.
    /*
    if (typeof classes !== 'undefined' && classes.length > 0) {
        for (let i = 0; i < classes.length; i++) {
            AssetManager.addAsset(`char_${i}.png`, 'image', `charSprite${i}`);
        }
    }
    */


    if (typeof loadAllGameSounds === 'function') {
        loadAllGameSounds();
    } else {
        console.error("loadAllGameSounds function from sounds.js is not available!");
    }

    const loadingProgress = (loaded, total) => {
        if(!ctx || !canvas) return;
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = `30px ${DEFAULT_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        const percentage = total > 0 ? Math.round((loaded / total) * 100) : 100;
        ctx.fillText(`Loading assets: ${percentage}% (${loaded}/${total})`, canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    };

    AssetManager.downloadAll(loadingProgress, () => {
        console.log("AssetManager: All tasks reported complete. Initializing game.");
        assignDirectAssetsFromManager();
        actualGameInitialization();
    });

    if (typeof loadTileImages === 'function') {
        loadTileImages();
    } else {
        console.error("loadTileImages function not found. Marking task as (failed) complete.");
        AssetManager.completeExternalLoadingTask('tileImages');
    }

    if (typeof loadZombieSprites === 'function') {
        loadZombieSprites();
    } else {
        console.error("loadZombieSprites function not found. Marking task as (failed) complete.");
        AssetManager.completeExternalLoadingTask('zombieSprites');
    }
}

initScreen();
// --- END OF FILE game_logic.js ---
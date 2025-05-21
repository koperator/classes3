// --- START OF FILE spawner.js ---

// --- spawner.js ---
// Assumes globals: Math, console, performance, distance, getRandomElement, ZOMBIE_TYPE, TILE
// Assumes window.level, window.camera, window.player, window.zombies, window.gameStartTime, window.elapsedTime, window.lastZombieSpawnTime, gameState (from game.js)
// Assumes constants: All constants from constants.js are global
// Assumes classes: Zombie
// Assumes state: GameState (from game.js)

// Helper function to calculate spawn interval multiplier based on time
function getSpawnIntervalMultiplier(time) {
    const peakTime = ZOMBIE_SPAWN_MIDGAME_PEAK_TIME;
    const scaleTime = ZOMBIE_SPAWN_INTERVAL_SCALE_TIME;
    const peakSlowdown = ZOMBIE_SPAWN_MIDGAME_SLOWDOWN;
    const endMultiplier = 1.0;

    if (time <= peakTime) {
        return 1.0 + (peakSlowdown - 1.0) * (time / peakTime);
    } else if (time <= scaleTime) {
        const timePastPeak = time - peakTime;
        const durationOfDecrease = scaleTime - peakTime;
        return peakSlowdown + (endMultiplier - peakSlowdown) * (timePastPeak / durationOfDecrease);
    } else {
        return endMultiplier;
    }
}


function spawnZombies() {
    const now = performance.now();
    let baseInterval;
    let currentInterval;
    let currentBatchSize = ZOMBIE_SPAWN_BATCH_SIZE_START;

    if (gameState === GameState.Playing && window.gameStartTime > 0) {
        const intervalProgress = Math.min(1, window.elapsedTime / ZOMBIE_SPAWN_INTERVAL_SCALE_TIME);
        baseInterval = ZOMBIE_SPAWN_INTERVAL_START + (ZOMBIE_SPAWN_INTERVAL_MIN - ZOMBIE_SPAWN_INTERVAL_START) * intervalProgress;

        const timeMultiplier = getSpawnIntervalMultiplier(window.elapsedTime);
        currentInterval = baseInterval * timeMultiplier;

        if (window.elapsedTime > ZOMBIE_SPAWN_INTERVAL_SCALE_TIME) {
            const extraTime = window.elapsedTime - ZOMBIE_SPAWN_INTERVAL_SCALE_TIME;
            const lateGameDecrease = extraTime * 0.4; // Interval decreases faster in late game
            currentInterval = Math.max(ZOMBIE_SPAWN_CAP_INTERVAL, ZOMBIE_SPAWN_INTERVAL_MIN - lateGameDecrease);
        }
        currentInterval = Math.max(ZOMBIE_SPAWN_CAP_INTERVAL, currentInterval);

        const batchProgress = Math.min(1, window.elapsedTime / ZOMBIE_SPAWN_BATCH_SCALE_TIME);
        currentBatchSize = ZOMBIE_SPAWN_BATCH_SIZE_START + (ZOMBIE_SPAWN_BATCH_SIZE_MAX - ZOMBIE_SPAWN_BATCH_SIZE_START) * batchProgress;
        if (window.elapsedTime > ZOMBIE_SPAWN_BATCH_SCALE_TIME) {
            currentBatchSize = ZOMBIE_SPAWN_BATCH_SIZE_MAX + Math.floor((window.elapsedTime - ZOMBIE_SPAWN_BATCH_SCALE_TIME) / 30);
            currentBatchSize = Math.min(ZOMBIE_SPAWN_CAP_BATCH, currentBatchSize);
        }
        currentBatchSize = Math.round(currentBatchSize);
    } else {
        return;
    }

    if (window.elapsedTime > 25 && Math.random() < TYRANT_SPAWN_CHANCE && window.zombies.length < MAX_ZOMBIES) {
        trySpawnSpecialZombie(ZOMBIE_TYPE.TYRANT);
    }
    if (window.elapsedTime > 45 && Math.random() < HIVE_MASTER_SPAWN_CHANCE && window.zombies.length < MAX_ZOMBIES) {
        trySpawnSpecialZombie(ZOMBIE_TYPE.HIVE_MASTER);
    }

    if (now - window.lastZombieSpawnTime < currentInterval || window.zombies.length >= MAX_ZOMBIES) {
        return;
    }
    window.lastZombieSpawnTime = now;

    const totalWeight = ENTRANCE_SPAWN_WEIGHT + OFFSCREEN_SPAWN_WEIGHT;
    let spawnedThisBatch = 0;

    const timeFactor = Math.min(1.0, window.elapsedTime / 300); // General progression factor for special chances
    const currentTankChance = TANK_CHANCE * (0.5 + timeFactor * 0.7);
    const currentRunnerChance = RUNNER_CHANCE * (1.0 + timeFactor * 0.2);
    const currentSpitterChance = SPITTER_CHANCE * timeFactor; // Reduced base chance in constants
    const currentBloaterChance = BLOATER_CHANCE * timeFactor;
    const currentScreamerChance = SCREAMER_CHANCE * (0.2 + timeFactor * 0.8); // Reduced base chance in constants

    // Heavy Zombie spawn logic based on time
    let currentHeavyChance = 0;
    let spawnRegulars = true;
    if (window.elapsedTime > 240) { // After 4 minutes
        currentHeavyChance = HEAVY_ZOMBIE_CHANCE_LATE;
        spawnRegulars = false; // Replace regulars with heavies
    } else if (window.elapsedTime > 120) { // After 2 minutes
        currentHeavyChance = HEAVY_ZOMBIE_CHANCE_MID;
        // Regulars still spawn but less frequently if heavies are chosen
    } else {
        currentHeavyChance = HEAVY_ZOMBIE_CHANCE_INITIAL;
    }


    for (let i = 0; i < currentBatchSize; i++) {
        if (window.zombies.length >= MAX_ZOMBIES) break;

        let zombieTypeToSpawn;
        const rand = Math.random();
        let cumulativeChance = 0;

        // Prioritize specials over time-based heavy/regular
        cumulativeChance += currentScreamerChance;
        if (rand < cumulativeChance) { zombieTypeToSpawn = ZOMBIE_TYPE.SCREAMER;
        } else { cumulativeChance += currentBloaterChance;
            if (rand < cumulativeChance) { zombieTypeToSpawn = ZOMBIE_TYPE.BLOATER;
            } else { cumulativeChance += currentSpitterChance;
                 if (rand < cumulativeChance) { zombieTypeToSpawn = ZOMBIE_TYPE.SPITTER;
                 } else { cumulativeChance += currentRunnerChance;
                      if (rand < cumulativeChance) { zombieTypeToSpawn = ZOMBIE_TYPE.RUNNER;
                      } else { cumulativeChance += currentTankChance;
                           if (rand < cumulativeChance) { zombieTypeToSpawn = ZOMBIE_TYPE.TANK;
                           } else { // If no special, decide between Heavy and Regular
                                if (Math.random() < currentHeavyChance) {
                                    zombieTypeToSpawn = ZOMBIE_TYPE.HEAVY;
                                } else if (spawnRegulars) {
                                    zombieTypeToSpawn = ZOMBIE_TYPE.REGULAR;
                                } else {
                                     // If regulars are phased out and heavy wasn't chosen, default to heavy
                                     zombieTypeToSpawn = ZOMBIE_TYPE.HEAVY;
                                }
                           }
                      }
                 }
            }
        }


        let spawnX, spawnY;
        let spawnLocationFound = false;
        let attempts = 0;
        const maxSpawnAttempts = 50;
        let useEntrance = typeof window.level !== 'undefined' && window.level.entrances && window.level.entrances.length > 0 && (Math.random() * totalWeight < ENTRANCE_SPAWN_WEIGHT);

        if (useEntrance) {
            const entrance = getRandomElement(window.level.entrances);
            if (entrance) {
                spawnX = entrance.x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE * 0.2;
                spawnY = entrance.y * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE * 0.2;
                if (window.player && distance(spawnX, spawnY, window.player.x, window.player.y) < ZOMBIE_MAX_SPAWN_DISTANCE) {
                    spawnLocationFound = true;
                } else { useEntrance = false; }
            } else { useEntrance = false; }
        }

        if (!useEntrance) {
            const viewMargin = TILE_SIZE * 2;
            const viewRect = {
                left: window.camera.x - viewMargin, top: window.camera.y - viewMargin,
                right: window.camera.x + canvas.width + viewMargin, bottom: window.camera.y + canvas.height + viewMargin
            };
            let tryRightEdgeFirst = (zombieTypeToSpawn === ZOMBIE_TYPE.REGULAR || zombieTypeToSpawn === ZOMBIE_TYPE.HEAVY) && Math.random() < ZOMBIE_RIGHT_EDGE_SPAWN_BIAS;

            while (!spawnLocationFound && attempts < maxSpawnAttempts) {
                attempts++;
                if (tryRightEdgeFirst) {
                    spawnX = viewRect.right + Math.random() * TILE_SIZE * 4;
                    spawnY = Math.random() * window.level.height * TILE_SIZE;
                    tryRightEdgeFirst = false;
                } else {
                    spawnX = Math.random() * window.level.width * TILE_SIZE;
                    spawnY = Math.random() * window.level.height * TILE_SIZE;
                }

                const outsideView = spawnX < viewRect.left || spawnX > viewRect.right || spawnY < viewRect.top || spawnY > viewRect.bottom;
                const gridX = Math.floor(spawnX / TILE_SIZE);
                const gridY = Math.floor(spawnY / TILE_SIZE);
                const onFloor = typeof window.level !== 'undefined' && window.level.grid[gridY]?.[gridX] === TILE.FLOOR;
                const withinDist = window.player ? (distance(spawnX, spawnY, window.player.x, window.player.y) < ZOMBIE_MAX_SPAWN_DISTANCE) : false;

                if (outsideView && onFloor && withinDist) {
                    spawnLocationFound = true;
                }
            }
        }

        if (spawnLocationFound && typeof Zombie !== 'undefined') {
            window.zombies.push(new Zombie(spawnX, spawnY, zombieTypeToSpawn));
            spawnedThisBatch++;
        } else if (spawnLocationFound) {
            console.warn("Zombie class not defined, cannot spawn.");
        }
    }
}

function trySpawnSpecialZombie(zombieType) {
    if (typeof window.level === 'undefined' || typeof window.level.entrances === 'undefined' || typeof Zombie === 'undefined') {
        console.warn("Cannot spawn special zombie: level, entrances or Zombie class missing.");
        return;
    }
    let spawnX, spawnY;
    let spawnLocationFound = false;
    let attempts = 0;
    const maxSpawnAttempts = 50;
    const validEntrances = window.level.entrances;

    if (validEntrances.length > 0) {
        const entrance = getRandomElement(validEntrances);
        if (entrance) {
            spawnX = entrance.x * TILE_SIZE + TILE_SIZE / 2;
            spawnY = entrance.y * TILE_SIZE + TILE_SIZE / 2;
            if(window.player && distance(spawnX, spawnY, window.player.x, window.player.y) < ZOMBIE_MAX_SPAWN_DISTANCE * 1.2) {
                 spawnLocationFound = true;
            }
        }
    }

    if (!spawnLocationFound) {
        const viewMargin = TILE_SIZE * 2;
        const viewRect = { left: window.camera.x - viewMargin, top: window.camera.y - viewMargin, right: window.camera.x + canvas.width + viewMargin, bottom: window.camera.y + canvas.height + viewMargin };
        while (!spawnLocationFound && attempts < maxSpawnAttempts) {
            attempts++;
            spawnX = Math.random() * window.level.width * TILE_SIZE;
            spawnY = Math.random() * window.level.height * TILE_SIZE;
            const outsideView = spawnX < viewRect.left || spawnX > viewRect.right || spawnY < viewRect.top || spawnY > viewRect.bottom;
            if (!outsideView) continue;

            const gridX = Math.floor(spawnX / TILE_SIZE);
            const gridY = Math.floor(spawnY / TILE_SIZE);
            const onFloor = window.level.grid[gridY]?.[gridX] === TILE.FLOOR;
            const withinDist = window.player ? (distance(spawnX, spawnY, window.player.x, window.player.y) < ZOMBIE_MAX_SPAWN_DISTANCE * 1.2) : false;

            if (onFloor && withinDist) {
                spawnLocationFound = true;
            }
        }
    }

    if (spawnLocationFound) {
        const typeName = Object.keys(ZOMBIE_TYPE).find(key => ZOMBIE_TYPE[key] === zombieType) || 'Unknown';
        const maxBossCount = (zombieType === ZOMBIE_TYPE.TYRANT || zombieType === ZOMBIE_TYPE.HIVE_MASTER) ? 2 : Infinity;
        const currentBossCount = window.zombies.filter(z => z.type === zombieType).length;

        if (currentBossCount < maxBossCount) {
            console.log(`%cSpawning Special: ${typeName} at (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`, 'color: yellow; font-weight: bold;');
            window.zombies.push(new Zombie(spawnX, spawnY, zombieType));
        }
    }
}
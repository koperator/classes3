// --- START OF FILE zombie_sprites.js ---

// Assumes globals: console, AssetManager (to signal completion)
// Assumes constants: ZOMBIE_TYPE (from constants.js)

// --- Load Zombie Sprites ---
const zombieSpritePaths = {
    [ZOMBIE_TYPE.REGULAR]: '_REGULAR.png',
    [ZOMBIE_TYPE.TANK]: '_TANK.png',
    [ZOMBIE_TYPE.TYRANT]: '_TYRANT.png',
    [ZOMBIE_TYPE.RUNNER]: '_RUNNER.png',
    [ZOMBIE_TYPE.SPITTER]: '_SPITTER.png',
    [ZOMBIE_TYPE.BLOATER]: '_BLOATER.png',
    [ZOMBIE_TYPE.SCREAMER]: '_SCREAMER.png',
    [ZOMBIE_TYPE.HIVE_MASTER]: '_HIVE_MASTER.png',
    [ZOMBIE_TYPE.DRONE]: '_DRONE.png',
    [ZOMBIE_TYPE.HEAVY]: '_HEAVY.png', // <<<< NEW ZOMBIE SPRITE
};

// `zombieSprites` object is declared in game_setup.js with `var`
// var zombieSprites = {};
// var allCustomZombieSpritesAttemptedLoad = false;

var zombieSpritesToLoadCount = Object.keys(zombieSpritePaths).length; // var
var zombieSpritesLoadedCount = 0; // var

function loadZombieSprites() {
    console.log("Loading zombie sprites (from zombie_sprites.js)...");
    if (zombieSpritesToLoadCount === 0) {
        allCustomZombieSpritesAttemptedLoad = true;
        console.log("No custom zombie sprites to load (from zombie_sprites.js).");
        if (typeof AssetManager !== 'undefined' && AssetManager.completeExternalLoadingTask) {
            AssetManager.completeExternalLoadingTask('zombieSprites');
        }
        return;
    }

    const onSpriteLoadOrError = () => { // Combined handler
        zombieSpritesLoadedCount++;
        if (zombieSpritesLoadedCount === zombieSpritesToLoadCount) {
            allCustomZombieSpritesAttemptedLoad = true; // Set your original flag
            console.log("All zombie sprites in zombie_sprites.js finished loading attempt.");
            if (typeof AssetManager !== 'undefined' && AssetManager.completeExternalLoadingTask) {
                AssetManager.completeExternalLoadingTask('zombieSprites');
            } else {
                console.warn("AssetManager not ready to complete zombieSprites task.");
            }
        }
    };

    for (const typeKey in zombieSpritePaths) {
        const path = zombieSpritePaths[typeKey];
        const img = new Image();
        img.onload = () => {
            zombieSprites[typeKey] = img;
            console.log(`Zombie sprite loaded (z_s.js): ${path}`);
            onSpriteLoadOrError();
        };
        img.onerror = () => {
            console.error(`Failed to load zombie sprite (z_s.js): ${path}.`);
            zombieSprites[typeKey] = null; // Ensure it's null on error
            onSpriteLoadOrError();
        };
        img.src = path;
    }
}

// Do NOT call loadZombieSprites() here directly.
// It will be called from game_logic.js's initScreen.
// --- END OF FILE zombie_sprites.js ---
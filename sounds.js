// --- START OF FILE sounds.js ---

// Global object to hold all loaded sound effects
window.gameSounds = {};

// Sound definitions: { alias: { path: "path/to/sound.wav", baseVolume: 1.0 } }
// baseVolume is a multiplier (0.0 to 1.0) for the default loudness of this sound.
const SOUND_DEFINITIONS = {
    // Player Weapons
    MACHINEGUN_SHOOT: { path: "sounds/player/machinegun_shoot_01.wav", baseVolume: 0.525 },
    SHOTGUN_SHOOT:    { path: "sounds/player/shotgun_shoot_01.wav", baseVolume: 0.50625 },
    RAILGUN_SHOOT:    { path: "sounds/player/railgun_shoot_01.wav", baseVolume: 0.5625 },
    FLAMETHROWER_LOOP:{ path: "sounds/player/flamethrower_loop_01.wav", baseVolume: 0.75 },
    FLAMETHROWER_START:{ path: "sounds/player/flamethrower_start_01.wav", baseVolume: 0.75 },
    FLAMETHROWER_END: { path: "sounds/player/flamethrower_end_01.wav", baseVolume: 0.75 },
    PSI_BLADE_SWING:  { path: "sounds/player/psi_blade_swing_01.wav", baseVolume: 0.59375 },
    SMG_SHOOT:        { path: "sounds/player/smg_shoot_01.wav", baseVolume: 0.45 },

    // Player Abilities
    GRENADE_EXPLODE:  { path: "sounds/player/grenade_explode_01.wav", baseVolume: 0.625 },
    GRENADE_THROW:    { path: "sounds/player/grenade_throw_01.wav", baseVolume: 0.15625 },
    RPG_SHOOT:        { path: "sounds/player/rpg_shoot_01.wav", baseVolume: 0.375 },
    RPG_EXPLODE:      { path: "sounds/player/rpg_explode_01.wav", baseVolume: 0.625 },
    DASH:             { path: "sounds/player/dash_01.wav", baseVolume: 0.78125 },
    BULLET_TIME_ENTER:{ path: "sounds/player/bullet_time_enter_01.wav", baseVolume: 0.61875 },
    BULLET_TIME_EXIT: { path: "sounds/player/bullet_time_exit_01.wav", baseVolume: 0.621875 },
    PSI_BLAST_CHARGE: { path: "sounds/player/psi_blast_charge_01.wav", baseVolume: 0.81875 },
    PSI_BLAST_FIRE:   { path: "sounds/player/psi_blast_fire_01.wav", baseVolume: 0.6875 },
    TURRET_DEPLOY:    { path: "sounds/player/turret_deploy_01.wav", baseVolume: 1.0 },
    TURRET_RECALL:    { path: "sounds/player/turret_recall_01.wav", baseVolume: 1.0 },
    TURRET_DESTROYED: { path: "sounds/player/turret_destroyed_01.wav", baseVolume: 0.6875 },

    // Other Player Actions
    RELOAD_START:     { path: "sounds/player/reload_start_01.wav", baseVolume: 0.5625 },
    RELOAD_END:       { path: "sounds/player/reload_end_01.wav", baseVolume: 0.5625 },
    PLAYER_HURT:      { path: "sounds/player/player_hurt_01.wav", baseVolume: 0.59375 },
    PLAYER_DEATH:     { path: "sounds/player/player_death_01.wav", baseVolume: 0.705625 },

    // Mercenary & Drone
    MERC_SMG_SHOOT:   { path: "sounds/allies/merc_smg_shoot_01.wav", baseVolume: 0.35625 },
    DRONE_SHOOT:      { path: "sounds/allies/drone_shoot_01.wav", baseVolume: 0.29375 },
    DRONE_DESTROYED:  { path: "sounds/allies/drone_destroyed_01.wav", baseVolume: 0.75 },

    // Turret (Player owned HMG)
    TURRET_HMG_SHOOT: { path: "sounds/allies/turret_hmg_shoot_01.wav", baseVolume: 0.53125 },

    // Enemy Sounds
    BLOATER_EXPLODE:  { path: "sounds/enemy/bloater_explode_01.wav", baseVolume: 0.625 },
    SCREAMER_SCREAM:  { path: "sounds/enemy/screamer_scream_01.wav", baseVolume: 0.675 },
    SPITTER_SPIT:     { path: "sounds/enemy/spitter_spit_01.wav", baseVolume: 0.53125 },

    // UI & General
    POWERUP_PICKUP:   { path: "_powerup.mp3", baseVolume: 0.71875 },
    GAME_START:       { path: "sounds/ui/game_start_01.wav", baseVolume: 0.63125 },
    LEVEL_WIN:        { path: "sounds/ui/level_win_01.wav", baseVolume: 0.65625 },

    BACKGROUND_MUSIC: { path: "_music.mp3", baseVolume: 0.15 }, // Default for music is often lower
};


function loadAllGameSounds() {
    if (typeof AssetManager === 'undefined') {
        console.error("Sound loading requires AssetManager to be defined.");
        return;
    }
    console.log("Queueing game sounds for loading...");
    for (const alias in SOUND_DEFINITIONS) {
        AssetManager.addAsset(SOUND_DEFINITIONS[alias].path, 'audio', alias);
    }
}

function assignLoadedGameSounds() {
    if (typeof AssetManager === 'undefined') {
        console.error("Sound assignment requires AssetManager to be defined.");
        return;
    }
    console.log("Assigning loaded game sounds...");
    for (const alias in SOUND_DEFINITIONS) {
        const asset = AssetManager.getAsset(alias);
        if (asset) {
            window.gameSounds[alias] = asset;
            // Store baseVolume on the Audio object itself for easy access in playSound
            window.gameSounds[alias].baseVolume = SOUND_DEFINITIONS[alias].baseVolume;
        } else {
            console.warn(`Sound asset for alias "${alias}" not found in AssetManager after loading.`);
            window.gameSounds[alias] = null;
        }
    }
}

function playSound(alias, options = {}) {
    if (window.gameSounds && window.gameSounds[alias]) {
        const sound = window.gameSounds[alias];
        sound.currentTime = 0;

        const baseVol = sound.baseVolume !== undefined ? sound.baseVolume : 1.0;
        const optionVol = options.volume !== undefined ? options.volume : 1.0;
        sound.volume = baseVol * optionVol;
        // Clamp volume between 0 and 1
        sound.volume = Math.max(0, Math.min(1, sound.volume));

        sound.loop = options.loop !== undefined ? options.loop : false;

        sound.play().catch(e => {
            if (e.name === 'NotAllowedError') {
                // console.warn(`Sound playback for "${alias}" prevented by autoplay policy.`);
            } else {
                console.warn(`Error playing sound "${alias}":`, e);
            }
        });
        return sound;
    } else {
        // console.warn(`Sound with alias "${alias}" not found or not loaded.`);
        return null;
    }
}

console.log("sounds.js loaded.");
// --- START OF FILE constants.js ---

// --- constants.js ---

// --- Constants ---
const TILE_SIZE = 32;
const PLAYER_SIZE = TILE_SIZE * 0.6;
const ZOMBIE_SIZE = TILE_SIZE * 0.5; // Base size (used for radius calculation)
const MERC_SIZE = TILE_SIZE * 0.6;
const GUN_BARREL_OFFSET = PLAYER_SIZE * 0.6;

// --- Time Scaling ---
const NORMAL_TIME_SCALE = 1.0;
const BULLET_TIME_SCALE = 0.3;
// Recon's Bullet Time
const RECON_BULLET_TIME_DURATION = 2000 + 350;
const RECON_BULLET_TIME_COOLDOWN = Math.round(10000 * 0.90);

// --- Entity Owner Types (for Projectile Immunity) ---
const OwnerType = { PLAYER: 'player', TURRET: 'turret', DRONE: 'drone', MERCENARY: 'mercenary', ENEMY: 'enemy' };

// --- Weapon Definitions ---
const WEAPON_ID = {
    RAILGUN: 0, MACHINEGUN: 1, FLAMETHROWER: 2, AUTOSHOTGUN: 3,
    PSI_BLADES: 99, ENGINEER_SMG: 4, TURRET_HMG: 100
};

// --- General Projectile Settings ---
const PROJECTILE_LIFESPAN_DEFAULT = 1.0; // seconds
const PROJECTILE_LENGTH_DEFAULT = 15;
const PROJECTILE_WIDTH_DEFAULT = 3;
const MG_PROJECTILE_LENGTH = PROJECTILE_LENGTH_DEFAULT * 1.2;
const PARTICLE_BOUNCE_DAMPING = 0.5;
const SHOTGUN_PELLET_SPEED_VARIATION = 0.45;
const PROJECTILE_OWNER_IMMUNITY_DURATION = 0.05; // Seconds
const SHOTGUN_PELLET_LIFESPAN = 0.44;

// --- Flamethrower Specific Constants ---
const FLAME_PARTICLE_DAMAGE = 0.89 * 1.60;

// --- Machinegun Wall Hit Particle Constants ---
const MG_WALL_SPARK_COUNT = 4;
const MG_WALL_SPARK_SPEED_MIN = 200;
const MG_WALL_SPARK_SPEED_MAX = 500;
const MG_WALL_SPARK_LIFESPAN = 150; // ms
const MG_WALL_SPARK_RADIUS = 2.5;
const MG_WALL_SPARK_BOUNCES = 1;
const MG_WALL_SPARK_DAMPING = 0.3;

// --- Shotgun Wall Hit Particle Constants ---
const SHOTGUN_WALL_SPARK_COUNT = 3;
const SHOTGUN_WALL_SPARK_SPEED_MIN = 150;
const SHOTGUN_WALL_SPARK_SPEED_MAX = 400;
const SHOTGUN_WALL_SPARK_LIFESPAN = 120; // ms
const SHOTGUN_WALL_SPARK_RADIUS = 2.0;
const SHOTGUN_WALL_SPARK_BOUNCES = 0;
const SHOTGUN_WALL_SPARK_DAMPING = 0.5;

// --- Psion Constants ---
const PSION_SHIELD_HP = 77;
const PSION_SHIELD_REGEN_RATE = (7 * 3) * 0.75 * 0.9;
const PSION_SHIELD_REGEN_DELAY = 2000 / 4;
const PSION_SHIELD_REGEN_DELAY_ZERO = 50;
const PSI_BLADE_RANGE = 69 * 1.10;
const PSI_BLADE_DAMAGE = 44;
const PSI_BLADE_ARC_ANGLE = (Math.PI / 2) * 0.6 * 0.7;
const PSI_BLADE_MIN_ATTACK_INTERVAL = 100;
const PSI_BLADE_EFFECT_DURATION = 100;
const PSION_XRAY_RANGE = Math.round(144 * 2.2);
// --- Psi Blast Changes ---
const PSI_BLAST_COOLDOWN = 369;
const PSI_BLAST_CAST_DELAY = 160;
const PSI_BLAST_MIN_SHIELD_COST = 6;
const PSI_BLAST_MAX_PARTICLES = Math.round(90 * 1.25);
const PSI_BLAST_MIN_PARTICLES = 14;
const PSI_BLAST_PARTICLE_SPEED = 369 * 2.6;
const PSI_BLAST_MAX_STUN_DURATION = 400;
const PSI_BLAST_MAX_LIFESPAN = 0.45 * 1.22;
const PSI_BLAST_MAX_BASE_RADIUS = 8;
const PSI_BLAST_PARTICLE_COLOR_START = [255, 150, 255];
const PSI_BLAST_PARTICLE_COLOR_END = [100, 0, 150];
const PSI_BLAST_PARTICLE_DAMPING = 1.5;

// --- Brawler Constants ---
const BRAWLER_DASH_CHARGES = 4;
const BRAWLER_DASH_RECHARGE_TIME = Math.round(1500 * 1.10);
const BRAWLER_DASH_DURATION = Math.round(88 * 1.30 * 1.35);
const BRAWLER_DASH_SPEED_FACTOR_MOD = 1.30;
const BRAWLER_PASSIVE_REGEN_AMOUNT = 5;
const BRAWLER_PASSIVE_REGEN_INTERVAL = 1000;

// --- Marine Constants ---
const MARINE_PASSIVE_REGEN_AMOUNT = 1;
const MARINE_PASSIVE_REGEN_INTERVAL = 2000;

// --- Engineer & Turret Constants ---
const ENGINEER_MAX_TURRETS = 2;
const ENGINEER_DRONE_COUNT = 5;
const ENGINEER_MERC_COUNT = 0;
const TURRET_DEPLOY_TIME = 600;
const TURRET_HP = 300;
const TURRET_SIZE = TILE_SIZE * 0.7;
const TURRET_COLOR = 'darkgrey';
const TURRET_STROKE_COLOR = 'grey';
const TURRET_BARREL_COLOR = '#555';
const TURRET_SPEED_FACTOR = 0.80;
const TURRET_RETURN_SPEED_FACTOR = 1.5;
const TURRET_MIN_PLACEMENT_DISTANCE = TILE_SIZE * 1.5;

// --- Turret HMG Stats ---
const TURRET_HMG_MIN_DMG = Math.round(12 * 1.25);
const TURRET_HMG_MAX_DMG = Math.round(22 * 1.25);
const TURRET_HMG_RPM = Math.round(520);

const TURRET_HMG = {
    id: WEAPON_ID.TURRET_HMG, rpm: TURRET_HMG_RPM, damageMin: TURRET_HMG_MIN_DMG, damageMax: TURRET_HMG_MAX_DMG,
    projectileSpeed: 1450, penetration: 2, ricochets: 0, projectileLength: MG_PROJECTILE_LENGTH * 1.2,
    projectileWidth: PROJECTILE_WIDTH_DEFAULT * 1.5, range: 700, spread: 4 * (Math.PI / 180),
    magSize: Infinity, reloadTime: 0, auto: true, isRaycast: false
};

// --- Weapon Array ---
const weapons = [
    { id: WEAPON_ID.RAILGUN, name: "Railgun", rpm: Math.round(122 * 1.10 * 3), damageMin: Math.round(96 * 1.22 * 1.22), damageMax: Math.round(189 * 1.22 * 1.22), magSize: 15, reloadTime: Math.round(1440 * 0.69), spreadStand: 0.1*(Math.PI/180), spreadWalk: 0.5*(Math.PI/180), spreadRun: 1.5*(Math.PI/180), projectileSpeed: Infinity, penetration: Infinity, ricochets: 0, pellets: 1, auto: false, isRaycast: true },
    { id: WEAPON_ID.MACHINEGUN, name: "Machinegun", rpm: 750, damageMin: Math.round((8 + 1) * 1.15 * 1.10), damageMax: Math.round((15 + 1) * 1.15 * 1.10), magSize: 120, reloadTime: Math.round(1250 * 0.85), spreadStand: 2.5*(Math.PI/180), spreadWalk: 6*(Math.PI/180), spreadRun: 14*(Math.PI/180), projectileSpeed: 1350, penetration: 2, ricochets: 2, pellets: 1, auto: true, isRaycast: false },
    { id: WEAPON_ID.FLAMETHROWER, name: "Flamethrower", rpm: Math.round(1000 * 0.83), magSize: 100, reloadTime: 1800 * 0.70, spreadStand: 7.2 * (Math.PI / 180), spreadWalk: 10.8 * (Math.PI / 180), spreadRun: 14.4 * (Math.PI / 180), particleSpeed: 910, particleLifespan: 679 * 1.20, particleDamping: 3.08, particleBaseRadius: TILE_SIZE * 0.081, particleSizeGrowFactor: 4.83, particleCountPerShot: Math.round(10 * 1.16 * 1.10), wallHitParticleCount: 3, wallHitAOELifespan: 190, pellets: 1, auto: true, isRaycast: false, damageMin: 0, damageMax: 0, penetration: 0, ricochets: 0 },
    { id: WEAPON_ID.AUTOSHOTGUN, name: "Autoshotgun", rpm: Math.round(269 * 1.10), damageMin: Math.round(4 * 0.90 * 1.10 * 1.20), damageMax: Math.round(7 * 0.90 * 1.10 * 1.20), magSize: 20, reloadTime: Math.round(1400 * 0.80), spreadStand: (11*(Math.PI/180)*1.2 * 0.85) * 0.70, spreadWalk: (15*(Math.PI/180)*1.2 * 0.85) * 0.70, spreadRun: (23*(Math.PI/180)*1.2 * 0.85) * 0.70, projectileSpeed: 1190, penetration: 0, ricochets: 0, pellets: 11, auto: true, isRaycast: false },
    { id: WEAPON_ID.PSI_BLADES, name: "Psi Blades", rpm: Infinity, damageMin: PSI_BLADE_DAMAGE, damageMax: PSI_BLADE_DAMAGE, magSize: Infinity, reloadTime: 0, spreadStand: 0, spreadWalk: 0, spreadRun: 0, projectileSpeed: 0, penetration: Infinity, ricochets: 0, pellets: 0, auto: false, isRaycast: false },
    { id: WEAPON_ID.ENGINEER_SMG, name: "SMG", rpm: 1150, damageMin: Math.round(6 * 1.25), damageMax: Math.round(9 * 1.25), magSize: 50, reloadTime: 1100, spreadStand: 3*(Math.PI/180), spreadWalk: 7*(Math.PI/180), spreadRun: 15*(Math.PI/180), projectileSpeed: 1200, penetration: 1, ricochets: 1, pellets: 1, auto: true, isRaycast: false }
];

const AUTOSHOTGUN_STUN_DURATION = Math.round(122 * 1.15);

// --- Mercenary Weapon Definition ---
const MERC_WEAPON = { name: "Merc SMG", rpm: 600, damageMin: 3, damageMax: 6, magSize: 20, reloadTime: 1700, spread: 9 * (Math.PI / 180), projectileSpeed: 930, penetration: 0, ricochets: 0, range: 510 };

// Player Base Settings
const BASE_PLAYER_SPEED_WALK = 170; const BASE_PLAYER_SPEED_RUN = 250; const PLAYER_DASH_SPEED_FACTOR = 4.17;
const PLAYER_DASH_AFTERIMAGE_INTERVAL = 39;

// Grenade Settings
const GRENADE_COOLDOWN = 240;
const GRENADE_SPEED = 410;
const GRENADE_FUSE_TIME = 2500;
const GRENADE_PARTICLE_COUNT = 87; const GRENADE_PARTICLE_SPEED = 790;
const GRENADE_PARTICLE_LIFESPAN = 0.22 * 0.96;
const GRENADE_PARTICLE_DAMAGE = 8; const GRENADE_PARTICLE_LENGTH = 8;
const GRENADE_PARTICLE_WIDTH = 4;
const GRENADE_BOUNCE_CHANCE = 0.99; const GRENADE_BOUNCE_DAMPING = 0.5; const GRENADE_COUNT_START = 17;
const GRENADE_EXPLOSION_RADIUS_FACTOR = 0.89;
const GRENADE_SLOWDOWN_TIME_POINT_MARINE = 0.6 * 1000;
const GRENADE_STOP_TIME_POINT_MARINE = (0.6 + 0.33) * 1000;

// --- Class Definitions ---
const CLASS_ID = { RECON: 0, MARINE: 1, DEVASTATOR: 2, BRAWLER: 3, PSION: 4, ENGINEER: 5 };
const classes = [
    {
        id: CLASS_ID.RECON, name: "Recon", hp: 30, speedMultiplier: 1.25, weaponId: WEAPON_ID.RAILGUN,
        ability: { type: 'bullet_time', uses: Infinity, cooldown: RECON_BULLET_TIME_COOLDOWN, duration: RECON_BULLET_TIME_DURATION },
        passive: { type: 'fog_wall_vision' },
        description: `Fast scout. Railgun. Bullet Time. Sees walls in fog. No Drones.`,
        color: 'cyan'
    },
    {
        id: CLASS_ID.MARINE, name: "Marine", hp: 45, speedMultiplier: 1.00, weaponId: WEAPON_ID.MACHINEGUN,
        ability: { type: 'grenade', uses: GRENADE_COUNT_START, cooldown: GRENADE_COOLDOWN },
        passive: { type: 'hp_regen' },
        description: `Soldier (45HP, regen). Machinegun (+10% DMG). Timed Frag Grenades. 6 Mercenaries.`,
        color: 'green'
    },
    {
        id: CLASS_ID.DEVASTATOR, name: "Devastator", hp: 60, speedMultiplier: 0.95, weaponId: WEAPON_ID.FLAMETHROWER,
        ability: { type: 'rpg', uses: 30, cooldown: 950},
        passive: { type: '95% explosion_resistance'},
        description: `Area denial. Flamethrower (+60% DMG, +10% Particles, +20% Range, Fast Reload). RPG (30 rounds, +50% Center Dmg, Smaller Blast). No Mercs.`,
        color: 'orange'
    },
    {
        id: CLASS_ID.BRAWLER, name: "Brawler", hp: Math.round(99), speedMultiplier: 0.85, weaponId: WEAPON_ID.AUTOSHOTGUN,
        ability: { type: 'dash', uses: BRAWLER_DASH_CHARGES, maxUses: BRAWLER_DASH_CHARGES, rechargeTime: BRAWLER_DASH_RECHARGE_TIME, duration: BRAWLER_DASH_DURATION },
        passive: { type: 'hp_regen_brawler'},
        description: `Durable CQC (Regen +5HP/s). Autoshotgun (+20% DMG, Stun +15%). Speed Dash. 3 Mercs.`,
        color: 'red'
    },
    {
        id: CLASS_ID.PSION, name: "Psion", hp: 20, speedMultiplier: 1.15, weaponId: WEAPON_ID.PSI_BLADES,
        ability: { type: 'psi_blast', cooldown: PSI_BLAST_COOLDOWN },
        passive: { type: 'shield_regen, xray_enhanced' },
        description: `Agile (15HP, Shield). X-Ray Vision. Psi Blades. Psi Blast.`,
        color: '#b742f5'
    },
    {
        id: CLASS_ID.ENGINEER, name: "Engineer", hp: 25, speedMultiplier: 0.90, weaponId: WEAPON_ID.ENGINEER_SMG,
        ability: { type: 'turret', cooldown: TURRET_DEPLOY_TIME + 100 },
        passive: { type: 'drone_support' },
        description: `Tactical (+10% Speed). SMG. Deploys 2 HMG Turrets. 5 Support Drones.`,
        color: '#a8a8a8'}
];

// RPG Settings
const RPG_SPEED = Math.round(707 * 1.25);
const RPG_EXPLOSION_RADIUS = TILE_SIZE * 3.5 * 0.80;
const RPG_DAMAGE_CENTER = Math.round(297 * 1.20 * 1.50);
const RPG_DAMAGE_EDGE = Math.round(22 * 1.20);
const RPG_EXPLOSION_PARTICLE_COUNT = Math.round(190 * 0.75);
const RPG_EXPLOSION_PARTICLE_SPEED = 410;
const RPG_EXPLOSION_PARTICLE_LIFESPAN = 0.2;
const RPG_PARTICLE_LENGTH = 9;
const RPG_PARTICLE_WIDTH = 7;
const RPG_PARTICLE_CONE_ANGLE = Math.PI * 1.8;
const RPG_PARTICLE_SPEED_BIAS_FACTOR = 1.7;
const RPG_SMOKE_INTERVAL = Math.round(30 / 2);
const RPG_SMOKE_LIFESPAN = 777;
const RPG_SMOKE_SIZE = 6;
const RPG_FLASH_PARTICLE_COUNT = Math.round(420 * 0.75);
const RPG_FLASH_PARTICLE_SPEED_MIN = 1200;
const RPG_FLASH_PARTICLE_SPEED_MAX = 1500;
const RPG_FLASH_PARTICLE_LIFESPAN_MIN = 150;
const RPG_FLASH_PARTICLE_LIFESPAN_MAX = 370;
const RPG_STUN_DURATION = 1000;
const RPG_SHOCKWAVE_MAX_RADIUS = TILE_SIZE * 4.7 * 0.80;
const RPG_SHOCKWAVE_LIFESPAN = 310;
const RPG_BLOCK_DESTRUCTION_RADIUS = 55;

// Drone Settings (Player Owned)
const DRONE_TARGETING_RANGE = 600; const DRONE_PROJECTILE_LENGTH = 12;
const DRONE_PROJECTILE_WIDTH = 3;
const DRONE_FIRE_RATE = 6;
const DRONE_PROJECTILE_SPEED = 850; const DRONE_PROJECTILE_DAMAGE = 3; const DRONE_SWITCH_TARGET_COOLDOWN = 230;
const DRONE_VISION_RADIUS = 10;
const DRONE_SIZE_MULTIPLIER = 0.3;
const DRONE_FOLLOW_DISTANCE = TILE_SIZE * 1.5;
const DRONE_SEPARATION_DISTANCE = TILE_SIZE * 1.0;
const DRONE_SPEED = BASE_PLAYER_SPEED_RUN * 1.1 * 3.09;
const DRONE_ACCELERATION_FACTOR = 2.2;
const DRONE_NOISE_AMPLITUDE = TILE_SIZE * 0.4;
const DRONE_NOISE_FREQUENCY_X = 0.2;
const DRONE_NOISE_FREQUENCY_Y = 0.2;
const DRONE_LEAD_FACTOR = 0.5;

// --- Zombie Settings ---
const ZOMBIE_TYPE = {
    REGULAR: 0, TANK: 1, TYRANT: 2, RUNNER: 3, SPITTER: 4, BLOATER: 5, SCREAMER: 6, HIVE_MASTER: 7, DRONE: 8, HEAVY: 9
};
const ZOMBIE_BASE_RADIUS = ZOMBIE_SIZE / 2;
const ZOMBIE_REGULAR_COLOR = '#68a92f';
const ZOMBIE_REGULAR_SPEED_TIERS = [50, 55, 60, 65, 70];
const ZOMBIE_REGULAR_HP_TIERS = [5, 8, 12, 18];
const ZOMBIE_REGULAR_ATTACK_DAMAGE_MIN = 1;
const ZOMBIE_REGULAR_ATTACK_DAMAGE_MAX = 2;
const ZOMBIE_REGULAR_RADIUS_MULT = 1.5;

const HEAVY_ZOMBIE_HP = 89;
const HEAVY_ZOMBIE_COLOR = '#4a7520';
const HEAVY_ZOMBIE_RADIUS_MULT = 1.7;
const HEAVY_ZOMBIE_CHANCE_INITIAL = 0.15;
const HEAVY_ZOMBIE_CHANCE_MID = 0.65;
const HEAVY_ZOMBIE_CHANCE_LATE = 0.95;

const TANK_CHANCE = 0.077 * 1.20; const TANK_SPEED = 44; const TANK_HP = 369; const TANK_DMG = 6; const TANK_COLOR = '#236713'; const TANK_RADIUS_MULT = 3.4;
const TYRANT_SPAWN_CHANCE = 0.00177 * 0.60 * 0.80; const TYRANT_SPEED = Math.round(35 * 1.20 * 1.15); const TYRANT_HP = Math.round(2200 * 1.70); const TYRANT_DMG = 22; const TYRANT_COLOR = '#003b19'; const TYRANT_RADIUS_MULT = 4.96;
const RUNNER_CHANCE = 0.05; const RUNNER_SPEED = 100; const RUNNER_HP = 10; const RUNNER_DMG = 1; const RUNNER_COLOR = '#d9a027'; const RUNNER_RADIUS_MULT = 1.6;
const SPITTER_CHANCE = 0.08 * 0.75; const SPITTER_SPEED = 50; const SPITTER_HP = 117; const SPITTER_COLOR = '#7c37a8'; const SPITTER_RADIUS_MULT = 2.8; const SPITTER_ATTACK_RANGE = 450; const SPITTER_ATTACK_COOLDOWN = 1800; const SPITTER_PROJECTILE_SPEED = 500; const SPITTER_PROJECTILE_DAMAGE = 4; const SPITTER_PROJECTILE_COLOR = 'lime'; const SPITTER_PROJECTILE_RADIUS = 9; const SPITTER_PROJECTILE_LIFESPAN = 1.5; const SPITTER_PROJECTILE_STATIONARY_ACCURACY = 0.05; const SPITTER_PROJECTILE_MOVING_ACCURACY = 0.15;
const BLOATER_CHANCE = 0.04; const BLOATER_SPEED = 22; const BLOATER_HP = 777; const BLOATER_COLOR = '#a86d32'; const BLOATER_RADIUS_MULT = 4.5; const BLOATER_EXPLOSION_RADIUS = TILE_SIZE * 4.7 * 1.40; const BLOATER_EXPLOSION_DAMAGE_MAX = 40; const BLOATER_EXPLOSION_DAMAGE_MIN = 10; const BLOATER_EXPLOSION_PARTICLE_COUNT = Math.round(90 * 1.8); const BLOATER_EXPLOSION_PARTICLE_SPEED = 300; const BLOATER_EXPLOSION_PARTICLE_LIFESPAN = 0.3; const BLOATER_EXPLOSION_PARTICLE_LENGTH = 9; const BLOATER_EXPLOSION_PARTICLE_WIDTH = 6; const BLOATER_EXPLOSION_PARTICLE_DAMAGE = 1; const BLOATER_EXPLOSION_COLOR_PRIMARY = 'rgba(100, 180, 50, 0.8)'; const BLOATER_EXPLOSION_COLOR_SECONDARY = 'rgba(160, 120, 80, 0.6)';
const SCREAMER_CHANCE = 0.03 * 0.70; const SCREAMER_SPEED = 61; const SCREAMER_HP = 196; const SCREAMER_COLOR = '#cf597e'; const SCREAMER_RADIUS_MULT = 3.0; const SCREAMER_ABILITY_RANGE = TILE_SIZE * 7.5; const SCREAMER_ABILITY_COOLDOWN = 6000; const SCREAMER_ABILITY_DURATION = 3000; const SCREAMER_SLOW_FACTOR = 0.4; const SCREAMER_CAST_TIME = 700;
const HIVE_MASTER_SPAWN_CHANCE = 0.0018; const HIVE_MASTER_HP = 969; const HIVE_MASTER_SPEED = 25; const HIVE_MASTER_COLOR = '#f5d742'; const HIVE_MASTER_RADIUS_MULT = 3.9; const HIVE_MASTER_INTERNAL_SPAWN_INTERVAL = 400; const HIVE_MASTER_MAX_ACTIVE_DRONES = 41;
const ZOMBIE_DRONE_HP = 3; const ZOMBIE_DRONE_SPEED = 81; const ZOMBIE_DRONE_DMG = 1; const ZOMBIE_DRONE_COLOR = '#f5f5a3'; const ZOMBIE_DRONE_RADIUS_MULT = 1.1;
const ZOMBIE_SPAWN_INTERVAL_START = 1000 / 1.30; const ZOMBIE_SPAWN_INTERVAL_MIN = 180; const ZOMBIE_SPAWN_INTERVAL_SCALE_TIME = 240; const ZOMBIE_SPAWN_MIDGAME_PEAK_TIME = 100; const ZOMBIE_SPAWN_MIDGAME_SLOWDOWN = 1.20; const ZOMBIE_SPAWN_BATCH_SIZE_START = 6; const ZOMBIE_SPAWN_BATCH_SIZE_MAX = 30; const ZOMBIE_SPAWN_BATCH_SCALE_TIME = 300; const ZOMBIE_SPAWN_CAP_INTERVAL = 150; const ZOMBIE_SPAWN_CAP_BATCH = 40; const MAX_ZOMBIES = 1800; const ZOMBIE_ATTACK_COOLDOWN = 650; const ZOMBIE_TARGET_PRIORITY = { PLAYER: 10, MERCENARY: 6, TURRET: 5, DRONE: 1 }; const ENTRANCE_SPAWN_WEIGHT = 8; const OFFSCREEN_SPAWN_WEIGHT = 1; const ZOMBIE_MAX_SPAWN_DISTANCE = 2500; const ZOMBIE_RIGHT_EDGE_SPAWN_BIAS = 0.3;

// Mercenary Settings
const MERC_HP = 20 + 5;
const MERC_SPEED = 140; const MERC_FOLLOW_DISTANCE_MIN = TILE_SIZE * 1.2; const MERC_FOLLOW_DISTANCE_MAX = TILE_SIZE * 2.2; const MERC_SEPARATION_DISTANCE = TILE_SIZE * 0.8; const MERC_PATHFINDING_COOLDOWN = 1.0;
const MERC_VISION_RADIUS = 12;

// Map Settings
const MAP_ASPECT_RATIO = 7; const START_AREA_RADIUS = 3; const LOOP_CREATION_PROBABILITY = 0.10; const CARVING_DENSITY_FACTOR = 60; const CARVING_MIN_SIZE = 2; const CARVING_MAX_SIZE = 4; const NUM_EXITS = 8; const MIN_ENTRANCE_EXIT_DISTANCE_FACTOR = 0.25;

// Fog of War Settings
const PLAYER_VISION_RADIUS = 15;
const FOG_STATE = { HIDDEN: 0, REVEALED: 1, WALL_VISIBLE: 2 };
const FOG_COLOR_HIDDEN_STANDARD = 'rgba(0, 0, 0, 1)';
const FOG_COLOR_HIDDEN_RECON = 'rgba(0, 0, 0, 0.9)';
const FOG_COLOR_WALL_VISIBLE_RECON = 'rgba(0, 0, 0, 0.9)';
const FOG_LOS_STEP_SCALE = 0.4;

// Tile Types Enum & Colors
const TILE = { FLOOR: 0, WALL: 1, OBSTACLE: 2, ENTRANCE: 3 };
const COLOR_FLOOR = '#333';
const COLOR_WALL = '#a6a6a6';
const COLOR_OBSTACLE = '#c0c0c0';
const COLOR_ENTRANCE = '#8B0000';
const COLOR_WALL_STROKE = '#555';
const MERC_COLOR = '#2d47cf';

// Railgun Effect
const RAILGUN_EFFECT_DURATION = 100; const RAILGUN_COLOR = 'rgba(0, 180, 255, 0.8)'; const RAILGUN_WIDTH = 5; const RAILGUN_PARTICLE_LIFESPAN = 330; const RAILGUN_PARTICLE_RADIUS = 3; const RAILGUN_PARTICLE_COLOR_TRAIL = 'rgba(80, 180, 220, 0.6)'; // Renamed for clarity
const RAILGUN_PARTICLE_SPAWN_DELAY = 50;

// Railgun Wall Hit Particle Constants
const RAILGUN_WALL_PARTICLE_COUNT = 15;
const RAILGUN_WALL_PARTICLE_SPEED_MIN = 250;
const RAILGUN_WALL_PARTICLE_SPEED_MAX = 600;
const RAILGUN_WALL_PARTICLE_LIFESPAN = 200;
const RAILGUN_WALL_PARTICLE_RADIUS_MIN = 1.5;
const RAILGUN_WALL_PARTICLE_RADIUS_MAX = 3.5;
const RAILGUN_WALL_PARTICLE_COLOR = [0, 200, 255]; // RGB array for lerping


// Debuff visuals
const SLOW_EFFECT_COLOR = 'rgba(0, 150, 255, 0.3)';

// --- Powerup System ---
const POWERUP_SIZE = TILE_SIZE * 0.55;
const MAX_POWERUPS_ON_MAP = 120;
const POWERUP_COLOR_DEFAULT = 'gold';

const PowerupType = {
    // Recon
    RECON_COOLDOWN_REDUCTION: 'RECON_COOLDOWN_REDUCTION',
    RECON_RAILGUN_DAMAGE: 'RECON_RAILGUN_DAMAGE',
    // Marine
    MARINE_EXTRA_MERCS: 'MARINE_EXTRA_MERCS',
    MARINE_EXTRA_GRENADES: 'MARINE_EXTRA_GRENADES',
    MARINE_MG_MAG_SIZE: 'MARINE_MG_MAG_SIZE',
    MARINE_COMMANDO_KIT: 'MARINE_COMMANDO_KIT',
    // Devastator
    DEVASTATOR_FLAME_MAG: 'DEVASTATOR_FLAME_MAG',
    DEVASTATOR_RPG_ROUNDS: 'DEVASTATOR_RPG_ROUNDS',
    DEVASTATOR_EXTRA_MERCS: 'DEVASTATOR_EXTRA_MERCS',
    // Brawler
    BRAWLER_SHOTGUN_PELLETS: 'BRAWLER_SHOTGUN_PELLETS',
    BRAWLER_BONUS_HP_LARGE: 'BRAWLER_BONUS_HP_LARGE',
    // Psion
    PSION_MAX_SHIELD: 'PSION_MAX_SHIELD',
    PSION_BLADE_DAMAGE: 'PSION_BLADE_DAMAGE',
    PSION_XRAY_RANGE_BONUS: 'PSION_XRAY_RANGE_BONUS',
    // Engineer
    ENGINEER_EXTRA_DRONES_CLASS: 'ENGINEER_EXTRA_DRONES_CLASS',
    ENGINEER_SMG_MAG: 'ENGINEER_SMG_MAG',
    // Generic
    GENERIC_BONUS_HP: 'GENERIC_BONUS_HP',
    GENERIC_SPEED_BOOST: 'GENERIC_SPEED_BOOST',
    GENERIC_EXTRA_DRONES: 'GENERIC_EXTRA_DRONES',
    GENERIC_EXTRA_MERCS: 'GENERIC_EXTRA_MERCS',
    ADRENAL_OVERCHARGE: 'ADRENAL_OVERCHARGE'
};

const powerupConfig = {
    // Recon
    [PowerupType.RECON_COOLDOWN_REDUCTION]: { name: "Coolant Flush", description: "Bullet Time Cooldown -1.5s", classId: CLASS_ID.RECON, color: 'lightblue',
        apply: (player) => { player.classData.ability.cooldown = Math.max(500, (player.classData.ability.cooldown || RECON_BULLET_TIME_COOLDOWN) - 1500); player.abilityCooldownTimer = Math.min(player.abilityCooldownTimer, player.classData.ability.cooldown); } },
    [PowerupType.RECON_RAILGUN_DAMAGE]: { name: "Heavy Slugs", description: "Railgun Damage +100", classId: CLASS_ID.RECON, color: 'darkcyan',
        apply: (player) => { const weapon = weapons.find(w=>w.id === WEAPON_ID.RAILGUN); if(weapon) { weapon.damageMin += 100; weapon.damageMax += 100;} } },
    // Marine
    [PowerupType.MARINE_EXTRA_MERCS]: { name: "Reinforcements", description: "+2 Mercenaries", classId: CLASS_ID.MARINE, color: 'darkgreen',
        apply: (player) => { player.queuedPowerupMercs = (player.queuedPowerupMercs || 0) + 2; } },
    [PowerupType.MARINE_EXTRA_GRENADES]: { name: "Extra Ordinance", description: "+10 Grenades", classId: CLASS_ID.MARINE, color: 'olive',
        apply: (player) => { player.abilityUsesTotal += 10; player.abilityUsesLeft += 10;} },
    [PowerupType.MARINE_MG_MAG_SIZE]: { name: "Extended Mag", description: "Machinegun Mag +50", classId: CLASS_ID.MARINE, color: 'darkolivegreen',
        apply: (player) => { const weapon = weapons.find(w=>w.id === WEAPON_ID.MACHINEGUN); if(weapon) { weapon.magSize += 50; } } },
    [PowerupType.MARINE_COMMANDO_KIT]: { name: "Commando Kit", description: "MG Mag +30 & +5 Grenades", classId: CLASS_ID.MARINE, color: '#38761d',
        apply: (player) => {
            const weapon = weapons.find(w=>w.id === WEAPON_ID.MACHINEGUN);
            if(weapon) { weapon.magSize += 30; }
            player.abilityUsesTotal += 5;
            player.abilityUsesLeft += 5;
        } },
    // Devastator
    [PowerupType.DEVASTATOR_FLAME_MAG]: { name: "Fuel Tank", description: "Flamethrower Mag +100", classId: CLASS_ID.DEVASTATOR, color: 'darkorange',
        apply: (player) => { const weapon = weapons.find(w=>w.id === WEAPON_ID.FLAMETHROWER); if(weapon) { weapon.magSize += 100; } } },
    [PowerupType.DEVASTATOR_RPG_ROUNDS]: { name: "More Rockets", description: "+7 RPG Rounds", classId: CLASS_ID.DEVASTATOR, color: 'orangered',
        apply: (player) => { player.abilityUsesTotal += 7; player.abilityUsesLeft += 7;} },
    [PowerupType.DEVASTATOR_EXTRA_MERCS]: { name: "Escort Team", description: "+2 Mercenaries", classId: CLASS_ID.DEVASTATOR, color: 'sienna',
        apply: (player) => { player.queuedPowerupMercs = (player.queuedPowerupMercs || 0) + 2; } },
    // Brawler
    [PowerupType.BRAWLER_SHOTGUN_PELLETS]: { name: "Flechette Rounds", description: "Autoshotgun +8 Pellets", classId: CLASS_ID.BRAWLER, color: 'darkred',
        apply: (player) => { const weapon = weapons.find(w=>w.id === WEAPON_ID.AUTOSHOTGUN); if(weapon) { weapon.pellets += 8; } } },
    [PowerupType.BRAWLER_BONUS_HP_LARGE]: { name: "Trauma Plates", description: "+100 HP", classId: CLASS_ID.BRAWLER, color: 'maroon',
        apply: (player) => { player.maxHp += 100; player.hp += 100; } },
    // Psion
    [PowerupType.PSION_MAX_SHIELD]: { name: "Shield Capacitor", description: "+89 Max Shield", classId: CLASS_ID.PSION, color: 'darkviolet',
        apply: (player) => { player.maxShieldHp += 89; player.shieldHp += 89; } },
    [PowerupType.PSION_BLADE_DAMAGE]: { name: "Focused Psionics", description: "Psi Blades +44 Dmg", classId: CLASS_ID.PSION, color: 'purple',
        apply: (player) => { const weapon = weapons.find(w=>w.id === WEAPON_ID.PSI_BLADES); if(weapon) { weapon.damageMin += 44; weapon.damageMax += 44;} } },
    [PowerupType.PSION_XRAY_RANGE_BONUS]: { name: "Clairvoyance", description: "X-Ray Range +169", classId: CLASS_ID.PSION, color: 'indigo',
        apply: (player) => { player.xrayRangeBonus = (player.xrayRangeBonus || 0) + 169; } },
    // Engineer
    [PowerupType.ENGINEER_EXTRA_DRONES_CLASS]: { name: "Drone Swarm", description: "+3 Drones (Engineer)", classId: CLASS_ID.ENGINEER, color: 'dimgray',
        apply: (player) => { player.queuedPowerupDrones = (player.queuedPowerupDrones || 0) + 3; } },
    [PowerupType.ENGINEER_SMG_MAG]: { name: "SMG Extended Mag", description: "SMG Mag +50", classId: CLASS_ID.ENGINEER, color: 'slategray',
        apply: (player) => { const weapon = weapons.find(w=>w.id === WEAPON_ID.ENGINEER_SMG); if(weapon) { weapon.magSize += 50; } } },
    // Generic
    [PowerupType.GENERIC_BONUS_HP]: { name: "Adrenaline Shot", description: "+25 HP", classId: null, color: 'lightcoral',
        apply: (player) => { player.maxHp += 40; player.hp += 40; } },
    [PowerupType.GENERIC_SPEED_BOOST]: { name: "Stims", description: "+20% Speed", classId: null, color: 'lightgreen',
        apply: (player) => { player.speedMultiplierBase = (player.speedMultiplierBase || 1.0) * 1.20; player.recalculateSpeeds(); } },
    [PowerupType.GENERIC_EXTRA_DRONES]: { name: "Drone Controller", description: "+2 Drones (Generic)", classId: null, color: 'lightskyblue',
        apply: (player) => { player.queuedPowerupDrones = (player.queuedPowerupDrones || 0) + 3; } },
    [PowerupType.GENERIC_EXTRA_MERCS]: { name: "Mercenary Contract", description: "+2 Mercs (Generic)", classId: null, color: 'lightgoldenrodyellow',
        apply: (player) => { player.queuedPowerupMercs = (player.queuedPowerupMercs || 0) + 3; } },
    [PowerupType.ADRENAL_OVERCHARGE]: { name: "Adrenal Overcharge", description: "+50 HP & +10% Speed", classId: null, color: '#FFD700',
        apply: (player) => {
            player.maxHp += 50;
            player.hp += 50;
            player.speedMultiplierBase = (player.speedMultiplierBase || 1.0) * 1.10;
            player.recalculateSpeeds();
        }
    },
};
// --- END OF FILE constants.js ---
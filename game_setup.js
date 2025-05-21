// --- START OF FILE game_setup.js ---

// --- game_setup.js ---
// Assumes globals: document, window, console
// Assumes constants: All constants from constants.js are global
// Assumes classes: Player, Zombie, Mercenary, Turret, TurretState, Projectile, Grenade, RPGProjectile, Afterimage, Shockwave, PsiBladeEffect, PsiBlastParticle, RailgunParticle, GrenadeParticle, ExplosionParticle, SmokeParticle, WallSparkParticle, FlashParticle, FlameParticle, Drone, Powerup, TemporarySpriteEffect
// Assumes functions: generateLevel, drawLevel, updateFogOfWar, isWall, isSolidForPlayer, checkWallCollision, TILE
// Assumes drawMinimap, setMinimapNeedsUpdateFlag

// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State Enum ---
const GameState = { Preloading: 'Preloading', CharacterSelection: 'CharSelect', Initializing: 'Init', Playing: 'Playing', GameOver: 'Over', GameWon: 'Won' };
var gameState = GameState.Preloading;

// Globals for assets
var imgWall, imgObstacle, imgFloor, imgEntrance;
var imagesLoaded = false;
var zombieSprites = {};
var allCustomZombieSpritesAttemptedLoad = false;
var imgCharSelectBg = null;
var imgRPGExplosionSprite = null;
var imgGrenadeExplosionSprite = null;
var imgPsiBladeSprite = null;
var imgPsiBlastSprite = null;
var charSelectionImages = []; // <<<< NEW: Array for character selection sprites

// Audio globals
window.audio = {
    backgroundMusic: null,
    powerupSound: null
};

// --- Core Game State Variables ---
window.player = null;
window.zombies = [];
window.projectiles = [];
window.grenades = [];
window.grenadeParticles = [];
window.rpgProjectiles = [];
window.explosionParticles = [];
window.smokeParticles = [];
window.railgunEffects = [];
window.mercenaries = [];
window.railgunParticles = [];
window.flameParticles = [];
window.wallSparkParticles = [];
window.flashParticles = [];
window.shockwaves = [];
window.afterimages = [];
window.psiBlastParticles = [];
window.psiBladeEffects = [];
window.turrets = [];
window.powerups = [];
window.powerupDisplayMessages = [];
window.temporarySpriteEffects = [];

window.level = { grid: [], fogGrid: [], width: 0, height: 0, startX: 0, startY: 0, endX: 0, endY: 0, entrances: [], pathfinderGrid: null, finder: null, blocks: [] };
window.camera = { x: 0, y: 0 };
var input = { w: false, a: false, s: false, d: false, shift: false, r: false, space: false, mouseDown: false, mouseX: 0, mouseY: 0, keys: {} };
var lastTime = 0; var deltaTime = 0;
window.gameStartTime = 0;
window.elapsedTime = 0;
window.lastZombieSpawnTime = 0;
window.gameOver = false;
var gameWon = false;
window.kills = 0;
window.gameTimeScale = NORMAL_TIME_SCALE;

var lastMinimapUpdateTime = 0;
const MINIMAP_VISUAL_UPDATE_INTERVAL = 500;

var staticTileBufferCanvas = null;
var staticTileBufferCtx = null;
var staticBufferNeedsRedraw = true;
var previouslyRevealedStaticTiles = null;

if (typeof window.selectionBoxes === 'undefined') {
    window.selectionBoxes = [];
}

// Dummy functions
if (typeof spawnZombies === 'undefined') { function spawnZombies() { } }
if (typeof drawCharacterSelection === 'undefined') { function drawCharacterSelection() { if(!ctx || !canvas) return; ctx.fillStyle='gray'; ctx.fillRect(0,0,canvas.width, canvas.height); ctx.fillStyle='white'; ctx.font="20px 'PixelOperatorBold', Arial"; ctx.textAlign='center'; ctx.fillText("Press 1-" + (typeof classes !== 'undefined' ? classes.length : 0) + " to select (drawCharSelect missing)", canvas.width/2, canvas.height/2); ctx.textAlign='left'; } }
if (typeof updateCharacterSelection === 'undefined') { function updateCharacterSelection() { } }
if (typeof drawUI === 'undefined') { function drawUI() { } }
if (typeof drawGameOver === 'undefined') { function drawGameOver() { if(!ctx || !canvas) return; ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='red'; ctx.font="50px 'PixelOperatorBold', Arial"; ctx.textAlign='center'; ctx.fillText("GAME OVER (dummy)", canvas.width/2, canvas.height/2); ctx.textAlign='left';} }
if (typeof drawGameWon === 'undefined') { function drawGameWon() { if(!ctx || !canvas) return; ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='green'; ctx.font="50px 'PixelOperatorBold', Arial"; ctx.textAlign='center'; ctx.fillText("YOU WON! (dummy)", canvas.width/2, canvas.height/2); ctx.textAlign='left';} }
if (typeof setTurretGlobals === 'undefined') { function setTurretGlobals(p, z, m, t) { } }
if (typeof drawMinimap === 'undefined') { function drawMinimap(ctx, canvas) { } }
if (typeof setMinimapNeedsUpdateFlag === 'undefined') { function setMinimapNeedsUpdateFlag() { } }


console.log("game_setup.js executed and GameState defined.");
// --- END OF FILE game_setup.js ---
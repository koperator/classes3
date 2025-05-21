// --- START OF FILE level_assets.js ---

// Assumes globals: console, AssetManager (to signal completion)
// Assumes constants from constants.js will be loaded before this

// --- Urban Generator Specific Constants ---
const MIN_BLOCK_URBAN_NORMAL = 6; const MAX_BLOCK_URBAN_NORMAL = 16;
const MIN_BLOCK_URBAN_DENSE = 4; const MAX_BLOCK_URBAN_DENSE = 10;
const ALLEY_CHANCE_URBAN = 0.65; const MIN_STREET_THICKNESS_URBAN = 2; const MAX_STREET_THICKNESS_URBAN = 3;
const STREET_THICKNESS_DENSE_URBAN = 2; const ALLEY_MIN_WIDTH = 1; const ALLEY_MAX_WIDTH = 1;
const PRIMARY_QUARTER_SHIFT_MAX_URBAN = 2; const SECONDARY_STREET_SEGMENT_SHIFT_MAX = 1;
const RUBBLE_DENSITY_URBAN = 0.007; const RUBBLE_DENSITY_SLUM_MULTIPLIER_URBAN = 3.8;
const RUBBLE_DENSITY_TOXIC_MULTIPLIER_URBAN = 4.2; const RUBBLE_DENSITY_INDUSTRIAL_MULTIPLIER_URBAN = 3.0;
const RUBBLE_DENSITY_PARK_MULTIPLIER_URBAN = 0.05; const RUBBLE_DENSITY_MAZE_MULTIPLIER_URBAN = 0.8;
const URBAN_CARVING_MIN_SIZE = 2; const URBAN_CARVING_MAX_SIZE = 4;
const ROADBLOCK_PLACE_ATTEMPTS = Math.floor(12 * 2.5); const ROADBLOCK_THICKNESS = 2; const ROADBLOCK_LENGTH = 4;
const BUILDING_CORNER_CARVE_CHANCE = 0.20; const BUILDING_CORNER_CARVE_MIN_SIZE = 3; const BUILDING_CORNER_CARVE_MAX_SIZE = 5;
const MONOLITH_MARGIN = 2;

const DISTRICT_TYPE_URBAN = {
    INDUSTRIAL: 'INDUSTRIAL', COMMERCIAL: 'COMMERCIAL', RESIDENTIAL: 'RESIDENTIAL', SLUM: 'SLUM', PARK: 'PARK',
    TOXIC: 'TOXIC', MAZE_RUIN: 'MAZE_RUIN', DENSE_URBAN_CORE: 'DENSE_URBAN_CORE', OPEN_FIELD: 'OPEN_FIELD', MONOLITH_PLAZA: 'MONOLITH_PLAZA', NONE: 'NONE'
};
const DISTRICT_POOL_URBAN = [
  { type: DISTRICT_TYPE_URBAN.INDUSTRIAL,  w: 3 }, { type: DISTRICT_TYPE_URBAN.COMMERCIAL,  w: 4 },
  { type: DISTRICT_TYPE_URBAN.RESIDENTIAL, w: 5 }, { type: DISTRICT_TYPE_URBAN.SLUM,        w: 4 },
  { type: DISTRICT_TYPE_URBAN.PARK,        w: 3 }, { type: DISTRICT_TYPE_URBAN.TOXIC,       w: 2 }
];
const DISTRICT_OVERLAY_TINTS_URBAN = {
    [DISTRICT_TYPE_URBAN.INDUSTRIAL]: 'rgba(140,140,160,0.15)', [DISTRICT_TYPE_URBAN.COMMERCIAL]: 'rgba(80,120,180,0.15)',
    [DISTRICT_TYPE_URBAN.RESIDENTIAL]:'rgba(100,160,100,0.15)', [DISTRICT_TYPE_URBAN.SLUM]:       'rgba(90,70,50,0.15)',
    [DISTRICT_TYPE_URBAN.PARK]:       'rgba(60,120,60,0.25)', [DISTRICT_TYPE_URBAN.TOXIC]:      'rgba(100,180,60,0.20)',
    [DISTRICT_TYPE_URBAN.MAZE_RUIN]:  'rgba(70,70,70,0.10)', [DISTRICT_TYPE_URBAN.DENSE_URBAN_CORE]: 'rgba(100,100,120,0.10)',
    [DISTRICT_TYPE_URBAN.OPEN_FIELD]: 'rgba(100,140,80,0.15)', [DISTRICT_TYPE_URBAN.MONOLITH_PLAZA]: 'rgba(120,120,120,0.10)',
    [DISTRICT_TYPE_URBAN.NONE]: 'rgba(0,0,0,0)' // Added for safety
};
var showDistrictTint = true; // Use var to ensure it's global before defer runs, or ensure it's set in game_setup

const ZONE_TYPE = { URBAN: 'URBAN', MAZE_RUINS: 'MAZE_RUINS', DENSE_URBAN: 'DENSE_URBAN', OPEN_FIELD: 'OPEN_FIELD', MONOLITH_PLAZA: 'MONOLITH_PLAZA' };

// --- Tile Image Loading ---
// These are declared in game_setup.js with `var` to ensure global availability
// var imgWall, imgObstacle, imgFloor, imgEntrance;
// var imagesLoaded = false;

const TILE_IMAGE_FILENAMES = {
    WALL: '_wall.png',
    OBSTACLE: '_obstacle.png',
    FLOOR: '_floor.png',
    ENTRANCE: '_entrance.png'
};
const imagesToLoadCount = Object.keys(TILE_IMAGE_FILENAMES).length;
var loadedImageCount = 0; // Use var

function loadTileImages() {
    console.log("Loading tile images (from level_assets.js)...");
    const onImageLoadOrError = () => { // Combined handler
        loadedImageCount++;
        if (loadedImageCount === imagesToLoadCount) {
            imagesLoaded = true; // Set your original flag
            console.log("All tile images in level_assets.js finished loading attempt.");
            if (typeof AssetManager !== 'undefined' && AssetManager.completeExternalLoadingTask) {
                AssetManager.completeExternalLoadingTask('tileImages');
            } else {
                console.warn("AssetManager not ready to complete tileImages task.");
            }
        }
    };

    // Check if imgWall etc. are already defined (e.g. by AssetManager if it was faster)
    // This setup assumes level_assets.js is the primary loader for these specific images.
    if (typeof imgWall === 'undefined') imgWall = new Image(); // Ensure they exist if not already new'd up
    if (typeof imgObstacle === 'undefined') imgObstacle = new Image();
    if (typeof imgFloor === 'undefined') imgFloor = new Image();
    if (typeof imgEntrance === 'undefined') imgEntrance = new Image();

    imgWall.onload = onImageLoadOrError; imgWall.onerror = (e) => { console.error("Error loading tile image:", e.target.src); onImageLoadOrError(); };
    imgObstacle.onload = onImageLoadOrError; imgObstacle.onerror = (e) => { console.error("Error loading tile image:", e.target.src); onImageLoadOrError(); };
    imgFloor.onload = onImageLoadOrError; imgFloor.onerror = (e) => { console.error("Error loading tile image:", e.target.src); onImageLoadOrError(); };
    imgEntrance.onload = onImageLoadOrError; imgEntrance.onerror = (e) => { console.error("Error loading tile image:", e.target.src); onImageLoadOrError(); };

    imgWall.src = TILE_IMAGE_FILENAMES.WALL;
    imgObstacle.src = TILE_IMAGE_FILENAMES.OBSTACLE;
    imgFloor.src = TILE_IMAGE_FILENAMES.FLOOR;
    imgEntrance.src = TILE_IMAGE_FILENAMES.ENTRANCE;
}

// Do NOT call loadTileImages() here directly anymore if AssetManager is orchestrating.
// It will be called from game_logic.js's initScreen.
// --- END OF FILE level_assets.js ---
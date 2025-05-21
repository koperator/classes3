// --- START OF FILE minimap.js ---

// Assumes globals: window.level, window.player, performance, document
// Assumes constants from constants.js: TILE_SIZE, TILE, FOG_STATE,
//                                     COLOR_FLOOR, COLOR_WALL, COLOR_OBSTACLE

const MINIMAP_TILE_SIZE = 1; // Each tile on the map will be 1x1 pixel on the minimap
const MINIMAP_PADDING = 10;
const MINIMAP_BORDER_COLOR = 'rgba(128, 128, 128, 0.7)';
const MINIMAP_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.5)';

const MINIMAP_PLAYER_COLOR = 'rgba(255, 0, 0, 1)';   // Bright red for player
const MINIMAP_EXIT_COLOR = 'rgba(0, 255, 0, 1)';     // Bright green for exit
const MINIMAP_ENTRANCE_COLOR = 'rgba(200, 0, 0, 1)'; // Dark red for map entrances
const MINIMAP_WALL_COLOR = 'rgba(100, 100, 100, 1)'; // Consistent wall color
const MINIMAP_FLOOR_COLOR = 'rgba(60, 60, 60, 1)';   // Consistent floor color
const MINIMAP_HIDDEN_COLOR = 'rgba(30, 30, 30, 0.8)';// Color for hidden fog tiles

let offscreenMinimapCanvas = null;
let offscreenMinimapCtx = null;
let minimapNeedsVisualUpdate = true; // Flag to trigger re-render of the offscreen buffer
let currentMinimapLevelWidth = 0;
let currentMinimapLevelHeight = 0;

// This function will be called by game.js at a set interval
function setMinimapNeedsUpdateFlag() {
    minimapNeedsVisualUpdate = true;
}

// Internal function to render the entire minimap state to the offscreen buffer
function _renderMinimapDataToOffscreenBuffer() {
    if (!window.level || !window.level.grid || !window.level.fogGrid || !window.player) {
        minimapNeedsVisualUpdate = false; // Can't render, don't try again immediately
        return;
    }

    const level = window.level;
    const player = window.player;

    // Ensure offscreen canvas is initialized and correctly sized
    if (!offscreenMinimapCanvas || currentMinimapLevelWidth !== level.width || currentMinimapLevelHeight !== level.height) {
        currentMinimapLevelWidth = level.width;
        currentMinimapLevelHeight = level.height;
        offscreenMinimapCanvas = document.createElement('canvas');
        offscreenMinimapCanvas.width = currentMinimapLevelWidth * MINIMAP_TILE_SIZE;
        offscreenMinimapCanvas.height = currentMinimapLevelHeight * MINIMAP_TILE_SIZE;
        offscreenMinimapCtx = offscreenMinimapCanvas.getContext('2d');
        if (!offscreenMinimapCtx) {
            console.error("Minimap: Failed to get 2D context for offscreen canvas.");
            offscreenMinimapCanvas = null; // Invalidate
            minimapNeedsVisualUpdate = false;
            return;
        }
    }

    if (!offscreenMinimapCtx) { // Should not happen if initialization was successful
        minimapNeedsVisualUpdate = false;
        return;
    }

    // Clear the offscreen buffer
    offscreenMinimapCtx.clearRect(0, 0, offscreenMinimapCanvas.width, offscreenMinimapCanvas.height);

    // Draw map tiles (walls, floor, fog)
    for (let r = 0; r < level.height; r++) {
        for (let c = 0; c < level.width; c++) {
            let tileColor = MINIMAP_HIDDEN_COLOR;

            if (level.fogGrid[r]?.[c] === FOG_STATE.REVEALED) {
                const tileType = level.grid[r]?.[c];
                switch (tileType) {
                    case TILE.FLOOR:
                        tileColor = MINIMAP_FLOOR_COLOR;
                        break;
                    case TILE.WALL:
                    case TILE.OBSTACLE: // Treat obstacles as walls on minimap for simplicity
                        tileColor = MINIMAP_WALL_COLOR;
                        break;
                    case TILE.ENTRANCE:
                        tileColor = MINIMAP_ENTRANCE_COLOR;
                        break;
                    default: // Should not happen for valid map data
                        tileColor = MINIMAP_HIDDEN_COLOR;
                }
            }
            offscreenMinimapCtx.fillStyle = tileColor;
            offscreenMinimapCtx.fillRect(
                c * MINIMAP_TILE_SIZE,
                r * MINIMAP_TILE_SIZE,
                MINIMAP_TILE_SIZE,
                MINIMAP_TILE_SIZE
            );
        }
    }

    // Draw player position
    if (player.active) {
        const playerTileX = Math.floor(player.x / TILE_SIZE);
        const playerTileY = Math.floor(player.y / TILE_SIZE);
        if (playerTileX >= 0 && playerTileX < level.width && playerTileY >= 0 && playerTileY < level.height) {
            offscreenMinimapCtx.fillStyle = MINIMAP_PLAYER_COLOR;
            offscreenMinimapCtx.fillRect(
                playerTileX * MINIMAP_TILE_SIZE,
                playerTileY * MINIMAP_TILE_SIZE,
                MINIMAP_TILE_SIZE,
                MINIMAP_TILE_SIZE
            );
        }
    }

    // Draw exit position if revealed
    if (level.endX > 0 && level.endY > 0) {
        const exitTileX = Math.floor(level.endX / TILE_SIZE);
        const exitTileY = Math.floor(level.endY / TILE_SIZE);
        if (exitTileX >= 0 && exitTileX < level.width && exitTileY >= 0 && exitTileY < level.height) {
            if (level.fogGrid[exitTileY]?.[exitTileX] === FOG_STATE.REVEALED) {
                offscreenMinimapCtx.fillStyle = MINIMAP_EXIT_COLOR;
                offscreenMinimapCtx.fillRect(
                    exitTileX * MINIMAP_TILE_SIZE,
                    exitTileY * MINIMAP_TILE_SIZE,
                    MINIMAP_TILE_SIZE,
                    MINIMAP_TILE_SIZE
                );
            }
        }
    }
    minimapNeedsVisualUpdate = false; // Reset the flag after rendering to buffer
}

// This function is called every frame by game.js
function drawMinimap(mainCtx, mainCanvas) {
    if (!window.level || !window.level.grid) { // Basic check if level is loaded
        return;
    }

    // If an update to the buffer is needed (triggered by timer in game.js)
    if (minimapNeedsVisualUpdate) {
        _renderMinimapDataToOffscreenBuffer();
    }

    // If buffer is not ready (e.g., first frame or error), don't draw
    if (!offscreenMinimapCanvas || !offscreenMinimapCtx) {
        return;
    }

    const minimapDisplayWidth = offscreenMinimapCanvas.width;
    const minimapDisplayHeight = offscreenMinimapCanvas.height;

    const minimapXOnScreen = mainCanvas.width - minimapDisplayWidth - MINIMAP_PADDING;
    const minimapYOnScreen = MINIMAP_PADDING;

    // Draw background and border for the minimap directly on the main canvas
    mainCtx.fillStyle = MINIMAP_BACKGROUND_COLOR;
    mainCtx.fillRect(minimapXOnScreen - 2, minimapYOnScreen - 2, minimapDisplayWidth + 4, minimapDisplayHeight + 4);
    mainCtx.strokeStyle = MINIMAP_BORDER_COLOR;
    mainCtx.lineWidth = 1;
    mainCtx.strokeRect(minimapXOnScreen - 2, minimapYOnScreen - 2, minimapDisplayWidth + 4, minimapDisplayHeight + 4);

    // Draw the pre-rendered minimap buffer to the main canvas
    mainCtx.drawImage(offscreenMinimapCanvas, minimapXOnScreen, minimapYOnScreen);

    mainCtx.lineWidth = 1; // Reset main context line width
}
// --- END OF FILE minimap.js ---
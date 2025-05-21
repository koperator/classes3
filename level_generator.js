// --- START OF FILE level_generator.js ---

// Assumes globals: window, console, Math, PF, getRandomInt, distance, TILE_SIZE, TILE, FOG_STATE, Powerup, MAX_POWERUPS_ON_MAP, powerupConfig, START_AREA_RADIUS
// Assumes constants from constants.js (START_AREA_RADIUS, NUM_EXITS, MIN_ENTRANCE_EXIT_DISTANCE_FACTOR etc.)
// Assumes constants from level_assets.js (ZONE_TYPE, MAX_STREET_THICKNESS_URBAN, DISTRICT_TYPE_URBAN etc.)
// Assumes helper functions from level_helpers_urban.js (layOutStreetsUrbanInBounds, assignDistrictsUrbanInBounds, generateMazeRegion, etc.)

// --- Core Level Helper Functions ---
function isWall(gridX, gridY) {
    const currentLevel = window.level || {}; if (!currentLevel.grid) return true;
    if (gridX < 0 || gridX >= currentLevel.width || gridY < 0 || gridY >= currentLevel.height) return true;
    const tileType = currentLevel.grid[gridY]?.[gridX];
    return tileType === TILE.WALL || tileType === TILE.OBSTACLE;
}

function isWallForLoS(gridX, gridY) { // Specifically for Line of Sight for Fog
    const currentLevel = window.level || {}; if (!currentLevel.grid) return true;
    if (gridX < 0 || gridX >= currentLevel.width || gridY < 0 || gridY >= currentLevel.height) return true;
    const tileType = currentLevel.grid[gridY]?.[gridX];
    return tileType === TILE.WALL;
}

function isSolidForPlayer(gridX, gridY) {
    const currentLevel = window.level || {}; if (!currentLevel.grid) return true;
    if (gridX < 0 || gridX >= currentLevel.width || gridY < 0 || gridY >= currentLevel.height) return true;
    const tileType = currentLevel.grid[gridY]?.[gridX];
    return tileType === TILE.WALL || tileType === TILE.OBSTACLE || tileType === TILE.ENTRANCE;
}

function checkWallCollision(px, py, r) {
    const currentLevel = window.level || {}; if (!currentLevel.grid) return true;
    if (px - r < 0 || px + r >= currentLevel.width * TILE_SIZE || py - r < 0 || py + r >= currentLevel.height * TILE_SIZE) return true;
    const margin = 0.1;
    const checkPoints = [
        { x: px, y: py },
        { x: px + r - margin, y: py }, { x: px - r + margin, y: py },
        { x: px, y: py + r - margin }, { x: px, y: py - r + margin },
        { x: px + (r - margin) * 0.707, y: py + (r - margin) * 0.707 }, { x: px - (r - margin) * 0.707, y: py + (r - margin) * 0.707 },
        { x: px + (r - margin) * 0.707, y: py - (r - margin) * 0.707 }, { x: px - (r - margin) * 0.707, y: py - (r - margin) * 0.707 }
    ];
    for (const p of checkPoints) {
        const gridX = Math.floor(p.x / TILE_SIZE);
        const gridY = Math.floor(p.y / TILE_SIZE);
        if (isSolidForPlayer(gridX, gridY)) return true;
    }
    return false;
}


function pickStartEndUrban(level) {
    let START_AREA_RADIUS_LOCAL; if (typeof START_AREA_RADIUS !== 'undefined') START_AREA_RADIUS_LOCAL = START_AREA_RADIUS; else { console.error("Global START_AREA_RADIUS missing!"); START_AREA_RADIUS_LOCAL = 3; }
    let startCandidates = []; for (let y_s=1;y_s<level.height-1;y_s++) { for (let x_s=1;x_s<Math.floor(level.width*0.4);x_s++) { if (level.grid[y_s]?.[x_s]===TILE.FLOOR && level.districtGrid[y_s]?.[x_s]===DISTRICT_TYPE_URBAN.RESIDENTIAL) startCandidates.push({x:x_s,y:y_s});}} if (startCandidates.length===0) { for (let y_s=1;y_s<level.height-1;y_s++) { for (let x_s=1;x_s<Math.floor(level.width*0.4);x_s++) { if (level.grid[y_s]?.[x_s]===TILE.FLOOR) startCandidates.push({x:x_s,y:y_s});}}} if (startCandidates.length===0) { for (let y_s=1;y_s<level.height-1;y_s++) { for (let x_s=1;x_s<level.width-1;x_s++) { if (level.grid[y_s]?.[x_s]===TILE.FLOOR) startCandidates.push({x:x_s,y:y_s});}}}
    let startTile; if (startCandidates.length>0) startTile=startCandidates[getRandomInt(0, startCandidates.length-1)]; else { console.warn("Forcing start point!"); startTile={x:Math.max(1,Math.floor(level.width*0.1)),y:Math.max(1,Math.floor(level.height*0.5))}; if(level.grid[startTile.y]?.[startTile.x]!==undefined && level.grid[startTile.y])level.grid[startTile.y][startTile.x]=TILE.FLOOR;else{console.error("Can't force start!");return false;}}
    level.startX = startTile.x*TILE_SIZE+TILE_SIZE/2; level.startY = startTile.y*TILE_SIZE+TILE_SIZE/2;
    for (let dy=-START_AREA_RADIUS_LOCAL;dy<=START_AREA_RADIUS_LOCAL;dy++) { for (let dx=-START_AREA_RADIUS_LOCAL;dx<=START_AREA_RADIUS_LOCAL;dx++) { const gx=startTile.x+dx; const gy=startTile.y+dy; if(gx>0&&gx<level.width-1&&gy>0&&gy<level.height-1){ if(level.grid[gy]?.[gx]!==undefined&&level.grid[gy][gx]!==TILE.ENTRANCE && level.grid[gy])level.grid[gy][gx]=TILE.FLOOR; if(level.fogGrid?.[gy]?.[gx]!==undefined && level.fogGrid[gy])level.fogGrid[gy][gx]=FOG_STATE.REVEALED;}}} if(level.fogGrid?.[startTile.y]?.[startTile.x]!==undefined && level.fogGrid[startTile.y])level.fogGrid[startTile.y][startTile.x]=FOG_STATE.REVEALED;
    let endCandidates = []; let allFloorTiles = []; const endSearchStartX=Math.floor(level.width*0.6); for(let y_end=1;y_end<level.height-1;y_end++){for(let x_end=1;x_end<level.width-1;x_end++){if(level.grid[y_end]?.[x_end]===TILE.FLOOR){allFloorTiles.push({x:x_end,y:y_end}); if(x_end>=endSearchStartX)endCandidates.push({x:x_end,y:y_end});}}}
    let endTile=null; if(typeof PF!=='undefined'&&PF.Grid&&PF.AStarFinder&&endCandidates.length>0 && level.finder){const tempPfGrid=new PF.Grid(level.width,level.height);for(let r_pf=0;r_pf<level.height;r_pf++){for(let c_pf=0;c_pf<level.width;c_pf++){const t=level.grid[r_pf]?.[c_pf];tempPfGrid.setWalkableAt(c_pf,r_pf,t===TILE.FLOOR);}}endCandidates.sort(()=>Math.random()-0.5);for(const cand of endCandidates){const clone=tempPfGrid.clone();try{const path=level.finder.findPath(startTile.x,startTile.y,cand.x,cand.y,clone);if(path&&path.length>0){endTile=cand;break;}}catch(e){/*ignore*/}}if(endTile)console.log("End by pathfinding.");}else if(endCandidates.length===0){console.warn("No east candidates for end point.");}else{console.warn("PF/finder not found or no candidates for end point pathfinding.");}
    if(!endTile){console.warn("Distance fallback for end point.");let maxDistSq=-1;const candidatesToSearch=endCandidates.length>0?endCandidates:allFloorTiles;if(candidatesToSearch.length===0){console.error("No floor tiles for end point fallback!");}else{for(const cand of candidatesToSearch){if(distance(startTile.x,startTile.y,cand.x,cand.y)<Math.min(level.width,level.height)*0.5)continue;const dSq=distance(startTile.x,startTile.y,cand.x,cand.y);if(dSq>maxDistSq){maxDistSq=dSq;endTile=cand;}}}}
    if(!endTile){console.warn("Forcing end location due to no suitable point found.");endTile={x:level.width-2,y:Math.max(1,Math.floor(level.height/2))};if(level.grid[endTile.y]?.[endTile.x]!==TILE.FLOOR&&level.grid[endTile.y]?.[endTile.x]!==undefined && level.grid[endTile.y])level.grid[endTile.y][endTile.x]=TILE.FLOOR;}
    level.endX = endTile.x*TILE_SIZE+TILE_SIZE/2; level.endY = endTile.y*TILE_SIZE+TILE_SIZE/2; console.log(`Placed Start: (${startTile.x}, ${startTile.y}), End: (${endTile.x}, ${endTile.y})`); return true;
}

function addEntrancesUrban(level) {
    if(typeof NUM_EXITS==='undefined'||typeof MIN_ENTRANCE_EXIT_DISTANCE_FACTOR==='undefined'){console.error("Entrance constants missing!");level.entrances=[];return;}if(!level.startX||!level.endX){console.error("Start/end missing for entrances.");level.entrances=[];return;}level.entrances=[];const minEntranceExitDistSq=(level.width*MIN_ENTRANCE_EXIT_DISTANCE_FACTOR*TILE_SIZE)**2;const entranceCandidates=[];
    for(let x_ent=1;x_ent<level.width-1;x_ent++){if(level.grid[1]?.[x_ent]===TILE.FLOOR)entranceCandidates.push({x:x_ent,y:0,edge:'top'});}for(let x_ent=1;x_ent<level.width-1;x_ent++){if(level.grid[level.height-2]?.[x_ent]===TILE.FLOOR)entranceCandidates.push({x:x_ent,y:level.height-1,edge:'bottom'});}for(let y_ent=1;y_ent<level.height-1;y_ent++){if(level.grid[y_ent]?.[1]===TILE.FLOOR)entranceCandidates.push({x:0,y:y_ent,edge:'left'});}for(let y_ent=1;y_ent<level.height-1;y_ent++){if(level.grid[y_ent]?.[level.width-2]===TILE.FLOOR)entranceCandidates.push({x:level.width-1,y:y_ent,edge:'right'});}
    entranceCandidates.sort(()=>Math.random()-0.5);let entrancesCreated=0; const targetEntrances=NUM_EXITS*2;const minEntranceSeparation=Math.max(3,Math.floor(Math.min(level.width,level.height)/(targetEntrances*1.5)));const placedCoords=[];
    for(const cand of entranceCandidates){const candCenterX=cand.x*TILE_SIZE+TILE_SIZE/2;const candCenterY=cand.y*TILE_SIZE+TILE_SIZE/2;const distToExitSq=(candCenterX-level.endX)**2+(candCenterY-level.endY)**2;if(distToExitSq<minEntranceExitDistSq)continue;let tooClose=false;for(const existing of placedCoords){const separation=distance(cand.x,cand.y,existing.x,existing.y);if(separation<minEntranceSeparation){tooClose=true;break;}}if(tooClose)continue;
    if(level.grid[cand.y]?.[cand.x]!==undefined && level.grid[cand.y]){level.grid[cand.y][cand.x]=TILE.ENTRANCE;level.entrances.push({x:cand.x,y:cand.y});placedCoords.push({x:cand.x,y:cand.y,edge:cand.edge});entrancesCreated++;if(entrancesCreated>=targetEntrances)break;}}console.log(`Entrances placed: ${level.entrances.length}/${targetEntrances} target.`);if(level.entrances.length===0)console.warn("Failed to place any entrances!");
}

function buildPathfinderGridUrban(level) {
    if(typeof PF==='undefined'||!PF.Grid){console.error("PF missing!");level.pathfinderGrid=null;return;}level.pathfinderGrid=new PF.Grid(level.width,level.height);for(let y_pf_grid=0;y_pf_grid<level.height;y_pf_grid++){for(let x_pf_grid=0;x_pf_grid<level.width;x_pf_grid++){const tileType=level.grid[y_pf_grid]?.[x_pf_grid];const isWalkable=(tileType===TILE.FLOOR||tileType===TILE.ENTRANCE);level.pathfinderGrid.setWalkableAt(x_pf_grid,y_pf_grid,isWalkable);}}console.log("Pathfinder grid built.");
}

// --- Main Level Generation Function ---
function generateLevel(levelData, widthTiles, heightTiles) {
    console.log(`Starting HYBRID level generation (${widthTiles}x${heightTiles})...`);
    levelData.width = widthTiles; levelData.height = heightTiles;
    if (typeof TILE_SIZE==='undefined'||typeof TILE==='undefined'||typeof FOG_STATE==='undefined'||typeof START_AREA_RADIUS==='undefined'||typeof NUM_EXITS==='undefined'||typeof MIN_ENTRANCE_EXIT_DISTANCE_FACTOR==='undefined') { console.error("Essential global constants missing for level gen! Aborting."); return; }

    levelData.grid = []; for(let i=0; i < heightTiles; i++) { levelData.grid[i] = Array(widthTiles).fill(TILE.WALL); }
    levelData.districtGrid = []; for(let i=0; i < heightTiles; i++) { levelData.districtGrid[i] = Array(widthTiles).fill(DISTRICT_TYPE_URBAN.NONE); }
    levelData.fogGrid = []; for(let i=0; i < heightTiles; i++) { levelData.fogGrid[i] = Array(widthTiles).fill(FOG_STATE.HIDDEN); }
    levelData.blocks = [];

    const numRegionCols = 5; const numRegionRows = 5;
    const regionW = Math.floor(widthTiles / numRegionCols); const regionH = Math.floor(heightTiles / numRegionRows);
    const regionGenerationOrder = []; for(let r_reg_order=0;r_reg_order<numRegionRows;r_reg_order++){for(let c_reg_order=0;c_reg_order<numRegionCols;c_reg_order++){regionGenerationOrder.push({r:r_reg_order,c:c_reg_order});}} regionGenerationOrder.sort(()=>Math.random()-0.5);

    for (const reg of regionGenerationOrder) {
        const r_loop = reg.r; const c_loop = reg.c;
        const x1_reg = c_loop * regionW; const y1_reg = r_loop * regionH;
        const x2_reg = (c_loop === numRegionCols - 1) ? widthTiles - 1 : (c_loop + 1) * regionW - 1;
        const y2_reg = (r_loop === numRegionRows - 1) ? heightTiles - 1 : (r_loop + 1) * regionH - 1;
        const regionBounds = { x1: x1_reg, y1: y1_reg, x2: x2_reg, y2: y2_reg };
        let zoneAlgo = ZONE_TYPE.URBAN; const randAlgo = Math.random();
        if      (randAlgo < 0.03) { zoneAlgo = ZONE_TYPE.MONOLITH_PLAZA; }
        else if (randAlgo < 0.18) { zoneAlgo = ZONE_TYPE.OPEN_FIELD; }
        else if (randAlgo < 0.33) { zoneAlgo = ZONE_TYPE.MAZE_RUINS; }
        else if (randAlgo < 0.53) { zoneAlgo = ZONE_TYPE.DENSE_URBAN; }
        if (zoneAlgo === ZONE_TYPE.URBAN) { layOutStreetsUrbanInBounds(levelData, regionBounds, false); assignDistrictsUrbanInBounds(levelData, regionBounds, false); }
        else if (zoneAlgo === ZONE_TYPE.DENSE_URBAN) { layOutStreetsUrbanInBounds(levelData, regionBounds, true); assignDistrictsUrbanInBounds(levelData, regionBounds, true); }
        else if (zoneAlgo === ZONE_TYPE.MAZE_RUINS) { generateMazeRegion(levelData, regionBounds); }
        else if (zoneAlgo === ZONE_TYPE.OPEN_FIELD) { generateOpenFieldRegion(levelData, regionBounds); }
        else if (zoneAlgo === ZONE_TYPE.MONOLITH_PLAZA) { generateMonolithPlazaRegion(levelData, regionBounds); }
    }

    const stitchChance = 0.95;
    for (let r_stitch = 0; r_stitch < numRegionRows - 1; r_stitch++) { const stitchY_center = (r_stitch + 1) * regionH; for(let s_offset = -Math.floor(MAX_STREET_THICKNESS_URBAN/2); s_offset <= Math.floor(MAX_STREET_THICKNESS_URBAN/2); s_offset++){ const stitchY = stitchY_center + s_offset; if(stitchY <=0 || stitchY >= heightTiles -1) continue; for (let x_stitch = 1; x_stitch < widthTiles - 1; x_stitch++) { if (levelData.grid[stitchY]?.[x_stitch] === TILE.WALL && levelData.grid[stitchY-1]?.[x_stitch] === TILE.FLOOR && levelData.grid[stitchY+1]?.[x_stitch] === TILE.FLOOR && Math.random() < stitchChance && levelData.grid[stitchY]) { levelData.grid[stitchY][x_stitch]=TILE.FLOOR; }}}}
    for (let c_stitch = 0; c_stitch < numRegionCols - 1; c_stitch++) { const stitchX_center = (c_stitch + 1) * regionW; for(let s_offset = -Math.floor(MAX_STREET_THICKNESS_URBAN/2); s_offset <= Math.floor(MAX_STREET_THICKNESS_URBAN/2); s_offset++){ const stitchX = stitchX_center + s_offset; if(stitchX <=0 || stitchX >= widthTiles -1) continue; for (let y_stitch = 1; y_stitch < heightTiles - 1; y_stitch++) { if (levelData.grid[y_stitch]?.[stitchX] === TILE.WALL && levelData.grid[y_stitch]?.[stitchX-1] === TILE.FLOOR && levelData.grid[y_stitch]?.[stitchX+1] === TILE.FLOOR && Math.random() < stitchChance && levelData.grid[y_stitch]) { levelData.grid[y_stitch][stitchX]=TILE.FLOOR; }}}}

    createLoopsUrban(levelData); carveOpenAreasUrban(levelData); carveBuildingCorners(levelData);
    if (!pickStartEndUrban(levelData)) { console.error("Global Start/End placement failed."); return; }
    scatterRubbleUrban(levelData); placeRoadblocks(levelData); addEntrancesUrban(levelData); buildPathfinderGridUrban(levelData);
    console.log("Finished HYBRID level generation."); window.level = levelData;

    // <<<< NEW: Signal static tile buffer needs full redraw >>>>
    if (typeof window !== 'undefined') {
        window.staticBufferNeedsRedraw = true;
        window.previouslyRevealedStaticTiles = new Set(); // Reset for new level
    }
}

function spawnPowerups(level, playerClassId) {
    window.powerups = []; // Clear existing powerups
    const floorTiles = [];
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            if (level.grid[y]?.[x] === TILE.FLOOR) {
                const startDistSq = (x - Math.floor(level.startX / TILE_SIZE))**2 + (y - Math.floor(level.startY / TILE_SIZE))**2;
                const endDistSq = (level.endX > 0 && level.endY > 0) ? (x - Math.floor(level.endX / TILE_SIZE))**2 + (y - Math.floor(level.endY / TILE_SIZE))**2 : Infinity;
                // Avoid spawning too close to start or designated end
                if (startDistSq > (START_AREA_RADIUS + 3)**2 && endDistSq > (START_AREA_RADIUS + 3)**2) {
                    floorTiles.push({ x, y });
                }
            }
        }
    }

    if (floorTiles.length === 0) {
        console.warn("No suitable floor tiles to spawn powerups.");
        return;
    }

    const classSpecificPowerups = [];
    const genericPowerups = [];

    for (const type in powerupConfig) {
        const pData = powerupConfig[type];
        if (pData.classId === playerClassId) {
            classSpecificPowerups.push(type);
        } else if (pData.classId === null) {
            genericPowerups.push(type);
        }
    }

    // Shuffle available powerups for variety in selection
    classSpecificPowerups.sort(() => Math.random() - 0.5);
    genericPowerups.sort(() => Math.random() - 0.5);

    let spawnedCount = 0;
    const attempts = MAX_POWERUPS_ON_MAP * 17; // More attempts to find distinct spots and types

    for (let i = 0; i < attempts && spawnedCount < MAX_POWERUPS_ON_MAP && floorTiles.length > 0; i++) {
        // Decide if class-specific or generic (try to get a mix)
        let powerupTypeToSpawn = null;
        const preferClassSpecific = Math.random() < 0.6; // 60% chance to try class-specific first

        if (preferClassSpecific && classSpecificPowerups.length > 0) {
            powerupTypeToSpawn = classSpecificPowerups.pop(); // Take one from the shuffled list
        } else if (genericPowerups.length > 0) {
            powerupTypeToSpawn = genericPowerups.pop();
        } else if (classSpecificPowerups.length > 0) { // Fallback if generic was preferred but empty
            powerupTypeToSpawn = classSpecificPowerups.pop();
        }

        if (powerupTypeToSpawn && floorTiles.length > 0) {
            const randIdx = getRandomInt(0, floorTiles.length - 1);
            const tile = floorTiles.splice(randIdx, 1)[0]; // Remove to prevent overlap on this exact tile

            const pX = tile.x * TILE_SIZE + TILE_SIZE / 2;
            const pY = tile.y * TILE_SIZE + TILE_SIZE / 2;
            window.powerups.push(new Powerup(pX, pY, powerupTypeToSpawn));
            spawnedCount++;
        } else if (!powerupTypeToSpawn && classSpecificPowerups.length === 0 && genericPowerups.length === 0) {
            break; // No more powerup types available to spawn
        }
    }
    console.log(`Spawned ${spawnedCount} powerups.`);
}
// --- END OF FILE level_generator.js ---
// Assumes globals: Math, console, distance, normalizeVector, getRandomInt, hasLineOfSight, TILE_SIZE, FOG_STATE, level, performance, window (for frameCount, playSound)
// Assumes constants: All constants from constants.js (e.g., MERC_*, TILE_SIZE, MERC_WEAPON, SCREAMER_ABILITY_DURATION, SLOW_EFFECT_COLOR)
// Assumes classes: Projectile, OwnerType (these should be defined due to correct index.html load order)

class Mercenary {
    constructor(x, y, id) {
        this.id = id; // Make sure ID is passed and used for staggering
        this.x = x; this.y = y; this.radius = MERC_SIZE / 2;
        this.hp = MERC_HP;
        this.maxHp = MERC_HP;
        this.speed = MERC_SPEED;
        this.angle = 0; this.targetZombie = null;
        this.formationTargetPos = { x: x, y: y };
        this.weapon = MERC_WEAPON;
        this.ammo = this.weapon.magSize; this.reloading = false; this.reloadTimer = 0; this.fireTimer = 0; this.fireInterval = 60000 / this.weapon.rpm; this.active = true; this.path = [];
        this.pathCooldown = MERC_PATHFINDING_COOLDOWN + Math.random() * 0.25;
        this.pathTimer = Math.random() * this.pathCooldown;
        this.targetNodeIndex = 0;
        this.lastPathRequestTime = 0;
        this.failedPathAttempts = 0;
        this.lastPathTargetPos = {x:0, y:0};

        this.slowTimer = 0;
        this.slowFactor = 1.0;
    }

    applySlow(duration, factor) {
        this.slowTimer = Math.max(this.slowTimer, duration);
        this.slowFactor = Math.min(this.slowFactor, factor);
    }

    update(effectiveDt, player, zombies, turrets_ref, mercenaries_ref, isWallFunc, pathfinderGrid, finder, projectiles_ref) {
         if (!this.active || !player || !player.active) return;
         const now = performance.now();

         let currentSpeedFactor = 1.0;
         if (this.slowTimer > 0) {
             this.slowTimer -= effectiveDt * 1000;
             if (this.slowTimer <= 0) this.slowFactor = 1.0;
             else currentSpeedFactor = this.slowFactor;
         }
         const currentSpeed = this.speed * currentSpeedFactor;

         const followOffsetDist = TILE_SIZE * (1.0 + this.id * 0.5);
         const angleOffsetMultiplier = this.id === 2 ? -1.5 : (this.id === 3 ? 1.5 : (this.id === 0 ? -0.8 : 0.8));
         const angleOffset = angleOffsetMultiplier * (Math.PI / 2.2);
         const playerFormationAngle = player.angle + Math.PI + angleOffset;
         this.formationTargetPos.x = player.x + Math.cos(playerFormationAngle) * followOffsetDist;
         this.formationTargetPos.y = player.y + Math.sin(playerFormationAngle) * followOffsetDist;

         this.pathTimer += effectiveDt;
         const distToFormationPos = distance(this.x, this.y, this.formationTargetPos.x, this.formationTargetPos.y);

         let needsNewPath = false;
         if (this.path.length === 0 || this.targetNodeIndex >= this.path.length || this.failedPathAttempts > 2) { // Try a bit more if failed
             needsNewPath = true;
         } else if (this.path.length > 0) { // Check if current path target is still valid
             const lastNodeInPath = this.path[this.path.length - 1];
             const pathEndGoalDist = distance(lastNodeInPath[0] * TILE_SIZE + TILE_SIZE / 2, lastNodeInPath[1] * TILE_SIZE + TILE_SIZE / 2, this.formationTargetPos.x, this.formationTargetPos.y);
             if (pathEndGoalDist > TILE_SIZE * 3.5) { // If path endpoint is now far from actual desired formation spot
                 needsNewPath = true;
             }
         }

         if (distToFormationPos > MERC_FOLLOW_DISTANCE_MAX * 1.3 || (distToFormationPos > TILE_SIZE * 2 && this.path.length === 0 && this.failedPathAttempts > 0) ) {
             needsNewPath = true;
         }
         if (Math.abs(this.formationTargetPos.x - this.lastPathTargetPos.x) > TILE_SIZE * 2 || Math.abs(this.formationTargetPos.y - this.lastPathTargetPos.y) > TILE_SIZE * 2) {
            needsNewPath = true; // Player (and thus formation spot) moved significantly
         }

         const canPathfindThisFrame = (this.id % 4 === (window.frameCount || 0) % 4);

         if (canPathfindThisFrame && this.pathTimer >= this.pathCooldown && pathfinderGrid && finder && needsNewPath && (now - this.lastPathRequestTime > 250)) {
             this.pathTimer = 0;
             this.lastPathRequestTime = now;
             const startX = Math.floor(this.x / TILE_SIZE); const startY = Math.floor(this.y / TILE_SIZE);
             const endX = Math.floor(this.formationTargetPos.x / TILE_SIZE); const endY = Math.floor(this.formationTargetPos.y / TILE_SIZE);

             if (!isWallFunc(startX, startY) && !isWallFunc(endX, endY) && (startX !== endX || startY !== endY)) {
                 try {
                     const gridClone = pathfinderGrid.clone(); // Using clone for Mercs
                     this.path = finder.findPath(startX, startY, endX, endY, gridClone);
                     this.targetNodeIndex = 0;
                     this.lastPathTargetPos.x = this.formationTargetPos.x;
                     this.lastPathTargetPos.y = this.formationTargetPos.y;
                     if (this.path.length > 0) {
                         this.failedPathAttempts = 0;
                     } else {
                         this.failedPathAttempts++;
                     }
                 } catch (e) { this.path = []; this.failedPathAttempts++; }
             } else { this.path = []; this.failedPathAttempts++; }
         }

         let moveX = 0; let moveY = 0; let movingAlongPath = false;
         if (this.path.length > 0 && this.targetNodeIndex < this.path.length) {
             const targetNode = this.path[this.targetNodeIndex];
             const nodeCenterX = targetNode[0] * TILE_SIZE + TILE_SIZE / 2;
             const nodeCenterY = targetNode[1] * TILE_SIZE + TILE_SIZE / 2;
             const dxNode = nodeCenterX - this.x; const dyNode = nodeCenterY - this.y;
             const distNode = Math.hypot(dxNode, dyNode);
             if (distNode > this.radius * 0.2) {
                 const norm = normalizeVector(dxNode, dyNode); moveX = norm.x; moveY = norm.y;
                 movingAlongPath = true;
             }
             if (distNode < TILE_SIZE * 0.7) { // Original threshold
                 this.targetNodeIndex++;
                 if (this.targetNodeIndex >= this.path.length) { this.path = []; }
             }
         }

         if (!movingAlongPath && distToFormationPos > MERC_FOLLOW_DISTANCE_MIN * 0.8) { // Original fallback
             const norm = normalizeVector(this.formationTargetPos.x - this.x, this.formationTargetPos.y - this.y);
             moveX = norm.x; moveY = norm.y;
         }

         mercenaries_ref.forEach(other => {
            if(other !== this && other.active) {
                const distOther = distance(this.x, this.y, other.x, other.y);
                if(distOther > 0.1 && distOther < MERC_SEPARATION_DISTANCE){
                    const pushDx = this.x - other.x; const pushDy = this.y - other.y;
                    const pushNorm = normalizeVector(pushDx, pushDy);
                    moveX += pushNorm.x * 0.3; moveY += pushNorm.y * 0.3;
                }
            }
         });

         if (moveX !== 0 || moveY !== 0) {
             const moveNorm = normalizeVector(moveX, moveY);
             let nextX = this.x + moveNorm.x * currentSpeed * effectiveDt;
             let nextY = this.y + moveNorm.y * currentSpeed * effectiveDt;
             // Original collision logic from your visually preferred version
             if (!isWallFunc(Math.floor(nextX / TILE_SIZE), Math.floor(this.y / TILE_SIZE))) { this.x = nextX; }
             if (!isWallFunc(Math.floor(this.x / TILE_SIZE), Math.floor(nextY / TILE_SIZE))) { this.y = nextY; }
         }


         this.targetZombie = null;
         let closestDistSq = this.weapon.range * this.weapon.range;
         zombies.forEach(zombie => {
             if (zombie.hp <= 0) return;
             const distSq = distance(this.x, this.y, zombie.x, zombie.y) ** 2;
             if (distSq < closestDistSq) {
                 const targetTileX = Math.floor(zombie.x / TILE_SIZE);
                 const targetTileY = Math.floor(zombie.y / TILE_SIZE);
                 if (typeof level !== 'undefined' && level.fogGrid?.[targetTileY]?.[targetTileX] === FOG_STATE.REVEALED && hasLineOfSight(this.x, this.y, zombie.x, zombie.y, isWallFunc)) {
                     closestDistSq = distSq;
                     this.targetZombie = zombie;
                 }
             }
         });


         if (this.reloading) {
             this.reloadTimer += effectiveDt * 1000;
             if (this.reloadTimer >= this.weapon.reloadTime) {
                 this.reloading = false; this.ammo = this.weapon.magSize;
             }
         } else {
             if (this.ammo <= 0) { this.reloading = true; this.reloadTimer = 0; }
         }

         this.fireTimer -= effectiveDt * 1000;
         if (this.targetZombie && !this.reloading && this.fireTimer <= 0) {
             this.angle = Math.atan2(this.targetZombie.y - this.y, this.targetZombie.x - this.x);
             const shotAngle = this.angle + (Math.random() - 0.5) * this.weapon.spread;
             const barrelOffset = this.radius * 1.1;
             const barrelStartX = this.x + Math.cos(this.angle) * barrelOffset;
             const barrelStartY = this.y + Math.sin(this.angle) * barrelOffset;
             const damage = getRandomInt(this.weapon.damageMin, this.weapon.damageMax);
             projectiles_ref.push(new Projectile( barrelStartX, barrelStartY, shotAngle, damage, this.weapon.projectileSpeed, this.weapon.penetration, this.weapon.ricochets, PROJECTILE_LENGTH_DEFAULT, PROJECTILE_WIDTH_DEFAULT, false, false, -1, this, OwnerType.MERCENARY ));
             if (typeof playSound === 'function') playSound('MERC_SMG_SHOOT', {volume: 0.4});
             this.fireTimer = this.fireInterval; this.ammo--;
         } else if (!this.targetZombie) {
             if (moveX !== 0 || moveY !== 0) { this.angle = Math.atan2(moveY, moveX); }
             else if(player && player.active) { this.angle = Math.atan2(player.y - this.y, player.x - this.x); }
         }
    }

    takeDamage(amount, sourceType = 'unknown') {
        if (!this.active) return;
        this.hp -= amount;
        if (this.hp <= 0) { this.hp = 0; this.active = false; }
    }

    draw(ctx, offsetX, offsetY) {
        if (!this.active) return;
        const gridX = Math.floor(this.x / TILE_SIZE);
        const gridY = Math.floor(this.y / TILE_SIZE);
        if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] === FOG_STATE.REVEALED) {
             ctx.save();
             ctx.translate(this.x - offsetX, this.y - offsetY);

             if (this.slowTimer > 0) {
                 const slowAlpha = 0.2 + (this.slowTimer / SCREAMER_ABILITY_DURATION) * 0.3;
                 ctx.fillStyle = SLOW_EFFECT_COLOR;
                 ctx.beginPath();
                 ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
                 ctx.fill();
             }

             ctx.rotate(this.angle);
             ctx.fillStyle = MERC_COLOR;
             ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
             ctx.fillStyle = 'grey'; ctx.fillRect(this.radius * 0.6, -2, this.radius * 0.8, 4);

             ctx.restore();

             const barWidth = this.radius * 1.5; const barHeight = 4;
             const barX = this.x - offsetX - barWidth / 2; const barY = this.y - offsetY - this.radius - barHeight - 4;
             const hpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
             ctx.fillStyle = '#555'; ctx.fillRect(barX, barY, barWidth, barHeight);
             ctx.fillStyle = hpRatio > 0.5 ? 'lime' : (hpRatio > 0.2 ? 'yellow' : 'red');
             ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
             ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
}
// --- END OF FILE mercenary.js ---
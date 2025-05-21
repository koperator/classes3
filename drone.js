class Drone {
    constructor(owner, index) {
        this.owner = owner; this.index = index; this.target = null; this.previousTarget = null; this.fireCooldown = 0; this.switchTargetCooldownTimer = 0;
        this.x = owner.x + (Math.random() - 0.5) * 50; this.y = owner.y + (Math.random() - 0.5) * 50; this.vx = 0; this.vy = 0; this.targetPos = { x: this.x, y: this.y };
        this.noisePhaseX = Math.random() * Math.PI * 2; this.noisePhaseY = Math.random() * Math.PI * 2; this.noiseOffsetX = 0; this.noiseOffsetY = 0;
        this.active = true;
        this.hp = 1; // Drone can be destroyed
        this.playedDestroySound = false; // To ensure destroy sound plays once

        // Debuff properties
        this.slowTimer = 0;
        this.slowFactor = 1.0;
    }

     applySlow(duration, factor) {
        this.slowTimer = Math.max(this.slowTimer, duration);
        this.slowFactor = Math.min(this.slowFactor, factor);
    }


    update(effectiveDt, zombies, isWallFunc, projectiles_ref, allDrones) {
        if (!this.active) {
            // This check was moved to the end of update for clarity after hp reduction
            return;
        }

         let currentSpeedFactor = 1.0;
         if (this.slowTimer > 0) {
             this.slowTimer -= effectiveDt * 1000;
             if (this.slowTimer <= 0) this.slowFactor = 1.0;
             else currentSpeedFactor = this.slowFactor;
         }
         const currentMaxSpeed = DRONE_SPEED * currentSpeedFactor;


        const realTimeSeconds = performance.now() / 1000;
        const targetNoiseOffsetX = Math.cos(realTimeSeconds * DRONE_NOISE_FREQUENCY_X + this.noisePhaseX) * DRONE_NOISE_AMPLITUDE;
        const targetNoiseOffsetY = Math.sin(realTimeSeconds * DRONE_NOISE_FREQUENCY_Y + this.noisePhaseY) * DRONE_NOISE_AMPLITUDE;
        const noiseLerpFactor = 0.05 * (effectiveDt / (1/60));
        this.noiseOffsetX = lerp(this.noiseOffsetX, targetNoiseOffsetX, Math.min(1, noiseLerpFactor));
        this.noiseOffsetY = lerp(this.noiseOffsetY, targetNoiseOffsetY, Math.min(1, noiseLerpFactor));

        const playerAngle = this.owner.angle;
        const formationAngleOffset = (this.index - (allDrones.length -1) / 2) * (Math.PI / 3.5);
        const targetAngle = playerAngle + formationAngleOffset;
        const leadDist = this.owner.isMoving ? DRONE_FOLLOW_DISTANCE * DRONE_LEAD_FACTOR : DRONE_FOLLOW_DISTANCE * 0.2;
        const baseTargetX = this.owner.x + Math.cos(playerAngle) * leadDist + Math.cos(targetAngle) * DRONE_FOLLOW_DISTANCE;
        const baseTargetY = this.owner.y + Math.sin(playerAngle) * leadDist + Math.sin(targetAngle) * DRONE_FOLLOW_DISTANCE;

        this.targetPos.x = baseTargetX + this.noiseOffsetX;
        this.targetPos.y = baseTargetY + this.noiseOffsetY;

        let steeringX = 0; let steeringY = 0;
        const seekDx = this.targetPos.x - this.x; const seekDy = this.targetPos.y - this.y; const seekDist = Math.sqrt(seekDx*seekDx + seekDy*seekDy);
        if (seekDist > 0.1) { const seekNorm = normalizeVector(seekDx, seekDy); const seekForceScale = Math.min(1.0, seekDist / (TILE_SIZE * 2)); steeringX += seekNorm.x * 1.5 * seekForceScale; steeringY += seekNorm.y * 1.5 * seekForceScale; }

        allDrones.forEach(otherDrone => { if (otherDrone !== this && otherDrone.active) { const distSq = distance(this.x, this.y, otherDrone.x, otherDrone.y)**2; if (distSq > 0 && distSq < (DRONE_SEPARATION_DISTANCE ** 2)) { const pushDx = this.x - otherDrone.x; const pushDy = this.y - otherDrone.y; const pushNorm = normalizeVector(pushDx, pushDy); const pushStrength = (DRONE_SEPARATION_DISTANCE**2 / distSq) * 1.2; steeringX += pushNorm.x * pushStrength; steeringY += pushNorm.y * pushStrength; } } });
        const distPlayerSq = distance(this.x, this.y, this.owner.x, this.owner.y)**2; if (distPlayerSq > 0 && distPlayerSq < (DRONE_FOLLOW_DISTANCE * 0.5)**2) { const pushDx = this.x - this.owner.x; const pushDy = this.y - this.owner.y; const pushNorm = normalizeVector(pushDx, pushDy); steeringX += pushNorm.x * 0.5; steeringY += pushNorm.y * 0.5; }

        const steeringNorm = normalizeVector(steeringX, steeringY);
        this.vx += steeringNorm.x * currentMaxSpeed * DRONE_ACCELERATION_FACTOR * effectiveDt;
        this.vy += steeringNorm.y * currentMaxSpeed * DRONE_ACCELERATION_FACTOR * effectiveDt;
        const dampingFactor = 1.0 - (0.15 * effectiveDt / (1/60));
        this.vx *= Math.max(0, dampingFactor); this.vy *= Math.max(0, dampingFactor);
        const currentSpeedMag = Math.sqrt(this.vx**2 + this.vy**2);
        if (currentSpeedMag > currentMaxSpeed) {
             const scale = currentMaxSpeed / currentSpeedMag;
             this.vx *= scale;
             this.vy *= scale;
        }
        this.x += this.vx * effectiveDt; this.y += this.vy * effectiveDt;

        if (this.fireCooldown > 0) this.fireCooldown -= effectiveDt * 1000; if (this.switchTargetCooldownTimer > 0) this.switchTargetCooldownTimer -= effectiveDt * 1000;

        let closestDistSq = DRONE_TARGETING_RANGE * DRONE_TARGETING_RANGE; let potentialTarget = null;
        zombies.forEach(zombie => { if (zombie.hp <= 0) return; const distSq = distance(this.x, this.y, zombie.x, zombie.y) ** 2; if (distSq < closestDistSq) { const targetTileX = Math.floor(zombie.x / TILE_SIZE); const targetTileY = Math.floor(zombie.y / TILE_SIZE); if (typeof level !== 'undefined' && level.fogGrid?.[targetTileY]?.[targetTileX] === FOG_STATE.REVEALED && hasLineOfSight(this.x, this.y, zombie.x, zombie.y, isWallFunc)) { closestDistSq = distSq; potentialTarget = zombie; } } });
        if (potentialTarget !== this.target && potentialTarget !== null) { const currentTargetDistSq = this.target ? distance(this.x, this.y, this.target.x, this.target.y)**2 : Infinity; if (!this.target || this.target.hp <= 0 || closestDistSq < currentTargetDistSq * 0.7) { this.switchTargetCooldownTimer = DRONE_SWITCH_TARGET_COOLDOWN; this.target = potentialTarget; } }
        else if (this.target && this.target.hp <= 0) { this.target = potentialTarget; } else if (!this.target){ this.target = potentialTarget; }
        if (this.target && this.fireCooldown <= 0 && this.switchTargetCooldownTimer <= 0) {
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            projectiles_ref.push(new Projectile(
                 this.x, this.y, targetAngle,
                 DRONE_PROJECTILE_DAMAGE, DRONE_PROJECTILE_SPEED,
                 0, 0,
                 DRONE_PROJECTILE_LENGTH, DRONE_PROJECTILE_WIDTH,
                 true, false, -1,
                 this, OwnerType.DRONE
             ));
            if (typeof playSound === 'function') playSound('DRONE_SHOOT', { volume: 0.3 });
            this.fireCooldown = 1000 / DRONE_FIRE_RATE;
        }
        this.previousTarget = this.target;

        // Check if drone HP is 0 and deactivate
        if (this.hp <= 0 && this.active) { // Only deactivate and play sound once
            this.active = false;
            if (typeof playSound === 'function' && !this.playedDestroySound) {
                playSound('DRONE_DESTROYED', {volume: 0.5});
                this.playedDestroySound = true;
            }
        }
    }

    draw(ctx, offsetX, offsetY) {
        if (!this.active && this.hp <=0) return;

        const ownerGridX = Math.floor(this.owner.x / TILE_SIZE);
        const ownerGridY = Math.floor(this.owner.y / TILE_SIZE);
        const selfGridX = Math.floor(this.x / TILE_SIZE);
        const selfGridY = Math.floor(this.y / TILE_SIZE);

        if (typeof level !== 'undefined' && level.fogGrid?.[ownerGridY]?.[ownerGridX] !== FOG_STATE.REVEALED && level.fogGrid?.[selfGridY]?.[selfGridX] !== FOG_STATE.REVEALED ) { return; }

        ctx.save();
        ctx.translate(this.x - offsetX, this.y - offsetY);

        const droneRadius = PLAYER_SIZE * DRONE_SIZE_MULTIPLIER;

         if (this.slowTimer > 0) {
            ctx.fillStyle = SLOW_EFFECT_COLOR;
            ctx.beginPath();
            ctx.arc(0, 0, droneRadius + 3, 0, Math.PI * 2);
            ctx.fill();
         }

         ctx.fillStyle = 'lightblue'; ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.beginPath();
         ctx.arc(0, 0, droneRadius, 0, Math.PI * 2);
         ctx.fill(); ctx.stroke();

        ctx.restore();
    }
}
// --- END OF FILE drone.js ---
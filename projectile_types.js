// --- START OF FILE projectile_types.js ---

// Assumes globals: Math, console, distance, normalizeVector, dotProduct, TILE_SIZE, FOG_STATE, window (for level, player, zombies, mercenaries, turrets, grenadeParticles, smokeParticles, playSound, temporarySpriteEffects, imgGrenadeExplosionSprite, imgRPGExplosionSprite)
// Assumes constants: All constants from constants.js are global (GRENADE_SPEED, RPG_SPEED, etc.)
// Assumes classes: GrenadeParticle, SmokeParticle, Player, Turret, TurretState, Mercenary, Zombie, Drone, createExplosion (from projectile_effects.js), TemporarySpriteEffect
// Projectile class should be defined from projectile_base.js

class Grenade {
    constructor(x, y, angle, isPlayerMarine = false) {
        this.x = x; this.y = y; this.radius = 5;
        this.initialSpeed = GRENADE_SPEED;
        this.speed = this.initialSpeed;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.fuseTimer = GRENADE_FUSE_TIME;
        this.active = true;
        this.justBounced = false;
        this.isPlayerMarine = isPlayerMarine;

        this.movementPhaseTimer = 0;
        this.slowDownTimePoint = this.isPlayerMarine ? GRENADE_SLOWDOWN_TIME_POINT_MARINE : 0.8 * 1000;
        this.stopTimePoint = this.isPlayerMarine ? GRENADE_STOP_TIME_POINT_MARINE : (0.8 + 0.3) * 1000;
        this.hasSlowedDown = false;
        this.hasStoppedMovement = false;
        this.collidedAndStopped = false;
    }

    update(effectiveDt, isWallFunc) {
        if (!this.active) return;
        this.justBounced = false;
        this.fuseTimer -= effectiveDt * 1000;

        if (this.fuseTimer <= 0) {
            this.explode(this.x, this.y);
            this.active = false;
            return;
        }

        if (!this.collidedAndStopped) {
            this.movementPhaseTimer += effectiveDt * 1000;

            if (!this.hasSlowedDown && this.movementPhaseTimer >= this.slowDownTimePoint) {
                this.speed = this.initialSpeed * 0.50;
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
                this.hasSlowedDown = true;
            }

            if (!this.hasStoppedMovement && this.movementPhaseTimer >= this.stopTimePoint) {
                this.speed = 0;
                this.vx = 0;
                this.vy = 0;
                this.hasStoppedMovement = true;
            }
        }


        if (!this.hasStoppedMovement && !this.collidedAndStopped) {
            const prevX = this.x;
            const prevY = this.y;
            let nextX = this.x + this.vx * effectiveDt;
            let nextY = this.y + this.vy * effectiveDt;
            const gridX = Math.floor(nextX / TILE_SIZE);
            const gridY = Math.floor(nextY / TILE_SIZE);
            let collisionNormal = null;

            if (isWallFunc(gridX, gridY)) {
                const prevGridX = Math.floor(prevX / TILE_SIZE);
                const prevGridY = Math.floor(prevY / TILE_SIZE);
                if (prevGridX !== gridX && !isWallFunc(prevGridX, gridY)) {
                    collisionNormal = { x: (nextX > prevX) ? -1 : 1, y: 0 };
                } else if (prevGridY !== gridY && !isWallFunc(gridX, prevGridY)) {
                    collisionNormal = { x: 0, y: (nextY > prevY) ? -1 : 1 };
                } else {
                    collisionNormal = normalizeVector(prevX - nextX, prevY - nextY);
                    if(isNaN(collisionNormal.x) || isNaN(collisionNormal.y) || (collisionNormal.x === 0 && collisionNormal.y === 0)) {
                        collisionNormal = {x: (this.vx !== 0 ? -Math.sign(this.vx) : 0), y: (this.vy !== 0 ? -Math.sign(this.vy) : (this.vx === 0 ? -1 : 0))};
                         if(collisionNormal.x === 0 && collisionNormal.y === 0) collisionNormal.y = -1;
                    }
                }
            }

            if (collisionNormal) {
                if (Math.random() < GRENADE_BOUNCE_CHANCE) {
                    this.justBounced = true;
                    const reflectFactor = 2 * dotProduct(this.vx, this.vy, collisionNormal.x, collisionNormal.y);
                    this.vx = (this.vx - reflectFactor * collisionNormal.x) * GRENADE_BOUNCE_DAMPING;
                    this.vy = (this.vy - reflectFactor * collisionNormal.y) * GRENADE_BOUNCE_DAMPING;

                    if (this.speed > 0) {
                         this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                         this.angle = Math.atan2(this.vy, this.vx);
                    } else {
                        this.angle = Math.atan2(this.vy, this.vx);
                    }
                    this.x = prevX + this.vx * effectiveDt * 0.1;
                    this.y = prevY + this.vy * effectiveDt * 0.1;
                } else {
                    this.collidedAndStopped = true;
                    this.vx = 0; this.vy = 0; this.speed = 0;
                    this.x = prevX; this.y = prevY;
                }
            } else {
                this.x = nextX;
                this.y = nextY;
            }
        }
    }

     explode(explodeX, explodeY) {
         if (typeof playSound === 'function') playSound('GRENADE_EXPLODE');
         if (typeof window.grenadeParticles !== 'undefined' && typeof GrenadeParticle !== 'undefined') {
            for (let i = 0; i < GRENADE_PARTICLE_COUNT; i++) { window.grenadeParticles.push(new GrenadeParticle(explodeX, explodeY, Math.random() * Math.PI * 2)); }
         } else { console.warn("window.grenadeParticles array or GrenadeParticle class not found for grenade explosion."); }

          const radius = RPG_EXPLOSION_RADIUS * GRENADE_EXPLOSION_RADIUS_FACTOR;
          const maxDamage = GRENADE_PARTICLE_DAMAGE * 2;
          const minDamage = GRENADE_PARTICLE_DAMAGE * 0.5;
          const radiusSq = radius * radius;

          const applyAoEDamage = (target) => {
              if (!target) return;
              let isActive = false;
              let targetRadius = PLAYER_SIZE / 2;

              const PlayerClass = typeof Player !== 'undefined' ? Player : null;
              const TurretClass = typeof Turret !== 'undefined' ? Turret : null;
              const MercenaryClass = typeof Mercenary !== 'undefined' ? Mercenary : null;
              const DroneClass = typeof Drone !== 'undefined' ? Drone : null;
              const ZombieClass = typeof Zombie !== 'undefined' ? Zombie : null;
              const TurretStateEnum = typeof TurretState !== 'undefined' ? TurretState : null;

              if (PlayerClass && target instanceof PlayerClass) { isActive = target.active; targetRadius = target.radius;}
              else if (TurretClass && TurretStateEnum && target instanceof TurretClass) { isActive = (target.state === TurretStateEnum.ACTIVE || target.state === TurretStateEnum.DEPLOYING); targetRadius = target.radius;}
              else if (MercenaryClass && target instanceof MercenaryClass) { isActive = target.active; targetRadius = target.radius; }
              else if (DroneClass && target instanceof DroneClass) { isActive = target.active; targetRadius = PLAYER_SIZE * DRONE_SIZE_MULTIPLIER / 2; }
              else if (ZombieClass && target instanceof ZombieClass) { isActive = target.hp > 0; targetRadius = target.radius; }

              if (isActive) {
                    const distSq = distance(explodeX, explodeY, target.x, target.y) ** 2;
                    if (distSq < radiusSq) {
                        const damageVal = Math.round(minDamage + (maxDamage - minDamage) * (1 - Math.sqrt(distSq) / radius));
                        if (typeof target.takeDamage === 'function') target.takeDamage(damageVal, 'explosion');
                        else if(target.hp !== undefined) {
                            target.hp -= damageVal;
                            if (target.hp <= 0) {
                                target.hp = 0;
                                if(target.active !== undefined) target.active = false;
                            }
                        }
                    }
              }
          };

          if (window.player) applyAoEDamage(window.player);
          if (window.zombies) window.zombies.forEach(applyAoEDamage);
          if (window.mercenaries) window.mercenaries.forEach(applyAoEDamage);
          if (window.turrets) window.turrets.forEach(applyAoEDamage);
          if (window.player && window.player.drones) window.player.drones.forEach(applyAoEDamage);

          if (typeof TemporarySpriteEffect !== 'undefined' && window.imgGrenadeExplosionSprite && typeof window.temporarySpriteEffects !== 'undefined') {
              window.temporarySpriteEffects.push(new TemporarySpriteEffect(
                  explodeX, explodeY,
                  window.imgGrenadeExplosionSprite,
                  70, // durationMs <<<< UPDATED to 0.07s
                  0.3, 0.6, // startScale, endScale
                  Math.random() * Math.PI * 2,
                  { width: radius * 2.2, height: radius * 2.2 }
              ));
          }
      }
     draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof window.level !== 'undefined' && window.level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED && window.level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.WALL_VISIBLE) return; ctx.fillStyle = 'black'; ctx.strokeStyle = 'darkgrey'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); if (Math.floor(this.fuseTimer / 150) % 2 === 0) { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, 2, 0, Math.PI * 2); ctx.fill(); } }
}

class RPGProjectile {
    constructor(x, y, angle) { this.x = x; this.y = y; this.radius = 4; this.speed = RPG_SPEED; this.angle = angle; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed; this.active = true; this.smokeTimer = 0; }
    update(effectiveDt, isWallFunc) {
        if (!this.active) return;
        const nextX = this.x + this.vx * effectiveDt; const nextY = this.y + this.vy * effectiveDt;
        const gridX = Math.floor(nextX / TILE_SIZE); const gridY = Math.floor(nextY / TILE_SIZE);
        let collisionPoint = null; let impactTarget = null; let impactAngle = this.angle;

        if (isWallFunc(gridX, gridY)) {
            collisionPoint = {x: this.x, y: this.y}; impactAngle = Math.atan2(-this.vy, -this.vx) + Math.PI;
            impactTarget = { type: 'wall', gridX, gridY };
        } else {
            const checkEntityCollision = (target) => {
                if (!target) return false;
                let isActive = false;
                let targetRadius = PLAYER_SIZE / 2;

                const PlayerClass = typeof Player !== 'undefined' ? Player : null;
                const TurretClass = typeof Turret !== 'undefined' ? Turret : null;
                const MercenaryClass = typeof Mercenary !== 'undefined' ? Mercenary : null;
                const DroneClass = typeof Drone !== 'undefined' ? Drone : null;
                const ZombieClass = typeof Zombie !== 'undefined' ? Zombie : null;
                const TurretStateEnum = typeof TurretState !== 'undefined' ? TurretState : null;


                if (PlayerClass && target instanceof PlayerClass) { isActive = target.active; targetRadius = target.radius;}
                else if (TurretClass && TurretStateEnum && target instanceof TurretClass) { isActive = (target.state === TurretStateEnum.ACTIVE || target.state === TurretStateEnum.DEPLOYING); targetRadius = target.radius;}
                else if (MercenaryClass && target instanceof MercenaryClass) { isActive = target.active; targetRadius = target.radius; }
                else if (DroneClass && target instanceof DroneClass) { isActive = target.active; targetRadius = PLAYER_SIZE * DRONE_SIZE_MULTIPLIER / 2; }
                else if (ZombieClass && target instanceof ZombieClass) { isActive = target.hp > 0; targetRadius = target.radius; }

                if(!isActive || (target.hp !== undefined && target.hp <= 0)) return false;

                if(distance(nextX, nextY, target.x, target.y) < this.radius + targetRadius){
                    collisionPoint = {x: this.x, y: this.y};
                    impactAngle = Math.atan2(target.y-this.y, target.x-this.x);
                    impactTarget = target;
                    return true;
                }
                return false;
            }

            const entitiesToTest = [];
            if (window.zombies) entitiesToTest.push(...window.zombies);
            if (window.mercenaries) entitiesToTest.push(...window.mercenaries);
            if (window.turrets) entitiesToTest.push(...window.turrets);
            if (window.player && window.player.drones) entitiesToTest.push(...window.player.drones);
            if (window.player) entitiesToTest.push(window.player);

            for (const entity of entitiesToTest) {
                if (checkEntityCollision(entity)) break;
            }
        }

        if (!collisionPoint && typeof window.level !== 'undefined' && (nextX < 0 || nextX > window.level.width * TILE_SIZE || nextY < 0 || nextY > window.level.height * TILE_SIZE)) {
             collisionPoint = {x: this.x, y: this.y};
             impactAngle = Math.atan2(-this.vy, -this.vx) + Math.PI;
             impactTarget = { type: 'bounds' };
        }

        if (collisionPoint){
             this.explode(collisionPoint.x, collisionPoint.y, impactAngle, impactTarget);
             this.active = false; return;
        }

        this.x = nextX; this.y = nextY;
        this.smokeTimer -= effectiveDt*1000;
        if(this.smokeTimer <= 0 && typeof window.smokeParticles !== 'undefined' && typeof SmokeParticle !== 'undefined'){
             window.smokeParticles.push(new SmokeParticle(this.x - this.vx * effectiveDt * 0.5, this.y - this.vy * effectiveDt * 0.5));
             this.smokeTimer = RPG_SMOKE_INTERVAL;
        } else if (this.smokeTimer <= 0) { console.warn("window.smokeParticles array or SmokeParticle class not found for RPG smoke.")}
    }
    explode(explodeX, explodeY, impactAngle, impactTarget) {
        if (!this.active) return;
         if (typeof createExplosion === 'function' && typeof window.player !== 'undefined' && typeof window.zombies !== 'undefined' && typeof window.mercenaries !== 'undefined' && typeof window.turrets !== 'undefined') {
             createExplosion(explodeX, explodeY, RPG_EXPLOSION_RADIUS, RPG_DAMAGE_CENTER, RPG_DAMAGE_EDGE, RPG_EXPLOSION_PARTICLE_COUNT, RPG_EXPLOSION_PARTICLE_SPEED, RPG_EXPLOSION_PARTICLE_LIFESPAN, RPG_PARTICLE_LENGTH, RPG_PARTICLE_WIDTH, 0,
                             window.player, window.zombies, window.mercenaries, window.turrets, impactAngle, impactTarget, null, 'RPG_EXPLODE', 1.0);

            if (typeof TemporarySpriteEffect !== 'undefined' && window.imgRPGExplosionSprite && typeof window.temporarySpriteEffects !== 'undefined') {
                window.temporarySpriteEffects.push(new TemporarySpriteEffect(
                    explodeX, explodeY,
                    window.imgRPGExplosionSprite,
                    120, // durationMs <<<< UPDATED
                    0.45, 1.0, // startScale, endScale
                    Math.random() * Math.PI * 2,
                    { width: RPG_EXPLOSION_RADIUS * 2.2, height: RPG_EXPLOSION_RADIUS * 2.2 }
                ));
            }

         } else {
              console.error("Cannot trigger RPG explosion: createExplosion or global entity references missing.");
         }
         this.active = false;
    }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof window.level !== 'undefined' && window.level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED && window.level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.WALL_VISIBLE) return; ctx.save(); ctx.translate(this.x - offsetX, this.y - offsetY); ctx.rotate(this.angle); ctx.fillStyle = 'grey'; ctx.fillRect(-8, -3, 16, 6); ctx.fillStyle = 'red'; ctx.fillRect(8, -2, 4, 4); ctx.restore(); }
}
// --- END OF FILE projectile_types.js ---
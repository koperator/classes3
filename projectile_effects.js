// --- START OF FILE projectile_effects.js ---

// Assumes globals: Math, console, distance, angleDiff, TILE_SIZE, FOG_STATE, window (for shockwaves, explosionParticles, flashParticles, level, player, zombies, mercenaries, turrets, playSound)
// Assumes constants: All constants from constants.js are global (RPG_EXPLOSION_RADIUS, PLAYER_SIZE, etc.)
// Assumes classes: Shockwave, ExplosionParticle, FlashParticle, Player, Turret, TurretState, Mercenary, Zombie, ZOMBIE_TYPE, Drone, GrenadeParticle (from particles.js), TILE
// Assumes destroyTile from level_render_fog.js

function createExplosion(x, y, radius, maxDamage, minDamage, particleCount, particleSpeed, particleLifespan, particleLength, particleWidth, particleDamage,
                         explPlayerRef, explZombiesRef, explMercsRef, explTurretsRef,
                         impactAngle = null, impactTarget = null, particleColors = null, soundAlias = null, soundVolume = 0.8, isBloaterMainExplosion = false) {
    const radiusSq = radius * radius;
    let bossHitAndStunned = false;

    // Only play sound for the main Bloater explosion or non-Bloater explosions
    if ((isBloaterMainExplosion || !soundAlias || !soundAlias.includes('BLOATER')) && soundAlias && typeof playSound === 'function') {
        playSound(soundAlias, { volume: soundVolume });
    } else if (soundAlias && !isBloaterMainExplosion && soundAlias.includes('BLOATER')) {
        // Mute subsequent bloater chained explosions if the main one played
    }
     else if (soundAlias) {
        // console.warn(`playSound function not available, cannot play: ${soundAlias}`);
    }


    const applyAoEDamage = (target) => {
        if (!target) return;
        let isActive = false;
        let targetRadius = typeof PLAYER_SIZE !== 'undefined' ? PLAYER_SIZE / 2 : 16;

        const PlayerClass = typeof Player !== 'undefined' ? Player : null;
        const TurretClass = typeof Turret !== 'undefined' ? Turret : null;
        const MercenaryClass = typeof Mercenary !== 'undefined' ? Mercenary : null;
        const DroneClass = typeof Drone !== 'undefined' ? Drone : null;
        const ZombieClass = typeof Zombie !== 'undefined' ? Zombie : null;
        const TurretStateEnum = typeof TurretState !== 'undefined' ? TurretState : null;
        const DroneSizeMultiplier = typeof DRONE_SIZE_MULTIPLIER !== 'undefined' ? DRONE_SIZE_MULTIPLIER : 0.3;


        if (PlayerClass && target instanceof PlayerClass) { isActive = target.active; targetRadius = target.radius;}
        else if (TurretClass && TurretStateEnum && target instanceof TurretClass) { isActive = (target.state === TurretStateEnum.ACTIVE || target.state === TurretStateEnum.DEPLOYING); targetRadius = target.radius;}
        else if (MercenaryClass && target instanceof MercenaryClass) { isActive = target.active; targetRadius = target.radius; }
        else if (DroneClass && target instanceof DroneClass) { isActive = target.active; targetRadius = (typeof PLAYER_SIZE !== 'undefined' ? PLAYER_SIZE : 32) * DroneSizeMultiplier / 2; }
        else if (ZombieClass && target instanceof ZombieClass) { isActive = target.hp > 0; targetRadius = target.radius; }

        if (isActive) {
            const distSq = distance(x, y, target.x, target.y) ** 2;
            if (distSq < radiusSq) {
                const damageVal = Math.round(minDamage + (maxDamage - minDamage) * (1 - Math.sqrt(distSq) / radius));
                let damageApplied = false;
                if (typeof target.takeDamage === 'function') { target.takeDamage(damageVal, 'explosion'); damageApplied = true; }
                else if(target.hp !== undefined) {
                    target.hp -= damageVal;
                    if (target.hp <= 0) {
                        target.hp = 0;
                        if(target.active !== undefined) target.active = false;
                    }
                    damageApplied = true;
                }

                 if (damageApplied && target === impactTarget && ZombieClass && target instanceof ZombieClass && typeof ZOMBIE_TYPE !== 'undefined' && target.type === ZOMBIE_TYPE.TYRANT && target.hp > 0) {
                     if (typeof RPG_STUN_DURATION !== 'undefined' && target.stunTimer !== undefined) {
                          target.stunTimer = Math.max(target.stunTimer || 0, RPG_STUN_DURATION);
                          bossHitAndStunned = true;
                     }
                 }
            }
        }
    };

    if (explPlayerRef) applyAoEDamage(explPlayerRef);
    if (explZombiesRef) explZombiesRef.forEach(applyAoEDamage);
    if (explMercsRef) explMercsRef.forEach(applyAoEDamage);
    if (explTurretsRef) explTurretsRef.forEach(applyAoEDamage);
    if (explPlayerRef && explPlayerRef.drones) explPlayerRef.drones.forEach(applyAoEDamage);

    // Use a larger shockwave for Bloater explosions
    let shockwaveRadius = radius * 1.5;
    if (isBloaterMainExplosion) {
        shockwaveRadius = typeof BLOATER_EXPLOSION_RADIUS !== 'undefined' ? BLOATER_EXPLOSION_RADIUS * 1.2 : radius * 1.8; // Ensure a large shockwave for Bloater
    }

    if (typeof window.shockwaves !== 'undefined' && typeof Shockwave !== 'undefined' && typeof RPG_SHOCKWAVE_LIFESPAN !== 'undefined') {
        window.shockwaves.push(new Shockwave(x, y, shockwaveRadius, RPG_SHOCKWAVE_LIFESPAN));
    } else { console.warn("window.shockwaves array, Shockwave class, or RPG_SHOCKWAVE_LIFESPAN not found for explosion effect."); }

    const baseAngle = impactAngle !== null ? impactAngle + Math.PI : Math.random() * Math.PI * 2;

    if (typeof window.explosionParticles !== 'undefined' && typeof ExplosionParticle !== 'undefined' && typeof RPG_PARTICLE_CONE_ANGLE !== 'undefined' && typeof RPG_PARTICLE_SPEED_BIAS_FACTOR !== 'undefined') {
        for (let i = 0; i < particleCount; i++) {
            const randomAngleOffset = (Math.random() - 0.5) * RPG_PARTICLE_CONE_ANGLE * (isBloaterMainExplosion ? 1.5 : 1.0); // Wider cone for bloater
            const particleAngle = baseAngle + randomAngleOffset;
            let currentSpeed = particleSpeed;
            const diffFromBase = angleDiff(baseAngle, particleAngle);
            if (Math.abs(diffFromBase) < RPG_PARTICLE_CONE_ANGLE / 2) {
                currentSpeed *= RPG_PARTICLE_SPEED_BIAS_FACTOR * (0.9 + Math.random() * 0.3);
            } else {
                currentSpeed *= (0.5 + Math.random() * 0.4);
            }
            const particle = new ExplosionParticle( x, y, particleAngle, currentSpeed, particleLifespan, particleDamage, particleLength, particleWidth );
            if (particleColors && particleColors.length > 0) {
                  particle.primaryColor = particleColors[0];
                  particle.secondaryColor = particleColors[1] || particleColors[0];
            }
            window.explosionParticles.push(particle);
        }
    } else { console.warn("window.explosionParticles array, ExplosionParticle class, or RPG constants not found."); }

    if (typeof window.flashParticles !== 'undefined' && typeof FlashParticle !== 'undefined' && typeof RPG_FLASH_PARTICLE_COUNT !== 'undefined') {
        let flashCount = RPG_FLASH_PARTICLE_COUNT;
        if (isBloaterMainExplosion) flashCount = Math.round(RPG_FLASH_PARTICLE_COUNT * 1.5); // More flashes for bloater

        for (let i = 0; i < flashCount; i++) {
            const flashAngle = Math.random() * Math.PI * 2;
            const flashSpeed = getRandomInt(RPG_FLASH_PARTICLE_SPEED_MIN, RPG_FLASH_PARTICLE_SPEED_MAX);
            const flashLifespan = getRandomInt(RPG_FLASH_PARTICLE_LIFESPAN_MIN, RPG_FLASH_PARTICLE_LIFESPAN_MAX);
            window.flashParticles.push(new FlashParticle( x, y, flashAngle, flashSpeed, flashLifespan ));
        }
    } else { console.warn("window.flashParticles array, FlashParticle class, or RPG_FLASH_PARTICLE_COUNT not found."); }

    if (typeof RPG_BLOCK_DESTRUCTION_RADIUS !== 'undefined' && RPG_BLOCK_DESTRUCTION_RADIUS > 0 &&
        typeof window.level !== 'undefined' && window.level.grid && typeof TILE_SIZE !== 'undefined' && typeof TILE !== 'undefined' &&
        typeof destroyTile === 'function') {

        const destructionRadiusWorld = RPG_BLOCK_DESTRUCTION_RADIUS * (isBloaterMainExplosion ? 1.2 : 1.0); // Bloaters might destroy slightly more
        const destructionRadiusTiles = Math.ceil(destructionRadiusWorld / TILE_SIZE);
        const explosionGridX = Math.floor(x / TILE_SIZE);
        const explosionGridY = Math.floor(y / TILE_SIZE);

        for (let dy_destroy = -destructionRadiusTiles; dy_destroy <= destructionRadiusTiles; dy_destroy++) {
            for (let dx_destroy = -destructionRadiusTiles; dx_destroy <= destructionRadiusTiles; dx_destroy++) {
                const checkGridX = explosionGridX + dx_destroy;
                const checkGridY = explosionGridY + dy_destroy;

                if (checkGridX >= 0 && checkGridX < window.level.width && checkGridY >= 0 && checkGridY < window.level.height) {
                    const tileCenterX = checkGridX * TILE_SIZE + TILE_SIZE / 2;
                    const tileCenterY = checkGridY * TILE_SIZE + TILE_SIZE / 2;
                    const distToTileCenterSq = (tileCenterX - x) ** 2 + (tileCenterY - y) ** 2;

                    if (distToTileCenterSq <= destructionRadiusWorld ** 2) {
                        const tileType = window.level.grid[checkGridY]?.[checkGridX];
                        if (tileType === TILE.WALL || tileType === TILE.OBSTACLE) {
                            destroyTile(checkGridX, checkGridY);
                        }
                    }
                }
            }
        }
    }
}
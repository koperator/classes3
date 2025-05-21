// Assumes globals: Math, console, distance, normalizeVector, getRandomElement, hasLineOfSight, TILE_SIZE, FOG_STATE, kills, level, isWall, performance, PF, ZOMBIE_SIZE, Player, Mercenary, Drone, TurretState, OwnerType, Projectile, createExplosion, Shockwave, gameTimeScale, window (for player, zombies, mercenaries, turrets, frameCount, playSound), ZOMBIE_BASE_RADIUS, zombieSprites (from zombie_sprites.js)
// Assumes constants: All constants from constants.js (e.g., ZOMBIE_TYPE, TANK_*, etc.)
// Assumes classes: TurretState

class Zombie {
    constructor(x, y, type = ZOMBIE_TYPE.REGULAR) {
        this.x = x; this.y = y; this.type = type; this.stunTimer = 0;
        this.isMoving = false;
        this.radius = ZOMBIE_BASE_RADIUS * ZOMBIE_REGULAR_RADIUS_MULT;
        this.id = Math.random(); // For pathfinding staggering

        this.attackRange = 0;
        this.attackCooldown = ZOMBIE_ATTACK_COOLDOWN;
        this.lastAttackTime = performance.now() - Math.random() * this.attackCooldown;
        this.isAttacking = false;
        this.currentTarget = null;
        this.path = [];
        this.pathCooldown = 0.45 + Math.random() * 0.2;
        this.pathTimer = Math.random() * this.pathCooldown;
        this.targetNodeIndex = 0;
        this.lastPathTargetPos = {x:0, y:0};
        this.failedPathAttempts = 0;
        this.lastPathRequestTime = 0;

        this.projectileSpeed = 0; this.projectileDamage = 0; this.projectileColor = 'red';
        this.projectileRadius = 3; this.projectileLifespan = 1.0;
        this.explosionOnDeath = false; this.explosionRadius = 0;
        this.explosionDamageMax = 0; this.explosionDamageMin = 0;
        this.aoeDebuff = false; this.aoeRange = 0; this.aoeDuration = 0; this.aoeSlowFactor = 1.0;
        this.isCasting = false; this.castTimer = 0; this.castDuration = 0;
        this.isHiveMaster = false; this.internalSpawnTimer = 0; this.internalSpawnInterval = HIVE_MASTER_INTERNAL_SPAWN_INTERVAL;
        this.activeDroneCount = 0;

        switch (type) {
            case ZOMBIE_TYPE.TANK:
                this.speed = TANK_SPEED; this.hp = TANK_HP; this.color = TANK_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * TANK_RADIUS_MULT;
                this.attackDamageMin = TANK_DMG; this.attackDamageMax = TANK_DMG;
                break;
            case ZOMBIE_TYPE.TYRANT:
                this.speed = TYRANT_SPEED; this.hp = TYRANT_HP; this.color = TYRANT_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * TYRANT_RADIUS_MULT;
                this.attackDamageMin = TYRANT_DMG; this.attackDamageMax = TYRANT_DMG;
                break;
            case ZOMBIE_TYPE.RUNNER:
                this.speed = RUNNER_SPEED; this.hp = RUNNER_HP; this.color = RUNNER_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * RUNNER_RADIUS_MULT;
                this.attackDamageMin = RUNNER_DMG; this.attackDamageMax = RUNNER_DMG;
                break;
            case ZOMBIE_TYPE.SPITTER:
                this.speed = SPITTER_SPEED; this.hp = SPITTER_HP; this.color = SPITTER_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * SPITTER_RADIUS_MULT;
                this.attackRange = SPITTER_ATTACK_RANGE; this.attackCooldown = SPITTER_ATTACK_COOLDOWN;
                this.projectileSpeed = SPITTER_PROJECTILE_SPEED; this.projectileDamage = SPITTER_PROJECTILE_DAMAGE;
                this.projectileColor = SPITTER_PROJECTILE_COLOR; this.projectileRadius = SPITTER_PROJECTILE_RADIUS; this.projectileLifespan = SPITTER_PROJECTILE_LIFESPAN;
                this.attackDamageMin = 0; this.attackDamageMax = 0;
                break;
            case ZOMBIE_TYPE.BLOATER:
                this.speed = BLOATER_SPEED; this.hp = BLOATER_HP; this.color = BLOATER_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * BLOATER_RADIUS_MULT;
                this.explosionOnDeath = true; this.explosionRadius = BLOATER_EXPLOSION_RADIUS;
                this.explosionDamageMax = BLOATER_EXPLOSION_DAMAGE_MAX; this.explosionDamageMin = BLOATER_EXPLOSION_DAMAGE_MIN;
                this.attackDamageMin = 0; this.attackDamageMax = 0;
                break;
             case ZOMBIE_TYPE.SCREAMER:
                this.speed = SCREAMER_SPEED; this.hp = SCREAMER_HP; this.color = SCREAMER_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * SCREAMER_RADIUS_MULT;
                this.attackRange = SCREAMER_ABILITY_RANGE; this.attackCooldown = SCREAMER_ABILITY_COOLDOWN; this.aoeDebuff = true; this.aoeRange = SCREAMER_ABILITY_RANGE;
                this.aoeDuration = SCREAMER_ABILITY_DURATION; this.aoeSlowFactor = SCREAMER_SLOW_FACTOR;
                this.castDuration = SCREAMER_CAST_TIME;
                this.attackDamageMin = 0; this.attackDamageMax = 0;
                break;
            case ZOMBIE_TYPE.HIVE_MASTER:
                this.speed = HIVE_MASTER_SPEED; this.hp = HIVE_MASTER_HP; this.color = HIVE_MASTER_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * HIVE_MASTER_RADIUS_MULT;
                this.isHiveMaster = true;
                this.internalSpawnTimer = Math.random() * this.internalSpawnInterval;
                this.attackDamageMin = 0; this.attackDamageMax = 0;
                this.attackRange = 0; this.attackCooldown = Infinity;
                break;
            case ZOMBIE_TYPE.DRONE:
                this.speed = ZOMBIE_DRONE_SPEED; this.hp = ZOMBIE_DRONE_HP; this.color = ZOMBIE_DRONE_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * ZOMBIE_DRONE_RADIUS_MULT;
                this.attackDamageMin = ZOMBIE_DRONE_DMG; this.attackDamageMax = ZOMBIE_DRONE_DMG;
                break;
            case ZOMBIE_TYPE.HEAVY:
                this.speed = getRandomElement(ZOMBIE_REGULAR_SPEED_TIERS) * 0.9;
                this.hp = HEAVY_ZOMBIE_HP;
                this.color = HEAVY_ZOMBIE_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * HEAVY_ZOMBIE_RADIUS_MULT;
                this.attackDamageMin = Math.round(ZOMBIE_REGULAR_ATTACK_DAMAGE_MIN * 1.5);
                this.attackDamageMax = Math.round(ZOMBIE_REGULAR_ATTACK_DAMAGE_MAX * 1.5);
                break;
            case ZOMBIE_TYPE.REGULAR:
            default:
                this.speed = getRandomElement(ZOMBIE_REGULAR_SPEED_TIERS); this.hp = getRandomElement(ZOMBIE_REGULAR_HP_TIERS); this.color = ZOMBIE_REGULAR_COLOR;
                this.radius = ZOMBIE_BASE_RADIUS * ZOMBIE_REGULAR_RADIUS_MULT;
                this.attackDamageMin = ZOMBIE_REGULAR_ATTACK_DAMAGE_MIN; this.attackDamageMax = ZOMBIE_REGULAR_ATTACK_DAMAGE_MAX;
                break;
        }
        this.maxHp = this.hp;
    }

    spawnDroneZombie(zombies_ref) {
        if (!zombies_ref) return;
         if (zombies_ref.length >= MAX_ZOMBIES * 0.95) {
             this.internalSpawnTimer = this.internalSpawnInterval;
             return;
         }
        if (this.activeDroneCount >= HIVE_MASTER_MAX_ACTIVE_DRONES) return;

        const spawnOffset = this.radius * 1.2;
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnX = this.x + Math.cos(spawnAngle) * spawnOffset;
        const spawnY = this.y + Math.sin(spawnAngle) * spawnOffset;
        const newDrone = new Zombie(spawnX, spawnY, ZOMBIE_TYPE.DRONE);
        newDrone.hiveParent = this;
        zombies_ref.push(newDrone);
        this.activeDroneCount++;
    }

    update(effectiveDt, player, mercenaries_ref, turrets_ref, pathfinderGrid, finder, isWallFunc, zombies, projectiles_ref, shockwaves_ref) {
        if(this.hp <= 0) return;
        const now = performance.now();

        if (this.stunTimer > 0) {
            this.stunTimer -= effectiveDt * 1000;
            this.isAttacking = false; this.isMoving = false; this.isCasting = false; this.castTimer = 0;
            return;
        }
        if (this.isCasting) {
            this.castTimer -= effectiveDt * 1000;
            if (this.castTimer <= 0) {
                this.finishCast(player, mercenaries_ref, turrets_ref, shockwaves_ref);
                this.isCasting = false; this.lastAttackTime = now;
            } else {
                this.isMoving = false; return;
            }
        }
        if (this.isHiveMaster) {
            this.internalSpawnTimer -= effectiveDt * 1000;
            if (this.internalSpawnTimer <= 0) {
                this.spawnDroneZombie(zombies);
                this.internalSpawnTimer = this.internalSpawnInterval;
            }
        }

        let currentTargetForMovement = null;
        if (!this.isHiveMaster) {
            let potentialTargets = [];
            if (player && player.active && player.hp > 0) potentialTargets.push({ target: player, priority: ZOMBIE_TARGET_PRIORITY.PLAYER, distSq: distance(this.x, this.y, player.x, player.y) ** 2 });
            mercenaries_ref.forEach(merc => { if (merc.active && merc.hp > 0) potentialTargets.push({ target: merc, priority: ZOMBIE_TARGET_PRIORITY.MERCENARY, distSq: distance(this.x, this.y, merc.x, merc.y) ** 2 }); });
            turrets_ref.forEach(turret => { if (turret.state === TurretState.ACTIVE && turret.hp > 0) potentialTargets.push({ target: turret, priority: ZOMBIE_TARGET_PRIORITY.TURRET, distSq: distance(this.x, this.y, turret.x, turret.y) ** 2 }); });
            if(player && player.drones && player.drones.length > 0) player.drones.forEach(drone => { if(drone.active && drone.hp > 0) potentialTargets.push({ target: drone, priority: ZOMBIE_TARGET_PRIORITY.DRONE, distSq: distance(this.x, this.y, drone.x, drone.y) ** 2 }); });

            let bestTarget = null; let highestPriority = -1; let minBestDistSq = Infinity;
            potentialTargets.forEach(pt => {
                if (pt.target && (pt.target.active !== false) && (pt.target.hp === undefined || pt.target.hp > 0) ) {
                    if (pt.priority > highestPriority) {
                         highestPriority = pt.priority; minBestDistSq = pt.distSq; bestTarget = pt.target;
                    } else if (pt.priority === highestPriority && pt.distSq < minBestDistSq) {
                        minBestDistSq = pt.distSq; bestTarget = pt.target;
                    }
                }
            });
            this.currentTarget = bestTarget;
            currentTargetForMovement = this.currentTarget;
        } else {
             if (player && player.active && player.hp > 0 && distance(this.x, this.y, player.x, player.y) < TILE_SIZE * 25) {
                 currentTargetForMovement = player;
             }
        }

        this.pathTimer += effectiveDt;
        const canPathfindThisFrame = (Math.floor(this.id * 100) % 3 === (window.frameCount || 0) % 3);

        let needsNewPath = false;
        if (this.path.length === 0 || this.targetNodeIndex >= this.path.length || this.failedPathAttempts > 1) {
            needsNewPath = true;
        } else if (currentTargetForMovement) {
            const lastNodeInPath = this.path[this.path.length - 1];
            const pathEndGoalDist = distance(lastNodeInPath[0] * TILE_SIZE + TILE_SIZE / 2, lastNodeInPath[1] * TILE_SIZE + TILE_SIZE / 2, currentTargetForMovement.x, currentTargetForMovement.y);
            if (pathEndGoalDist > TILE_SIZE * 2.5) {
                needsNewPath = true;
            }
            if (Math.abs(currentTargetForMovement.x - this.lastPathTargetPos.x) > TILE_SIZE || Math.abs(currentTargetForMovement.y - this.lastPathTargetPos.y) > TILE_SIZE) {
                 needsNewPath = true;
            }
        }


        if (canPathfindThisFrame && this.pathTimer >= this.pathCooldown && currentTargetForMovement && pathfinderGrid && finder && needsNewPath && (now - this.lastPathRequestTime > 250)) {
            this.pathTimer = 0;
            this.lastPathRequestTime = now;
            const startX = Math.floor(this.x / TILE_SIZE); const startY = Math.floor(this.y / TILE_SIZE);
            const endX = Math.floor(currentTargetForMovement.x / TILE_SIZE); const endY = Math.floor(currentTargetForMovement.y / TILE_SIZE);

            if (!isWallFunc(startX, startY) && !isWallFunc(endX, endY) && (startX !== endX || startY !== endY)) {
                if (pathfinderGrid) {
                    try {
                        this.path = finder.findPath(startX, startY, endX, endY, pathfinderGrid);
                        this.targetNodeIndex = 0;
                        this.lastPathTargetPos.x = currentTargetForMovement.x;
                        this.lastPathTargetPos.y = currentTargetForMovement.y;
                        if (this.path.length > 0) {
                            this.failedPathAttempts = 0;
                        } else {
                            this.failedPathAttempts++;
                        }
                    } catch (e) { this.path = []; this.failedPathAttempts++; }
                } else { this.path = []; this.failedPathAttempts++;}
            } else { this.path = []; this.failedPathAttempts++;}
        }

        let targetX = currentTargetForMovement ? currentTargetForMovement.x : this.x;
        let targetY = currentTargetForMovement ? currentTargetForMovement.y : this.y;
        let headingToPathNode = false;

        if (this.path.length > 0 && this.targetNodeIndex < this.path.length) {
            const targetNode = this.path[this.targetNodeIndex];
            const nodeCenterX = targetNode[0] * TILE_SIZE + TILE_SIZE / 2;
            const nodeCenterY = targetNode[1] * TILE_SIZE + TILE_SIZE / 2;
            if (distance(this.x, this.y, nodeCenterX, nodeCenterY) < TILE_SIZE * 0.6) {
                this.targetNodeIndex++;
                if (this.targetNodeIndex >= this.path.length) {
                    this.path = [];
                    if(currentTargetForMovement) { targetX = currentTargetForMovement.x; targetY = currentTargetForMovement.y; }
                    headingToPathNode = false;
                } else {
                    const nextNode = this.path[this.targetNodeIndex]; targetX = nextNode[0] * TILE_SIZE + TILE_SIZE / 2; targetY = nextNode[1] * TILE_SIZE + TILE_SIZE / 2; headingToPathNode = true;
                }
            } else {
                 targetX = nodeCenterX; targetY = nodeCenterY; headingToPathNode = true;
            }
        } else if(currentTargetForMovement) {
            targetX = currentTargetForMovement.x; targetY = currentTargetForMovement.y; headingToPathNode = false;
        }


        const dx = targetX - this.x; const dy = targetY - this.y;
        const distToFinalTargetSq = currentTargetForMovement ? (this.x - currentTargetForMovement.x)**2 + (this.y - currentTargetForMovement.y)**2 : Infinity;
        let targetRadiusForAttack = PLAYER_SIZE / 2;
        if (this.currentTarget) {
             if (this.currentTarget.radius) targetRadiusForAttack = this.currentTarget.radius;
             else if (this.currentTarget instanceof Drone) targetRadiusForAttack = PLAYER_SIZE * DRONE_SIZE_MULTIPLIER / 2;
        }
        const attackTriggerDistSq = this.attackRange > 0 ? (this.attackRange + this.radius + targetRadiusForAttack)**2 : (this.radius + targetRadiusForAttack + TILE_SIZE * 0.2)**2;

        let moveX = 0; let moveY = 0; this.isMoving = false;
        let shouldTryMoving = false;
        if (this.isHiveMaster && currentTargetForMovement) {
            shouldTryMoving = true;
        } else if (this.type === ZOMBIE_TYPE.BLOATER || this.type === ZOMBIE_TYPE.RUNNER) {
            shouldTryMoving = !!currentTargetForMovement;
        } else if (this.attackRange > 0) {
            shouldTryMoving = distToFinalTargetSq > attackTriggerDistSq && !!currentTargetForMovement;
        } else {
            shouldTryMoving = distToFinalTargetSq > (this.radius + targetRadiusForAttack - TILE_SIZE * 0.1)**2 && !!currentTargetForMovement;
        }


        if (shouldTryMoving && (dx !== 0 || dy !== 0)) {
            if (Math.sqrt(dx*dx + dy*dy) > this.radius * 0.1) {
                const moveNorm = normalizeVector(dx, dy); moveX = moveNorm.x * this.speed * effectiveDt; moveY = moveNorm.y * this.speed * effectiveDt; this.isMoving = true;
            }
        }


        zombies.forEach(other => {
            if (other !== this && other.hp > 0) {
                const distOther = distance(this.x, this.y, other.x, other.y); const minDist = this.radius + other.radius;
                if (distOther > 0.1 && distOther < minDist * 1.1) {
                    const pushDx = this.x - other.x; const pushDy = this.y - other.y; const pushMag = Math.sqrt(pushDx*pushDx + pushDy*pushDy);
                    if (pushMag > 0.001) {
                        const overlap = minDist - distOther; const pushForceFactor = (overlap / minDist) * 0.5 * (minDist / distOther); const separationForce = this.speed * effectiveDt * pushForceFactor * 1.5;
                        moveX += (pushDx / pushMag) * separationForce; moveY += (pushDy / pushMag) * separationForce;
                         if (Math.abs(pushDx / pushMag * separationForce) > 0.01 || Math.abs(pushDy / pushMag * separationForce) > 0.01) this.isMoving = true;
                    }
                }
            }
        });

        if (this.isMoving) {
             const finalMoveMag = Math.sqrt(moveX * moveX + moveY * moveY); const intendedSpeedThisFrame = this.speed * effectiveDt;
             if (finalMoveMag > intendedSpeedThisFrame * 1.05) {
                 const scale = intendedSpeedThisFrame / finalMoveMag; moveX *= scale; moveY *= scale;
             }
            let nextX = this.x + moveX; let nextY = this.y + moveY;

            if (!isWallFunc(Math.floor(nextX / TILE_SIZE), Math.floor(this.y / TILE_SIZE))) { this.x = nextX; }
            if (!isWallFunc(Math.floor(this.x / TILE_SIZE), Math.floor(nextY / TILE_SIZE))) { this.y = nextY; }
        }


        this.isAttacking = false;
        if (!this.isHiveMaster && this.currentTarget && this.currentTarget.hp > 0 && (this.currentTarget.active !== false || (this.currentTarget.state && this.currentTarget.state === TurretState.ACTIVE) || this.currentTarget instanceof Drone) ) {
            const canAttack = (now - this.lastAttackTime >= this.attackCooldown);
            if (canAttack) {
                if (this.attackRange > 0) {
                    if (distToFinalTargetSq <= attackTriggerDistSq) {
                        if (this.type === ZOMBIE_TYPE.SPITTER) {
                            if (hasLineOfSight(this.x, this.y, this.currentTarget.x, this.currentTarget.y, isWallFunc)) {
                                this.fireProjectile(projectiles_ref); this.lastAttackTime = now; this.isAttacking = true;
                            }
                        } else if (this.type === ZOMBIE_TYPE.SCREAMER && !this.isCasting) {
                             let validTargetInRange = false;
                             const checkTargets = [player, ...mercenaries_ref]; if (player && player.drones) checkTargets.push(...player.drones);
                             for (const target of checkTargets) {
                                 if (target && (target.active || target === player) && (target.hp === undefined || target.hp > 0)) {
                                     if (distance(this.x, this.y, target.x, target.y) < this.aoeRange) { validTargetInRange = true; break; }
                                 }
                             }
                            if(validTargetInRange) this.startCast();
                        }
                    }
                } else {
                    if (distToFinalTargetSq <= attackTriggerDistSq) {
                         if (hasLineOfSight(this.x, this.y, this.currentTarget.x, this.currentTarget.y, isWallFunc, null, 0.8)) {
                             let damageApplied = false; const damage = getRandomInt(this.attackDamageMin, this.attackDamageMax);
                             if (typeof this.currentTarget.takeDamage === 'function') { this.currentTarget.takeDamage(damage, 'zombie_melee'); damageApplied = true; }
                             else if (this.currentTarget instanceof Drone && this.currentTarget.hp !== undefined) { this.currentTarget.hp -= damage; if(this.currentTarget.hp <= 0) { this.currentTarget.hp = 0; this.currentTarget.active = false; } damageApplied = true; }
                             if (damageApplied) { this.lastAttackTime = now; this.isAttacking = true; }
                         }
                    }
                }
            }
        }
    }

    fireProjectile(projectiles_ref) {
        if (!this.currentTarget) return;
        if (typeof playSound === 'function') playSound('SPITTER_SPIT', {volume: 0.6});
        const targetAngle = Math.atan2(this.currentTarget.y - this.y, this.currentTarget.x - this.x);
        const accuracy = this.isMoving ? SPITTER_PROJECTILE_MOVING_ACCURACY : SPITTER_PROJECTILE_STATIONARY_ACCURACY;
        const finalAngle = targetAngle + (Math.random() - 0.5) * accuracy;
        projectiles_ref.push(new Projectile(this.x, this.y, finalAngle, this.projectileDamage, this.projectileSpeed, 0, 0, this.projectileRadius * 2, this.projectileRadius * 1.5, false, false, -1, this, OwnerType.ENEMY));
    }

    startCast() {
        if (!this.isCasting && this.type === ZOMBIE_TYPE.SCREAMER) {
            this.isCasting = true; this.castTimer = this.castDuration;
        }
    }

    finishCast(player, mercenaries_ref, turrets_ref, shockwaves_ref) {
        if (this.type === ZOMBIE_TYPE.SCREAMER) {
            if (typeof playSound === 'function') playSound('SCREAMER_SCREAM', {volume: 0.9});
            shockwaves_ref.push(new Shockwave(this.x, this.y, this.aoeRange, 300));
            const targets = [player, ...mercenaries_ref]; if (player && player.drones) targets.push(...player.drones);
            targets.forEach(target => {
                 if (target && (target.active || target === player) && (target.hp === undefined || target.hp > 0)) {
                    if (distance(this.x, this.y, target.x, target.y) < this.aoeRange) {
                         if(typeof target.applySlow === 'function') target.applySlow(this.aoeDuration, this.aoeSlowFactor);
                    }
                 }
            });
        }
    }

    takeDamage(amount, sourceType = 'unknown', stunDuration = null) {
        if (this.hp <= 0) return; this.hp -= amount; let wasKilled = false;
        if (this.hp <= 0) {
            this.hp = 0; kills++; wasKilled = true;
            if (this.type === ZOMBIE_TYPE.DRONE && this.hiveParent && this.hiveParent.hp > 0) {
                this.hiveParent.activeDroneCount = Math.max(0, this.hiveParent.activeDroneCount - 1);
            }
        }
        let calculatedStun = 0;
        if (stunDuration !== null) calculatedStun = stunDuration;
        else if (sourceType === 'explosion' && (this.type === ZOMBIE_TYPE.TYRANT || this.type === ZOMBIE_TYPE.HIVE_MASTER)) { if (typeof RPG_STUN_DURATION !== 'undefined') calculatedStun = RPG_STUN_DURATION; }
        else if (sourceType === 'psi_blast') { if (typeof PSI_BLAST_MAX_STUN_DURATION !== 'undefined') calculatedStun = PSI_BLAST_MAX_STUN_DURATION; }
        if (calculatedStun > 0) { this.stunTimer = Math.max(this.stunTimer || 0, calculatedStun); this.isCasting = false; this.castTimer = 0; }

        if (wasKilled && this.explosionOnDeath) {
             if (typeof createExplosion === 'function') {
                 if (typeof window.player !== 'undefined' && typeof window.zombies !== 'undefined' && typeof window.mercenaries !== 'undefined' && typeof window.turrets !== 'undefined') {
                    // Main Bloater Explosion
                    createExplosion(
                        this.x, this.y, this.explosionRadius,
                        this.explosionDamageMax, this.explosionDamageMin,
                        BLOATER_EXPLOSION_PARTICLE_COUNT, BLOATER_EXPLOSION_PARTICLE_SPEED,
                        BLOATER_EXPLOSION_PARTICLE_LIFESPAN, BLOATER_EXPLOSION_PARTICLE_LENGTH,
                        BLOATER_EXPLOSION_PARTICLE_WIDTH, BLOATER_EXPLOSION_PARTICLE_DAMAGE,
                        window.player, window.zombies, window.mercenaries, window.turrets,
                        null, null,
                        [BLOATER_EXPLOSION_COLOR_PRIMARY, BLOATER_EXPLOSION_COLOR_SECONDARY],
                        'BLOATER_EXPLODE', 1.0, true // isBloaterMainExplosion = true
                    );
                    // Second, slightly offset and smaller explosion for "vaster" effect
                    const offsetX = (Math.random() - 0.5) * TILE_SIZE * 1.5;
                    const offsetY = (Math.random() - 0.5) * TILE_SIZE * 1.5;
                    createExplosion(
                        this.x + offsetX, this.y + offsetY, this.explosionRadius * 0.7,
                        this.explosionDamageMax * 0.5, this.explosionDamageMin * 0.5, // Reduced damage for secondary
                        Math.round(BLOATER_EXPLOSION_PARTICLE_COUNT * 0.6), BLOATER_EXPLOSION_PARTICLE_SPEED * 0.8,
                        BLOATER_EXPLOSION_PARTICLE_LIFESPAN * 0.8, BLOATER_EXPLOSION_PARTICLE_LENGTH,
                        BLOATER_EXPLOSION_PARTICLE_WIDTH, BLOATER_EXPLOSION_PARTICLE_DAMAGE * 0.5,
                        window.player, window.zombies, window.mercenaries, window.turrets,
                        null, null,
                        [BLOATER_EXPLOSION_COLOR_PRIMARY, BLOATER_EXPLOSION_COLOR_SECONDARY],
                        'BLOATER_EXPLODE', 0.0, false // Mute this one, isBloaterMainExplosion = false
                    );

                 } else { console.error("Cannot trigger Bloater explosion: Global window references (player, zombies, etc.) missing."); }
             } else { console.error("createExplosion function not found for Bloater death."); }
        }
    }

    draw(ctx, offsetX, offsetY, playerRef = null) {
        if (this.hp <= 0) return;

        const gridX = Math.floor(this.x / TILE_SIZE);
        const gridY = Math.floor(this.y / TILE_SIZE);
        let isTileNormallyVisible = typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] === FOG_STATE.REVEALED;

        let isXRayVisible = false;
        if (!isTileNormallyVisible && playerRef && playerRef.isPsion && playerRef.active &&
            playerRef.passiveType && playerRef.passiveType.includes('xray_enhanced')) {
            if (typeof PSION_XRAY_RANGE !== 'undefined') {
                const currentXRayRange = PSION_XRAY_RANGE + (playerRef.xrayRangeBonus || 0);
                const distToPlayer = distance(this.x, this.y, playerRef.x, playerRef.y);
                if (distToPlayer <= currentXRayRange) {
                    isXRayVisible = true;
                }
            }
        }


        if (isTileNormallyVisible || isXRayVisible) {
            const isStunned = this.stunTimer > 0;
            let drawColor = this.color;
            let currentAlpha = 1.0;
            let drawOutlineForCircle = false;

            const sprite = zombieSprites[String(this.type)];
            const ZOMBIE_SPRITE_DRAW_RADIUS_MULTIPLIER = 2.5;
            const spriteDrawSize = this.radius * ZOMBIE_SPRITE_DRAW_RADIUS_MULTIPLIER;

            if (sprite && sprite.complete && sprite.naturalHeight !== 0) {
                ctx.save();
                if (isXRayVisible && !isTileNormallyVisible) ctx.globalAlpha = 0.85;
                const spriteDrawX = this.x - offsetX - spriteDrawSize / 2;
                const spriteDrawY = this.y - offsetY - spriteDrawSize / 2;
                ctx.drawImage(sprite, spriteDrawX, spriteDrawY, spriteDrawSize, spriteDrawSize);
                if (isXRayVisible && !isTileNormallyVisible) {
                    ctx.strokeStyle = 'rgba(255, 150, 150, 0.9)';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(spriteDrawX, spriteDrawY, spriteDrawSize, spriteDrawSize);
                }
                ctx.restore();
            } else {
                if (isXRayVisible && !isTileNormallyVisible) {
                    drawColor = 'rgba(255, 20, 20, 0.85)'; currentAlpha = 0.85; drawOutlineForCircle = true;
                } else if (isStunned) {
                    drawColor = 'lightblue';
                } else if (this.isAttacking && !this.isHiveMaster) {
                     if (this.type === ZOMBIE_TYPE.SPITTER) drawColor = 'purple';
                     else if (this.type === ZOMBIE_TYPE.SCREAMER) drawColor = 'pink';
                     else drawColor = 'orange';
                } else if (this.isCasting) {
                    drawColor = 'pink'; currentAlpha = 0.7 + Math.sin(performance.now() * 0.01) * 0.3;
                }
                ctx.save();
                ctx.globalAlpha = currentAlpha; ctx.fillStyle = drawColor;
                ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, this.radius, 0, Math.PI * 2); ctx.fill();
                if (this.isHiveMaster && isTileNormallyVisible) {
                    const pulseFactor = 0.8 + Math.sin(performance.now() * 0.005) * 0.2;
                    ctx.fillStyle = 'rgba(255, 255, 150, 0.7)'; ctx.beginPath();
                    ctx.arc(this.x - offsetX, this.y - offsetY, this.radius * 0.5 * pulseFactor, 0, Math.PI * 2); ctx.fill();
                }
                if (drawOutlineForCircle) {
                    ctx.strokeStyle = 'rgba(255, 150, 150, 0.9)'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, this.radius, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.restore();
            }

            ctx.save(); ctx.globalAlpha = 1.0;
            if (isTileNormallyVisible && isStunned) {
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
                const stunArcRadius = this.radius + 3;
                ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, stunArcRadius, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
                ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, stunArcRadius, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
            }
            if (isTileNormallyVisible && this.isCasting) {
                 const castProgress = 1 - (this.castTimer / this.castDuration);
                 const ringRadius = this.radius + 5 + castProgress * 15;
                 const ringAlpha = 0.2 + castProgress * 0.6;
                 ctx.strokeStyle = `rgba(255, 100, 150, ${ringAlpha})`;
                 ctx.lineWidth = 2 + castProgress * 3;
                 ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, ringRadius, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();

            if (isTileNormallyVisible) {
                const showHealthBarForType = this.type === ZOMBIE_TYPE.TYRANT || this.type === ZOMBIE_TYPE.TANK ||
                                           this.type === ZOMBIE_TYPE.SPITTER || this.type === ZOMBIE_TYPE.BLOATER ||
                                           this.type === ZOMBIE_TYPE.SCREAMER || this.type === ZOMBIE_TYPE.HIVE_MASTER;
                                           // <<<< HEAVY ZOMBIE does NOT show health bar by default
                if (showHealthBarForType) {
                    const barWidth = this.radius * 1.5;
                    const barHeight = (this.type === ZOMBIE_TYPE.TYRANT || this.type === ZOMBIE_TYPE.HIVE_MASTER) ? 6 : 4;
                    const barX = this.x - offsetX - barWidth / 2;
                    let topOfEntityVisualY;
                    if (sprite && sprite.complete && sprite.naturalHeight !== 0) topOfEntityVisualY = this.y - offsetY - spriteDrawSize / 2;
                    else topOfEntityVisualY = this.y - offsetY - this.radius;
                    const barY = topOfEntityVisualY - barHeight - 4;
                    const hpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
                    ctx.fillStyle = '#555'; ctx.fillRect(barX, barY, barWidth, barHeight);
                    ctx.fillStyle = hpRatio > 0.5 ? 'lime' : (hpRatio > 0.2 ? 'yellow' : 'red');
                    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
                    ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, barHeight);
                }
            }
        }
    }
}
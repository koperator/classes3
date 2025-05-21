// --- START OF FILE player_core.js ---

// Assumes globals: Math, console, performance, distance, normalizeVector, TILE_SIZE, canvas, camera, gameTimeScale, gameOver, afterimages, weapons, classes, TILE, level, checkWallCollision, window (for gameTimeScale, afterimages, gameOver, powerups, audio, powerupDisplayMessages, playSound, mercenaries, turrets, frameCount)
// Assumes constants: All constants from constants.js are global (PLAYER_SIZE, BASE_PLAYER_SPEED_WALK, CLASS_ID, PSION_SHIELD_HP, etc.)
// Assumes classes: Drone, Turret, TurretState, Afterimage, Mercenary
// Player.prototype methods for combat and abilities are in separate files.

class Player {
    constructor(x, y, classData) {
        this.x = x; this.y = y; this.radius = PLAYER_SIZE / 2;
        this.classData = classData;
        this.hp = classData.hp; this.maxHp = classData.hp;
        this.speedMultiplier = classData.speedMultiplier;
        this.speedMultiplierBase = 1.0;
        this.recalculateSpeeds();

        this.angle = 0; this.vx = 0; this.vy = 0; this.isMoving = false; this.isRunning = false;
        this.currentWeaponIndex = weapons.findIndex(w => w.id === classData.weaponId); if (this.currentWeaponIndex === -1) { this.currentWeaponIndex = 0; }
        this.currentWeapon = weapons[this.currentWeaponIndex]; this.ammo = this.currentWeapon.magSize; this.reloading = false; this.reloadTimer = 0; this.fireTimer = 0;
        this.spread = this.currentWeapon.spreadStand; this.abilityType = classData.ability.type; this.abilityCooldown = classData.ability.cooldown || 0;
        this.abilityUsesTotal = classData.ability.uses !== undefined ? classData.ability.uses : Infinity; this.abilityUsesLeft = this.abilityUsesTotal; this.abilityDuration = classData.ability.duration || 0;
        this.isDashing = false; this.dashTimer = 0;
        this.isBulletTimeActive = false; this.bulletTimeTimer = 0;
        this.passiveType = classData.passive ? classData.passive.type : null;
        this.active = true; this.isInvincible = false; this.lastAfterimageTime = 0;

        this.isPsion = (this.classData.id === CLASS_ID.PSION);
        this.isRecon = (this.classData.id === CLASS_ID.RECON);
        this.isEngineer = (this.classData.id === CLASS_ID.ENGINEER);
        this.isMarine = (this.classData.id === CLASS_ID.MARINE);
        this.isBrawler = (this.classData.id === CLASS_ID.BRAWLER);
        this.isDevastator = (this.classData.id === CLASS_ID.DEVASTATOR);

        this.shieldHp = this.isPsion && typeof PSION_SHIELD_HP !== 'undefined' ? PSION_SHIELD_HP : 0;
        this.maxShieldHp = this.isPsion && typeof PSION_SHIELD_HP !== 'undefined' ? PSION_SHIELD_HP : 0;
        this.shieldRegenTimer = 0; this.lastDamageTime = -Infinity; this.lastShieldDepletedTime = -Infinity;
        this.lastPsiBladeAttackTime = 0; this.attackedThisClick = false; this.psiBladeMirrorState = 1;
        this.isCastingPsiBlast = false; this.psiBlastCastTimer = 0; this.psiBlastStoredParticleCount = 0; this.psiBlastStoredDamagePerParticle = 0; this.psiBlastStoredStunDuration = 0; this.psiBlastStoredLifespan = 0; this.psiBlastStoredBaseRadius = 0;
        this.xrayRangeBonus = 0;

        this.abilityCharges = this.isBrawler && classData.ability.maxUses !== undefined ? classData.ability.maxUses : this.abilityUsesLeft;
        this.abilityMaxCharges = this.isBrawler && classData.ability.maxUses !== undefined ? classData.ability.maxUses : this.abilityUsesTotal;
        this.abilityRechargeTime = this.isBrawler && classData.ability.rechargeTime !== undefined ? classData.ability.rechargeTime : 0;
        this.abilityRechargeTimer = 0;

        this.turrets = []; this.nextTurretToRecall = 0;
        const TurretClass = typeof Turret !== 'undefined' ? Turret : null;
        const TurretStateEnum = typeof TurretState !== 'undefined' ? TurretState : null;
        if (this.isEngineer && TurretClass && TurretStateEnum && typeof ENGINEER_MAX_TURRETS !== 'undefined' && typeof TURRET_HP !== 'undefined') {
            for (let i = 0; i < ENGINEER_MAX_TURRETS; i++) {
                const placeholderTurret = new TurretClass(this.x, this.y, this, i);
                placeholderTurret.state = TurretStateEnum.INACTIVE;
                placeholderTurret.hp = TURRET_HP;
                this.turrets.push(placeholderTurret);
            }
        }

        this.hpRegenTimer = 0;

        this.drones = [];
        const DroneClass = typeof Drone !== 'undefined' ? Drone : null;
        if (DroneClass) {
            let initialDroneCount = 0;
            if (this.isEngineer && this.passiveType === 'drone_support' && typeof ENGINEER_DRONE_COUNT !== 'undefined') {
                initialDroneCount = ENGINEER_DRONE_COUNT;
            }
            for (let i = 0; i < initialDroneCount; i++) {
                let droneId = this.drones.length;
                while(this.drones.some(d => d.id === droneId)) droneId++;
                this.drones.push(new DroneClass(this, droneId));
            }
        }
        this.queuedPowerupDrones = 0;
        this.queuedPowerupMercs = 0;

        this.abilityCooldownTimer = (this.isBrawler || (this.isRecon && this.abilityType === 'bullet_time')) ? 0 : (classData.ability.cooldown || 0);
        if (this.isBrawler) { this.abilityUsesLeft = this.abilityCharges; this.abilityUsesTotal = this.abilityMaxCharges; }
        if (this.isRecon && this.abilityType === 'bullet_time' && typeof RECON_BULLET_TIME_COOLDOWN !== 'undefined') {
            this.abilityCooldownTimer = RECON_BULLET_TIME_COOLDOWN;
        }

        this.slowTimer = 0;
        this.slowFactor = 1.0;
        this.flamethrowerLoopSound = null;
    }

     recalculateSpeeds() {
        const baseWalk = (typeof BASE_PLAYER_SPEED_WALK !== 'undefined' ? BASE_PLAYER_SPEED_WALK : 170) * this.speedMultiplier * this.speedMultiplierBase;
        const baseRun = (typeof BASE_PLAYER_SPEED_RUN !== 'undefined' ? BASE_PLAYER_SPEED_RUN : 250) * this.speedMultiplier * this.speedMultiplierBase;
        this.speedWalk = baseWalk;
        this.speedRun = baseRun;
    }

     applySlow(duration, factor) {
        this.slowTimer = Math.max(this.slowTimer, duration);
        this.slowFactor = Math.min(this.slowFactor, factor);
    }

     update(effectiveDt, input, cameraRef, isSolidFunc, isWallFunc, projectiles_ref, grenades_ref, rpgProjectiles_ref, psiBlastParticles_ref, psiBladeEffects_ref, turrets_ref , zombies_ref, mercenaries_ref, flameParticles_ref) {
        if (!this.active) return;
        const now = performance.now();

        let currentSpeedFactor = 1.0;
        if (this.slowTimer > 0) {
            this.slowTimer -= effectiveDt * 1000;
            if (this.slowTimer <= 0) this.slowFactor = 1.0;
            else currentSpeedFactor = this.slowFactor;
        }

        if (this.isMarine && this.passiveType === 'hp_regen' && this.hp < this.maxHp && typeof MARINE_PASSIVE_REGEN_INTERVAL !== 'undefined' && typeof MARINE_PASSIVE_REGEN_AMOUNT !== 'undefined') {
            this.hpRegenTimer += effectiveDt * 1000;
            if (this.hpRegenTimer >= MARINE_PASSIVE_REGEN_INTERVAL) {
                this.hp = Math.min(this.maxHp, this.hp + MARINE_PASSIVE_REGEN_AMOUNT);
                this.hpRegenTimer = 0;
            }
        }
        if (this.isBrawler && this.passiveType === 'hp_regen_brawler' && this.hp < this.maxHp && typeof BRAWLER_PASSIVE_REGEN_INTERVAL !== 'undefined' && typeof BRAWLER_PASSIVE_REGEN_AMOUNT !== 'undefined') {
            this.hpRegenTimer += effectiveDt * 1000;
            if (this.hpRegenTimer >= BRAWLER_PASSIVE_REGEN_INTERVAL) {
                this.hp = Math.min(this.maxHp, this.hp + BRAWLER_PASSIVE_REGEN_AMOUNT);
                this.hpRegenTimer = 0;
            }
        }


        if (this.abilityCooldownTimer > 0 && !this.isBrawler) {
            this.abilityCooldownTimer -= effectiveDt * 1000;
        }

        if (this.isBrawler) {
            if (this.abilityCharges < this.abilityMaxCharges) {
                this.abilityRechargeTimer -= effectiveDt * 1000;
                if (this.abilityRechargeTimer <= 0) {
                    this.abilityCharges++;
                    this.abilityUsesLeft = this.abilityCharges;
                    if (this.abilityCharges < this.abilityMaxCharges) {
                        this.abilityRechargeTimer = this.abilityRechargeTime;
                    }
                }
            }
        }

        if (this.isPsion && typeof PSION_SHIELD_REGEN_DELAY !== 'undefined' && typeof PSION_SHIELD_REGEN_DELAY_ZERO !== 'undefined' && typeof PSION_SHIELD_REGEN_RATE !== 'undefined') {
            const baseDelay = PSION_SHIELD_REGEN_DELAY;
            const extraDelay = (this.shieldHp <= 0.01 && now - this.lastShieldDepletedTime < baseDelay + PSION_SHIELD_REGEN_DELAY_ZERO + 100 ) ? PSION_SHIELD_REGEN_DELAY_ZERO : 0;
            const requiredDelay = baseDelay + extraDelay;
            if (now - this.lastDamageTime >= requiredDelay) {
                const regenAmount = PSION_SHIELD_REGEN_RATE * effectiveDt;
                this.shieldHp = Math.min(this.maxShieldHp, this.shieldHp + regenAmount);
            }
        }
        if (this.isCastingPsiBlast && typeof PSI_BLAST_CAST_DELAY !== 'undefined') {
            this.psiBlastCastTimer -= effectiveDt * 1000;
            if (this.psiBlastCastTimer <= 0) {
                this.activatePsiBlast( psiBlastParticles_ref, this.psiBlastStoredParticleCount, this.psiBlastStoredDamagePerParticle, this.psiBlastStoredBaseRadius, this.psiBlastStoredLifespan, this.psiBlastStoredStunDuration );
                this.isCastingPsiBlast = false;
            }
        }

        if (this.isBulletTimeActive && typeof BULLET_TIME_SCALE !== 'undefined' && typeof NORMAL_TIME_SCALE !== 'undefined') {
            this.bulletTimeTimer -= effectiveDt * 1000;
            if (this.bulletTimeTimer <= 0) {
                this.isBulletTimeActive = false;
                window.gameTimeScale = NORMAL_TIME_SCALE;
                if (typeof playSound === 'function') playSound('BULLET_TIME_EXIT');
            }
        }
        this.isInvincible = false;
        if (this.isDashing && typeof PLAYER_DASH_AFTERIMAGE_INTERVAL !== 'undefined' && typeof Afterimage !== 'undefined') {
            this.isInvincible = true;
            this.dashTimer -= effectiveDt * 1000;
            if (now - this.lastAfterimageTime > PLAYER_DASH_AFTERIMAGE_INTERVAL) {
                window.afterimages.push(new Afterimage(this.x, this.y, this.angle, this.radius, this.classData.color));
                this.lastAfterimageTime = now;
            }
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.isInvincible = false;
            }
        }

        this.isRunning = input.shift && !this.isDashing;
        let brawlerDashSpeedMod = 1.0;
        if (this.isBrawler && this.isDashing && typeof BRAWLER_DASH_SPEED_FACTOR_MOD !== 'undefined') {
            brawlerDashSpeedMod = BRAWLER_DASH_SPEED_FACTOR_MOD;
        }

        const dashSpeedFactor = typeof PLAYER_DASH_SPEED_FACTOR !== 'undefined' ? PLAYER_DASH_SPEED_FACTOR : 4.0;
        const baseSpeedBeforeSlow = this.isDashing ? this.speedRun * dashSpeedFactor * brawlerDashSpeedMod : (this.isRunning ? this.speedRun : this.speedWalk);
        this.speed = baseSpeedBeforeSlow * currentSpeedFactor;


        let moveX = 0; let moveY = 0;
        if (input.w) moveY -= 1; if (input.s) moveY += 1; if (input.a) moveX -= 1; if (input.d) moveX += 1;
        this.isMoving = (moveX !== 0 || moveY !== 0);
        this.spread = this.isMoving ? (this.isRunning ? this.currentWeapon.spreadRun : this.currentWeapon.spreadWalk) : this.currentWeapon.spreadStand;
        const moveMagnitude = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveMagnitude > 0) { moveX /= moveMagnitude; moveY /= moveMagnitude; }

        this.vx = moveX * this.speed;
        this.vy = moveY * this.speed;
        let nextX = this.x + this.vx * effectiveDt;
        let nextY = this.y + this.vy * effectiveDt;

        const checkWallCollisionFunc = typeof checkWallCollision !== 'undefined' ? checkWallCollision : () => false;
        if (checkWallCollisionFunc !== null) {
            let canMoveX = !checkWallCollisionFunc(nextX, this.y, this.radius);
            let canMoveY = !checkWallCollisionFunc(this.x, nextY, this.radius);
            if (canMoveX) { this.x = nextX; } else { this.vx = 0; }
            if (canMoveY) { this.y = nextY; } else { this.vy = 0; }
            if (!canMoveX && !canMoveY) {
                nextX = this.x + this.vx * effectiveDt * 0.5;
                nextY = this.y + this.vy * effectiveDt * 0.5;
                if (!checkWallCollisionFunc(nextX, this.y, this.radius)) this.x = nextX;
                else if (!checkWallCollisionFunc(this.x, nextY, this.radius)) this.y = nextY;
            }
        } else {
            this.x = nextX; this.y = nextY;
        }


        const mouseGameX = input.mouseX + cameraRef.x;
        const mouseGameY = input.mouseY + cameraRef.y;
        this.angle = Math.atan2(mouseGameY - this.y, mouseGameX - this.x);

        if (this.currentWeapon.id !== WEAPON_ID.PSI_BLADES) {
            if (this.reloading) {
                this.reloadTimer += effectiveDt * 1000;
                if (this.reloadTimer >= this.currentWeapon.reloadTime) {
                    this.reloading = false; this.ammo = this.currentWeapon.magSize;
                    if (typeof playSound === 'function') playSound('RELOAD_END');
                }
            } else {
                if (input.r && this.ammo < this.currentWeapon.magSize) this.startReload();
                if (this.ammo <= 0 && !this.reloading && this.currentWeapon.magSize !== Infinity) this.startReload();
            }
        }

        const fireInterval = 60000 / this.currentWeapon.rpm;
        this.fireTimer -= effectiveDt * 1000;
        if (this.currentWeapon.id === WEAPON_ID.PSI_BLADES && typeof PSI_BLADE_MIN_ATTACK_INTERVAL !== 'undefined') {
            if (input.mouseDown && !this.attackedThisClick && now - this.lastPsiBladeAttackTime >= PSI_BLADE_MIN_ATTACK_INTERVAL) {
                this.shootPsiBlade(psiBladeEffects_ref, zombies_ref);
                this.lastPsiBladeAttackTime = now;
                this.attackedThisClick = true;
            }
        }
        else {
            const canShoot = (this.currentWeapon.auto && input.mouseDown) || (!this.currentWeapon.auto && input.mouseDown && this.fireTimer <= -fireInterval * 0.5);
            if (canShoot && !this.reloading && this.ammo > 0 && this.fireTimer <= 0) {
                if (this.currentWeapon.isRaycast) this.shootRaycast(zombies_ref, isWallFunc);
                else this.shootProjectile(projectiles_ref, flameParticles_ref, isWallFunc);
                this.fireTimer = fireInterval;
                if (this.currentWeapon.magSize !== Infinity) this.ammo--;
                if (this.ammo <= 0 && !this.reloading && this.currentWeapon.magSize !== Infinity) this.startReload();
                if (!this.currentWeapon.auto) input.mouseDown = false;
            }
        }

        if (this.currentWeapon.id === WEAPON_ID.FLAMETHROWER) {
            if (!input.mouseDown && this.flamethrowerLoopSound && !this.flamethrowerLoopSound.paused) {
                this.flamethrowerLoopSound.pause();
                this.flamethrowerLoopSound.currentTime = 0;
                if (typeof playSound === 'function') playSound('FLAMETHROWER_END');
            }
        } else {
            if (this.flamethrowerLoopSound && !this.flamethrowerLoopSound.paused) {
                this.flamethrowerLoopSound.pause();
                this.flamethrowerLoopSound.currentTime = 0;
            }
        }


        if (!input.mouseDown && this.isPsion) { this.attackedThisClick = false; }


        let canUseAbility = input.space && !this.reloading && !this.isCastingPsiBlast;
        if (this.isBrawler) {
            canUseAbility = canUseAbility && this.abilityCharges > 0;
        } else if (this.isRecon) {
             canUseAbility = canUseAbility && !this.isBulletTimeActive && this.abilityCooldownTimer <= 0;
        } else if (this.isPsion) {
            canUseAbility = canUseAbility && this.shieldHp >= (typeof PSI_BLAST_MIN_SHIELD_COST !== 'undefined' ? PSI_BLAST_MIN_SHIELD_COST : 10) && this.abilityCooldownTimer <= 0;
        } else if (this.isEngineer) {
            canUseAbility = canUseAbility && this.abilityCooldownTimer <= 0;
        } else {
            canUseAbility = canUseAbility && this.abilityUsesLeft > 0 && this.abilityCooldownTimer <= 0;
        }
        if (canUseAbility) { this.useAbility(grenades_ref, rpgProjectiles_ref, psiBlastParticles_ref, turrets_ref, this, zombies_ref, mercenaries_ref, this.drones, isWallFunc); input.space = false; }


        this.drones.forEach(drone => drone.update(effectiveDt, zombies_ref, isWallFunc, projectiles_ref, this.drones));

        for (let i = window.powerups.length - 1; i >= 0; i--) {
            const powerup = window.powerups[i];
            if (powerup.active && distance(this.x, this.y, powerup.x, powerup.y) < this.radius + powerup.radius) {
                this.applyPowerup(powerup);
                powerup.active = false;
            }
        }

        if (this.queuedPowerupMercs > 0) this.spawnQueuedMercs();
        if (this.queuedPowerupDrones > 0) this.spawnQueuedDrones();
    }

    applyPowerup(powerup) {
        if (!powerup || !powerup.config || !powerup.config.apply) return;
        console.log(`Player picked up: ${powerup.config.name}`);
        powerup.config.apply(this);

        const affectedWeapon = weapons.find(w => w.id === this.currentWeapon.id);
        if (affectedWeapon) {
            this.currentWeapon = affectedWeapon;
            if (this.ammo > this.currentWeapon.magSize && this.currentWeapon.magSize !== Infinity) {
                this.ammo = this.currentWeapon.magSize;
            }
            if (this.currentWeapon.magSize === Infinity) this.ammo = Infinity;
            else if (this.ammo === Infinity && this.currentWeapon.magSize !== Infinity) this.ammo = this.currentWeapon.magSize;
        }
        this.recalculateSpeeds();

        if (typeof playSound === 'function') playSound('POWERUP_PICKUP');

        if (window.powerupDisplayMessages && powerup.config.description) {
            const messageDuration = 3200;
            const MAX_DISPLAY_MESSAGES = 3;
            if (window.powerupDisplayMessages.length >= MAX_DISPLAY_MESSAGES) {
                window.powerupDisplayMessages.shift();
            }
            window.powerupDisplayMessages.push({
                text: `${powerup.config.name}: ${powerup.config.description}`,
                timer: messageDuration,
                initialTimer: messageDuration
            });
        }
    }


    spawnQueuedMercs() {
        const MercenaryClass = typeof Mercenary !== 'undefined' ? Mercenary : null;
        if (!MercenaryClass || this.queuedPowerupMercs <= 0 || typeof getRandomInt === 'undefined' || typeof distance === 'undefined' || typeof TILE === 'undefined' || typeof checkWallCollision === 'undefined' || typeof MERC_SEPARATION_DISTANCE === 'undefined') return;

        let mercsSuccessfullySpawned = 0;
        const totalMercsToAttemptSpawningNow = this.queuedPowerupMercs;

        for (let k = 0; k < totalMercsToAttemptSpawningNow; k++) {
            let spawnedThisMerc = false;
            for (let attempt = 0; attempt < 15; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = TILE_SIZE * (1.5 + Math.random() * 2.5);
                const spawnX = this.x + Math.cos(angle) * dist;
                const spawnY = this.y + Math.sin(angle) * dist;
                const gridX = Math.floor(spawnX / TILE_SIZE);
                const gridY = Math.floor(spawnY / TILE_SIZE);

                if (gridX > 0 && gridX < window.level.width - 1 && gridY > 0 && gridY < window.level.height - 1 &&
                    window.level.grid[gridY]?.[gridX] === TILE.FLOOR &&
                    !checkWallCollision(spawnX, spawnY, MERC_SIZE / 2)) {

                    let tooCloseToOther = false;
                    if(distance(spawnX, spawnY, this.x, this.y) < TILE_SIZE * 1.2) tooCloseToOther = true;
                    if (!tooCloseToOther && window.mercenaries) {
                        for(const merc of window.mercenaries){
                            if(distance(spawnX, spawnY, merc.x, merc.y) < MERC_SEPARATION_DISTANCE) {
                                tooCloseToOther = true; break;
                            }
                        }
                    }
                    if (!tooCloseToOther) {
                        if (!window.mercenaries) window.mercenaries = [];
                        window.mercenaries.push(new MercenaryClass(spawnX, spawnY, window.mercenaries.length));
                        mercsSuccessfullySpawned++;
                        spawnedThisMerc = true;
                        break;
                    }
                }
            }
        }
        this.queuedPowerupMercs -= mercsSuccessfullySpawned;
        if (this.queuedPowerupMercs < 0) this.queuedPowerupMercs = 0;

        if (mercsSuccessfullySpawned > 0 && typeof setTurretGlobals === 'function' && typeof window.zombies !== 'undefined' && typeof window.turrets !== 'undefined') {
           setTurretGlobals(window.player, window.zombies, window.mercenaries, window.turrets);
        }
    }

    spawnQueuedDrones() {
        const DroneClass = typeof Drone !== 'undefined' ? Drone : null;
        if (!DroneClass || this.queuedPowerupDrones <= 0) return;
        const dronesToSpawn = this.queuedPowerupDrones;
        for (let i = 0; i < dronesToSpawn; i++) {
            let newDroneId = this.drones.length;
             while(this.drones.some(d => d.id === newDroneId)) {
                 newDroneId++;
             }
            this.drones.push(new DroneClass(this, newDroneId));
        }
        this.queuedPowerupDrones = 0;
        if (dronesToSpawn > 0 && typeof setTurretGlobals === 'function' && typeof window.zombies !== 'undefined' && typeof window.mercenaries !== 'undefined' && typeof window.turrets !== 'undefined') {
            setTurretGlobals(window.player, window.zombies, window.mercenaries, window.turrets);
        }
    }


    takeDamage(amount, sourceType = 'unknown') {
        if (!this.active || window.gameOver || this.isInvincible) return;
        const previousShield = this.shieldHp;
        this.lastDamageTime = performance.now();

        if (this.classData.id === CLASS_ID.DEVASTATOR && (sourceType === 'explosion' || sourceType === 'explosion_particle' || sourceType === 'flame')) {
             if (this.passiveType && this.passiveType.includes('explosion_resistance')) {
                const resistanceMatch = this.passiveType.match(/(\d+)%\s*explosion_resistance/);
                if (resistanceMatch && resistanceMatch[1]) {
                    const resistancePercent = parseInt(resistanceMatch[1], 10);
                    amount *= (1 - (resistancePercent / 100));
                } else {
                    amount *= 0.1;
                }
             } else {
                amount *= 0.1;
             }
        }


        if (this.isPsion && this.shieldHp > 0) { const damageToShield = Math.min(amount, this.shieldHp); this.shieldHp -= damageToShield; amount -= damageToShield; }
        if (amount > 0) {
            this.hp -= amount;
            if (typeof playSound === 'function') playSound('PLAYER_HURT');
            if (this.hp <= 0) {
                this.hp = 0;
                this.active = false;
                window.gameOver = true;
                window.gameTimeScale = typeof NORMAL_TIME_SCALE !== 'undefined' ? NORMAL_TIME_SCALE : 1.0;
                if (typeof playSound === 'function') playSound('PLAYER_DEATH');
                if (this.flamethrowerLoopSound && !this.flamethrowerLoopSound.paused) {
                    this.flamethrowerLoopSound.pause();
                    this.flamethrowerLoopSound.currentTime = 0;
                }
            }
        }
        if (this.isPsion && previousShield > 0 && this.shieldHp <= 0.01) { this.lastShieldDepletedTime = this.lastDamageTime; }
    }

    draw(ctx, offsetX, offsetY) {
        if(!this.active && window.gameOver) { return;}
        if(!this.active) return;

        ctx.save();
        ctx.translate(this.x - offsetX, this.y - offsetY);

        if (this.slowTimer > 0 && typeof SLOW_EFFECT_COLOR !== 'undefined') {
             ctx.fillStyle = SLOW_EFFECT_COLOR;
             ctx.beginPath();
             ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
             ctx.fill();
        }

        if (this.isPsion && this.shieldHp > 0) { const shieldAlpha = Math.min(0.8, 0.2 + (this.shieldHp / Math.max(1, this.maxShieldHp)) * 0.6); ctx.beginPath(); ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2); ctx.fillStyle = `rgba(170, 100, 255, ${shieldAlpha})`; ctx.fill(); ctx.strokeStyle = `rgba(220, 180, 255, ${shieldAlpha * 1.1})`; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.rotate(this.angle);
        ctx.fillStyle = this.classData.color || 'blue';
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();

        const gunBarrelOffset = typeof GUN_BARREL_OFFSET !== 'undefined' ? GUN_BARREL_OFFSET : this.radius * 0.6;
        if (this.currentWeapon.id !== WEAPON_ID.PSI_BLADES) { ctx.fillStyle = 'white'; ctx.fillRect(this.radius * 0.5, -2, gunBarrelOffset, 4); }
        else { ctx.fillStyle = 'rgba(200, 150, 255, 0.9)'; const bladeLength = this.radius * 1.2; const bladeWidth = 4; ctx.beginPath(); ctx.moveTo(this.radius * 0.5, -bladeWidth/2); ctx.lineTo(bladeLength, 0); ctx.lineTo(this.radius * 0.5, bladeWidth/2); ctx.closePath(); ctx.fill(); }

        if (this.isCastingPsiBlast && typeof PSI_BLAST_CAST_DELAY !== 'undefined') {
            const castProgress = 1 - (this.psiBlastCastTimer / PSI_BLAST_CAST_DELAY);
            const indicatorRadius = this.radius * (1 + castProgress * 0.5);
            const indicatorAlpha = 0.3 + castProgress * 0.4;
            ctx.rotate(-this.angle);
            ctx.beginPath(); ctx.arc(0, 0, indicatorRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 200, 255, ${indicatorAlpha})`;
            ctx.lineWidth = 2 + castProgress * 2; ctx.stroke();
        }
        ctx.restore();
        if (this.currentWeapon.id !== WEAPON_ID.PSI_BLADES && this.reloading) {
            ctx.fillStyle = 'yellow';
            ctx.font = `14px ${DEFAULT_FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.fillText("RELOADING...", this.x - offsetX, this.y - offsetY - this.radius - 15);
            ctx.textAlign = 'left';
        }
    }
}
// --- END OF FILE player_core.js ---
// --- START OF FILE player_abilities.js ---

// Assumes Player class has been defined in player_core.js and its methods are part of Player.prototype
// Assumes globals: Math, console, performance, distance, normalizeVector, lerp, TILE_SIZE, window (for gameTimeScale, shockwaves, level, playSound, temporarySpriteEffects, imgPsiBlastSprite)
// Assumes constants: All constants from constants.js are global
// Assumes classes: PsiBlastParticle, Shockwave, Turret, TurretState, TILE, Grenade, RPGProjectile, checkWallCollision, TemporarySpriteEffect
// Player class definition should be available from player_core.js

if (typeof Player === 'undefined') { console.error("Player class not defined before player_abilities.js"); }

Player.prototype.activatePsiBlast = function(psiBlastParticles_ref, particleCount, damagePerParticle, baseRadius, lifespan, stunDuration) {
    const PsiBlastParticleClass = typeof PsiBlastParticle !== 'undefined' ? PsiBlastParticle : null;
    const ShockwaveClass = typeof Shockwave !== 'undefined' ? Shockwave : null;

    if (!PsiBlastParticleClass || !ShockwaveClass || typeof window.shockwaves === 'undefined') {
        console.warn("PsiBlastParticle, Shockwave, or window.shockwaves not defined for activatePsiBlast");
        return;
    }
    if (typeof playSound === 'function') playSound('PSI_BLAST_FIRE');

    const angleIncrement = particleCount > 0 ? (Math.PI * 2) / particleCount : 0;
    for (let i = 0; i < particleCount; i++) {
        const angle = i * angleIncrement;
        psiBlastParticles_ref.push(new PsiBlastParticleClass(this.x, this.y, angle, damagePerParticle, baseRadius, lifespan, stunDuration));
    }
    const blastRadiusFactor = typeof PSI_BLAST_MAX_BASE_RADIUS !== 'undefined' && PSI_BLAST_MAX_BASE_RADIUS !== 0 ? (baseRadius / PSI_BLAST_MAX_BASE_RADIUS) : 1;
    window.shockwaves.push(new ShockwaveClass(this.x, this.y, TILE_SIZE * 2.5 * blastRadiusFactor, 200));

    if (typeof TemporarySpriteEffect !== 'undefined' && window.imgPsiBlastSprite && typeof window.temporarySpriteEffects !== 'undefined') {
        const textureBaseSize = PSI_BLAST_MAX_BASE_RADIUS * TILE_SIZE * 1.5; // Example base size calculation
        window.temporarySpriteEffects.push(new TemporarySpriteEffect(
            this.x, this.y,
            window.imgPsiBlastSprite,
            100, // 0.1s duration
            0.5, 1.2, // Scale from 50% to 120% of its defined size
            Math.random() * Math.PI * 2,
            { width: textureBaseSize * 0.25, height: textureBaseSize * 0.25 } // <<<< Texture size is 25% of its conceptual full size
        ));
    }
};

Player.prototype.manageTurrets = function(turrets_ref, isWallFuncRef) {
    const TurretClass = typeof Turret !== 'undefined' ? Turret : null;
    const TurretStateEnum = typeof TurretState !== 'undefined' ? TurretState : null;
    const TileEnum = typeof TILE !== 'undefined' ? TILE : null;
    const checkWallCollisionFunc = typeof checkWallCollision !== 'undefined' ? checkWallCollision : null;
    const distanceFunc = typeof distance !== 'undefined' ? distance : null;


    if (!TurretClass || !TurretStateEnum || !TileEnum || typeof window.level === 'undefined' || !checkWallCollisionFunc || !distanceFunc || typeof TURRET_SIZE === 'undefined' || typeof TURRET_MIN_PLACEMENT_DISTANCE === 'undefined' || typeof TURRET_DEPLOY_TIME === 'undefined' || typeof ENGINEER_MAX_TURRETS === 'undefined') {
        console.warn("Turret management dependencies missing (Turret, TurretState, TILE, window.level, checkWallCollision, distance, or TURRET constants).");
        return false;
    }

    this.turrets = this.turrets.filter(t => t && t.state !== TurretStateEnum.DESTROYED);
    const deployableTurretIndex = this.turrets.findIndex(t => t.state === TurretStateEnum.INACTIVE);
    const activeTurretCount = this.turrets.filter(t => t.state !== TurretStateEnum.INACTIVE && t.state !== TurretStateEnum.DESTROYED).length;

    let actionTaken = false;

    if (deployableTurretIndex !== -1) {
        const turretToDeploy = this.turrets[deployableTurretIndex];
        let placed = false; let attempts = 0; const maxPlaceAttempts = 30; let placeX, placeY; const placeDist = TILE_SIZE * 1.0;
        while (!placed && attempts < maxPlaceAttempts) {
            attempts++; const offsetAngle = this.angle + (Math.random() - 0.5) * Math.PI * 0.4; placeX = this.x + Math.cos(offsetAngle) * placeDist; placeY = this.y + Math.sin(offsetAngle) * placeDist; const gridX = Math.floor(placeX / TILE_SIZE); const gridY = Math.floor(placeY / TILE_SIZE);
            if (!window.level.grid[gridY] || window.level.grid[gridY][gridX] !== TileEnum.FLOOR) { continue; }
            let tooClose = false;
            for (const existingTurret of this.turrets) { if (existingTurret !== turretToDeploy && existingTurret.state !== TurretStateEnum.INACTIVE && distanceFunc(placeX, placeY, existingTurret.x, existingTurret.y) < TURRET_MIN_PLACEMENT_DISTANCE) { tooClose = true; break; } }
            if (tooClose) continue;
            if (checkWallCollisionFunc(placeX, placeY, TURRET_SIZE / 2)) { continue; }
            placed = true;
        }
        if(placed) {
            turretToDeploy.x = placeX; turretToDeploy.y = placeY; turretToDeploy.angle = this.angle;
            turretToDeploy.state = TurretStateEnum.DEPLOYING; turretToDeploy.deployTimer = TURRET_DEPLOY_TIME;
            turretToDeploy.hp = turretToDeploy.maxHp;
            turretToDeploy.active = true;
            if (!turrets_ref.includes(turretToDeploy)) { turrets_ref.push(turretToDeploy); }
            this.nextTurretToRecall = (this.nextTurretToRecall + 1) % ENGINEER_MAX_TURRETS;
            if (typeof playSound === 'function') playSound('TURRET_DEPLOY');
            actionTaken = true;
        }
    } else if (activeTurretCount < ENGINEER_MAX_TURRETS) {
        let placed = false; let attempts = 0; const maxPlaceAttempts = 30; let placeX, placeY; const placeDist = TILE_SIZE * 1.0;
        while (!placed && attempts < maxPlaceAttempts) {
             attempts++; const offsetAngle = this.angle + (Math.random() - 0.5) * Math.PI * 0.4; placeX = this.x + Math.cos(offsetAngle) * placeDist; placeY = this.y + Math.sin(offsetAngle) * placeDist; const gridX = Math.floor(placeX / TILE_SIZE); const gridY = Math.floor(placeY / TILE_SIZE);
             if (!window.level.grid[gridY] || window.level.grid[gridY][gridX] !== TileEnum.FLOOR) continue;
             let tooClose = false;
             for (const existingTurret of this.turrets) { if (existingTurret.state !== TurretStateEnum.INACTIVE && distanceFunc(placeX, placeY, existingTurret.x, existingTurret.y) < TURRET_MIN_PLACEMENT_DISTANCE) { tooClose = true; break; } }
             if (tooClose) continue;
             if (checkWallCollisionFunc(placeX, placeY, TURRET_SIZE / 2)) continue;
             placed = true;
        }
        if (placed) {
            const newId = this.turrets.length;
            const newTurret = new TurretClass(placeX, placeY, this, newId);
            this.turrets.push(newTurret); turrets_ref.push(newTurret);
            this.nextTurretToRecall = (this.nextTurretToRecall + 1) % ENGINEER_MAX_TURRETS;
            if (typeof playSound === 'function') playSound('TURRET_DEPLOY');
            actionTaken = true;
        }
    } else {
        const turretToRecall = this.turrets.find(t => t.id === this.nextTurretToRecall);
        if (turretToRecall && turretToRecall.state === TurretStateEnum.ACTIVE) {
            turretToRecall.state = TurretStateEnum.RETURNING;
            this.nextTurretToRecall = (this.nextTurretToRecall + 1) % ENGINEER_MAX_TURRETS;
            if (typeof playSound === 'function') playSound('TURRET_RECALL');
            actionTaken = true;
        } else {
            this.nextTurretToRecall = (this.nextTurretToRecall + 1) % ENGINEER_MAX_TURRETS;
        }
    }
    return actionTaken;
};

Player.prototype.useAbility = function(grenades_ref, rpgProjectiles_ref, psiBlastParticles_ref, turrets_ref, player_ref, zombies_ref, mercenaries_ref, drones_ref, isWallFuncRef) {
    let abilityUsed = false;
    const currentAbilityType = this.abilityType;

    const BrawlerDashCharges = typeof BRAWLER_DASH_CHARGES !== 'undefined' ? BRAWLER_DASH_CHARGES : 0;
    const ReconBulletTimeScale = typeof BULLET_TIME_SCALE !== 'undefined' ? BULLET_TIME_SCALE : 0.3;
    const PsiBlastMinShieldCost = typeof PSI_BLAST_MIN_SHIELD_COST !== 'undefined' ? PSI_BLAST_MIN_SHIELD_COST : 10;
    const PsiBlastCastDelay = typeof PSI_BLAST_CAST_DELAY !== 'undefined' ? PSI_BLAST_CAST_DELAY : 160;


    switch (currentAbilityType) {
        case 'dash':
            if (this.isBrawler && this.abilityCharges > 0) {
                this.isDashing = true;
                this.dashTimer = this.abilityDuration;
                this.lastAfterimageTime = 0;
                this.abilityCharges--;
                this.abilityUsesLeft = this.abilityCharges;
                if (this.abilityCharges === this.abilityMaxCharges - 1 && this.abilityMaxCharges > 1) {
                    this.abilityRechargeTimer = this.abilityRechargeTime;
                } else if (this.abilityMaxCharges === 1 && this.abilityCharges === 0) {
                    this.abilityRechargeTimer = this.abilityRechargeTime;
                }
                if (typeof playSound === 'function') playSound('DASH');
                abilityUsed = true;
            }
            break;
        case 'grenade':
            if (this.abilityUsesLeft > 0 && this.abilityCooldownTimer <= 0){
                this.throwGrenade(grenades_ref);
                abilityUsed = true;
            }
            break;
        case 'rpg':
            if (this.abilityUsesLeft > 0 && this.abilityCooldownTimer <= 0 && typeof RPGProjectile !== 'undefined' && typeof GUN_BARREL_OFFSET !== 'undefined'){
                const rpgAngle = this.angle;
                const barrelOffsetRPG = GUN_BARREL_OFFSET;
                const rpgStartX = this.x + Math.cos(rpgAngle) * barrelOffsetRPG;
                const rpgStartY = this.y + Math.sin(rpgAngle) * barrelOffsetRPG;
                rpgProjectiles_ref.push(new RPGProjectile(rpgStartX, rpgStartY, rpgAngle));
                if (typeof playSound === 'function') playSound('RPG_SHOOT');
                abilityUsed = true;
            }
            break;
        case 'bullet_time':
            if (this.isRecon && !this.isBulletTimeActive && this.abilityCooldownTimer <= 0) {
                this.isBulletTimeActive = true;
                this.bulletTimeTimer = this.abilityDuration;
                window.gameTimeScale = ReconBulletTimeScale;
                if (typeof playSound === 'function') playSound('BULLET_TIME_ENTER');
                abilityUsed = true;
            }
            break;
        case 'psi_blast':
            if (this.shieldHp >= PsiBlastMinShieldCost && !this.isCastingPsiBlast && this.abilityCooldownTimer <= 0 && typeof lerp !== 'undefined') {
                this.isCastingPsiBlast = true;
                this.psiBlastCastTimer = PsiBlastCastDelay;
                const consumedShield = this.shieldHp;
                this.shieldHp = 0;
                this.lastShieldDepletedTime = performance.now();
                const shieldFraction = this.maxShieldHp > 0 ? Math.max(0, Math.min(1, consumedShield / this.maxShieldHp)) : 0;
                this.psiBlastStoredParticleCount = Math.round(lerp(PSI_BLAST_MIN_PARTICLES, PSI_BLAST_MAX_PARTICLES, shieldFraction));
                this.psiBlastStoredDamagePerParticle = (consumedShield + 10) / 2;
                this.psiBlastStoredBaseRadius = lerp(PSI_BLAST_MAX_BASE_RADIUS * 0.5, PSI_BLAST_MAX_BASE_RADIUS, shieldFraction);
                this.psiBlastStoredLifespan = lerp(PSI_BLAST_MAX_LIFESPAN * 0.5, PSI_BLAST_MAX_LIFESPAN, shieldFraction);
                this.psiBlastStoredStunDuration = lerp(0, PSI_BLAST_MAX_STUN_DURATION, shieldFraction);
                if (typeof playSound === 'function') playSound('PSI_BLAST_CHARGE');
                abilityUsed = true;
            }
            break;
        case 'turret':
            if (this.isEngineer && this.abilityCooldownTimer <= 0) {
                if (this.manageTurrets(turrets_ref, isWallFuncRef)) {
                    abilityUsed = true;
                }
            }
            break;
    }
    if (abilityUsed) {
        if (!this.isBrawler && this.abilityUsesTotal !== Infinity) {
            this.abilityUsesLeft--;
        }
        if (this.abilityCooldown > 0 && !this.isBrawler) {
            this.abilityCooldownTimer = this.abilityCooldown;
        } else if (this.isRecon && this.abilityType === 'bullet_time') {
             this.abilityCooldownTimer = this.abilityCooldown;
        }
    }
};

Player.prototype.throwGrenade = function(grenades_ref) {
    const GrenadeClass = typeof Grenade !== 'undefined' ? Grenade : null;
    if (!GrenadeClass || typeof GUN_BARREL_OFFSET === 'undefined') {
        console.warn("Grenade class or GUN_BARREL_OFFSET not defined for throwGrenade"); return;
    }
    const barrelOffset = GUN_BARREL_OFFSET;
    const startX = this.x + Math.cos(this.angle) * barrelOffset * 1.5;
    const startY = this.y + Math.sin(this.angle) * barrelOffset * 1.5;
    grenades_ref.push(new GrenadeClass(startX, startY, this.angle, this.isMarine));
    if (typeof playSound === 'function') playSound('GRENADE_THROW');
};
// --- END OF FILE player_abilities.js ---
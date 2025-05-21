// --- START OF FILE particles.js ---

// Assumes globals: Math, console, distance, normalizeVector, dotProduct, lerp, getRandomInt, TILE_SIZE, FOG_STATE, performance, level, player, zombies, mercenaries, turrets, _playerRef, _zombieArr, _mercArr, _turretArr
// Assumes constants: All constants from constants.js are global (including RPG_EXPLOSION_PARTICLE_LIFESPAN)
// Assumes classes: TurretState (imported or global)

// --- Particle & Effect Classes ---
class Afterimage {
    constructor(x, y, angle, radius, color) { this.x = x; this.y = y; this.angle = angle; this.radius = radius; this.color = color; this.lifespan = 165; this.startLifespan = this.lifespan; this.active = true; }
    update(effectiveDt) { if (!this.active) return; this.lifespan -= effectiveDt * 1000; if (this.lifespan <= 0) { this.active = false; } }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const alpha = Math.max(0, this.lifespan / this.startLifespan) * 0.4; ctx.save(); ctx.globalAlpha = alpha; ctx.translate(this.x - offsetX, this.y - offsetY); ctx.rotate(this.angle); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}

class Shockwave {
    constructor(x, y, maxRadius, lifespan) { this.x = x; this.y = y; this.radius = 0; this.maxRadius = maxRadius; this.lifespan = lifespan; this.startLifespan = lifespan; this.active = true; this.alpha = 0; }
    update(effectiveDt) {
        if (!this.active) return;
        this.lifespan -= effectiveDt * 1000;
        if (this.lifespan <= 0) { this.active = false; this.alpha = 0; return; }
        const lifeRatio = 1 - (this.lifespan / this.startLifespan);
        this.radius = this.maxRadius * lifeRatio;
        this.alpha = (1 - lifeRatio) * 0.35;
    }
    draw(ctx, offsetX, offsetY) {
        if (!this.active || this.alpha <= 0) return;
        const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE);
        if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return;
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, this.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
    }
}

class PsiBladeEffect { // This is the old arc visual, now unused if texture is preferred
    constructor(x, y, angle, range, arcAngle) { this.x = x; this.y = y; this.angle = angle; this.range = range; this.arcAngle = arcAngle; this.lifespan = PSI_BLADE_EFFECT_DURATION; this.startLifespan = this.lifespan; this.active = true; }
    update(effectiveDt) { if (!this.active) return; this.lifespan -= effectiveDt * 1000; if (this.lifespan <= 0) { this.active = false; } }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return; const lifeRatio = Math.max(0, this.lifespan / this.startLifespan); const alpha = lifeRatio * 0.6; ctx.save(); ctx.translate(this.x - offsetX, this.y - offsetY); ctx.rotate(this.angle); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, this.range, -this.arcAngle / 2, this.arcAngle / 2); ctx.closePath(); const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.range * lifeRatio); gradient.addColorStop(0, `rgba(200, 100, 255, ${alpha * 0.8})`); gradient.addColorStop(1, `rgba(150, 50, 220, ${alpha * 0.2})`); ctx.fillStyle = gradient; ctx.fill(); ctx.restore(); }
}

class PsiBlastParticle {
    constructor(x, y, angle, damage, initialRadius, currentLifespan, currentStunDuration) { this.x = x; this.y = y; this.baseRadius = initialRadius; this.radius = this.baseRadius * (1 + Math.random() * 0.2); this.speed = PSI_BLAST_PARTICLE_SPEED * (0.9 + Math.random() * 0.3); this.angle = angle; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed; this.damping = PSI_BLAST_PARTICLE_DAMPING; this.lifespan = currentLifespan * (0.85 + Math.random() * 0.3); this.startLifespan = this.lifespan; this.damage = damage; this.stunDuration = currentStunDuration; this.active = true; this.hitTargets = new Set(); this.colorStart = PSI_BLAST_PARTICLE_COLOR_START; this.colorEnd = PSI_BLAST_PARTICLE_COLOR_END; }
    update(effectiveDt, isWallFunc, zombies) { if (!this.active) return; const dampingFactor = Math.max(0, 1.0 - (this.damping * effectiveDt)); this.vx *= dampingFactor; this.vy *= dampingFactor; this.x += this.vx * effectiveDt; this.y += this.vy * effectiveDt; this.lifespan -= effectiveDt; if (this.lifespan <= 0) { this.active = false; return; } const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (isWallFunc(gridX, gridY)) { this.active = false; return; } if (typeof level !== 'undefined' && (this.x < 0 || this.x > level.width * TILE_SIZE || this.y < 0 || this.y > level.height * TILE_SIZE)) { this.active = false; return; } if(zombies && Array.isArray(zombies)) { for (const zombie of zombies) { if (zombie && zombie.hp > 0 && !this.hitTargets.has(zombie)) { if (distance(this.x, this.y, zombie.x, zombie.y) < this.radius + zombie.radius) { if (this.damage > 0) { zombie.takeDamage(this.damage, 'psi_blast', this.stunDuration); } this.hitTargets.add(zombie); } } } } }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return; const lifeRatio = this.startLifespan > 0 ? Math.max(0, this.lifespan / this.startLifespan) : 0; const alpha = lifeRatio * 1.0; this.radius = this.baseRadius * (0.3 + lifeRatio * 0.7); const r = lerp(this.colorEnd[0], this.colorStart[0], lifeRatio); const g = lerp(this.colorEnd[1], this.colorStart[1], lifeRatio); const b = lerp(this.colorEnd[2], this.colorStart[2], lifeRatio); ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`; ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, Math.max(1.5, this.radius), 0, Math.PI * 2); ctx.fill(); }
}

class RailgunParticle {
    constructor(x, y) { this.x = x; this.y = y; this.radius = RAILGUN_PARTICLE_RADIUS * (0.8 + Math.random() * 0.4); this.lifespan = RAILGUN_PARTICLE_LIFESPAN * (0.77 + Math.random() * 0.87); this.startLifespan = this.lifespan; this.active = true; this.alpha = 1.0; this.color = RAILGUN_PARTICLE_COLOR_TRAIL; }
    update(effectiveDt) { if (!this.active) return; this.lifespan -= effectiveDt * 1000; if (this.lifespan <= 0) { this.active = false; return; } this.alpha = Math.max(0, this.lifespan / this.startLifespan); }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return;
        const alphaMatch = this.color.match(/,([\d.]+)\)/);
        const baseAlpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1.0;
        ctx.fillStyle = this.color.replace(/,([\d.]+)\)/, `,${this.alpha * baseAlpha}`);
        ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, this.radius, 0, Math.PI * 2); ctx.fill();
    }
}

class GrenadeParticle {
    constructor(x, y, angle) {
        this.x = x; this.y = y; this.radius = GRENADE_PARTICLE_WIDTH / 2; this.speed = GRENADE_PARTICLE_SPEED * (0.8 + Math.random() * 0.4); this.angle = angle; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed;
        this.startLifespan = GRENADE_PARTICLE_LIFESPAN * (0.9 + Math.random() * 0.2);
        this.lifespan = this.startLifespan;
        this.damage = GRENADE_PARTICLE_DAMAGE; this.active = true; this.hitTargets = new Set(); this.length = GRENADE_PARTICLE_LENGTH; this.width = GRENADE_PARTICLE_WIDTH; this.bouncesLeft = 1;
    }
    update(effectiveDt, isWallFunc, zombies, player, mercenaries, turrets) {
        if (!this.active) return; const prevX = this.x; const prevY = this.y; this.x += this.vx * effectiveDt; this.y += this.vy * effectiveDt; this.lifespan -= effectiveDt; if (this.lifespan <= 0) { this.active = false; return; } const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (isWallFunc(gridX, gridY)) { if (this.bouncesLeft > 0) { this.bouncesLeft--; const prevGridX = Math.floor(prevX / TILE_SIZE); const prevGridY = Math.floor(prevY / TILE_SIZE); let wallNormalX = 0; let wallNormalY = 0; if (prevGridX !== gridX && !isWallFunc(prevGridX, gridY)) wallNormalX = (this.x > prevX) ? -1 : 1; if (prevGridY !== gridY && !isWallFunc(gridX, prevGridY)) wallNormalY = (this.y > prevY) ? -1 : 1; if(wallNormalX === 0 && wallNormalY === 0) { if (Math.abs(this.vx) > Math.abs(this.vy)) wallNormalX = (this.vx > 0) ? -1 : 1; else wallNormalY = (this.vy > 0) ? -1 : 1; } const norm = normalizeVector(wallNormalX, wallNormalY); wallNormalX = norm.x; wallNormalY = norm.y; const reflectFactor = 2 * dotProduct(this.vx, this.vy, wallNormalX, wallNormalY); this.vx = (this.vx - reflectFactor * wallNormalX) * PARTICLE_BOUNCE_DAMPING; this.vy = (this.vy - reflectFactor * wallNormalY) * PARTICLE_BOUNCE_DAMPING; this.angle = Math.atan2(this.vy, this.vx); this.x = prevX + this.vx * effectiveDt * 0.1; this.y = prevY + this.vy * effectiveDt * 0.1; } else { this.active = false; return; } }
        const checkCollision = (target) => {
             if (!target || this.hitTargets.has(target)) return false;
             let isActive = false;
             if (target === player) isActive = target.active;
             else if (target.state) isActive = target.state === TurretState.ACTIVE;
             else if (target.active !== undefined) isActive = target.active;
             else if (target.hp !== undefined) isActive = target.hp > 0;

             if(isActive && (target.hp === undefined || target.hp > 0)) {
                  const targetRadius = target.radius || PLAYER_SIZE/2;
                  if (distance(this.x, this.y, target.x, target.y) < this.radius + targetRadius) {
                      if (typeof target.takeDamage === 'function') target.takeDamage(this.damage, 'explosion_particle');
                      else if (target.hp !== undefined) { target.hp -= this.damage; if(target.hp <= 0) { target.hp = 0; if(target.active !== undefined) target.active = false; }}
                      this.hitTargets.add(target);
                      return true;
                  }
             }
             return false;
        };
        if (zombies && zombies.some(checkCollision)) { this.active = false; return; }
        if (mercenaries && mercenaries.some(checkCollision)) { this.active = false; return; }
        if (turrets && turrets.some(checkCollision)) { this.active = false; return; }
        if (player && checkCollision(player)) { this.active = false; return; }
         if (player && player.drones && player.drones.some(checkCollision)) { this.active = false; return; }
    }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return; ctx.save(); ctx.translate(this.x - offsetX, this.y - offsetY); ctx.rotate(this.angle); ctx.strokeStyle = `rgba(255, ${100 + Math.random()*100}, 0, ${Math.max(0.1, this.lifespan / this.startLifespan)})`; ctx.lineWidth = this.width; ctx.beginPath(); ctx.moveTo(-this.length / 2, 0); ctx.lineTo(this.length / 2, 0); ctx.stroke(); ctx.restore(); }
}

class ExplosionParticle extends GrenadeParticle {
    constructor(x, y, angle, speed, lifespan, damage, length, width) {
        super(x, y, angle);
        this.speed = speed; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed;
        this.startLifespan = lifespan * (0.9 + Math.random() * 0.2);
        this.lifespan = this.startLifespan;
        this.damage = damage; this.length = length; this.width = width; this.radius = width / 2;
        this.bouncesLeft = 2;
        this.primaryColor = `rgba(255, ${50 + Math.random()*150}, 0, 1.0)`;
        this.secondaryColor = `rgba(255, ${100 + Math.random()*100}, 50, 0.8)`;
    }
    draw(ctx, offsetX, offsetY) {
        if (!this.active) return;
        const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE);
        if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return;

        ctx.save();
        ctx.translate(this.x - offsetX, this.y - offsetY);
        ctx.rotate(this.angle);

        const lifeRatio = this.startLifespan > 0 ? Math.max(0, this.lifespan / this.startLifespan) : 0;
        const alpha = 0.1 + lifeRatio * 0.8;

        const gradient = ctx.createLinearGradient(-this.length / 2, 0, this.length / 2, 0);
         gradient.addColorStop(0, this.primaryColor.replace(/,\s*([\d.]+)\)$/, `, ${alpha * 0.6})`));
         gradient.addColorStop(0.5, this.secondaryColor.replace(/,\s*([\d.]+)\)$/, `, ${alpha})`));
         gradient.addColorStop(1, this.primaryColor.replace(/,\s*([\d.]+)\)$/, `, ${alpha * 0.6})`));

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.width;
        ctx.beginPath(); ctx.moveTo(-this.length / 2, 0); ctx.lineTo(this.length / 2, 0); ctx.stroke();
        ctx.restore();
    }
}


class SmokeParticle {
    constructor(x, y) { this.x = x + (Math.random() - 0.5) * 5; this.y = y + (Math.random() - 0.5) * 5; this.radius = RPG_SMOKE_SIZE * (0.5 + Math.random() * 0.5); this.maxRadius = this.radius * (1.5 + Math.random()); this.lifespan = RPG_SMOKE_LIFESPAN * (0.8 + Math.random() * 0.4); this.startLifespan = this.lifespan; this.active = true; this.alpha = 0.6; this.growthRate = (this.maxRadius - this.radius) / (this.startLifespan / 1000); this.vx = (Math.random() - 0.5) * 15; this.vy = (Math.random() - 0.5) * 15; }
    update(effectiveDt) { if (!this.active) return; this.lifespan -= effectiveDt * 1000; if (this.lifespan <= 0) { this.active = false; return; } this.x += this.vx * effectiveDt; this.y += this.vy * effectiveDt; this.radius += this.growthRate * effectiveDt; this.alpha = 0.6 * (this.lifespan / this.startLifespan); }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return; ctx.fillStyle = `rgba(100, 100, 100, ${this.alpha})`; ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, this.radius, 0, Math.PI * 2); ctx.fill(); }
}

class WallSparkParticle {
    constructor(x, y, angle, speed, radius = MG_WALL_SPARK_RADIUS, lifespan = MG_WALL_SPARK_LIFESPAN, bounces = MG_WALL_SPARK_BOUNCES, damping = MG_WALL_SPARK_DAMPING, color = null) {
        this.x = x; this.y = y;
        this.radius = radius * (0.8 + Math.random() * 0.4);
        this.angle = angle; this.speed = speed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.lifespan = lifespan * (0.8 + Math.random() * 0.4);
        this.startLifespan = this.lifespan;
        this.active = true;
        this.bouncesLeft = bounces;
        this.damping = damping;
        this.color = color;
    }
    update(effectiveDt, isWallFunc) { if (!this.active) return; const prevX = this.x; const prevY = this.y; this.x += this.vx * effectiveDt; this.y += this.vy * effectiveDt; this.lifespan -= effectiveDt * 1000; if (this.lifespan <= 0) { this.active = false; return; } const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (isWallFunc(gridX, gridY)) { if (this.bouncesLeft > 0) { this.bouncesLeft--; const prevGridX = Math.floor(prevX / TILE_SIZE); const prevGridY = Math.floor(prevY / TILE_SIZE); let wallNormalX = 0; let wallNormalY = 0; if (prevGridX !== gridX && !isWallFunc(prevGridX, gridY)) wallNormalX = (this.x > prevX) ? -1 : 1; if (prevGridY !== gridY && !isWallFunc(gridX, prevGridY)) wallNormalY = (this.y > prevY) ? -1 : 1; if (wallNormalX === 0 && wallNormalY === 0) { if (Math.abs(this.vx) > Math.abs(this.vy)) wallNormalX = (this.vx > 0) ? -1 : 1; else wallNormalY = (this.vy > 0) ? -1 : 1; } const norm = normalizeVector(wallNormalX, wallNormalY); wallNormalX = norm.x; wallNormalY = norm.y; const reflectFactor = 2 * dotProduct(this.vx, this.vy, wallNormalX, wallNormalY); this.vx = (this.vx - reflectFactor * wallNormalX) * this.damping; this.vy = (this.vy - reflectFactor * wallNormalY) * this.damping; this.angle = Math.atan2(this.vy, this.vx); this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy); this.x = prevX + this.vx * effectiveDt * 0.1; this.y = prevY + this.vy * effectiveDt * 0.1; } else { this.active = false; return; } } }
    draw(ctx, offsetX, offsetY) {
        if (!this.active) return;
        const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE);
        if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return;

        const lifeRatio = Math.max(0, this.lifespan / this.startLifespan);
        const currentRadius = this.radius * (0.6 + lifeRatio * 0.4);
        let fillColor;
        if (this.color) {
            fillColor = this.color.replace(/,([\d.]+)\)/, `,${lifeRatio * parseFloat(this.color.match(/,([\d.]+)\)/)[1])})`);
        } else {
            const brightness = 220 + Math.floor(35 * lifeRatio);
            fillColor = `rgba(${brightness}, ${brightness}, ${brightness - 20}, ${lifeRatio * 0.95})`;
        }
        ctx.fillStyle = fillColor;
        ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, currentRadius, 0, Math.PI * 2); ctx.fill();
    }
}

class RailgunWallParticle {
    constructor(x, y, angle, speed) {
        this.x = x; this.y = y;
        this.radius = getRandomInt(RAILGUN_WALL_PARTICLE_RADIUS_MIN, RAILGUN_WALL_PARTICLE_RADIUS_MAX);
        this.angle = angle; this.speed = speed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.lifespan = RAILGUN_WALL_PARTICLE_LIFESPAN * (0.8 + Math.random() * 0.4);
        this.startLifespan = this.lifespan;
        this.active = true;
        this.colorStart = [255, 255, 255]; // White
        this.colorEnd = RAILGUN_WALL_PARTICLE_COLOR; // Blue from constants (now an array)
    }
    update(effectiveDt, isWallFunc) {
        if (!this.active) return;
        this.x += this.vx * effectiveDt;
        this.y += this.vy * effectiveDt;
        this.lifespan -= effectiveDt * 1000;
        if (this.lifespan <= 0) {
            this.active = false;
            return;
        }
    }
    draw(ctx, offsetX, offsetY) {
        if (!this.active) return;
        const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE);
        if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return;

        const lifeRatio = Math.max(0, this.lifespan / this.startLifespan);

        const r = lerp(this.colorEnd[0], this.colorStart[0], lifeRatio);
        const g = lerp(this.colorEnd[1], this.colorStart[1], lifeRatio);
        const b = lerp(this.colorEnd[2], this.colorStart[2], lifeRatio);
        const alpha = 0.3 + lifeRatio * 0.7; // Fade out alpha

        ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x - offsetX, this.y - offsetY, this.radius * (0.5 + lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fill();
    }
}


class FlashParticle {
    constructor(x, y, angle, speed, lifespan) { this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; this.lifespan = lifespan; this.startLifespan = lifespan; this.active = true; this.colorVal = Math.random(); this.flickerSpeed = 25 + Math.random() * 30; this.baseRadius = 1.22 + Math.random() * 1.4; }
    update(effectiveDt) { if (!this.active) return; this.x += this.vx * effectiveDt; this.y += this.vy * effectiveDt; this.lifespan -= effectiveDt * 1000; if (this.lifespan <= 0) { this.active = false; } }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return; const lifeRatio = Math.max(0, this.lifespan / this.startLifespan); const flicker = 0.5 + Math.abs(Math.sin(performance.now() * 0.001 * this.flickerSpeed)) * 0.5; const radius = this.baseRadius * (0.5 + lifeRatio * 0.5); const alpha = lifeRatio * flicker; const r = 255; const g = lerp(180, 255, this.colorVal); const b = lerp(0, 50, this.colorVal); ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`; ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, Math.max(0.5, radius), 0, Math.PI * 2); ctx.fill(); }
}

class FlameParticle {
    constructor(x, y, angle, speed, lifespan, weapon, isWallHitParticle = false) { this.x = x; this.y = y; this.ownerWeapon = weapon; this.angle = angle; this.speed = speed * (0.575 + Math.random() * 0.85); this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed; this.lifespan = lifespan * (isWallHitParticle ? 0.4 : 1.0) * (0.4 + Math.random() * 1.2); this.startLifespan = this.lifespan; this.baseRadius = weapon.particleBaseRadius * (0.8 + Math.random() * 0.4); this.startRadius = this.baseRadius * (isWallHitParticle ? 0.6 : 1.0); this.endRadius = this.startRadius * weapon.particleSizeGrowFactor * (isWallHitParticle ? 0.7 : 1.0); this.damping = weapon.particleDamping; this.active = true; this.isWallHitParticle = isWallHitParticle; this.hitWall = false; this.wallHitX = 0; this.wallHitY = 0; this.damagedTargets = new Set(); this.colorStart = [255, 255, 120]; this.colorMid = [255, 160, 0]; this.colorEnd = [180, 60, 10]; }
    update(effectiveDt, isWallFunc, zombies, turrets) {
        if (!this.active) return;
        const prevX = this.x; const prevY = this.y;
        const dampingFactor = 1.0 - (this.damping * effectiveDt);
        if (dampingFactor > 0) { this.vx *= dampingFactor; this.vy *= dampingFactor; }
        else { this.vx = 0; this.vy = 0; }
        this.x += this.vx * effectiveDt; this.y += this.vy * effectiveDt;
        this.lifespan -= effectiveDt * 1000;
        if (this.lifespan <= 0) { this.active = false; return; }
        if (isWallFunc(Math.floor(this.x / TILE_SIZE), Math.floor(this.y / TILE_SIZE))) { this.active = false; if (!this.isWallHitParticle) { this.hitWall = true; this.wallHitX = prevX; this.wallHitY = prevY; } return; }
        const lifeRatio = Math.max(0, this.lifespan / this.startLifespan);
        const growRatio = 1.0 - lifeRatio;
        const currentRadius = lerp(this.startRadius, this.endRadius, growRatio);
        if (isNaN(currentRadius) || currentRadius <= 0.1) return;

        const checkCollision = (target) => {
            if (!target || this.damagedTargets.has(target)) return false;
            let isActive = false;
            if (target.state) isActive = target.state === TurretState.ACTIVE;
            else if (target.hp !== undefined) isActive = target.hp > 0;
            if(isActive) {
                const targetRadius = target.radius || PLAYER_SIZE/2;
                if (distance(this.x, this.y, target.x, target.y) < currentRadius + targetRadius) {
                    if (typeof target.takeDamage === 'function') target.takeDamage(FLAME_PARTICLE_DAMAGE, 'flame');
                    this.damagedTargets.add(target);
                }
            }
        };
        if (zombies && zombies.length > 0) zombies.forEach(checkCollision);
        if (turrets && turrets.length > 0) turrets.forEach(checkCollision);
    }
    draw(ctx, offsetX, offsetY) { if (!this.active) return; const gridX = Math.floor(this.x / TILE_SIZE); const gridY = Math.floor(this.y / TILE_SIZE); if (typeof level !== 'undefined' && level.fogGrid && level.fogGrid[gridY]?.[gridX] !== FOG_STATE.REVEALED) return; const lifeRatio = Math.max(0, this.lifespan / this.startLifespan); const growRatio = 1.0 - lifeRatio; const currentRadius = lerp(this.startRadius, this.endRadius, growRatio); if (isNaN(currentRadius) || currentRadius <= 0.1) return; const alpha = Math.max(0, lifeRatio * (this.isWallHitParticle ? 0.8 : 1.0)); let r, g, b; if (lifeRatio > 0.5) { const t = (lifeRatio - 0.5) * 2; r = lerp(this.colorMid[0], this.colorStart[0], t); g = lerp(this.colorMid[1], this.colorStart[1], t); b = lerp(this.colorMid[2], this.colorStart[2], t); } else { const t = lifeRatio * 2; r = lerp(this.colorEnd[0], this.colorMid[0], t); g = lerp(this.colorEnd[1], this.colorMid[1], t); b = lerp(this.colorEnd[2], this.colorMid[2], t); } r = Math.max(0, Math.min(255, Math.round(r))); g = Math.max(0, Math.min(255, Math.round(g))); b = Math.max(0, Math.min(255, Math.round(b))); ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`; ctx.beginPath(); ctx.arc(this.x - offsetX, this.y - offsetY, currentRadius, 0, Math.PI * 2); ctx.fill(); }
}

class TemporarySpriteEffect {
    constructor(x, y, image, durationMs, startScale = 1.0, endScale = 1.0, rotation = 0, fixedSize = null, initialScaleX = 1.0, initialScaleY = 1.0) { // <<<< Added scaleX/Y
        this.x = x;
        this.y = y;
        this.image = image;
        this.durationMs = durationMs;
        this.lifespan = durationMs;
        this.startScale = startScale;
        this.endScale = endScale;
        this.currentScale = startScale; // This will be the general scale factor
        this.scaleX = initialScaleX;    // Specific X scale factor (for mirroring)
        this.scaleY = initialScaleY;    // Specific Y scale factor
        this.rotation = rotation;
        this.fixedWidth = fixedSize ? fixedSize.width : null;
        this.fixedHeight = fixedSize ? fixedSize.height : null;
        this.active = true;
    }

    update(effectiveDt) {
        if (!this.active) return;
        this.lifespan -= effectiveDt * 1000;
        if (this.lifespan <= 0) {
            this.active = false;
            return;
        }
        const progress = 1 - (this.lifespan / this.durationMs);
        this.currentScale = lerp(this.startScale, this.endScale, progress);
    }

    draw(ctx, offsetX, offsetY, playerAngle = 0) {
        if (!this.active || !this.image || !this.image.complete || this.image.naturalHeight === 0) return;

        const gridX = Math.floor(this.x / TILE_SIZE);
        const gridY = Math.floor(this.y / TILE_SIZE);
        if (typeof level !== 'undefined' && level.fogGrid?.[gridY]?.[gridX] !== FOG_STATE.REVEALED) return;

        ctx.save();
        ctx.translate(this.x - offsetX, this.y - offsetY);

        if (this.rotation === 'player') {
            ctx.rotate(playerAngle);
        } else if (typeof this.rotation === 'number') {
            ctx.rotate(this.rotation);
        }
        
        // Apply individual scaling factors (for mirroring)
        ctx.scale(this.scaleX, this.scaleY);


        const imgWidth = this.fixedWidth ? this.fixedWidth : this.image.naturalWidth;
        const imgHeight = this.fixedHeight ? this.fixedHeight : this.image.naturalHeight;

        // Apply general currentScale on top of individual scaleX/Y
        const drawWidth = imgWidth * this.currentScale;
        const drawHeight = imgHeight * this.currentScale;


        const alphaProgress = this.lifespan / this.durationMs;
        let alpha;
        if (this.durationMs - this.lifespan < this.durationMs * 0.2) {
            alpha = (this.durationMs - this.lifespan) / (this.durationMs * 0.2);
        } else {
            alpha = this.lifespan / (this.durationMs * 0.8);
        }
        alpha = Math.max(0, Math.min(1, alpha));


        ctx.globalAlpha = alpha;

        ctx.drawImage(this.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

        ctx.restore();
    }
}
// --- END OF FILE particles.js ---
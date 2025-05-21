// --- START OF FILE ui.js ---

// --- ui.js ---
// Assumes globals: ctx, canvas, input (for mouse position in updateCharacterSelection)
// Assumes window.player, window.kills, window.elapsedTime, window.zombies, window.turrets, window.powerupDisplayMessages, imgCharSelectBg (from game_setup.js)
// Assumes constants: classes, weapons, TurretState, ENGINEER_MAX_TURRETS, CLASS_ID, WEAPON_ID, PSION_SHIELD_HP, PSI_BLAST_MIN_SHIELD_COST, ENGINEER_DRONE_COUNT
// Assumes wrapText utility function is available globally

if (typeof window.selectionBoxes === 'undefined') {
    window.selectionBoxes = [];
}
let hoveredClassIndex = -1;
const DEFAULT_FONT_FAMILY = "'PixelOperatorBold', Arial, sans-serif";

function updateCharacterSelection() {
    hoveredClassIndex = -1;
    if (!canvas || !input || !window.selectionBoxes) return;
    const mouseCanvasX = input.mouseX;
    const mouseCanvasY = input.mouseY;

    for (const box of window.selectionBoxes) {
        if (mouseCanvasX >= box.rect.x && mouseCanvasX <= box.rect.x + box.rect.w &&
            mouseCanvasY >= box.rect.y && mouseCanvasY <= box.rect.y + box.rect.h) {
            hoveredClassIndex = box.classIndex;
            break;
        }
    }
}

function drawCharacterSelection() {
    window.selectionBoxes = [];
    ctx.textAlign = 'left';

    if (window.imgCharSelectBg && window.imgCharSelectBg.complete && window.imgCharSelectBg.naturalHeight !== 0) {
        ctx.drawImage(window.imgCharSelectBg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#3E3546';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const numClasses = classes.length;
    const boxWidth = Math.floor(canvas.width / (numClasses + 1.8)); // Slightly wider boxes for more text
    const boxHeight = Math.floor(boxWidth * 0.85); // Taller boxes for more lines
    const spacing = Math.floor(boxWidth * 0.12);

    const textBlockPadding = Math.floor(boxWidth * 0.08);
    const headerHeight = Math.floor(boxHeight * 0.22);

    if (typeof classes === 'undefined') {
        console.error("Classes array not defined for drawCharacterSelection");
        ctx.fillStyle = 'white';
        ctx.font = `20px ${DEFAULT_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText("Loading Character Data...", canvas.width / 2, canvas.height / 2);
        return;
    }

    const totalWidth = (numClasses * boxWidth) + ((numClasses - 1) * spacing);
    const startX = (canvas.width - totalWidth) / 2;
    const startY = canvas.height * 0.68; // Position boxes lower, below the character strip

    const titleFontSize = Math.max(22, Math.floor(canvas.width / 42));
    ctx.font = `${titleFontSize}px ${DEFAULT_FONT_FAMILY}`;
    ctx.fillStyle = 'rgba(230, 230, 230, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    ctx.textAlign = 'center';
    // Position title higher up, assuming character strip takes the middle portion
    ctx.fillText(`CHOOSE YOUR CLASS (PRESS 1-${numClasses} OR CLICK)`, canvas.width / 2, canvas.height * 0.12);
    ctx.shadowBlur = 0;

    // Font sizes scaled for readability
    const classNameFontSize = Math.floor(boxHeight * 0.15); // Approx 22px for 150px boxHeight
    const descFontSize = Math.floor(boxHeight * 0.12);    // Approx 18px
    const statFontSize = Math.floor(boxHeight * 0.11);    // Approx 16px

    classes.forEach((cls, index) => {
        const boxX = startX + index * (boxWidth + spacing);
        const boxY = startY;
        window.selectionBoxes.push({ classIndex: index, rect: { x: boxX, y: boxY, w: boxWidth, h: boxHeight } });

        ctx.fillStyle = 'rgba(15, 15, 25, 0.85)'; // Darker box background
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.strokeStyle = (hoveredClassIndex === index) ? '#FFFF99' : 'rgba(100, 100, 120, 0.5)';
        ctx.lineWidth = (hoveredClassIndex === index) ? 2 : 1;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        let headerFillStyle = cls.color || 'grey';
        const tempFill = ctx.fillStyle;
        ctx.fillStyle = headerFillStyle;
        const parsedColor = ctx.fillStyle;
        ctx.fillStyle = tempFill;
        if (parsedColor.startsWith('#')) {
            const r = parseInt(parsedColor.slice(1,3), 16);
            const g = parseInt(parsedColor.slice(3,5), 16);
            const b = parseInt(parsedColor.slice(5,7), 16);
            headerFillStyle = `rgba(${r},${g},${b},0.70)`;
        } else {
            headerFillStyle = `rgba(100,100,100,0.70)`;
        }
        ctx.fillStyle = headerFillStyle;
        ctx.fillRect(boxX + 1, boxY + 1, boxWidth - 2, headerHeight);

        ctx.font = `${classNameFontSize}px ${DEFAULT_FONT_FAMILY}`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`(${index + 1}) ${cls.name.toUpperCase()}`, boxX + boxWidth / 2, boxY + headerHeight - (classNameFontSize * 0.28));

        ctx.textAlign = 'left';
        let currentTextY = boxY + headerHeight + textBlockPadding + (descFontSize * 0.4);

        ctx.font = `${descFontSize}px ${DEFAULT_FONT_FAMILY}`;
        ctx.fillStyle = 'rgba(220, 220, 230, 1)';

        let shortDesc = "";
        // Keywords, weapon removed from this line
        switch(cls.id) {
            case CLASS_ID.RECON:     shortDesc = "SCOUT | BULLET TIME"; break;
            case CLASS_ID.MARINE:    shortDesc = "SOLDIER | GRENADES | 6 MERCS"; break;
            case CLASS_ID.DEVASTATOR:shortDesc = "AOE DPS | FLAMETHROWER | RPG"; break;
            case CLASS_ID.BRAWLER:   shortDesc = "TANK | DASH | REGEN"; break;
            case CLASS_ID.PSION:     shortDesc = "AGILE | PSI BLADES | SHIELD"; break;
            case CLASS_ID.ENGINEER:  shortDesc = "SUPPORT | TURRETS & DRONES"; break;
        }
        const descLineHeight = descFontSize * 1.2;
        const descLines = wrapText(ctx, shortDesc.toUpperCase(), boxWidth - textBlockPadding * 2); // CAPSLOCK
        descLines.forEach(line => {
            ctx.fillText(line, boxX + textBlockPadding, currentTextY);
            currentTextY += descLineHeight;
        });
        currentTextY += descFontSize * 0.4;

        ctx.font = `${statFontSize}px ${DEFAULT_FONT_FAMILY}`;
        ctx.fillStyle = 'rgba(210, 210, 220, 1)';
        const statLineHeight = statFontSize * 1.25;

        let hpStat = `HP: ${cls.hp}`;
        if (cls.id === CLASS_ID.PSION) hpStat += ` SH: ${PSION_SHIELD_HP}`;
        else if (cls.id === CLASS_ID.BRAWLER && cls.passive && cls.passive.type === 'hp_regen_brawler') hpStat += ` (REGEN)`;
        ctx.fillText(hpStat.toUpperCase(), boxX + textBlockPadding, currentTextY); // CAPSLOCK
        currentTextY += statLineHeight;

        const weapon = weapons.find(w => w.id === cls.weaponId);
        ctx.fillText(`WPN: ${weapon ? weapon.name.toUpperCase() : 'N/A'}`, boxX + textBlockPadding, currentTextY); // CAPSLOCK
    });
     ctx.textAlign = 'left';
     ctx.lineWidth = 1;
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'red';
    ctx.font = `72px ${DEFAULT_FONT_FAMILY}`;
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = 'white';
    ctx.font = `32px ${DEFAULT_FONT_FAMILY}`;
    ctx.fillText(`Kills: ${window.kills}`, canvas.width / 2, canvas.height / 2 + 20);

    const finalTimeMinutes = Math.floor(window.elapsedTime / 60);
    const finalTimeSeconds = Math.floor(window.elapsedTime % 60);
    const finalTimeString = `${finalTimeMinutes.toString().padStart(2, '0')}:${finalTimeSeconds.toString().padStart(2, '0')}`;
    ctx.fillText(`Time: ${finalTimeString}`, canvas.width / 2, canvas.height / 2 + 70);

    ctx.textAlign = 'left';
}

function drawGameWon() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'lime';
    ctx.font = `72px ${DEFAULT_FONT_FAMILY}`;
    ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = 'white';
    ctx.font = `32px ${DEFAULT_FONT_FAMILY}`;
    ctx.fillText(`Kills: ${window.kills}`, canvas.width / 2, canvas.height / 2 + 20);

    const finalTimeMinutes = Math.floor(window.elapsedTime / 60);
    const finalTimeSeconds = Math.floor(window.elapsedTime % 60);
    const finalTimeString = `${finalTimeMinutes.toString().padStart(2, '0')}:${finalTimeSeconds.toString().padStart(2, '0')}`;
    ctx.fillText(`Time: ${finalTimeString}`, canvas.width / 2, canvas.height / 2 + 70);

    ctx.textAlign = 'left';
}


function drawUI() {
    if (!window.player || !window.player.active || typeof TurretState === 'undefined') return;
    const DEFAULT_UI_FONT_SIZE = "14px";
    const LARGER_UI_FONT_SIZE = "16px";

    ctx.font = `${DEFAULT_UI_FONT_SIZE} ${DEFAULT_FONT_FAMILY}`;

    const player = window.player;
    const weapon = player.currentWeapon;
    const barHeight = 18;
    const hpBarWidth = 180;
    const hpBarX = 10;
    const hpBarY = canvas.height - barHeight - 10;

    ctx.fillStyle = 'red'; ctx.fillRect(hpBarX, hpBarY, hpBarWidth, barHeight);
    ctx.fillStyle = 'lime'; const hpWidth = player.maxHp > 0 ? (player.hp / player.maxHp) * hpBarWidth : 0; ctx.fillRect(hpBarX, hpBarY, hpWidth > 0 ? hpWidth : 0, barHeight);
    ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, barHeight);
    ctx.fillStyle = 'white'; ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, hpBarX + 5, hpBarY + barHeight - 4);

    if (player.isPsion) {
        const shieldBarWidth = hpBarWidth * 0.8;
        const shieldBarX = hpBarX;
        const shieldBarY = hpBarY - barHeight - 5;
        ctx.fillStyle = 'rgba(50, 50, 100, 0.8)'; ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth, barHeight);
        ctx.fillStyle = 'rgba(170, 100, 255, 0.9)'; const shieldWidth = player.maxShieldHp > 0 ? (player.shieldHp / player.maxShieldHp) * shieldBarWidth : 0; ctx.fillRect(shieldBarX, shieldBarY, shieldWidth > 0 ? shieldWidth : 0, barHeight);
        ctx.strokeStyle = 'rgba(220, 180, 255, 0.9)'; ctx.lineWidth = 1; ctx.strokeRect(shieldBarX, shieldBarY, shieldBarWidth, barHeight);
        ctx.fillStyle = 'white';
        ctx.fillText(`SH: ${Math.floor(player.shieldHp)}/${player.maxShieldHp}`, shieldBarX + 5, shieldBarY + barHeight - 4);
    }

    ctx.font = `${LARGER_UI_FONT_SIZE} ${DEFAULT_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    if (weapon.id !== WEAPON_ID.PSI_BLADES) {
        let ammoText = `AMMO: ${player.ammo} / ${weapon.magSize === Infinity ? '∞' : weapon.magSize}`; // CAPSLOCK
        let ammoColor = 'white';
        if (player.reloading) {
            const realReloadTimeLeft = Math.max(0, weapon.reloadTime - player.reloadTimer);
            ammoText = `RELOADING... (${(realReloadTimeLeft / 1000).toFixed(1)}s)`; ammoColor = 'yellow';
        } else if (player.ammo <= 0 && !player.reloading && weapon.magSize !== Infinity) {
            ammoText = "RELOAD NEEDED"; ammoColor = 'orange';
        }
        ctx.fillStyle = ammoColor;
        ctx.fillText(ammoText, canvas.width - 15, canvas.height - 20);
        ctx.fillStyle = 'white';
        ctx.fillText(`${weapon.name.toUpperCase()}`, canvas.width - 15, canvas.height - 70); // CAPSLOCK
    } else {
        ctx.fillStyle = 'white';
        ctx.fillText(`${weapon.name.toUpperCase()}`, canvas.width - 15, canvas.height - 70); // CAPSLOCK
    }

    let abilityName = player.abilityType.replace(/_/g, ' ');
    abilityName = abilityName.charAt(0).toUpperCase() + abilityName.slice(1);
    if (player.classData.id === CLASS_ID.DEVASTATOR && player.abilityType === 'rpg') abilityName = `RPG (${player.abilityUsesLeft} LEFT)`; // CAPSLOCK
    else if (player.isBrawler && player.abilityType === 'dash') abilityName = 'DASH'; // CAPSLOCK
    else if (player.isRecon && player.abilityType === 'bullet_time') abilityName = 'BULLET TIME'; // CAPSLOCK
    else if (player.isEngineer && player.abilityType === 'turret') abilityName = 'MANAGE TURRETS'; // CAPSLOCK
    else if (player.isPsion && player.abilityType === 'psi_blast') abilityName = 'PSI BLAST'; // CAPSLOCK

    let abilityText = `ABILITY: ${abilityName}`; let abilityColor = 'white'; // CAPSLOCK "ABILITY"

    if (player.isBrawler) {
        abilityText = `ABILITY: DASH [${player.abilityCharges}/${player.abilityMaxCharges}]`;
        if (player.abilityCharges < player.abilityMaxCharges && player.abilityRechargeTimer > 0) {
            abilityText += ` ( ${(player.abilityRechargeTimer / 1000).toFixed(1)}S)`; // CAPSLOCK
            abilityColor = 'yellow';
        } else if (player.abilityCharges === 0) { abilityColor = 'grey'; }
        else { abilityColor = 'lime'; }
    } else if (player.isRecon && player.abilityType === 'bullet_time') {
        if (player.abilityCooldownTimer > 0 && !player.isBulletTimeActive) { abilityText += ` (CD ${(player.abilityCooldownTimer / 1000).toFixed(1)}S)`; abilityColor = 'yellow';} // CAPSLOCK
        else { abilityColor = 'lime'; }
    } else if (player.isPsion) {
        if (player.abilityCooldownTimer > 0) { abilityText += ` (CD ${(player.abilityCooldownTimer / 1000).toFixed(1)}S)`; abilityColor = 'yellow'; } // CAPSLOCK
        else if (player.shieldHp < PSI_BLAST_MIN_SHIELD_COST) { abilityText += ` (NEED ${PSI_BLAST_MIN_SHIELD_COST} SH)`; abilityColor = 'grey'; } // CAPSLOCK
        else { abilityColor = 'lime'; }
        if (player.isCastingPsiBlast) { abilityText += " (CAST...)"; abilityColor = 'yellow'; } // CAPSLOCK
    } else if (player.isEngineer) {
        if (player.abilityCooldownTimer > 0) { abilityText += ` (CD ${(player.abilityCooldownTimer / 1000).toFixed(1)}S)`; abilityColor = 'yellow'; } // CAPSLOCK
        else { const activeTurrets = window.turrets.filter(t => t.owner === player && (t.state === TurretState.ACTIVE || t.state === TurretState.DEPLOYING)).length; if (activeTurrets < ENGINEER_MAX_TURRETS) { abilityText += " (DEPLOY)"; } else { abilityText += ` (RECALL ${player.nextTurretToRecall + 1})`; } abilityColor = 'lime'; } // CAPSLOCK
    } else if (player.classData.id !== CLASS_ID.DEVASTATOR) {
        if (player.abilityUsesTotal !== Infinity) { abilityText += ` [${player.abilityUsesLeft}/${player.abilityUsesTotal}]`; }
        if (player.abilityCooldownTimer > 0) { abilityText += ` (CD ${(player.abilityCooldownTimer / 1000).toFixed(1)}S)`; abilityColor = 'yellow'; } // CAPSLOCK
        else if (player.abilityUsesLeft === 0 && player.abilityUsesTotal !== Infinity) { abilityText += " (EMPTY)"; abilityColor = 'grey'; } // CAPSLOCK
        else { abilityColor = 'lime'; }
    }

    if (player.isBulletTimeActive) { abilityText += ` (ACTIVE ${(player.bulletTimeTimer / 1000).toFixed(1)}S)`; abilityColor = 'cyan'; } // CAPSLOCK

    ctx.fillStyle = abilityColor; ctx.fillText(abilityText, canvas.width - 15, canvas.height - 45);

    ctx.font = `${DEFAULT_UI_FONT_SIZE} ${DEFAULT_FONT_FAMILY}`;
    ctx.textAlign = 'left'; ctx.fillStyle = 'white';
    const aliveZombies = window.zombies ? window.zombies.length : 0; ctx.fillText(`ZOMBIES: ${aliveZombies}`, 15, 20); // CAPSLOCK
    ctx.fillText(`KILLS: ${window.kills}`, 15, 40); // CAPSLOCK
    const timeMinutes = Math.floor(window.elapsedTime / 60); const timeSeconds = Math.floor(window.elapsedTime % 60);
    ctx.fillText(`TIME: ${timeMinutes.toString().padStart(2, '0')}:${timeSeconds.toString().padStart(2, '0')}`, 15, 60); // CAPSLOCK
    if (player.isEngineer && window.turrets) { const deployedTurretCount = window.turrets.filter(t => t.owner === player && (t.state === TurretState.ACTIVE || t.state === TurretState.DEPLOYING)).length; ctx.fillText(`TURRETS: ${deployedTurretCount}/${ENGINEER_MAX_TURRETS}`, 15, 80); } // CAPSLOCK

    if (window.powerupDisplayMessages && window.powerupDisplayMessages.length > 0) {
        ctx.font = `bold 16px ${DEFAULT_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        const baseY = canvas.height * 0.80;
        const msgLineHeight = 20;
        const FADE_DURATION = 600;
        const MAX_MESSAGE_WIDTH = canvas.width * 0.5;

        window.powerupDisplayMessages.forEach((msg, index) => {
            let alpha = 1.0;
            if (msg.timer < FADE_DURATION) {
                alpha = Math.max(0, msg.timer / FADE_DURATION);
            } else if (msg.timer > msg.initialTimer - FADE_DURATION) {
                alpha = Math.max(0, (msg.initialTimer - msg.timer) / FADE_DURATION);
            }

            let linesToDraw = [msg.text];
            if (typeof wrapText === 'function' && ctx.measureText(msg.text).width > MAX_MESSAGE_WIDTH) {
                linesToDraw = wrapText(ctx, msg.text, MAX_MESSAGE_WIDTH);
            }

            let totalMessageHeight = linesToDraw.length * msgLineHeight;
            let startYOffset = baseY - (window.powerupDisplayMessages.length - 1 - index) * totalMessageHeight - (totalMessageHeight / 2);

            linesToDraw.forEach((line, lineIndex) => {
                const textMetrics = ctx.measureText(line);
                const textWidth = textMetrics.width;
                const textHeight = parseInt(ctx.font, 10) * 0.9;

                ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
                ctx.fillRect(
                    canvas.width / 2 - textWidth / 2 - 8,
                    startYOffset + (lineIndex * msgLineHeight) - textHeight * 0.85,
                    textWidth + 16,
                    textHeight + 4
                );

                ctx.fillStyle = `rgba(255, 223, 186, ${alpha * 0.98})`;
                ctx.fillText(line.toUpperCase(), canvas.width / 2, startYOffset + (lineIndex * msgLineHeight)); // CAPSLOCK for powerup messages
            });
        });
        ctx.textAlign = 'left';
    }
    ctx.textAlign = 'left'; ctx.lineWidth = 1;
}
// --- END OF FILE ui.js ---
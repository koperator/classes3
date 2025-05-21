// --- START OF FILE powerup.js ---
// Assumes globals: performance, Math, POWERUP_SIZE, POWERUP_COLOR_DEFAULT, powerupConfig (from constants.js)
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = powerupConfig[type];
        this.radius = POWERUP_SIZE / 1.5;
        this.active = true;
        this.color = this.config.color || POWERUP_COLOR_DEFAULT;
        this.angle = 0; // For potential spin effect
        this.bobOffset = 0;
        this.bobSpeed = 0.05;
        this.bobAmount = 3;
    }

    update(effectiveDt) {
        if (!this.active) return;
        this.angle += 0.01 * effectiveDt * 60; // Simple spin
        this.bobOffset = Math.sin(performance.now() * 0.002) * this.bobAmount;
    }

    draw(ctx, offsetX, offsetY) {
        if (!this.active) return;
        const drawX = this.x - offsetX;
        const drawY = this.y - offsetY + this.bobOffset;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * this.radius,
                       -Math.sin((18 + i * 72) / 180 * Math.PI) * this.radius);
            ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (this.radius * 0.5),
                       -Math.sin((54 + i * 72) / 180 * Math.PI) * (this.radius * 0.5));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Optional: Tooltip for debugging or if desired in game
        // ctx.fillStyle = "rgba(0,0,0,0.5)";
        // ctx.fillRect(drawX - 50, drawY - this.radius - 25, 100, 20);
        // ctx.fillStyle = "white";
        // ctx.font = "10px Arial";
        // ctx.textAlign = "center";
        // ctx.fillText(this.config.name, drawX, drawY - this.radius - 12);
        // ctx.textAlign = "left";
    }
}
// --- END OF FILE powerup.js ---
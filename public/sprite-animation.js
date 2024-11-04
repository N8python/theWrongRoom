export class SpriteSheet {
    constructor(image, frameWidth = 16, frameHeight = 32, sheetWidth = 64, sheetHeight = 96) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.sheetWidth = sheetWidth;
        this.sheetHeight = sheetHeight;

        // Calculate frames per row/column
        this.framesPerRow = Math.floor(sheetWidth / frameWidth);
        this.framesPerColumn = Math.floor(sheetHeight / frameHeight);

        // Direction constants (matching sheet layout)
        this.FACING = {
            LEFT: 0,
            DOWN: 1,
            UP: 2,
            RIGHT: 3
        };
        this.scale = 14;
    }

    drawFrame(ctx, frameX, frameY, canvasX, canvasY) {
        // Draw shadow first
        ctx.save();
        ctx.translate(canvasX + this.frameWidth * (this.scale / 2) + this.scale * this.frameHeight * (1 / 5) + this.frameHeight * 4 / 5, canvasY + this.frameHeight * (this.scale * 4 / 5));
        ctx.transform(1, 0, -0.5, 0.2, 0, 0); // Skew and flatten
        ctx.fillStyle = 'black';
        ctx.globalAlpha = 0.5; // Make shadow semi-transparent

        // Draw a solid black shadow shape
        ctx.fillRect(0, 0, this.frameWidth * this.scale, this.frameHeight * this.scale);
        ctx.restore();

        // Draw the actual sprite
        ctx.drawImage(
            this.image,
            frameX * this.frameWidth,
            frameY * this.frameHeight,
            this.frameWidth,
            this.frameHeight,
            canvasX,
            canvasY,
            this.frameWidth * this.scale,
            this.frameHeight * this.scale
        );
    }

    getFrameForDirection(direction, walkFrame = 0) {
        return {
            x: direction,
            y: walkFrame % 3
        };
    }
}

export class CharacterSprite {
    constructor(spriteSheet, x = 0, y = 0) {
        this.spriteSheet = spriteSheet;
        this.x = x;
        this.y = y;
        this.currentDirection = spriteSheet.FACING.DOWN;
        this.walkFrame = 0;
        this.animationSpeed = 50; // ms per frame
        this.lastFrameTime = 0;
    }

    update(currentTime) {
        if (currentTime - this.lastFrameTime > this.animationSpeed) {
            this.walkFrame = (this.walkFrame + 1) % 3;
            this.lastFrameTime = currentTime;
        }
    }

    draw(ctx) {
        const frame = this.spriteSheet.getFrameForDirection(this.currentDirection, this.walkFrame);
        this.spriteSheet.drawFrame(ctx, frame.x, frame.y, this.x, this.y);
    }

    setDirection(direction) {
        this.currentDirection = direction;
    }
}

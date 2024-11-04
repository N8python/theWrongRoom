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
    }

    drawFrame(ctx, frameX, frameY, canvasX, canvasY) {

        ctx.drawImage(
            this.image,
            frameX * this.frameWidth,
            frameY * this.frameHeight,
            this.frameWidth,
            this.frameHeight,
            canvasX,
            canvasY,
            this.frameWidth * 14,
            this.frameHeight * 14
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
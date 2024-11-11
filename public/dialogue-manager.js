export class DialogueManager {
    constructor(game) {
        this.game = game;
        this.currentLine = 0;
        this.bossFrames = [];
        this.currentFrame = 0;
        this.frameTime = 0;
        this.dialogueLines = [
            "Hello there.",
            "This is line two.",
            "Joe biden joe biden good luck."
        ];
        this.isActive = false;
        this.frameRate = 200; // ms per frame
    }

    async initialize() {
        // Load boss images
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `sprites/boss${i}.png`;
            await new Promise(resolve => img.onload = resolve);
            this.bossFrames.push(img);
        }

        // Create dialogue overlay
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        this.bossImage = document.createElement('img');
        this.bossImage.style.cssText = `
            width: 256px;
            height: 256px;
            image-rendering: pixelated;
            margin-bottom: 20px;
        `;

        this.dialogueBox = document.createElement('div');
        this.dialogueBox.style.cssText = `
            background: rgba(62, 47, 35, 0.9);
            padding: 20px;
            border-radius: 10px;
            max-width: 600px;
            color: #e6d4b6;
            font-size: 24px;
            text-align: center;
            border: 2px solid #e6d4b6;
        `;

        this.overlay.appendChild(this.bossImage);
        this.overlay.appendChild(this.dialogueBox);

        // Add click handler
        this.overlay.addEventListener('click', () => this.advance());
    }

    start() {
        this.isActive = true;
        this.currentLine = 0;
        this.currentFrame = 0;
        this.frameTime = performance.now();
        document.body.appendChild(this.overlay);
        this.updateDialogue();
        this.animate();
    }

    advance() {
        this.currentLine++;
        if (this.currentLine >= this.dialogueLines.length) {
            this.end();
            return;
        }
        this.updateDialogue();
    }

    updateDialogue() {
        this.dialogueBox.textContent = this.dialogueLines[this.currentLine];
    }

    animate() {
        if (!this.isActive) return;

        const currentTime = performance.now();
        if (currentTime - this.frameTime > this.frameRate) {
            this.currentFrame = (this.currentFrame + 1) % this.bossFrames.length;
            this.bossImage.src = this.bossFrames[this.currentFrame].src;
            this.frameTime = currentTime;
        }

        requestAnimationFrame(() => this.animate());
    }

    end() {
        this.isActive = false;
        document.body.removeChild(this.overlay);
        this.game.startGameplay();
    }
}
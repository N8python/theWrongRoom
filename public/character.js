import { generateRandomSprite } from './sprite-generator.js';
import { SpriteSheet, CharacterSprite } from './sprite-animation.js';
import { faker } from 'https://esm.sh/@faker-js/faker';

class CharacterManager {
    constructor(game) {
        this.game = game;
    }

    async initialize() {
        // Nothing.
    }

    async createCharacter() {
        let sex = faker.person.sex();
        const spriteCanvas = await generateRandomSprite(sex);
        const spriteSheet = new SpriteSheet(spriteCanvas);
        this.game.currentCharacterSprite = new CharacterSprite(spriteSheet, 24, 32);
        this.game.currentCharacterSprite.setDirection(spriteSheet.FACING.RIGHT);
        this.game.currentCharacterSprite.x = -7;
        this.game.currentCharacterSprite.y = 0;

        // Add character mesh to scene
        this.game.renderer.scene.add(this.game.currentCharacterSprite.mesh);
    }

    handleAnimation() {
        if (this.game.animationType === 'entrance') {
            if (this.game.currentCharacterSprite.x < 0) {
                if (!this.game.audioManager.footsteps.isPlaying && this.game.audioManager.canPlay) {
                    this.game.audioManager.footsteps.play();
                }
                this.game.currentCharacterSprite.x += 0.015; // Adjust speed
            } else {
                //this.game.audioManager.footsteps
                this.game.audioManager.footsteps.pause();
                this.game.audioManager.footsteps.time = 0;
                this.game.isAnimating = false;
                this.game.currentCharacterSprite.walkFrame = 0;
                this.game.currentCharacterSprite.setDirection(this.game.currentCharacterSprite.spriteSheet.FACING.DOWN);
            }
        } else if (this.game.animationType === 'exit') {
            if (this.game.currentCharacterSprite.x < 7) {
                this.game.currentCharacterSprite.x += 0.015; // Adjust speed
                if (!this.game.audioManager.footsteps.isPlaying && this.game.audioManager.canPlay) {
                    this.game.audioManager.footsteps.play();
                }
            } else {
                this.game.audioManager.footsteps.pause();
                this.game.audioManager.footsteps.time = 0;
                // Remove the character mesh from the scene
                this.game.uiManager.nextSubjectButton.disabled = false;
                this.game.renderer.scene.remove(this.game.currentCharacterSprite.mesh);
                this.game.currentCharacterSprite.mesh.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.game.isAnimating = false;
            }
        }
    }
}

export { CharacterManager };
import { initializeSpriteAssets } from './sprite-generator.js';
import { Game } from './game.js';
import * as tts from './piper-tts-web/dist/piper-tts-web.js';
import { TTS } from './constants.js';
document.addEventListener('DOMContentLoaded', async() => {
    // Initialize game instance but don't start gameplay yet
    const game = new Game();
    
    // Load all assets first
    await initializeSpriteAssets();
    
    if (TTS) {
        document.getElementById('loading-message').textContent = 'Loading TTS';
        document.getElementById('loading-message').textContent = 'Warming Up TTS Inference';
        await tts.predict({
            text: 'dummy',
            voiceId: 'en_GB-vctk-medium',
            speakerId: 0
        }, (progress) => {
            document.getElementById('loading-message').textContent = `Loading TTS: ${progress.progress.toFixed(2)}%`;
        });
    }
    
    document.getElementById('loading-message').textContent = 'Initializing Game & Whisper';
    // Initialize game systems but don't start gameplay
    await game.initialize(false);
    
    // Hide loading screen and show main menu
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    
    // Add start game button listener
    document.getElementById('start-game').addEventListener('click', () => {
        document.getElementById('start-game').style.display = 'none';
        document.getElementById('clearance-selection').style.display = 'block';
    });

    document.querySelectorAll('.clearance-button').forEach(button => {
        button.addEventListener('click', () => {
            const level = parseInt(button.dataset.level);
            game.sessionManager.currentLevel = level;
            document.getElementById('main-menu').style.display = 'none';
            // Start with dialogue
            game.dialogueManager.start();
        });
    });

    window.addEventListener('beforeunload', async() => await game.cleanup());
});

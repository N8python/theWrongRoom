import { initializeSpriteAssets } from './sprite-generator.js';
import { Game } from './game.js';
import * as tts from './piper-tts-web/dist/piper-tts-web.js';
import { TTS } from './constants.js';
document.addEventListener('DOMContentLoaded', async() => {
    await initializeSpriteAssets();

    const game = new Game();
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
    await game.initialize();

    window.addEventListener('beforeunload', async() => await game.cleanup());
});
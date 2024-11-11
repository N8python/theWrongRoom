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

    // Setup clearance buttons
    document.querySelectorAll('.clearance-button').forEach(button => {
        if (button.id !== 'open-shop') {  // Skip shop button
            button.addEventListener('click', () => {
                const level = parseInt(button.dataset.level);
                game.sessionManager.currentLevel = level;
                document.getElementById('main-menu').style.display = 'none';
                // Start with dialogue
                game.dialogueManager.start();
            });
        }
    });

    // Setup shop functionality
    const shopMenu = document.getElementById('shop-menu');
    const openShop = document.getElementById('open-shop');
    const closeShop = document.getElementById('close-shop');
    const buyButtons = document.querySelectorAll('.buy-button');

    openShop.addEventListener('click', () => {
        document.getElementById('main-menu').style.display = 'none';
        shopMenu.style.display = 'flex';
    });

    closeShop.addEventListener('click', () => {
        shopMenu.style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
    });

    // Import upgrades
    const { UPGRADES } = await import('./upgrades.js');
    
    // Populate shop with upgrades
    function createUpgradeElement(upgrade) {
        return `
            <div class="shop-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(90, 72, 54, 0.5); border-radius: 8px; margin-bottom: 12px;">
                <div style="flex-grow: 1; margin-right: 16px;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 18px; font-weight: bold;">${upgrade.title}</span>
                    </div>
                    <div style="font-size: 14px; opacity: 0.8;">${upgrade.description}</div>
                </div>
                <button class="buy-button" data-item="${upgrade.id}" data-price="${upgrade.price}" style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; white-space: nowrap;">
                    <img src="sprites/note.png" style="width: 24px; height: 24px; image-rendering: pixelated;">
                    <span>${upgrade.price}</span>
                </button>
            </div>
        `;
    }

    document.getElementById('informational-upgrades').innerHTML = 
        UPGRADES.informational_upgrades.map(createUpgradeElement).join('');
    document.getElementById('passive-upgrades').innerHTML = 
        UPGRADES.passive_interrogation_upgrades.map(createUpgradeElement).join('');
    document.getElementById('active-upgrades').innerHTML = 
        UPGRADES.active_interrogation_upgrades.map(createUpgradeElement).join('');

    // Add buy handlers
    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.item;
            const price = parseInt(button.dataset.price);
            console.log(`Purchased ${itemId} for ${price} notes`);
            // For now, purchases are free
        });
    });

    window.addEventListener('beforeunload', async() => await game.cleanup());
});

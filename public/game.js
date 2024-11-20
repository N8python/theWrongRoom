import { UIManager } from './ui.js';
import { Renderer } from './renderer.js';
import { CharacterManager } from './character.js';
import { MessageManager } from './message.js';
import { AudioManager } from './audio.js';
import { SessionManager } from './session.js';
import { DialogueManager } from './dialogue-manager.js';
import { ShopManager } from './shop.js';
import { TTS } from './constants.js';
import { BLINDED, COMPLIANCE } from './exclamations.js';
class Game {
    constructor() {
        this.uiManager = new UIManager(this);
        this.renderer = new Renderer(this);
        this.characterManager = new CharacterManager(this);
        this.messageManager = new MessageManager(this);
        this.audioManager = new AudioManager(this);
        this.sessionManager = new SessionManager(this);
        this.dialogueManager = new DialogueManager(this);
        this.summaryScreen = null;
        this.settingsOpen = false;

        this.currentSessionId = null;
        this.currentCodeWord = null;
        this.successCount = 0;
        this.totalCount = 0;
        this.currentCharacterSprite = null;
        this.isAnimating = false;
        this.animationType = 'idle';
        this.remainingGuesses = 3;
        this.subjectHasLeft = false;
        this.isTranscribing = false;
        this.isWhisperInitialized = window.gameStore.settings.whisper;
        this.mouse = { x: 0, y: 0 };
        this.debugCamera = false;
        this.playingAudio = false;
        this.noise = new Noise();
        this.audioEnabled = window.gameStore.settings.gameAudio;
        this.firstGame = true;
        this.notes = window.gameStore.notes;
        this.maxEnergy = window.gameStore.purchasedUpgradeIds.has("special_provisions") ? 90 : 40;
        this.currentEnergy = this.maxEnergy;
    }

    async initialize(startGameplay = false) {
        if (this.firstGame) {
            // Initialize UI state from stored settings
            const btn = document.getElementById('toggle-tts');
            btn.classList.toggle('disabled', !window.TTS);
            btn.innerHTML = window.TTS ? '<span class="icon">🗣️</span><span class="label">Voice Synthesis</span>' : '<span class="icon">🔇</span><span class="label">Voice Synthesis (Off)</span>';
            
            const whisperBtn = document.getElementById('toggle-whisper');
            whisperBtn.classList.toggle('disabled', !this.isWhisperInitialized);
            whisperBtn.innerHTML = this.isWhisperInitialized ? '<span class="icon">🎤</span><span class="label">Voice Recognition</span>' : '<span class="icon">🔇</span><span class="label">Voice Recognition (Off)</span>';
            
            const audioBtn = document.getElementById('toggle-sound');
            audioBtn.classList.toggle('disabled', !this.audioEnabled);
            audioBtn.innerHTML = this.audioEnabled ? '<span class="icon">🔊</span><span class="label">Game Audio</span>' : '<span class="icon">🔇</span><span class="label">Game Audio (Off)</span>';
            const { SummaryScreen } = await
            import ('./summary.js');
            this.summaryScreen = new SummaryScreen(this);
            await this.renderer.initialize();
            await this.audioManager.initialize();
            await this.sessionManager.initialize();
            await this.characterManager.initialize();
            await this.dialogueManager.initialize();
            this.uiManager.addEventListeners();
            this.setupSettingsMenu();

            // Add action button handlers
            const prisonBtn = document.getElementById('prison-btn');
            const flashlightBtn = document.getElementById('flashlight-btn');
            const syringeBtn = document.getElementById('syringe-btn');
            prisonBtn.disabled = !window.gameStore.purchasedUpgradeIds.has("entrapment");
            flashlightBtn.disabled = !window.gameStore.purchasedUpgradeIds.has("blinding_flash");
            syringeBtn.disabled = !window.gameStore.purchasedUpgradeIds.has("hypnotic_serum");

            prisonBtn.addEventListener('click', () => {
                if (!prisonBtn.disabled && this.useEnergy(10)) {
                    this.messageManager.noLeave = true;
                    prisonBtn.disabled = true;
                }
            });

            flashlightBtn.addEventListener('click', () => {
                if (!flashlightBtn.disabled && !syringeBtn.disabled && this.useEnergy(20)) {
                    this.messageManager.prefix = BLINDED[Math.floor(Math.random() * BLINDED.length)];
                    flashlightBtn.disabled = true;
                }
            });

            syringeBtn.addEventListener('click', () => {
                if (!syringeBtn.disabled && !flashlightBtn.disabled && this.useEnergy(40)) {
                    this.messageManager.prefix = COMPLIANCE[Math.floor(Math.random() * COMPLIANCE.length)];
                    syringeBtn.disabled = true;
                }
            });
            // Add energy management methods
            Game.prototype.updateEnergyUI = function() {
                const bar = document.getElementById('energy-bar');
                const text = document.getElementById('energy-text');
                const percentage = (this.currentEnergy / this.maxEnergy) * 100;
                bar.style.width = `${percentage}%`;
                text.textContent = `${this.currentEnergy}/${this.maxEnergy}`;
            }
            this.updateEnergyUI();

            Game.prototype.useEnergy = function(amount) {
                if (this.currentEnergy >= amount) {
                    this.currentEnergy -= amount;
                    this.updateEnergyUI();
                    return true;
                }
                return false;
            }
        }

        // Only start gameplay if specified
        if (startGameplay) {
            await this.startGameplay();
        }
    }

    async startGameplay() {
        document.getElementById('action-buttons').style.display = 'flex';
        this.sessionManager.subjectsInterrogated = 0; // Reset counter when starting new level
        // Start the actual gameplay loop
        await this.sessionManager.initializeSession();

        // Add audio control listeners
        if (this.firstGame) {
            document.getElementById('toggle-tts').addEventListener('click', () => this.toggleTTS());
            document.getElementById('toggle-whisper').addEventListener('click', () => this.toggleWhisper());
            document.getElementById('toggle-sound').addEventListener('click', () => this.toggleGameAudio());
        }
        this.firstGame = false;
    }

    setupSettingsMenu() {
        const settingsButton = document.getElementById('settings-button');
        const settingsMenu = document.getElementById('settings-menu');
        const closeSettings = document.getElementById('close-settings');
        const backToMenu = document.getElementById('back-to-menu');

        settingsButton.addEventListener('click', () => {
            settingsMenu.style.display = 'flex';
            this.settingsOpen = true;
        });

        closeSettings.addEventListener('click', () => {
            settingsMenu.style.display = 'none';
            this.settingsOpen = false;
        });

        backToMenu.addEventListener('click', async() => {
            await this.returnToMainMenu();
        });


        // Optional: Close settings when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsOpen) {
                settingsMenu.style.display = 'none';
                this.settingsOpen = false;
            }
        });
    }

    async returnToMainMenu() {
        // Clean up current session
        //await this.cleanup();
        // Remove character if present
        if (this.currentCharacterSprite && this.currentCharacterSprite.mesh) {
            this.renderer.scene.remove(this.currentCharacterSprite.mesh);
            this.currentCharacterSprite.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        document.getElementById('subject-name').textContent = '';
        document.getElementById('subject-sex').textContent = '';
        document.getElementById('subject-profession').textContent = '';
        document.getElementById('subject-resistance').textContent = '';
        document.getElementById('subject-emotion').textContent = '';
        document.getElementById('subject-background').textContent = '';
        document.getElementById('subject-history').textContent = '';
        document.getElementById('subject-secret-type').textContent = '';
        document.getElementById('action-buttons').style.display = 'none';
        const prisonBtn = document.getElementById('prison-btn');
        const flashlightBtn = document.getElementById('flashlight-btn');
        const syringeBtn = document.getElementById('syringe-btn');
        prisonBtn.disabled = !window.gameStore.purchasedUpgradeIds.has("entrapment");
        flashlightBtn.disabled = !window.gameStore.purchasedUpgradeIds.has("blinding_flash");
        syringeBtn.disabled = !window.gameStore.purchasedUpgradeIds.has("hypnotic_serum");
        // Reset game state
        this.currentSessionId = null;
        this.currentCodeWord = null;
        this.successCount = 0;
        this.totalCount = 0;
        // Don't reset notes when returning to menu
        document.getElementById('notes-count').textContent = this.notes;
        this.currentCharacterSprite = null;
        this.isAnimating = false;
        this.animationType = 'idle';
        this.remainingGuesses = 3;
        this.subjectHasLeft = false;

        // Clear UI
        this.uiManager.messageHistory.innerHTML = '';
        this.uiManager.messageInput.value = '';
        this.uiManager.guessInput.value = '';
        this.uiManager.guessResult.textContent = '';
        this.uiManager.submitGuessButton.disabled = false;
        this.uiManager.dontKnowButton.disabled = false;

        document.getElementById('guessing-section').style.display = 'none';
        document.getElementById('success-count').textContent = '0';
        document.getElementById('subjects-left').textContent = '5';
        document.getElementById('total-count').textContent = '0';
        document.getElementById('success-rate').textContent = '0%';

        // Hide game UI elements
        this.uiManager.nextSubjectButton.style.display = 'none';

        // Hide settings menu
        document.getElementById('settings-menu').style.display = 'none';
        this.settingsOpen = false;

        // Show main menu
        document.getElementById('main-menu').style.display = 'flex';


    }

    async cleanup() {
        await this.sessionManager.deleteSession();
        await this.audioManager.cleanup();
    }

    async handleSendMessage() {
        await this.messageManager.handleSendMessage();
    }

    handleAnimation() {
        this.characterManager.handleAnimation();
    }

    async handleSubmitGuess() {
        await this.sessionManager.handleSubmitGuess();
    }

    handleGiveUp() {
        this.sessionManager.handleGiveUp();
    }

    async handleNextSubject() {
        await this.sessionManager.handleNextSubject();
    }

    updateStats() {
        this.sessionManager.updateStats();
    }

    async startTranscription() {
        await this.audioManager.startTranscription();
    }

    stopTranscription() {
        this.audioManager.stopTranscription();
    }

    toggleTTS() {
        window.TTS = !window.TTS;
        window.gameStore.settings.tts = window.TTS;
        const btn = document.getElementById('toggle-tts');
        btn.classList.toggle('disabled', !window.TTS);
        btn.innerHTML = window.TTS ? '<span class="icon">🗣️</span><span class="label">Voice Synthesis</span>' : '<span class="icon">🔇</span><span class="label">Voice Synthesis (Off)</span>';
        saveGameState();
    }

    toggleWhisper() {
        this.isWhisperInitialized = !this.isWhisperInitialized;
        window.gameStore.settings.whisper = this.isWhisperInitialized;
        const btn = document.getElementById('toggle-whisper');
        btn.classList.toggle('disabled', !this.isWhisperInitialized);
        btn.innerHTML = this.isWhisperInitialized ? '<span class="icon">🎤</span><span class="label">Voice Recognition</span>' : '<span class="icon">🔇</span><span class="label">Voice Recognition (Off)</span>';
        saveGameState();
    }

    toggleGameAudio() {
        this.audioEnabled = !this.audioEnabled;
        window.gameStore.settings.gameAudio = this.audioEnabled;
        const btn = document.getElementById('toggle-sound');
        btn.classList.toggle('disabled', !this.audioEnabled);
        btn.innerHTML = this.audioEnabled ? '<span class="icon">🔊</span><span class="label">Game Audio</span>' : '<span class="icon">🔇</span><span class="label">Game Audio (Off)</span>';

        if (this.audioEnabled) {
            this.audioManager.backgroundTrack.play();
            this.audioManager.backgroundOfficeAmbience.play();
        } else {
            this.audioManager.backgroundTrack.pause();
            this.audioManager.backgroundOfficeAmbience.pause();
            this.audioManager.footsteps.pause();
            this.audioManager.lightFlicker.pause();
        }
        saveGameState();
    }
}

export { Game };

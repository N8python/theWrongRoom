import { UIManager } from './ui.js';
import { Renderer } from './renderer.js';
import { CharacterManager } from './character.js';
import { MessageManager } from './message.js';
import { AudioManager } from './audio.js';
import { SessionManager } from './session.js';
import { TTS } from './constants.js';

class Game {
    constructor() {
        this.uiManager = new UIManager(this);
        this.renderer = new Renderer(this);
        this.characterManager = new CharacterManager(this);
        this.messageManager = new MessageManager(this);
        this.audioManager = new AudioManager(this);
        this.sessionManager = new SessionManager(this);
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
        this.isWhisperInitialized = false;
        this.mouse = { x: 0, y: 0 };
        this.debugCamera = false;
        this.playingAudio = false;
        this.noise = new Noise();
        this.audioEnabled = true;
    }

    async initialize(startGameplay = false) {
        // Initialize components but don't start gameplay loop
        await this.renderer.initialize();
        await this.audioManager.initialize();
        await this.sessionManager.initialize();
        await this.characterManager.initialize();

        this.uiManager.addEventListeners();
        this.setupSettingsMenu();

        // Only start gameplay if specified
        if (startGameplay) {
            await this.startGameplay();
        }
    }

    async startGameplay() {
        // Start the actual gameplay loop
        await this.sessionManager.initializeSession();

        // Add audio control listeners
        document.getElementById('toggle-tts').addEventListener('click', () => this.toggleTTS());
        document.getElementById('toggle-whisper').addEventListener('click', () => this.toggleWhisper());
        document.getElementById('toggle-sound').addEventListener('click', () => this.toggleGameAudio());
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

        backToMenu.addEventListener('click', async () => {
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
        await this.cleanup();
        
        // Reset game state
        this.currentSessionId = null;
        this.currentCodeWord = null;
        this.successCount = 0;
        this.totalCount = 0;
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
        document.getElementById('guessing-section').style.display = 'none';
        document.getElementById('success-count').textContent = '0';
        document.getElementById('total-count').textContent = '0';
        document.getElementById('success-rate').textContent = '0%';
        
        // Hide game UI elements
        this.uiManager.nextSubjectButton.style.display = 'none';
        
        // Hide settings menu
        document.getElementById('settings-menu').style.display = 'none';
        this.settingsOpen = false;
        
        // Show main menu
        document.getElementById('main-menu').style.display = 'flex';
        
        // Remove character if present
        if (this.currentCharacterSprite && this.currentCharacterSprite.mesh) {
            this.renderer.scene.remove(this.currentCharacterSprite.mesh);
            this.currentCharacterSprite.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
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
        const btn = document.getElementById('toggle-tts');
        btn.classList.toggle('disabled', !window.TTS);
        btn.innerHTML = window.TTS ? '<span class="icon">🗣️</span><span class="label">Voice Synthesis</span>' : '<span class="icon">🔇</span><span class="label">Voice Synthesis (Off)</span>';
    }

    toggleWhisper() {
        this.isWhisperInitialized = !this.isWhisperInitialized;
        const btn = document.getElementById('toggle-whisper');
        btn.classList.toggle('disabled', !this.isWhisperInitialized);
        //btn.textContent = this.isWhisperInitialized ? '🎤' : '🔇';
        btn.innerHTML = this.isWhisperInitialized ? '<span class="icon">🎤</span><span class="label">Voice Recognition</span>' : '<span class="icon">🔇</span><span class="label">Voice Recognition (Off)</span>';
    }

    toggleGameAudio() {
        this.audioEnabled = !this.audioEnabled;
        const btn = document.getElementById('toggle-sound');
        btn.classList.toggle('disabled', !this.audioEnabled);
        btn.textContent = this.audioEnabled ? '<span class="icon">🔊</span><span class="label">Game Audio</span>' : '<span class="icon">🔇</span><span class="label">Game Audio (Off)</span>';

        if (this.audioEnabled) {
            this.audioManager.backgroundTrack.play();
            this.audioManager.backgroundOfficeAmbience.play();
        } else {
            this.audioManager.backgroundTrack.pause();
            this.audioManager.backgroundOfficeAmbience.pause();
            this.audioManager.footsteps.pause();
            this.audioManager.lightFlicker.pause();
        }
    }
}

export { Game };

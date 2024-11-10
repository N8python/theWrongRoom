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
    }

    async initialize() {
        // Initialize components
        await this.renderer.initialize();
        await this.audioManager.initialize();
        await this.sessionManager.initialize();
        await this.characterManager.initialize();

        this.uiManager.addEventListeners();
        await this.sessionManager.initializeSession();
        document.getElementById('loading-screen').style.display = 'none';
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
}

export { Game };
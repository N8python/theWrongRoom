class UIManager {
    constructor(game) {
        this.game = game;
        this.initUIElements();
    }

    initUIElements() {
        this.displayCanvas = document.getElementById('subject-sprite');
        this.displayCanvas.style.display = 'none';
        this.backgroundCanvas = document.getElementById('background-interrogation');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.nextSubjectButton = document.getElementById('next-subject');
        this.guessInput = document.getElementById('code-word-guess');
        this.submitGuessButton = document.getElementById('submit-guess');
        this.dontKnowButton = document.getElementById('give-up');
        this.guessResult = document.getElementById('guess-result');
        this.messageHistory = document.getElementById('message-history');
        this.recordingIndicator = document.createElement('div');
        this.recordingIndicator.style.display = 'none';
        this.recordingIndicator.style.position = 'fixed';
        this.recordingIndicator.style.bottom = '20px';
        this.recordingIndicator.style.right = '20px';
        this.recordingIndicator.style.backgroundColor = 'red'
        this.recordingIndicator.style.filter = 'sepia(1)';
        this.recordingIndicator.style.padding = '10px';
        this.recordingIndicator.style.borderRadius = '50%';
        this.recordingIndicator.style.animation = 'pulse 1s infinite';
        this.recordingIndicator.style.zIndex = '1000';
        this.nextSubjectButton.disabled = true;
        document.body.appendChild(this.recordingIndicator);

        // Add the style for the pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    addEventListeners() {
        this.sendButton.addEventListener('click', () => this.game.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.game.subjectHasLeft) {
                this.game.handleSendMessage();
                if (!this.game.hasTranscribedOnce) {
                    this.game.usedTextBox = true;
                }
            }
        });
        this.submitGuessButton.addEventListener('click', () => this.game.handleSubmitGuess());
        this.dontKnowButton.addEventListener('click', () => this.game.handleGiveUp());
        this.nextSubjectButton.addEventListener('click', () => this.game.handleNextSubject());
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitGuessButton.click();
        });
        document.addEventListener('keydown', async(e) => {
            // Only activate push-to-talk when NOT typing in the input box
            if (e.code === 'Space' && !this.game.isTranscribing &&
                this.game.isWhisperInitialized && document.activeElement !== this.messageInput && !this.game.playingAudio) {
                this.game.hasTranscribedOnce = true;
                e.preventDefault(); // Prevent space from scrolling
                await this.game.startTranscription();
            }
            if (e.code === 'KeyD' && document.activeElement !== this.messageInput) {
                this.game.debugCamera = !this.game.debugCamera;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.game.isTranscribing) {
                e.preventDefault();
                this.game.stopTranscription();
            }
        });
        document.addEventListener('mousemove', (e) => {
            this.game.mouse.x = -(e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
            this.game.mouse.y = -(e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        });
    }
}

export { UIManager };
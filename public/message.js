import * as tts from './piper-tts-web/dist/piper-tts-web.js';
import { TTS } from './constants.js';

class MessageManager {
    constructor(game) {
        this.game = game;
        this.prefix = null;
        this.noLeave = false;
    }

    async handleSendMessage() {
        const message = this.game.uiManager.messageInput.value.trim();
        if (!message) return;

        this.game.uiManager.messageInput.disabled = true;
        this.game.uiManager.sendButton.disabled = true;

        this.addMessageToChat(message, true);
        this.game.uiManager.messageInput.value = '';

        this.addMessageToChat('', false);

        let response = await this.sendMessage(message);
        if (response === null) {
            return;
        }

        if (response.includes('<LEAVES>') && !this.noLeave) {
            response = response.replace('<LEAVES>', '');
            this.editLastMessage((msg) => msg.replace('<LEAVES>', ''));
            this.game.currentCharacterSprite.setDirection(this.game.currentCharacterSprite.spriteSheet.FACING.RIGHT);
            this.game.isAnimating = true;
            this.game.animationType = 'exit';
            this.game.subjectHasLeft = true;
            document.getElementById('guessing-section').style.display = 'block';
            await this.game.sessionManager.deleteSession();
        }

        response = response.replace(/\*(.*?)\*/g, (_, action) => {
            return action;
        });

        if (window.TTS) {
            const wav = await tts.predict({
                text: response,
                voiceId: 'en_GB-vctk-medium',
                speakerId: this.game.presentSpeakerId
            });
            const audio = new Audio();
            audio.src = URL.createObjectURL(wav);
            this.game.playingAudio = true;
            if (this.game.transcriptionStarted) {
                const duration = (performance.now() - this.game.transcriptionStarted) / 1000;
                console.log("End-to-end latency:", duration.toFixed(2), "seconds");
            }
            audio.play();
            audio.onended = () => {
                this.game.playingAudio = false;
                this.game.uiManager.messageInput.disabled = false;
                this.game.uiManager.sendButton.disabled = false;


            }
        } else {
            this.game.uiManager.messageInput.disabled = false;
            this.game.uiManager.sendButton.disabled = false;
        }

        if (!this.game.hasTranscribedOnce) {
            this.game.uiManager.messageInput.focus();
        }
    }

    async sendMessage(message) {
        if (!this.game.currentSessionId) {
            console.error('No active session');
            return;
        }

        try {
            console.time('Time to first token')
            const response = await fetch(`/sessions/${this.game.currentSessionId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, prefix: this.prefix })
            });
            document.querySelector('button.action-button:nth-child(2)').disabled = false;
            document.querySelector('button.action-button:nth-child(3)').disabled = false;
            this.prefix = null;

            console.timeEnd('Time to first token')

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));

                        if (data.error) throw new Error(data.error);

                        if (data.chunk) {
                            this.updateLastMessage(data.chunk);
                            fullResponse += data.chunk;
                        }

                        if (data.done) return fullResponse;
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            return 'Error: Could not get response from server';
        }
    }

    updateLastMessage(chunk) {
        let lastMessage = this.game.uiManager.messageHistory.lastElementChild;

        if (!lastMessage || !lastMessage.classList.contains('ai')) {
            lastMessage = document.createElement('div');
            lastMessage.className = 'message ai';
            this.game.uiManager.messageHistory.appendChild(lastMessage);
        }

        lastMessage.textContent += chunk;
        this.game.uiManager.messageHistory.scrollTop = this.game.uiManager.messageHistory.scrollHeight;
    }

    editLastMessage(callback) {
        let lastMessage = this.game.uiManager.messageHistory.lastElementChild;

        if (!lastMessage || !lastMessage.classList.contains('ai')) {
            lastMessage = document.createElement('div');
            lastMessage.className = 'message ai';
            this.game.uiManager.messageHistory.appendChild(lastMessage);
        }

        lastMessage.textContent = callback(lastMessage.textContent || '');
        this.game.uiManager.messageHistory.scrollTop = this.game.uiManager.messageHistory.scrollHeight;
    }

    addMessageToChat(message, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
        messageDiv.textContent = message.replace('<LEAVES>', '');

        this.game.uiManager.messageHistory.appendChild(messageDiv);
        this.game.uiManager.messageHistory.scrollTop = this.game.uiManager.messageHistory.scrollHeight;
    }
}

export { MessageManager };

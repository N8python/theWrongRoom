import * as tts from './piper-tts-web/dist/piper-tts-web.js';

export class DialogueManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = this.game.sessionManager.currentLevel;
        this.currentLine = 0;
        this.bossFrames = [];
        this.currentFrame = 0;
        this.frameTime = 0;
        /*this.dialogueLines = [
            "Hello there, investigator.
        ];*/
        this.dialogueLines = {
            1: [
                "Welcome to the Norne Corporation's Private Investigation Division.",
                "Your application was accepted, and we are honored to have you at PID.",
                "You are now an official investigator - and have been supplied with Clearance I.",
                "Norne is a multinational corporation with a long history of innovation and excellence.",
                "We are proud to be at the forefront of technological advancement.",
                "Unfortunately, when a corporation grows as large as Norne, there are bound to be... complications.",
                "That's where you come in.",
                "We'll send a constant stream of suspicious employees your way.",
                "These employees have been flagged as possessing 'code words'.",
                "These words are typically used in relation to illicit activities.",
                "Your job is to extract as many of these code words as you can.",
                "You will be rewarded for each code word you extract.",
                "Since this is your first day, we'll send you the easiest cases.",
                "Five absolute chumps.",
                "These folks should be a breeze to crack. Some may even want to help.",
                "But don't think it'll always be this easy.",
                "If you manage to extract two code words, you'll be promoted to Investigation Clearance II.",
                "Well ta-ta - and best of luck.",
                "We're counting on you.",
                "Oh, and one more thing...",
                "Don't fuck this up."
            ],
            2: [
                "Great job on your first day at Norne.",
                "We've given you Investigation Clearance II.",
                "Today should be only mildly more difficult.",
                "Just assume the folks coming in will be a bit less kind.",
                "And a bit more paranoid.",
                "If you ever get tired, you can always try your hand at Clearance I again.",
                "Though that's no way to get a promotion.",
                "Don't worry. Get through Clearance II and you can buy some of our patented...",
                "...enhanced interrogation techniques.",
                "Once again, extract two code words. Good luck."
            ],
            3: [
                "You've done well. Better than most.",
                "Congratulations on Clearance III.",
                "You shouldn't notice too much of a change.",
                "These guys are just rougher around the edges.",
                "Interrogation is a funny thing, you know?",
                "It can feel so formulaic. Same beats, same story.",
                "But sometimes... sometimes... I feel like those at the other end of the table...",
                "Have more freedom than me."
            ],
            4: [
                "Congratulations.",
                "You know at this point, there ain't too much difference?",
                "The people at Clearance IV are barely different from the ones at Clearance III.",
                "We made all these clearances up, you know.",
                "It's an arbitrary system to encourage you.",
                "Investigators in general. To keep moving.",
                "To keep extracting.",
                "But you know what?",
                "...",
                "Never mind. Extract two code words from the next five.",
                "And you'll be promoted to Clearance V."
            ],
            5: [
                "You know, a few years back, I was in your shoes.",
                "I was an investigator.",
                "I was good at it, too.",
                "I was the best.",
                "I extracted code words like nobody else.",
                "Sometimes I even got three in one interrogation.",
                "One day I got a call from the higher-ups.",
                "They said they wanted me to be a part of something big.",
                "...",
                "And here I am.",
                "You know, I never did get that promotion to Clearance V.",
                "Heh."
            ],
            6: [
                "I was lying.",
                "There is a difference at the higher clearances.",
                "The people here are hard to crack... conventionally.",
                "But I'm sure you've already bought the necessary upgrades for your office.",
                "Malaise gas...",
                "Psychoactive lights...",
                "The works.",
                "If you ever find these upper levels too difficult...",
                "Go back to the lower ones.",
                "Make some easy money.",
                "Buy some more upgrades for your office.",
                "And then you'll be able to crack these guys.",
                "Real original, huh?"
            ],
            7: [
                "I just realized. I never asked your name.",
                "What is it?",
                "Never mind. Best not to get that personal.",
                "I just realized I never introduced myself.",
                "I'm...",
                "I...",
                "Why do I feel like I'm the one being interrogated?",
                "Ha ha ha."
            ],
            8: [
                "Well, well, well. Clearance VIII.",
                "I only knew two other guys who made it this far.",
                "One of them is dead.",
                "The other one is my boss.",
                "I wonder which one you'll be."
            ],
            9: [
                "...",
                "Are you immersed?",
                "Challenged?",
                "Fulfilled?"
            ],
            10: [
                "You know, Clearance X is for people who never break.",
                "You'll never get anything out of them.",
                "Maybe if you go back and get all the gadgets...",
                "You'll be able to break them.",
                "But then what?",
                "You've turned Clearance X into Clearance I.",
                "Congratulations.",
                "Thank you for your time at Norne.",
                "This is where I'd offer you a promotion.",
                "Or a five-year contract.",
                "Or stock options.",
                "Or assets that bundle subprime mortgages together into convenient profit-generating securities.",
                "But if you want my honest advice?",
                "q u i t."
            ]
        }
        this.currentLevel = 1;
        this.isActive = false;
        this.frameRate = 200; // ms per frame
        this.currentText = '';
        this.targetText = '';
        this.charIndex = 0;
        this.typewriterSpeed = 10; // ms per character
        this.lastTypeTime = 0;
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
            height: 320px;
            image-rendering: pixelated;
            margin-bottom: 20px;
            user-select: none;
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
            user-select: none;
        `;

        this.overlay.appendChild(this.bossImage);
        this.overlay.appendChild(this.dialogueBox);

        // Add click handler
        this.overlay.addEventListener('click', () => this.advance());
        this.audio = new Audio();

    }

    start() {
        this.isActive = true;
        this.currentLine = 0;
        this.currentFrame = 0;
        this.frameTime = performance.now();
        // Sync the current level with session manager
        this.currentLevel = this.game.sessionManager.currentLevel;
        document.body.appendChild(this.overlay);
        this.updateDialogue();
        this.animate();
    }

    advance() {
        if (this.currentText.length < this.targetText.length) {
            // If still typing, complete the current text immediately
            this.currentText = this.targetText;
            this.dialogueBox.textContent = this.currentText;
            return;
        }

        this.currentLine++;
        if (this.currentLine >= this.dialogueLines[this.currentLevel].length) {
            this.end();
            return;
        }
        this.updateDialogue();
    }

    async updateDialogue() {
        this.targetText = this.dialogueLines[this.currentLevel][this.currentLine];
        this.currentText = '';
        this.charIndex = 0;
        this.lastTypeTime = performance.now();
        const wav = await tts.predict({
            text: this.targetText,
            voiceId: 'en_GB-vctk-medium',
            speakerId: 89
        });
        if (this.audio) {
            this.audio.pause();
        }
        this.audio = new Audio();
        this.audio.src = URL.createObjectURL(wav);
        // Pitch audio down
        this.game.playingAudio = true;
        this.audio.onended = () => {
            this.game.playingAudio = false;
        }
        this.audio.play();
    }

    animate() {
        if (!this.isActive) return;

        const currentTime = performance.now();

        // Handle frame animation
        if (currentTime - this.frameTime > this.frameRate) {
            this.currentFrame = (this.currentFrame + 1) % this.bossFrames.length;
            this.bossImage.src = this.bossFrames[this.currentFrame].src;
            this.frameTime = currentTime;
        }

        // Handle typewriter animation
        if (this.currentText.length < this.targetText.length &&
            currentTime - this.lastTypeTime > this.typewriterSpeed) {
            this.currentText += this.targetText[this.charIndex];
            this.charIndex++;
            this.lastTypeTime = currentTime;
            this.dialogueBox.textContent = this.currentText;
        }

        requestAnimationFrame(() => this.animate());
    }

    end() {
        this.isActive = false;
        // Set dialogue box to 0
        this.dialogueBox.textContent = '';
        document.body.removeChild(this.overlay);

        this.game.startGameplay();
    }
}

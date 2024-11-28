import { pipeline } from './runtimes/transformers.js';
import * as tts from './piper-tts-web/dist/piper-tts-web.js';

class AudioManager {
    constructor(game) {
        this.game = game;
        this.audioChunks = [];
        this.mediaRecorder = null;
        this.audioContext = null;
        this.backgroundTrack = null;
    }

    async initialize() {
        try {
            this.game.transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny.en', {
                device: navigator.gpu ? 'webgpu' : 'wasm',
                dtype: {
                    encoder_model: 'fp32', // 'fp16' works too
                    decoder_model_merged: 'fp32', // or 'fp32' ('fp16' is broken)
                },
                local_files_only: true,
                progress_callback: (progress) => {
                    if (progress.loaded) {
                        document.getElementById('loading-message').textContent = `Loading Whisper: ${progress.progress.toFixed(2)}%`;
                    }
                }
            });
            this.game.isWhisperInitialized = true;
            this.audioContext = new AudioContext({ sampleRate: 16000 }); // Whisper expects 16kHz
            console.log('Whisper model loaded successfully');
        } catch (err) {
            console.error('Error loading Whisper model:', err);
        }
        this.footsteps = await this.loadAudio('sound/footsteps.mp3');
        this.footsteps.volume = 0.1;
        this.footsteps.playbackRate = 1.375;
        await this.initBackgroundTrack();
        await this.initAmbientNoise();

    }

    async initBackgroundTrack() {
        this.backgroundTrack = await this.loadAudio('sound/interrogation.mp3');
        this.backgroundTrack.loop = true;
        this.backgroundTrack.volume = 0.1;
        this.backgroundOfficeAmbience = await this.loadAudio('sound/office.mp3');
        this.backgroundOfficeAmbience.loop = true;
        this.backgroundOfficeAmbience.volume = 0.25;
        this.lightFlicker = await this.loadAudio('sound/flicker-light.mp3');
        this.lightFlicker.loop = true;
        this.lightFlicker.volume = 0.2;

        const startAudio = () => {
            if (this.game.audioEnabled) {
                this.game.updateAudio();
            }
            this.canPlay = true;
            // Remove listeners after first interaction
            ['click', 'keydown', 'touchstart'].forEach(event => {
                document.removeEventListener(event, startAudio);
            });
        };

        // Add listeners for first interaction
        ['click', 'keydown', 'touchstart'].forEach(event => {
            document.addEventListener(event, startAudio);
        });
    }

    async initAmbientNoise() {
        //this.lightFlicker = await this.loadAudio('sound/flicker-light.wav');
        // const that = this;
        /*async function play() {
            const timeToLight = Math.random() * 1000 + 2000;
            await new Promise(resolve => setTimeout(resolve, timeToLight));
            try {
                this.lightFlicker.currentTime = 0;
                this.lightFlicker.volume = this.game.audioEnabled ? 1.0 : 0.0;
                this.lightFlicker.playbackRate = Math.random() * 0.5 + 0.75;
                that.lightFlicker.play();
                this.lightFlicker.onended = async() => {
                    // await new Promise(resolve => setTimeout(resolve, 1000));
                    play();
                }
            } catch (e) {
                console.log(e);
                play();
            }
        }*/
        //play();
    }


    async loadAudio(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = reject;
        });
    }

    async startTranscription() {
        const currentBackgroundVolume = this.backgroundTrack.volume;
        const currentAmbienceVolume = this.backgroundOfficeAmbience.volume;
        const currentFlickerVolume = this.lightFlicker.volume;

        this.backgroundTrack.volume = 0;
        this.backgroundOfficeAmbience.volume = 0;
        this.lightFlicker.volume = 0;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1
                }
            });

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            this.audioChunks = [];
            this.game.isTranscribing = true;
            this.game.uiManager.recordingIndicator.style.display = 'block';

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async() => {
                this.backgroundTrack.volume = currentBackgroundVolume;
                this.backgroundOfficeAmbience.volume = currentAmbienceVolume;
                this.lightFlicker.volume = currentFlickerVolume;
                this.game.uiManager.recordingIndicator.style.display = 'none';
                this.game.transcriptionStarted = performance.now();
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

                // [[BIG SHOT]] DEBUG PRINTS!!
                console.log('[[AUDIO CHUNKS LENGTH]]:', this.audioChunks.length);
                console.log('[[BLOB SIZE IN BYTES]]:', audioBlob.size);

                const audioFloat32 = await this.convertBlobToFloat32Array(audioBlob);

                // MORE [[HOT DEALS]] ON DEBUG INFO!!
                console.log('[[FLOAT32 ARRAY LENGTH]]:', audioFloat32.length);
                console.log('[[SAMPLE RATE CHECK]]:', audioFloat32.length / (performance.now() - this.game.transcriptionStarted) * 1000, 'Hz');

                // Process with Whisper
                console.time('[[WHISPER PROCESSING TIME]]');
                console.log('[[SENDING TO WHISPER]]:', {
                    arrayLength: audioFloat32.length,
                    firstFewSamples: audioFloat32.slice(0, 5),
                    maxAmplitude: Math.max(...audioFloat32.map(Math.abs))
                });

                const result = await this.game.transcriber(audioFloat32);
                console.timeEnd('[[WHISPER PROCESSING TIME]]');
                console.log('[[WHISPER RESULT]]:', result);

                // Rest of your code...
                if (result.text.trim() && !(result.text.includes("BLANK_AUDIO"))) {
                    this.game.uiManager.messageInput.value += (this.game.uiManager.messageInput.value ? ' ' : '') + result.text.trim();
                    await this.game.handleSendMessage();
                }

                // Clean up
                stream.getTracks().forEach(track => track.stop());
                this.audioChunks = [];
                this.game.isTranscribing = false;
            };

            this.mediaRecorder.start();
        } catch (err) {
            this.backgroundTrack.volume = currentBackgroundVolume;
            this.backgroundOfficeAmbience.volume = currentAmbienceVolume;
            this.lightFlicker.volume = currentFlickerVolume;
            console.error('Error starting transcription:', err);
            this.game.isTranscribing = false;
            this.game.uiManager.recordingIndicator.style.display = 'none';
        }
    }

    stopTranscription() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    async convertBlobToFloat32Array(blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        // Get the raw audio data
        const audioData = audioBuffer.getChannelData(0);

        // Resample to 16kHz if needed
        if (audioBuffer.sampleRate !== 16000) {
            const resampledLength = Math.floor(audioData.length * 16000 / audioBuffer.sampleRate);
            const resampledData = new Float32Array(resampledLength);

            for (let i = 0; i < resampledLength; i++) {
                const originalIndex = Math.floor(i * audioBuffer.sampleRate / 16000);
                resampledData[i] = audioData[originalIndex];
            }

            return resampledData;
        }

        return audioData;
    }

    async cleanup() {
        await tts.TtsSession.disposeInstance();
    }
}

export { AudioManager };
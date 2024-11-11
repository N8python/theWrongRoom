import { InferenceConfig, ProgressCallback, VoiceId } from './types';

interface TtsSessionOptions {
    voiceId: VoiceId;
    progress?: ProgressCallback;
    logger?: (text: string) => void;
    /**
     * These are the option paths to a PUBLIC directory or server endpoint
     * which can retrieve the relevant WASMs to use PiperTTS models.
     * The defaults can be viewed in ./fixtures constants
     * onnxWasm: {@link ONNX_BASE}
     * piperData/piperWASM: {@link WASM_BASE}
    */
    wasmPaths?: {
        onnxWasm: string;
        piperData: string;
        piperWasm: string;
    };
}
export declare class TtsSession {
    #private;
    static WASM_LOCATIONS: {
        onnxWasm: string;
        piperData: string;
        piperWasm: string;
    };
    static _instance: TtsSession | null;
    ready: boolean;
    voiceId: VoiceId;
    waitReady: Promise<void> | boolean;
    constructor({ voiceId, progress, logger, wasmPaths, }: TtsSessionOptions);
    static create(options: TtsSessionOptions): Promise<TtsSession>;
    init(): Promise<void>;
    predict(text: string): Promise<Blob>;
}
/**
 * Run text to speech inference in new worker thread. Fetches the model
 * first, if it has not yet been saved to opfs yet.
 */
export declare function predict(config: InferenceConfig, callback?: ProgressCallback): Promise<Blob>;
export {};

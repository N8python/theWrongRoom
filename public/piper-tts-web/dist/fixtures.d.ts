import { VoiceId } from './types';

/**
 * Location of the ml models
 */
export declare const HF_BASE = "https://huggingface.co/diffusionstudio/piper-voices/resolve/main";
/**
 * Inference runtime libary base path
 */
export declare const ONNX_BASE = "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/";
/**
 * Path to wasm related files
 */
export declare const WASM_BASE = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";
/**
 * Path to ml models on huggingface
 */
export declare const PATH_MAP: Record<VoiceId, string>;

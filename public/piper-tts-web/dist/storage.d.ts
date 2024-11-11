import { ProgressCallback, VoiceId } from './types';

/**
 * Prefetch a model for later use
 */
export declare function download(voiceId: VoiceId, callback?: ProgressCallback): Promise<void>;
/**
 * Remove a model from opfs
 */
export declare function remove(voiceId: VoiceId): Promise<void>;
/**
 * Get all stored models
 */
export declare function stored(): Promise<VoiceId[]>;
/**
 * Delete the models directory
 */
export declare function flush(): Promise<void>;

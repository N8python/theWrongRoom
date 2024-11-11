import { Voice } from './types';

/**
 * Retrieves all available voices from huggingface and falls back to local cache.
 * @returns
 */
export declare function voices(): Promise<Voice[]>;

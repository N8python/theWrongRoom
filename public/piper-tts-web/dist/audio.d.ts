/**
 * Convert a Float32Array (PCM) to an ArrayBuffer (WAV)
 */
export declare function pcm2wav(buffer: Float32Array, numChannels: number, sampleRate: number): ArrayBuffer;

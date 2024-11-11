export declare function writeBlob(url: string, blob: Blob): Promise<void>;
export declare function removeBlob(url: string): Promise<void>;
export declare function readBlob(url: string): Promise<Blob | undefined>;

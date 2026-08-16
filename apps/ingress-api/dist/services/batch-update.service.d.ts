interface BatchItem<T = any> {
    key: string;
    data: T;
    timestamp: Date;
}
interface BatchConfig {
    batchSize: number;
    batchDelayMs: number;
}
interface BatchProcessor<T = any> {
    name: string;
    config: BatchConfig;
    processBatch: (items: BatchItem<T>[]) => Promise<void>;
}
export declare class BatchUpdateService {
    private static instance;
    private processors;
    private constructor();
    static getInstance(): BatchUpdateService;
    createBatchProcessor<T>(processor: BatchProcessor<T>): void;
    addToBatch<T>(processorName: string, key: string, data: T): void;
    private startProcessor;
    private processBatch;
    getQueueSize(processorName: string): number;
    getStats(processorName?: string): Record<string, any> | null;
    removeBatchProcessor(processorName: string): void;
    shutdown(): void;
}
export declare const batchUpdateService: BatchUpdateService;
export {};
//# sourceMappingURL=batch-update.service.d.ts.map
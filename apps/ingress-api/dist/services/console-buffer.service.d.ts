interface ConsoleEntry {
    output: string;
    timestamp: number;
    serverId: string;
}
export declare class ConsoleBufferService {
    private static instance;
    private serverBuffers;
    private flushInterval;
    private readonly maxBufferSize;
    private readonly maxFlushSize;
    private readonly flushIntervalMs;
    private readonly maxMemoryMB;
    private constructor();
    static getInstance(): ConsoleBufferService;
    /**
     * Add console output to buffer
     */
    addOutput(serverId: string, output: string): void;
    /**
     * Subscribe to console output for a server
     */
    subscribe(serverId: string): ConsoleEntry[];
    /**
     * Unsubscribe from console output for a server
     */
    unsubscribe(serverId: string): void;
    /**
     * Get buffered entries for flushing
     */
    getBufferedEntries(serverId: string, flushAll?: boolean): ConsoleEntry[];
    /**
     * Get all servers with buffered output
     */
    getServerIds(): string[];
    /**
     * Start the flush timer
     */
    private startFlushTimer;
    /**
     * Start memory cleanup timer
     */
    private startMemoryCleanup;
    /**
     * Clean up memory usage
     */
    private cleanupMemory;
    /**
     * Get buffer statistics
     */
    getStats(): {
        servers: number;
        totalEntries: number;
        totalSubscribers: number;
        estimatedMemoryMB: number;
    };
    /**
     * Shutdown and cleanup
     */
    shutdown(): void;
}
export {};
//# sourceMappingURL=console-buffer.service.d.ts.map
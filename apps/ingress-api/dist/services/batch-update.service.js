import { logger } from "../lib/logger";
export class BatchUpdateService {
    constructor() {
        this.processors = new Map();
    }
    static getInstance() {
        if (!BatchUpdateService.instance) {
            BatchUpdateService.instance = new BatchUpdateService();
        }
        return BatchUpdateService.instance;
    }
    createBatchProcessor(processor) {
        if (this.processors.has(processor.name)) {
            logger.warn(`Batch processor ${processor.name} already exists, replacing it`);
            this.removeBatchProcessor(processor.name);
        }
        const processorData = {
            processor,
            pendingItems: new Map(),
            interval: null,
            stats: {
                totalProcessed: 0,
                totalBatches: 0,
                totalErrors: 0,
                lastBatchSize: 0,
                lastBatchTime: Date.now(),
            },
        };
        this.processors.set(processor.name, processorData);
        this.startProcessor(processor.name);
        logger.info(`Created batch processor: ${processor.name}`, {
            config: processor.config,
        });
    }
    addToBatch(processorName, key, data) {
        const processorData = this.processors.get(processorName);
        if (!processorData) {
            logger.error(`Batch processor ${processorName} not found`);
            return;
        }
        const item = {
            key,
            data,
            timestamp: new Date(),
        };
        processorData.pendingItems.set(key, item);
        // If we have enough items, process immediately
        if (processorData.pendingItems.size >=
            processorData.processor.config.batchSize) {
            this.processBatch(processorName);
        }
    }
    startProcessor(processorName) {
        const processorData = this.processors.get(processorName);
        if (!processorData)
            return;
        processorData.interval = setInterval(() => {
            if (processorData.pendingItems.size > 0) {
                this.processBatch(processorName);
            }
        }, processorData.processor.config.batchDelayMs);
    }
    async processBatch(processorName) {
        const processorData = this.processors.get(processorName);
        if (!processorData || processorData.pendingItems.size === 0)
            return;
        const items = Array.from(processorData.pendingItems.values());
        processorData.pendingItems.clear();
        const startTime = Date.now();
        try {
            await processorData.processor.processBatch(items);
            // Update stats
            processorData.stats.totalProcessed += items.length;
            processorData.stats.totalBatches++;
            processorData.stats.lastBatchSize = items.length;
            processorData.stats.lastBatchTime = Date.now();
            const duration = Date.now() - startTime;
            logger.info(`Processed batch of ${items.length} ${processorName} operations in ${duration}ms`);
        }
        catch (error) {
            processorData.stats.totalErrors++;
            logger.error(`Error processing ${processorName} batch`, {
                error,
                batchSize: items.length,
                duration: Date.now() - startTime,
            });
            // Re-add failed items for retry
            items.forEach((item) => {
                processorData.pendingItems.set(item.key, item);
            });
        }
    }
    getQueueSize(processorName) {
        const processorData = this.processors.get(processorName);
        return processorData ? processorData.pendingItems.size : 0;
    }
    getStats(processorName) {
        if (processorName) {
            const processorData = this.processors.get(processorName);
            if (!processorData)
                return null;
            return {
                ...processorData.stats,
                queueSize: processorData.pendingItems.size,
                config: processorData.processor.config,
            };
        }
        // Return stats for all processors
        const allStats = {};
        for (const [name, processorData] of this.processors) {
            allStats[name] = {
                ...processorData.stats,
                queueSize: processorData.pendingItems.size,
                config: processorData.processor.config,
            };
        }
        return allStats;
    }
    removeBatchProcessor(processorName) {
        const processorData = this.processors.get(processorName);
        if (!processorData)
            return;
        // Clear interval
        if (processorData.interval) {
            clearInterval(processorData.interval);
        }
        // Process any remaining items
        if (processorData.pendingItems.size > 0) {
            this.processBatch(processorName);
        }
        this.processors.delete(processorName);
        logger.info(`Removed batch processor: ${processorName}`);
    }
    shutdown() {
        // Process all remaining items and clean up
        for (const [name, processorData] of this.processors) {
            if (processorData.interval) {
                clearInterval(processorData.interval);
            }
            if (processorData.pendingItems.size > 0) {
                this.processBatch(name);
            }
        }
        this.processors.clear();
        logger.info("All batch processors shut down");
    }
}
export const batchUpdateService = BatchUpdateService.getInstance();

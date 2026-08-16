import { logger } from "../lib/logger";

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

export class BatchUpdateService {
  private static instance: BatchUpdateService;
  private processors = new Map<
    string,
    {
      processor: BatchProcessor;
      pendingItems: Map<string, BatchItem>;
      interval: NodeJS.Timeout | null;
      stats: {
        totalProcessed: number;
        totalBatches: number;
        totalErrors: number;
        lastBatchSize: number;
        lastBatchTime: number;
      };
    }
  >();

  private constructor() {}

  public static getInstance(): BatchUpdateService {
    if (!BatchUpdateService.instance) {
      BatchUpdateService.instance = new BatchUpdateService();
    }
    return BatchUpdateService.instance;
  }

  public createBatchProcessor<T>(processor: BatchProcessor<T>): void {
    if (this.processors.has(processor.name)) {
      logger.warn(
        `Batch processor ${processor.name} already exists, replacing it`
      );
      this.removeBatchProcessor(processor.name);
    }

    const processorData = {
      processor,
      pendingItems: new Map<string, BatchItem<T>>(),
      interval: null as NodeJS.Timeout | null,
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

  public addToBatch<T>(processorName: string, key: string, data: T): void {
    const processorData = this.processors.get(processorName);
    if (!processorData) {
      logger.error(`Batch processor ${processorName} not found`);
      return;
    }

    const item: BatchItem<T> = {
      key,
      data,
      timestamp: new Date(),
    };

    processorData.pendingItems.set(key, item);

    // If we have enough items, process immediately
    if (
      processorData.pendingItems.size >=
      processorData.processor.config.batchSize
    ) {
      this.processBatch(processorName);
    }
  }

  private startProcessor(processorName: string): void {
    const processorData = this.processors.get(processorName);
    if (!processorData) return;

    processorData.interval = setInterval(() => {
      if (processorData.pendingItems.size > 0) {
        this.processBatch(processorName);
      }
    }, processorData.processor.config.batchDelayMs);
  }

  private async processBatch(processorName: string): Promise<void> {
    const processorData = this.processors.get(processorName);
    if (!processorData || processorData.pendingItems.size === 0) return;

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
      logger.info(
        `Processed batch of ${items.length} ${processorName} operations in ${duration}ms`
      );
    } catch (error) {
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

  public getQueueSize(processorName: string): number {
    const processorData = this.processors.get(processorName);
    return processorData ? processorData.pendingItems.size : 0;
  }

  public getStats(processorName?: string) {
    if (processorName) {
      const processorData = this.processors.get(processorName);
      if (!processorData) return null;

      return {
        ...processorData.stats,
        queueSize: processorData.pendingItems.size,
        config: processorData.processor.config,
      };
    }

    // Return stats for all processors
    const allStats: Record<string, any> = {};
    for (const [name, processorData] of this.processors) {
      allStats[name] = {
        ...processorData.stats,
        queueSize: processorData.pendingItems.size,
        config: processorData.processor.config,
      };
    }
    return allStats;
  }

  public removeBatchProcessor(processorName: string): void {
    const processorData = this.processors.get(processorName);
    if (!processorData) return;

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

  public shutdown(): void {
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

import { logger } from "../lib/logger";

interface ConsoleEntry {
  output: string;
  timestamp: number;
  serverId: string;
}

interface ServerBuffer {
  entries: ConsoleEntry[];
  lastFlush: number;
  subscribers: number;
}

export class ConsoleBufferService {
  private static instance: ConsoleBufferService;
  private serverBuffers = new Map<string, ServerBuffer>();
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly maxBufferSize = 1000;
  private readonly maxFlushSize = 50;
  private readonly flushIntervalMs = 250;
  private readonly maxMemoryMB = 100; // Maximum memory usage for console buffers

  private constructor() {
    this.startFlushTimer();
    this.startMemoryCleanup();
  }

  public static getInstance(): ConsoleBufferService {
    if (!ConsoleBufferService.instance) {
      ConsoleBufferService.instance = new ConsoleBufferService();
    }
    return ConsoleBufferService.instance;
  }

  /**
   * Add console output to buffer
   */
  public addOutput(serverId: string, output: string): void {
    if (!output || output.trim().length === 0) return;

    const now = Date.now();
    let buffer = this.serverBuffers.get(serverId);

    if (!buffer) {
      buffer = {
        entries: [],
        lastFlush: now,
        subscribers: 0,
      };
      this.serverBuffers.set(serverId, buffer);
    }

    // Rate limiting: if buffer is getting too full and no subscribers, limit intake
    if (buffer.entries.length > this.maxBufferSize * 0.8 && buffer.subscribers === 0) {
      // Keep only error and warning messages when no subscribers
      if (!output.includes('^1') && !output.includes('^3')) {
        return;
      }
    }

    buffer.entries.push({
      output,
      timestamp: now,
      serverId,
    });

    // Prevent buffer overflow
    if (buffer.entries.length > this.maxBufferSize) {
      // Keep the most recent entries, but prioritize errors and warnings
      const errors = buffer.entries.filter(e => 
        e.output.includes('^1') || e.output.includes('^3')
      ).slice(-50);
      const recent = buffer.entries.slice(-this.maxBufferSize + errors.length);
      buffer.entries = [...errors, ...recent];
    }
  }

  /**
   * Subscribe to console output for a server
   */
  public subscribe(serverId: string): ConsoleEntry[] {
    let buffer = this.serverBuffers.get(serverId);
    if (!buffer) {
      buffer = {
        entries: [],
        lastFlush: Date.now(),
        subscribers: 1,
      };
      this.serverBuffers.set(serverId, buffer);
      return [];
    }

    buffer.subscribers++;
    
    // Return recent entries (last 100) for new subscribers
    return buffer.entries.slice(-100);
  }

  /**
   * Unsubscribe from console output for a server
   */
  public unsubscribe(serverId: string): void {
    const buffer = this.serverBuffers.get(serverId);
    if (buffer) {
      buffer.subscribers = Math.max(0, buffer.subscribers - 1);
      
      // If no more subscribers, clear buffer after 30 minutes (increased from 5)
      if (buffer.subscribers === 0) {
        setTimeout(() => {
          const currentBuffer = this.serverBuffers.get(serverId);
          if (currentBuffer && currentBuffer.subscribers === 0) {
            this.serverBuffers.delete(serverId);
            logger.info(`Cleared console buffer for server ${serverId} (no subscribers)`);
          }
        }, 1800000); // 30 minutes
      }
    }
  }

  /**
   * Get buffered entries for flushing
   */
  public getBufferedEntries(serverId: string, flushAll = false): ConsoleEntry[] {
    const buffer = this.serverBuffers.get(serverId);
    if (!buffer || buffer.entries.length === 0) return [];

    const now = Date.now();
    
    // Only flush if we have subscribers or it's been a while
    if (buffer.subscribers === 0 && now - buffer.lastFlush < 5000) {
      return [];
    }

    const entriesToFlush = flushAll 
      ? buffer.entries.splice(0) 
      : buffer.entries.splice(0, this.maxFlushSize);

    buffer.lastFlush = now;
    return entriesToFlush;
  }

  /**
   * Get all servers with buffered output
   */
  public getServerIds(): string[] {
    return Array.from(this.serverBuffers.keys());
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      // This will be called by the WebSocket service
    }, this.flushIntervalMs);
  }

  /**
   * Start memory cleanup timer
   */
  private startMemoryCleanup(): void {
    setInterval(() => {
      this.cleanupMemory();
    }, 60000); // Every minute
  }

  /**
   * Clean up memory usage
   */
  private cleanupMemory(): void {
    const now = Date.now();
    let totalEntries = 0;
    
    for (const [serverId, buffer] of this.serverBuffers.entries()) {
      totalEntries += buffer.entries.length;
      
      // Remove old entries (older than 1 hour)
      buffer.entries = buffer.entries.filter(entry => 
        now - entry.timestamp < 3600000 // 1 hour
      );
      
      // If no subscribers and buffer is old, remove it
      if (buffer.subscribers === 0 && now - buffer.lastFlush > 600000) { // 10 minutes
        this.serverBuffers.delete(serverId);
      }
    }

    // If memory usage is too high, aggressively clean up
    const estimatedMemoryMB = (totalEntries * 200) / 1024 / 1024; // Rough estimate
    if (estimatedMemoryMB > this.maxMemoryMB) {
      logger.warn(`Console buffer memory usage high: ${estimatedMemoryMB.toFixed(2)}MB`);
      
      // Remove entries from servers with no subscribers
      for (const [serverId, buffer] of this.serverBuffers.entries()) {
        if (buffer.subscribers === 0) {
          buffer.entries = buffer.entries.slice(-10); // Keep only last 10 entries
        }
      }
    }

    logger.debug(`Console buffer cleanup: ${this.serverBuffers.size} servers, ${totalEntries} total entries`);
  }

  /**
   * Get buffer statistics
   */
  public getStats() {
    let totalEntries = 0;
    let totalSubscribers = 0;
    
    for (const buffer of this.serverBuffers.values()) {
      totalEntries += buffer.entries.length;
      totalSubscribers += buffer.subscribers;
    }

    return {
      servers: this.serverBuffers.size,
      totalEntries,
      totalSubscribers,
      estimatedMemoryMB: (totalEntries * 200) / 1024 / 1024,
    };
  }

  /**
   * Shutdown and cleanup
   */
  public shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.serverBuffers.clear();
    logger.info("Console buffer service shut down");
  }
} 
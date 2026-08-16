// Global stream manager to track concurrent streams across all components
class StreamManager {
  private static instance: StreamManager;
  private activeStreams = new Set<string>();
  private readonly MAX_CONCURRENT_STREAMS = 16;

  private constructor() {}

  public static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager();
    }
    return StreamManager.instance;
  }

  /**
   * Check if we can create a new stream
   */
  public canCreateStream(): boolean {
    return this.activeStreams.size < this.MAX_CONCURRENT_STREAMS;
  }

  /**
   * Get current stream count
   */
  public getStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Get maximum allowed streams
   */
  public getMaxStreams(): number {
    return this.MAX_CONCURRENT_STREAMS;
  }

  /**
   * Register a new active stream
   */
  public addStream(streamId: string): boolean {
    if (!this.canCreateStream()) {
      return false;
    }
    this.activeStreams.add(streamId);
    console.log(`Stream registered: ${streamId} (${this.activeStreams.size}/${this.MAX_CONCURRENT_STREAMS})`);
    return true;
  }

  /**
   * Remove an active stream
   */
  public removeStream(streamId: string): void {
    const removed = this.activeStreams.delete(streamId);
    if (removed) {
      console.log(`Stream removed: ${streamId} (${this.activeStreams.size}/${this.MAX_CONCURRENT_STREAMS})`);
    }
  }

  /**
   * Get all active stream IDs
   */
  public getActiveStreamIds(): string[] {
    return Array.from(this.activeStreams);
  }

  /**
   * Clear all streams (for cleanup)
   */
  public clearAllStreams(): void {
    this.activeStreams.clear();
    console.log("📊 All streams cleared");
  }
}

export const streamManager = StreamManager.getInstance(); 
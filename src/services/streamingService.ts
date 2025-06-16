import { Response } from 'express';
import { getLocalmocResponse } from './localmocService';
import { getOpenAIResponse } from './openaiService';
import { getAnthropicResponse } from './anthropicService';

export interface StreamingOptions {
  granularity: 'word' | 'character' | 'sentence';
  delay?: number; // Delay between chunks in milliseconds
  includeMetadata?: boolean;
}

export interface StreamChunk {
  type: 'content' | 'metadata' | 'progress' | 'complete' | 'error';
  data: any;
  timestamp: number;
}

export class StreamingService {
  private static readonly DEFAULT_DELAY = 50; // 50ms between chunks
  private static readonly MAX_CHUNK_SIZE = 1024;

  /**
   * Stream rewritten text as Server-Sent Events
   */
  static async streamRewrite(
    text: string,
    style: string,
    llm: string,
    res: Response,
    options: StreamingOptions = { granularity: 'word', delay: 50, includeMetadata: true }
  ): Promise<void> {
    try {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial metadata
      if (options.includeMetadata) {
        this.sendSSE(res, {
          type: 'metadata',
          data: {
            original: text,
            style,
            llm,
            granularity: options.granularity,
            timestamp: Date.now()
          },
          timestamp: Date.now()
        });
      }

      // Send progress start
      this.sendSSE(res, {
        type: 'progress',
        data: { status: 'started', progress: 0 },
        timestamp: Date.now()
      });

      // Get the full rewritten text first
      let rewrittenText: string;
      try {
        if (llm === 'openai') {
          rewrittenText = await getOpenAIResponse(text, style);
        } else if (llm === 'anthropic') {
          rewrittenText = await getAnthropicResponse(text, style);
        } else {
          rewrittenText = await getLocalmocResponse(text, style);
        }
      } catch (error) {
        this.sendSSE(res, {
          type: 'error',
          data: { 
            message: error instanceof Error ? error.message : 'Failed to rewrite text',
            original: text
          },
          timestamp: Date.now()
        });
        res.end();
        return;
      }

      // Stream the rewritten text based on granularity
      await this.streamText(rewrittenText, res, options);

      // Send completion event
      this.sendSSE(res, {
        type: 'complete',
        data: {
          original: text,
          rewritten: rewrittenText,
          style,
          llm,
          totalChunks: this.calculateChunks(rewrittenText, options.granularity)
        },
        timestamp: Date.now()
      });

      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      this.sendSSE(res, {
        type: 'error',
        data: { 
          message: error instanceof Error ? error.message : 'Streaming failed',
          original: text
        },
        timestamp: Date.now()
      });
      res.end();
    }
  }

  /**
   * Stream text content with specified granularity
   */
  private static async streamText(
    text: string,
    res: Response,
    options: StreamingOptions
  ): Promise<void> {
    const chunks = this.splitText(text, options.granularity);
    const totalChunks = chunks.length;
    let currentChunk = 0;

    for (const chunk of chunks) {
      // Send content chunk
      this.sendSSE(res, {
        type: 'content',
        data: {
          chunk,
          index: currentChunk,
          total: totalChunks,
          progress: Math.round((currentChunk / totalChunks) * 100)
        },
        timestamp: Date.now()
      });

      currentChunk++;

      // Send progress update every 10% or every 5 chunks
      if (currentChunk % Math.max(1, Math.floor(totalChunks / 10)) === 0 || currentChunk % 5 === 0) {
        this.sendSSE(res, {
          type: 'progress',
          data: {
            status: 'processing',
            progress: Math.round((currentChunk / totalChunks) * 100),
            currentChunk,
            totalChunks
          },
          timestamp: Date.now()
        });
      }

      // Add delay between chunks
      if (options.delay && options.delay > 0) {
        await this.delay(options.delay);
      }
    }
  }

  /**
   * Split text based on granularity
   */
  private static splitText(text: string, granularity: string): string[] {
    switch (granularity) {
      case 'word':
        return text.split(/\s+/).filter(word => word.length > 0);
      case 'character':
        return text.split('').filter(char => char.trim().length > 0);
      case 'sentence':
        return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
      default:
        return [text];
    }
  }

  /**
   * Calculate total number of chunks
   */
  private static calculateChunks(text: string, granularity: string): number {
    return this.splitText(text, granularity).length;
  }

  /**
   * Send Server-Sent Event
   */
  private static sendSSE(res: Response, chunk: StreamChunk): void {
    const eventData = JSON.stringify(chunk);
    res.write(`data: ${eventData}\n\n`);
  }

  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Simulate streaming for local mock service with realistic delays
   */
  static async streamMockRewrite(
    text: string,
    style: string,
    res: Response,
    options: StreamingOptions = { granularity: 'word', delay: 100, includeMetadata: true }
  ): Promise<void> {
    try {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial metadata
      if (options.includeMetadata) {
        this.sendSSE(res, {
          type: 'metadata',
          data: {
            original: text,
            style,
            llm: 'localmoc',
            granularity: options.granularity,
            timestamp: Date.now()
          },
          timestamp: Date.now()
        });
      }

      // Send progress start
      this.sendSSE(res, {
        type: 'progress',
        data: { status: 'started', progress: 0 },
        timestamp: Date.now()
      });

      // Simulate processing delay
      await this.delay(500);

      // Get mock response
      const rewrittenText = await getLocalmocResponse(text, style);

      // Stream the response
      await this.streamText(rewrittenText, res, options);

      // Send completion event
      this.sendSSE(res, {
        type: 'complete',
        data: {
          original: text,
          rewritten: rewrittenText,
          style,
          llm: 'localmoc',
          totalChunks: this.calculateChunks(rewrittenText, options.granularity)
        },
        timestamp: Date.now()
      });

      res.end();
    } catch (error) {
      console.error('Mock streaming error:', error);
      this.sendSSE(res, {
        type: 'error',
        data: { 
          message: error instanceof Error ? error.message : 'Mock streaming failed',
          original: text
        },
        timestamp: Date.now()
      });
      res.end();
    }
  }
}

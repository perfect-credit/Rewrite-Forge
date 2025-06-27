import { Response } from 'express';
import { getLocalmocResponse } from './localmocService';
import { streamOpenAIResponse } from './openaiService';
import { streamAnthropicResponse } from './anthropicService';
import { StreamingOptions, StreamChunk } from '../types/type';

export class StreamingService {
  /**
   * Stream rewritten text as Server-Sent Events using TRUE streaming
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

      // Use TRUE streaming for OpenAI and Anthropic
      if (llm === 'openai') {
        await streamOpenAIResponse(text, style, res);
      } else if (llm === 'anthropic') {
        await streamAnthropicResponse(text, style, res);
      } else {
        // For localmoc, use the old fake streaming approach
        await this.streamLocalmocResponse(text, style, res, options);
      }

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
   * Stream localmoc response (fake streaming for testing)
   */
  private static async streamLocalmocResponse(
    text: string,
    style: string,
    res: Response,
    options: StreamingOptions
  ): Promise<void> {
    try {
      // Get the full rewritten text first (since localmoc doesn't support streaming)
      const rewrittenText = await getLocalmocResponse(text, style);

      // Stream the rewritten text based on granularity
      await this.streamText(rewrittenText, res, options);

      // Send completion event
      this.sendSSE(res, {
        type: 'complete',
        data: {
          original: text,
          rewritten: rewrittenText,
          style,
          llm: 'localmoc',
        },
        timestamp: Date.now()
      });

      res.end();
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
    let currentChunk = 0;

    for (const chunk of chunks) {
      // Send content chunk
      this.sendSSE(res, {
        type: 'content',
        data: {
          chunk,
          index: currentChunk,         
        },
        timestamp: Date.now()
      });

      currentChunk++;

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
   * Stream mock rewritten text as Server-Sent Events
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
            llm: 'mock',
            granularity: options.granularity,
            timestamp: Date.now()
          },
          timestamp: Date.now()
        });
      }

      // Generate mock response
      const mockResponse = `[${style.toUpperCase()}] ${text} - This is a mock response for testing streaming functionality.`;

      // Stream the mock response
      await this.streamText(mockResponse, res, options);

      // Send completion event
      this.sendSSE(res, {
        type: 'complete',
        data: {
          original: text,
          rewritten: mockResponse,
          style,
          llm: 'mock',
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

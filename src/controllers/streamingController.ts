import { Request, Response } from 'express';
import { StreamingService, StreamingOptions } from '../services/streamingService';
import { validateRequest } from '../utils/validate';

export const streamRewrite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { llm, text, style, granularity = 'word', delay = 50, includeMetadata = true } = req.body;
    
    // Validate request
    const validation = validateRequest(llm, text, style);
    if (!validation.valid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    // Validate granularity
    const validGranularities = ['word', 'character', 'sentence'];
    if (granularity && !validGranularities.includes(granularity)) {
      res.status(400).json({ 
        error: `Invalid granularity. Must be one of: ${validGranularities.join(', ')}` 
      });
      return;
    }

    // Validate delay
    const parsedDelay = parseInt(delay as string);
    if (isNaN(parsedDelay) || parsedDelay < 0 || parsedDelay > 5000) {
      res.status(400).json({ 
        error: 'Delay must be a number between 0 and 5000 milliseconds' 
      });
      return;
    }

    // Use consistent default style
    const defaultStyle = 'formal';
    const selectedStyle = style || defaultStyle;

    // Configure streaming options
    const streamingOptions: StreamingOptions = {
      granularity: granularity as 'word' | 'character' | 'sentence',
      delay: parsedDelay,
      includeMetadata: Boolean(includeMetadata)
    };

    // Start streaming
    await StreamingService.streamRewrite(
      text,
      selectedStyle,
      llm || 'localmoc',
      res,
      streamingOptions
    );

  } catch (error) {
    console.error('Streaming controller error:', error);
    
    // If response hasn't been sent yet, send error
    if (!res.headersSent) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start streaming';
      res.status(500).json({ 
        error: errorMessage,
        original: req.body.text || '',
        style: req.body.style || 'formal'
      });
    }
  }
};

export const streamMockRewrite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, style, granularity = 'word', delay = 100, includeMetadata = true } = req.body;
    
    // Validate text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Text is required and must be a non-empty string' });
      return;
    }

    // Validate granularity
    const validGranularities = ['word', 'character', 'sentence'];
    if (granularity && !validGranularities.includes(granularity)) {
      res.status(400).json({ 
        error: `Invalid granularity. Must be one of: ${validGranularities.join(', ')}` 
      });
      return;
    }

    // Validate delay
    const parsedDelay = parseInt(delay as string);
    if (isNaN(parsedDelay) || parsedDelay < 0 || parsedDelay > 5000) {
      res.status(400).json({ 
        error: 'Delay must be a number between 0 and 5000 milliseconds' 
      });
      return;
    }

    // Use consistent default style
    const defaultStyle = 'formal';
    const selectedStyle = style || defaultStyle;

    // Configure streaming options
    const streamingOptions: StreamingOptions = {
      granularity: granularity as 'word' | 'character' | 'sentence',
      delay: parsedDelay,
      includeMetadata: Boolean(includeMetadata)
    };

    // Start mock streaming
    await StreamingService.streamMockRewrite(
      text,
      selectedStyle,
      res,
      streamingOptions
    );

  } catch (error) {
    console.error('Mock streaming controller error:', error);
    
    // If response hasn't been sent yet, send error
    if (!res.headersSent) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start mock streaming';
      res.status(500).json({ 
        error: errorMessage,
        original: req.body.text || '',
        style: req.body.style || 'formal'
      });
    }
  }
}; 
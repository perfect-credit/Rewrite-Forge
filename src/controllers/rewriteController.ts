import { Request, Response } from 'express';
import { getLocalmocResponse } from '../services/localmocService'
import { getOpenAIResponse } from '../services/openaiService';
import { getAnthropicResponse } from '../services/anthropicService';
import { validateRequest } from '../utils/validate';

export const rewrite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { llm, text, style } = req.body;
    
    const validation = validateRequest(llm, text, style);
    if (!validation.valid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    // Use consistent default style for all LLMs
    const defaultStyle = 'formal';
    const selectedStyle = style || defaultStyle;

    let rewritten: string;

    if (llm === 'openai') {
      console.log("Using OpenAI LLM");
      rewritten = await getOpenAIResponse(text, selectedStyle);
    } else if (llm === 'anthropic') {
      console.log("Using Anthropic LLM");
      rewritten = await getAnthropicResponse(text, selectedStyle);
    } else {
      // Default to local mock service
      console.log("Using Local Mock LLM");
      rewritten = await getLocalmocResponse(text, selectedStyle);
    }

    res.json({ 
      original: text, 
      rewritten,
      style: selectedStyle,
      llm: llm || 'localmoc'
    });    
  } catch (error) {
    console.error('Rewrite error:', error);
    
    // Enhanced error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to rewrite text';
    res.status(500).json({ 
      error: errorMessage,
      original: req.body.text || '',
      rewritten: '',
      style: req.body.style || 'formal'
    });
  }
};

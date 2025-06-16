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

    if (llm == 'openai'){
      console.log("llm->openai")
      const rewritten = await getOpenAIResponse(text, style || 'formal');
      res.json({ 
        original: text, 
        rewritten,
        style: style || 'formal'
      });
      return
    }

    if (llm == 'anthropic'){
      console.log("llm->anthropic")
      const rewritten = await getAnthropicResponse(text, style || 'pirate');
      res.json({ 
        original: text, 
        rewritten,
        style: style || 'pirate'
      });
      return
    }
    
    //default set: If llm = '' or llm = 'localmoc'
    const rewritten = await getLocalmocResponse(text, style || 'formal');
    res.json({ 
      original: text, 
      rewritten,
      style: style || 'formal'
    });    
  } catch (error) {
    console.error('Rewrite error:', error);
    res.status(500).json({ error: 'Failed to rewrite text' });
  }
};

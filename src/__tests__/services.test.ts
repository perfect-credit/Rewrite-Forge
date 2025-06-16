// Mock the OpenAI SDK before importing services
const mockOpenAICreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate
      }
    }
  }));
});

// Mock the Anthropic SDK before importing services
const mockAnthropicCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockAnthropicCreate
    }
  }));
});

// Mock environment variables
const originalEnv = process.env;

// Import services after mocks are set up
import { getLocalmocResponse, callLLM } from '../services/localmocService';
import { getOpenAIResponse, openAIResponse } from '../services/openaiService';
import { getAnthropicResponse, anthropicResponse } from '../services/anthropicService';

describe('LLM Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Local Mock Service', () => {
    it('should return formatted response with style wrapper', async () => {
      const result = await callLLM('Hello world', 'pirate');
      expect(result).toBe('[*pirate*] Hello world');
    });

    it('should handle different styles', async () => {
      const styles = ['pirate', 'haiku', 'formal'];
      for (const style of styles) {
        const result = await callLLM('Hello world', style);
        expect(result).toBe(`[*${style}*] Hello world`);
      }
    });

    it('should cache identical requests', async () => {
      const result1 = await getLocalmocResponse('Hello world', 'pirate');
      const result2 = await getLocalmocResponse('Hello world', 'pirate');
      
      expect(result1).toBe(result2);
      expect(result1).toBe('[*pirate*] Hello world');
    });

    it('should not cache different requests', async () => {
      const result1 = await getLocalmocResponse('Hello world', 'pirate');
      const result2 = await getLocalmocResponse('Goodbye world', 'pirate');
      
      expect(result1).toBe('[*pirate*] Hello world');
      expect(result2).toBe('[*pirate*] Goodbye world');
    });
  });

  describe('OpenAI Service', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;
      
      // Need to re-import the service to get the updated environment
      jest.resetModules();
      const { getOpenAIResponse: getOpenAIResponseFresh } = require('../services/openaiService');
      
      await expect(getOpenAIResponseFresh('Hello world', 'formal')).rejects.toThrow(
        'OpenAI service is not configured'
      );
    });

    it('should handle successful API response', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'OpenAI response for Hello world'
          }
        }]
      });

      const result = await openAIResponse('Hello world', 'formal');
      expect(result).toBe('OpenAI response for Hello world');
      expect(mockOpenAICreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: '[*formal*] Hello world'
        }],
        max_tokens: 1024
      });
    });

    it('should handle empty response from OpenAI', async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [{
          message: {
            content: null
          }
        }]
      });

      const result = await openAIResponse('Hello world', 'formal');
      expect(result).toBe('No response from OpenAI.');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('getaddrinfo ENOTFOUND api.openai.com') as any;
      networkError.code = 'ENOTFOUND';
      mockOpenAICreate.mockRejectedValue(networkError);

      await expect(openAIResponse('Hello world', 'formal')).rejects.toThrow(
        'Network error: Unable to connect to OpenAI API'
      );
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key') as any;
      authError.status = 401;
      mockOpenAICreate.mockRejectedValue(authError);

      await expect(openAIResponse('Hello world', 'formal')).rejects.toThrow(
        'Authentication error: Invalid OpenAI API key'
      );
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded') as any;
      rateLimitError.status = 429;
      mockOpenAICreate.mockRejectedValue(rateLimitError);

      await expect(openAIResponse('Hello world', 'formal')).rejects.toThrow(
        'Rate limit error: Too many requests to OpenAI API'
      );
    });
  });

  describe('Anthropic Service', () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      
      // Need to re-import the service to get the updated environment
      jest.resetModules();
      const { getAnthropicResponse: getAnthropicResponseFresh } = require('../services/anthropicService');
      
      await expect(getAnthropicResponseFresh('Hello world', 'formal')).rejects.toThrow(
        'Anthropic service is not configured'
      );
    });

    it('should handle successful API response', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{
          type: 'text',
          text: 'Anthropic response for Hello world'
        }]
      });

      const result = await anthropicResponse('Hello world', 'formal');
      expect(result).toBe('Anthropic response for Hello world');
      expect(mockAnthropicCreate).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: '[*formal*] Hello world'
        }]
      });
    });

    it('should handle empty response from Anthropic', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: []
      });

      const result = await anthropicResponse('Hello world', 'formal');
      expect(result).toBe('No text response from Claude.');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('getaddrinfo ENOTFOUND api.anthropic.com') as any;
      networkError.code = 'ENOTFOUND';
      mockAnthropicCreate.mockRejectedValue(networkError);

      await expect(anthropicResponse('Hello world', 'formal')).rejects.toThrow(
        'Network error: Unable to connect to Anthropic API'
      );
    });
  });
}); 
import { Request, Response } from 'express';
import { rewrite } from '../controllers/rewriteController';

// Mock the services
jest.mock('../services/localmocService', () => ({
  getLocalmocResponse: jest.fn()
}));

jest.mock('../services/openaiService', () => ({
  getOpenAIResponse: jest.fn()
}));

jest.mock('../services/anthropicService', () => ({
  getAnthropicResponse: jest.fn()
}));

import { getLocalmocResponse } from '../services/localmocService';
import { getOpenAIResponse } from '../services/openaiService';
import { getAnthropicResponse } from '../services/anthropicService';

const mockGetLocalmocResponse = getLocalmocResponse as jest.MockedFunction<typeof getLocalmocResponse>;
const mockGetOpenAIResponse = getOpenAIResponse as jest.MockedFunction<typeof getOpenAIResponse>;
const mockGetAnthropicResponse = getAnthropicResponse as jest.MockedFunction<typeof getAnthropicResponse>;

describe('RewriteController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock response methods
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  describe('Successful requests', () => {
    it('should handle local mock service request', async () => {
      const mockRewritten = '[*formal*] Hello world';
      mockGetLocalmocResponse.mockResolvedValue(mockRewritten);
      
      mockRequest = {
        body: {
          text: 'Hello world',
          style: 'formal',
          llm: 'localmoc'
        }
      };

      await rewrite(mockRequest as Request, mockResponse as Response);

      expect(mockGetLocalmocResponse).toHaveBeenCalledWith('Hello world', 'formal');
      expect(mockJson).toHaveBeenCalledWith({
        original: 'Hello world',
        rewritten: mockRewritten,
        style: 'formal',
        llm: 'localmoc'
      });
      expect(mockStatus).not.toHaveBeenCalled(); // Should not set status for success
    });

    it('should handle OpenAI service request', async () => {
      const mockRewritten = 'OpenAI response for Hello world';
      mockGetOpenAIResponse.mockResolvedValue(mockRewritten);
      
      mockRequest = {
        body: {
          text: 'Hello world',
          style: 'pirate',
          llm: 'openai'
        }
      };

      await rewrite(mockRequest as Request, mockResponse as Response);

      expect(mockGetOpenAIResponse).toHaveBeenCalledWith('Hello world', 'pirate');
      expect(mockJson).toHaveBeenCalledWith({
        original: 'Hello world',
        rewritten: mockRewritten,
        style: 'pirate',
        llm: 'openai'
      });
    });

    it('should handle Anthropic service request', async () => {
      const mockRewritten = 'Anthropic response for Hello world';
      mockGetAnthropicResponse.mockResolvedValue(mockRewritten);
      
      mockRequest = {
        body: {
          text: 'Hello world',
          style: 'haiku',
          llm: 'anthropic'
        }
      };

      await rewrite(mockRequest as Request, mockResponse as Response);

      expect(mockGetAnthropicResponse).toHaveBeenCalledWith('Hello world', 'haiku');
      expect(mockJson).toHaveBeenCalledWith({
        original: 'Hello world',
        rewritten: mockRewritten,
        style: 'haiku',
        llm: 'anthropic'
      });
    });

    it('should default to formal style when no style provided', async () => {
      const mockRewritten = '[*formal*] Hello world';
      mockGetLocalmocResponse.mockResolvedValue(mockRewritten);
      
      mockRequest = {
        body: {
          text: 'Hello world',
          llm: 'localmoc'
        }
      };

      await rewrite(mockRequest as Request, mockResponse as Response);

      expect(mockGetLocalmocResponse).toHaveBeenCalledWith('Hello world', 'formal');
      expect(mockJson).toHaveBeenCalledWith({
        original: 'Hello world',
        rewritten: mockRewritten,
        style: 'formal',
        llm: 'localmoc'
      });
    });

    it('should default to local mock when no LLM specified', async () => {
      const mockRewritten = '[*formal*] Hello world';
      mockGetLocalmocResponse.mockResolvedValue(mockRewritten);
      
      mockRequest = {
        body: {
          text: 'Hello world',
          style: 'formal'
        }
      };

      await rewrite(mockRequest as Request, mockResponse as Response);

      expect(mockGetLocalmocResponse).toHaveBeenCalledWith('Hello world', 'formal');
      expect(mockJson).toHaveBeenCalledWith({
        original: 'Hello world',
        rewritten: mockRewritten,
        style: 'formal',
        llm: 'localmoc'
      });
    });
  });

  describe('Error handling', () => {
    it('should handle validation errors', async () => {
      mockRequest = {
        body: {
          text: '', // Invalid: empty text
          style: 'formal',
          llm: 'localmoc'
        }
      };

      await rewrite(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text is required and must be a string.'
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'OpenAI service is not configured';
      mockGetOpenAIResponse.mockRejectedValue(new Error(errorMessage));
      
      mockRequest = {
        body: {
          text: 'Hello world',
          style: 'formal',
          llm: 'openai'
        }
      };

      await rewrite(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: errorMessage,
        original: 'Hello world',
        rewritten: '',
        style: 'formal'
      });
    });

    it('should handle unknown errors', async () => {
      mockRequest = {
        body: {
          text: 'Hello world',
          style: 'formal',
          llm: 'localmoc'
        }
      };

      // Mock a non-Error object
      mockGetLocalmocResponse.mockRejectedValue('Unknown error');

      await rewrite(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to rewrite text',
        original: 'Hello world',
        rewritten: '',
        style: 'formal'
      });
    });
  });
}); 
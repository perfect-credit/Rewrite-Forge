import { validateRequest } from '../utils/validate';

describe('ValidateRequest', () => {
  it('should validate valid text and style', () => {
    const result = validateRequest('localmoc', 'Hello world', 'pirate');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  it('should reject missing text', () => {
    const result = validateRequest('localmoc', '', 'pirate');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Text is required and must be a string.');
  });

  it('should reject non-string text', () => {
    const result = validateRequest('localmoc', null as any, 'pirate');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Text is required and must be a string.');
  });

  it('should reject text longer than 5000 characters', () => {
    const longText = 'a'.repeat(5001);
    const result = validateRequest('localmoc', longText, 'pirate');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Text exceeds 5000 characters limit.');
  });

  it('should reject unknown style', () => {
    const result = validateRequest('localmoc', 'Hello world', 'invalid-style');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Unknown style: invalid-style');
  });

  it('should reject unknown LLM', () => {
    const result = validateRequest('invalid-llm', 'Hello world', 'pirate');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Unknown LLM: invalid-llm');
  });

  it('should accept valid styles', () => {
    const styles = ['pirate', 'haiku', 'formal'];
    styles.forEach(style => {
      const result = validateRequest('localmoc', 'Hello world', style);
      expect(result.valid).toBe(true);
    });
  });

  it('should accept valid LLMs', () => {
    const llms = ['localmoc', 'openai', 'anthropic'];
    llms.forEach(llm => {
      const result = validateRequest(llm, 'Hello world', 'formal');
      expect(result.valid).toBe(true);
    });
  });
}); 
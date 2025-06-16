const allowedStyles = ['pirate', 'haiku', 'formal'];
const allowedllms = ['localmoc', 'openai', 'anthropic'];

export function validateRequest(llm:string, text: string, style?: string) {
  if (!text || typeof text !== 'string') {
    return { valid: false, message: 'Text is required and must be a string.' };
  }
  if (text.length > 5000) {
    return { valid: false, message: 'Text exceeds 5000 characters limit.' };
  }
  if (llm && !allowedllms.includes(llm)) {
    return { valid: false, message: `Unknown LLM: ${llm}` };
  }
  if (style && !allowedStyles.includes(style)) {
    return { valid: false, message: `Unknown style: ${style}` };
  }
  return { valid: true, message: '' };
}
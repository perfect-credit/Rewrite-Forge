import request from 'supertest';
import app from '../app';

describe('Rewrite API Integration', () => {
  let server: any;

  beforeAll(() => {
    // Don't start the server in integration tests - use the app directly
  });

  afterAll(() => {
    // Clean up if needed
  });

  it('should rewrite text with pirate style', async () => {
    const response = await request(app)
      .post('/v1/rewrite')
      .send({
        text: 'Hello world',
        style: 'pirate',
        llm: 'localmoc'
      })
      .expect(200);

    expect(response.body).toHaveProperty('original', 'Hello world');
    expect(response.body).toHaveProperty('rewritten');
    expect(response.body).toHaveProperty('style', 'pirate');
    expect(response.body).toHaveProperty('llm', 'localmoc');
    expect(response.body.rewritten).toBe('[*pirate*] Hello world');
  });

  it('should use formal style as default', async () => {
    const response = await request(app)
      .post('/v1/rewrite')
      .send({
        text: 'Hello world',
        llm: 'localmoc'
      })
      .expect(200);

    expect(response.body).toHaveProperty('style', 'formal');
    expect(response.body.rewritten).toBe('[*formal*] Hello world');
  });

  it('should default to local mock when no LLM specified', async () => {
    const response = await request(app)
      .post('/v1/rewrite')
      .send({
        text: 'Hello world',
        style: 'haiku'
      })
      .expect(200);

    expect(response.body).toHaveProperty('llm', 'localmoc');
    expect(response.body.rewritten).toBe('[*haiku*] Hello world');
  });

  it('should reject missing text', async () => {
    const response = await request(app)
      .post('/v1/rewrite')
      .send({
        style: 'pirate',
        llm: 'localmoc'
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Text is required');
  });

  it('should reject unknown style', async () => {
    const response = await request(app)
      .post('/v1/rewrite')
      .send({
        text: 'Hello world',
        style: 'invalid-style',
        llm: 'localmoc'
      })
      .expect(400);

    expect(response.body.error).toContain('Unknown style');
  });

  it('should reject unknown LLM', async () => {
    const response = await request(app)
      .post('/v1/rewrite')
      .send({
        text: 'Hello world',
        style: 'pirate',
        llm: 'invalid-llm'
      })
      .expect(400);

    expect(response.body.error).toContain('Unknown LLM');
  });

  it('should reject text longer than 5000 characters', async () => {
    const longText = 'a'.repeat(5001);
    const response = await request(app)
      .post('/v1/rewrite')
      .send({
        text: longText,
        style: 'pirate',
        llm: 'localmoc'
      })
      .expect(400);

    expect(response.body.error).toContain('5000 characters');
  });
}); 
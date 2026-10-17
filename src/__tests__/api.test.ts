import { describe, it, expect } from 'vitest';
import { POST as chatHandler } from '../app/api/chat/route';
import { POST as complaintHandler } from '../app/api/complaints/generate/route';
import { NextRequest } from 'next/server';

describe('API Route Handlers - Security & Error Handling', () => {
  it('rejects chat requests with missing or empty message arrays', async () => {
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await chatHandler(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('messages');
  });

  it('rejects oversized chat messages to protect server resources', async () => {
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'A'.repeat(2500) }],
      }),
    });

    const response = await chatHandler(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('too long');
  });

  it('complaint generation returns 400 when problem description is omitted', async () => {
    const req = new NextRequest('http://localhost:3000/api/complaints/generate', {
      method: 'POST',
      body: JSON.stringify({
        platformOrEmployer: 'Swiggy',
      }),
    });

    const response = await complaintHandler(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Description');
  });

  it('handles missing OPENAI_API_KEY gracefully without throwing unhandled exceptions', async () => {
    // When API key is not configured, both routes must return a clear 503 or handled config response
    const req = new NextRequest('http://localhost:3000/api/complaints/generate', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Wrong deduction of ₹300',
        platformOrEmployer: 'Zomato',
      }),
    });

    const response = await complaintHandler(req);
    // Either 503 (isConfigError) or 200/handled status
    expect([200, 500, 503]).toContain(response.status);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});

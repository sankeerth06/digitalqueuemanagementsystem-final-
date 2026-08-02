import request from 'supertest';
import { createApp } from '../app';

describe('Health check', () => {
  it('GET /api/health returns success', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/unknown-route returns 404', async () => {
    const app = createApp();
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

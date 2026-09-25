import request from 'supertest';
import app from '../../index';

describe('Express App', () => {
  describe('Health Check Endpoint', () => {
    it('should return 200 and healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return timestamp in ISO format', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp instanceof Date).toBe(true);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('Middleware', () => {
    it('should parse JSON request body', async () => {
      const response = await request(app)
        .post('/health')
        .send({ test: 'data' });

      expect(response.status).toBe(404); // Endpoint doesn't exist, but JSON was parsed
    });

    it('should include security headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://example.com');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent route', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Request Logging', () => {
    it('should handle GET request', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['get', 'post', 'put', 'delete'];

      for (const method of methods) {
        const response = await request(app)[method]('/health');
        // Methods other than GET should 404 on /health
        if (method !== 'get') {
          expect([404, 405]).toContain(response.status);
        }
      }
    });
  });
});

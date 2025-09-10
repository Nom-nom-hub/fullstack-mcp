import request from 'supertest';
import app from '../index';

describe('Health Check Endpoint', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return version info', async () => {
    const response = await request(app).get('/version');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('timestamp');
  });
});
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth flow', () => {
  const app = createApp();

  it('registers a new student and returns an access token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Student',
      email: 'test.student@qserve.dev',
      password: 'Password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('student');
  });

  it('rejects duplicate registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Dup User',
      email: 'dup@qserve.dev',
      password: 'Password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup User 2',
      email: 'dup@qserve.dev',
      password: 'Password123',
    });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@qserve.dev',
      password: 'Password123',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@qserve.dev',
      password: 'Password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@qserve.dev',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(401);
  });
});

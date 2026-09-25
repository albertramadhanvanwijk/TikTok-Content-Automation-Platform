import request from 'supertest';
import app from '../../index';
import authController from '../../controllers/AuthController';
import userService from '../../services/userService';

jest.mock('../../services/userService');

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Register Endpoint', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        status: 'active',
        created_at: new Date(),
      };

      (userService.register as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        full_name: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.id).toBe('123');
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('should reject register with missing fields', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        // missing password
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('required');
    });

    it('should reject register with invalid email', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'notanemail',
        password: 'TestPassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid email');
    });

    it('should reject register with invalid username', async () => {
      (userService.validateUsername as jest.Mock).mockResolvedValue({
        isValid: false,
        errors: ['Username must be at least 3 characters long'],
      });

      const response = await request(app).post('/auth/register').send({
        username: 'ab',
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Username must be');
    });

    it('should handle registration errors', async () => {
      (userService.register as jest.Mock).mockRejectedValue(
        new Error('Email already registered')
      );

      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'existing@example.com',
        password: 'TestPassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Email already registered');
    });
  });

  describe('Login Endpoint', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          status: 'active',
          created_at: new Date(),
        },
        tokens: {
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
        },
      };

      (userService.login as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.tokens.accessToken).toBe('access_token_123');
      expect(response.body.data.user.id).toBe('123');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        // missing password
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('required');
    });

    it('should reject login with invalid credentials', async () => {
      (userService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid email or password')
      );

      const response = await request(app).post('/auth/login').send({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should return 401 on login error', async () => {
      (userService.login as jest.Mock).mockRejectedValue(
        new Error('User account is suspended')
      );

      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('User account is suspended');
    });
  });

  describe('Get Profile Endpoint', () => {
    it('should get profile with valid token', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        created_at: new Date(),
      };

      (userService.getProfile as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.id).toBe('123');
    });

    it('should reject profile access without token', async () => {
      const response = await request(app).get('/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('token');
    });

    it('should reject profile access with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('Invalid');
    });
  });
});

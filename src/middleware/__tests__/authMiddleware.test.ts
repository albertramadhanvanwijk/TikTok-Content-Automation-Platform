import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../../middleware/authMiddleware';
import authService from '../../services/authService';
import { Response, NextFunction } from 'express';

jest.mock('../../services/authService');

describe('Auth Middleware', () => {
  let mockReq: AuthRequest;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    } as AuthRequest;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate with valid token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      mockReq.headers = { authorization: 'Bearer valid_token' };

      (authService.verifyToken as jest.Mock).mockReturnValue(payload);

      authMiddleware(mockReq, mockRes as Response, mockNext);

      expect(mockReq.userId).toBe('123');
      expect(mockReq.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      mockReq.headers = {};

      authMiddleware(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Missing authorization token',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockReq.headers = { authorization: 'Bearer invalid_token' };

      (authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware(mockReq, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Invalid or expired token',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract token from Authorization header', () => {
      const payload = { userId: '456', email: 'user@example.com' };
      mockReq.headers = { authorization: 'Bearer extracted_token' };

      (authService.verifyToken as jest.Mock).mockReturnValue(payload);

      authMiddleware(mockReq, mockRes as Response, mockNext);

      expect(authService.verifyToken).toHaveBeenCalledWith('extracted_token');
      expect(mockReq.userId).toBe('456');
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should authenticate if valid token provided', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      mockReq.headers = { authorization: 'Bearer valid_token' };

      (authService.verifyToken as jest.Mock).mockReturnValue(payload);

      optionalAuthMiddleware(mockReq, mockRes as Response, mockNext);

      expect(mockReq.userId).toBe('123');
      expect(mockReq.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without token', () => {
      mockReq.headers = {};

      optionalAuthMiddleware(mockReq, mockRes as Response, mockNext);

      expect(mockReq.userId).toBeUndefined();
      expect(mockReq.email).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue with invalid token (not fail)', () => {
      mockReq.headers = { authorization: 'Bearer invalid_token' };

      (authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalAuthMiddleware(mockReq, mockRes as Response, mockNext);

      expect(mockReq.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

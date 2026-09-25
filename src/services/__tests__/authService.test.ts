import authService from '../../services/authService';

describe('AuthService', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hashed = await authService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it('should compare password correctly', async () => {
      const password = 'TestPassword123!';
      const hashed = await authService.hashPassword(password);

      const isMatch = await authService.comparePassword(password, hashed);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hashed = await authService.hashPassword(password);

      const isMatch = await authService.comparePassword('WrongPassword123!', hashed);
      expect(isMatch).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('should generate valid tokens', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const tokens = authService.generateTokens(payload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should verify access token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const tokens = authService.generateTokens(payload);
      const verified = authService.verifyToken(tokens.accessToken);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow();
    });
  });

  describe('Password Validation', () => {
    it('should validate strong password', () => {
      const result = authService.validatePassword('StrongPassword123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password too short', () => {
      const result = authService.validatePassword('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = authService.validatePassword('lowercase123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const result = authService.validatePassword('NoNumbers!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = authService.validatePassword('NoSpecial123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)');
    });
  });
});

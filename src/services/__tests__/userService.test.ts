import userService from '../../services/userService';
import userRepository from '../../repositories/UserRepository';
import authService from '../../services/authService';

// Mock dependencies
jest.mock('../../repositories/UserRepository');
jest.mock('../../services/authService');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('should register a new user successfully', async () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        full_name: 'Test User',
      };

      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        full_name: 'Test User',
        status: 'active',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
        email_verified: false,
        two_factor_enabled: false,
      };

      (authService.validatePassword as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (authService.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (userRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.toResponseObject as jest.Mock).mockResolvedValue({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        status: 'active',
        created_at: new Date(),
      });

      const result = await userService.register(input);

      expect(result.id).toBe('123');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
    });

    it('should reject if password is invalid', async () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      };

      (authService.validatePassword as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      await expect(userService.register(input)).rejects.toThrow(
        'Password validation failed'
      );
    });

    it('should reject if email already exists', async () => {
      const input = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'TestPassword123!',
      };

      (authService.validatePassword as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: '456',
        email: 'existing@example.com',
      });

      await expect(userService.register(input)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should reject if username already exists', async () => {
      const input = {
        username: 'existing',
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      (authService.validatePassword as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.findByUsername as jest.Mock).mockResolvedValue({
        id: '456',
        username: 'existing',
      });

      await expect(userService.register(input)).rejects.toThrow(
        'Username already taken'
      );
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        status: 'active',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (authService.comparePassword as jest.Mock).mockResolvedValue(true);
      (authService.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
      (userRepository.updateLastLogin as jest.Mock).mockResolvedValue(undefined);
      (userRepository.toResponseObject as jest.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const result = await userService.login('test@example.com', 'password');

      expect(result.tokens.accessToken).toBe('access_token');
      expect(result.user.id).toBe('123');
    });

    it('should reject if user not found', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.login('notfound@example.com', 'password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject if password is incorrect', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        status: 'active',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (authService.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        userService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject if user is not active', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        status: 'suspended',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        userService.login('test@example.com', 'password')
      ).rejects.toThrow('User account is suspended');
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email format', async () => {
      const result = await userService.validateEmail('test@example.com');
      expect(result).toBe(true);
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ];

      for (const email of invalidEmails) {
        const result = await userService.validateEmail(email);
        expect(result).toBe(false);
      }
    });
  });

  describe('Username Validation', () => {
    it('should validate valid username', async () => {
      const result = await userService.validateUsername('valid_user-123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject username too short', async () => {
      const result = await userService.validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Username must be at least 3 characters long'
      );
    });

    it('should reject username too long', async () => {
      const result = await userService.validateUsername('a'.repeat(51));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Username must be at most 50 characters long'
      );
    });

    it('should reject username with invalid characters', async () => {
      const result = await userService.validateUsername('user@name');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Username can only contain letters, numbers, underscores, and hyphens'
      );
    });
  });

  describe('Get Profile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        status: 'active',
      };

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.toResponseObject as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getProfile('123');

      expect(result.id).toBe('123');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error if user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(userService.getProfile('invalid')).rejects.toThrow(
        'User not found'
      );
    });
  });
});

import authService from './authService';
import userRepository from '../repositories/UserRepository';
import { CreateUserInput, UserResponse } from '../models/User';
import logger from '../utils/logger';

class UserService {
  async register(input: CreateUserInput): Promise<UserResponse> {
    try {
      // Validate password strength
      const validation = authService.validatePassword(input.password);
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if email already exists
      const existingEmail = await userRepository.findByEmail(input.email);
      if (existingEmail) {
        throw new Error('Email already registered');
      }

      // Check if username already exists
      const existingUsername = await userRepository.findByUsername(input.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Hash password
      const passwordHash = await authService.hashPassword(input.password);

      // Create user
      const user = await userRepository.create(input, passwordHash);

      logger.info(`User created: ${user.id} (${user.email})`);

      // Return response without password hash
      return userRepository.toResponseObject(user);
    } catch (error) {
      logger.error('Error registering user', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: UserResponse; tokens: any }> {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error(`User account is ${user.status}`);
      }

      // Verify password
      const isPasswordValid = await authService.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = authService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Update last login
      await userRepository.updateLastLogin(user.id);

      logger.info(`User logged in: ${user.id} (${user.email})`);

      const userResponse = await userRepository.toResponseObject(user);

      return {
        user: userResponse,
        tokens,
      };
    } catch (error) {
      logger.error('Error logging in user', error);
      throw error;
    }
  }

  async getProfile(userId: string): Promise<UserResponse> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return userRepository.toResponseObject(user);
    } catch (error) {
      logger.error('Error getting user profile', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = authService.verifyToken(refreshToken);
      
      if (!payload || payload.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const user = await userRepository.findById(payload.userId);
      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      const tokens = authService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      logger.info(`Token refreshed for user: ${user.id}`);
      return tokens;
    } catch (error) {
      logger.error('Error refreshing token', error);
      throw error;
    }
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async validateUsername(username: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 50) {
      errors.push('Username must be at most 50 characters long');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) return null;
      return userRepository.toResponseObject(user);
    } catch (error) {
      logger.error('Error finding user by email', error);
      throw error;
    }
  }

  async updateProfile(userId: string, data: { full_name?: string; email?: string }): Promise<UserResponse> {
    try {
      const user = await userRepository.updateProfile(userId, data);
      logger.info(`Profile updated for user: ${userId}`);
      return userRepository.toResponseObject(user);
    } catch (error) {
      logger.error('Error updating profile', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Validate new password
      const validation = authService.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }

      // Get user with password hash
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await authService.comparePassword(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await authService.hashPassword(newPassword);

      // Update password
      await userRepository.updatePassword(userId, newPasswordHash);

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('Error changing password', error);
      throw error;
    }
  }
}

export default new UserService();

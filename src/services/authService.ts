import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  private jwtExpire = process.env.JWT_EXPIRE || '7d';

  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Error hashing password', error);
      throw error;
    }
  }

  async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Error comparing password', error);
      throw error;
    }
  }

  generateTokens(payload: AuthPayload): Tokens {
    try {
      const accessToken = jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpire,
      });

      const refreshToken = jwt.sign(payload, this.jwtSecret, {
        expiresIn: '30d',
      });

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Error generating tokens', error);
      throw error;
    }
  }

  verifyToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as AuthPayload;
    } catch (error) {
      logger.error('Error verifying token', error);
      throw error;
    }
  }

  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new AuthService();

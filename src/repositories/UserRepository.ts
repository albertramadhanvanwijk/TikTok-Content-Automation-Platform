import database from '../database/connection';
import { User, CreateUserInput, UserResponse } from '../models/User';
import logger from '../utils/logger';

class UserRepository {
  async create(input: CreateUserInput, passwordHash: string): Promise<User> {
    const query = `
      INSERT INTO users (username, email, password_hash, full_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, password_hash, full_name, avatar_url, bio, 
                status, role, created_at, updated_at, last_login_at, 
                email_verified, email_verified_at, two_factor_enabled, settings
    `;

    try {
      const result = await database.query(query, [
        input.username,
        input.email,
        passwordHash,
        input.full_name || null,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      return result.rows[0] as User;
    } catch (error) {
      logger.error('Error creating user', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, username, email, password_hash, full_name, avatar_url, bio, 
             status, role, created_at, updated_at, last_login_at, 
             email_verified, email_verified_at, two_factor_enabled, settings
      FROM users
      WHERE email = $1
    `;

    try {
      const result = await database.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email', error);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT id, username, email, password_hash, full_name, avatar_url, bio, 
             status, role, created_at, updated_at, last_login_at, 
             email_verified, email_verified_at, two_factor_enabled, settings
      FROM users
      WHERE username = $1
    `;

    try {
      const result = await database.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by username', error);
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, username, email, password_hash, full_name, avatar_url, bio, 
             status, role, created_at, updated_at, last_login_at, 
             email_verified, email_verified_at, two_factor_enabled, settings
      FROM users
      WHERE id = $1
    `;

    try {
      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by id', error);
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await database.query(query, [userId]);
    } catch (error) {
      logger.error('Error updating last login', error);
      throw error;
    }
  }

  async toResponseObject(user: User): Promise<UserResponse> {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    };
  }

  async updateProfile(userId: string, data: { full_name?: string; email?: string }): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (data.full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(data.full_name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }

    if (updates.length === 0) {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');
      return user;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, username, email, password_hash, full_name, avatar_url, bio, 
                status, role, created_at, updated_at, last_login_at, 
                email_verified, email_verified_at, two_factor_enabled, settings
    `;

    try {
      const result = await database.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      return result.rows[0] as User;
    } catch (error) {
      logger.error('Error updating profile', error);
      throw error;
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const query = `
      UPDATE users
      SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await database.query(query, [userId, passwordHash]);
    } catch (error) {
      logger.error('Error updating password', error);
      throw error;
    }
  }
}

export default new UserRepository();

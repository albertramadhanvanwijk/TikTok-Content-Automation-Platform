export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'admin' | 'moderator';
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  email_verified: boolean;
  email_verified_at?: Date;
  two_factor_enabled: boolean;
  settings?: Record<string, any>;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  status: string;
  created_at: Date;
}

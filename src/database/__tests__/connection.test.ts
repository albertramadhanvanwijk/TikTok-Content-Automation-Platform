import database from '../../database/connection';

describe('Database Connection', () => {
  describe('Connection Management', () => {
    it('should have pool initialized', () => {
      const pool = database.getPool();
      expect(pool).toBeDefined();
    });

    it('should be able to get pool configuration', () => {
      const pool = database.getPool();
      expect(pool.options).toBeDefined();
      expect(pool.options.host).toBe(process.env.DB_HOST || 'localhost');
    });
  });

  describe('Query Interface', () => {
    it('should have query method', () => {
      expect(typeof database.query).toBe('function');
    });

    it('should have connect method', () => {
      expect(typeof database.connect).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof database.close).toBe('function');
    });
  });

  describe('Configuration', () => {
    it('should use correct database name from env', () => {
      const pool = database.getPool();
      expect(pool.options.database).toBe(process.env.DB_NAME || 'tiktok_carousel_dev');
    });

    it('should use correct user from env', () => {
      const pool = database.getPool();
      expect(pool.options.user).toBe(process.env.DB_USER || 'postgres');
    });

    it('should have connection timeout settings', () => {
      const pool = database.getPool();
      expect(pool.options.connectionTimeoutMillis).toBe(2000);
    });

    it('should have idle timeout settings', () => {
      const pool = database.getPool();
      expect(pool.options.idleTimeoutMillis).toBe(30000);
    });
  });
});

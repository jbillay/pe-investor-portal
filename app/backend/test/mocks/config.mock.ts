/**
 * Mock Config Service Factory
 * Provides test configuration values
 */

export const createMockConfigService = () => ({
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_EXPIRATION: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRATION: '7d',
      BCRYPT_ROUNDS: '4',
      DATABASE_URL: 'postgresql://test',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      NODE_ENV: 'test',
    };
    return config[key] !== undefined ? config[key] : defaultValue;
  }),
  getOrThrow: jest.fn((key: string) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_EXPIRATION: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRATION: '7d',
      BCRYPT_ROUNDS: '4',
      DATABASE_URL: 'postgresql://test',
    };
    if (config[key] === undefined) {
      throw new Error(`Config key ${key} not found`);
    }
    return config[key];
  }),
});

export type MockConfigService = ReturnType<typeof createMockConfigService>;

/**
 * Mock JWT Service Factory
 * Mocks JWT token generation and verification
 */

export const createMockJwtService = () => ({
  sign: jest.fn((payload: any, options?: any) => {
    return `mock.jwt.token.${payload.sub || payload.id}`;
  }),
  signAsync: jest.fn((payload: any, options?: any) => {
    return Promise.resolve(`mock.jwt.token.${payload.sub || payload.id}`);
  }),
  verify: jest.fn((token: string, options?: any) => {
    if (token.startsWith('mock.jwt.token.')) {
      const userId = token.split('.').pop();
      return { sub: userId, email: 'test@example.com' };
    }
    throw new Error('Invalid token');
  }),
  verifyAsync: jest.fn((token: string, options?: any) => {
    if (token.startsWith('mock.jwt.token.')) {
      const userId = token.split('.').pop();
      return Promise.resolve({ sub: userId, email: 'test@example.com' });
    }
    return Promise.reject(new Error('Invalid token'));
  }),
  decode: jest.fn((token: string, options?: any) => {
    if (token.startsWith('mock.jwt.token.')) {
      const userId = token.split('.').pop();
      return { sub: userId, email: 'test@example.com' };
    }
    return null;
  }),
});

export type MockJwtService = ReturnType<typeof createMockJwtService>;

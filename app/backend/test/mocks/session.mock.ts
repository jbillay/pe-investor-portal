/**
 * Mock Session Service Factory
 * Mocks session management operations
 */

export const createMockSessionService = () => ({
  createSession: jest.fn().mockResolvedValue(undefined),
  getSession: jest.fn().mockResolvedValue(null),
  revokeSession: jest.fn().mockResolvedValue(undefined),
  revokeAllUserSessions: jest.fn().mockResolvedValue(undefined),
  getUserSessions: jest.fn().mockResolvedValue([]),
  cleanupExpiredSessions: jest.fn().mockResolvedValue(0),
});

export type MockSessionService = ReturnType<typeof createMockSessionService>;

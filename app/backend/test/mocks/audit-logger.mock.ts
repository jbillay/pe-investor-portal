/**
 * Mock Audit Logger Service Factory
 * Mocks audit logging operations
 */

export const createMockAuditLoggerService = () => ({
  logAuthEvent: jest.fn().mockResolvedValue(undefined),
  logAccessEvent: jest.fn().mockResolvedValue(undefined),
  logDataChange: jest.fn().mockResolvedValue(undefined),
  logSecurityEvent: jest.fn().mockResolvedValue(undefined),
  getAuditLogs: jest.fn().mockResolvedValue([]),
});

export type MockAuditLoggerService = ReturnType<typeof createMockAuditLoggerService>;

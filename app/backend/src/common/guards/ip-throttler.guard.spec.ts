import { IpThrottlerGuard } from './ip-throttler.guard';

describe('IpThrottlerGuard', () => {
  let guard: IpThrottlerGuard;

  beforeEach(() => {
    // Create instance directly without DI to test the logic
    guard = new IpThrottlerGuard(
      {} as any, // options (not used in our tests)
      {} as any, // storage (not used in our tests)
      {} as any, // reflector (not used in our tests)
    );
  });

  describe('getTracker', () => {
    it('should return IP from x-forwarded-for header', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('203.0.113.1');
    });

    it('should trim whitespace from x-forwarded-for IP', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-forwarded-for': '  192.168.1.1  , 10.0.0.1',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('192.168.1.1');
    });

    it('should return IP from x-real-ip header when x-forwarded-for is not present', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-real-ip': '198.51.100.50',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('198.51.100.50');
    });

    it('should trim whitespace from x-real-ip', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-real-ip': '  10.0.0.5  ',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('10.0.0.5');
    });

    it('should return IP from connection.remoteAddress when no proxy headers are present', async () => {
      // Arrange
      const mockReq = {
        headers: {},
        connection: {
          remoteAddress: '172.16.0.100',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('172.16.0.100');
    });

    it('should return IP from socket.remoteAddress when connection.remoteAddress is not available', async () => {
      // Arrange
      const mockReq = {
        headers: {},
        connection: {},
        socket: {
          remoteAddress: '192.168.0.10',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('192.168.0.10');
    });

    it('should return IP from req.ip when other sources are not available', async () => {
      // Arrange
      const mockReq = {
        headers: {},
        connection: {},
        socket: {},
        ip: '10.1.1.1',
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('10.1.1.1');
    });

    it('should return "unknown" when no IP source is available', async () => {
      // Arrange
      const mockReq = {
        headers: {},
        connection: {},
        socket: {},
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('unknown');
    });

    it('should prefer x-forwarded-for over x-real-ip', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '198.51.100.1',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('203.0.113.1');
    });

    it('should prefer x-real-ip over connection.remoteAddress', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-real-ip': '198.51.100.1',
        },
        connection: {
          remoteAddress: '172.16.0.1',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('198.51.100.1');
    });

    it('should prefer connection.remoteAddress over socket.remoteAddress', async () => {
      // Arrange
      const mockReq = {
        headers: {},
        connection: {
          remoteAddress: '172.16.0.1',
        },
        socket: {
          remoteAddress: '192.168.0.1',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('172.16.0.1');
    });

    it('should prefer socket.remoteAddress over req.ip', async () => {
      // Arrange
      const mockReq = {
        headers: {},
        connection: {},
        socket: {
          remoteAddress: '192.168.0.1',
        },
        ip: '10.0.0.1',
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('192.168.0.1');
    });

    it('should handle x-forwarded-for with single IP', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.1',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('203.0.113.1');
    });

    it('should handle empty headers object', async () => {
      // Arrange
      const mockReq = {
        headers: {},
        ip: '10.0.0.1',
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('10.0.0.1');
    });

    it('should handle undefined headers', async () => {
      // Arrange
      const mockReq = {
        ip: '10.0.0.1',
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('10.0.0.1');
    });
  });

  describe('getClientIp', () => {
    it('should extract first IP from comma-separated x-forwarded-for', () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.1',
        },
      };

      // Act
      const result = guard['getClientIp'](mockReq);

      // Assert
      expect(result).toBe('203.0.113.1');
    });

    it('should handle IPv6 addresses in x-forwarded-for', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334, 198.51.100.1',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should handle IPv6 addresses in x-real-ip', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-real-ip': '2001:0db8:85a3::8a2e:0370:7334',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('2001:0db8:85a3::8a2e:0370:7334');
    });

    it('should return unknown when headers is undefined and no fallback is available', () => {
      // Arrange
      const mockReq = {};

      // Act
      const result = guard['getClientIp'](mockReq);

      // Assert
      expect(result).toBe('unknown');
    });

    it('should handle multiple spaces in x-forwarded-for', async () => {
      // Arrange
      const mockReq = {
        headers: {
          'x-forwarded-for': '    10.0.0.1    ,    192.168.1.1    ',
        },
      };

      // Act
      const result = await guard['getTracker'](mockReq);

      // Assert
      expect(result).toBe('10.0.0.1');
    });
  });
});

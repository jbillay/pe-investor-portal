import { BadRequestException } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common';
import { ParseCuidPipe } from './parse-cuid.pipe';

describe('ParseCuidPipe', () => {
  let pipe: ParseCuidPipe;
  let metadata: ArgumentMetadata;

  beforeEach(() => {
    pipe = new ParseCuidPipe();
    metadata = {
      type: 'param',
      metatype: String,
      data: 'id',
    };
  });

  describe('valid CUIDs', () => {
    it('should pass valid CUID', () => {
      // Arrange
      const validCuid = 'clfa2qhe40000j3gbahzp12s4';

      // Act
      const result = pipe.transform(validCuid, metadata);

      // Assert
      expect(result).toBe(validCuid);
    });

    it('should pass another valid CUID', () => {
      // Arrange
      const validCuid = 'cljk0x5a10001qz6z9k8z9k8z';

      // Act
      const result = pipe.transform(validCuid, metadata);

      // Assert
      expect(result).toBe(validCuid);
    });

    it('should pass CUID with all lowercase letters', () => {
      // Arrange
      const validCuid = 'cabcdefghijklmnopqrstuvwx';

      // Act
      const result = pipe.transform(validCuid, metadata);

      // Assert
      expect(result).toBe(validCuid);
    });

    it('should pass CUID with all numbers', () => {
      // Arrange
      const validCuid = 'c012345678901234567890123';

      // Act
      const result = pipe.transform(validCuid, metadata);

      // Assert
      expect(result).toBe(validCuid);
    });

    it('should pass CUID with mix of letters and numbers', () => {
      // Arrange
      const validCuid = 'c1a2b3c4d5e6f7g8h9i0j1k2l';

      // Act
      const result = pipe.transform(validCuid, metadata);

      // Assert
      expect(result).toBe(validCuid);
    });
  });

  describe('invalid CUIDs', () => {
    it('should throw BadRequestException for empty string', () => {
      // Arrange
      const invalidCuid = '';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow('id is required');
    });

    it('should throw BadRequestException for null value', () => {
      // Act & Assert
      expect(() => pipe.transform(null as any, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(null as any, metadata)).toThrow('id is required');
    });

    it('should throw BadRequestException for undefined value', () => {
      // Act & Assert
      expect(() => pipe.transform(undefined as any, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(undefined as any, metadata)).toThrow('id is required');
    });

    it('should throw BadRequestException for non-string value', () => {
      // Act & Assert
      expect(() => pipe.transform(123 as any, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(123 as any, metadata)).toThrow('id must be a string');
    });

    it('should throw BadRequestException for CUID not starting with "c"', () => {
      // Arrange
      const invalidCuid = 'dlfa2qhe40000j3gbahzp12s4';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(
        'id must be a valid CUID identifier',
      );
    });

    it('should throw BadRequestException for CUID with uppercase letters', () => {
      // Arrange
      const invalidCuid = 'CLFA2QHE40000J3GBAHZP12S4';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(
        'id must be a valid CUID identifier',
      );
    });

    it('should throw BadRequestException for CUID with special characters', () => {
      // Arrange
      const invalidCuid = 'clfa2qhe40000j3gbahzp12s!';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for CUID that is too short', () => {
      // Arrange
      const invalidCuid = 'clfa2qhe40000j3gbahzp12';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for CUID that is too long', () => {
      // Arrange
      const invalidCuid = 'clfa2qhe40000j3gbahzp12s44';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for UUID instead of CUID', () => {
      // Arrange
      const uuid = '550e8400-e29b-41d4-a716-446655440000';

      // Act & Assert
      expect(() => pipe.transform(uuid, metadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for random string', () => {
      // Arrange
      const randomString = 'not-a-valid-cuid-at-all';

      // Act & Assert
      expect(() => pipe.transform(randomString, metadata)).toThrow(BadRequestException);
    });
  });

  describe('metadata handling', () => {
    it('should use parameter name from metadata in error messages', () => {
      // Arrange
      const invalidCuid = 'invalid';
      const customMetadata: ArgumentMetadata = {
        type: 'param',
        metatype: String,
        data: 'userId',
      };

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, customMetadata)).toThrow('userId must be a valid CUID identifier');
    });

    it('should use default parameter name when metadata.data is not provided', () => {
      // Arrange
      const invalidCuid = 'invalid';
      const metadataWithoutData: ArgumentMetadata = {
        type: 'param',
        metatype: String,
      };

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadataWithoutData)).toThrow(
        'Parameter must be a valid CUID identifier',
      );
    });

    it('should use custom parameter name for required validation', () => {
      // Arrange
      const customMetadata: ArgumentMetadata = {
        type: 'param',
        metatype: String,
        data: 'roleId',
      };

      // Act & Assert
      expect(() => pipe.transform('', customMetadata)).toThrow('roleId is required');
    });

    it('should use default parameter name for required validation when no metadata.data', () => {
      // Arrange
      const metadataWithoutData: ArgumentMetadata = {
        type: 'param',
        metatype: String,
      };

      // Act & Assert
      expect(() => pipe.transform('', metadataWithoutData)).toThrow('Parameter is required');
    });
  });

  describe('edge cases', () => {
    it('should handle CUID starting with c followed by all zeros', () => {
      // Arrange
      const cuid = 'c000000000000000000000000';

      // Act
      const result = pipe.transform(cuid, metadata);

      // Assert
      expect(result).toBe(cuid);
    });

    it('should reject CUID with spaces', () => {
      // Arrange
      const invalidCuid = 'clfa2qhe40000j3gbahzp12s ';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
    });

    it('should reject CUID with hyphens', () => {
      // Arrange
      const invalidCuid = 'clfa2qhe4-000j3gbahzp12s4';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
    });

    it('should reject CUID with underscores', () => {
      // Arrange
      const invalidCuid = 'clfa2qhe4_000j3gbahzp12s4';

      // Act & Assert
      expect(() => pipe.transform(invalidCuid, metadata)).toThrow(BadRequestException);
    });
  });
});

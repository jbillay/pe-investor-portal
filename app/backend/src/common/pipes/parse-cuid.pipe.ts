import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Validation pipe for CUID (Collision-resistant Universal Identifier) strings
 *
 * CUIDs are used as primary keys in our Prisma schema instead of UUIDs.
 * This pipe validates that a string parameter is a valid CUID format.
 *
 * CUID format: 25 characters, starts with 'c', followed by 24 base32 characters
 * Example: clfa2qhe40000j3gbahzp12s4
 *
 * @example
 * ```typescript
 * @Get(':id')
 * async findOne(@Param('id', ParseCuidPipe) id: string) {
 *   // id is guaranteed to be a valid CUID
 * }
 * ```
 */
@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  // CUID regex: starts with 'c', followed by 24 base32 characters (a-z, 0-9)
  private readonly cuidRegex = /^c[a-z0-9]{24}$/;

  /**
   * Transform and validate the input value
   *
   * @param value - The value to validate
   * @param metadata - Metadata about the parameter
   * @returns The validated CUID string
   * @throws BadRequestException if the value is not a valid CUID
   */
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException(`${metadata.data || 'Parameter'} is required`);
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${metadata.data || 'Parameter'} must be a string`);
    }

    // Validate CUID format
    if (!this.cuidRegex.test(value)) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} must be a valid CUID identifier (format: c + 24 alphanumeric characters)`
      );
    }

    return value;
  }
}
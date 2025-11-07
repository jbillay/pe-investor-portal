import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { usePasswordStrength, getPasswordRequirementDescriptions } from '../usePasswordStrength'

describe('usePasswordStrength', () => {
  describe('requirements', () => {
    it('should check length requirement', () => {
      const password = ref('Short1!')
      const { requirements } = usePasswordStrength(password)

      expect(requirements.value.length).toBe(false)

      password.value = 'LongEnough12!'
      expect(requirements.value.length).toBe(true)
    })

    it('should check uppercase requirement', () => {
      const password = ref('nocapitals123!')
      const { requirements } = usePasswordStrength(password)

      expect(requirements.value.uppercase).toBe(false)

      password.value = 'HasCapital123!'
      expect(requirements.value.uppercase).toBe(true)
    })

    it('should check lowercase requirement', () => {
      const password = ref('ALLCAPS123!')
      const { requirements } = usePasswordStrength(password)

      expect(requirements.value.lowercase).toBe(false)

      password.value = 'HasLower123!'
      expect(requirements.value.lowercase).toBe(true)
    })

    it('should check number requirement', () => {
      const password = ref('NoNumbers!')
      const { requirements } = usePasswordStrength(password)

      expect(requirements.value.number).toBe(false)

      password.value = 'HasNumber1!'
      expect(requirements.value.number).toBe(true)
    })

    it('should check special character requirement', () => {
      const password = ref('NoSpecialChars1')
      const { requirements } = usePasswordStrength(password)

      expect(requirements.value.special).toBe(false)

      password.value = 'HasSpecial1!'
      expect(requirements.value.special).toBe(true)
    })

    it('should reactively update when password changes', () => {
      const password = ref('')
      const { requirements } = usePasswordStrength(password)

      expect(requirements.value.length).toBe(false)
      expect(requirements.value.uppercase).toBe(false)

      password.value = 'ValidPassword123!'
      expect(requirements.value.length).toBe(true)
      expect(requirements.value.uppercase).toBe(true)
      expect(requirements.value.lowercase).toBe(true)
      expect(requirements.value.number).toBe(true)
      expect(requirements.value.special).toBe(true)
    })
  })

  describe('strength', () => {
    it('should return weak strength for 0-2 requirements', () => {
      const password = ref('weak')
      const { strength } = usePasswordStrength(password)

      expect(strength.value.level).toBe('weak')
      expect(strength.value.label).toBe('Weak')
      expect(strength.value.percentage).toBe(30)
      expect(strength.value.color).toBe('text-error-600')
      expect(strength.value.bgColor).toBe('bg-error-500')
    })

    it('should return medium strength for 3-4 requirements', () => {
      const password = ref('Medium123')
      const { strength } = usePasswordStrength(password)

      expect(strength.value.level).toBe('medium')
      expect(strength.value.label).toBe('Medium')
      expect(strength.value.percentage).toBe(60)
      expect(strength.value.color).toBe('text-warning-600')
      expect(strength.value.bgColor).toBe('bg-warning-500')
    })

    it('should return strong strength for all 5 requirements', () => {
      const password = ref('StrongPassword123!')
      const { strength } = usePasswordStrength(password)

      expect(strength.value.level).toBe('strong')
      expect(strength.value.label).toBe('Strong')
      expect(strength.value.percentage).toBe(100)
      expect(strength.value.color).toBe('text-success-600')
      expect(strength.value.bgColor).toBe('bg-success-500')
    })
  })

  describe('isValid', () => {
    it('should return false for empty password', () => {
      const password = ref('')
      const { isValid } = usePasswordStrength(password)

      expect(isValid.value).toBe(false)
    })

    it('should return false when not all requirements are met', () => {
      const password = ref('Weak1')
      const { isValid } = usePasswordStrength(password)

      expect(isValid.value).toBe(false)
    })

    it('should return true when all requirements are met', () => {
      const password = ref('ValidPassword123!')
      const { isValid } = usePasswordStrength(password)

      expect(isValid.value).toBe(true)
    })
  })

  describe('meetsAllRequirements', () => {
    it('should return false when any requirement is not met', () => {
      const password = ref('NoSpecial123')
      const { meetsAllRequirements } = usePasswordStrength(password)

      expect(meetsAllRequirements.value).toBe(false)
    })

    it('should return true when all requirements are met', () => {
      const password = ref('ValidPassword123!')
      const { meetsAllRequirements } = usePasswordStrength(password)

      expect(meetsAllRequirements.value).toBe(true)
    })
  })

  describe('validatePassword', () => {
    const password = ref('')
    const { validatePassword } = usePasswordStrength(password)

    it('should return error for empty password', () => {
      const result = validatePassword('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is required')
    })

    it('should return error for short password', () => {
      const result = validatePassword('Short1!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 12 characters long')
    })

    it('should return error for missing uppercase', () => {
      const result = validatePassword('lowercase123!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should return error for missing lowercase', () => {
      const result = validatePassword('UPPERCASE123!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should return error for missing number', () => {
      const result = validatePassword('NoNumbersHere!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should return error for missing special character', () => {
      const result = validatePassword('NoSpecialChars1')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
      )
    })

    it('should return all errors for weak password', () => {
      const result = validatePassword('weak')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('Password must be at least 12 characters long')
    })

    it('should return no errors for valid password', () => {
      const result = validatePassword('ValidPassword123!')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should check password match when confirmPassword provided', () => {
      const result = validatePassword('ValidPassword123!', 'DifferentPassword123!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Passwords do not match')
    })

    it('should validate successfully when passwords match', () => {
      const result = validatePassword('ValidPassword123!', 'ValidPassword123!')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate all special characters', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>'
      for (const char of specialChars) {
        const pwd = `ValidPassword1${char}`
        const result = validatePassword(pwd)
        expect(result.isValid).toBe(true)
      }
    })
  })

  describe('checkPasswordMatch', () => {
    const password = ref('')
    const { checkPasswordMatch } = usePasswordStrength(password)

    it('should return true when passwords match and not empty', () => {
      expect(checkPasswordMatch('password', 'password')).toBe(true)
    })

    it('should return false when passwords do not match', () => {
      expect(checkPasswordMatch('password1', 'password2')).toBe(false)
    })

    it('should return false when passwords are empty', () => {
      expect(checkPasswordMatch('', '')).toBe(false)
    })

    it('should return false when one password is empty', () => {
      expect(checkPasswordMatch('password', '')).toBe(false)
      expect(checkPasswordMatch('', 'password')).toBe(false)
    })
  })

  describe('cannotBeTemporaryPassword', () => {
    const password = ref('')
    const { cannotBeTemporaryPassword } = usePasswordStrength(password)

    it('should return true when passwords are different', () => {
      expect(cannotBeTemporaryPassword('newPassword', 'tempPassword')).toBe(true)
    })

    it('should return false when passwords are the same', () => {
      expect(cannotBeTemporaryPassword('samePassword', 'samePassword')).toBe(false)
    })

    it('should handle empty strings', () => {
      expect(cannotBeTemporaryPassword('', '')).toBe(false)
      expect(cannotBeTemporaryPassword('newPassword', '')).toBe(true)
      expect(cannotBeTemporaryPassword('', 'tempPassword')).toBe(true)
    })
  })

  describe('getPasswordRequirementDescriptions', () => {
    it('should return all requirement descriptions', () => {
      const descriptions = getPasswordRequirementDescriptions()

      expect(descriptions).toHaveLength(5)
      expect(descriptions[0]).toEqual({ key: 'length', label: 'At least 12 characters' })
      expect(descriptions[1]).toEqual({ key: 'uppercase', label: 'One uppercase letter' })
      expect(descriptions[2]).toEqual({ key: 'lowercase', label: 'One lowercase letter' })
      expect(descriptions[3]).toEqual({ key: 'number', label: 'One number' })
      expect(descriptions[4]).toEqual({ key: 'special', label: 'One special character' })
    })

    it('should have correct keys matching PasswordRequirements', () => {
      const descriptions = getPasswordRequirementDescriptions()
      const keys = descriptions.map((d) => d.key)

      expect(keys).toContain('length')
      expect(keys).toContain('uppercase')
      expect(keys).toContain('lowercase')
      expect(keys).toContain('number')
      expect(keys).toContain('special')
    })
  })

  describe('real-world scenarios', () => {
    it('should handle gradual password building', () => {
      const password = ref('')
      const { requirements, strength, isValid } = usePasswordStrength(password)

      // Start with nothing
      expect(isValid.value).toBe(false)
      expect(strength.value.level).toBe('weak')

      // Add lowercase
      password.value = 'password'
      expect(requirements.value.lowercase).toBe(true)
      expect(strength.value.level).toBe('weak')

      // Add uppercase
      password.value = 'Password'
      expect(requirements.value.uppercase).toBe(true)
      expect(strength.value.level).toBe('weak')

      // Add number
      password.value = 'Password1'
      expect(requirements.value.number).toBe(true)
      expect(strength.value.level).toBe('medium')

      // Add special char
      password.value = 'Password1!'
      expect(requirements.value.special).toBe(true)
      expect(strength.value.level).toBe('medium')

      // Make it long enough
      password.value = 'Password123!'
      expect(requirements.value.length).toBe(true)
      expect(strength.value.level).toBe('strong')
      expect(isValid.value).toBe(true)
    })

    it('should validate common password patterns', () => {
      const password = ref('')
      const { validatePassword } = usePasswordStrength(password)

      // Common weak patterns
      const weakPasswords = [
        'password',
        'Password',
        'Password1',
        '12345678',
        'qwerty123',
      ]

      for (const pwd of weakPasswords) {
        const result = validatePassword(pwd)
        expect(result.isValid).toBe(false)
      }

      // Strong passwords
      const strongPasswords = [
        'MySecureP@ssw0rd',
        'C0mplex!Password',
        'Str0ng&Secure!23',
        'Val!dP@ssw0rd99',
      ]

      for (const pwd of strongPasswords) {
        const result = validatePassword(pwd)
        expect(result.isValid).toBe(true)
      }
    })
  })
})

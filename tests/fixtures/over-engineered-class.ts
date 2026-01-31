/**
 * Over-Engineered Class Example
 * 
 * This is a typical AI-generated pattern where simple validation
 * logic is wrapped in an unnecessary class hierarchy.
 * 
 * A human would probably just write: `const isValid = email.includes('@')`
 */

/**
 * Interface defining the contract for email validation operations
 * @interface IEmailValidator
 */
interface IEmailValidator {
  /**
   * Validates an email address
   * @param email - The email address to validate
   * @returns A boolean indicating whether the email is valid
   */
  validate(email: string): boolean;
}

/**
 * Abstract base class for all validators
 * Provides common functionality for validation operations
 */
abstract class AbstractValidator<T> {
  protected readonly validationErrors: string[] = [];

  /**
   * Performs validation on the input
   * @param input - The input to validate
   * @returns boolean indicating validation result
   */
  abstract validate(input: T): boolean;

  /**
   * Gets the validation errors
   * @returns Array of error messages
   */
  getErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Clears all validation errors
   */
  protected clearErrors(): void {
    this.validationErrors.length = 0;
  }

  /**
   * Adds an error to the validation errors array
   * @param error - The error message to add
   */
  protected addError(error: string): void {
    this.validationErrors.push(error);
  }
}

/**
 * Concrete implementation of email validator
 * Extends the abstract validator base class
 */
class EmailValidatorImpl extends AbstractValidator<string> implements IEmailValidator {
  /**
   * The regex pattern for email validation
   */
  private readonly emailPattern: RegExp;

  /**
   * Constructs a new EmailValidatorImpl instance
   */
  constructor() {
    super();
    // Initialize the email pattern
    this.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  }

  /**
   * Validates the provided email address
   * @param email - The email address to validate
   * @returns boolean indicating whether the email is valid
   */
  validate(email: string): boolean {
    // Clear any previous errors
    this.clearErrors();

    // Check if email is null or undefined
    if (email === null || email === undefined) {
      this.addError('Email cannot be null or undefined');
      return false;
    }

    // Check if email is a string
    if (typeof email !== 'string') {
      this.addError('Email must be a string');
      return false;
    }

    // Check if email is empty
    if (email.trim().length === 0) {
      this.addError('Email cannot be empty');
      return false;
    }

    // Validate against the pattern
    if (!this.emailPattern.test(email)) {
      this.addError('Email format is invalid');
      return false;
    }

    // Email is valid
    return true;
  }
}

/**
 * Factory for creating validators
 */
class ValidatorFactory {
  /**
   * Creates an email validator instance
   * @returns A new IEmailValidator implementation
   */
  static createEmailValidator(): IEmailValidator {
    return new EmailValidatorImpl();
  }
}

// Usage example
export function validateUserEmail(email: string): boolean {
  const validator = ValidatorFactory.createEmailValidator();
  return validator.validate(email);
}

// What a human would write:
// export const validateUserEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Input validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validators = {
  username: (input: string): ValidationResult => {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'Username is required' };
    }
    if (input.length > 39) {
      return { valid: false, error: 'Username must be 39 characters or less' };
    }
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(input)) {
      return { valid: false, error: 'Username can only contain alphanumeric characters and hyphens' };
    }
    return { valid: true };
  },

  email: (input: string): ValidationResult => {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true };
  },

  accountName: (input: string): ValidationResult => {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'Account name is required' };
    }
    if (input.length > 50) {
      return { valid: false, error: 'Account name must be 50 characters or less' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
      return { valid: false, error: 'Account name can only contain letters, numbers, underscores, and hyphens' };
    }
    return { valid: true };
  },

  sshKeyPath: (input: string): ValidationResult => {
    if (!input) {
      return { valid: false, error: 'SSH key path is required' };
    }
    // Basic path validation - doesn't check if file exists
    if (input.includes('\0')) {
      return { valid: false, error: 'Invalid path' };
    }
    return { valid: true };
  },

  mode: (input: string): ValidationResult => {
    if (!['auto', 'prompt'].includes(input)) {
      return { valid: false, error: 'Mode must be "auto" or "prompt"' };
    }
    return { valid: true };
  },

  gitRemote: (input: string): ValidationResult => {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: 'Remote name is required' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
      return { valid: false, error: 'Invalid remote name' };
    }
    return { valid: true };
  },
};

export function validateOrThrow(validator: (_input: string) => ValidationResult, input: string): void {
  const result = validator(input);
  if (!result.valid) {
    throw new Error(result.error);
  }
}

export function promptValidator(validator: (_input: string) => ValidationResult): (_input: string) => boolean | string {
  return (input: string) => {
    const result = validator(input);
    return result.valid ? true : result.error || 'Invalid input';
  };
}
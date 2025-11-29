// ============================================
// FILE: lib/validation.ts
// PURPOSE: Input validation & error handling utilities
// RELATIONS: Used by all forms and business logic
// ============================================

// Error types untuk kategorisasi
export type ValidationErrorType = 
  | 'REQUIRED'           // Field kosong
  | 'MIN_LENGTH'         // Terlalu pendek
  | 'MAX_LENGTH'         // Terlalu panjang
  | 'MIN_VALUE'          // Nilai terlalu kecil
  | 'MAX_VALUE'          // Nilai terlalu besar
  | 'INVALID_FORMAT'     // Format salah (email, phone, etc)
  | 'INVALID_TYPE'       // Type mismatch
  | 'OUT_OF_RANGE'       // Di luar range valid
  | 'INSUFFICIENT_BALANCE' // Balance tidak cukup
  | 'NEGATIVE_VALUE'     // Tidak boleh negatif
  | 'DIVISION_BY_ZERO';  // Division by zero

// Error object structure
export interface ValidationError {
  type: ValidationErrorType;
  field: string;
  message: string;
  value?: any;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validation constants
export const VALIDATION_RULES = {
  CHARACTER: {
    NAME_MIN: 2,
    NAME_MAX: 50,
    AGE_MIN: 18,
    AGE_MAX: 100,
  },
  COMPANY: {
    NAME_MIN: 2,
    NAME_MAX: 50,
  },
  FINTECH: {
    MIN_LOAN_AMOUNT: 1_000_000,
    MAX_LOAN_AMOUNT: 100_000_000,
    MIN_DURATION: 6,
    MAX_DURATION: 24,
    MIN_INTEREST: 1,
    MAX_INTEREST: 100,
  },
  INSURANCE: {
    MIN_COVERAGE: 10_000_000,
    MAX_COVERAGE: 10_000_000_000,
    MIN_PREMIUM: 10_000,
    MAX_PREMIUM: 100_000_000,
  },
  INVESTMENT: {
    MIN_INVESTMENT: 1_000_000_000,
    MAX_INVESTMENT: 100_000_000_000,
  },
  TRANSACTION: {
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 1_000_000_000_000, // 1 triliun max
  },
} as const;

// ==============================================
// BASIC INPUT VALIDATORS
// ==============================================

/**
 * Validate string tidak kosong dan panjangnya sesuai
 */
export function validateString(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if empty
  if (!value || value.trim().length === 0) {
    errors.push({
      type: 'REQUIRED',
      field: fieldName,
      message: `${fieldName} tidak boleh kosong`,
      value,
    });
    return { isValid: false, errors };
  }

  const trimmed = value.trim();

  // Check min length
  if (trimmed.length < minLength) {
    errors.push({
      type: 'MIN_LENGTH',
      field: fieldName,
      message: `${fieldName} minimal ${minLength} karakter`,
      value,
    });
  }

  // Check max length
  if (trimmed.length > maxLength) {
    errors.push({
      type: 'MAX_LENGTH',
      field: fieldName,
      message: `${fieldName} maksimal ${maxLength} karakter`,
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate number dalam range tertentu
 */
export function validateNumber(
  value: number,
  fieldName: string,
  min: number,
  max: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if valid number
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      type: 'INVALID_TYPE',
      field: fieldName,
      message: `${fieldName} harus berupa angka`,
      value,
    });
    return { isValid: false, errors };
  }

  // Check min value
  if (value < min) {
    errors.push({
      type: 'MIN_VALUE',
      field: fieldName,
      message: `${fieldName} minimal ${min.toLocaleString('id-ID')}`,
      value,
    });
  }

  // Check max value
  if (value > max) {
    errors.push({
      type: 'MAX_VALUE',
      field: fieldName,
      message: `${fieldName} maksimal ${max.toLocaleString('id-ID')}`,
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate amount (harus positif dan dalam range)
 */
export function validateAmount(
  amount: number,
  fieldName: string = 'Jumlah',
  min: number = VALIDATION_RULES.TRANSACTION.MIN_AMOUNT,
  max: number = VALIDATION_RULES.TRANSACTION.MAX_AMOUNT
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check type
  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push({
      type: 'INVALID_TYPE',
      field: fieldName,
      message: `${fieldName} harus berupa angka`,
      value: amount,
    });
    return { isValid: false, errors };
  }

  // Check negative
  if (amount < 0) {
    errors.push({
      type: 'NEGATIVE_VALUE',
      field: fieldName,
      message: `${fieldName} tidak boleh negatif`,
      value: amount,
    });
    return { isValid: false, errors };
  }

  // Check range
  return validateNumber(amount, fieldName, min, max);
}


// ==============================================
// DOMAIN-SPECIFIC VALIDATORS
// ==============================================

/**
 * Validate character creation input
 */
export function validateCharacterInput(name: string, age: number): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate name
  const nameResult = validateString(
    name,
    'Nama',
    VALIDATION_RULES.CHARACTER.NAME_MIN,
    VALIDATION_RULES.CHARACTER.NAME_MAX
  );
  errors.push(...nameResult.errors);

  // Validate age
  const ageResult = validateNumber(
    age,
    'Umur',
    VALIDATION_RULES.CHARACTER.AGE_MIN,
    VALIDATION_RULES.CHARACTER.AGE_MAX
  );
  errors.push(...ageResult.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate company creation input
 */
export function validateCompanyInput(
  name: string,
  businessType: string | null,
  difficulty: string | null
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate company name
  const nameResult = validateString(
    name,
    'Nama Perusahaan',
    VALIDATION_RULES.COMPANY.NAME_MIN,
    VALIDATION_RULES.COMPANY.NAME_MAX
  );
  errors.push(...nameResult.errors);

  // Validate business type selected
  if (!businessType) {
    errors.push({
      type: 'REQUIRED',
      field: 'Tipe Bisnis',
      message: 'Pilih tipe bisnis terlebih dahulu',
    });
  }

  // Validate difficulty selected
  if (!difficulty) {
    errors.push({
      type: 'REQUIRED',
      field: 'Tingkat Kesulitan',
      message: 'Pilih tingkat kesulitan terlebih dahulu',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate loan application (Fintech)
 */
export function validateLoanApplication(
  amount: number,
  duration: number,
  interestRate: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate amount
  const amountResult = validateAmount(
    amount,
    'Jumlah Pinjaman',
    VALIDATION_RULES.FINTECH.MIN_LOAN_AMOUNT,
    VALIDATION_RULES.FINTECH.MAX_LOAN_AMOUNT
  );
  errors.push(...amountResult.errors);

  // Validate duration
  const durationResult = validateNumber(
    duration,
    'Durasi',
    VALIDATION_RULES.FINTECH.MIN_DURATION,
    VALIDATION_RULES.FINTECH.MAX_DURATION
  );
  errors.push(...durationResult.errors);

  // Validate interest rate
  const interestResult = validateNumber(
    interestRate,
    'Suku Bunga',
    VALIDATION_RULES.FINTECH.MIN_INTEREST,
    VALIDATION_RULES.FINTECH.MAX_INTEREST
  );
  errors.push(...interestResult.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate insurance claim amount
 */
export function validateClaimAmount(
  claimAmount: number,
  coverageAmount: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate claim amount positive
  if (claimAmount <= 0) {
    errors.push({
      type: 'NEGATIVE_VALUE',
      field: 'Jumlah Klaim',
      message: 'Jumlah klaim harus lebih dari 0',
      value: claimAmount,
    });
  }

  // Validate claim not exceed coverage
  if (claimAmount > coverageAmount) {
    errors.push({
      type: 'MAX_VALUE',
      field: 'Jumlah Klaim',
      message: `Klaim tidak boleh melebihi coverage (${coverageAmount.toLocaleString('id-ID')})`,
      value: claimAmount,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ==============================================
// STATE INTEGRITY GUARDS
// ==============================================

/**
 * Guard: Cegah balance negatif
 */
export function guardBalanceFloor(
  currentBalance: number,
  deduction: number
): ValidationResult {
  const errors: ValidationError[] = [];

  if (currentBalance - deduction < 0) {
    errors.push({
      type: 'INSUFFICIENT_BALANCE',
      field: 'Balance',
      message: 'Balance tidak mencukupi untuk operasi ini',
      value: { currentBalance, deduction, shortfall: deduction - currentBalance },
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Guard: Cek division by zero
 */
export function guardDivisionByZero(
  divisor: number,
  operation: string = 'Operasi'
): ValidationResult {
  const errors: ValidationError[] = [];

  if (divisor === 0) {
    errors.push({
      type: 'DIVISION_BY_ZERO',
      field: operation,
      message: `${operation} tidak bisa dilakukan: pembagi adalah 0`,
      value: divisor,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Guard: Validate timestamp (tidak boleh future, harus valid)
 */
export function guardTimestamp(timestamp: number, fieldName: string = 'Timestamp'): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if valid number
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    errors.push({
      type: 'INVALID_TYPE',
      field: fieldName,
      message: `${fieldName} harus berupa angka`,
      value: timestamp,
    });
    return { isValid: false, errors };
  }

  // Check if not negative
  if (timestamp < 0) {
    errors.push({
      type: 'NEGATIVE_VALUE',
      field: fieldName,
      message: `${fieldName} tidak boleh negatif`,
      value: timestamp,
    });
  }

  // Check if not future (allow 1 minute tolerance for clock skew)
  const now = Date.now();
  const tolerance = 60 * 1000; // 1 minute
  if (timestamp > now + tolerance) {
    errors.push({
      type: 'OUT_OF_RANGE',
      field: fieldName,
      message: `${fieldName} tidak boleh di masa depan`,
      value: timestamp,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Guard: Check array tidak kosong sebelum akses
 */
export function guardArrayAccess<T>(
  array: T[],
  index: number,
  arrayName: string = 'Array'
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if array
  if (!Array.isArray(array)) {
    errors.push({
      type: 'INVALID_TYPE',
      field: arrayName,
      message: `${arrayName} harus berupa array`,
      value: array,
    });
    return { isValid: false, errors };
  }

  // Check if empty
  if (array.length === 0) {
    errors.push({
      type: 'OUT_OF_RANGE',
      field: arrayName,
      message: `${arrayName} kosong`,
      value: array,
    });
    return { isValid: false, errors };
  }

  // Check index bounds
  if (index < 0 || index >= array.length) {
    errors.push({
      type: 'OUT_OF_RANGE',
      field: 'Index',
      message: `Index ${index} di luar jangkauan array (0-${array.length - 1})`,
      value: index,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}


// ==============================================
// HELPER UTILITIES
// ==============================================

/**
 * Combine multiple validation results
 */
export function combineValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Get first error message (untuk display di UI)
 */
export function getFirstErrorMessage(result: ValidationResult): string | null {
  if (result.errors.length === 0) return null;
  return result.errors[0].message;
}

/**
 * Get all error messages as array
 */
export function getAllErrorMessages(result: ValidationResult): string[] {
  return result.errors.map((e) => e.message);
}

/**
 * Check if specific field has error
 */
export function hasFieldError(result: ValidationResult, fieldName: string): boolean {
  return result.errors.some((e) => e.field === fieldName);
}

/**
 * Get errors for specific field
 */
export function getFieldErrors(result: ValidationResult, fieldName: string): ValidationError[] {
  return result.errors.filter((e) => e.field === fieldName);
}

/**
 * Format validation errors untuk logging (development only)
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.isValid) return 'No errors';
  
  return result.errors
    .map((e) => `[${e.type}] ${e.field}: ${e.message}`)
    .join('\n');
}

export function guardNullUndefined<T>(
  value: T | null | undefined,
  fieldName: string
): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (value === null || value === undefined) {
    errors.push({
      type: 'REQUIRED',
      field: fieldName,
      message: `${fieldName} tidak boleh null atau undefined`,
      value,
    });
  }
  
  return { isValid: errors.length === 0, errors };
}
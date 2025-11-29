// ============================================
// FILE: __tests__/validation.test.ts
// PURPOSE: Unit tests for validation functions (FIXED VERSION)
// ============================================

import { describe, it, expect } from 'vitest';
import {
  validateString,
  validateNumber,
  validateAmount,
  validateCharacterInput,
  validateCompanyInput,
  validateLoanApplication,
  validateClaimAmount,
  guardBalanceFloor,
  guardDivisionByZero,
  guardArrayAccess,
  guardNullUndefined,
  getFirstErrorMessage,
  combineValidationResults,
  VALIDATION_RULES,
} from '@/lib/validation';

describe('Basic Validators', () => {
  describe('validateString', () => {
    it('should pass for valid string', () => {
      const result = validateString('John Doe', 'Name', 2, 50);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for empty string', () => {
      const result = validateString('', 'Name', 2, 50);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('REQUIRED');
    });

    it('should fail for string too short', () => {
      const result = validateString('A', 'Name', 2, 50);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('MIN_LENGTH');
    });

    it('should fail for string too long', () => {
      const result = validateString('A'.repeat(100), 'Name', 2, 50);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('MAX_LENGTH');
    });

    it('should trim whitespace', () => {
      const result = validateString('  John  ', 'Name', 2, 50);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateNumber', () => {
    it('should pass for valid number in range', () => {
      const result = validateNumber(25, 'Age', 18, 100);
      expect(result.isValid).toBe(true);
    });

    it('should fail for number below minimum', () => {
      const result = validateNumber(10, 'Age', 18, 100);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('MIN_VALUE');
    });

    it('should fail for number above maximum', () => {
      const result = validateNumber(150, 'Age', 18, 100);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('MAX_VALUE');
    });

    it('should fail for NaN', () => {
      const result = validateNumber(NaN, 'Age', 18, 100);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('INVALID_TYPE');
    });

    it('should fail for non-number', () => {
      const result = validateNumber('25' as any, 'Age', 18, 100);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('INVALID_TYPE');
    });
  });

  describe('validateAmount', () => {
    it('should pass for positive amount', () => {
      const result = validateAmount(1000000, 'Amount', 1, 1000000000);
      expect(result.isValid).toBe(true);
    });

    it('should fail for negative amount', () => {
      const result = validateAmount(-1000, 'Amount', 1, 1000000000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('NEGATIVE_VALUE');
    });

    it('should fail for zero when min > 0', () => {
      const result = validateAmount(0, 'Amount', 1, 1000000000);
      expect(result.isValid).toBe(false);
    });

    it('should fail for NaN', () => {
      const result = validateAmount(NaN, 'Amount', 1, 1000000000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('INVALID_TYPE');
    });

    it('should fail for amount exceeding max', () => {
      const result = validateAmount(2000000000, 'Amount', 1, 1000000000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('MAX_VALUE');
    });
  });
});

describe('Domain-Specific Validators', () => {
  describe('validateCharacterInput', () => {
    it('should pass for valid name and age', () => {
      const result = validateCharacterInput('John Doe', 25);
      expect(result.isValid).toBe(true);
    });

    it('should fail for empty name', () => {
      const result = validateCharacterInput('', 25);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'Nama')).toBe(true);
    });

    it('should fail for age below minimum', () => {
      const result = validateCharacterInput('John', 15);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'Umur')).toBe(true);
    });

    it('should fail for age above maximum', () => {
      const result = validateCharacterInput('John', 150);
      expect(result.isValid).toBe(false);
    });

    it('should accumulate multiple errors', () => {
      const result = validateCharacterInput('', 10);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateCompanyInput', () => {
    it('should pass for valid inputs', () => {
      const result = validateCompanyInput('Test Company', 'fintech', 'medium');
      expect(result.isValid).toBe(true);
    });

    it('should fail for empty company name', () => {
      const result = validateCompanyInput('', 'fintech', 'medium');
      expect(result.isValid).toBe(false);
    });

    it('should fail for null business type', () => {
      const result = validateCompanyInput('Test Co', null, 'medium');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'Tipe Bisnis')).toBe(true);
    });

    it('should fail for null difficulty', () => {
      const result = validateCompanyInput('Test Co', 'fintech', null);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'Tingkat Kesulitan')).toBe(true);
    });
  });

  describe('validateLoanApplication', () => {
    it('should pass for valid loan', () => {
      const result = validateLoanApplication(10000000, 12, 15);
      expect(result.isValid).toBe(true);
    });

    it('should fail for amount below minimum', () => {
      const result = validateLoanApplication(500000, 12, 15);
      expect(result.isValid).toBe(false);
    });

    it('should fail for amount above maximum', () => {
      const result = validateLoanApplication(200000000, 12, 15);
      expect(result.isValid).toBe(false);
    });

    it('should fail for invalid duration', () => {
      const result = validateLoanApplication(10000000, 3, 15);
      expect(result.isValid).toBe(false);
    });

    it('should fail for invalid interest rate', () => {
      const result = validateLoanApplication(10000000, 12, 150);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateClaimAmount', () => {
    it('should pass for valid claim within coverage', () => {
      const result = validateClaimAmount(50000000, 100000000);
      expect(result.isValid).toBe(true);
    });

    it('should pass for claim equal to coverage', () => {
      const result = validateClaimAmount(100000000, 100000000);
      expect(result.isValid).toBe(true);
    });

    it('should fail for claim exceeding coverage', () => {
      const result = validateClaimAmount(150000000, 100000000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('MAX_VALUE');
    });

    it('should fail for zero claim', () => {
      const result = validateClaimAmount(0, 100000000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('NEGATIVE_VALUE');
    });

    it('should fail for negative claim', () => {
      const result = validateClaimAmount(-10000, 100000000);
      expect(result.isValid).toBe(false);
    });
  });
});

describe('State Integrity Guards', () => {
  describe('guardBalanceFloor', () => {
    it('should pass for sufficient balance', () => {
      const result = guardBalanceFloor(10000000, 5000000);
      expect(result.isValid).toBe(true);
    });

    it('should pass for exact balance', () => {
      const result = guardBalanceFloor(5000000, 5000000);
      expect(result.isValid).toBe(true);
    });

    it('should fail for insufficient balance', () => {
      const result = guardBalanceFloor(1000000, 5000000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('INSUFFICIENT_BALANCE');
    });

    it('should fail when balance would go negative', () => {
      const result = guardBalanceFloor(0, 1);
      expect(result.isValid).toBe(false);
    });

    it('should handle very large numbers', () => {
      const result = guardBalanceFloor(1000000000000, 500000000000);
      expect(result.isValid).toBe(true);
    });
  });

  describe('guardDivisionByZero', () => {
    it('should pass for non-zero divisor', () => {
      const result = guardDivisionByZero(100, 'Test Division');
      expect(result.isValid).toBe(true);
    });

    it('should pass for negative divisor', () => {
      const result = guardDivisionByZero(-50, 'Test Division');
      expect(result.isValid).toBe(true);
    });

    it('should fail for zero divisor', () => {
      const result = guardDivisionByZero(0, 'Test Division');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('DIVISION_BY_ZERO');
    });

    it('should include operation name in error', () => {
      const result = guardDivisionByZero(0, 'Return Multiple Calculation');
      expect(result.errors[0].message).toContain('Return Multiple Calculation');
    });
  });

  describe('guardArrayAccess', () => {
    it('should pass for valid array access', () => {
      const result = guardArrayAccess([1, 2, 3], 0, 'Test Array');
      expect(result.isValid).toBe(true);
    });

    it('should pass for last index', () => {
      const result = guardArrayAccess([1, 2, 3], 2, 'Test Array');
      expect(result.isValid).toBe(true);
    });

    it('should fail for empty array', () => {
      const result = guardArrayAccess([], 0, 'Test Array');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('OUT_OF_RANGE');
      expect(result.errors[0].message).toContain('kosong');
    });

    it('should fail for non-array', () => {
      const result = guardArrayAccess(null as any, 0, 'Test Array');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('INVALID_TYPE');
    });

    it('should fail for index out of bounds', () => {
      const result = guardArrayAccess([1, 2, 3], 5, 'Test Array');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('OUT_OF_RANGE');
    });

    it('should fail for negative index', () => {
      const result = guardArrayAccess([1, 2, 3], -1, 'Test Array');
      expect(result.isValid).toBe(false);
    });
  });

  describe('guardNullUndefined', () => {
    it('should pass for valid value', () => {
      const result = guardNullUndefined('test', 'Field');
      expect(result.isValid).toBe(true);
    });

    it('should pass for zero', () => {
      const result = guardNullUndefined(0, 'Field');
      expect(result.isValid).toBe(true);
    });

    it('should pass for empty string', () => {
      const result = guardNullUndefined('', 'Field');
      expect(result.isValid).toBe(true);
    });

    it('should fail for null', () => {
      const result = guardNullUndefined(null, 'Field');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('REQUIRED');
    });

    it('should fail for undefined', () => {
      const result = guardNullUndefined(undefined, 'Field');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('REQUIRED');
    });
  });
});

describe('Helper Utilities', () => {
  describe('getFirstErrorMessage', () => {
    it('should return null for valid result', () => {
      const result = { isValid: true, errors: [] };
      expect(getFirstErrorMessage(result)).toBeNull();
    });

    it('should return first error message', () => {
      const result = {
        isValid: false,
        errors: [
          { type: 'REQUIRED' as const, field: 'Name', message: 'Name is required' },
          { type: 'MIN_LENGTH' as const, field: 'Name', message: 'Name too short' },
        ],
      };
      expect(getFirstErrorMessage(result)).toBe('Name is required');
    });
  });

  describe('combineValidationResults', () => {
    it('should combine multiple valid results', () => {
      const result1 = { isValid: true, errors: [] };
      const result2 = { isValid: true, errors: [] };
      
      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });

    it('should combine invalid results', () => {
      const result1 = {
        isValid: false,
        errors: [{ type: 'REQUIRED' as const, field: 'Name', message: 'Error 1' }],
      };
      const result2 = {
        isValid: false,
        errors: [{ type: 'MIN_VALUE' as const, field: 'Age', message: 'Error 2' }],
      };
      
      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(2);
    });
  });
});

describe('Integration Tests', () => {
  it('should validate complete loan approval flow', () => {
    // Step 1: Validate array access
    const loans = [
      { id: '1', amount: 10000000, borrowerName: 'John' },
      { id: '2', amount: 20000000, borrowerName: 'Jane' },
    ];
    
    const arrayGuard = guardArrayAccess(loans, 0, 'Pending Loans');
    expect(arrayGuard.isValid).toBe(true);
    
    // Step 2: Get loan
    const loan = loans[0];
    
    // Step 3: Validate balance
    const companyBalance = 50000000;
    const balanceGuard = guardBalanceFloor(companyBalance, loan.amount);
    expect(balanceGuard.isValid).toBe(true);
    
    // Step 4: Calculate remaining balance
    const remainingBalance = companyBalance - loan.amount;
    expect(remainingBalance).toBe(40000000);
  });

  it('should fail loan approval with insufficient balance', () => {
    const loans = [{ id: '1', amount: 100000000 }];
    const companyBalance = 10000000;
    
    // Array guard passes
    const arrayGuard = guardArrayAccess(loans, 0, 'Pending Loans');
    expect(arrayGuard.isValid).toBe(true);
    
    // Balance guard fails
    const balanceGuard = guardBalanceFloor(companyBalance, loans[0].amount);
    expect(balanceGuard.isValid).toBe(false);
    expect(balanceGuard.errors[0].type).toBe('INSUFFICIENT_BALANCE');
  });

  it('should validate insurance claim flow', () => {
    const claims = [
      {
        id: '1',
        claimAmount: 50000000,
        coverageAmount: 100000000,
      },
    ];
    const companyBalance = 200000000;
    
    // Validate array
    const arrayGuard = guardArrayAccess(claims, 0, 'Pending Claims');
    expect(arrayGuard.isValid).toBe(true);
    
    // Get claim
    const claim = claims[0];
    
    // Validate claim amount
    const claimValidation = validateClaimAmount(
      claim.claimAmount,
      claim.coverageAmount
    );
    expect(claimValidation.isValid).toBe(true);
    
    // Validate balance
    const balanceGuard = guardBalanceFloor(companyBalance, claim.claimAmount);
    expect(balanceGuard.isValid).toBe(true);
  });

  it('should handle division by zero in return calculation', () => {
    const investment = {
      amount: 0,
      currentValuation: 3000000000,
    };
    
    // Validate division
    const divisionGuard = guardDivisionByZero(
      investment.amount,
      'Return Multiple'
    );
    expect(divisionGuard.isValid).toBe(false);
    
    // Graceful fallback
    const returnMultiple = divisionGuard.isValid
      ? investment.currentValuation / investment.amount
      : 0;
    expect(returnMultiple).toBe(0);
  });
});

describe('VALIDATION_RULES Constants', () => {
  it('should have valid character rules', () => {
    expect(VALIDATION_RULES.CHARACTER.NAME_MIN).toBe(2);
    expect(VALIDATION_RULES.CHARACTER.NAME_MAX).toBe(50);
    expect(VALIDATION_RULES.CHARACTER.AGE_MIN).toBe(18);
    expect(VALIDATION_RULES.CHARACTER.AGE_MAX).toBe(100);
  });

  it('should have valid fintech rules', () => {
    expect(VALIDATION_RULES.FINTECH.MIN_LOAN_AMOUNT).toBeLessThan(
      VALIDATION_RULES.FINTECH.MAX_LOAN_AMOUNT
    );
    expect(VALIDATION_RULES.FINTECH.MIN_DURATION).toBeLessThan(
      VALIDATION_RULES.FINTECH.MAX_DURATION
    );
  });

  it('should have valid insurance rules', () => {
    expect(VALIDATION_RULES.INSURANCE.MIN_COVERAGE).toBeLessThan(
      VALIDATION_RULES.INSURANCE.MAX_COVERAGE
    );
  });

  it('should have valid investment rules', () => {
    expect(VALIDATION_RULES.INVESTMENT.MIN_INVESTMENT).toBeLessThan(
      VALIDATION_RULES.INVESTMENT.MAX_INVESTMENT
    );
  });
});
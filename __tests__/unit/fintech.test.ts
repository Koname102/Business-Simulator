import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateLoanApplication,
  shouldLoanDefault,
  getCreditScoreLabel,
} from '@/lib/game-logic/lending';
import { FORMULAS } from '@/lib/constants';

describe('Fintech - Loan Calculations', () => {
  describe('FORMULAS.calculateLoanRepayment', () => {
    it('calculates 12-month loan correctly', () => {
      const result = FORMULAS.calculateLoanRepayment(10000000, 18, 12);
      expect(result).toBe(11800000);
    });
    
    it('calculates 24-month loan correctly', () => {
      const result = FORMULAS.calculateLoanRepayment(10000000, 18, 24);
      expect(result).toBe(13600000); // Flat rate, not compound
    });
    
    it('interest scales linearly with duration', () => {
      const loan12m = FORMULAS.calculateLoanRepayment(10000000, 18, 12);
      const loan24m = FORMULAS.calculateLoanRepayment(10000000, 18, 24);
      
      const interest12m = loan12m - 10000000;
      const interest24m = loan24m - 10000000;
      
      expect(interest24m).toBe(interest12m * 2);
    });
    
    it('handles all standard durations', () => {
      expect(FORMULAS.calculateLoanRepayment(10000000, 18, 6)).toBe(10900000);
      expect(FORMULAS.calculateLoanRepayment(10000000, 18, 12)).toBe(11800000);
      expect(FORMULAS.calculateLoanRepayment(10000000, 18, 18)).toBe(12700000);
      expect(FORMULAS.calculateLoanRepayment(10000000, 18, 24)).toBe(13600000);
    });
    
    it('returns integer (no decimals)', () => {
      const result = FORMULAS.calculateLoanRepayment(10000000, 18.5, 13);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
  
  describe('generateLoanApplication', () => {
    it('generates loan with required fields', () => {
      const loan = generateLoanApplication();
      
      expect(loan).toHaveProperty('id');
      expect(loan).toHaveProperty('borrowerName');
      expect(loan).toHaveProperty('amount');
      expect(loan).toHaveProperty('interestRate');
      expect(loan).toHaveProperty('duration');
      expect(loan).toHaveProperty('status', 'pending');
      expect(loan).toHaveProperty('creditScore');
      expect(loan).toHaveProperty('totalRepayment');
    });
    
    it('generates amount within range', () => {
      const loan = generateLoanApplication();
      expect(loan.amount).toBeGreaterThanOrEqual(1000000);
      expect(loan.amount).toBeLessThanOrEqual(100000000);
    });
    
    it('generates valid durations', () => {
      const loan = generateLoanApplication();
      expect([6, 12, 18, 24]).toContain(loan.duration);
    });
  });
  
  describe('getCreditScoreLabel', () => {
    it('labels high risk correctly', () => {
      const result = getCreditScoreLabel(30);
      expect(result.label).toBe('High Risk');
      expect(result.color).toContain('red');
    });
    
    it('labels low risk correctly', () => {
      const result = getCreditScoreLabel(80);
      expect(result.label).toBe('Low Risk');
      expect(result.color).toContain('green');
    });
  });
});
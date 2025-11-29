import { describe, it, expect } from 'vitest';
import { FORMULAS, GAME_CONFIG, BUSINESS_CONFIG } from '@/lib/constants';

describe('Constants - FORMULAS', () => {
  describe('calculateLoanRepayment', () => {
    it('uses flat rate interest (not compound)', () => {
      const result = FORMULAS.calculateLoanRepayment(10000000, 18, 24);
      expect(result).toBe(13600000); // Flat rate
      expect(result).not.toBe(13924000); // NOT compound
    });
    
    it('handles all standard durations', () => {
      expect(FORMULAS.calculateLoanRepayment(10000000, 18, 6)).toBe(10900000);
      expect(FORMULAS.calculateLoanRepayment(10000000, 18, 12)).toBe(11800000);
      expect(FORMULAS.calculateLoanRepayment(10000000, 18, 18)).toBe(12700000);
      expect(FORMULAS.calculateLoanRepayment(10000000, 18, 24)).toBe(13600000);
    });
    
    it('interest scales linearly with duration', () => {
      const loan12m = FORMULAS.calculateLoanRepayment(10000000, 18, 12);
      const loan24m = FORMULAS.calculateLoanRepayment(10000000, 18, 24);
      
      const interest12m = loan12m - 10000000;
      const interest24m = loan24m - 10000000;
      
      expect(interest24m).toBe(interest12m * 2);
    });
    
    it('handles zero interest rate', () => {
      const result = FORMULAS.calculateLoanRepayment(10000000, 0, 12);
      expect(result).toBe(10000000);
    });
    
    it('returns integer', () => {
      const result = FORMULAS.calculateLoanRepayment(10000000, 18.5, 13);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
  
  describe('calculateLevel', () => {
    it('level 1 at 0 XP', () => {
      expect(FORMULAS.calculateLevel(0)).toBe(1);
    });
    
    it('level 2 at 1000 XP', () => {
      expect(FORMULAS.calculateLevel(1000)).toBe(2);
    });
  });
  
  describe('generateRandomName', () => {
    it('generates name with first and last', () => {
      const name = FORMULAS.generateRandomName();
      expect(name).toMatch(/^[A-Za-z]+ [A-Za-z]+$/);
    });
  });
});

describe('Constants - Config Values', () => {
  it('GAME_CONFIG has valid values', () => {
    expect(GAME_CONFIG.TICK_INTERVAL).toBeGreaterThan(0);
    expect(GAME_CONFIG.XP_PER_LEVEL).toBeGreaterThan(0);
  });
  
  it('BUSINESS_CONFIG has valid loan ranges', () => {
    expect(BUSINESS_CONFIG.fintech.MIN_LOAN).toBeLessThan(
      BUSINESS_CONFIG.fintech.MAX_LOAN
    );
  });
});
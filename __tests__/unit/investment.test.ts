import { describe, it, expect } from 'vitest';
import {
  generateDealFlow,
  calculateManagementFee,
  calculatePerformanceFee,
  calculatePortfolioIRR,
  getReturnMultipleLabel,
  simulateValuationChange,
  shouldStartupFail,
  shouldGenerateExitOpportunity,
  generateExitValuation,
} from '@/lib/game-logic/venture';
import type { Investment } from '@/lib/types';

describe('Investment - Portfolio Calculations', () => {
  describe('generateDealFlow', () => {
    it('generates deal with required fields', () => {
      const deal = generateDealFlow();
      
      expect(deal).toHaveProperty('startup');
      expect(deal).toHaveProperty('valuation');
      expect(deal).toHaveProperty('equityOffered');
      expect(deal).toHaveProperty('investmentNeeded');
      expect(deal.startup).toHaveProperty('targetName');
      expect(deal.startup).toHaveProperty('sector');
    });
    
    it('equity offered is reasonable range', () => {
      const deal = generateDealFlow();
      expect(deal.equityOffered).toBeGreaterThanOrEqual(10);
      expect(deal.equityOffered).toBeLessThanOrEqual(30);
    });
    
    it('valuation is within valid range', () => {
      const deal = generateDealFlow();
      expect(deal.valuation).toBeGreaterThanOrEqual(10_000_000_000);
      expect(deal.valuation).toBeLessThanOrEqual(100_000_000_000);
    });
    
    it('investment needed matches equity calculation', () => {
      const deal = generateDealFlow();
      const expectedInvestment = Math.round((deal.valuation * deal.equityOffered) / 100);
      expect(deal.investmentNeeded).toBe(expectedInvestment);
    });
  });
  
  describe('calculateManagementFee', () => {
    it('calculates quarterly management fee correctly', () => {
      const aum = 100_000_000_000; // 100B AUM
      const fee = calculateManagementFee(aum);
      expect(fee).toBeGreaterThan(0);
      expect(Number.isInteger(fee)).toBe(true);
    });
    
    it('scales with AUM', () => {
      const fee1 = calculateManagementFee(50_000_000_000);
      const fee2 = calculateManagementFee(100_000_000_000);
      expect(fee2).toBeGreaterThan(fee1);
    });
  });
  
  describe('calculatePerformanceFee', () => {
    it('calculates performance fee on profit', () => {
      const profit = 10_000_000_000; // 10B profit
      const fee = calculatePerformanceFee(profit);
      expect(fee).toBeGreaterThan(0);
      expect(Number.isInteger(fee)).toBe(true);
    });
    
    it('returns 0 for zero profit', () => {
      const fee = calculatePerformanceFee(0);
      expect(fee).toBe(0);
    });
  });
  
  describe('calculatePortfolioIRR', () => {
    it('returns 0 for empty portfolio', () => {
      const irr = calculatePortfolioIRR([]);
      expect(irr).toBe(0);
    });
    
    it('calculates positive return', () => {
      const investments: Investment[] = [
        {
          id: 'test-1',
          targetName: 'Test Co',
          amount: 10_000_000_000,
          currentValuation: 20_000_000_000,
          equityStake: 10,
          status: 'active',
          investedAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
          sector: 'Fintech',
          returnMultiple: 2.0,
        },
      ];
      const irr = calculatePortfolioIRR(investments);
      expect(irr).toBeGreaterThan(0);
    });
  });
  
  describe('getReturnMultipleLabel', () => {
    it('labels unicorn correctly', () => {
      const result = getReturnMultipleLabel(10);
      expect(result.label).toContain('Unicorn');
      expect(result.color).toContain('purple');
    });
    
    it('labels excellent correctly', () => {
      const result = getReturnMultipleLabel(5);
      expect(result.label).toBe('Excellent');
      expect(result.color).toContain('green');
    });
    
    it('labels loss correctly', () => {
      const result = getReturnMultipleLabel(0.5);
      expect(result.label).toBe('Loss');
      expect(result.color).toContain('red');
    });
  });
  
  describe('simulateValuationChange', () => {
    it('returns positive valuation', () => {
      const investment: Investment = {
        id: 'test-1',
        targetName: 'Test Co',
        amount: 10_000_000_000,
        currentValuation: 10_000_000_000,
        equityStake: 10,
        status: 'active',
        investedAt: Date.now(),
        sector: 'Fintech',
        returnMultiple: 1.0,
      };
      
      const newValuation = simulateValuationChange(investment, 0);
      expect(newValuation).toBeGreaterThanOrEqual(0);
    });
  });
});
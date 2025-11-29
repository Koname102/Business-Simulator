import { describe, it, expect } from 'vitest';
import {
  generateNewPolicy,
  calculatePremium,
  shouldPolicyExpire,
  isPolicyActive,
} from '@/lib/game-logic/life-insurance';

describe('Life Insurance - Premium Calculations', () => {
  describe('calculatePremium', () => {
    it('calculates premium for young healthy person', () => {
      const premium = calculatePremium(100000000, 25, 'excellent');
      expect(premium).toBeGreaterThan(0);
      expect(premium).toBeLessThan(200000); // Reasonable range
    });
    
    it('premium increases with age', () => {
      const premium25 = calculatePremium(100000000, 25, 'good');
      const premium55 = calculatePremium(100000000, 55, 'good');
      expect(premium55).toBeGreaterThan(premium25);
    });
    
    it('premium increases with worse health', () => {
      const excellent = calculatePremium(100000000, 40, 'excellent');
      const poor = calculatePremium(100000000, 40, 'poor');
      expect(poor).toBeGreaterThan(excellent);
    });
    
    it('respects difficulty levels', () => {
      const easy = calculatePremium(100000000, 40, 'good', 'easy');
      const hard = calculatePremium(100000000, 40, 'good', 'hard');
      expect(easy).toBeGreaterThan(hard); // Easy = more income
    });
  });
  
  describe('generateNewPolicy', () => {
    it('generates policy with required fields', () => {
      const policy = generateNewPolicy();
      
      expect(policy).toHaveProperty('id');
      expect(policy).toHaveProperty('holderName');
      expect(policy).toHaveProperty('holderAge');
      expect(policy).toHaveProperty('coverageAmount');
      expect(policy).toHaveProperty('premiumMonthly');
      expect(policy).toHaveProperty('status', 'active');
      expect(policy).toHaveProperty('healthStatus');
    });
    
    it('generates age within valid range', () => {
      const policy = generateNewPolicy();
      expect(policy.holderAge).toBeGreaterThanOrEqual(18);
      expect(policy.holderAge).toBeLessThanOrEqual(65);
    });
  });
  
  describe('shouldPolicyExpire', () => {
    it('active policy should not expire', () => {
      const policy = {
        endDate: Date.now() + 1000 * 60 * 60 * 24, // 1 day future
      };
      expect(shouldPolicyExpire(policy as any)).toBe(false);
    });
    
    it('expired policy should expire', () => {
      const policy = {
        endDate: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      };
      expect(shouldPolicyExpire(policy as any)).toBe(true);
    });
  });
  
  describe('isPolicyActive', () => {
    it('active non-expired policy is active', () => {
      const policy = {
        status: 'active' as const,
        endDate: Date.now() + 1000 * 60 * 60 * 24,
      };
      expect(isPolicyActive(policy as any)).toBe(true);
    });
    
    it('claimed policy is not active', () => {
      const policy = {
        status: 'claimed' as const,
        endDate: Date.now() + 1000 * 60 * 60 * 24,
      };
      expect(isPolicyActive(policy as any)).toBe(false);
    });
  });
});
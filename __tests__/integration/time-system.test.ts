import { describe, it, expect } from 'vitest';
import {
  convertRealToGameTime,
  calculateRealInterval,
} from '@/lib/time-system';

describe('Time System - Conversions', () => {
  describe('convertRealToGameTime', () => {
    it('converts 1 real second to game minutes', () => {
      const result = convertRealToGameTime(1, 'fintech');
      expect(result).toBeGreaterThan(0);
    });
  });
  
  describe('calculateRealInterval', () => {
    it('calculates interval for 1x speed', () => {
      const result = calculateRealInterval(10, 'fintech', 1);
      expect(result).toBe(10000); // 10 seconds
    });
    
    it('calculates interval for 5x speed', () => {
      const result = calculateRealInterval(10, 'fintech', 5);
      expect(result).toBe(2000); // 2 seconds
    });
    
    it('calculates interval for 10x speed', () => {
      const result = calculateRealInterval(10, 'fintech', 10);
      expect(result).toBe(1000); // 1 second
    });
  });
});
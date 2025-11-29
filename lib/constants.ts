// ============================================
// FILE: lib/constants.ts
// PURPOSE: Game configuration constants (MVP only)
// RELATIONS: Used by gameStore.ts, game logic files
// UPDATED: 2024-11-08 (Initial MVP version)
// ============================================

import { guardDivisionByZero } from '@/lib/validation';

export const GAME_CONFIG = {
  TICK_INTERVAL: 1000,
  GAME_SPEED: 1,
  AUTO_SAVE_INTERVAL: 30000,
  STORAGE_KEY: 'business-simulator-save',
  
  STARTING_CAPITAL: {
    fintech: 100_000_000,
    insurance: 500_000_000,
    investment: 1_000_000_000,
  },
  
  XP_PER_LEVEL: 1000,
  MAX_LEVEL: 100,
} as const;

export const BUSINESS_CONFIG = {
  fintech: {
    MIN_LOAN: 1_000_000,
    MAX_LOAN: 100_000_000,
    INTEREST_RATE_MIN: 12,
    INTEREST_RATE_MAX: 24,
    DEFAULT_RATE_TARGET: 5,
  },
  
  insurance: {
    MIN_PREMIUM: 100_000,
    MAX_PREMIUM: 10_000_000,
    CLAIM_RATIO_TARGET: 70,
    POLICY_DURATION: 12,
  },
  
  investment: {
    MIN_INVESTMENT: 5_000_000_000,
    MAX_INVESTMENT: 50_000_000_000,
    MANAGEMENT_FEE: 2,
    PERFORMANCE_FEE: 20,
  },
} as const;

export const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const FORMULAS = {
  calculateLoanRepayment: (principal: number, rate: number, duration: number): number => {
    if (duration === 0) {
    console.error('[calculateLoanRepayment] Duration cannot be zero');
    return principal; 
  }
    const r = rate / 100;
    const years = duration / 12;
    const totalInterest = principal * r * years;
    const total = principal + totalInterest;
    return Math.round(total);
  },
  
  calculateLevel: (xp: number): number => {
    return Math.floor(xp / GAME_CONFIG.XP_PER_LEVEL) + 1;
  },
  
  generateRandomName: (): string => {
    const firstNames = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Agus', 'Rina', 'Joko', 'Sri'];
    const lastNames = ['Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Utomo', 'Purnomo'];
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
  },
} as const;

export const INVESTMENT_SECTORS = [
  'E-commerce',
  'Fintech',
  'Healthtech',
  'Edtech',
  'Logistics',
  'Food & Beverage',
  'SaaS',
  'Gaming',
  'Social Media',
  'PropTech',
  'AgriTech',
  'CleanTech',
] as const;
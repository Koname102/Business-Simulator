// ============================================
// FILE: lib/difficulty-config.ts
// PURPOSE: Difficulty configuration system
// RELATIONS: Used by game initialization
// ============================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  label: string;
  description: string;
  icon: string;
  
  // Capital multipliers
  startingCapitalMultiplier: number;
  
  // Risk adjustments
  riskMultiplier: number;  // Default rate, claim ratio, failure rate
  
  // Income adjustments
  incomeMultiplier: number;  // Interest, premiums, fees
  
  // Time adjustments
  eventSpeedMultiplier: number;  // How fast events generate
  
  // Market conditions
  marketVolatilityMultiplier: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    description: 'Relaxed pace, forgiving mistakes, good for learning',
    icon: '🌱',
    
    startingCapitalMultiplier: 1.5,  // 50% more capital
    riskMultiplier: 0.6,              // 40% less risk (3% default instead of 5%)
    incomeMultiplier: 1.2,            // 20% more income
    eventSpeedMultiplier: 0.8,        // 20% slower events (more time to think)
    marketVolatilityMultiplier: 0.7,  // 30% less volatility
  },
  
  medium: {
    label: 'Medium',
    description: 'Realistic rates, balanced gameplay, industry standard',
    icon: '⚖️',
    
    startingCapitalMultiplier: 1.0,   // Base capital
    riskMultiplier: 1.0,               // Base risk (5% default)
    incomeMultiplier: 1.0,             // Base income
    eventSpeedMultiplier: 1.0,         // Base event speed
    marketVolatilityMultiplier: 1.0,   // Base volatility
  },
  
  hard: {
    label: 'Hard',
    description: 'Tight margins, strategic depth, realistic challenges',
    icon: '🔥',
    
    startingCapitalMultiplier: 0.75,  // 25% less capital
    riskMultiplier: 1.4,              // 40% more risk (7% default instead of 5%)
    incomeMultiplier: 0.9,            // 10% less income (tighter margins)
    eventSpeedMultiplier: 1.2,        // 20% faster events (more pressure)
    marketVolatilityMultiplier: 1.3,  // 30% more volatility
  },
};

// Apply difficulty to starting capital
export function getStartingCapital(
  businessType: 'fintech' | 'insurance' | 'investment',
  difficulty: DifficultyLevel
): number {
  const baseCapital = {
    fintech: 100_000_000,
    insurance: 500_000_000,
    investment: 1_000_000_000,
  };
  
  const config = DIFFICULTY_CONFIGS[difficulty];
  return Math.round(baseCapital[businessType] * config.startingCapitalMultiplier);
}

// Apply difficulty to default risk (Fintech)
export function getDefaultRisk(
  baseLoan: any,
  difficulty: DifficultyLevel
): number {
  let baseRisk = 0.05;  // 5% base per payment
  
  // Loan-specific risk factors (risk scoring)
  if (baseLoan.amount > 30_000_000) baseRisk += 0.01;
  if (baseLoan.duration > 18) baseRisk += 0.01;
  if (baseLoan.interestRate > 20) baseRisk += 0.01;
  
  // Apply difficulty multiplier
  const config = DIFFICULTY_CONFIGS[difficulty];
  const adjustedRisk = baseRisk * config.riskMultiplier;
  
  return Math.min(adjustedRisk, 0.15);  // Cap at 15%
}

// Apply difficulty to interest rate range (Fintech)
export function getInterestRateRange(difficulty: DifficultyLevel): { min: number; max: number } {
  const baseMin = 12;
  const baseMax = 24;
  
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  return {
    min: Math.round(baseMin * config.incomeMultiplier),
    max: Math.round(baseMax * config.incomeMultiplier),
  };
}

// Apply difficulty to claim ratio target (Insurance)
export function getClaimRatioTarget(difficulty: DifficultyLevel): number {
  const baseTarget = 70;  // 70% is target
  
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  // Easy: 60% target (easier to profit)
  // Medium: 70% target (realistic)
  // Hard: 80% target (harder to profit)
  return Math.round(baseTarget * config.riskMultiplier);
}

// Apply difficulty to claim generation chance (Insurance)
export function getClaimChance(
  policyType: string,
  difficulty: DifficultyLevel
): number {
  const baseChances: Record<string, number> = {
    life: 0.01,
    health: 0.15,
    vehicle: 0.10,
    property: 0.05,
  };
  
  const baseChance = baseChances[policyType] || 0.05;
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  return Math.min(baseChance * config.riskMultiplier, 0.30);
}

// Apply difficulty to startup failure rate (Investment)
export function getStartupFailureRate(
  investment: any,
  difficulty: DifficultyLevel
): number {
  let baseRate = 0.05;  // 5% per quarter
  
  // Investment-specific risk factors
  const monthsActive = (Date.now() - investment.investedAt) / (30 * 24 * 60 * 60 * 1000);
  if (monthsActive < 6) return 0;  // Grace period
  
  const highRiskSectors = ['Gaming', 'Social Media', 'SaaS'];
  if (highRiskSectors.includes(investment.sector)) baseRate += 0.03;
  
  const returnMultiple = investment.currentValuation / investment.amount;
  if (returnMultiple < 0.5) baseRate += 0.05;
  
  const config = DIFFICULTY_CONFIGS[difficulty];
  return Math.min(baseRate * config.riskMultiplier, 0.20);
}

// Apply difficulty to event intervals
export function getDifficultyAdjustedInterval(
  baseInterval: number,
  difficulty: DifficultyLevel
): number {
  const config = DIFFICULTY_CONFIGS[difficulty];
  return Math.round(baseInterval / config.eventSpeedMultiplier);
}
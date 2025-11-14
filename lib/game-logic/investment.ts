// ============================================
// FILE: lib/game-logic/investment.ts
// PURPOSE: Investment management business logic
// RELATIONS: Used by investment game page
// ============================================

import type { Investment, DifficultyLevel } from '@/lib/types';
import { BUSINESS_CONFIG, INVESTMENT_SECTORS } from '@/lib/constants';
import { getStartupFailureRate } from '@/lib/difficulty-config';

export function generateDealFlow(): {
  startup: Omit<Investment, 'id' | 'investedAt' | 'currentValuation' | 'returnMultiple'>;
  valuation: number;
  equityOffered: number;
  investmentNeeded: number;
} {
  const sectors = INVESTMENT_SECTORS;
  const sector = sectors[Math.floor(Math.random() * sectors.length)];
  
  const startupNames = [
    'TechHub', 'InnovateLab', 'FutureTech', 'SmartSolutions', 'DataFlow',
    'CloudNine', 'NexGen', 'BrightPath', 'CoreLogic', 'PrimeVenture',
  ];
  
  const suffixes = ['AI', 'Labs', 'Pro', 'Plus', 'Connect', 'Network'];
  const targetName = `${startupNames[Math.floor(Math.random() * startupNames.length)]} ${
    suffixes[Math.floor(Math.random() * suffixes.length)]
  }`;
  
  const valuationRange = {
    min: 10_000_000_000,
    max: 100_000_000_000,
  };
  
  const valuation = Math.floor(
    Math.random() * (valuationRange.max - valuationRange.min) + valuationRange.min
  );
  
  const equityOffered = Math.floor(Math.random() * 20) + 10;
  const investmentNeeded = Math.round((valuation * equityOffered) / 100);
  
  return {
    startup: {
      targetName,
      amount: 0,
      equityStake: 0,
      status: 'active',
      sector,
    },
    valuation,
    equityOffered,
    investmentNeeded,
  };
}

export function calculateManagementFee(aum: number): number {
  return Math.round((aum * BUSINESS_CONFIG.investment.MANAGEMENT_FEE) / 100 / 4);
}

export function calculatePerformanceFee(profit: number): number {
  return Math.round((profit * BUSINESS_CONFIG.investment.PERFORMANCE_FEE) / 100);
}

// ✅ UPDATED: Add difficulty parameter for market volatility
export function simulateValuationChange(
  investment: Investment,
  marketCondition: -1 | 0 | 1,
  difficulty?: DifficultyLevel
): number {
  const volatilityBySector: Record<string, number> = {
    'E-commerce': 0.15,
    'Fintech': 0.20,
    'Healthtech': 0.15,
    'Edtech': 0.18,
    'Logistics': 0.12,
    'Food & Beverage': 0.10,
    'SaaS': 0.25,
    'Gaming': 0.30,
    'Social Media': 0.35,
    'PropTech': 0.15,
    'AgriTech': 0.12,
    'CleanTech': 0.20,
  };
  
  let volatility = volatilityBySector[investment.sector] || 0.20;
  
  // ✅ Apply difficulty multiplier to volatility
  if (difficulty) {
    const volatilityMultipliers = {
      easy: 0.7,    // 30% less volatility (more stable/predictable)
      medium: 1.0,  // Base volatility
      hard: 1.3,    // 30% more volatility (more chaotic)
    };
    volatility *= volatilityMultipliers[difficulty];
  }
  
  const randomChange = (Math.random() - 0.5) * volatility * 2;
  const marketBias = marketCondition * 0.05;
  const totalChange = randomChange + marketBias;
  
  const newValuation = investment.currentValuation * (1 + totalChange);
  
  return Math.max(0, Math.round(newValuation));
}

// ✅ UPDATED: Use difficulty-based failure rate
export function shouldStartupFail(investment: Investment, difficulty?: DifficultyLevel): boolean {
  const monthsActive = (Date.now() - investment.investedAt) / (30 * 24 * 60 * 60 * 1000);
  
  if (monthsActive < 6) return false;  // Grace period
  
  // ✅ If difficulty provided, use difficulty-adjusted failure rate
  if (difficulty) {
    const adjustedFailureRate = getStartupFailureRate(investment, difficulty);
    return Math.random() < adjustedFailureRate;
  }
  
  // Fallback to base failure chance
  let failureChance = 0.05;
  
  const highRiskSectors = ['Gaming', 'Social Media', 'SaaS'];
  if (highRiskSectors.includes(investment.sector)) {
    failureChance = 0.08;
  }
  
  const returnMultiple = investment.currentValuation / investment.amount;
  if (returnMultiple < 0.5) {
    failureChance = 0.15;
  }
  
  return Math.random() < failureChance;
}

export function shouldGenerateExitOpportunity(investment: Investment): boolean {
  const monthsActive = (Date.now() - investment.investedAt) / (30 * 24 * 60 * 60 * 1000);
  
  if (monthsActive < 12) return false;
  
  const returnMultiple = investment.currentValuation / investment.amount;
  
  if (returnMultiple > 5) return Math.random() < 0.3;
  if (returnMultiple > 3) return Math.random() < 0.2;
  if (returnMultiple > 2) return Math.random() < 0.1;
  
  return Math.random() < 0.05;
}

export function generateExitValuation(investment: Investment): number {
  const currentReturn = investment.currentValuation / investment.amount;
  
  const exitPremium = 1 + (Math.random() * 0.3);
  
  return Math.round(investment.currentValuation * exitPremium);
}

export function calculatePortfolioIRR(investments: Investment[]): number {
  if (investments.length === 0) return 0;
  
  let totalInvested = 0;
  let totalCurrentValue = 0;
  
  investments.forEach((inv) => {
    totalInvested += inv.amount;
    if (inv.status === 'exited') {
      totalCurrentValue += inv.currentValuation;
    } else if (inv.status === 'active') {
      totalCurrentValue += inv.currentValuation;
    }
  });
  
  if (totalInvested === 0) return 0;
  
  const totalReturn = ((totalCurrentValue - totalInvested) / totalInvested) * 100;
  
  return totalReturn;
}

export function getReturnMultipleLabel(multiple: number): { label: string; color: string } {
  if (multiple >= 10) {
    return { label: 'Unicorn 🦄', color: 'text-purple-600' };
  } else if (multiple >= 5) {
    return { label: 'Excellent', color: 'text-green-600' };
  } else if (multiple >= 3) {
    return { label: 'Great', color: 'text-blue-600' };
  } else if (multiple >= 2) {
    return { label: 'Good', color: 'text-teal-600' };
  } else if (multiple >= 1) {
    return { label: 'Break Even', color: 'text-yellow-600' };
  } else {
    return { label: 'Loss', color: 'text-red-600' };
  }
}

export function getSectorIcon(sector: string): string {
  const icons: Record<string, string> = {
    'E-commerce': '🛒',
    'Fintech': '💳',
    'Healthtech': '🏥',
    'Edtech': '📚',
    'Logistics': '🚚',
    'Food & Beverage': '🍔',
    'SaaS': '☁️',
    'Gaming': '🎮',
    'Social Media': '📱',
    'PropTech': '🏢',
    'AgriTech': '🌾',
    'CleanTech': '♻️',
  };
  return icons[sector] || '💼';
}
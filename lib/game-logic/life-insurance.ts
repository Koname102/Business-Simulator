// ============================================
// FILE: lib/game-logic/life-insurance.ts (COMPLETE WITH HIGHER PROBABILITY)
// ============================================

import type { LifeInsurancePolicy, DifficultyLevel } from '@/lib/types';
import { FORMULAS } from '@/lib/constants';
import { guardTimestamp } from '@/lib/validation';

export function generateNewPolicy(difficulty?: DifficultyLevel): LifeInsurancePolicy {
  const minAge = 18;
  const maxAge = 65;
  const holderAge = Math.floor(Math.random() * (maxAge - minAge) + minAge);
  
  const healthRoll = Math.random();
  let healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  
  if (healthRoll < 0.3) healthStatus = 'excellent';
  else if (healthRoll < 0.7) healthStatus = 'good';
  else if (healthRoll < 0.9) healthStatus = 'fair';
  else healthStatus = 'poor';
  
  const coverageMin = 50_000_000;
  const coverageMax = 5_000_000_000;
  const ageFactor = (maxAge - holderAge) / (maxAge - minAge);
  const coverageAmount = Math.floor(
    coverageMin + (coverageMax - coverageMin) * ageFactor * (0.3 + Math.random() * 0.7)
  );
  
  const premiumMonthly = calculatePremium(coverageAmount, holderAge, healthStatus, difficulty);
  
  const startDate = Date.now();
  const endDate = startDate + (120 * 30 * 24 * 60 * 60 * 1000);
  
  const relations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Partner'];
  const relation = relations[Math.floor(Math.random() * relations.length)];
  const beneficiaryName = `${relation}: ${FORMULAS.generateRandomName()}`;
  
  return {
    id: crypto.randomUUID(),
    holderName: FORMULAS.generateRandomName(),
    holderAge,
    coverageAmount,
    premiumMonthly,
    status: 'active',
    startDate,
    endDate,
    beneficiaryName,
    healthStatus,
  };
}

export function calculatePremium(
  coverage: number,
  age: number,
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor',
  difficulty?: DifficultyLevel
): number {
  let baseRate = 0.015;
  
  if (age < 30) baseRate *= 0.8;
  else if (age < 40) baseRate *= 1.0;
  else if (age < 50) baseRate *= 1.3;
  else if (age < 60) baseRate *= 1.8;
  else baseRate *= 2.5;
  
  const healthMultipliers = {
    excellent: 0.9,
    good: 1.0,
    fair: 1.3,
    poor: 2.0,
  };
  baseRate *= healthMultipliers[healthStatus];
  
  if (difficulty) {
    const diffMultipliers = {
      easy: 1.2,
      medium: 1.0,
      hard: 0.85,
    };
    baseRate *= diffMultipliers[difficulty];
  }
  
  const annualPremium = coverage * baseRate;
  return Math.round(annualPremium / 12);
}

// âœ… UPDATED: Much lower claim probability
export function shouldGenerateClaim(
  policy: LifeInsurancePolicy,
  difficulty?: DifficultyLevel
): boolean {
  // âœ… Base: 0.5% per month (was 10%)
  let probability = 0.005; // 0.5% base chance per MONTH
  
  // Age risk multiplier
  if (policy.holderAge < 30) probability *= 0.3;      // Very safe
  else if (policy.holderAge < 40) probability *= 0.5; // Young, safe
  else if (policy.holderAge < 50) probability *= 1.0; // Middle age
  else if (policy.holderAge < 60) probability *= 2.0; // Senior
  else probability *= 4.0;                             // Elderly, risky
  
  // Health risk multiplier
  const healthMultipliers = {
    excellent: 0.5,  // Very healthy
    good: 1.0,       // Normal
    fair: 2.0,       // Some issues
    poor: 5.0,       // High risk
  };
  probability *= healthMultipliers[policy.healthStatus];
  
  // Difficulty multiplier
  if (difficulty) {
    const diffMultipliers = {
      easy: 0.7,     // Fewer claims
      medium: 1.0,   // Normal
      hard: 1.5,     // More claims
    };
    probability *= diffMultipliers[difficulty];
  }
  
  return Math.random() < probability;
}

export function generateClaimAmount(policy: LifeInsurancePolicy): number {
  const claimPercentages = [100, 100, 100, 50, 50, 30];
  const percentage = claimPercentages[Math.floor(Math.random() * claimPercentages.length)];
  
  return Math.round((policy.coverageAmount * percentage) / 100);
}

export function calculateClaimRatio(
  totalPremium: number, 
  totalClaims: number
): number {
  if (totalPremium === 0) return 0;
  return (totalClaims / totalPremium) * 100;
}

export function shouldPolicyExpire(policy: LifeInsurancePolicy): boolean {
  // ✅ ADD: Validate timestamp
  const timestampGuard = guardTimestamp(policy.endDate, 'Policy end date');
  if (!timestampGuard.isValid) {
    console.error('[shouldPolicyExpire] Invalid timestamp:', policy.endDate);
    return false; 
  }
  

  return Date.now() >= policy.endDate;
}

export function getHealthStatusColor(status: string): string {
  const colors: Record<string, string> = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  };
  return colors[status] || 'text-gray-600';
}

export function getAgeRiskLevel(age: number): { label: string; color: string } {
  if (age < 30) return { label: 'Low Risk', color: 'text-green-600' };
  if (age < 45) return { label: 'Medium Risk', color: 'text-blue-600' };
  if (age < 60) return { label: 'High Risk', color: 'text-yellow-600' };
  return { label: 'Very High Risk', color: 'text-red-600' };
}

export function formatPolicyDuration(startDate: number, endDate: number): string {
  const durationMs = endDate - startDate;
  const years = Math.floor(durationMs / (365 * 24 * 60 * 60 * 1000));
  return `${years} years`;
}

export function isPolicyActive(policy: LifeInsurancePolicy): boolean {
  return policy.status === 'active' && Date.now() < policy.endDate;
}

export function getRemainingPolicyTime(policy: LifeInsurancePolicy): string {
  const remaining = policy.endDate - Date.now();
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} remaining`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} remaining`;
  return `${days} day${days > 1 ? 's' : ''} remaining`;
}
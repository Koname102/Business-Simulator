// ============================================
// FILE: lib/game-logic/fintech.ts
// PURPOSE: Fintech business logic (P2P Lending)
// RELATIONS: Used by game dashboard, gameStore
// ============================================

import type { Loan, DifficultyLevel } from '@/lib/types';
import { BUSINESS_CONFIG, FORMULAS } from '@/lib/constants';
import { getInterestRateRange, getDefaultRisk } from '@/lib/difficulty-config';
import { guardDivisionByZero, getFirstErrorMessage } from '@/lib/validation';

// ✅ UPDATED: Add difficulty parameter
export function generateLoanApplication(difficulty?: DifficultyLevel): Loan {
  const amount = Math.floor(
    Math.random() * (BUSINESS_CONFIG.fintech.MAX_LOAN - BUSINESS_CONFIG.fintech.MIN_LOAN) + 
    BUSINESS_CONFIG.fintech.MIN_LOAN
  );
  
  const duration = [6, 12, 18, 24][Math.floor(Math.random() * 4)];
  
  // ✅ USE DIFFICULTY-BASED INTEREST RATE
  const { min, max } = difficulty 
    ? getInterestRateRange(difficulty)
    : { min: BUSINESS_CONFIG.fintech.INTEREST_RATE_MIN, max: BUSINESS_CONFIG.fintech.INTEREST_RATE_MAX };
  
  const interestRate = Math.floor(
    Math.random() * (max - min + 1) + min
  );
  
  const creditScore = Math.floor(Math.random() * 100);
  
  const totalRepayment = FORMULAS.calculateLoanRepayment(amount, interestRate, duration);
  
  return {
    id: crypto.randomUUID(),
    borrowerName: FORMULAS.generateRandomName(),
    amount,
    interestRate,
    duration,
    status: 'pending',
    paidAmount: 0,
    creditScore,
    totalRepayment,
  };
}

export function calculateMonthlyPayment(loan: Loan): number {
  const guard = guardDivisionByZero(loan.duration, 'Monthly payment calculation');
  if (!guard.isValid) {
    console.error('[calculateMonthlyPayment]', getFirstErrorMessage(guard));
    return 0; 
  }
  const totalRepayment = FORMULAS.calculateLoanRepayment(
    loan.amount,
    loan.interestRate,
    loan.duration
  );
  return Math.round(totalRepayment / loan.duration);
}

export function calculateTotalRepayment(loan: Loan): number {
  return FORMULAS.calculateLoanRepayment(
    loan.amount,
    loan.interestRate,
    loan.duration
  );
}

// ✅ UPDATED: Use difficulty-based default risk
export function shouldLoanDefault(loan: Loan, difficulty?: DifficultyLevel): boolean {
  if (loan.status !== 'active') return false;
  
  // Base default chance from credit score
  let baseDefaultChance = 0;
  
  if (loan.creditScore < 40) {
    baseDefaultChance = 0.15;  // High risk borrower
  } else if (loan.creditScore < 70) {
    baseDefaultChance = 0.08;  // Medium risk borrower
  } else {
    baseDefaultChance = 0.03;  // Low risk borrower
  }
  
  // ✅ If difficulty provided, use difficulty-adjusted risk
  if (difficulty) {
    const adjustedRisk = getDefaultRisk(loan, difficulty);
    return Math.random() < adjustedRisk;
  }
  
  // Fallback to base chance
  return Math.random() < baseDefaultChance;
}

export function calculateDefaultRate(loans: Loan[]): number {
  if (loans.length === 0) return 0;
  
  const completedLoans = loans.filter(
    l => l.status === 'paid' || l.status === 'defaulted'
  );
  
  if (completedLoans.length === 0) return 0;
  
  const defaultedCount = completedLoans.filter(l => l.status === 'defaulted').length;
  
  return (defaultedCount / completedLoans.length) * 100;
}

export function getCreditScoreLabel(score: number): { label: string; color: string } {
  if (score < 40) {
    return { label: 'High Risk', color: 'text-red-600' };
  } else if (score < 70) {
    return { label: 'Medium Risk', color: 'text-yellow-600' };
  } else {
    return { label: 'Low Risk', color: 'text-green-600' };
  }
}
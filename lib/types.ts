// ============================================
// FILE: lib/types.ts
// PURPOSE: TypeScript type definitions (MVP only)
// RELATIONS: Used by gameStore.ts, all components
// UPDATED: 2024-11-14 (Added claim history support)
// UPDATED: 2024-12-XX (Added NotificationType export for notifications-with-recovery)
// ============================================

export type BusinessType = 'fintech' | 'insurance' | 'investment';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// ✅ ADD: Export NotificationType for notifications-with-recovery.ts
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Player {
  id: string;
  name: string;
  age: number;
  experience: number;
  level: number;
  createdAt: number;
}

export interface Company {
  id: string;
  name: string;
  type: BusinessType;
  foundedAt: number;
  capital: number;
  balance: number;
  totalRevenue: number;
  totalExpense: number;
  monthlyProfit: number;
  reputation: number;
  customers: number;
  gameTime: number;
  isPaused: boolean;
  difficulty: DifficultyLevel;
}

export interface Transaction {
  id: string;
  timestamp: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
}

export interface GameNotification {
  id: string;
  timestamp: number;
  type: NotificationType; // ✅ CHANGED: Use NotificationType instead of inline type
  title: string;
  message: string;
  read: boolean;
}

// Business sub-type definition
export type BusinessSubType = 
  | 'fintech-lending'
  | 'life-insurance' 
  | 'health-insurance' 
  | 'venture-capital';

// ✓ NEW: Policy status types
export type PolicyStatus = 
  | 'active'          // Normal - collecting premium
  | 'premium_waiver'  // Disability - no premium, still covered
  | 'claimed'         // Death claim approved - terminated
  | 'expired'         // Contract ended naturally
  | 'terminated';     // Death claim rejected - terminated

// ✓ NEW: Claim decision record
export interface ClaimDecision {
  id: string;
  policyId: string;
  policyHolderName: string;
  holderAge: number;
  claimType: 'death' | 'critical_illness' | 'disability';
  claimAmount: number;
  coverageAmount: number;
  decision: 'approved' | 'rejected';
  decisionDate: number;
  reason: string;
  paidAmount?: number; // For approved claims
}

// Claim application for pending claims
export interface ClaimApplication {
  id: string;
  policyId: string;
  policyHolderName: string;
  holderAge: number;
  claimType: 'death' | 'critical_illness' | 'disability';
  claimAmount: number;
  coverageAmount: number;
  submittedAt: number;
  claimReason?: string;
}

// Fintech State
export interface FintechState {
  totalDisbursed: number;
  totalRepaid: number;
  defaultRate: number;
  activeLoans: number;
  currentLoans: Loan[];
}

export interface Loan {
  id: string;
  borrowerName: string;
  amount: number;
  interestRate: number;
  duration: number;
  status: 'pending' | 'active' | 'paid' | 'defaulted';
  disbursedAt?: number;
  dueDate?: number;
  paidAmount: number;
  creditScore: number;
  totalRepayment: number;
}

// ✓ UPDATED: Life Insurance Policy with new fields
export interface LifeInsurancePolicy {
  id: string;
  holderName: string;
  holderAge: number;
  coverageAmount: number;
  originalCoverage?: number; // ✓ Track original coverage amount
  premiumMonthly: number;
  status: PolicyStatus; // ✓ Updated to use PolicyStatus
  startDate: number;
  endDate: number;
  beneficiaryName: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
}

// Keep backward compatibility
export type Policy = LifeInsurancePolicy;

// ✓ UPDATED: Insurance State with claim history
export interface InsuranceState {
  totalPremiumCollected: number;
  totalClaimsPaid: number;
  claimRatio: number;
  activePolicies: number;
  currentPolicies: LifeInsurancePolicy[];
  claimHistory?: ClaimDecision[];
  pendingClaims?: ClaimApplication[];  // ✓ Added
}

// ADD this interface
export interface DealOpportunity {
  id: string;
  targetName: string;
  sector: string;
  valuation: number;
  equityOffered: number;
  investmentNeeded: number;
  pitchSummary: string;
}

// Investment State
export interface InvestmentState {
  aum: number;
  totalReturn: number;
  activeInvestments: number;
  portfolio: Investment[];
  currentDeals: DealOpportunity[];
}

export interface Investment {
  id: string;
  targetName: string;
  amount: number;
  equityStake: number;
  status: 'active' | 'exited' | 'failed';
  investedAt: number;
  currentValuation: number;
  returnMultiple: number;
  sector: string;
}

// Save Data
export interface SaveData {
  version: string; 
  timestamp: number; 
  playtime: number; 
  
  // Core game state
  player: Player;
  company: Company;
  
  // Business-specific state
  fintech?: FintechState;
  insurance?: InsuranceState;
  investment?: InvestmentState;
  
  // Universal data
  transactions: Transaction[];
  notifications: GameNotification[];
  
  // Game time
  gameTime: {
    elapsed: number; 
    isPaused: boolean;
    speed: number;
  };
  
  // Metadata
  metadata: SaveMetadata;
}

export interface SaveMetadata {
  slotNumber: number; 
  saveName: string; 
  businessType: 'fintech' | 'insurance' | 'investment';
  businessSubType?: BusinessSubType;
  difficulty: DifficultyLevel;
  progress: {
    balance: number;
    balanceGrowth: number; 
    level: number; 
    achievements: string[]; 
  };
  thumbnail?: string; 
}

export interface SaveSlot {
  slotNumber: number;
  isEmpty: boolean;
  saveData?: SaveData;
  lastSaved?: number;
  previewData?: {
    playerName: string;
    companyName: string;
    balance: number;
    businessType: string;
    difficulty: string;
    playtime: number;
  };
}

// Game State
export interface GameState {
  player: Player;
  company: Company;
  fintech?: FintechState;
  insurance?: InsuranceState;
  investment?: InvestmentState;
  transactions: Transaction[];
  notifications: GameNotification[];
  lastSaved: number;
  version: string;
}
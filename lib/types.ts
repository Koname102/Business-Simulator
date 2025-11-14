// ============================================
// FILE: lib/types.ts
// PURPOSE: TypeScript type definitions (MVP only)
// RELATIONS: Used by gameStore.ts, all components
// UPDATED: 2024-11-14 (Added claim history support)
// ============================================

export type BusinessType = 'fintech' | 'insurance' | 'investment';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

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
  type: 'info' | 'success' | 'warning' | 'error';
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

// ✅ NEW: Policy status types
export type PolicyStatus = 
  | 'active'          // Normal - collecting premium
  | 'premium_waiver'  // Disability - no premium, still covered
  | 'claimed'         // Death claim approved - terminated
  | 'expired'         // Contract ended naturally
  | 'terminated';     // Death claim rejected - terminated

// ✅ NEW: Claim decision record
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

// ✅ UPDATED: Life Insurance Policy with new fields
export interface LifeInsurancePolicy {
  id: string;
  holderName: string;
  holderAge: number;
  coverageAmount: number;
  originalCoverage?: number; // ✅ Track original coverage amount
  premiumMonthly: number;
  status: PolicyStatus; // ✅ Updated to use PolicyStatus
  startDate: number;
  endDate: number;
  beneficiaryName: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
}

// Keep backward compatibility
export type Policy = LifeInsurancePolicy;

// ✅ UPDATED: Insurance State with claim history
export interface InsuranceState {
  totalPremiumCollected: number;
  totalClaimsPaid: number;
  claimRatio: number;
  activePolicies: number;
  currentPolicies: LifeInsurancePolicy[];
  claimHistory?: ClaimDecision[]; // ✅ NEW: Claim decision history
}

// Investment State
export interface InvestmentState {
  aum: number;
  totalReturn: number;
  activeInvestments: number;
  portfolio: Investment[];
  currentDeals: any[];
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
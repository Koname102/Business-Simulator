// ============================================
// FILE: store/gameStore.ts
// PURPOSE: Zustand state management with LOGGER
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  GameState, 
  Player, 
  Company, 
  Transaction, 
  GameNotification, 
  ClaimDecision,
  ClaimApplication,
  Loan
} from '@/lib/types';
import { GAME_CONFIG, FORMULAS } from '@/lib/constants';
import { getStartingCapital, type DifficultyLevel } from '@/lib/difficulty-config';
import { validateAmount, guardBalanceFloor, getFirstErrorMessage } from '@/lib/validation';
import { validateSaveData, isVersionCompatible, sanitizeSaveData } from '@/lib/save-validation';
import { logger } from '@/lib/logger'; // ✅ ADD LOGGER

// ===== SAVE VERSION CONSTANTS =====
const CURRENT_VERSION = '0.0.2';
const LEGACY_VERSION = '0.0.1';

interface GameStore extends GameState {
  // Game initialization
  initializeGame: (
    playerName: string, 
    playerAge: number, 
    companyName: string, 
    businessType: 'fintech' | 'insurance' | 'investment',
    difficulty: DifficultyLevel
  ) => void;
  
  // Balance & transactions
  updateBalance: (amount: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  
  // Notifications
  deleteNotification: (notificationId: string) => void;
  addNotification: (notification: Omit<GameNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (notificationId: string) => void;
  
  // Claim history
  addClaimDecision: (decision: ClaimDecision) => void;
  
  // Pending claims management
  addPendingClaim: (claim: ClaimApplication) => void;
  removePendingClaim: (claimId: string) => void;
  getPendingClaims: () => ClaimApplication[];
  clearPendingClaims: () => void;
  
  // Game time & controls
  gameTime: number;
  updateGameTime: (seconds: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  
  // Game speed
  gameSpeed: number;
  setGameSpeed: (speed: number) => void;
  
  // Save/Load support
  setPlayer: (player: Player) => void;
  setCompany: (company: Company) => void;
}

// ===== MIGRATION FUNCTION =====
/**
 * Migrate loans from v0.0.1 (compound interest) to v0.0.2 (flat rate)
 */
function migrateLoanCalculations(loans: Loan[]): Loan[] {
  return loans.map(loan => {
    // Recalculate with new flat rate formula
    const newTotalRepayment = FORMULAS.calculateLoanRepayment(
      loan.amount,
      loan.interestRate,
      loan.duration
    );
    
    // Only migrate ACTIVE loans
    if (loan.status === 'active') {
      // Calculate current progress ratio
      const progressRatio = loan.paidAmount / loan.totalRepayment;
      
      // Apply same progress to new total
      const newPaidAmount = Math.round(newTotalRepayment * progressRatio);
      
      return {
        ...loan,
        totalRepayment: newTotalRepayment,
        paidAmount: newPaidAmount,
      };
    }
    
    // Keep completed/defaulted/paid loans unchanged (historical data)
    return loan;
  });
}

const initialState = {
  player: null as any,
  company: null as any,
  transactions: [],
  notifications: [],
  lastSaved: Date.now(),
  version: CURRENT_VERSION,
  gameSpeed: 1,
  gameTime: 0,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Helper: Get fintech state (type-safe)
      getFintechState: () => {
        const state = get();
        if (state.company?.type !== 'fintech' || !state.fintech) {
          throw new Error('Not a fintech business');
        }
        return state.fintech;
      },
      
      // Helper: Get insurance state (type-safe)
      getInsuranceState: () => {
        const state = get();
        if (state.company?.type !== 'insurance' || !state.insurance) {
          throw new Error('Not an insurance business');
        }
        return state.insurance;
      },
      
      // Helper: Get investment state (type-safe)
      getInvestmentState: () => {
        const state = get();
        if (state.company?.type !== 'investment' || !state.investment) {
          throw new Error('Not an investment business');
        }
        return state.investment;
      },
      
      // Initialize new game
      initializeGame: (playerName, playerAge, companyName, businessType, difficulty = 'medium') => {
        const now = Date.now();
        
        logger.info('GameStore', 'Initializing new game', {
          playerName,
          companyName,
          businessType,
          difficulty,
        });
        
        const player: Player = {
          id: crypto.randomUUID(),
          name: playerName,
          age: playerAge,
          experience: 0,
          level: 1,
          createdAt: now,
        };
        
        const startingCapital = getStartingCapital(businessType, difficulty);
        
        const company: Company = {
          id: crypto.randomUUID(),
          name: companyName,
          type: businessType,
          foundedAt: now,
          capital: startingCapital,
          balance: startingCapital,
          totalRevenue: 0,
          totalExpense: 0,
          monthlyProfit: 0,
          reputation: 50,
          customers: 0,
          gameTime: 0,
          isPaused: false,
          difficulty: difficulty,
        };
        
        const businessState = initializeBusinessState(businessType);
        
        set({
          player,
          company,
          ...businessState,
          transactions: [],
          notifications: [],
          gameTime: 0,
          version: CURRENT_VERSION,
        });
        
        logger.info('GameStore', 'Game initialized successfully', {
          playerId: player.id,
          companyId: company.id,
        });
      },
      
      // ✅ Update balance with logger
      updateBalance: (amount) => {
        // Validate amount
        if (typeof amount !== 'number' || isNaN(amount)) {
          logger.error('GameStore', 'Invalid amount type in updateBalance', null, { amount });
          return;
        }
        
        set((state) => {
          if (!state.company) return state;
          
          const newBalance = state.company.balance + amount;
          const isIncome = amount > 0;
          
          // ONLY guard against negative balance (for expenses)
          if (amount < 0) {
            const balanceGuard = guardBalanceFloor(state.company.balance, Math.abs(amount));
            if (!balanceGuard.isValid) {
              logger.error('GameStore', 'Insufficient balance in updateBalance', null, {
                currentBalance: state.company.balance,
                requestedAmount: Math.abs(amount),
                error: getFirstErrorMessage(balanceGuard),
              });
              
              // Notify user
              const notifications = state.notifications || [];
              const newNotification: GameNotification = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'error',
                title: 'Balance Tidak Cukup',
                message: 'Operasi dibatalkan karena balance tidak mencukupi',
                read: false,
              };
              
              return {
                ...state,
                notifications: [newNotification, ...notifications].slice(0, 50),
              };
            }
          }

          logger.debug('GameStore', 'Balance updated', {
            oldBalance: state.company.balance,
            change: amount,
            newBalance,
          });

          return {
            company: {
              ...state.company,
              balance: newBalance,
              totalRevenue: isIncome ? state.company.totalRevenue + amount : state.company.totalRevenue,
              totalExpense: !isIncome ? state.company.totalExpense + Math.abs(amount) : state.company.totalExpense,
              monthlyProfit: state.company.monthlyProfit + amount,
            },
          };
          
        });
      },

      // Delete notification
      deleteNotification: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));
      },
      
      // Add transaction
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        
        logger.debug('GameStore', 'Transaction added', {
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
        });
        
        set((state) => ({
          transactions: [newTransaction, ...state.transactions].slice(0, 100),
        }));
      },
      
      // Add notification
      addNotification: (notification) => {
        const newNotification: GameNotification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
        }));
      },
      
      // Mark notification read
      markNotificationRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },
      
      // Add claim decision to history
      addClaimDecision: (decision) => {
        set((state) => {
          if (!state.insurance) return state;
          
          const currentHistory = state.insurance.claimHistory || [];
          
          return {
            insurance: {
              ...state.insurance,
              claimHistory: [...currentHistory, decision],
            },
          };
        });
      },
      
      // ✅ Add pending claim with logger
      addPendingClaim: (claim) => {
        set((state) => {
          if (!state.insurance) {
            logger.error('GameStore', 'Cannot add pending claim: Not an insurance business');
            return state;
          }
          
          const currentPendingClaims = state.insurance.pendingClaims || [];
          
          // Check for duplicate claim IDs
          if (currentPendingClaims.some(c => c.id === claim.id)) {
            logger.warn('GameStore', 'Claim already exists in pending claims', { claimId: claim.id });
            return state;
          }
          
          logger.debug('GameStore', 'Pending claim added', { claimId: claim.id });
          
          return {
            insurance: {
              ...state.insurance,
              pendingClaims: [...currentPendingClaims, claim],
            },
          };
        });
      },
      
      // ✅ Remove pending claim with logger
      removePendingClaim: (claimId) => {
        set((state) => {
          if (!state.insurance) {
            logger.error('GameStore', 'Cannot remove pending claim: Not an insurance business');
            return state;
          }
          
          const currentPendingClaims = state.insurance.pendingClaims || [];
          const filteredClaims = currentPendingClaims.filter(c => c.id !== claimId);
          
          if (currentPendingClaims.length === filteredClaims.length) {
            logger.warn('GameStore', 'Claim not found in pending claims', { claimId });
          } else {
            logger.debug('GameStore', 'Pending claim removed', { claimId });
          }
          
          return {
            insurance: {
              ...state.insurance,
              pendingClaims: filteredClaims,
            },
          };
        });
      },
      
      // ✅ Get pending claims with logger
      getPendingClaims: () => {
        const state = get();
        
        if (!state.insurance) {
          logger.error('GameStore', 'Cannot get pending claims: Not an insurance business');
          return [];
        }
        
        return state.insurance.pendingClaims || [];
      },
      
      // ✅ Clear pending claims with logger
      clearPendingClaims: () => {
        set((state) => {
          if (!state.insurance) {
            logger.error('GameStore', 'Cannot clear pending claims: Not an insurance business');
            return state;
          }
          
          logger.info('GameStore', 'All pending claims cleared');
          
          return {
            insurance: {
              ...state.insurance,
              pendingClaims: [],
            },
          };
        });
      },
      
      // Update game time
      updateGameTime: (seconds) => {
        set((state) => ({
          gameTime: state.gameTime + seconds,
          company: state.company ? { 
            ...state.company, 
            gameTime: state.company.gameTime + seconds 
          } : state.company,
        }));
      },
      
      // Pause game
      pauseGame: () => {
        logger.info('GameStore', 'Game paused');
        set((state) => ({
          company: state.company ? { ...state.company, isPaused: true } : state.company,
        }));
      },
      
      // Resume game
      resumeGame: () => {
        logger.info('GameStore', 'Game resumed');
        set((state) => ({
          company: state.company ? { ...state.company, isPaused: false } : state.company,
        }));
      },
      
      // Reset game
      resetGame: () => {
        logger.info('GameStore', 'Game reset');
        set(initialState);
      },

      // Game speed controls
      gameSpeed: 1,
      setGameSpeed: (speed) => {
        logger.debug('GameStore', 'Game speed changed', { speed });
        set({ gameSpeed: speed });
      },
      
      // Save/Load support methods
      setPlayer: (player) => {
        set({ player });
      },
      
      setCompany: (company) => {
        set({ company });
      },
    }),
    {
      name: GAME_CONFIG.STORAGE_KEY,
      
      // ===== MIGRATION LOGIC IN PERSIST =====
      migrate: (persistedState: any, version: number) => {
        // Check if this is an old save (v0.0.1 or no version)
        if (!persistedState.version || persistedState.version === LEGACY_VERSION) {
          
          // Log migration start
          if (process.env.NODE_ENV === 'development') {
            logger.info('GameStore', 'Migration started: v0.0.1 → v0.0.2');
          }
          
          // Migrate fintech loans if they exist
          if (persistedState.fintech?.currentLoans?.length > 0) {
            persistedState.fintech.currentLoans = migrateLoanCalculations(
              persistedState.fintech.currentLoans
            );
            
            if (process.env.NODE_ENV === 'development') {
              logger.info('GameStore', 'Migrated fintech loans', {
                count: persistedState.fintech.currentLoans.length,
              });
            }
          }
          
          // Update version
          persistedState.version = CURRENT_VERSION;
          
          // Log migration complete
          if (process.env.NODE_ENV === 'development') {
            logger.info('GameStore', 'Migration completed successfully');
          }
        }
        
        return persistedState;
      },
      
      version: 1,  // Zustand persist version (increment to force migration)
    }
  )
);

function initializeBusinessState(type: 'fintech' | 'insurance' | 'investment') {
  switch (type) {
    case 'fintech':
      return {
        fintech: {
          loans: [],
          totalDisbursed: 0,
          totalRepaid: 0,
          defaultRate: 0,
          activeLoans: 0,
          currentLoans: [],
        },
      };
    case 'insurance':
      return {
        insurance: {
          totalPremiumCollected: 0,
          totalClaimsPaid: 0,
          claimRatio: 0,
          activePolicies: 0,
          currentPolicies: [],
          claimHistory: [],
          pendingClaims: [],
        },
      };
    case 'investment':
      return {
        investment: {
          portfolio: [],
          aum: 0,
          totalReturn: 0,
          activeInvestments: 0,
          currentDeals: [],
        },
      };
  }
}

// ✅ Expose store globally for SaveManager
if (typeof window !== 'undefined') {
  (window as any).__gameStore__ = useGameStore;
}
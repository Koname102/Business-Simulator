// ============================================
// FILE: store/gameStore.ts
// PURPOSE: Zustand state management (MVP only)
// RELATIONS: Imports types.ts, constants.ts | Used by all game components
// UPDATED: 2024-11-14 (Added claim history support)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Player, Company, Transaction, GameNotification, ClaimDecision } from '@/lib/types';
import { GAME_CONFIG } from '@/lib/constants';
import { getStartingCapital, type DifficultyLevel } from '@/lib/difficulty-config';

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
  
  // ✅ NEW: Claim history
  addClaimDecision: (decision: ClaimDecision) => void;
  
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

const initialState = {
  player: null as any,
  company: null as any,
  transactions: [],
  notifications: [],
  lastSaved: Date.now(),
  version: '0.0.1',
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
        });
      },
      
      // Update balance
      updateBalance: (amount) => {
        set((state) => {
          if (!state.company) return state;
          
          const newBalance = state.company.balance + amount;
          const isIncome = amount > 0;
          
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
      
      // ✅ NEW: Add claim decision to history
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
        set((state) => ({
          company: state.company ? { ...state.company, isPaused: true } : state.company,
        }));
      },
      
      // Resume game
      resumeGame: () => {
        set((state) => ({
          company: state.company ? { ...state.company, isPaused: false } : state.company,
        }));
      },
      
      // Reset game
      resetGame: () => {
        set(initialState);
      },

      // Game speed controls
      gameSpeed: 1,
      setGameSpeed: (speed) => {
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
          policies: [],
          totalPremiumCollected: 0,
          totalClaimsPaid: 0,
          claimRatio: 0,
          activePolicies: 0,
          currentPolicies: [],
          claimHistory: [], // ✅ Initialize claim history
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
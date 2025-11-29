import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';

describe('GameStore - State Management', () => {
  beforeEach(() => {
    // Clear the store completely
    const store = useGameStore.getState();
    store.resetGame();
    
    // Give time for persist middleware to settle
    return new Promise(resolve => setTimeout(resolve, 10));
  });
  
  describe('initializeGame', () => {
    it('creates player and company', async () => {
      const store = useGameStore.getState();
      
      store.initializeGame('Test Player', 30, 'Test Co', 'fintech', 'medium');
      
      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const state = useGameStore.getState();
      expect(state.player).toBeDefined();
      expect(state.player?.name).toBe('Test Player');
      expect(state.company).toBeDefined();
      expect(state.company?.name).toBe('Test Co');
    });
    
    it('initializes fintech state', async () => {
      const store = useGameStore.getState();
      store.initializeGame('Player', 30, 'Co', 'fintech', 'medium');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const state = useGameStore.getState();
      expect(state.fintech).toBeDefined();
      expect(state.fintech?.currentLoans).toEqual([]);
    });
    
    it('sets starting capital based on difficulty', async () => {
      const store = useGameStore.getState();
      
      store.initializeGame('P', 30, 'C', 'fintech', 'easy');
      await new Promise(resolve => setTimeout(resolve, 10));
      const easyCapital = useGameStore.getState().company?.balance;
      
      store.resetGame();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      store.initializeGame('P', 30, 'C', 'fintech', 'hard');
      await new Promise(resolve => setTimeout(resolve, 10));
      const hardCapital = useGameStore.getState().company?.balance;
      
      expect(easyCapital).toBeDefined();
      expect(hardCapital).toBeDefined();
      expect(easyCapital!).toBeGreaterThan(hardCapital!);
    });
  });
  
  describe('updateBalance', () => {
    beforeEach(async () => {
      const store = useGameStore.getState();
      store.initializeGame('P', 30, 'C', 'fintech', 'medium');
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    it('increases balance for income', async () => {
      const store = useGameStore.getState();
      const initial = store.company!.balance;
      
      store.updateBalance(10000000);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const state = useGameStore.getState();
      expect(state.company!.balance).toBe(initial + 10000000);
      expect(state.company!.totalRevenue).toBe(10000000);
    });
    
    it('decreases balance for expense', async () => {
      const store = useGameStore.getState();
      const initial = store.company!.balance;
      
      store.updateBalance(-5000000);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const state = useGameStore.getState();
      expect(state.company!.balance).toBe(initial - 5000000);
      expect(state.company!.totalExpense).toBe(5000000);
    });
  });
  
  describe('addTransaction', () => {
    beforeEach(async () => {
      const store = useGameStore.getState();
      store.initializeGame('P', 30, 'C', 'fintech', 'medium');
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    it('adds transaction to list', async () => {
      const store = useGameStore.getState();
      
      store.addTransaction({
        type: 'income',
        amount: 1000000,
        category: 'test',
        description: 'Test',
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const state = useGameStore.getState();
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0]).toMatchObject({
        type: 'income',
        amount: 1000000,
      });
    });
    
    it('limits transactions to 100', async () => {
      const store = useGameStore.getState();
      
      for (let i = 0; i < 150; i++) {
        store.addTransaction({
          type: 'income',
          amount: 1000,
          category: 'test',
          description: `${i}`,
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const state = useGameStore.getState();
      expect(state.transactions).toHaveLength(100);
    });
  });
});
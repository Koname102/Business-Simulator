// ============================================
// FILE: app/game/fintech/page.tsx
// PURPOSE: Fintech game dashboard
// RELATIONS: Main fintech gameplay page
// ============================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { generateLoanApplication, shouldLoanDefault } from '@/lib/game-logic/fintech';
import type { Loan } from '@/lib/types';
import { calculateRealInterval, convertRealToGameTime } from '@/lib/time-system';
import { getDifficultyAdjustedInterval } from '@/lib/difficulty-config';
import AutoSaveManager from '@/components/game/saves/AutoSaveManager';

import Header from '@/components/game/shared/Header';
import FintechStats from '@/components/game/fintech/FintechStats';
import LoanApplicationCard from '@/components/game/fintech/lending/LoanApplicationCard';
import ActiveLoanCard from '@/components/game/fintech/lending/ActiveLoanCard';
import TimeDisplay from '@/components/game/shared/TimeDisplay';

export default function GamePage() {
  const router = useRouter();
  
  const player = useGameStore((state) => state.player);
  const company = useGameStore((state) => state.company);
  const fintech = useGameStore((state) => state.fintech);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const updateGameTime = useGameStore((state) => state.updateGameTime);
  
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ FIXED: Better initialization check with delay
  useEffect(() => {
    // Check if loading from save
    const isLoadingSave = sessionStorage.getItem('loading-save');
    
    if (isLoadingSave) {
      // Clear flag and skip redirect check
      sessionStorage.removeItem('loading-save');
      setIsLoading(false);
      return;
    }
    
    // Give time for Zustand persist to load
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Only redirect if truly not initialized after loading
      if (!player || !company || !fintech) {
        console.log('Game not initialized, redirecting to onboarding');
        router.push('/onboarding/character');
      }
    }, 200); // Delay for persist to load
    
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // ✅ Loan generation handler
  const handleLoanGeneration = useCallback(() => {
    if (company?.isPaused) return;
    
    const newLoan = generateLoanApplication(company?.difficulty);
    setPendingLoans((prev) => [...prev, newLoan]);
    
    useGameStore.getState().addNotification({
      type: 'info',
      title: 'New Loan Application',
      message: `${newLoan.borrowerName} applied for ${formatCurrency(newLoan.amount)}`,
    });
  }, [company?.isPaused, company?.difficulty]);

  // ✅ NEW: Load loans from store on mount
  useEffect(() => {
    if (!fintech || isInitialized) return;
    
    // Load loans from fintech state (if exists)
    if (fintech.currentLoans && fintech.currentLoans.length > 0) {
      const pending = fintech.currentLoans.filter(l => l.status === 'pending');
      const active = fintech.currentLoans.filter(l => l.status === 'active' || l.status === 'paid' || l.status === 'defaulted');
      
      setPendingLoans(pending);
      setActiveLoans(active);
      
      console.log(`✅ Loaded ${pending.length} pending loans and ${active.length} active loans from store`);
    }
    
    setIsInitialized(true);
  }, [fintech, isInitialized]);

  // ✅ NEW: Sync loans to store whenever they change
  useEffect(() => {
    if (!fintech || !isInitialized) return;
    
    // Combine pending and active loans
    const allLoans = [...pendingLoans, ...activeLoans];
    
    // Update fintech state with current loans
    useGameStore.setState({
      fintech: {
        ...fintech,
        currentLoans: allLoans,
      },
    });
    
    console.log(`✅ Synced ${allLoans.length} loans to store`);
  }, [pendingLoans, activeLoans, isInitialized]);

  // ✅ Repayment handler with proper balance tracking
  const handleRepayment = useCallback(() => {
    if (company?.isPaused) return;
    
    // Process loans and collect side effects
    let totalBalanceIncrease = 0;
    const transactionsToAdd: Array<{
      type: 'income' | 'expense';
      amount: number;
      category: string;
      description: string;
    }> = [];
    const notificationsToAdd: Array<{
      type: 'info' | 'success' | 'warning' | 'error';
      title: string;
      message: string;
    }> = [];
    
    // Process current loans first (before setState)
    const processedLoans = activeLoans.map((loan) => {
      if (loan.status !== 'active') return loan;
      
      // Check for default
      if (shouldLoanDefault(loan, company?.difficulty)) {
        const totalLoss = loan.amount - loan.paidAmount;
        
        transactionsToAdd.push({
          type: 'expense',
          amount: totalLoss,
          category: 'loan-default',
          description: `Loan defaulted by ${loan.borrowerName} (${loan.paidAmount > 0 ? formatCurrency(loan.paidAmount) + ' was repaid' : 'no payment received'})`,
        });
        
        notificationsToAdd.push({
          type: 'error',
          title: 'Loan Defaulted',
          message: `${loan.borrowerName} defaulted. Loss: ${formatCurrency(totalLoss)}`,
        });
        
        return { ...loan, status: 'defaulted' as const };
      }
      
      // Calculate payment amounts
      const monthlyPayment = calculateMonthlyPayment(loan);
      const totalRepayment = calculateTotalRepayment(loan);
      const newPaidAmount = loan.paidAmount + monthlyPayment;
      
      // Check if loan will be completed this payment
      if (newPaidAmount >= totalRepayment) {
        const finalPayment = totalRepayment - loan.paidAmount;
        totalBalanceIncrease += finalPayment;
        
        transactionsToAdd.push({
          type: 'income',
          amount: finalPayment,
          category: 'loan-repayment',
          description: `Final payment from ${loan.borrowerName} (Loan completed)`,
        });
        
        notificationsToAdd.push({
          type: 'success',
          title: 'Loan Completed',
          message: `${loan.borrowerName} completed repayment. Total: ${formatCurrency(totalRepayment)}`,
        });
        
        return { ...loan, paidAmount: totalRepayment, status: 'paid' as const };
      }
      
      // Regular monthly payment
      totalBalanceIncrease += monthlyPayment;
      
      transactionsToAdd.push({
        type: 'income',
        amount: monthlyPayment,
        category: 'loan-repayment',
        description: `Monthly payment from ${loan.borrowerName} (${Math.round(loan.paidAmount / totalRepayment * 100)}% paid)`,
      });
      
      return { ...loan, paidAmount: newPaidAmount };
    });
    
    // Update state with processed loans
    setActiveLoans(processedLoans);
    
    // Apply balance changes
    if (totalBalanceIncrease > 0) {
      console.log(`[Repayment] Collected: ${formatCurrency(totalBalanceIncrease)}`);
      useGameStore.getState().updateBalance(totalBalanceIncrease);
      
      // Update fintech stats
      const currentFintech = useGameStore.getState().fintech;
      if (currentFintech) {
        const activeLoanCount = processedLoans.filter(l => l.status === 'active').length;
        useGameStore.setState({
          fintech: {
            ...currentFintech,
            totalRepaid: currentFintech.totalRepaid + totalBalanceIncrease,
            activeLoans: activeLoanCount,
          },
        });
      }
    }
    
    // Add all transactions
    transactionsToAdd.forEach((transaction) => {
      useGameStore.getState().addTransaction(transaction);
    });
    
    // Add all notifications
    notificationsToAdd.forEach((notification) => {
      useGameStore.getState().addNotification(notification);
    });
  }, [company?.isPaused, company?.difficulty, activeLoans]);

  // Game time ticker
  useEffect(() => {
    if (!company || company.isPaused || !gameSpeed) return;
    
    const tickInterval = 1000 / gameSpeed;
    
    const gameTicker = setInterval(() => {
      const gameSecondsElapsed = convertRealToGameTime(1, 'fintech') * 60;
      updateGameTime(gameSecondsElapsed);
    }, tickInterval);
    
    return () => clearInterval(gameTicker);
  }, [company, gameSpeed, updateGameTime]);

  // Loan generation interval
  useEffect(() => {
    if (!gameSpeed || !company) return;
    
    const baseInterval = calculateRealInterval(15, 'fintech', gameSpeed);
    const adjustedInterval = company.difficulty 
      ? getDifficultyAdjustedInterval(baseInterval, company.difficulty)
      : baseInterval;
    
    const loanGeneratorInterval = setInterval(handleLoanGeneration, adjustedInterval);
    return () => clearInterval(loanGeneratorInterval);
  }, [handleLoanGeneration, gameSpeed, company?.difficulty]);

  // Repayment interval
  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(30, 'fintech', gameSpeed);
    const repaymentInterval = setInterval(handleRepayment, interval);
    return () => clearInterval(repaymentInterval);
  }, [handleRepayment, gameSpeed]);

  const handleApproveLoan = (loanId: string) => {
    const loan = pendingLoans.find((l) => l.id === loanId);
    if (!loan) return;
    
    if (company && company.balance < loan.amount) {
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Insufficient Balance',
        message: 'Not enough balance to approve this loan',
      });
      return;
    }
    
    // Deduct balance for disbursement
    useGameStore.getState().updateBalance(-loan.amount);
    
    useGameStore.getState().addTransaction({
      type: 'expense',
      amount: loan.amount,
      category: 'loan-disbursement',
      description: `Loan disbursed to ${loan.borrowerName}`,
    });
    
    useGameStore.getState().addNotification({
      type: 'success',
      title: 'Loan Approved',
      message: `Disbursed ${formatCurrency(loan.amount)} to ${loan.borrowerName}`,
    });
    
    // Create active loan with initial paidAmount = 0
    const approvedLoan: Loan = {
      ...loan,
      status: 'active',
      paidAmount: 0,
      disbursedAt: Date.now(),
      dueDate: Date.now() + loan.duration * 30 * 24 * 60 * 60 * 1000,
    };
    
    setActiveLoans((prev) => [...prev, approvedLoan]);
    setPendingLoans((prev) => prev.filter((l) => l.id !== loanId));
    
    // Update fintech stats
    const currentFintech = useGameStore.getState().fintech;
    if (currentFintech) {
      useGameStore.setState({
        fintech: {
          ...currentFintech,
          totalDisbursed: currentFintech.totalDisbursed + loan.amount,
          activeLoans: currentFintech.activeLoans + 1,
        },
      });
    }
  };

  const handleRejectLoan = (loanId: string) => {
    const loan = pendingLoans.find((l) => l.id === loanId);
    if (!loan) return;
    
    setPendingLoans((prev) => prev.filter((l) => l.id !== loanId));
    useGameStore.getState().addNotification({
      type: 'info',
      title: 'Loan Rejected',
      message: `Application from ${loan.borrowerName} rejected`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateMonthlyPayment = (loan: Loan): number => {
    const totalRepayment = loan.amount * Math.pow(1 + loan.interestRate / 100, loan.duration / 12);
    return Math.round(totalRepayment / loan.duration);
  };

  const calculateTotalRepayment = (loan: Loan): number => {
    return loan.amount * Math.pow(1 + loan.interestRate / 100, loan.duration / 12);
  };

  // ✅ LOADING SCREEN
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">💼</div>
          <div className="text-xl text-gray-600 font-semibold">Loading game...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  if (!player || !company || !fintech) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600">Initializing...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoSaveManager />
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <TimeDisplay businessType="fintech" />
        <FintechStats />
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📋 Loan Applications ({pendingLoans.length})
          </h2>
          
          {pendingLoans.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No pending loan applications</p>
              <p className="text-sm text-gray-500 mt-2">New applications will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingLoans.map((loan) => (
                <LoanApplicationCard
                  key={loan.id}
                  loan={loan}
                  onApprove={handleApproveLoan}
                  onReject={handleRejectLoan}
                />
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💼 Active Loans ({activeLoans.filter(l => l.status === 'active').length})
          </h2>
          
          {activeLoans.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No active loans yet</p>
              <p className="text-sm text-gray-500 mt-2">Approve loan applications to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeLoans.map((loan) => (
                <ActiveLoanCard key={loan.id} loan={loan} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ============================================
// FILE: app/game/fintech/lending/page.tsx
// PURPOSE: Fintech game dashboard with FULL ERROR HANDLING
// ============================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { generateLoanApplication, shouldLoanDefault } from '@/lib/game-logic/lending';
import type { Loan } from '@/lib/types';
import { calculateRealInterval, convertRealToGameTime } from '@/lib/time-system';
import { getDifficultyAdjustedInterval } from '@/lib/difficulty-config';
import { guardArrayAccess, guardBalanceFloor, getFirstErrorMessage } from '@/lib/validation';
import AutoSaveManager from '@/components/game/saves/AutoSaveManager';
import { FORMULAS } from '@/lib/constants';
import Toast from '@/components/ui/Toast';
import { logger } from '@/lib/logger'; // ✅ ADD LOGGER

import Header from '@/components/game/shared/Header';
import FintechStats from '@/components/game/fintech/lending/LendingStats';
import LoanApplicationCard from '@/components/game/fintech/lending/LoanApplicationCard';
import ActiveLoanCard from '@/components/game/fintech/lending/ActiveLoanCard';
import TimeDisplay from '@/components/game/shared/TimeDisplay';

export default function FintechLendingPage() {
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

  useEffect(() => {
    const isLoadingSave = sessionStorage.getItem('loading-save');
    
    if (isLoadingSave) {
      sessionStorage.removeItem('loading-save');
      setIsLoading(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      if (!player || !company || !fintech) {
        logger.warn('FintechLending', 'Game not initialized, redirecting to onboarding');
        router.push('/onboarding/character');
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    if (!fintech || isInitialized) return;
    
    if (fintech.currentLoans && fintech.currentLoans.length > 0) {
      const pending = fintech.currentLoans.filter(l => l.status === 'pending');
      const active = fintech.currentLoans.filter(l => l.status === 'active' || l.status === 'paid' || l.status === 'defaulted');
      
      setPendingLoans(pending);
      setActiveLoans(active);
      
      logger.info('FintechLending', `Loaded ${pending.length} pending and ${active.length} active loans from store`);
    }
    
    setIsInitialized(true);
  }, [fintech, isInitialized]);

  useEffect(() => {
    if (!fintech || !isInitialized) return;
    
    const allLoans = [...pendingLoans, ...activeLoans];
    
    useGameStore.setState({
      fintech: {
        ...fintech,
        currentLoans: allLoans,
      },
    });
    
    logger.debug('FintechLending', `Synced ${allLoans.length} loans to store`);
  }, [pendingLoans, activeLoans, isInitialized]);

  // ✅ FULL TRY-CATCH: handleRepayment
  const handleRepayment = useCallback(() => {
    try {
      if (company?.isPaused) return;
      
      // ✅ KEEP existing validation
      const arrayGuard = guardArrayAccess(activeLoans, 0, 'Active Loans');
      if (!arrayGuard.isValid) {
        return; // No active loans, skip silently
      }
      
      const op = logger.operation('Fintech', 'ProcessRepayments');
      
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
      
      const processedLoans = activeLoans.map((loan) => {
        if (loan.status !== 'active') return loan;
        
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
        
        const monthlyPayment = calculateMonthlyPayment(loan);
        const totalRepayment = calculateTotalRepayment(loan);
        const newPaidAmount = loan.paidAmount + monthlyPayment;
        
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
        
        totalBalanceIncrease += monthlyPayment;
        
        transactionsToAdd.push({
          type: 'income',
          amount: monthlyPayment,
          category: 'loan-repayment',
          description: `Monthly payment from ${loan.borrowerName} (${Math.round(loan.paidAmount / totalRepayment * 100)}% paid)`,
        });
        
        return { ...loan, paidAmount: newPaidAmount };
      });
      
      setActiveLoans(processedLoans);
      
      if (totalBalanceIncrease > 0) {
        useGameStore.getState().updateBalance(totalBalanceIncrease);
        
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
      
      transactionsToAdd.forEach((transaction) => {
        useGameStore.getState().addTransaction(transaction);
      });
      
      notificationsToAdd.forEach((notification) => {
        useGameStore.getState().addNotification(notification);
      });
      
      op.success('Repayments processed', { 
        totalCollected: totalBalanceIncrease,
        loansProcessed: processedLoans.length 
      });
      
    } catch (error) {
      logger.error('Fintech', 'Repayment processing failed', error);
      // ✅ Graceful fallback: continue silently, will retry next cycle
    }
  }, [company?.isPaused, company?.difficulty, activeLoans]);

  useEffect(() => {
    if (!company || company.isPaused || !gameSpeed) return;
    
    const tickInterval = 1000 / gameSpeed;
    
    const gameTicker = setInterval(() => {
      const gameSecondsElapsed = convertRealToGameTime(1, 'fintech') * 60;
      updateGameTime(gameSecondsElapsed);
    }, tickInterval);
    
    return () => clearInterval(gameTicker);
  }, [company, gameSpeed, updateGameTime]);

  useEffect(() => {
    if (!gameSpeed || !company) return;
    
    const baseInterval = calculateRealInterval(15, 'fintech', gameSpeed);
    const adjustedInterval = company.difficulty 
      ? getDifficultyAdjustedInterval(baseInterval, company.difficulty)
      : baseInterval;
    
    const loanGeneratorInterval = setInterval(handleLoanGeneration, adjustedInterval);
    return () => clearInterval(loanGeneratorInterval);
  }, [handleLoanGeneration, gameSpeed, company?.difficulty]);

  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(30, 'fintech', gameSpeed);
    const repaymentInterval = setInterval(handleRepayment, interval);
    return () => clearInterval(repaymentInterval);
  }, [handleRepayment, gameSpeed]);

  // ✅ FULL TRY-CATCH: handleApproveLoan
  const handleApproveLoan = async (loanId: string) => {
    try {
      // 1. Validate input
      if (!loanId) {
        throw new Error('[VAL-001] Loan ID is required');
      }

      // 2. Validate array not empty (KEEP existing validation!)
      const arrayGuard = guardArrayAccess(pendingLoans, 0, 'Pending Loans');
      if (!arrayGuard.isValid) {
        throw new Error('[STATE-005] ' + getFirstErrorMessage(arrayGuard));
      }
      
      // 3. Find loan
      const loan = pendingLoans.find((l) => l.id === loanId);
      if (!loan) {
        throw new Error('[OP-001] Loan not found');
      }
      
      // 4. Check company state
      if (!company) {
        throw new Error('[STATE-003] Company not initialized');
      }

      // 5. Validate balance (KEEP existing validation!)
      const balanceGuard = guardBalanceFloor(company.balance, loan.amount);
      if (!balanceGuard.isValid) {
        throw new Error('[STATE-001] ' + (getFirstErrorMessage(balanceGuard) || 'Insufficient balance'));
      }
      
      // 6. Log operation start
      const op = logger.operation('Fintech', 'ApproveLoan');
      
      // 7. Process loan approval
      useGameStore.getState().updateBalance(-loan.amount);
      
      useGameStore.getState().addTransaction({
        type: 'expense',
        amount: loan.amount,
        category: 'loan-disbursement',
        description: `Loan disbursed to ${loan.borrowerName}`,
      });
      
      const approvedLoan: Loan = {
        ...loan,
        status: 'active',
        paidAmount: 0,
        disbursedAt: Date.now(),
        dueDate: Date.now() + loan.duration * 30 * 24 * 60 * 60 * 1000,
      };
      
      setActiveLoans((prev) => [...prev, approvedLoan]);
      setPendingLoans((prev) => prev.filter((l) => l.id !== loanId));
      
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

      // 8. Log success
      op.success('Loan approved', {
        loanId,
        borrowerName: loan.borrowerName,
        amount: loan.amount,
      });

      // 9. Notify user
      useGameStore.getState().addNotification({
        type: 'success',
        title: 'Loan Approved',
        message: `Disbursed ${formatCurrency(loan.amount)} to ${loan.borrowerName}`,
      });

      return true;

    } catch (error) {
      // 10. Log error
      logger.error('Fintech', 'Loan approval failed', error, { loanId });

      // 11. Notify user
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Loan Approval Failed',
        message: error instanceof Error ? error.message.replace(/^\[.*?\]\s*/, '') : 'Unable to approve loan',
      });

      // 12. Graceful exit
      return false;
    }
  };

  // ✅ FULL TRY-CATCH: handleRejectLoan
  const handleRejectLoan = async (loanId: string) => {
    try {
      // 1. Validate input
      if (!loanId) {
        throw new Error('[VAL-001] Loan ID is required');
      }

      // 2. Validate array not empty (KEEP existing validation!)
      const arrayGuard = guardArrayAccess(pendingLoans, 0, 'Pending Loans');
      if (!arrayGuard.isValid) {
        throw new Error('[STATE-005] ' + getFirstErrorMessage(arrayGuard));
      }
      
      // 3. Find loan
      const loan = pendingLoans.find((l) => l.id === loanId);
      if (!loan) {
        throw new Error('[OP-001] Loan not found');
      }

      // 4. Log operation start
      const op = logger.operation('Fintech', 'RejectLoan');
      
      // 5. Process rejection
      setPendingLoans((prev) => prev.filter((l) => l.id !== loanId));

      // 6. Log success
      op.success('Loan rejected', {
        loanId,
        borrowerName: loan.borrowerName,
      });

      // 7. Notify user
      useGameStore.getState().addNotification({
        type: 'info',
        title: 'Loan Rejected',
        message: `Application from ${loan.borrowerName} rejected`,
      });

      return true;

    } catch (error) {
      // 8. Log error
      logger.error('Fintech', 'Loan rejection failed', error, { loanId });

      // 9. Notify user (optional for rejection)
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: error instanceof Error ? error.message.replace(/^\[.*?\]\s*/, '') : 'Unable to reject loan',
      });

      // 10. Graceful exit
      return false;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateMonthlyPayment = (loan: Loan): number => {
    const totalRepayment = FORMULAS.calculateLoanRepayment(
      loan.amount,
      loan.interestRate,
      loan.duration
    );
    return Math.round(totalRepayment / loan.duration);
  };

  const calculateTotalRepayment = (loan: Loan): number => {
    return FORMULAS.calculateLoanRepayment(
      loan.amount,
      loan.interestRate,
      loan.duration
    );
  };

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
      <Toast />
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
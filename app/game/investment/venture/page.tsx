// ============================================
// FILE: app/game/investment/venture/page.tsx
// PURPOSE: Venture Capital game dashboard with FULL ERROR HANDLING
// ============================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import {
  generateDealFlow,
  calculateManagementFee,
  calculatePerformanceFee,
  simulateValuationChange,
  shouldStartupFail,
  generateExitValuation,
} from '@/lib/game-logic/venture';
import type { Investment, DealOpportunity } from '@/lib/types';
import { calculateRealInterval, convertRealToGameTime } from '@/lib/time-system';
import { getDifficultyAdjustedInterval } from '@/lib/difficulty-config';
import { 
  guardArrayAccess, 
  guardBalanceFloor,
  guardDivisionByZero,
  getFirstErrorMessage 
} from '@/lib/validation';
import AutoSaveManager from '@/components/game/saves/AutoSaveManager';
import Toast from '@/components/ui/Toast';
import { logger } from '@/lib/logger'; // ✅ ADD LOGGER

import Header from '@/components/game/shared/Header';
import TimeDisplay from '@/components/game/shared/TimeDisplay';
import DealFlowCard from '@/components/game/investment/venture/DealFlowCard';
import PortfolioCard from '@/components/game/investment/venture/PortfolioCard';
import VentureStats from '@/components/game/investment/venture/VentureStats';

export default function VentureCapitalPage() {
  const router = useRouter();
  
  const player = useGameStore((state) => state.player);
  const company = useGameStore((state) => state.company);
  const investment = useGameStore((state) => state.investment);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const updateGameTime = useGameStore((state) => state.updateGameTime);
  
  const [portfolio, setPortfolio] = useState<Investment[]>([]);
  const [dealFlow, setDealFlow] = useState<DealOpportunity[]>([]);
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
      
      if (!player || !company || !investment) {
        logger.warn('VentureCapital', 'Game not initialized, redirecting to onboarding');
        router.push('/onboarding/character');
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [player, company, investment, router]);

  useEffect(() => {
    if (!investment || isInitialized) return;
    
    if (investment.portfolio && investment.portfolio.length > 0) {
      setPortfolio(investment.portfolio);
      logger.info('VentureCapital', `Loaded ${investment.portfolio.length} investments from store`);
    }
    
    if (investment.currentDeals && investment.currentDeals.length > 0) {
      setDealFlow(investment.currentDeals);
      logger.info('VentureCapital', `Loaded ${investment.currentDeals.length} deals from store`);
    } else {
      logger.info('VentureCapital', 'No deals in store, generating initial deals...');
      const initialDeals: DealOpportunity[] = [];
      for (let i = 0; i < 3; i++) {
        const dealData = generateDealFlow();
        const pitchTemplates = [
          `We're revolutionizing ${dealData.startup.sector} with AI-powered solutions`,
          `Leading the next wave of ${dealData.startup.sector} innovation`,
          `Disrupting traditional ${dealData.startup.sector} with cutting-edge technology`,
          `Building the future of ${dealData.startup.sector} for Southeast Asia`,
        ];
        
        initialDeals.push({
          id: crypto.randomUUID(),
          targetName: dealData.startup.targetName,
          sector: dealData.startup.sector,
          valuation: dealData.valuation,
          equityOffered: dealData.equityOffered,
          investmentNeeded: dealData.investmentNeeded,
          pitchSummary: pitchTemplates[Math.floor(Math.random() * pitchTemplates.length)],
        });
      }
      setDealFlow(initialDeals);
      logger.info('VentureCapital', `Generated ${initialDeals.length} initial deals`);
    }
    
    setIsInitialized(true);
  }, [investment, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const currentInvestment = useGameStore.getState().investment;
    if (!currentInvestment) return;
    
    useGameStore.setState({
      investment: {
        ...currentInvestment,
        portfolio: portfolio,
        currentDeals: dealFlow,
      },
    });
    
    logger.debug('VentureCapital', `Synced ${portfolio.length} investments and ${dealFlow.length} deals to store`);
  }, [portfolio, dealFlow, isInitialized]);

  const handleDealGeneration = useCallback(() => {
    try {
      if (company?.isPaused) return;
      
      if (dealFlow.length >= 5) {
        logger.debug('VentureCapital', 'Max deals reached (5), skipping generation');
        return;
      }
      
      const op = logger.operation('Investment', 'GenerateDeal');
      
      const dealData = generateDealFlow();
      
      const pitchTemplates = [
        `We're revolutionizing ${dealData.startup.sector} with AI-powered solutions that will change the industry forever`,
        `Leading the next wave of ${dealData.startup.sector} innovation with proven traction and strong unit economics`,
        `Disrupting traditional ${dealData.startup.sector} with cutting-edge technology backed by experienced founders`,
        `Building the future of ${dealData.startup.sector} for Southeast Asia with a scalable business model`,
        `Transforming ${dealData.startup.sector} through data-driven insights and exceptional customer experience`,
      ];
      
      const newDeal: DealOpportunity = {
        id: crypto.randomUUID(),
        targetName: dealData.startup.targetName,
        sector: dealData.startup.sector,
        valuation: dealData.valuation,
        equityOffered: dealData.equityOffered,
        investmentNeeded: dealData.investmentNeeded,
        pitchSummary: pitchTemplates[Math.floor(Math.random() * pitchTemplates.length)],
      };
      
      setDealFlow((prev) => [...prev, newDeal]);
      
      op.success('Deal generated', {
        dealId: newDeal.id,
        targetName: newDeal.targetName,
        investmentNeeded: newDeal.investmentNeeded,
      });
      
      useGameStore.getState().addNotification({
        type: 'info',
        title: 'New Deal Opportunity',
        message: `${newDeal.targetName} - ${formatCurrency(newDeal.investmentNeeded)}`,
      });
      
    } catch (error) {
      logger.error('Investment', 'Deal generation failed', error);
      // ✅ Graceful fallback: skip this generation cycle
    }
  }, [company?.isPaused, dealFlow.length]);

  // ✅ FULL TRY-CATCH: handleInvest
  const handleInvest = async (dealId: string) => {
    try {
      // 1. Validate input
      if (!dealId) {
        throw new Error('[VAL-001] Deal ID is required');
      }

      // 2. Validate array not empty (KEEP existing validation!)
      const arrayGuard = guardArrayAccess(dealFlow, 0, 'Deal Flow');
      if (!arrayGuard.isValid) {
        throw new Error('[STATE-005] ' + getFirstErrorMessage(arrayGuard));
      }
      
      // 3. Find deal
      const deal = dealFlow.find(d => d.id === dealId);
      if (!deal) {
        throw new Error('[OP-003] Deal not found');
      }
      
      // 4. Check company state
      if (!company) {
        throw new Error('[STATE-003] Company not initialized');
      }

      // 5. Validate balance (KEEP existing validation!)
      const balanceGuard = guardBalanceFloor(company.balance, deal.investmentNeeded);
      if (!balanceGuard.isValid) {
        throw new Error('[STATE-001] ' + (getFirstErrorMessage(balanceGuard) || 'Insufficient balance'));
      }
      
      // 6. Log operation start
      const op = logger.operation('Investment', 'Invest');
      
      // 7. Process investment
      useGameStore.getState().updateBalance(-deal.investmentNeeded);
      
      useGameStore.getState().addTransaction({
        type: 'expense',
        amount: deal.investmentNeeded,
        category: 'investment',
        description: `Investment in ${deal.targetName}`,
      });
      
      const newInvestment: Investment = {
        id: crypto.randomUUID(),
        targetName: deal.targetName,
        amount: deal.investmentNeeded,
        equityStake: deal.equityOffered,
        status: 'active',
        sector: deal.sector,
        investedAt: Date.now(),
        currentValuation: deal.investmentNeeded,
        returnMultiple: 1.0,
      };
      
      setPortfolio((prev) => [...prev, newInvestment]);
      setDealFlow((prev) => prev.filter(d => d.id !== dealId));
      
      const currentInvestment = useGameStore.getState().investment;
      if (currentInvestment) {
        useGameStore.setState({
          investment: {
            ...currentInvestment,
            aum: currentInvestment.aum + deal.investmentNeeded,
            activeInvestments: currentInvestment.activeInvestments + 1,
          },
        });
      }

      // 8. Log success
      op.success('Investment made', {
        dealId,
        targetName: deal.targetName,
        amount: deal.investmentNeeded,
      });

      // 9. Notify user
      useGameStore.getState().addNotification({
        type: 'success',
        title: 'Investment Completed',
        message: `Invested ${formatCurrency(deal.investmentNeeded)} in ${deal.targetName}`,
      });

      return true;

    } catch (error) {
      // 10. Log error
      logger.error('Investment', 'Investment failed', error, { dealId });

      // 11. Notify user
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Investment Failed',
        message: error instanceof Error ? error.message.replace(/^\[.*?\]\s*/, '') : 'Unable to complete investment',
      });

      // 12. Graceful exit
      return false;
    }
  };

  // ✅ FULL TRY-CATCH: handlePassDeal
  const handlePassDeal = async (dealId: string) => {
    try {
      // 1. Validate input
      if (!dealId) {
        throw new Error('[VAL-001] Deal ID is required');
      }

      // 2. Validate array not empty (KEEP existing validation!)
      const arrayGuard = guardArrayAccess(dealFlow, 0, 'Deal Flow');
      if (!arrayGuard.isValid) {
        throw new Error('[STATE-005] ' + getFirstErrorMessage(arrayGuard));
      }
      
      // 3. Find deal
      const deal = dealFlow.find(d => d.id === dealId);
      if (!deal) {
        throw new Error('[OP-003] Deal not found');
      }

      // 4. Log operation
      logger.info('Investment', 'Deal passed', { dealId, targetName: deal.targetName });
      
      // 5. Remove deal
      setDealFlow((prev) => prev.filter(d => d.id !== dealId));

      // 6. Notify user
      useGameStore.getState().addNotification({
        type: 'info',
        title: 'Deal Passed',
        message: `Passed on ${deal.targetName}`,
      });

      return true;

    } catch (error) {
      // 7. Log error
      logger.error('Investment', 'Pass deal failed', error, { dealId });

      // 8. Graceful exit (silent fail for pass)
      return false;
    }
  };

  // ✅ FULL TRY-CATCH: handleExit
  const handleExit = async (investmentId: string) => {
    try {
      // 1. Validate input
      if (!investmentId) {
        throw new Error('[VAL-001] Investment ID is required');
      }

      // 2. Validate array not empty (KEEP existing validation!)
      const arrayGuard = guardArrayAccess(portfolio, 0, 'Portfolio');
      if (!arrayGuard.isValid) {
        throw new Error('[STATE-005] ' + getFirstErrorMessage(arrayGuard));
      }
      
      // 3. Find investment
      const inv = portfolio.find(i => i.id === investmentId);
      if (!inv) {
        throw new Error('[OP-003] Investment not found');
      }
      
      // 4. Check if active
      if (inv.status !== 'active') {
        throw new Error('[STATE-002] Investment is not active');
      }
      
      // 5. Log operation start
      const op = logger.operation('Investment', 'Exit');
      
      // 6. Calculate exit
      const exitValuation = generateExitValuation(inv);
      const proceeds = Math.round((exitValuation * inv.equityStake) / 100);
      const profit = proceeds - inv.amount;
      
      // 7. Process exit
      useGameStore.getState().updateBalance(proceeds);
      
      if (profit > 0) {
        const performanceFee = calculatePerformanceFee(profit);
        useGameStore.getState().updateBalance(-performanceFee);
        
        useGameStore.getState().addTransaction({
          type: 'expense',
          amount: performanceFee,
          category: 'performance-fee',
          description: `Performance fee (20% of profit)`,
        });
      }
      
      useGameStore.getState().addTransaction({
        type: 'income',
        amount: proceeds,
        category: 'exit',
        description: `Exited ${inv.targetName} - ${inv.returnMultiple.toFixed(2)}x return`,
      });
      
      setPortfolio((prev) =>
        prev.map((i) =>
          i.id === investmentId ? { ...i, status: 'exited', currentValuation: exitValuation } : i
        )
      );

      // 8. Log success
      op.success('Exit completed', {
        investmentId,
        targetName: inv.targetName,
        exitValuation,
        proceeds,
        profit,
        returnMultiple: inv.returnMultiple,
      });

      // 9. Notify user
      useGameStore.getState().addNotification({
        type: 'success',
        title: 'Exit Completed',
        message: `Exited ${inv.targetName} for ${formatCurrency(proceeds)} (${inv.returnMultiple.toFixed(1)}x)`,
      });

      return true;

    } catch (error) {
      // 10. Log error
      logger.error('Investment', 'Exit failed', error, { investmentId });

      // 11. Notify user
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Exit Failed',
        message: error instanceof Error ? error.message.replace(/^\[.*?\]\s*/, '') : 'Unable to exit investment',
      });

      // 12. Graceful exit
      return false;
    }
  };

  // ✅ FULL TRY-CATCH: handleValuationUpdate (with guardDivisionByZero!)
  const handleValuationUpdate = useCallback(() => {
    try {
      if (company?.isPaused) return;
      
      // ✅ KEEP existing validation
      const arrayGuard = guardArrayAccess(portfolio, 0, 'Portfolio');
      if (!arrayGuard.isValid) {
        return; // No portfolio, skip silently
      }
      
      const op = logger.operation('Investment', 'UpdateValuations');
      let updatedCount = 0;
      
      const updatedPortfolio = portfolio.map((inv) => {
        if (inv.status !== 'active') return inv;
        
        if (shouldStartupFail(inv, company?.difficulty)) {
          useGameStore.getState().addNotification({
            type: 'error',
            title: 'Startup Failed',
            message: `${inv.targetName} has failed - investment lost`,
          });
          
          return {
            ...inv,
            status: 'failed' as const,
            currentValuation: 0,
            returnMultiple: 0,
          };
        }
        
        const marketCondition: -1 | 0 | 1 = Math.random() > 0.5 ? 1 : Math.random() > 0.3 ? 0 : -1;
        const newValuation = simulateValuationChange(inv, marketCondition, company?.difficulty);
        
        // ✅ KEEP existing guardDivisionByZero validation!
        const divisionGuard = guardDivisionByZero(inv.amount, 'Return multiple calculation');
        const returnMultiple = divisionGuard.isValid 
          ? newValuation / inv.amount 
          : 0;
        
        updatedCount++;
        
        return {
          ...inv,
          currentValuation: newValuation,
          returnMultiple,
        };
      });
      
      setPortfolio(updatedPortfolio);
      
      if (updatedCount > 0) {
        op.success('Valuations updated', { count: updatedCount });
      }
      
    } catch (error) {
      logger.error('Investment', 'Valuation update failed', error);
      // ✅ Graceful fallback: skip this update cycle
    }
  }, [company?.isPaused, company?.difficulty, portfolio]);

  // ✅ FULL TRY-CATCH: handleManagementFee
  const handleManagementFee = useCallback(() => {
    try {
      if (company?.isPaused) return;
      
      // ✅ KEEP existing validation
      const arrayGuard = guardArrayAccess(portfolio, 0, 'Portfolio');
      if (!arrayGuard.isValid) {
        return; // No portfolio, skip silently
      }
      
      const op = logger.operation('Investment', 'ChargeManagementFee');
      
      const aum = portfolio
        .filter(inv => inv.status === 'active')
        .reduce((sum, inv) => sum + inv.currentValuation, 0);
      
      if (aum === 0) return;
      
      const fee = calculateManagementFee(aum);
      
      // Check if have balance for fee (ADDED: balance validation!)
      if (company) {
        const balanceGuard = guardBalanceFloor(company.balance, fee);
        if (!balanceGuard.isValid) {
          logger.warn('Investment', 'Insufficient balance for management fee', { fee, balance: company.balance });
          return; // Skip this fee collection
        }
      }
      
      useGameStore.getState().updateBalance(-fee);
      
      useGameStore.getState().addTransaction({
        type: 'expense',
        amount: fee,
        category: 'management-fee',
        description: `Quarterly management fee (2% annual)`,
      });
      
      op.success('Management fee charged', {
        aum,
        fee,
        portfolioCount: portfolio.filter(inv => inv.status === 'active').length,
      });
      
    } catch (error) {
      logger.error('Investment', 'Management fee charging failed', error);
      // ✅ Graceful fallback: skip this fee cycle
    }
  }, [company?.isPaused, company, portfolio]);

  useEffect(() => {
    if (!company || company.isPaused || !gameSpeed) return;
    
    const tickInterval = 1000 / gameSpeed;
    
    const gameTicker = setInterval(() => {
      const gameSecondsElapsed = convertRealToGameTime(1, 'investment') * 60;
      updateGameTime(gameSecondsElapsed);
    }, tickInterval);
    
    return () => clearInterval(gameTicker);
  }, [company, gameSpeed, updateGameTime]);

  useEffect(() => {
    if (!gameSpeed || !company) return;
    
    const baseInterval = calculateRealInterval(30, 'investment', gameSpeed);
    const adjustedInterval = company.difficulty 
      ? getDifficultyAdjustedInterval(baseInterval, company.difficulty)
      : baseInterval;
    
    const dealInterval = setInterval(handleDealGeneration, adjustedInterval);
    return () => clearInterval(dealInterval);
  }, [handleDealGeneration, gameSpeed, company?.difficulty]);

  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(90, 'investment', gameSpeed);
    const valuationInterval = setInterval(handleValuationUpdate, interval);
    return () => clearInterval(valuationInterval);
  }, [handleValuationUpdate, gameSpeed]);

  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(90, 'investment', gameSpeed);
    const feeInterval = setInterval(handleManagementFee, interval);
    return () => clearInterval(feeInterval);
  }, [handleManagementFee, gameSpeed]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🚀</div>
          <div className="text-xl text-gray-600 font-semibold">Loading game...</div>
        </div>
      </div>
    );
  }

  if (!player || !company || !investment) {
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
        <TimeDisplay businessType="investment" />
        <VentureStats />
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💡 Deal Flow ({dealFlow.length})
          </h2>
          
          {dealFlow.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-600 font-semibold">No deal opportunities</p>
              <p className="text-sm text-gray-500 mt-2">
                New deals will appear here automatically
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dealFlow.map((deal) => (
                <DealFlowCard
                  key={deal.id}
                  deal={deal}
                  onInvest={handleInvest}
                  onPass={handlePassDeal}
                />
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📊 Portfolio ({portfolio.filter(i => i.status === 'active').length} active)
          </h2>
          
          {portfolio.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">💼</div>
              <p className="text-gray-600 font-semibold">No investments yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Start investing in startups to build your portfolio
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map((inv) => (
                <PortfolioCard
                  key={inv.id}
                  investment={inv}
                  onExit={inv.status === 'active' ? handleExit : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
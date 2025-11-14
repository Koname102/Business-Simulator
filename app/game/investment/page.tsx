// ============================================
// FILE: app/game/investment/page.tsx
// PURPOSE: Investment management game dashboard
// RELATIONS: Main investment gameplay page
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
  shouldGenerateExitOpportunity,
  generateExitValuation,
} from '@/lib/game-logic/investment';
import type { Investment } from '@/lib/types';
import { calculateRealInterval, convertRealToGameTime } from '@/lib/time-system';
import { getDifficultyAdjustedInterval } from '@/lib/difficulty-config';
import AutoSaveManager from '@/components/game/saves/AutoSaveManager';

import Header from '@/components/game/shared/Header';
import InvestmentStats from '@/components/game/investment/InvestmentStats';
import DealFlowCard from '@/components/game/investment/DealFlowCard';
import PortfolioCard from '@/components/game/investment/PortfolioCard';
import TimeDisplay from '@/components/game/shared/TimeDisplay';

interface DealOpportunity {
  id: string;
  targetName: string;
  sector: string;
  valuation: number;
  equityOffered: number;
  investmentNeeded: number;
  pitchSummary: string;
}

export default function InvestmentGamePage() {
  const router = useRouter();
  
  const player = useGameStore((state) => state.player);
  const company = useGameStore((state) => state.company);
  const investment = useGameStore((state) => state.investment);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const updateGameTime = useGameStore((state) => state.updateGameTime);
  
  const [dealFlow, setDealFlow] = useState<DealOpportunity[]>([]);
  const [portfolio, setPortfolio] = useState<Investment[]>([]);
  const [marketCondition, setMarketCondition] = useState<-1 | 0 | 1>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ FIXED: Same pattern as fintech
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
        console.log('Game not initialized, redirecting to onboarding');
        router.push('/onboarding/character');
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  function generateDealWithId(): DealOpportunity {
    const deal = generateDealFlow();
    const pitchSummaries = [
      'Revolutionary AI platform disrupting the industry with cutting-edge technology.',
      'Fast-growing marketplace connecting buyers and sellers with innovative features.',
      'Sustainable solution addressing major market pain points with proven traction.',
      'Next-generation platform leveraging latest technology for unprecedented growth.',
      'Market leader in emerging sector with strong unit economics and scalability.',
    ];
    
    return {
      id: crypto.randomUUID(),
      targetName: deal.startup.targetName,
      sector: deal.startup.sector,
      valuation: deal.valuation,
      equityOffered: deal.equityOffered,
      investmentNeeded: deal.investmentNeeded,
      pitchSummary: pitchSummaries[Math.floor(Math.random() * pitchSummaries.length)],
    };
  }

  const handleDealGeneration = useCallback(() => {
    if (company?.isPaused) return;
    
    const newDeal = generateDealWithId();
    setDealFlow((prev) => [...prev, newDeal]);
    
    useGameStore.getState().addNotification({
      type: 'info',
      title: 'New Deal Opportunity',
      message: `${newDeal.targetName} is raising funds in ${newDeal.sector}`,
    });
  }, [company?.isPaused]);

  const handleValuationUpdates = useCallback(() => {
    if (company?.isPaused) return;
    
    setPortfolio((prevPortfolio) => {
      const updatedPortfolio = prevPortfolio.map((inv) => {
        if (inv.status !== 'active') return inv;
        
        // Check failure with difficulty
        if (shouldStartupFail(inv, company?.difficulty)) {
          useGameStore.getState().addNotification({
            type: 'error',
            title: 'Startup Failed',
            message: `${inv.targetName} shut down. Loss: ${formatCurrency(inv.amount)}`,
          });
          
          return { ...inv, status: 'failed' as const, currentValuation: 0, returnMultiple: 0 };
        }
        
        if (shouldGenerateExitOpportunity(inv)) {
          const exitVal = generateExitValuation(inv);
          const profit = exitVal - inv.amount;
          const performanceFee = calculatePerformanceFee(profit);
          
          useGameStore.getState().updateBalance(exitVal);
          useGameStore.getState().addTransaction({
            type: 'income',
            amount: exitVal,
            category: 'investment-exit',
            description: `Exit from ${inv.targetName}`,
          });
          useGameStore.getState().addNotification({
            type: 'success',
            title: 'Exit Opportunity!',
            message: `${inv.targetName} exited at ${(exitVal / inv.amount).toFixed(1)}x! Performance fee: ${formatCurrency(performanceFee)}`,
          });
          
          useGameStore.getState().updateBalance(performanceFee);
          
          return { 
            ...inv, 
            status: 'exited' as const, 
            currentValuation: exitVal,
            returnMultiple: exitVal / inv.amount,
          };
        }
        
        // Simulate valuation change with difficulty
        const newValuation = simulateValuationChange(inv, marketCondition, company?.difficulty);
        const newReturnMultiple = newValuation / inv.amount;
        
        return { 
          ...inv, 
          currentValuation: newValuation,
          returnMultiple: newReturnMultiple,
        };
      });
      
      return updatedPortfolio;
    });
  }, [company?.isPaused, company?.difficulty, marketCondition]);

  const handleManagementFeeCollection = useCallback(() => {
    if (company?.isPaused) return;
    
    const currentInvestment = useGameStore.getState().investment;
    if (!currentInvestment) return;
    
    const fee = calculateManagementFee(currentInvestment.aum);
    
    if (fee > 0) {
      useGameStore.getState().updateBalance(fee);
      useGameStore.getState().addTransaction({
        type: 'income',
        amount: fee,
        category: 'management-fee',
        description: 'Quarterly management fee (2% of AUM)',
      });
    }
  }, [company?.isPaused]);

  // ✅ NEW: Load portfolio from store on mount
  useEffect(() => {
    if (!investment || isInitialized) return;
    
    // Load portfolio from investment state
    if (investment.portfolio && investment.portfolio.length > 0) {
      setPortfolio(investment.portfolio);
      console.log(`✅ Loaded ${investment.portfolio.length} investments from store`);
    }
    
    // Load current deals (if saved)
    if (investment.currentDeals && investment.currentDeals.length > 0) {
      setDealFlow(investment.currentDeals);
      console.log(`✅ Loaded ${investment.currentDeals.length} deals from store`);
    }
    
    setIsInitialized(true);
  }, [investment, isInitialized]);

  // ✅ NEW: Sync portfolio to store whenever it changes
  useEffect(() => {
    if (!investment || !isInitialized) return;
    
    useGameStore.setState({
      investment: {
        ...investment,
        portfolio: portfolio,
        activeInvestments: portfolio.filter(p => p.status === 'active').length,
      },
    });
    
    console.log(`✅ Synced ${portfolio.length} investments to store`);
  }, [portfolio, isInitialized]);

  // ✅ NEW: Sync deal flow to store
  useEffect(() => {
    if (!investment || !isInitialized) return;
    
    useGameStore.setState({
      investment: {
        ...investment,
        currentDeals: dealFlow,
      },
    });
    
    console.log(`✅ Synced ${dealFlow.length} deals to store`);
  }, [dealFlow, isInitialized]);

  // Game time ticker
  useEffect(() => {
    if (!company || company.isPaused || !gameSpeed) return;
    
    const tickInterval = 1000 / gameSpeed;
    
    const gameTicker = setInterval(() => {
      const gameSecondsElapsed = convertRealToGameTime(1, 'investment') * 60;
      updateGameTime(gameSecondsElapsed);
    }, tickInterval);
    
    return () => clearInterval(gameTicker);
  }, [company, gameSpeed, updateGameTime]);

  // Deal flow interval with difficulty
  useEffect(() => {
    if (!gameSpeed || !company) return;
    
    const baseInterval = calculateRealInterval(15, 'investment', gameSpeed);
    const adjustedInterval = company.difficulty 
      ? getDifficultyAdjustedInterval(baseInterval, company.difficulty)
      : baseInterval;
    
    const dealFlowInterval = setInterval(handleDealGeneration, adjustedInterval);
    return () => clearInterval(dealFlowInterval);
  }, [handleDealGeneration, gameSpeed, company?.difficulty]);

  // Valuation update interval
  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(20, 'investment', gameSpeed);
    const valuationInterval = setInterval(handleValuationUpdates, interval);
    return () => clearInterval(valuationInterval);
  }, [handleValuationUpdates, gameSpeed]);

  // Management fee interval
  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(30, 'investment', gameSpeed);
    const managementFeeInterval = setInterval(handleManagementFeeCollection, interval);
    return () => clearInterval(managementFeeInterval);
  }, [handleManagementFeeCollection, gameSpeed]);

  // Market condition changes
  useEffect(() => {
    const marketInterval = setInterval(() => {
      const conditions: Array<-1 | 0 | 1> = [-1, 0, 1];
      const newCondition = conditions[Math.floor(Math.random() * conditions.length)];
      setMarketCondition(newCondition);
      
      const labels = { '-1': 'Bear 📉', '0': 'Neutral ➡️', '1': 'Bull 📈' };
      useGameStore.getState().addNotification({
        type: 'info',
        title: 'Market Condition',
        message: `Market is now ${labels[newCondition]}`,
      });
    }, 60000);
    
    return () => clearInterval(marketInterval);
  }, []);

  const handleInvest = (dealId: string) => {
    const deal = dealFlow.find((d) => d.id === dealId);
    if (!deal) return;
    
    if (company && company.balance < deal.investmentNeeded) {
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Insufficient Balance',
        message: 'Not enough balance to make this investment',
      });
      return;
    }
    
    useGameStore.getState().updateBalance(-deal.investmentNeeded);
    useGameStore.getState().addTransaction({
      type: 'expense',
      amount: deal.investmentNeeded,
      category: 'investment',
      description: `Invested in ${deal.targetName}`,
    });
    useGameStore.getState().addNotification({
      type: 'success',
      title: 'Investment Made',
      message: `Invested ${formatCurrency(deal.investmentNeeded)} in ${deal.targetName}`,
    });
    
    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      targetName: deal.targetName,
      amount: deal.investmentNeeded,
      equityStake: deal.equityOffered,
      status: 'active',
      investedAt: Date.now(),
      currentValuation: deal.investmentNeeded,
      returnMultiple: 1,
      sector: deal.sector,
    };
    
    setPortfolio((prev) => [...prev, newInvestment]);
    
    const currentInvestment = useGameStore.getState().investment;
    if (currentInvestment) {
      useGameStore.setState({
        investment: {
          ...currentInvestment,
          portfolio: [...currentInvestment.portfolio, newInvestment],
          aum: currentInvestment.aum + deal.investmentNeeded,
          activeInvestments: currentInvestment.activeInvestments + 1,
        },
      });
    }
    
    setDealFlow((prev) => prev.filter((d) => d.id !== dealId));
  };

  const handlePass = (dealId: string) => {
    const deal = dealFlow.find((d) => d.id === dealId);
    if (!deal) return;
    
    setDealFlow((prev) => prev.filter((d) => d.id !== dealId));
    useGameStore.getState().addNotification({
      type: 'info',
      title: 'Deal Passed',
      message: `Passed on ${deal.targetName}`,
    });
  };

  const handleManualExit = (investmentId: string) => {
    const inv = portfolio.find((i) => i.id === investmentId);
    if (!inv || inv.status !== 'active') return;
    
    const exitValuation = inv.currentValuation;
    const profit = exitValuation - inv.amount;
    
    if (profit <= 0) {
      useGameStore.getState().addNotification({
        type: 'warning',
        title: 'Cannot Exit',
        message: 'Cannot exit at a loss. Wait for valuation to recover.',
      });
      return;
    }
    
    const performanceFee = calculatePerformanceFee(profit);
    
    useGameStore.getState().updateBalance(exitValuation);
    useGameStore.getState().addTransaction({
      type: 'income',
      amount: exitValuation,
      category: 'investment-exit',
      description: `Manual exit from ${inv.targetName}`,
    });
    useGameStore.getState().updateBalance(performanceFee);
    useGameStore.getState().addNotification({
      type: 'success',
      title: 'Investment Exited',
      message: `Exited ${inv.targetName} at ${inv.returnMultiple.toFixed(1)}x. Performance fee: ${formatCurrency(performanceFee)}`,
    });
    
    setPortfolio((prev) =>
      prev.map((p) =>
        p.id === investmentId ? { ...p, status: 'exited' as const } : p
      )
    );
    
    const currentInvestment = useGameStore.getState().investment;
    if (currentInvestment) {
      useGameStore.setState({
        investment: {
          ...currentInvestment,
          portfolio: currentInvestment.portfolio.map((p) =>
            p.id === investmentId ? { ...p, status: 'exited' as const } : p
          ),
          activeInvestments: Math.max(0, currentInvestment.activeInvestments - 1),
        },
      });
    }
  };

  const formatCurrency = (amount: number) => {
    const billions = amount / 1_000_000_000;
    return `Rp ${billions.toFixed(2)}B`;
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
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <TimeDisplay businessType="investment" />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Investment Portfolio</h1>
            <p className="text-gray-600">Manage your venture capital investments</p>
          </div>
          
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            marketCondition === 1 
              ? 'bg-green-100 text-green-700'
              : marketCondition === -1
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            Market: {marketCondition === 1 ? 'Bull 📈' : marketCondition === -1 ? 'Bear 📉' : 'Neutral ➡️'}
          </div>
        </div>
        
        <InvestmentStats />
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💼 Deal Flow ({dealFlow.length})
          </h2>
          
          {dealFlow.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No deals available</p>
              <p className="text-sm text-gray-500 mt-2">New startup pitches will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dealFlow.map((deal) => (
                <DealFlowCard
                  key={deal.id}
                  deal={deal}
                  onInvest={handleInvest}
                  onPass={handlePass}
                />
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📊 Portfolio ({portfolio.filter(p => p.status === 'active').length} Active)
          </h2>
          
          {portfolio.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No investments yet</p>
              <p className="text-sm text-gray-500 mt-2">Invest in startups to build your portfolio</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map((inv) => (
                <PortfolioCard 
                  key={inv.id} 
                  investment={inv}
                  onExit={handleManualExit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
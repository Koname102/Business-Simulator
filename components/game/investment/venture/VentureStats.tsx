// ============================================
// FILE: components/game/investment/VentureStats.tsx
// PURPOSE: Investment-specific stats display
// RELATIONS: Uses gameStore investment state
// ============================================

'use client';

import { useGameStore } from '@/store/gameStore';
import { calculatePortfolioIRR } from '@/lib/game-logic/venture';

export default function VentureStats() {
  const company = useGameStore((state) => state.company);
  const investment = useGameStore((state) => state.investment);
  
  if (!investment || !company) return null;
  
  const formatCurrency = (amount: number) => {
    const billions = amount / 1_000_000_000;
    return `Rp ${billions.toFixed(2)}B`;
  };
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };
  
  const portfolioIRR = calculatePortfolioIRR(investment.portfolio);
  
  const totalInvested = investment.portfolio.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investment.portfolio.reduce((sum, inv) => {
    if (inv.status === 'failed') return sum;
    return sum + inv.currentValuation;
  }, 0);
  const unrealizedGains = totalCurrentValue - totalInvested;
  
  const exitedInvestments = investment.portfolio.filter(inv => inv.status === 'exited');
  const realizedGains = exitedInvestments.reduce((sum, inv) => 
    sum + (inv.currentValuation - inv.amount), 0
  );
  
  const stats = [
    {
      id: 'aum',
      label: 'AUM',
      value: formatCurrency(investment.aum),
      subValue: `Total managed`,
      icon: '💼',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: null,
    },
    {
      id: 'portfolio',
      label: 'Active Investments',
      value: formatNumber(investment.activeInvestments),
      subValue: `In portfolio`,
      icon: '📊',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: null,
    },
    {
      id: 'returns',
      label: 'Portfolio IRR',
      value: `${portfolioIRR >= 0 ? '+' : ''}${portfolioIRR.toFixed(2)}%`,
      subValue: `Target: >25%`,
      icon: portfolioIRR >= 25 ? '🚀' : portfolioIRR >= 0 ? '📈' : '📉',
      bgColor: portfolioIRR >= 25 ? 'bg-green-50' : portfolioIRR >= 0 ? 'bg-yellow-50' : 'bg-red-50',
      iconColor: portfolioIRR >= 25 ? 'text-green-600' : portfolioIRR >= 0 ? 'text-yellow-600' : 'text-red-600',
      trend: portfolioIRR >= 25 ? 'up' : portfolioIRR >= 0 ? null : 'down',
    },
    {
      id: 'realized',
      label: 'Realized Gains',
      value: formatCurrency(realizedGains),
      subValue: `From ${exitedInvestments.length} exits`,
      icon: '💰',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: realizedGains > 0 ? 'up' : null,
    },
  ];
  
  const healthScore = calculateHealthScore(portfolioIRR, investment);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                {stat.label}
              </span>
              <div className={`${stat.bgColor} ${stat.iconColor} p-2 rounded-lg`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
            
            <div className="mb-1">
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {stat.subValue}
              </p>
              {stat.trend && (
                <span className={`text-xs font-semibold ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? '↗' : '↘'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Fund Performance
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            healthScore >= 80 
              ? 'bg-green-100 text-green-700'
              : healthScore >= 60
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Warning'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Total Invested</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(totalInvested)}
            </p>
          </div>
          
          <div>
            <p className="text-gray-600 mb-1">Current Value</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(totalCurrentValue)}
            </p>
          </div>
          
          <div>
            <p className="text-gray-600 mb-1">Unrealized Gains</p>
            <p className={`text-lg font-bold ${unrealizedGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {unrealizedGains >= 0 ? '+' : ''}{formatCurrency(unrealizedGains)}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Health Score</span>
            <span>{healthScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                healthScore >= 80 
                  ? 'bg-green-500'
                  : healthScore >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateHealthScore(portfolioIRR: number, investment: any): number {
  let score = 100;
  
  if (portfolioIRR < 0) score -= 40;
  else if (portfolioIRR < 10) score -= 30;
  else if (portfolioIRR < 20) score -= 15;
  
  if (investment.activeInvestments === 0) score -= 20;
  else if (investment.activeInvestments < 3) score -= 10;
  
  const failedInvestments = investment.portfolio.filter((inv: any) => inv.status === 'failed');
  const failureRate = investment.portfolio.length > 0 
    ? (failedInvestments.length / investment.portfolio.length) * 100 
    : 0;
  
  if (failureRate > 70) score -= 30;
  else if (failureRate > 50) score -= 15;
  
  const exitedInvestments = investment.portfolio.filter((inv: any) => inv.status === 'exited');
  if (exitedInvestments.length === 0 && investment.portfolio.length > 5) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

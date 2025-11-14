// ============================================
// FILE: components/game/fintech/FintechStats.tsx
// PURPOSE: Fintech-specific stats cards
// RELATIONS: Uses gameStore fintech state
// ============================================

'use client';

import { useGameStore } from '@/store/gameStore';
import { calculateDefaultRate } from '@/lib/game-logic/fintech';

export default function FintechStats() {
  const company = useGameStore((state) => state.company);
  const fintech = useGameStore((state) => state.fintech);
  
  if (!fintech || !company) return null;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };
  
  const defaultRate = calculateDefaultRate(fintech.loans);
  
  const profit = fintech.totalRepaid - fintech.totalDisbursed;
  const profitPercentage = fintech.totalDisbursed > 0 
    ? ((profit / fintech.totalDisbursed) * 100).toFixed(2)
    : 0;
  
  const stats = [
    {
      id: 'disbursed',
      label: 'Total Disbursed',
      value: formatCurrency(fintech.totalDisbursed),
      subValue: `All-time loans`,
      icon: '💸',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: null,
    },
    {
      id: 'repaid',
      label: 'Total Repaid',
      value: formatCurrency(fintech.totalRepaid),
      subValue: `${formatNumber(fintech.totalRepaid > 0 ? Math.round((fintech.totalRepaid / (fintech.totalDisbursed || 1)) * 100) : 0)}% collected`,
      icon: '💰',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: profit > 0 ? 'up' : profit < 0 ? 'down' : null,
    },
    {
      id: 'active',
      label: 'Active Loans',
      value: formatNumber(fintech.activeLoans),
      subValue: `Currently active`,
      icon: '📊',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: null,
    },
    {
      id: 'default',
      label: 'Default Rate',
      value: `${defaultRate.toFixed(2)}%`,
      subValue: `Target: <5%`,
      icon: defaultRate < 5 ? '✅' : '⚠️',
      bgColor: defaultRate < 5 ? 'bg-green-50' : 'bg-red-50',
      iconColor: defaultRate < 5 ? 'text-green-600' : 'text-red-600',
      trend: defaultRate < 5 ? 'up' : 'down',
    },
  ];
  
  const healthScore = calculateHealthScore(defaultRate, fintech);
  
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
            Business Health
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
            <p className="text-gray-600 mb-1">Profit Margin</p>
            <p className="text-lg font-bold text-gray-900">
              {profitPercentage}%
            </p>
          </div>
          
          <div>
            <p className="text-gray-600 mb-1">Net Profit</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(profit)}
            </p>
          </div>
          
          <div>
            <p className="text-gray-600 mb-1">Balance</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(company.balance)}
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

function calculateHealthScore(defaultRate: number, fintech: any): number {
  let score = 100;
  
  if (defaultRate > 10) score -= 40;
  else if (defaultRate > 5) score -= 20;
  
  if (fintech.activeLoans === 0) score -= 10;
  
  const collectionRate = fintech.totalDisbursed > 0 
    ? (fintech.totalRepaid / fintech.totalDisbursed) * 100 
    : 0;
  
  if (collectionRate < 50) score -= 20;
  else if (collectionRate < 70) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}
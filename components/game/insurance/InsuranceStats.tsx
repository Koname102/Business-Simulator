// ============================================
// FILE: components/game/insurance/InsuranceStats.tsx
// PURPOSE: Insurance-specific stats display
// RELATIONS: Uses gameStore insurance state
// ============================================

'use client';

import { useGameStore } from '@/store/gameStore';
import { calculateClaimRatio } from '@/lib/game-logic/life-insurance';

export default function InsuranceStats() {
  const company = useGameStore((state) => state.company);
  const insurance = useGameStore((state) => state.insurance);
  
  if (!insurance || !company) return null;
  
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
  
  const claimRatio = calculateClaimRatio(
    insurance.totalPremiumCollected, 
    insurance.totalClaimsPaid
  );
  
  const netProfit = insurance.totalPremiumCollected - insurance.totalClaimsPaid;
  const profitMargin = insurance.totalPremiumCollected > 0
    ? ((netProfit / insurance.totalPremiumCollected) * 100).toFixed(2)
    : 0;
  
  const stats = [
    {
      id: 'premium',
      label: 'Premium Collected',
      value: formatCurrency(insurance.totalPremiumCollected),
      subValue: `All-time collection`,
      icon: '💰',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: null,
    },
    {
      id: 'claims',
      label: 'Claims Paid',
      value: formatCurrency(insurance.totalClaimsPaid),
      subValue: `${formatNumber(Math.round(claimRatio))}% of premium`,
      icon: '💸',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: claimRatio < 70 ? 'up' : 'down',
    },
    {
      id: 'policies',
      label: 'Active Policies',
      value: formatNumber(insurance.activePolicies),
      subValue: `Currently active`,
      icon: '📋',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: null,
    },
    {
      id: 'ratio',
      label: 'Claim Ratio',
      value: `${claimRatio.toFixed(2)}%`,
      subValue: `Target: <70%`,
      icon: claimRatio < 70 ? '✅' : '⚠️',
      bgColor: claimRatio < 70 ? 'bg-green-50' : 'bg-red-50',
      iconColor: claimRatio < 70 ? 'text-green-600' : 'text-red-600',
      trend: claimRatio < 70 ? 'up' : 'down',
    },
  ];
  
  const healthScore = calculateHealthScore(claimRatio, insurance, company);
  
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
              {profitMargin}%
            </p>
          </div>
          
          <div>
            <p className="text-gray-600 mb-1">Net Profit</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(netProfit)}
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

function calculateHealthScore(
  claimRatio: number, 
  insurance: any,
  company: any
): number {
  let score = 100;
  
  if (claimRatio > 85) score -= 40;
  else if (claimRatio > 70) score -= 20;
  
  if (insurance.activePolicies === 0) score -= 15;
  else if (insurance.activePolicies < 10) score -= 5;
  
  const profitMargin = insurance.totalPremiumCollected > 0
    ? ((insurance.totalPremiumCollected - insurance.totalClaimsPaid) / insurance.totalPremiumCollected) * 100
    : 0;
  
  if (profitMargin < 10) score -= 20;
  else if (profitMargin < 20) score -= 10;
  
  if (company.reputation < 50) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}
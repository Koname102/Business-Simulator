// ============================================
// FILE: components/game/StatsCards.tsx
// PURPOSE: Display fintech metrics cards
// RELATIONS: Used by game page
// ============================================

'use client';

import { useGameStore } from '@/store/gameStore';
import { calculateDefaultRate } from '@/lib/game-logic/fintech';

export default function StatsCards() {
  const fintech = useGameStore((state) => state.fintech);
  
  if (!fintech) return null;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const defaultRate = calculateDefaultRate(fintech.loans);
  
  const stats = [
    {
      label: 'Total Disbursed',
      value: formatCurrency(fintech.totalDisbursed),
      icon: '💸',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Repaid',
      value: formatCurrency(fintech.totalRepaid),
      icon: '💰',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Active Loans',
      value: fintech.activeLoans.toString(),
      icon: '📊',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Default Rate',
      value: `${defaultRate.toFixed(2)}%`,
      icon: '⚠️',
      color: defaultRate < 5 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {stat.label}
            </span>
            <span className={`text-2xl ${stat.color} p-2 rounded-lg`}>
              {stat.icon}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
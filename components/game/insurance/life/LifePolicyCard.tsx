// ============================================
// FILE: components/game/insurance/life/LifePolicyCard.tsx (FIXED)
// UPDATED: Show health status only, no age risk label
// ============================================

import type { LifeInsurancePolicy } from '@/lib/types';
import { getHealthStatusColor } from '@/lib/game-logic/life-insurance';

export default function LifePolicyCard({ policy }: { policy: LifeInsurancePolicy }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'premium_waiver': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-gray-100 text-gray-700';
      case 'claimed': return 'bg-red-100 text-red-700';
      case 'terminated': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{policy.holderName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600">Age: {policy.holderAge}</span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded font-semibold ${getStatusColor(policy.status)}`}>
          {policy.status.toUpperCase().replace('_', ' ')}
        </span>
      </div>
      
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Coverage:</span>
          <span className="font-bold text-blue-600">{formatCurrency(policy.coverageAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Premium/month:</span>
          <span className="font-semibold text-green-600">
            {formatCurrency(policy.premiumMonthly)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Health:</span>
          <span className={`font-semibold capitalize ${getHealthStatusColor(policy.healthStatus)}`}>
            {policy.healthStatus}
          </span>
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-600">
          <strong>Beneficiary:</strong>
          <div className="mt-1 text-gray-800">{policy.beneficiaryName}</div>
        </div>
      </div>
    </div>
  );
}
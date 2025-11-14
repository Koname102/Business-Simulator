// ============================================
// FILE: components/game/investment/DealFlowCard.tsx
// PURPOSE: Startup pitch card (invest/pass)
// RELATIONS: Used by investment game page
// ============================================

'use client';

import { getSectorIcon } from '@/lib/game-logic/investment';

interface DealFlowCardProps {
  deal: {
    id: string;
    targetName: string;
    sector: string;
    valuation: number;
    equityOffered: number;
    investmentNeeded: number;
    pitchSummary: string;
  };
  onInvest: (dealId: string) => void;
  onPass: (dealId: string) => void;
}

export default function DealFlowCard({ deal, onInvest, onPass }: DealFlowCardProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short',
    }).format(amount);
  };
  
  const formatLargeCurrency = (amount: number) => {
    const billions = amount / 1_000_000_000;
    return `Rp ${billions.toFixed(1)}B`;
  };
  
  const getExpectedReturn = () => {
    const multiple = 3;
    return deal.investmentNeeded * multiple;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getSectorIcon(deal.sector)}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {deal.targetName}
            </h3>
            <p className="text-sm text-gray-600">{deal.sector}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-600">Valuation</p>
          <p className="text-lg font-bold text-blue-600">
            {formatLargeCurrency(deal.valuation)}
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2">Investment Opportunity</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex justify-between">
            <span>Equity Offered:</span>
            <span className="font-bold">{deal.equityOffered}%</span>
          </div>
          <div className="flex justify-between">
            <span>Investment Needed:</span>
            <span className="font-bold">{formatLargeCurrency(deal.investmentNeeded)}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Valuation:</span>
            <span className="font-bold">{formatLargeCurrency(deal.valuation)}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Expected Return (3x)</h4>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">If successful:</span>
          <span className="text-lg font-bold text-green-600">
            +{formatLargeCurrency(getExpectedReturn())}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Profit: {formatLargeCurrency(getExpectedReturn() - deal.investmentNeeded)}
        </p>
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Pitch Summary</h4>
        <p className="text-sm text-gray-600 line-clamp-3">
          {deal.pitchSummary}
        </p>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => onInvest(deal.id)}
          className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          💰 Invest {formatCurrency(deal.investmentNeeded)}
        </button>
        
        <button
          onClick={() => onPass(deal.id)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          👋 Pass
        </button>
      </div>
    </div>
  );
}
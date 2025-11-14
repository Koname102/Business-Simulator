// ============================================
// FILE: components/game/investment/PortfolioCard.tsx
// PURPOSE: Display single portfolio investment
// RELATIONS: Used by investment game page
// ============================================

'use client';

import type { Investment } from '@/lib/types';
import { getSectorIcon, getReturnMultipleLabel } from '@/lib/game-logic/investment';

interface PortfolioCardProps {
  investment: Investment;
  onExit?: (investmentId: string) => void;
}

export default function PortfolioCard({ investment, onExit }: PortfolioCardProps) {
  
  const formatCurrency = (amount: number) => {
    const billions = amount / 1_000_000_000;
    return `Rp ${billions.toFixed(2)}B`;
  };
  
  const profit = investment.currentValuation - investment.amount;
  const profitPercentage = ((profit / investment.amount) * 100).toFixed(1);
  
  const returnMultiple = investment.returnMultiple;
  const returnLabel = getReturnMultipleLabel(returnMultiple);
  
  const getStatusBadge = () => {
    if (investment.status === 'exited') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">✅ Exited</span>;
    }
    if (investment.status === 'failed') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">❌ Failed</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">🔄 Active</span>;
  };
  
  const getValueChangeColor = () => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getSectorIcon(investment.sector)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {investment.targetName}
            </h3>
            <p className="text-sm text-gray-600">{investment.sector}</p>
          </div>
        </div>
        
        {getStatusBadge()}
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Return Multiple</span>
          <span className={`text-lg font-bold ${returnLabel.color}`}>
            {returnMultiple.toFixed(2)}x - {returnLabel.label}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-gray-600">Initial Investment</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(investment.amount)}
          </p>
        </div>
        
        <div>
          <p className="text-gray-600">Equity Stake</p>
          <p className="font-semibold text-gray-900">
            {investment.equityStake.toFixed(1)}%
          </p>
        </div>
        
        <div>
          <p className="text-gray-600">Current Value</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(investment.currentValuation)}
          </p>
        </div>
        
        <div>
          <p className="text-gray-600">Profit/Loss</p>
          <p className={`font-semibold ${getValueChangeColor()}`}>
            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
          </p>
        </div>
      </div>
      
      <div className={`rounded-lg p-3 mb-4 ${
        profit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {profit >= 0 ? '📈 Gain' : '📉 Loss'}
          </span>
          <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {profitPercentage}%
          </span>
        </div>
      </div>
      
      {investment.status === 'active' && onExit && returnMultiple >= 2 && (
        <button
          onClick={() => onExit(investment.id)}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          💰 Exit Now ({returnMultiple.toFixed(1)}x)
        </button>
      )}
      
      {investment.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-700 font-semibold">
            💔 Startup shut down. Total loss: {formatCurrency(investment.amount)}
          </p>
        </div>
      )}
      
      {investment.status === 'exited' && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-700 font-semibold">
            🎉 Successfully exited with {returnMultiple.toFixed(1)}x return!
          </p>
        </div>
      )}
    </div>
  );
}
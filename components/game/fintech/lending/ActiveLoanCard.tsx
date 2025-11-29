// ============================================
// FILE: components/game/ActiveLoanCard.tsx
// PURPOSE: Display single active loan card
// RELATIONS: Used by game page
// ============================================

'use client';

import type { Loan } from '@/lib/types';
import { calculateMonthlyPayment, calculateTotalRepayment } from '@/lib/game-logic/lending';

interface ActiveLoanCardProps {
  loan: Loan;
}

export default function ActiveLoanCard({ loan }: ActiveLoanCardProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const totalRepayment = calculateTotalRepayment(loan);
  const remainingAmount = totalRepayment - loan.paidAmount;
  const progressPercentage = (loan.paidAmount / totalRepayment) * 100;
  
  const getStatusBadge = () => {
    if (loan.status === 'paid') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">✅ Paid</span>;
    }
    if (loan.status === 'defaulted') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">❌ Defaulted</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">🔄 Active</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {loan.borrowerName}
          </h3>
          <p className="text-sm text-gray-600">
            Loan #{loan.id.slice(0, 8)}
          </p>
        </div>
        
        {getStatusBadge()}
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Repayment Progress</span>
          <span className="font-semibold text-gray-900">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              loan.status === 'defaulted' 
                ? 'bg-red-500' 
                : loan.status === 'paid'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-600">Loan Amount</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(loan.amount)}
          </p>
        </div>
        
        <div>
          <p className="text-gray-600">Duration</p>
          <p className="font-semibold text-gray-900">
            {loan.duration} months
          </p>
        </div>
        
        <div>
          <p className="text-gray-600">Paid Amount</p>
          <p className="font-semibold text-green-600">
            {formatCurrency(loan.paidAmount)}
          </p>
        </div>
        
        <div>
          <p className="text-gray-600">Remaining</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(remainingAmount)}
          </p>
        </div>
      </div>
      
      {loan.status === 'defaulted' && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-700 font-semibold">
            ⚠️ This loan has defaulted. Loss: {formatCurrency(remainingAmount)}
          </p>
        </div>
      )}
      
      {loan.status === 'paid' && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-700 font-semibold">
            🎉 Loan fully repaid! Profit: {formatCurrency(totalRepayment - loan.amount)}
          </p>
        </div>
      )}
    </div>
  );
}
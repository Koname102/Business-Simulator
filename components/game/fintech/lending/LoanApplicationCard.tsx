// ============================================
// FILE: components/game/LoanApplicationCard.tsx
// PURPOSE: Single loan application card
// RELATIONS: Used by game page
// ============================================

'use client';

import type { Loan } from '@/lib/types';
import { 
  calculateMonthlyPayment, 
  calculateTotalRepayment,
  getCreditScoreLabel 
} from '@/lib/game-logic/fintech';

interface LoanApplicationCardProps {
  loan: Loan;
  onApprove: (loanId: string) => void;
  onReject: (loanId: string) => void;
}

export default function LoanApplicationCard({ 
  loan, 
  onApprove, 
  onReject 
}: LoanApplicationCardProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const monthlyPayment = calculateMonthlyPayment(loan);
  const totalRepayment = calculateTotalRepayment(loan);
  const profit = totalRepayment - loan.amount;
  const creditInfo = getCreditScoreLabel(loan.creditScore);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {loan.borrowerName}
          </h3>
          <p className="text-sm text-gray-600">
            Loan Application #{loan.id.slice(0, 8)}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">Credit Score</p>
          <p className={`text-lg font-bold ${creditInfo.color}`}>
            {loan.creditScore} - {creditInfo.label}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
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
          <p className="text-gray-600">Interest Rate</p>
          <p className="font-semibold text-gray-900">
            {loan.interestRate}% /year
          </p>
        </div>
        
        <div>
          <p className="text-gray-600">Monthly Payment</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(monthlyPayment)}
          </p>
        </div>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-green-700">Expected Profit:</span>
          <span className="font-bold text-green-700">
            {formatCurrency(profit)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-green-700">Total Repayment:</span>
          <span className="font-bold text-green-700">
            {formatCurrency(totalRepayment)}
          </span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => onApprove(loan.id)}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          ✅ Approve
        </button>
        
        <button
          onClick={() => onReject(loan.id)}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
}
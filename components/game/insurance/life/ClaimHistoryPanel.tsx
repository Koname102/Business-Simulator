// ============================================
// FILE: components/game/insurance/life/ClaimHistoryPanel.tsx
// ============================================

'use client';

import type { ClaimDecision } from '@/lib/types';

interface ClaimHistoryPanelProps {
  claimHistory: ClaimDecision[];
}

export default function ClaimHistoryPanel({ claimHistory }: ClaimHistoryPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getClaimTypeIcon = (type: string) => {
    const icons = {
      death: '💀',
      critical_illness: '🏥',
      disability: '♿',
    };
    return icons[type as keyof typeof icons] || '📋';
  };
  
  const getDecisionBadge = (decision: 'approved' | 'rejected') => {
    if (decision === 'approved') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
          ✅ APPROVED
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
        ❌ REJECTED
        </span>
    );
  };
  
  // Sort by date (newest first)
  const sortedHistory = [...claimHistory].sort((a, b) => b.decisionDate - a.decisionDate);
  
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        📜 Claim Decision History ({claimHistory.length})
      </h2>
      
      {sortedHistory.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-600 font-semibold">No claim decisions yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Approved and rejected claims will appear here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Policyholder
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Decision
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(record.decisionDate)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-semibold text-gray-900">
                        {record.policyHolderName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Age: {record.holderAge}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getClaimTypeIcon(record.claimType)}</span>
                        <span className="capitalize">
                          {record.claimType.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(record.claimAmount)}
                      </div>
                      {record.paidAmount && (
                        <div className="text-xs text-green-600">
                          Paid: {formatCurrency(record.paidAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getDecisionBadge(record.decision)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
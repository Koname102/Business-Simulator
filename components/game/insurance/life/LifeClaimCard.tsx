// ============================================
// FILE: components/game/insurance/life/LifeClaimCard.tsx
// PURPOSE: Life Insurance Claim Card (approve/reject)
// ============================================

'use client';

interface LifeClaimCardProps {
  claim: {
    id: string;
    policyId: string;
    holderName: string;
    holderAge: number;
    coverageAmount: number;
    claimAmount: number;
    claimType: 'death' | 'critical_illness' | 'disability';
    claimReason: string;
    submittedAt: number;
  };
  onApprove: (claimId: string) => void;
  onReject: (claimId: string) => void;
  isProcessing?: boolean;
}

export default function LifeClaimCard({ 
  claim, 
  onApprove, 
  onReject,
  isProcessing = false
}: LifeClaimCardProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const getClaimPercentage = () => {
    return ((claim.claimAmount / claim.coverageAmount) * 100).toFixed(1);
  };
  
  const getSeverityColor = () => {
    const percentage = (claim.claimAmount / claim.coverageAmount) * 100;
    if (percentage > 80) return 'text-red-600';
    if (percentage > 50) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  const getClaimTypeInfo = () => {
    const info = {
      death: {
        icon: '💀',
        label: 'Death Claim',
        color: 'bg-red-50 border-red-200 text-red-900',
        description: 'Policyholder has passed away',
      },
      critical_illness: {
        icon: '🏥',
        label: 'Critical Illness',
        color: 'bg-orange-50 border-orange-200 text-orange-900',
        description: 'Critical illness diagnosis',
      },
      disability: {
        icon: '♿',
        label: 'Disability Claim',
        color: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        description: 'Permanent disability',
      },
    };
    
    return info[claim.claimType];
  };
  
  const claimTypeInfo = getClaimTypeInfo();

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏥</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {claim.holderName}
            </h3>
            <p className="text-sm text-gray-600">
              Age: {claim.holderAge} • Life Insurance Claim
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-600">Claim Amount</p>
          <p className={`text-xl font-bold ${getSeverityColor()}`}>
            {formatCurrency(claim.claimAmount)}
          </p>
        </div>
      </div>
      
      {/* Claim Type Badge */}
      <div className={`${claimTypeInfo.color} border rounded-lg p-4 mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{claimTypeInfo.icon}</span>
          <h4 className="font-bold text-lg">{claimTypeInfo.label}</h4>
        </div>
        <p className="text-sm font-medium mb-1">
          {claimTypeInfo.description}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Reason:</span> {claim.claimReason}
        </p>
        <p className="text-sm mt-2">
          <span className="font-semibold">Claim Percentage:</span> {getClaimPercentage()}% of coverage
        </p>
      </div>
      
      {/* Financial Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Policy Coverage</p>
          <p className="font-bold text-gray-900 text-lg">
            {formatCurrency(claim.coverageAmount)}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Claim Request</p>
          <p className={`font-bold text-lg ${getSeverityColor()}`}>
            {formatCurrency(claim.claimAmount)}
          </p>
        </div>
      </div>
      
      {/* Decision Impact */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-bold text-blue-900 mb-3">
          💡 Decision Impact
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">If Approved:</span>
            <span className="font-bold text-red-600">
              -{formatCurrency(claim.claimAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">If Rejected:</span>
            <span className="font-bold text-yellow-600">
              Reputation -10 ⚠️
            </span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onApprove(claim.id)}
          disabled={isProcessing}
          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <span className="text-lg">✅</span>
          Approve Claim
        </button>
        
        <button
          onClick={() => onReject(claim.id)}
          disabled={isProcessing}
          className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <span className="text-lg">❌</span>
          Reject Claim
        </button>
      </div>
      
      {/* Submission Time */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Submitted: {new Date(claim.submittedAt).toLocaleString('id-ID')}
      </div>
    </div>
  );
}
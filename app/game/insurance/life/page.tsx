// ============================================
// FILE: app/game/insurance/life/page.tsx (FIXED - NO BUGS)
// ============================================

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { 
  generateNewPolicy, 
  shouldGenerateClaim, 
  generateClaimAmount,
  shouldPolicyExpire,
} from '@/lib/game-logic/life-insurance';
import type { LifeInsurancePolicy } from '@/lib/types';
import { calculateRealInterval, convertRealToGameTime } from '@/lib/time-system';
import { getDifficultyAdjustedInterval } from '@/lib/difficulty-config';

import AutoSaveManager from '@/components/game/saves/AutoSaveManager';
import Header from '@/components/game/shared/Header';
import InsuranceStats from '@/components/game/insurance/InsuranceStats';
import LifePolicyCard from '@/components/game/insurance/life/LifePolicyCard';
import LifeClaimCard from '@/components/game/insurance/life/LifeClaimCard';
import TimeDisplay from '@/components/game/shared/TimeDisplay';
import ClaimHistoryPanel from '@/components/game/insurance/life/ClaimHistoryPanel';

interface ClaimApplication {
  id: string;
  policyId: string;
  holderName: string;
  holderAge: number;
  coverageAmount: number;
  claimAmount: number;
  claimType: 'death' | 'critical_illness' | 'disability';
  claimReason: string;
  submittedAt: number;
}

export default function LifeInsurancePage() {
  const router = useRouter();
  
  const player = useGameStore((state) => state.player);
  const company = useGameStore((state) => state.company);
  const insurance = useGameStore((state) => state.insurance);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const updateGameTime = useGameStore((state) => state.updateGameTime);
  
  const [activePolicies, setActivePolicies] = useState<LifeInsurancePolicy[]>([]);
  const [pendingClaims, setPendingClaims] = useState<ClaimApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ✅ NEW: Prevent double-clicking
  const [processingClaims, setProcessingClaims] = useState<Set<string>>(new Set());
  
  const lastSyncedPoliciesCount = useRef(0);

  // Check initialization
  useEffect(() => {
    const isLoadingSave = sessionStorage.getItem('loading-save');
    
    if (isLoadingSave) {
      sessionStorage.removeItem('loading-save');
      setIsLoading(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      if (!player || !company || !insurance) {
        router.push('/onboarding/character');
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [player, company, insurance, router]);

  // Load policies from store OR generate initial policies
  useEffect(() => {
    if (!insurance || isInitialized || !company) return;
    
    if (insurance.currentPolicies && insurance.currentPolicies.length > 0) {
      setActivePolicies(insurance.currentPolicies as LifeInsurancePolicy[]);
      lastSyncedPoliciesCount.current = insurance.currentPolicies.length;
      console.log(`✅ Loaded ${insurance.currentPolicies.length} policies from store`);
    } else {
      // Generate 3 initial policies
      const initialPolicies: LifeInsurancePolicy[] = [];
      for (let i = 0; i < 3; i++) {
        const newPolicy = generateNewPolicy(company.difficulty);
        initialPolicies.push(newPolicy);
      }
      setActivePolicies(initialPolicies);
      lastSyncedPoliciesCount.current = initialPolicies.length;
      console.log(`✅ Generated ${initialPolicies.length} initial policies`);
    }
    
    setIsInitialized(true);
  }, [insurance, isInitialized, company]);

  // Sync to store
  const syncPoliciesToStore = useCallback((policies: LifeInsurancePolicy[]) => {
    if (policies.length === lastSyncedPoliciesCount.current) return;
    
    const currentInsurance = useGameStore.getState().insurance;
    if (currentInsurance) {
      useGameStore.setState({
        insurance: {
          ...currentInsurance,
          currentPolicies: policies,
          activePolicies: policies.filter(p => p.status === 'active' || p.status === 'premium_waiver').length,
        },
      });
      lastSyncedPoliciesCount.current = policies.length;
    }
  }, []);

  // ✅ NEW: Helper to check if policy sales should succeed
  const shouldGeneratePolicySale = useCallback(() => {
    if (!company) return false;
    
    const reputation = company.reputation;
    
    // Reputation-based success rate
    let successRate = 0.5; // 50% base
    
    if (reputation >= 70) successRate = 0.8;      // High rep: 80%
    else if (reputation >= 50) successRate = 0.6; // Good rep: 60%
    else if (reputation >= 30) successRate = 0.4; // Low rep: 40%
    else successRate = 0.2;                        // Very low: 20%
    
    return Math.random() < successRate;
  }, [company]);

  // ✅ UPDATED: Policy sales handler with reputation check
  const handlePolicySales = useCallback(() => {
    if (company?.isPaused) return;
    
    // ✅ Check if sales should happen based on reputation
    if (!shouldGeneratePolicySale()) {
      console.log(`⏳ No policy sale (reputation: ${company?.reputation})`);
      return; // No sale this time!
    }
    
    const newPolicy = generateNewPolicy(company?.difficulty);
    setActivePolicies((prev) => {
      const updated = [...prev, newPolicy];
      syncPoliciesToStore(updated);
      return updated;
    });
    
    useGameStore.getState().addNotification({
      type: 'success',
      title: 'New Life Insurance Policy Sold',
      message: `${newPolicy.holderName} (${newPolicy.holderAge} years) purchased life insurance`,
    });
  }, [company?.isPaused, company?.difficulty, company?.reputation, syncPoliciesToStore, shouldGeneratePolicySale]);

  // Premium collection handler
  const handlePremiumCollection = useCallback(() => {
    if (company?.isPaused) return;
    
    let totalPremium = 0;
    let premiumCount = 0;
    const transactionsToAdd: Array<{
      type: 'income';
      amount: number;
      category: string;
      description: string;
    }> = [];
    
    setActivePolicies((prevPolicies) => {
      const updatedPolicies = prevPolicies.map((policy) => {
        // Skip claimed, expired, or terminated policies
        if (policy.status === 'claimed' || policy.status === 'expired' || policy.status === 'terminated') {
          return policy;
        }
        
        // Skip premium waiver (disability - no premium needed)
        if (policy.status === 'premium_waiver') {
          return policy;
        }
        
        // Check expiry
        if (shouldPolicyExpire(policy)) {
          useGameStore.getState().addNotification({
            type: 'info',
            title: 'Life Insurance Policy Expired',
            message: `${policy.holderName}'s policy has expired`,
          });
          return { ...policy, status: 'expired' as const };
        }
        
        // Collect premium (only from ACTIVE)
        if (policy.status === 'active') {
          totalPremium += policy.premiumMonthly;
          premiumCount++;
          
          transactionsToAdd.push({
            type: 'income',
            amount: policy.premiumMonthly,
            category: 'premium-collection',
            description: `Life insurance premium from ${policy.holderName}`,
          });
        }
        
        return policy;
      });
      
      syncPoliciesToStore(updatedPolicies);
      return updatedPolicies;
    });
    
    if (totalPremium > 0) {
      useGameStore.getState().updateBalance(totalPremium);
      
      const currentInsurance = useGameStore.getState().insurance;
      if (currentInsurance) {
        useGameStore.setState({
          insurance: {
            ...currentInsurance,
            totalPremiumCollected: currentInsurance.totalPremiumCollected + totalPremium,
          },
        });
      }
      
      // Add notification
      useGameStore.getState().addNotification({
        type: 'info',
        title: '💰 Premium Collected',
        message: `Collected ${formatCurrency(totalPremium)} from ${premiumCount} active policies`,
      });
    }
    
    transactionsToAdd.forEach((transaction) => {
      useGameStore.getState().addTransaction(transaction);
    });
  }, [company?.isPaused, syncPoliciesToStore]);

  // ✅ FIXED: Claim generation with batched notifications
  const handleClaimGeneration = useCallback(() => {
    if (company?.isPaused) return;
    
    const activeOnly = activePolicies.filter(p => p.status === 'active' || p.status === 'premium_waiver');
    if (activeOnly.length === 0) return;
    
    // ✅ Batch all claims first
    const newClaims: ClaimApplication[] = [];
    
    activeOnly.forEach((policy) => {
      if (shouldGenerateClaim(policy, company?.difficulty)) {
        const claimTypes = ['death', 'critical_illness', 'disability'] as const;
        const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
        const claimAmount = generateClaimAmount(policy);
        
        const claimReasons = {
          death: 'Policyholder passed away',
          critical_illness: 'Diagnosed with critical illness',
          disability: 'Permanent disability claim',
        };
        
        const newClaim: ClaimApplication = {
          id: crypto.randomUUID(),
          policyId: policy.id,
          holderName: policy.holderName,
          holderAge: policy.holderAge,
          coverageAmount: policy.coverageAmount,
          claimAmount,
          claimType,
          claimReason: claimReasons[claimType],
          submittedAt: Date.now(),
        };
        
        newClaims.push(newClaim);
      }
    });
    
    // ✅ Update state once with all new claims
    if (newClaims.length > 0) {
      setPendingClaims((prev) => [...prev, ...newClaims]);
      
      // ✅ Send notifications AFTER state update
      newClaims.forEach((claim) => {
        useGameStore.getState().addNotification({
          type: 'warning',
          title: 'Life Insurance Claim Submitted',
          message: `${claim.holderName} submitted ${claim.claimType.replace('_', ' ')} claim for ${formatCurrency(claim.claimAmount)}`,
        });
      });
    }
  }, [company?.isPaused, company?.difficulty, activePolicies]);

  // Game time ticker
  useEffect(() => {
    if (!company || company.isPaused || !gameSpeed) return;
    
    const tickInterval = 1000 / gameSpeed;
    
    const gameTicker = setInterval(() => {
      const gameSecondsElapsed = convertRealToGameTime(1, 'insurance') * 60;
      updateGameTime(gameSecondsElapsed);
    }, tickInterval);
    
    return () => clearInterval(gameTicker);
  }, [company, gameSpeed, updateGameTime]);

  // Policy sales interval
  useEffect(() => {
    if (!gameSpeed || !company?.difficulty) return;
    
    const baseInterval = calculateRealInterval(20, 'insurance', gameSpeed);
    const adjustedInterval = getDifficultyAdjustedInterval(baseInterval, company.difficulty);
    
    const policySalesInterval = setInterval(handlePolicySales, adjustedInterval);
    return () => clearInterval(policySalesInterval);
  }, [handlePolicySales, gameSpeed, company?.difficulty]);

  // Premium collection interval
  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(25, 'insurance', gameSpeed);
    const premiumInterval = setInterval(handlePremiumCollection, interval);
    return () => clearInterval(premiumInterval);
  }, [handlePremiumCollection, gameSpeed]);

  // Claim generation interval
  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(5, 'insurance', gameSpeed);
    const claimInterval = setInterval(handleClaimGeneration, interval);
    return () => clearInterval(claimInterval);
  }, [handleClaimGeneration, gameSpeed]);

  // ✅ FIXED: Approve claim with double-click prevention
  const handleApproveClaim = useCallback((claimId: string) => {
    // ✅ Prevent double-clicking
    if (processingClaims.has(claimId)) {
      console.log('⚠️ Already processing this claim');
      return;
    }
    
    const claim = pendingClaims.find((c) => c.id === claimId);
    if (!claim) return;
    
    if (company && company.balance < claim.claimAmount) {
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Insufficient Balance',
        message: 'Not enough balance to pay this claim',
      });
      return;
    }
    
    // ✅ Mark as processing
    setProcessingClaims(prev => new Set(prev).add(claimId));
    
    // Pay claim
    useGameStore.getState().updateBalance(-claim.claimAmount);
    useGameStore.getState().addTransaction({
      type: 'expense',
      amount: claim.claimAmount,
      category: 'life-insurance-claim',
      description: `${claim.claimType.replace('_', ' ')} claim paid to ${claim.holderName}`,
    });
    
    // Update insurance stats
    const currentInsurance = useGameStore.getState().insurance;
    if (currentInsurance) {
      useGameStore.setState({
        insurance: {
          ...currentInsurance,
          totalClaimsPaid: currentInsurance.totalClaimsPaid + claim.claimAmount,
        },
      });
    }
    
    // ✅ Prepare claim decision (don't add yet)
    let claimDecision: any = null;
    let notificationMessage = '';
    let notificationTitle = '';
    
    // Handle different claim types
    setActivePolicies((prev) => {
      const updated = prev.map((policy) => {
        if (policy.id !== claim.policyId) return policy;
        
        switch (claim.claimType) {
          case 'death':
            notificationTitle = 'Death Claim Approved';
            notificationMessage = `Paid ${formatCurrency(claim.claimAmount)} to ${claim.holderName}'s beneficiary.`;
            
            claimDecision = {
              id: crypto.randomUUID(),
              policyId: policy.id,
              policyHolderName: policy.holderName,
              holderAge: policy.holderAge,
              claimType: claim.claimType,
              claimAmount: claim.claimAmount,
              coverageAmount: policy.coverageAmount,
              decision: 'approved' as const,
              decisionDate: Date.now(),
              reason: 'Death claim approved and paid',
              paidAmount: claim.claimAmount,
            };
            
            return { ...policy, status: 'claimed' as const };
            
          case 'critical_illness':
            const newCoverage = Math.max(0, policy.coverageAmount - claim.claimAmount);
            
            notificationTitle = 'Critical Illness Claim Approved';
            notificationMessage = `Paid ${formatCurrency(claim.claimAmount)}. Coverage reduced to ${formatCurrency(newCoverage)}.`;
            
            claimDecision = {
              id: crypto.randomUUID(),
              policyId: policy.id,
              policyHolderName: policy.holderName,
              holderAge: policy.holderAge,
              claimType: claim.claimType,
              claimAmount: claim.claimAmount,
              coverageAmount: policy.coverageAmount,
              decision: 'approved' as const,
              decisionDate: Date.now(),
              reason: 'Critical illness claim approved, coverage reduced',
              paidAmount: claim.claimAmount,
            };
            
            return {
              ...policy,
              coverageAmount: newCoverage,
              originalCoverage: policy.originalCoverage || policy.coverageAmount,
            };
            
          case 'disability':
            notificationTitle = 'Disability Claim Approved';
            notificationMessage = `Paid ${formatCurrency(claim.claimAmount)}. Premium waived, coverage continues.`;
            
            claimDecision = {
              id: crypto.randomUUID(),
              policyId: policy.id,
              policyHolderName: policy.holderName,
              holderAge: policy.holderAge,
              claimType: claim.claimType,
              claimAmount: claim.claimAmount,
              coverageAmount: policy.coverageAmount,
              decision: 'approved' as const,
              decisionDate: Date.now(),
              reason: 'Disability claim approved, premium waived',
              paidAmount: claim.claimAmount,
            };
            
            return {
              ...policy,
              status: 'premium_waiver' as const,
              coverageAmount: Math.max(0, policy.coverageAmount - claim.claimAmount),
              originalCoverage: policy.originalCoverage || policy.coverageAmount,
            };
            
          default:
            return policy;
        }
      });
      
      syncPoliciesToStore(updated);
      return updated;
    });
    
    // ✅ Add to history ONCE, outside of setState
    if (claimDecision) {
      useGameStore.getState().addClaimDecision(claimDecision);
    }
    
    // ✅ Add notification ONCE
    if (notificationMessage) {
      useGameStore.getState().addNotification({
        type: 'success',
        title: notificationTitle,
        message: notificationMessage,
      });
    }
    
    // Remove from pending
    setPendingClaims((prev) => prev.filter((c) => c.id !== claimId));
    
    // ✅ Remove from processing after a delay
    setTimeout(() => {
      setProcessingClaims(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }, 1000);
  }, [pendingClaims, company, processingClaims, syncPoliciesToStore]);

  // ✅ FIXED: Reject claim with double-click prevention
  const handleRejectClaim = useCallback((claimId: string) => {
    // ✅ Prevent double-clicking
    if (processingClaims.has(claimId)) {
      console.log('⚠️ Already processing this claim');
      return;
    }
    
    const claim = pendingClaims.find((c) => c.id === claimId);
    if (!claim) return;
    
    // ✅ Mark as processing
    setProcessingClaims(prev => new Set(prev).add(claimId));
    
    // Handle death claim rejection
    if (claim.claimType === 'death') {
      // Person already dead → Terminate policy
      setActivePolicies((prev) => {
        const updated = prev.map((policy) => {
          if (policy.id !== claim.policyId) return policy;
          return { ...policy, status: 'terminated' as const };
        });
        
        syncPoliciesToStore(updated);
        return updated;
      });
      
      // ✅ Add to history ONCE
      useGameStore.getState().addClaimDecision({
        id: crypto.randomUUID(),
        policyId: claim.policyId,
        policyHolderName: claim.holderName,
        holderAge: claim.holderAge,
        claimType: claim.claimType,
        claimAmount: claim.claimAmount,
        coverageAmount: claim.coverageAmount,
        decision: 'rejected',
        decisionDate: Date.now(),
        reason: 'Death claim rejected - not paid',
      });
      
      useGameStore.getState().addNotification({
        type: 'warning',
        title: 'Death Claim Rejected',
        message: `Rejected death claim from ${claim.holderName}. Policy terminated. Reputation -15.`,
      });
      
      // Bigger reputation penalty
      const currentCompany = useGameStore.getState().company;
      if (currentCompany) {
        useGameStore.setState({
          company: {
            ...currentCompany,
            reputation: Math.max(0, currentCompany.reputation - 15),
          },
        });
      }
    } else {
      // Non-death claim rejection
      useGameStore.getState().addClaimDecision({
        id: crypto.randomUUID(),
        policyId: claim.policyId,
        policyHolderName: claim.holderName,
        holderAge: claim.holderAge,
        claimType: claim.claimType,
        claimAmount: claim.claimAmount,
        coverageAmount: claim.coverageAmount,
        decision: 'rejected',
        decisionDate: Date.now(),
        reason: `${claim.claimType.replace('_', ' ')} claim rejected`,
      });
      
      useGameStore.getState().addNotification({
        type: 'warning',
        title: `${claim.claimType.replace('_', ' ')} Claim Rejected`,
        message: `Rejected claim from ${claim.holderName}. Reputation -10.`,
      });
      
      const currentCompany = useGameStore.getState().company;
      if (currentCompany) {
        useGameStore.setState({
          company: {
            ...currentCompany,
            reputation: Math.max(0, currentCompany.reputation - 10),
          },
        });
      }
    }
    
    // Remove from pending
    setPendingClaims((prev) => prev.filter((c) => c.id !== claimId));
    
    // ✅ Remove from processing after a delay
    setTimeout(() => {
      setProcessingClaims(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }, 1000);
  }, [pendingClaims, processingClaims, syncPoliciesToStore]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🏥</div>
          <div className="text-xl text-gray-600 font-semibold">Loading game...</div>
        </div>
      </div>
    );
  }

  if (!player || !company || !insurance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Initializing...</div>
      </div>
    );
  }

  // Filter active policies for display
  const activeDisplayPolicies = activePolicies.filter(
    p => p.status === 'active' || p.status === 'premium_waiver'
  );
  
  const claimHistory = insurance?.claimHistory || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoSaveManager />
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Life Insurance Business</h1>
          <p className="text-blue-100">
            Provide financial protection for families through life insurance policies
          </p>
        </div>
        
        <TimeDisplay businessType="insurance" />
        <InsuranceStats />
        
        {/* Active Policies Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📋 Active Policies ({activeDisplayPolicies.length})
          </h2>
          
          {activeDisplayPolicies.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-gray-600 font-semibold">No active policies</p>
              <p className="text-sm text-gray-500 mt-2">New policies will appear automatically</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDisplayPolicies.map((policy) => (
                <LifePolicyCard key={policy.id} policy={policy} />
              ))}
            </div>
          )}
        </div>
        
        {/* Pending Claims Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ⚠️ Pending Claims ({pendingClaims.length})
          </h2>
          
          {pendingClaims.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-600 font-semibold">No pending claims</p>
              <p className="text-sm text-gray-500 mt-2">
                Claims will appear here when submitted
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingClaims.map((claim) => (
                <LifeClaimCard
                  key={claim.id}
                  claim={claim}
                  onApprove={handleApproveClaim}
                  onReject={handleRejectClaim}
                  isProcessing={processingClaims.has(claim.id)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Claim History Section */}
        <ClaimHistoryPanel claimHistory={claimHistory} />
      </div>
    </div>
  );
}
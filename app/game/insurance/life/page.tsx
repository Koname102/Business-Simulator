// ============================================
// FILE: app/game/insurance/life/page.tsx
// PURPOSE: Life Insurance game dashboard with FULL ERROR HANDLING
// ============================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { 
  generateNewPolicy, 
  shouldGenerateClaim,
  shouldPolicyExpire 
} from '@/lib/game-logic/life-insurance';
import type { LifeInsurancePolicy, ClaimApplication } from '@/lib/types';
import { calculateRealInterval, convertRealToGameTime } from '@/lib/time-system';
import { getDifficultyAdjustedInterval } from '@/lib/difficulty-config';
import { 
  guardArrayAccess, 
  guardBalanceFloor, 
  validateClaimAmount,
  getFirstErrorMessage 
} from '@/lib/validation';
import AutoSaveManager from '@/components/game/saves/AutoSaveManager';
import Toast from '@/components/ui/Toast';
import { logger } from '@/lib/logger'; // ✅ ADD LOGGER

import Header from '@/components/game/shared/Header';
import TimeDisplay from '@/components/game/shared/TimeDisplay';
import ClaimHistoryPanel from '@/components/game/insurance/life/ClaimHistoryPanel';
import LifeClaimCard from '@/components/game/insurance/life/LifeClaimCard';
import LifePolicyCard from '@/components/game/insurance/life/LifePolicyCard';
import LifeStats from '@/components/game/insurance/life/LifeStats';

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
        logger.warn('LifeInsurance', 'Game not initialized, redirecting to onboarding');
        router.push('/onboarding/character');
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [player, company, insurance, router]);

  useEffect(() => {
    if (!insurance || isInitialized) return;
    
    if (insurance.currentPolicies && insurance.currentPolicies.length > 0) {
      setActivePolicies(insurance.currentPolicies.filter(p => p.status === 'active'));
      logger.info('LifeInsurance', `Loaded ${insurance.currentPolicies.length} policies from store`);
    }
    
    if (insurance.pendingClaims && insurance.pendingClaims.length > 0) {
      setPendingClaims(insurance.pendingClaims);
      logger.info('LifeInsurance', `Loaded ${insurance.pendingClaims.length} pending claims from store`);
    }
    
    setIsInitialized(true);
  }, [insurance, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const currentInsurance = useGameStore.getState().insurance;
    if (!currentInsurance) return;
    
    useGameStore.setState({
      insurance: {
        ...currentInsurance,
        currentPolicies: activePolicies,
        pendingClaims: pendingClaims,
      },
    });
  }, [activePolicies, pendingClaims, isInitialized]);

  // ✅ FULL TRY-CATCH: handlePolicyGeneration
  const handlePolicyGeneration = useCallback(() => {
    try {
      if (company?.isPaused) return;
      
      const op = logger.operation('Insurance', 'GeneratePolicy');
      
      const newPolicy = generateNewPolicy(company?.difficulty);
      setActivePolicies((prev) => [...prev, newPolicy]);
      
      op.success('Policy generated', {
        policyId: newPolicy.id,
        holderName: newPolicy.holderName,
        coverageAmount: newPolicy.coverageAmount,
      });
      
      useGameStore.getState().addNotification({
        type: 'info',
        title: 'New Policy Application',
        message: `${newPolicy.holderName} applied for coverage`,
      });
      
    } catch (error) {
      logger.error('Insurance', 'Policy generation failed', error);
      // ✅ Graceful fallback: skip this generation, will retry next cycle
    }
  }, [company?.isPaused, company?.difficulty]);

  // ✅ FULL TRY-CATCH: handleClaimGeneration
  const handleClaimGeneration = useCallback(() => {
    try {
      if (company?.isPaused) return;
      
      // ✅ KEEP existing validation
      const arrayGuard = guardArrayAccess(activePolicies, 0, 'Active Policies');
      if (!arrayGuard.isValid) {
        return; // No active policies, skip silently
      }
      
      const op = logger.operation('Insurance', 'GenerateClaims');
      let claimsGenerated = 0;
      
      activePolicies.forEach((policy) => {
        if (policy.status !== 'active') return;
        
        if (shouldGenerateClaim(policy, company?.difficulty)) {
          const claimTypeRoll = Math.random();
          let claimType: 'death' | 'critical_illness' | 'disability';
          let claimAmount: number;
          
          if (claimTypeRoll < 0.6) {
            claimType = 'death';
            claimAmount = policy.coverageAmount;
          } else if (claimTypeRoll < 0.85) {
            claimType = 'critical_illness';
            claimAmount = Math.round(policy.coverageAmount * (0.3 + Math.random() * 0.2));
          } else {
            claimType = 'disability';
            claimAmount = Math.round(policy.coverageAmount * (0.3 + Math.random() * 0.2));
          }
          
          const newClaim: ClaimApplication = {
            id: crypto.randomUUID(),
            policyId: policy.id,
            policyHolderName: policy.holderName,
            holderAge: policy.holderAge,
            claimType,
            claimAmount,
            coverageAmount: policy.coverageAmount,
            submittedAt: Date.now(),
          };
          
          setPendingClaims((prev) => [...prev, newClaim]);
          claimsGenerated++;
          
          useGameStore.getState().addNotification({
            type: 'warning',
            title: 'New Claim Submitted',
            message: `${policy.holderName} submitted ${claimType} claim`,
          });
        }
      });
      
      if (claimsGenerated > 0) {
        op.success(`Generated ${claimsGenerated} claims`, { count: claimsGenerated });
      }
      
    } catch (error) {
      logger.error('Insurance', 'Claim generation failed', error);
      // ✅ Graceful fallback: skip this generation cycle
    }
  }, [company?.isPaused, company?.difficulty, activePolicies]);

  // ✅ FULL TRY-CATCH: handlePremiumCollection
  const handlePremiumCollection = useCallback(() => {
    try {
      if (company?.isPaused) return;
      
      // ✅ KEEP existing validation
      const arrayGuard = guardArrayAccess(activePolicies, 0, 'Active Policies');
      if (!arrayGuard.isValid) {
        return; // No active policies, skip silently
      }
      
      const op = logger.operation('Insurance', 'CollectPremiums');
      
      let totalPremium = 0;
      
      activePolicies.forEach((policy) => {
        if (policy.status === 'active') {
          totalPremium += policy.premiumMonthly;
        }
      });
      
      if (totalPremium > 0) {
        useGameStore.getState().updateBalance(totalPremium);
        useGameStore.getState().addTransaction({
          type: 'income',
          amount: totalPremium,
          category: 'insurance-premium',
          description: `Monthly premium collection from ${activePolicies.filter(p => p.status === 'active').length} policies`,
        });
        
        const currentInsurance = useGameStore.getState().insurance;
        if (currentInsurance) {
          useGameStore.setState({
            insurance: {
              ...currentInsurance,
              totalPremiumCollected: currentInsurance.totalPremiumCollected + totalPremium,
            },
          });
        }
        
        op.success('Premiums collected', {
          totalAmount: totalPremium,
          policyCount: activePolicies.filter(p => p.status === 'active').length,
        });
      }
      
    } catch (error) {
      logger.error('Insurance', 'Premium collection failed', error);
      // ✅ Graceful fallback: skip this collection cycle
    }
  }, [company?.isPaused, activePolicies]);

  // ✅ FULL TRY-CATCH: handleApproveClaim
  const handleApproveClaim = async (claimId: string) => {
    try {
      // 1. Validate input
      if (!claimId) {
        throw new Error('[VAL-001] Claim ID is required');
      }

      // 2. Validate array not empty (KEEP existing validation!)
      const arrayGuard = guardArrayAccess(pendingClaims, 0, 'Pending Claims');
      if (!arrayGuard.isValid) {
        throw new Error('[STATE-005] ' + getFirstErrorMessage(arrayGuard));
      }
      
      // 3. Find claim
      const claim = pendingClaims.find(c => c.id === claimId);
      if (!claim) {
        throw new Error('[OP-002] Claim not found');
      }
      
      // 4. Validate claim amount (KEEP existing validation!)
      const claimValidation = validateClaimAmount(claim.claimAmount, claim.coverageAmount);
      if (!claimValidation.isValid) {
        throw new Error('[VAL-003] ' + (getFirstErrorMessage(claimValidation) || 'Claim exceeds coverage'));
      }
      
      // 5. Check company state
      if (!company) {
        throw new Error('[STATE-003] Company not initialized');
      }

      // 6. Validate balance (KEEP existing validation!)
      const balanceGuard = guardBalanceFloor(company.balance, claim.claimAmount);
      if (!balanceGuard.isValid) {
        throw new Error('[STATE-001] ' + (getFirstErrorMessage(balanceGuard) || 'Insufficient balance'));
      }
      
      // 7. Log operation start
      const op = logger.operation('Insurance', 'ApproveClaim');
      
      // 8. Process claim approval
      useGameStore.getState().updateBalance(-claim.claimAmount);
      
      useGameStore.getState().addTransaction({
        type: 'expense',
        amount: claim.claimAmount,
        category: 'claim-payout',
        description: `${claim.claimType} claim payout to ${claim.policyHolderName}`,
      });
      
      if (claim.claimType === 'death') {
        setActivePolicies((prev) =>
          prev.map((p) =>
            p.id === claim.policyId ? { ...p, status: 'claimed' } : p
          )
        );
        
        useGameStore.getState().addClaimDecision({
          id: crypto.randomUUID(),
          policyId: claim.policyId,
          policyHolderName: claim.policyHolderName,
          holderAge: claim.holderAge,
          claimType: claim.claimType,
          claimAmount: claim.claimAmount,
          coverageAmount: claim.coverageAmount,
          decision: 'approved',
          decisionDate: Date.now(),
          reason: 'Death claim approved',
          paidAmount: claim.claimAmount,
        });
      } else {
        setActivePolicies((prev) =>
          prev.map((p) =>
            p.id === claim.policyId
              ? { 
                  ...p, 
                  coverageAmount: p.coverageAmount - claim.claimAmount,
                  originalCoverage: p.originalCoverage || p.coverageAmount,
                }
              : p
          )
        );
      }
      
      setPendingClaims((prev) => prev.filter(c => c.id !== claimId));
      
      const currentInsurance = useGameStore.getState().insurance;
      if (currentInsurance) {
        useGameStore.setState({
          insurance: {
            ...currentInsurance,
            totalClaimsPaid: currentInsurance.totalClaimsPaid + claim.claimAmount,
          },
        });
      }

      // 9. Log success
      op.success('Claim approved', {
        claimId,
        policyHolderName: claim.policyHolderName,
        claimType: claim.claimType,
        amount: claim.claimAmount,
      });

      // 10. Notify user
      useGameStore.getState().addNotification({
        type: 'success',
        title: 'Claim Approved',
        message: `Paid ${formatCurrency(claim.claimAmount)} to ${claim.policyHolderName}`,
      });

      return true;

    } catch (error) {
      // 11. Log error
      logger.error('Insurance', 'Claim approval failed', error, { claimId });

      // 12. Notify user
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Claim Approval Failed',
        message: error instanceof Error ? error.message.replace(/^\[.*?\]\s*/, '') : 'Unable to approve claim',
      });

      // 13. Graceful exit
      return false;
    }
  };

  // ✅ FULL TRY-CATCH: handleRejectClaim
  const handleRejectClaim = async (claimId: string) => {
    try {
      // 1. Validate input
      if (!claimId) {
        throw new Error('[VAL-001] Claim ID is required');
      }

      // 2. Validate array not empty (KEEP existing validation!)
      const arrayGuard = guardArrayAccess(pendingClaims, 0, 'Pending Claims');
      if (!arrayGuard.isValid) {
        throw new Error('[STATE-005] ' + getFirstErrorMessage(arrayGuard));
      }
      
      // 3. Find claim
      const claim = pendingClaims.find(c => c.id === claimId);
      if (!claim) {
        throw new Error('[OP-002] Claim not found');
      }

      // 4. Log operation start
      const op = logger.operation('Insurance', 'RejectClaim');
      
      // 5. Process rejection
      setActivePolicies((prev) =>
        prev.map((p) =>
          p.id === claim.policyId ? { ...p, status: 'terminated' } : p
        )
      );
      
      if (claim.claimType === 'death') {
        useGameStore.getState().addClaimDecision({
          id: crypto.randomUUID(),
          policyId: claim.policyId,
          policyHolderName: claim.policyHolderName,
          holderAge: claim.holderAge,
          claimType: claim.claimType,
          claimAmount: claim.claimAmount,
          coverageAmount: claim.coverageAmount,
          decision: 'rejected',
          decisionDate: Date.now(),
          reason: 'Claim rejected - policy terminated',
        });
      }
      
      setPendingClaims((prev) => prev.filter(c => c.id !== claimId));

      // 6. Log success
      op.success('Claim rejected', {
        claimId,
        policyHolderName: claim.policyHolderName,
      });

      // 7. Notify user
      useGameStore.getState().addNotification({
        type: 'warning',
        title: 'Claim Rejected',
        message: `Rejected claim from ${claim.policyHolderName}`,
      });

      return true;

    } catch (error) {
      // 8. Log error
      logger.error('Insurance', 'Claim rejection failed', error, { claimId });

      // 9. Notify user (optional)
      useGameStore.getState().addNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: error instanceof Error ? error.message.replace(/^\[.*?\]\s*/, '') : 'Unable to reject claim',
      });

      // 10. Graceful exit
      return false;
    }
  };

  useEffect(() => {
    if (!company || company.isPaused || !gameSpeed) return;
    
    const tickInterval = 1000 / gameSpeed;
    
    const gameTicker = setInterval(() => {
      const gameSecondsElapsed = convertRealToGameTime(1, 'insurance') * 60;
      updateGameTime(gameSecondsElapsed);
    }, tickInterval);
    
    return () => clearInterval(gameTicker);
  }, [company, gameSpeed, updateGameTime]);

  useEffect(() => {
    if (!gameSpeed || !company) return;
    
    const baseInterval = calculateRealInterval(20, 'insurance', gameSpeed);
    const adjustedInterval = company.difficulty 
      ? getDifficultyAdjustedInterval(baseInterval, company.difficulty)
      : baseInterval;
    
    const policyInterval = setInterval(handlePolicyGeneration, adjustedInterval);
    return () => clearInterval(policyInterval);
  }, [handlePolicyGeneration, gameSpeed, company?.difficulty]);

  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(30, 'insurance', gameSpeed);
    const premiumInterval = setInterval(handlePremiumCollection, interval);
    return () => clearInterval(premiumInterval);
  }, [handlePremiumCollection, gameSpeed]);

  useEffect(() => {
    if (!gameSpeed) return;
    
    const interval = calculateRealInterval(30, 'insurance', gameSpeed);
    const claimInterval = setInterval(handleClaimGeneration, interval);
    return () => clearInterval(claimInterval);
  }, [handleClaimGeneration, gameSpeed]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
        <div className="text-center">
          <div className="text-gray-600">Initializing...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoSaveManager />
      <Toast />
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <TimeDisplay businessType="insurance" />
        <LifeStats />
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ⚠️ Pending Claims ({pendingClaims.length})
          </h2>
          
          {pendingClaims.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-600 font-semibold">No pending claims</p>
              <p className="text-sm text-gray-500 mt-2">
                Claim applications will appear here
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
                />
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📋 Active Policies ({activePolicies.filter(p => p.status === 'active').length})
          </h2>
          
          {activePolicies.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-gray-600 font-semibold">No active policies yet</p>
              <p className="text-sm text-gray-500 mt-2">
                New policy applications will appear automatically
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePolicies.map((policy) => (
                <LifePolicyCard key={policy.id} policy={policy} />
              ))}
            </div>
          )}
        </div>
        
        {insurance.claimHistory && insurance.claimHistory.length > 0 && (
          <ClaimHistoryPanel claimHistory={insurance.claimHistory} />
        )}
      </div>
    </div>
  );
}
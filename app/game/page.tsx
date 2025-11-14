// ============================================
// FILE: app/game/page.tsx
// PURPOSE: Route to correct business type page
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

export default function GamePage() {
  const router = useRouter();
  const company = useGameStore((state) => state.company);
  
  useEffect(() => {
    if (!company) {
      router.push('/onboarding/character');
      return;
    }
    
    switch (company.type) {
      case 'fintech':
        router.push('/game/fintech');
        break;
      case 'insurance':
        router.push('/game/insurance');
        break;
      case 'investment':
        router.push('/game/investment');
        break;
      default:
        router.push('/onboarding/character');
    }
  }, [company, router]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading game...</div>
    </div>
  );
}
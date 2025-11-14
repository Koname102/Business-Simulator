'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatGameTime } from '@/lib/time-system';

interface TimeDisplayProps {
  businessType: 'fintech' | 'insurance' | 'investment';
}

export default function TimeDisplay({ businessType }: TimeDisplayProps) {
  const company = useGameStore((state) => state.company);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const setGameSpeed = useGameStore((state) => state.setGameSpeed);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  
  if (!company) return null;
  
  const isPaused = company.isPaused;
  
  const speedOptions = [
    { value: 1, label: '1x', color: 'bg-gray-200 text-gray-700' },
    { value: 2, label: '2x', color: 'bg-blue-200 text-blue-700' },
    { value: 5, label: '5x', color: 'bg-purple-200 text-purple-700' },
  ];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Game Time</p>
            <p className="text-lg font-bold text-gray-900">
              {formatGameTime(company.gameTime, businessType)}  {/* ← ADD businessType */}
            </p>
          </div>
          
          <div className="h-8 w-px bg-gray-300" />
        </div>
      </div>
      
      {isPaused && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
          <p className="text-sm text-yellow-800 font-semibold">
            ⏸️ Game Paused
          </p>
        </div>
      )}
    </div>
  );
}
// ============================================
// FILE: app/game/shared/Header.tsx
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import NotificationPanel from './NotificationPanel';
import SaveLoadMenu from '@/components/game/saves/SaveLoadMenu';
import { SaveManager } from '@/lib/save-manager';

export default function Header() {
  const company = useGameStore((state) => state.company);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const setGameSpeed = useGameStore((state) => state.setGameSpeed);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [showQuickSaveNotif, setShowQuickSaveNotif] = useState(false);
  
  if (!company) return null;
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S: Quick Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
      }
      
      // Space: Pause/Resume
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleTogglePause();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [company.isPaused]);
  
  const handleQuickSave = async () => {
    const success = SaveManager.autoSave();
    if (await success) {
      // Show brief success notification
      setShowQuickSaveNotif(true);
      setTimeout(() => setShowQuickSaveNotif(false), 2000);
    }
  };
  
  const handleTogglePause = () => {
    if (company.isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  };
  
  const handleSpeedChange = (speed: number) => {
    setGameSpeed(speed);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const getReputationColor = (rep: number) => {
    if (rep >= 80) return 'text-green-600';
    if (rep >= 60) return 'text-blue-600';
    if (rep >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case 'fintech': return 'P2P Lending Platform';
      case 'insurance': return 'Insurance Company';
      case 'investment': return 'Investment Management';
      default: return '';
    }
  };
  
  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
  ];

  return (
    <>
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top Row: Company Info & Stats */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {company.name}
              </h1>
              <p className="text-sm text-gray-600">
                {getBusinessTypeLabel(company.type)}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(company.balance)}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">Reputation</p>
                <p className={`text-xl font-bold ${getReputationColor(company.reputation)}`}>
                  {company.reputation}/100
                </p>
              </div>
              
              <NotificationPanel />
            </div>
          </div>
          
          {/* Bottom Row: Game Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {/* Left: Save/Load Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickSave}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold transition-colors flex items-center gap-1"
                title="Quick Save (Ctrl+S)"
              >
                💾 Quick Save
              </button>
              
              <button
                onClick={() => setShowSaveMenu(true)}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold transition-colors"
                title="Save to Slot"
              >
                💾 Save
              </button>
              
              <button
                onClick={() => setShowLoadMenu(true)}
                className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-semibold transition-colors"
                title="Load Game"
              >
                📂 Load
              </button>
              
              {/* Quick Save Notification */}
              {showQuickSaveNotif && (
                <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm font-semibold animate-fade-in">
                  ✓ Saved!
                </div>
              )}
            </div>
            
            {/* Right: Pause & Speed Controls */}
            <div className="flex items-center gap-2">
              {/* Pause/Resume Button */}
              <button
                onClick={handleTogglePause}
                className={`px-4 py-1.5 rounded font-semibold text-sm transition-colors ${
                  company.isPaused
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
                title="Pause/Resume (Space)"
              >
                {company.isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              
              {/* Speed Control */}
              <div className="flex items-center gap-1 bg-gray-100 rounded px-1 py-1">
                <span className="text-xs text-gray-600 px-2 font-semibold">Speed:</span>
                {speedOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSpeedChange(option.value)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      gameSpeed === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={company.isPaused}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {/* Difficulty Badge */}
              <div className={`px-3 py-1.5 rounded text-xs font-bold ${
                company.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                company.difficulty === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {company.difficulty.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save/Load Modals */}
      {showSaveMenu && (
        <SaveLoadMenu
          mode="save"
          onClose={() => setShowSaveMenu(false)}
          onSuccess={() => setShowSaveMenu(false)}
        />
      )}
      
      {showLoadMenu && (
        <SaveLoadMenu
          mode="load"
          onClose={() => setShowLoadMenu(false)}
        />
      )}
    </>
  );
}
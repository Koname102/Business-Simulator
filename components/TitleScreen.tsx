// ============================================
// FILE: components/TitleScreen.tsx (UPDATED WITH SUB-TYPE SUPPORT)
// PURPOSE: Main title screen with New Game & Load Game
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SaveLoadMenu from '@/components/game/saves/SaveLoadMenu';
import { SaveManager } from '@/lib/save-manager';
import type { BusinessSubType } from '@/lib/types'; // ✅ Import type

interface AutosavePreview {
  businessType: string;
  businessSubType?: BusinessSubType;
  balance: number;
  playtime: number;
}

export default function TitleScreen() {
  const router = useRouter();
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [hasAutosave, setHasAutosave] = useState(false);
  const [autosavePreview, setAutosavePreview] = useState<AutosavePreview | null>(null); // ✅ Typed
  
  // ✅ Check for autosave on mount
  useEffect(() => {
    setHasAutosave(SaveManager.hasAutosave());
    setAutosavePreview(SaveManager.getAutosavePreview());
  }, []);
  
  const handleNewGame = () => {
    router.push('/onboarding/character');
  };
  
  const handleLoadSuccess = () => {
    setShowLoadMenu(false);
  };
  
  const handleContinue = () => {
    // Set flag to prevent redirect loop
    sessionStorage.setItem('loading-save', 'true');
    
    const url = SaveManager.loadAutosaveAndGetURL();
    if (url) {
      router.push(url);
    } else {
      sessionStorage.removeItem('loading-save');
      alert('Failed to load autosave. Starting new game.');
      handleNewGame();
    }
  };
  
  // ✅ Helper: Format business type for display
  const formatBusinessType = (preview: AutosavePreview): string => {
    if (preview.businessSubType) {
      // Format sub-type nicely
      return preview.businessSubType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    // Fallback to business type
    return preview.businessType.toUpperCase();
  };
  
  // ✅ Helper: Get icon for business type
  const getBusinessIcon = (preview: AutosavePreview): string => {
    if (preview.businessSubType) {
      const icons: Record<BusinessSubType, string> = {
        'fintech-lending': '💰',
        'life-insurance': '🏥',
        'health-insurance': '⚕️',
        'venture-capital': '🚀',
      };
      return icons[preview.businessSubType] || '💼';
    }
    
    const icons: Record<string, string> = {
      fintech: '💰',
      insurance: '🛡️',
      investment: '📈',
    };
    return icons[preview.businessType] || '💼';
  };
  
  // ✅ Helper: Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
      return `Rp ${(amount / 1_000_000).toFixed(0)}M`;
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Logo & Title */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="mb-6">
              <div className="text-8xl mb-4">💼</div>
            </div>
            <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
              Business Simulator
            </h1>
            <p className="text-xl text-blue-200">
              Build Your Financial Empire
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-blue-300">
              <span className="px-3 py-1 bg-blue-800 bg-opacity-50 rounded-full">
                Fintech
              </span>
              <span className="px-3 py-1 bg-blue-800 bg-opacity-50 rounded-full">
                Insurance
              </span>
              <span className="px-3 py-1 bg-blue-800 bg-opacity-50 rounded-full">
                Investment
              </span>
            </div>
          </div>
          
          {/* Main Menu Buttons */}
          <div className="space-y-4 mb-8">
            {/* Continue (if autosave exists) */}
            {hasAutosave && autosavePreview && (
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-6 px-8 rounded-xl shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-purple-500/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{getBusinessIcon(autosavePreview)}</span>
                    <div className="text-left">
                      <div className="text-2xl">Continue</div>
                      <div className="text-sm text-purple-200 font-normal">
                        Resume from last autosave
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white mb-1">
                      {formatBusinessType(autosavePreview)}
                    </div>
                    <div className="text-sm text-purple-200">
                      {formatCurrency(autosavePreview.balance)}
                    </div>
                    <div className="text-xs text-purple-300">
                      {SaveManager.formatPlaytime(autosavePreview.playtime)}
                    </div>
                  </div>
                </div>
              </button>
            )}
            
            {/* New Game */}
            <button
              onClick={handleNewGame}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-6 px-8 rounded-xl shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-green-500/50"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🆕</span>
                <div className="text-left">
                  <div className="text-2xl">New Game</div>
                  <div className="text-sm text-green-200 font-normal">
                    Start your business journey
                  </div>
                </div>
              </div>
            </button>
            
            {/* Load Game */}
            <button
              onClick={() => setShowLoadMenu(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-6 px-8 rounded-xl shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">📂</span>
                <div className="text-left">
                  <div className="text-2xl">Load Game</div>
                  <div className="text-sm text-blue-200 font-normal">
                    Continue your saved progress
                  </div>
                </div>
              </div>
            </button>
          </div>
          
          {/* Secondary Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowAbout(true)}
              className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              About
            </button>
            <button
              onClick={() => window.open('https://github.com/yourusername/business-simulator', '_blank')}
              className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              GitHub
            </button>
            <button
              className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              Settings
            </button>
          </div>
          
          {/* Version */}
          <div className="text-center mt-8 text-blue-300 text-sm">
            Version 1.0.0 (MVP) • Made with ❤️
          </div>
        </div>
      </div>
      
      {/* Load Game Modal */}
      {showLoadMenu && (
        <SaveLoadMenu
          mode="load"
          onClose={() => setShowLoadMenu(false)}
          onSuccess={handleLoadSuccess}
        />
      )}
      
      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                About Business Simulator
              </h2>
              <button
                onClick={() => setShowAbout(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <p className="text-lg">
                <strong>Business Simulator</strong> is a comprehensive business management game where you build and grow your financial empire.
              </p>
              
              <div>
                <h3 className="font-bold text-xl mb-2">Available Business Types:</h3>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span>💰</span>
                    <div>
                      <strong>Fintech Lending:</strong> Manage loan applications, assess credit risks, and grow your P2P lending portfolio.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🏥</span>
                    <div>
                      <strong>Life Insurance:</strong> Sell life insurance policies, collect premiums, and handle claims while maintaining profitability.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🚀</span>
                    <div>
                      <strong>Venture Capital:</strong> Invest in promising startups, manage your portfolio, and achieve successful exits.
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-xl mb-2">Coming Soon:</h3>
                <ul className="space-y-1 ml-4 text-sm text-gray-600">
                  <li>• Health Insurance</li>
                  <li>• Payment Gateway</li>
                  <li>• Multi-company management</li>
                  <li>• M&A (Mergers & Acquisitions)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-xl mb-2">Features:</h3>
                <ul className="grid grid-cols-2 gap-2 ml-4">
                  <li>✅ Multiple difficulty levels</li>
                  <li>✅ Save/Load system</li>
                  <li>✅ Real-time business simulation</li>
                  <li>✅ Risk management</li>
                  <li>✅ Strategic decision-making</li>
                  <li>✅ Progressive gameplay</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Keyboard Shortcuts:</strong> Ctrl+S (Quick Save) • Space (Pause/Resume) • F5 (Save) • F9 (Load)
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAbout(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// ============================================
// FILE: app/onboarding/business/page.tsx (FIXED)
// PURPOSE: Multi-step business onboarding
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import type { DifficultyLevel } from '@/lib/difficulty-config';

type IndustrySector = 'finance';

type BusinessCategory = 'financial-service' | 'insurance' | 'investment-management';

type BusinessSubType = 
  | 'fintech-lending'
  | 'life-insurance'
  | 'health-insurance'
  | 'venture-capital';

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
}

// ✅ ADD: Temp player data interface
interface TempPlayerData {
  name: string;
  age: number;
}

const STEPS: OnboardingStep[] = [
  { step: 1, title: 'Company Name', description: 'What will you name your company?' },
  { step: 2, title: 'Industry Sector', description: 'Choose your industry sector' },
  { step: 3, title: 'Business Type', description: 'Select your business category' },
  { step: 4, title: 'Business Model', description: 'Choose your specific business model' },
  { step: 5, title: 'Difficulty Level', description: 'Select game difficulty' },
];

export default function BusinessOnboarding() {
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [industrySector, setIndustrySector] = useState<IndustrySector | null>(null);
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory | null>(null);
  const [businessSubType, setBusinessSubType] = useState<BusinessSubType | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  
  // ✅ NEW: Load player data from localStorage
  const [playerData, setPlayerData] = useState<TempPlayerData | null>(null);

  // ✅ NEW: Check for temp player data on mount
  useEffect(() => {
    const tempPlayerRaw = localStorage.getItem('temp_player');
    
    if (!tempPlayerRaw) {
      console.log('No temp player data found, redirecting to character creation');
      router.push('/onboarding/character');
      return;
    }
    
    try {
      const tempPlayer: TempPlayerData = JSON.parse(tempPlayerRaw);
      setPlayerData(tempPlayer);
      console.log('✅ Loaded player data:', tempPlayer);
    } catch (error) {
      console.error('Error parsing temp player data:', error);
      router.push('/onboarding/character');
    }
  }, [router]);

  // ✅ UPDATED: Show loading while checking player data
  if (!playerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep === 1 && !companyName.trim()) {
      alert('Please enter a company name');
      return;
    }
    if (currentStep === 2 && !industrySector) {
      alert('Please select an industry sector');
      return;
    }
    if (currentStep === 3 && !businessCategory) {
      alert('Please select a business type');
      return;
    }
    if (currentStep === 4 && !businessSubType) {
      alert('Please select a business model');
      return;
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinishOnboarding = () => {
    if (!businessSubType || !playerData) return;

    const state = useGameStore.getState();
    
    // Map sub-type to game type for initialization
    const gameTypeMap: Record<BusinessSubType, 'fintech' | 'insurance' | 'investment'> = {
      'fintech-lending': 'fintech',
      'life-insurance': 'insurance',
      'health-insurance': 'insurance',
      'venture-capital': 'investment',
    };
    
    const gameType = gameTypeMap[businessSubType];
    
    // ✅ FIXED: Use playerData from localStorage
    state.initializeGame(
      playerData.name,  // ✅ From localStorage
      playerData.age,   // ✅ From localStorage
      companyName,
      gameType,
      difficulty
    );
    
    // ✅ Clean up temp data
    localStorage.removeItem('temp_player');
    
    console.log('✅ Game initialized:', {
      playerName: playerData.name,
      playerAge: playerData.age,
      companyName,
      businessSubType,
      difficulty,
    });
    
    // Route based on sub-type
    const routeMap: Record<BusinessSubType, string> = {
      'fintech-lending': '/game/fintech',
      'life-insurance': '/game/insurance/life',
      'health-insurance': '/game/insurance/health',
      'venture-capital': '/game/investment',
    };
    
    router.push(routeMap[businessSubType]);
  };

  const getSubTypeOptions = (): { value: BusinessSubType; label: string; description: string; icon: string; available: boolean }[] => {
    if (businessCategory === 'financial-service') {
      return [
        {
          value: 'fintech-lending',
          label: 'Fintech Lending',
          description: 'P2P lending platform connecting borrowers and lenders',
          icon: '💰',
          available: true,
        },
      ];
    }
    
    if (businessCategory === 'insurance') {
      return [
        {
          value: 'life-insurance',
          label: 'Life Insurance',
          description: 'Provide financial protection for families',
          icon: '🏥',
          available: true,
        },
        {
          value: 'health-insurance',
          label: 'Health Insurance',
          description: 'Medical coverage and healthcare protection',
          icon: '⚕️',
          available: false, // Coming soon
        },
      ];
    }
    
    if (businessCategory === 'investment-management') {
      return [
        {
          value: 'venture-capital',
          label: 'Venture Capital',
          description: 'Invest in high-growth startups and scale-ups',
          icon: '🚀',
          available: true,
        },
      ];
    }
    
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* ✅ NEW: Player info header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex items-center justify-between">
          <div className="text-white text-sm">
            <span className="font-semibold">{playerData.name}</span>
            <span className="mx-2">•</span>
            <span>{playerData.age} years old</span>
          </div>
          <button
            onClick={() => {
              if (confirm('Go back to character creation? Current progress will be lost.')) {
                router.push('/onboarding/character');
              }
            }}
            className="text-white text-xs hover:underline"
          >
            Change Character
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step) => (
              <div key={step.step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep >= step.step
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500 text-white opacity-50'
                  }`}
                >
                  {step.step}
                </div>
                {step.step < STEPS.length && (
                  <div
                    className={`w-12 h-1 mx-2 transition-all ${
                      currentStep > step.step ? 'bg-white' : 'bg-blue-500 opacity-30'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-white">
            <h2 className="text-2xl font-bold">{STEPS[currentStep - 1].title}</h2>
            <p className="text-blue-100 mt-1">{STEPS[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          {/* Step 1: Company Name */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., TechLend Indonesia, SafeLife Insurance"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2">
                  Choose a memorable name for your business empire
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Industry Sector */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div
                onClick={() => setIndustrySector('finance')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  industrySector === 'finance'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">💼</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Keuangan (Finance)
                    </h3>
                    <p className="text-gray-600">
                      Build financial services, insurance products, or investment management businesses
                    </p>
                    <div className="mt-4 flex gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        Financial Services
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        Insurance
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                        Investment
                      </span>
                    </div>
                  </div>
                  {industrySector === 'finance' && (
                    <div className="text-blue-600 text-2xl">✓</div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Coming Soon:</strong> More industry sectors including Technology, Healthcare, and Retail
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Business Category */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div
                onClick={() => setBusinessCategory('financial-service')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  businessCategory === 'financial-service'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">💳</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Financial Service
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Digital banking, lending platforms, and payment solutions
                    </p>
                    <div className="text-sm text-gray-500">
                      Manage loans, interest rates, and credit risk
                    </div>
                  </div>
                  {businessCategory === 'financial-service' && (
                    <div className="text-blue-600 text-2xl">✓</div>
                  )}
                </div>
              </div>

              <div
                onClick={() => setBusinessCategory('insurance')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  businessCategory === 'insurance'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">🛡️</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Insurance
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Life, health, vehicle, and property insurance products
                    </p>
                    <div className="text-sm text-gray-500">
                      Balance premiums and claims to maintain profitability
                    </div>
                  </div>
                  {businessCategory === 'insurance' && (
                    <div className="text-green-600 text-2xl">✓</div>
                  )}
                </div>
              </div>

              <div
                onClick={() => setBusinessCategory('investment-management')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  businessCategory === 'investment-management'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">📈</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Investment Management
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Venture capital, private equity, and hedge funds
                    </p>
                    <div className="text-sm text-gray-500">
                      Identify promising startups and generate returns
                    </div>
                  </div>
                  {businessCategory === 'investment-management' && (
                    <div className="text-purple-600 text-2xl">✓</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Business Sub-Type */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {getSubTypeOptions().map((option) => (
                <div
                  key={option.value}
                  onClick={() => option.available && setBusinessSubType(option.value)}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    option.available
                      ? `cursor-pointer hover:shadow-lg ${
                          businessSubType === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`
                      : 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{option.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {option.label}
                        </h3>
                        {!option.available && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-semibold">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{option.description}</p>
                    </div>
                    {businessSubType === option.value && option.available && (
                      <div className="text-blue-600 text-2xl">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Difficulty */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div
                onClick={() => setDifficulty('easy')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  difficulty === 'easy'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">🌱</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Mode</h3>
                    <p className="text-gray-600 mb-3">
                      Perfect for learning the game mechanics
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Higher starting capital: <strong>Rp 150M</strong></li>
                      <li>• 20% higher income from operations</li>
                      <li>• 30% fewer negative events</li>
                      <li>• Slower event intervals</li>
                    </ul>
                  </div>
                  {difficulty === 'easy' && <div className="text-green-600 text-2xl">✓</div>}
                </div>
              </div>

              <div
                onClick={() => setDifficulty('medium')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  difficulty === 'medium'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">⚖️</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Medium Mode</h3>
                    <p className="text-gray-600 mb-3">
                      Balanced gameplay for most players
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Standard starting capital: <strong>Rp 100M</strong></li>
                      <li>• Normal income and expenses</li>
                      <li>• Balanced event frequency</li>
                      <li>• Recommended for first playthrough</li>
                    </ul>
                  </div>
                  {difficulty === 'medium' && <div className="text-blue-600 text-2xl">✓</div>}
                </div>
              </div>

              <div
                onClick={() => setDifficulty('hard')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  difficulty === 'hard'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">🔥</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Hard Mode</h3>
                    <p className="text-gray-600 mb-3">
                      Challenging experience for experienced players
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Lower starting capital: <strong>Rp 75M</strong></li>
                      <li>• 15% lower income from operations</li>
                      <li>• 40% more negative events</li>
                      <li>• Faster event intervals</li>
                    </ul>
                  </div>
                  {difficulty === 'hard' && <div className="text-red-600 text-2xl">✓</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="bg-gray-50 px-8 py-6 flex items-center justify-between border-t border-gray-200">
          <button
            onClick={handleBack}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
            disabled={currentStep === 1}
          >
            ← Back
          </button>

          <div className="text-sm text-gray-600">
            Step {currentStep} of {STEPS.length}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            {currentStep === 5 ? 'Start Game →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
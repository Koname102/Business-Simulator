// ============================================
// FILE: components/game/AutoSaveManager.tsx
// PURPOSE: Auto-save background process
// ============================================

'use client';

import { useEffect, useRef } from 'react';
import { SaveManager } from '@/lib/save-manager';
import { useGameStore } from '@/store/gameStore';

const AUTOSAVE_INTERVAL = 60000; // 60 seconds

export default function AutoSaveManager() {
  const lastSaveTime = useRef<number>(0);
  const company = useGameStore((state) => state.company);
  
  useEffect(() => {
    // Don't auto-save if paused
    if (!company || company.isPaused) return;
    
    const autoSaveTimer = setInterval(() => {
      const now = Date.now();
      
      // Only save if enough time passed
      if (now - lastSaveTime.current < AUTOSAVE_INTERVAL) {
        return;
      }
      
      // Perform auto-save
      const success = SaveManager.autoSave();
      
      if (success) {
        lastSaveTime.current = now;
        console.log('✅ Auto-saved');
        
        // Optional: Show brief notification
        useGameStore.getState().addNotification({
          type: 'info',
          title: 'Auto-Saved',
          message: 'Your progress has been saved automatically',
        });
      }
    }, 10000); // Check every 10 seconds, save every 60 seconds
    
    return () => clearInterval(autoSaveTimer);
  }, [company]);
  
  // This component doesn't render anything
  return null;
}
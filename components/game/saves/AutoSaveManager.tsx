// ============================================
// FILE: components/game/saves/AutoSaveManager.tsx
// PURPOSE: Auto-save with backup & error recovery + LOGGER
// ============================================

'use client';

import { useEffect, useRef } from 'react';
import { SaveManager } from '@/lib/save-manager';
import { useGameStore } from '@/store/gameStore';
import { logger } from '@/lib/logger'; // ✅ ADD LOGGER

const AUTO_SAVE_INTERVAL = 60_000; // 60 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5_000; // 5 seconds

export function AutoSaveManager() {
  const lastSaveTime = useRef<number>(0);
  const retryCount = useRef<number>(0);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const company = useGameStore((state) => state.company);
  const addNotification = useGameStore((state) => state.addNotification);

  useEffect(() => {
    // Only run if game is initialized
    if (!company) return;

    const interval = setInterval(() => {
      performAutoSave();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      clearInterval(interval);
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, [company]);

  /**
   * Perform auto-save with backup and error recovery
   */
  const performAutoSave = async () => {
    const now = Date.now();

    // Check if enough time has passed
    if (now - lastSaveTime.current < AUTO_SAVE_INTERVAL) {
      return;
    }

    try {
      logger.info('AutoSave', 'Attempting auto-save...');
      
      // ✅ SaveManager.autoSave() now includes backup mechanism
      const success = SaveManager.autoSave();

      if (success) {
        lastSaveTime.current = now;
        retryCount.current = 0; // Reset retry count on success
        
        logger.info('AutoSave', 'Auto-save successful');
        
        // Optional: Show subtle notification (can be disabled)
        // addNotification({
        //   type: 'success',
        //   title: 'Auto-saved',
        //   message: 'Progress saved automatically',
        // });
      } else {
        throw new Error('Auto-save returned false');
      }
      
    } catch (error) {
      logger.error('AutoSave', 'Auto-save failed', error);
      
      // ✅ Attempt retry with exponential backoff
      handleAutoSaveFailure(error);
    }
  };

  /**
   * Handle auto-save failure with retry logic
   */
  const handleAutoSaveFailure = (error: any) => {
    retryCount.current += 1;
    
    if (retryCount.current <= MAX_RETRY_ATTEMPTS) {
      logger.info('AutoSave', `Retry attempt ${retryCount.current}/${MAX_RETRY_ATTEMPTS}...`);
      
      // Exponential backoff: 5s, 10s, 15s
      const delay = RETRY_DELAY * retryCount.current;
      
      retryTimeout.current = setTimeout(() => {
        performAutoSave();
      }, delay);
      
    } else {
      // Max retries exceeded - notify user
      logger.error('AutoSave', 'Max retry attempts exceeded', null, {
        retryCount: retryCount.current,
      });
      
      addNotification({
        type: 'error',
        title: 'Auto-save Failed',
        message: 'Unable to auto-save. Please save manually.',
      });
      
      // Reset retry count for next attempt
      retryCount.current = 0;
    }
  };

  // This component doesn't render anything
  return null;
}

// ✅ Default export untuk compatibility dengan TitleScreen.tsx
export default AutoSaveManager;
// ============================================
// FILE: hooks/useKeyboardShortcuts.ts
// PURPOSE: Keyboard shortcuts for save/load
// ============================================

import { useEffect } from 'react';
import { SaveManager } from '@/lib/save-manager';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S: Quick Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        SaveManager.autoSave();
        console.log('Quick save (Ctrl+S)');
      }
      
      // F5: Quick Save (alternative)
      if (e.key === 'F5') {
        e.preventDefault();
        SaveManager.autoSave();
        console.log('Quick save (F5)');
      }
      
      // F9: Quick Load (from autosave)
      if (e.key === 'F9') {
        e.preventDefault();
        const success = SaveManager.loadGame(0); // Load autosave
        if (success) {
          window.location.reload();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
}
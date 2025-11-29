// ============================================
// FILE: lib/save-manager.ts
// PURPOSE: Save/Load management with automatic backup + LOGGER
// ============================================

import { useGameStore } from '@/store/gameStore';
import type { SaveData, SaveSlot, SaveMetadata, GameState } from '@/lib/types';
import { validateSaveData, isVersionCompatible, sanitizeSaveData } from '@/lib/save-validation';
import { logger } from '@/lib/logger'; // ✅ ADD LOGGER

const GAME_VERSION = '1.0.0';
const MAX_SAVE_SLOTS = 5;

export class SaveManager {
  // ============================================
  // BACKUP MECHANISM (WITH LOGGER)
  // ============================================
  
  /**
   * Create backup of existing save before overwrite
   */
  private static createBackup(slotNumber: number): string | null {
    try {
      const existingKey = `save_slot_${slotNumber}`;
      const backupKey = `backup_save_${slotNumber}`;
      
      const existingData = localStorage.getItem(existingKey);
      
      if (existingData) {
        // Store backup
        localStorage.setItem(backupKey, existingData);
        
        // Store backup metadata
        localStorage.setItem(`${backupKey}_metadata`, JSON.stringify({
          timestamp: Date.now(),
          originalSlot: slotNumber,
          reason: 'Pre-save backup',
        }));
        
        logger.debug('SaveManager', 'Created backup', { slotNumber });
        return backupKey;
      }
      
      return null; // No existing data to backup
    } catch (error) {
      logger.error('SaveManager', 'Failed to create backup', error, { slotNumber });
      return null;
    }
  }
  
  /**
   * Restore from backup if save fails
   */
  private static restoreFromBackup(slotNumber: number): boolean {
    try {
      const backupKey = `backup_save_${slotNumber}`;
      const saveKey = `save_slot_${slotNumber}`;
      
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        logger.warn('SaveManager', 'No backup found to restore', { slotNumber });
        return false;
      }
      
      // Restore backup to main save
      localStorage.setItem(saveKey, backupData);
      
      logger.info('SaveManager', 'Restored from backup', { slotNumber });
      return true;
    } catch (error) {
      logger.error('SaveManager', 'Failed to restore from backup', error, { slotNumber });
      return false;
    }
  }
  
  /**
   * Clear backup after successful save
   */
  private static clearBackup(slotNumber: number): void {
    try {
      const backupKey = `backup_save_${slotNumber}`;
      localStorage.removeItem(backupKey);
      localStorage.removeItem(`${backupKey}_metadata`);
      
      logger.debug('SaveManager', 'Cleared backup', { slotNumber });
    } catch (error) {
      logger.error('SaveManager', 'Failed to clear backup', error, { slotNumber });
    }
  }
  
  /**
   * Get all available backups
   */
  static getAvailableBackups(): Array<{slot: number; timestamp: number; metadata: any}> {
    const backups: Array<{slot: number; timestamp: number; metadata: any}> = [];
    
    for (let slot = 1; slot <= MAX_SAVE_SLOTS; slot++) {
      const backupKey = `backup_save_${slot}`;
      const metadataKey = `${backupKey}_metadata`;
      
      if (localStorage.getItem(backupKey)) {
        try {
          const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}');
          backups.push({
            slot,
            timestamp: metadata.timestamp || Date.now(),
            metadata,
          });
        } catch (error) {
          logger.error('SaveManager', 'Failed to parse backup metadata', error, { slot });
        }
      }
    }
    
    logger.debug('SaveManager', 'Found available backups', { count: backups.length });
    return backups;
  }
  
  /**
   * Manually restore a specific backup (for recovery)
   */
  static manualRestoreBackup(slotNumber: number): boolean {
    logger.info('SaveManager', 'Manual backup restore requested', { slotNumber });
    
    const success = this.restoreFromBackup(slotNumber);
    
    if (success) {
      logger.info('SaveManager', 'Manual backup restore successful', { slotNumber });
      // Don't clear backup after manual restore (keep it for safety)
    }
    
    return success;
  }
  
  // ============================================
  // CORE SAVE/LOAD FUNCTIONS (WITH BACKUP & LOGGER)
  // ============================================
  
  /**
   * Create save data from current game state
   */
  static createSaveData(): SaveData {
    const state = useGameStore.getState();
    
    if (!state.player || !state.company) {
      throw new Error('Cannot create save data: Game not initialized');
    }
    
    const playtime = Math.floor((Date.now() - state.company.foundedAt) / 1000);
    
    // Determine business sub-type
    let businessSubType: any = undefined;
    if (state.company.type === 'fintech') {
      businessSubType = 'fintech-lending';
    } else if (state.company.type === 'insurance') {
      businessSubType = 'life-insurance';
    } else if (state.company.type === 'investment') {
      businessSubType = 'venture-capital';
    }
    
    const saveData: SaveData = {
      version: GAME_VERSION,
      timestamp: Date.now(),
      playtime,
      
      player: state.player,
      company: state.company,
      
      fintech: state.fintech,
      insurance: state.insurance,
      investment: state.investment,
      
      transactions: state.transactions,
      notifications: state.notifications,
      
      gameTime: {
        elapsed: state.company.gameTime,
        isPaused: state.company.isPaused,
        speed: state.gameSpeed,
      },
      
      metadata: {
        slotNumber: 0,
        saveName: 'Auto Save',
        businessType: state.company.type,
        businessSubType,
        difficulty: state.company.difficulty,
        progress: {
          balance: state.company.balance,
          balanceGrowth: ((state.company.balance - state.company.capital) / state.company.capital) * 100,
          level: state.player.level,
          achievements: [],
        },
      },
    };
    
    return saveData;
  }
  
  /**
   * Save game to specific slot WITH BACKUP & LOGGER
   */
  static async saveGame(slotNumber: number, saveName: string): Promise<boolean> {
    try {
      // Validate slot number
      if (slotNumber < 1 || slotNumber > MAX_SAVE_SLOTS) {
        logger.error('SaveManager', 'Invalid slot number', null, { slotNumber });
        return false;
      }
      
      // ✅ STEP 1: Create backup of existing save
      const backupKey = this.createBackup(slotNumber);
      logger.debug('SaveManager', 'Backup status', { 
        backupKey: backupKey || 'none (new save)',
        slotNumber 
      });
      
      try {
        // ✅ STEP 2: Create save data
        const saveData = this.createSaveData();
        saveData.metadata.slotNumber = slotNumber;
        saveData.metadata.saveName = saveName;
        
        // ✅ STEP 3: Validate save data
        const validation = validateSaveData(saveData);
        if (!validation.isValid) {
          throw new Error(`Save data validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        
        // ✅ STEP 4: Save to localStorage
        const saveKey = `save_slot_${slotNumber}`;
        localStorage.setItem(saveKey, JSON.stringify(saveData));
        
        // ✅ STEP 5: Update last saved timestamp
        useGameStore.setState({ lastSaved: Date.now() });
        
        // ✅ STEP 6: Save successful - clear backup
        this.clearBackup(slotNumber);
        
        logger.info('SaveManager', 'Game saved successfully', { 
          slotNumber, 
          saveName,
          balance: saveData.company.balance,
        });
        return true;
        
      } catch (saveError) {
        // ✅ STEP 7: Save failed - restore from backup
        logger.error('SaveManager', 'Save failed, attempting backup restore', saveError, { slotNumber });
        
        if (backupKey) {
          const restored = this.restoreFromBackup(slotNumber);
          if (restored) {
            logger.info('SaveManager', 'Successfully restored from backup after save failure', { slotNumber });
          } else {
            logger.error('SaveManager', 'Failed to restore from backup', null, { slotNumber });
          }
        }
        
        throw saveError;
      }
      
    } catch (error) {
      logger.error('SaveManager', 'Save operation failed', error, { slotNumber, saveName });
      return false;
    }
  }
  
  /**
   * Auto-save to dedicated autosave slot WITH BACKUP & LOGGER
   */
  static autoSave(): boolean {
    try {
      logger.debug('SaveManager', 'Auto-save initiated');
      
      // ✅ Create backup before autosave
      this.createBackup(0); // slot 0 = autosave
      
      const saveData = this.createSaveData();
      saveData.metadata.saveName = 'Auto Save';
      saveData.metadata.slotNumber = 0;
      
      localStorage.setItem('autosave', JSON.stringify(saveData));
      
      // ✅ Clear backup after successful autosave
      this.clearBackup(0);
      
      logger.info('SaveManager', 'Auto-save successful', {
        balance: saveData.company.balance,
        playtime: saveData.playtime,
      });
      return true;
    } catch (error) {
      logger.error('SaveManager', 'Auto-save failed, attempting backup restore', error);
      
      // ✅ Attempt to restore from backup
      this.restoreFromBackup(0);
      
      return false;
    }
  }
  
  /**
   * Load game from slot WITH LOGGER
   */
  static loadGame(slotNumber: number): boolean {
    try {
      logger.info('SaveManager', 'Loading game from slot', { slotNumber });
      
      const saveKey = `save_slot_${slotNumber}`;
      const saveDataStr = localStorage.getItem(saveKey);
      
      if (!saveDataStr) {
        logger.warn('SaveManager', 'No save data found in slot', { slotNumber });
        return false;
      }
      
      const saveData: SaveData = JSON.parse(saveDataStr);
      
      // Validate
      const validation = validateSaveData(saveData);
      if (!validation.isValid) {
        logger.error('SaveManager', 'Invalid save data', null, { 
          slotNumber,
          errors: validation.errors 
        });
        return false;
      }
      
      // Check version compatibility
      if (!isVersionCompatible(saveData.version, GAME_VERSION)) {
        logger.error('SaveManager', 'Incompatible version', null, {
          saveVersion: saveData.version,
          gameVersion: GAME_VERSION,
        });
        return false;
      }
      
      // Sanitize data
      const sanitized = sanitizeSaveData(saveData);
      
      // Load into store
      useGameStore.setState({
        player: sanitized.player,
        company: sanitized.company,
        fintech: sanitized.fintech,
        insurance: sanitized.insurance,
        investment: sanitized.investment,
        transactions: sanitized.transactions,
        notifications: sanitized.notifications,
        lastSaved: saveData.timestamp,
        gameSpeed: saveData.gameTime.speed,
      });
      
      logger.info('SaveManager', 'Game loaded successfully', { 
        slotNumber,
        companyName: sanitized.company.name,
        balance: sanitized.company.balance,
      });
      return true;
    } catch (error) {
      logger.error('SaveManager', 'Load failed', error, { slotNumber });
      return false;
    }
  }
  
  /**
   * Load game and return correct route URL
   */
  static loadGameAndGetURL(slotNumber: number): string | null {
    const success = this.loadGame(slotNumber);
    
    if (!success) return null;
    
    const state = useGameStore.getState();
    const company = state.company;
    
    if (!company) return null;
    
    // Route based on business sub-type
    if (company.type === 'fintech') {
      return '/game/fintech/lending';
    } else if (company.type === 'insurance') {
      return '/game/insurance/life';
    } else if (company.type === 'investment') {
      return '/game/investment/venture';
    }
    
    return '/game';
  }
  
  /**
   * Load autosave and return URL
   */
  static loadAutosaveAndGetURL(): string | null {
    try {
      logger.info('SaveManager', 'Loading autosave');
      
      const saveDataStr = localStorage.getItem('autosave');
      
      if (!saveDataStr) {
        logger.warn('SaveManager', 'No autosave found');
        return null;
      }
      
      const saveData: SaveData = JSON.parse(saveDataStr);
      
      // Same validation & loading as loadGame
      const validation = validateSaveData(saveData);
      if (!validation.isValid) {
        logger.error('SaveManager', 'Invalid autosave data', null, { errors: validation.errors });
        return null;
      }
      
      if (!isVersionCompatible(saveData.version, GAME_VERSION)) {
        logger.error('SaveManager', 'Incompatible autosave version', null, {
          saveVersion: saveData.version,
          gameVersion: GAME_VERSION,
        });
        return null;
      }
      
      const sanitized = sanitizeSaveData(saveData);
      
      useGameStore.setState({
        player: sanitized.player,
        company: sanitized.company,
        fintech: sanitized.fintech,
        insurance: sanitized.insurance,
        investment: sanitized.investment,
        transactions: sanitized.transactions,
        notifications: sanitized.notifications,
        lastSaved: saveData.timestamp,
        gameSpeed: saveData.gameTime.speed,
      });
      
      const company = sanitized.company;
      if (!company) return null;
      
      logger.info('SaveManager', 'Autosave loaded successfully', {
        companyName: company.name,
        balance: company.balance,
      });
      
      if (company.type === 'fintech') {
        return '/game/fintech/lending';
      } else if (company.type === 'insurance') {
        return '/game/insurance/life';
      } else if (company.type === 'investment') {
        return '/game/investment/venture';
      }
      
      return '/game';
    } catch (error) {
      logger.error('SaveManager', 'Autosave load failed', error);
      return null;
    }
  }
  
  // ============================================
  // UTILITY FUNCTIONS (WITH LOGGER)
  // ============================================
  
  /**
   * Check if autosave exists
   */
  static hasAutosave(): boolean {
    return localStorage.getItem('autosave') !== null;
  }
  
  /**
   * Get autosave preview data
   */
  static getAutosavePreview(): any {
    try {
      const saveDataStr = localStorage.getItem('autosave');
      if (!saveDataStr) return null;
      
      const saveData: SaveData = JSON.parse(saveDataStr);
      
      return {
        businessType: saveData.company.type,
        businessSubType: saveData.metadata.businessSubType,
        balance: saveData.company.balance,
        playtime: saveData.playtime,
      };
    } catch (error) {
      logger.error('SaveManager', 'Failed to get autosave preview', error);
      return null;
    }
  }
  
  /**
   * Get all save slots (REQUIRED BY SaveLoadMenu!)
   */
  static getSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const saveKey = `save_slot_${i}`;
      const saveDataStr = localStorage.getItem(saveKey);
      
      if (saveDataStr) {
        try {
          const saveData: SaveData = JSON.parse(saveDataStr);
          
          slots.push({
            slotNumber: i,
            isEmpty: false,
            saveData,
            lastSaved: saveData.timestamp,
            previewData: {
              playerName: saveData.player.name,
              companyName: saveData.company.name,
              balance: saveData.company.balance,
              businessType: saveData.company.type,
              difficulty: saveData.company.difficulty,
              playtime: saveData.playtime,
            },
          });
        } catch (error) {
          logger.error('SaveManager', 'Failed to parse save slot', error, { slot: i });
          slots.push({
            slotNumber: i,
            isEmpty: true,
          });
        }
      } else {
        slots.push({
          slotNumber: i,
          isEmpty: true,
        });
      }
    }
    
    logger.debug('SaveManager', 'Fetched save slots', { 
      totalSlots: slots.length,
      filledSlots: slots.filter(s => !s.isEmpty).length,
    });
    
    return slots;
  }
  
  /**
   * Delete save
   */
  static deleteSave(slotNumber: number): boolean {
    try {
      logger.info('SaveManager', 'Deleting save slot', { slotNumber });
      
      const saveKey = `save_slot_${slotNumber}`;
      localStorage.removeItem(saveKey);
      
      // Also remove backup if exists
      this.clearBackup(slotNumber);
      
      logger.info('SaveManager', 'Save slot deleted successfully', { slotNumber });
      return true;
    } catch (error) {
      logger.error('SaveManager', 'Delete failed', error, { slotNumber });
      return false;
    }
  }
  
  /**
   * Import save from JSON string
   */
  static importSave(slotNumber: number, jsonString: string): boolean {
    try {
      logger.info('SaveManager', 'Importing save', { slotNumber });
      
      const saveData: SaveData = JSON.parse(jsonString);
      
      const validation = validateSaveData(saveData);
      if (!validation.isValid) {
        logger.error('SaveManager', 'Invalid import data', null, { errors: validation.errors });
        return false;
      }
      
      const saveKey = `save_slot_${slotNumber}`;
      localStorage.setItem(saveKey, jsonString);
      
      logger.info('SaveManager', 'Import successful', { slotNumber });
      return true;
    } catch (error) {
      logger.error('SaveManager', 'Import failed', error, { slotNumber });
      return false;
    }
  }
  
  /**
   * Download save file
   */
  static downloadSaveFile(filename: string): void {
    try {
      const saveData = localStorage.getItem(filename);
      if (!saveData) {
        logger.error('SaveManager', 'Save file not found for download', null, { filename });
        return;
      }
      
      const blob = new Blob([saveData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      logger.info('SaveManager', 'Save file downloaded', { filename });
    } catch (error) {
      logger.error('SaveManager', 'Download failed', error, { filename });
    }
  }
  
  /**
   * Format timestamp (REQUIRED BY SaveLoadMenu!)
   */
  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  /**
   * Format playtime (REQUIRED BY SaveLoadMenu!)
   */
  static formatPlaytime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
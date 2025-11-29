// ============================================
// FILE: components/game/saves/SaveLoadMenu.tsx
// PURPOSE: Save/Load UI with backup, recovery, modal support + LOGGER
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SaveManager } from '@/lib/save-manager';
import { useGameStore } from '@/store/gameStore';
import type { SaveSlot } from '@/lib/types';
import { logger } from '@/lib/logger'; // ✅ ADD LOGGER

// ✅ Props interface untuk compatibility dengan TitleScreen
interface SaveLoadMenuProps {
  mode?: 'save' | 'load';
  onClose?: () => void;
  onSuccess?: () => void;
}

function SaveLoadMenu({ 
  mode: initialMode = 'save',
  onClose,
  onSuccess 
}: SaveLoadMenuProps = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<'save' | 'load'>(initialMode);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [saveName, setSaveName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  
  const company = useGameStore((state) => state.company);
  const addNotification = useGameStore((state) => state.addNotification);

  // Load save slots on mount
  useEffect(() => {
    refreshSaveSlots();
  }, []);

  const refreshSaveSlots = () => {
    const slots = SaveManager.getSaveSlots();
    setSaveSlots(slots);
  };

  /**
   * ✅ ERROR RECOVERY: Handle save with backup mechanism
   */
  const handleSave = async () => {
    if (!selectedSlot || !saveName.trim()) {
      addNotification({
        type: 'warning',
        title: 'Input Required',
        message: 'Please select a slot and enter a save name',
      });
      return;
    }

    setIsLoading(true);

    try {
      logger.info('SaveLoadMenu', 'Saving to slot', { slot: selectedSlot, name: saveName });
      
      // ✅ SaveManager.saveGame() includes backup mechanism
      const success = await SaveManager.saveGame(selectedSlot, saveName.trim());

      if (success) {
        logger.info('SaveLoadMenu', 'Save successful', { slot: selectedSlot, name: saveName });
        
        addNotification({
          type: 'success',
          title: 'Game Saved',
          message: `Saved to slot ${selectedSlot}: "${saveName}"`,
        });

        // Refresh slots to show updated save
        refreshSaveSlots();
        
        // Clear inputs
        setSaveName('');
        setSelectedSlot(null);
        
        // ✅ Call onSuccess if provided
        if (onSuccess) {
          onSuccess();
        }
        
      } else {
        throw new Error('SaveManager returned false');
      }
      
    } catch (error) {
      logger.error('SaveLoadMenu', 'Save failed', error, { slot: selectedSlot, name: saveName });
      
      // ✅ ERROR RECOVERY: Attempt to restore from backup
      const restored = SaveManager.manualRestoreBackup(selectedSlot);
      
      if (restored) {
        logger.info('SaveLoadMenu', 'Backup restored after save failure', { slot: selectedSlot });
        
        addNotification({
          type: 'warning',
          title: 'Save Failed - Backup Restored',
          message: 'Your previous save has been restored.',
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Save Failed',
          message: 'Unable to save. Please try again or use a different slot.',
        });
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ✅ ERROR RECOVERY: Handle load with error handling
   */
  const handleLoad = async () => {
    if (!selectedSlot) {
      addNotification({
        type: 'warning',
        title: 'No Slot Selected',
        message: 'Please select a save slot to load',
      });
      return;
    }

    setIsLoading(true);

    try {
      logger.info('SaveLoadMenu', 'Loading slot', { slot: selectedSlot });
      
      const url = SaveManager.loadGameAndGetURL(selectedSlot);

      if (url) {
        logger.info('SaveLoadMenu', 'Load successful, redirecting', { slot: selectedSlot, url });
        
        addNotification({
          type: 'success',
          title: 'Game Loaded',
          message: 'Redirecting to your game...',
        });

        // ✅ Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }

        // Redirect to game page
        setTimeout(() => {
          router.push(url);
        }, 500);
        
      } else {
        throw new Error('Failed to load game');
      }
      
    } catch (error) {
      logger.error('SaveLoadMenu', 'Load failed', error, { slot: selectedSlot });
      
      // ✅ ERROR RECOVERY: Check if backup exists
      const backups = SaveManager.getAvailableBackups();
      const hasBackup = backups.some(b => b.slot === selectedSlot);
      
      if (hasBackup) {
        logger.info('SaveLoadMenu', 'Backup available for failed load', { slot: selectedSlot });
        
        addNotification({
          type: 'error',
          title: 'Load Failed - Backup Available',
          message: 'The save file may be corrupted. Check "Advanced: Backup Recovery" section.',
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Load Failed',
          message: 'Unable to load save. The save file may be corrupted.',
        });
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle delete save
   */
  const handleDelete = async () => {
    if (!selectedSlot) return;

    const confirmed = confirm(`Are you sure you want to delete this save?`);
    if (!confirmed) return;

    try {
      logger.info('SaveLoadMenu', 'Deleting save slot', { slot: selectedSlot });
      
      const success = SaveManager.deleteSave(selectedSlot);

      if (success) {
        logger.info('SaveLoadMenu', 'Save deleted successfully', { slot: selectedSlot });
        
        addNotification({
          type: 'success',
          title: 'Save Deleted',
          message: `Slot ${selectedSlot} has been cleared`,
        });

        refreshSaveSlots();
        setSelectedSlot(null);
      }
      
    } catch (error) {
      logger.error('SaveLoadMenu', 'Delete failed', error, { slot: selectedSlot });
      
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Unable to delete save',
      });
    }
  };

  /**
   * ✅ ERROR RECOVERY: Manually restore backup
   */
  const handleRestoreBackup = (slotNumber: number) => {
    const confirmed = confirm(
      `Restore backup for slot ${slotNumber}? This will overwrite the current save.`
    );
    
    if (!confirmed) return;

    try {
      logger.info('SaveLoadMenu', 'Manually restoring backup', { slot: slotNumber });
      
      const success = SaveManager.manualRestoreBackup(slotNumber);

      if (success) {
        logger.info('SaveLoadMenu', 'Backup restored successfully', { slot: slotNumber });
        
        addNotification({
          type: 'success',
          title: 'Backup Restored',
          message: `Slot ${slotNumber} has been restored from backup`,
        });

        refreshSaveSlots();
      } else {
        addNotification({
          type: 'error',
          title: 'Restore Failed',
          message: 'Unable to restore backup',
        });
      }
      
    } catch (error) {
      logger.error('SaveLoadMenu', 'Backup restore failed', error, { slot: slotNumber });
      
      addNotification({
        type: 'error',
        title: 'Restore Failed',
        message: 'Unable to restore backup',
      });
    }
  };

  /**
   * Get available backups for display
   */
  const getBackups = () => {
    return SaveManager.getAvailableBackups();
  };

  // ✅ Main content component
  const menuContent = (
    <div className="bg-white border-4 border-blue-600 rounded-xl shadow-2xl p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Save / Load Game</h2>
        
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('save')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'save'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Save
            </button>
            <button
              onClick={() => setMode('load')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'load'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Load
            </button>
          </div>
          
          {/* ✅ Close Button (if modal mode) */}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Save name input (only in save mode) */}
      {mode === 'save' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Save Name
          </label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Enter save name..."
            maxLength={50}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Save slots - scrollable */}
      <div className="space-y-2 mb-6 max-h-[60vh] overflow-y-auto pr-2">
        {saveSlots.map((slot) => (
          <div
            key={slot.slotNumber}
            onClick={() => setSelectedSlot(slot.slotNumber)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedSlot === slot.slotNumber
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-gray-50'
            }`}
          >
            {slot.isEmpty ? (
              <div className="text-gray-500 font-medium">
                Slot {slot.slotNumber}: Empty
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-gray-900 text-lg">
                    Slot {slot.slotNumber}: {slot.saveData?.metadata.saveName}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {SaveManager.formatTimestamp(slot.lastSaved || 0)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500 font-medium">Company:</span>{' '}
                    <span className="font-semibold">{slot.previewData?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Balance:</span>{' '}
                    <span className="font-semibold">Rp {slot.previewData?.balance.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Business:</span>{' '}
                    <span className="font-semibold capitalize">{slot.previewData?.businessType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Playtime:</span>{' '}
                    <span className="font-semibold">{SaveManager.formatPlaytime(slot.previewData?.playtime || 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {mode === 'save' ? (
          <>
            <button
              onClick={handleSave}
              disabled={!selectedSlot || !saveName.trim() || isLoading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Game'}
            </button>
            
            {selectedSlot && !saveSlots.find(s => s.slotNumber === selectedSlot)?.isEmpty && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-6 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 transition-colors"
              >
                Delete
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleLoad}
              disabled={!selectedSlot || saveSlots.find(s => s.slotNumber === selectedSlot)?.isEmpty || isLoading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Loading...' : 'Load Game'}
            </button>
            
            {selectedSlot && !saveSlots.find(s => s.slotNumber === selectedSlot)?.isEmpty && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-6 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 transition-colors"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {/* ✅ ERROR RECOVERY: Backup recovery section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={() => setShowBackups(!showBackups)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showBackups ? '▼' : '▶'} Advanced: Backup Recovery
        </button>

        {showBackups && (
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Available Backups</h3>
            
            {getBackups().length === 0 ? (
              <p className="text-sm text-gray-500">No backups available</p>
            ) : (
              <div className="space-y-2">
                {getBackups().map((backup) => (
                  <div
                    key={backup.slot}
                    className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        Slot {backup.slot} Backup
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {SaveManager.formatTimestamp(backup.timestamp)}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRestoreBackup(backup.slot)}
                      className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="mt-3 text-xs text-gray-500">
              ⚠️ Backups are automatically created before saves and cleared after successful saves. 
              Use manual restore only if a save failed and you need to recover.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ✅ Return with modal wrapper if onClose provided, otherwise direct render
  if (onClose) {
    return (
      <div 
        className="fixed inset-0 bg-white z-50 overflow-y-auto p-4"
        onClick={onClose}
      >
        {/* ✅ Scrollable container */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="min-h-screen flex items-center justify-center py-8"
        >
          <div className="w-full max-w-4xl">
            {menuContent}
          </div>
        </div>
      </div>
    );
  }

  return menuContent;
}

// ✅ Default export untuk compatibility dengan TitleScreen.tsx
export default SaveLoadMenu;
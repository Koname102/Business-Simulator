// ============================================
// FILE: components/game/SaveLoadMenu.tsx
// PURPOSE: Save/Load menu UI
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { SaveManager } from '@/lib/save-manager';
import type { SaveSlot } from '@/lib/types';

interface SaveLoadMenuProps {
  mode: 'save' | 'load';
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SaveLoadMenu({ mode, onClose, onSuccess }: SaveLoadMenuProps) {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [saveName, setSaveName] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    refreshSlots();
  }, []);
  
  const refreshSlots = () => {
    const loadedSlots = SaveManager.getSaveSlots();
    setSlots(loadedSlots);
  };
  
  const handleSave = async (slotNumber: number) => {
    const name = saveName || `Save ${slotNumber}`;
    
    setIsSaving(true);
    
    try {
      const success = await SaveManager.saveGame(slotNumber, name);
      
      if (success) {
        refreshSlots();
        if (onSuccess) onSuccess();
        alert(`✅ Game saved to slot ${slotNumber}!\n📁 File saved to: saves/${name.toLowerCase().replace(/\s+/g, '_')}.json`);
      } else {
        alert('❌ Failed to save game. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Error saving game. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLoad = (slotNumber: number) => {
  // Set flag to prevent redirect loop
  sessionStorage.setItem('loading-save', 'true');
  
  // ✅ UPDATED: Get URL from SaveManager (includes sub-type routing)
  const routeURL = SaveManager.loadGameAndGetURL(slotNumber);
  
  if (routeURL) {
    if (onSuccess) onSuccess();
    onClose();
    
    // Small delay to ensure state persisted
    setTimeout(() => {
      window.location.href = routeURL; // ✅ Use returned URL
    }, 100);
  } else {
    sessionStorage.removeItem('loading-save');
    alert('❌ Failed to load game. Save file may be corrupted.');
  }
};
  
  const handleDelete = (slotNumber: number) => {
    const success = SaveManager.deleteSave(slotNumber);
    
    if (success) {
      refreshSlots();
      setShowConfirmDelete(null);
      alert(`✅ Save slot ${slotNumber} deleted.`);
    } else {
      alert('❌ Failed to delete save.');
    }
  };
  
  const handleDownload = (slot: SaveSlot) => {
    if (!slot.saveData) return;
    
    // Get clean filename from save name
    const saveName = slot.saveData.metadata.saveName || `save_${slot.slotNumber}`;
    const cleanName = saveName
      .replace(/[^a-z0-9_-\s]/gi, '_')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_');
    const filename = `${cleanName}.json`;
    
    // Download from server
    SaveManager.downloadSaveFile(filename);
  };
  
  const handleImport = async (slotNumber: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const content = await file.text();
        const success = SaveManager.importSave(slotNumber, content);
        
        if (success) {
          refreshSlots();
          alert(`✅ Save imported to slot ${slotNumber}!`);
        } else {
          alert('❌ Failed to import save. File may be invalid.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('❌ Error importing save. Please check the file format.');
      }
    };
    
    input.click();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'save' ? '💾 Save Game' : '📂 Load Game'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Save Slots */}
        <div className="p-6 space-y-4">
          {slots.map((slot) => (
            <div
              key={slot.slotNumber}
              className={`border-2 rounded-lg p-4 transition-all ${
                selectedSlot === slot.slotNumber
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Slot Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-700">
                      Slot {slot.slotNumber}
                    </div>
                    
                    {slot.isEmpty ? (
                      <span className="text-gray-400 italic">Empty Slot</span>
                    ) : (
                      <>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-semibold">
                          {slot.previewData?.businessType.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {slot.previewData?.difficulty}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {!slot.isEmpty && slot.previewData && (
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <div>
                        <strong>Company:</strong> {slot.previewData.companyName}
                      </div>
                      <div>
                        <strong>Owner:</strong> {slot.previewData.playerName}
                      </div>
                      <div>
                        <strong>Balance:</strong> {formatCurrency(slot.previewData.balance)}
                      </div>
                      <div className="flex gap-4">
                        <span>
                          <strong>Playtime:</strong> {SaveManager.formatPlaytime(slot.previewData.playtime)}
                        </span>
                        {slot.lastSaved && (
                          <span>
                            <strong>Saved:</strong> {SaveManager.formatTimestamp(slot.lastSaved)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {mode === 'save' && selectedSlot === slot.slotNumber && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder={`Save ${slot.slotNumber}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                
                {/* ✅ UPDATED: Actions - with export button in save mode too */}
                <div className="flex gap-2 ml-4">
                  {/* SAVE MODE */}
                  {mode === 'save' && (
                    <>
                      <button
                        onClick={() => setSelectedSlot(slot.slotNumber)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50"
                        disabled={isSaving}
                      >
                        {selectedSlot === slot.slotNumber ? '✓ Selected' : 'Select'}
                      </button>
                      
                      {/* ✅ NEW: Export button for existing saves in save mode */}
                      {!slot.isEmpty && (
                        <button
                          onClick={() => handleDownload(slot)}
                          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Download/Export save file"
                        >
                          ⬇️
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* LOAD MODE - Not Empty */}
                  {mode === 'load' && !slot.isEmpty && (
                    <>
                      <button
                        onClick={() => handleLoad(slot.slotNumber)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDownload(slot)}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Download save file"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(slot.slotNumber)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        title="Delete save"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                  
                  {/* LOAD MODE - Empty Slot */}
                  {mode === 'load' && slot.isEmpty && (
                    <button
                      onClick={() => handleImport(slot.slotNumber)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Import
                    </button>
                  )}
                </div>
              </div>
              
              {/* Confirm Delete */}
              {showConfirmDelete === slot.slotNumber && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 font-semibold mb-2">
                    Are you sure you want to delete this save?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(slot.slotNumber)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-semibold"
            disabled={isSaving}
          >
            Cancel
          </button>
          
          {mode === 'save' && selectedSlot !== null && (
            <button
              onClick={() => handleSave(selectedSlot)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                `Save to Slot ${selectedSlot}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
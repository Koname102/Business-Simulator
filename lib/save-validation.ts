import type { GameState } from '@/lib/types';
import { ValidationResult, ValidationError } from '@/lib/validation';

/**
 * Validate save data structure
 */
export function validateSaveData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check required fields
  if (!data.version) {
    errors.push({
      type: 'REQUIRED',
      field: 'version',
      message: 'Save data missing version field',
    });
  }
  
  if (!data.player) {
    errors.push({
      type: 'REQUIRED',
      field: 'player',
      message: 'Save data missing player',
    });
  }
  
  if (!data.company) {
    errors.push({
      type: 'REQUIRED',
      field: 'company',
      message: 'Save data missing company',
    });
  }
  
  // Validate player structure
  if (data.player) {
    if (!data.player.id || !data.player.name) {
      errors.push({
        type: 'INVALID_FORMAT',
        field: 'player',
        message: 'Player data incomplete',
      });
    }
  }
  
  // Validate company structure
  if (data.company) {
    if (!data.company.id || !data.company.name || typeof data.company.balance !== 'number') {
      errors.push({
        type: 'INVALID_FORMAT',
        field: 'company',
        message: 'Company data incomplete or corrupt',
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check version compatibility
 */
export function isVersionCompatible(saveVersion: string, currentVersion: string): boolean {
  // For now, only allow loading same or older versions
  // v0.0.2 can load v0.0.1, but not v0.0.3
  
  const saveParts = saveVersion.split('.').map(Number);
  const currentParts = currentVersion.split('.').map(Number);
  
  // Major version must match
  if (saveParts[0] !== currentParts[0]) return false;
  
  // Minor version: current >= save
  if (currentParts[1] < saveParts[1]) return false;
  
  return true;
}

/**
 * Sanitize corrupt data
 */
export function sanitizeSaveData(data: any): GameState {
  return {
    player: data.player || null,
    company: data.company || null,
    fintech: data.fintech || undefined,
    insurance: data.insurance || undefined,
    investment: data.investment || undefined,
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    lastSaved: typeof data.lastSaved === 'number' ? data.lastSaved : Date.now(),
    version: data.version || '0.0.0',
  };
}
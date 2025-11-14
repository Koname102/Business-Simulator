// ============================================
// FILE: lib/save-manager.ts (UPDATED WITH SUB-TYPE SUPPORT)
// ============================================

import type { SaveData, SaveSlot, SaveMetadata, BusinessSubType } from "@/lib/types";
import { useGameStore } from "@/store/gameStore";

const SAVE_VERSION = "1.0.0";
const MAX_SAVE_SLOTS = 5;
const AUTOSAVE_SLOT = "autosave";

export class SaveManager {
  /**
   * Get all save slots with metadata
   */
  static getSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];

    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const slotKey = `save_slot_${i}`;
      const saveDataRaw = localStorage.getItem(slotKey);

      if (!saveDataRaw) {
        slots.push({
          slotNumber: i,
          isEmpty: true,
        });
      } else {
        try {
          const saveData: SaveData = JSON.parse(saveDataRaw);

          if (!this.validateSaveData(saveData)) {
            console.error(`Invalid save data in slot ${i}`);
            slots.push({
              slotNumber: i,
              isEmpty: true,
            });
            continue;
          }

          slots.push({
            slotNumber: i,
            isEmpty: false,
            saveData,
            lastSaved: saveData.timestamp,
            previewData: {
              playerName: saveData.player.name,
              companyName: saveData.company.name,
              balance: saveData.company.balance,
              businessType: saveData.metadata.businessSubType || saveData.metadata.businessType, // ✅ Show sub-type
              difficulty: saveData.company.difficulty,
              playtime: saveData.playtime,
            },
          });
        } catch (error) {
          console.error(`Error parsing save slot ${i}:`, error);
          slots.push({
            slotNumber: i,
            isEmpty: true,
          });
        }
      }
    }

    return slots;
  }

  /**
   * ✅ FIXED: Detect business sub-type with correct return type
   */
  private static detectBusinessSubType(): BusinessSubType | undefined {
    const state = useGameStore.getState();
    const company = state.company;
    
    if (!company) return undefined;
    
    // Detect based on business type and current state
    if (company.type === 'fintech') {
      return 'fintech-lending'; // ✅ Literal type
    }
    
    if (company.type === 'insurance') {
      // Check if life insurance (has LifeInsurancePolicy with healthStatus)
      if (state.insurance?.currentPolicies && state.insurance.currentPolicies.length > 0) {
        const firstPolicy = state.insurance.currentPolicies[0];
        if ('healthStatus' in firstPolicy) {
          return 'life-insurance'; // ✅ Literal type
        }
      }
      return 'life-insurance'; // ✅ Default to life insurance
    }
    
    if (company.type === 'investment') {
      return 'venture-capital'; // ✅ Literal type
    }
    
    return undefined;
  }

  /**
   * Save current game state to slot
   */
  static async saveGame(slotNumber: number, saveName?: string): Promise<boolean> {
    try {
      const state = useGameStore.getState();

      if (!state.player || !state.company) {
        console.error("Cannot save: Missing player or company data");
        return false;
      }

      const businessType = state.company.type;
      const businessSubType = this.detectBusinessSubType(); // ✅ Detect sub-type

      if (!businessType) {
        console.error("Cannot save: No business type active");
        return false;
      }

      const playtime = state.gameTime || 0;
      const startingBalance = this.getStartingBalance(state.company.difficulty);
      const balanceGrowth =
        ((state.company.balance - startingBalance) / startingBalance) * 100;

      const saveData: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        playtime,
        player: state.player,
        company: state.company,
        fintech: state.fintech || undefined,
        insurance: state.insurance || undefined,
        investment: state.investment || undefined,
        transactions: state.transactions || [],
        notifications: state.notifications || [],
        gameTime: {
          elapsed: state.gameTime || 0,
          isPaused: state.company.isPaused,
          speed: state.gameSpeed || 1,
        },
        metadata: {
          slotNumber,
          saveName: saveName || `Save ${slotNumber}`,
          businessType,
          businessSubType, // ✅ Save sub-type
          difficulty: state.company.difficulty,
          progress: {
            balance: state.company.balance,
            balanceGrowth,
            level: 1,
            achievements: [],
          },
        },
      };

      // Save to localStorage
      const slotKey = slotNumber === 0 ? AUTOSAVE_SLOT : `save_slot_${slotNumber}`;
      localStorage.setItem(slotKey, JSON.stringify(saveData));

      // Save to server
      if (slotNumber !== 0) {
        try {
          const filename = (saveName || `save_${slotNumber}`)
            .replace(/[^a-z0-9_-\s]/gi, "_")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_");
          
          const response = await fetch("/api/saves/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, data: saveData }),
          });

          if (!response.ok) {
            console.error("Server save failed:", response.statusText);
          } else {
            const result = await response.json();
            if (result.success) {
              console.log(`✅ Game saved to server: ${result.path}`);
            }
          }
        } catch (error) {
          console.error("Error saving to server:", error);
        }
      }

      console.log(
        `✅ Game saved to slot ${slotNumber} (Type: ${businessType}, SubType: ${businessSubType})`
      );
      return true;
    } catch (error) {
      console.error("Error saving game:", error);
      return false;
    }
  }

  /**
   * Auto-save to special autosave slot
   */
  static async autoSave(): Promise<boolean> {
    return await this.saveGame(0, "AutoSave");
  }

  /**
   * ✅ FIXED: Get route URL with correct typing
   */
  private static getRouteFromSubType(
    businessType: string,
    businessSubType?: BusinessSubType // ✅ Use BusinessSubType type
  ): string {
    // If sub-type specified, use that
    if (businessSubType) {
      const subTypeRoutes: Record<BusinessSubType, string> = { // ✅ Correct Record type
        'fintech-lending': '/game/fintech',
        'life-insurance': '/game/insurance/life',
        'health-insurance': '/game/insurance/health',
        'venture-capital': '/game/investment',
      };
      
      return subTypeRoutes[businessSubType];
    }
    
    // Fallback to business type
    const typeRoutes: Record<string, string> = {
      fintech: '/game/fintech',
      insurance: '/game/insurance/life', // ✅ Default to life insurance
      investment: '/game/investment',
    };
    
    return typeRoutes[businessType] || '/';
  }

  /**
   * ✅ UPDATED: Load game and return route URL
   */
  static loadGameAndGetURL(slotNumber: number): string | null {
    try {
      const slotKey = slotNumber === 0 ? AUTOSAVE_SLOT : `save_slot_${slotNumber}`;
      const saveDataRaw = localStorage.getItem(slotKey);

      if (!saveDataRaw) {
        console.error(`No save data found in slot ${slotNumber}`);
        return null;
      }

      const saveData: SaveData = JSON.parse(saveDataRaw);

      if (!this.validateSaveData(saveData)) {
        console.error(`Invalid save data in slot ${slotNumber}`);
        return null;
      }

      const migratedData = this.migrateSaveData(saveData);
      const state = useGameStore.getState();

      // Load game state
      state.setPlayer(migratedData.player);
      state.setCompany(migratedData.company);

      if (migratedData.fintech) {
        useGameStore.setState({ fintech: migratedData.fintech });
      }
      if (migratedData.insurance) {
        useGameStore.setState({ insurance: migratedData.insurance });
      }
      if (migratedData.investment) {
        useGameStore.setState({ investment: migratedData.investment });
      }

      useGameStore.setState({
        transactions: migratedData.transactions,
        notifications: migratedData.notifications,
        gameTime: migratedData.gameTime.elapsed,
        gameSpeed: migratedData.gameTime.speed,
      });

      if (migratedData.gameTime.isPaused) {
        state.pauseGame();
      } else {
        state.resumeGame();
      }

      // ✅ Get route from sub-type
      const route = this.getRouteFromSubType(
        migratedData.metadata.businessType,
        migratedData.metadata.businessSubType
      );

      console.log(
        `✅ Game loaded from slot ${slotNumber} (Type: ${migratedData.metadata.businessType}, SubType: ${migratedData.metadata.businessSubType})`
      );
      console.log(`✅ Routing to: ${route}`);

      return route;
    } catch (error) {
      console.error("Error loading game:", error);
      return null;
    }
  }

  /**
   * Load game from slot (backward compatibility)
   */
  static loadGame(slotNumber: number): boolean {
    return this.loadGameAndGetURL(slotNumber) !== null;
  }

  /**
   * Delete save from slot
   */
  static deleteSave(slotNumber: number): boolean {
    try {
      const slotKey = `save_slot_${slotNumber}`;
      localStorage.removeItem(slotKey);
      console.log(`✅ Save slot ${slotNumber} deleted`);
      return true;
    } catch (error) {
      console.error("Error deleting save:", error);
      return false;
    }
  }

  /**
   * Validate save data integrity
   */
  private static validateSaveData(saveData: any): boolean {
    if (!saveData.version) return false;
    if (!saveData.timestamp) return false;
    if (!saveData.player) return false;
    if (!saveData.company) return false;
    if (!saveData.metadata) return false;

    if (!saveData.fintech && !saveData.insurance && !saveData.investment) {
      return false;
    }

    return true;
  }

  /**
   * ✅ FIXED: Migrate old save format
   */
  private static migrateSaveData(saveData: SaveData): SaveData {
    if (saveData.version === SAVE_VERSION) {
      return saveData;
    }

    console.log(
      `Migrating save from version ${saveData.version} to ${SAVE_VERSION}`
    );
    const migratedData = { ...saveData };
    migratedData.version = SAVE_VERSION;
    
    // ✅ Migrate: Add businessSubType if missing (with correct typing)
    if (!migratedData.metadata.businessSubType) {
      if (migratedData.metadata.businessType === 'insurance') {
        migratedData.metadata.businessSubType = 'life-insurance' as BusinessSubType;
      } else if (migratedData.metadata.businessType === 'fintech') {
        migratedData.metadata.businessSubType = 'fintech-lending' as BusinessSubType;
      } else if (migratedData.metadata.businessType === 'investment') {
        migratedData.metadata.businessSubType = 'venture-capital' as BusinessSubType;
      }
    }
    
    return migratedData;
  }

  /**
   * Download save file from server
   */
  static downloadSaveFile(filename: string): void {
    try {
      const downloadUrl = `/api/saves/download?filename=${encodeURIComponent(filename)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`✅ Downloading: ${filename}`);
    } catch (error) {
      console.error('Error downloading save file:', error);
    }
  }

  /**
   * Export save to browser download
   */
  static exportSave(slotNumber: number): void {
    const slotKey = `save_slot_${slotNumber}`;
    const saveDataRaw = localStorage.getItem(slotKey);

    if (!saveDataRaw) {
      console.error(`No save data in slot ${slotNumber}`);
      return;
    }

    const saveData = JSON.parse(saveDataRaw);
    const prettyJSON = JSON.stringify(saveData, null, 2);

    const blob = new Blob([prettyJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-simulator-save-${slotNumber}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`✅ Save exported from slot ${slotNumber}`);
  }

  /**
   * Import save from file
   */
  static importSave(slotNumber: number, fileContent: string): boolean {
    try {
      const saveData: SaveData = JSON.parse(fileContent);

      if (!this.validateSaveData(saveData)) {
        console.error("Invalid save file");
        return false;
      }

      saveData.metadata.slotNumber = slotNumber;

      const slotKey = `save_slot_${slotNumber}`;
      localStorage.setItem(slotKey, JSON.stringify(saveData));

      console.log(`✅ Save imported to slot ${slotNumber}`);
      return true;
    } catch (error) {
      console.error("Error importing save:", error);
      return false;
    }
  }

  /**
   * Check if autosave exists
   */
  static hasAutosave(): boolean {
    const autosave = localStorage.getItem(AUTOSAVE_SLOT);
    return !!autosave;
  }

  /**
   * ✅ FIXED: Get autosave preview with correct typing
   */
  static getAutosavePreview(): {
    businessType: string;
    businessSubType?: BusinessSubType; // ✅ Use BusinessSubType type
    balance: number;
    playtime: number;
  } | null {
    const autosave = localStorage.getItem(AUTOSAVE_SLOT);
    if (!autosave) return null;

    try {
      const saveData: SaveData = JSON.parse(autosave);
      return {
        businessType: saveData.metadata.businessType,
        businessSubType: saveData.metadata.businessSubType,
        balance: saveData.company.balance,
        playtime: saveData.playtime,
      };
    } catch {
      return null;
    }
  }

  /**
   * ✅ UPDATED: Load autosave and get redirect URL
   */
  static loadAutosaveAndGetURL(): string | null {
    return this.loadGameAndGetURL(0);
  }

  /**
   * Helper: Get starting balance based on difficulty
   */
  private static getStartingBalance(difficulty: string): number {
    const startingBalances = {
      easy: 150_000_000,
      medium: 100_000_000,
      hard: 75_000_000,
    };
    return (
      startingBalances[difficulty as keyof typeof startingBalances] ||
      100_000_000
    );
  }

  /**
   * Helper: Format playtime for display
   */
  static formatPlaytime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Helper: Format timestamp for display
   */
  static formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
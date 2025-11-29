// ============================================
// FILE: lib/notifications-with-recovery.ts
// PURPOSE: Enhanced notification system with recovery suggestions
// USAGE: Guide users to recover from errors with actionable steps
// ============================================

import type { NotificationType } from '@/lib/types';

export interface RecoveryAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

export interface RecoverySuggestion {
  icon: string;
  text: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface NotificationWithRecovery {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  
  // Recovery features
  suggestions?: RecoverySuggestion[];
  actions?: RecoveryAction[];
  helpUrl?: string;
  
  // Analytics
  errorCode?: string;
  context?: string;
}

// ============================================
// RECOVERY SUGGESTION TEMPLATES
// ============================================

export const RECOVERY_SUGGESTIONS = {
  // Balance/Financial Issues
  INSUFFICIENT_BALANCE: [
    { icon: '💡', text: 'Approve loans dengan jumlah lebih kecil', priority: 'high' as const },
    { icon: '💰', text: 'Tunggu repayment dari borrower aktif', priority: 'high' as const },
    { icon: '📉', text: 'Kurangi pengeluaran operasional', priority: 'medium' as const },
    { icon: '📊', text: 'Review cash flow di halaman dashboard', priority: 'low' as const },
  ],
  
  // Array/Data Issues
  EMPTY_ARRAY: [
    { icon: '⏳', text: 'Tunggu aplikasi baru masuk', priority: 'high' as const },
    { icon: '🔄', text: 'Refresh halaman untuk load data terbaru', priority: 'high' as const },
    { icon: '⚙️', text: 'Periksa pengaturan game untuk enable auto-generate', priority: 'medium' as const },
  ],
  
  // Save/Load Issues
  SAVE_FAILED: [
    { icon: '🔄', text: 'Coba save lagi dalam beberapa detik', priority: 'high' as const },
    { icon: '💾', text: 'Gunakan slot save yang berbeda', priority: 'high' as const },
    { icon: '🗑️', text: 'Hapus save lama untuk free up space', priority: 'medium' as const },
    { icon: '📤', text: 'Export save data sebagai backup', priority: 'low' as const },
  ],
  
  LOAD_FAILED: [
    { icon: '🔄', text: 'Coba load save yang berbeda', priority: 'high' as const },
    { icon: '⏮️', text: 'Restore dari backup otomatis', priority: 'high' as const },
    { icon: '🆕', text: 'Mulai game baru jika save corrupt', priority: 'medium' as const },
    { icon: '📥', text: 'Import save dari backup manual', priority: 'low' as const },
  ],
  
  // Validation Issues
  INVALID_INPUT: [
    { icon: '✏️', text: 'Periksa kembali input yang Anda masukkan', priority: 'high' as const },
    { icon: '📋', text: 'Pastikan semua field required terisi', priority: 'high' as const },
    { icon: '🔢', text: 'Gunakan format angka yang benar', priority: 'medium' as const },
    { icon: '📖', text: 'Baca panduan input untuk detail', priority: 'low' as const },
  ],
  
  // Business Logic Issues
  LOAN_DEFAULT: [
    { icon: '📊', text: 'Review credit score borrower sebelum approve', priority: 'high' as const },
    { icon: '💵', text: 'Approve loan dengan jumlah lebih kecil', priority: 'high' as const },
    { icon: '📈', text: 'Tingkatkan diversifikasi portfolio', priority: 'medium' as const },
    { icon: '🎯', text: 'Target borrower dengan low risk profile', priority: 'medium' as const },
  ],
  
  CLAIM_EXCEEDED: [
    { icon: '📄', text: 'Periksa coverage amount policy', priority: 'high' as const },
    { icon: '💰', text: 'Adjust claim amount sesuai coverage', priority: 'high' as const },
    { icon: '📋', text: 'Review policy terms untuk detail', priority: 'medium' as const },
  ],
  
  INVESTMENT_LOSS: [
    { icon: '📊', text: 'Diversifikasi portfolio untuk reduce risk', priority: 'high' as const },
    { icon: '🎯', text: 'Focus pada startup dengan track record baik', priority: 'high' as const },
    { icon: '💡', text: 'Analisa market conditions sebelum invest', priority: 'medium' as const },
    { icon: '📈', text: 'Review historical performance startups', priority: 'medium' as const },
  ],
  
  // System Issues
  DIVISION_BY_ZERO: [
    { icon: '🔧', text: 'Sistem akan skip kalkulasi ini', priority: 'high' as const },
    { icon: '📊', text: 'Data akan diupdate di cycle berikutnya', priority: 'medium' as const },
    { icon: '🔄', text: 'Refresh halaman untuk reset state', priority: 'low' as const },
  ],
  
  GENERAL_ERROR: [
    { icon: '🔄', text: 'Coba lagi dalam beberapa detik', priority: 'high' as const },
    { icon: '💾', text: 'Save game Anda untuk prevent data loss', priority: 'high' as const },
    { icon: '🔙', text: 'Kembali ke halaman sebelumnya', priority: 'medium' as const },
    { icon: '📞', text: 'Laporkan bug ini ke developer', priority: 'low' as const },
  ],
};

// ============================================
// RECOVERY ACTION BUILDERS
// ============================================

export const RECOVERY_ACTIONS = {
  /**
   * Action: Navigate to page
   */
  navigateTo: (label: string, path: string, router: any): RecoveryAction => ({
    label,
    action: () => router.push(path),
    primary: false,
  }),
  
  /**
   * Action: Retry operation
   */
  retry: (label: string, operation: () => void): RecoveryAction => ({
    label,
    action: operation,
    primary: true,
  }),
  
  /**
   * Action: Dismiss notification
   */
  dismiss: (label: string, dismissFn: () => void): RecoveryAction => ({
    label,
    action: dismissFn,
    primary: false,
  }),
  
  /**
   * Action: Open help documentation
   */
  openHelp: (label: string, helpUrl: string): RecoveryAction => ({
    label,
    action: () => window.open(helpUrl, '_blank'),
    primary: false,
  }),
  
  /**
   * Action: Export data
   */
  exportData: (label: string, exportFn: () => void): RecoveryAction => ({
    label,
    action: exportFn,
    primary: false,
  }),
};

// ============================================
// NOTIFICATION BUILDER WITH RECOVERY
// ============================================

export class NotificationBuilder {
  private notification: Partial<NotificationWithRecovery> = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    suggestions: [],
    actions: [],
  };
  
  constructor(type: NotificationType) {
    this.notification.type = type;
  }
  
  setTitle(title: string): this {
    this.notification.title = title;
    return this;
  }
  
  setMessage(message: string): this {
    this.notification.message = message;
    return this;
  }
  
  setErrorCode(code: string): this {
    this.notification.errorCode = code;
    return this;
  }
  
  setContext(context: string): this {
    this.notification.context = context;
    return this;
  }
  
  addSuggestions(suggestionKey: keyof typeof RECOVERY_SUGGESTIONS): this {
    const suggestions = RECOVERY_SUGGESTIONS[suggestionKey];
    this.notification.suggestions = [
      ...(this.notification.suggestions || []),
      ...suggestions,
    ];
    return this;
  }
  
  addCustomSuggestion(icon: string, text: string, priority: 'high' | 'medium' | 'low' = 'medium'): this {
    this.notification.suggestions = [
      ...(this.notification.suggestions || []),
      { icon, text, priority },
    ];
    return this;
  }
  
  addAction(action: RecoveryAction): this {
    this.notification.actions = [
      ...(this.notification.actions || []),
      action,
    ];
    return this;
  }
  
  setHelpUrl(url: string): this {
    this.notification.helpUrl = url;
    return this;
  }
  
  build(): NotificationWithRecovery {
    if (!this.notification.title || !this.notification.message) {
      throw new Error('Title and message are required');
    }
    
    return this.notification as NotificationWithRecovery;
  }
}

// ============================================
// INTEGRATION WITH EXISTING NOTIFICATION SYSTEM
// ============================================

/**
 * Helper: Convert NotificationWithRecovery to standard Notification
 * (For backward compatibility with existing notification system)
 */
export function toStandardNotification(notif: NotificationWithRecovery): any {
  return {
    id: notif.id,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    timestamp: notif.timestamp,
  };
}

/**
 * Helper: Add notification with recovery to game store
 */
export function addNotificationWithRecovery(
  addNotification: (notif: any) => void,
  notification: NotificationWithRecovery
): void {
  // Store full notification with recovery data
  addNotification({
    ...notification,
    // Add recovery UI metadata
    hasRecovery: (notification.suggestions?.length || 0) > 0 || (notification.actions?.length || 0) > 0,
  });
}
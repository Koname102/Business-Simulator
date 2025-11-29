// ============================================
// FILE: lib/error-tracker.ts
// PURPOSE: Error tracking and analytics for production monitoring
// USAGE: Track errors, generate analytics, integrate with services
// ============================================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorEvent {
  // Identifiers
  id: string;
  timestamp: number;
  
  // Error details
  type: string;
  code?: string;
  message: string;
  severity: ErrorSeverity;
  
  // Context
  context: string; // e.g., 'Fintech', 'Insurance', 'SaveManager'
  operation: string; // e.g., 'approveLoan', 'savegame'
  userId?: string;
  sessionId?: string;
  
  // State
  gameState?: {
    businessType?: string;
    difficulty?: string;
    balance?: number;
    gameTime?: number;
  };
  
  // Technical details
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  
  // Additional data
  metadata?: Record<string, any>;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByContext: Record<string, number>;
  recentErrors: ErrorEvent[];
}

class ErrorTracker {
  private events: ErrorEvent[] = [];
  private maxEvents: number = 100;
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }
  
  /**
   * Track an error event
   */
  track(
    type: string,
    message: string,
    context: string,
    operation: string,
    options?: {
      code?: string;
      severity?: ErrorSeverity;
      metadata?: Record<string, any>;
      stackTrace?: string;
    }
  ): void {
    const event: ErrorEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      code: options?.code,
      message,
      severity: options?.severity || this.inferSeverity(type, context),
      context,
      operation,
      sessionId: this.sessionId,
      stackTrace: options?.stackTrace,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      metadata: options?.metadata,
    };
    
    // Add to events
    this.events.push(event);
    
    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Persist to localStorage
    this.saveToStorage();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', {
        type,
        message,
        context,
        operation,
        severity: event.severity,
      });
    }
    
    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(event);
    }
  }
  
  /**
   * Track with game state context
   */
  trackWithGameState(
    type: string,
    message: string,
    context: string,
    operation: string,
    gameState: any,
    options?: {
      code?: string;
      severity?: ErrorSeverity;
      metadata?: Record<string, any>;
    }
  ): void {
    const event: ErrorEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      code: options?.code,
      message,
      severity: options?.severity || this.inferSeverity(type, context),
      context,
      operation,
      sessionId: this.sessionId,
      gameState: {
        businessType: gameState.company?.businessType,
        difficulty: gameState.company?.difficulty,
        balance: gameState.company?.balance,
        gameTime: gameState.currentTime,
      },
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      metadata: options?.metadata,
    };
    
    this.events.push(event);
    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    this.saveToStorage();
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', {
        type,
        message,
        context,
        operation,
        severity: event.severity,
        balance: gameState.company?.balance,
      });
    }
    
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(event);
    }
  }
  
  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    const stats: ErrorStats = {
      totalErrors: this.events.length,
      errorsByType: {},
      errorsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      errorsByContext: {},
      recentErrors: this.events.slice(-10),
    };
    
    // Count by type
    this.events.forEach(event => {
      stats.errorsByType[event.type] = (stats.errorsByType[event.type] || 0) + 1;
      stats.errorsBySeverity[event.severity]++;
      stats.errorsByContext[event.context] = (stats.errorsByContext[event.context] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorEvent[] {
    return this.events.filter(e => e.severity === severity);
  }
  
  /**
   * Get errors by context
   */
  getErrorsByContext(context: string): ErrorEvent[] {
    return this.events.filter(e => e.context === context);
  }
  
  /**
   * Get errors by type
   */
  getErrorsByType(type: string): ErrorEvent[] {
    return this.events.filter(e => e.type === type);
  }
  
  /**
   * Get recent errors (last N)
   */
  getRecentErrors(count: number = 10): ErrorEvent[] {
    return this.events.slice(-count);
  }
  
  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
    this.saveToStorage();
  }
  
  /**
   * Export events as JSON
   */
  export(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportedAt: Date.now(),
      events: this.events,
      stats: this.getStats(),
    }, null, 2);
  }
  
  /**
   * Infer error severity based on type and context
   */
  private inferSeverity(type: string, context: string): ErrorSeverity {
    // Critical errors
    if (type.includes('CRASH') || type.includes('FATAL')) return 'critical';
    if (type === 'SAVE_FAILED' || type === 'DATA_CORRUPTION') return 'critical';
    
    // High severity
    if (type === 'BALANCE_ERROR' || type === 'STATE_ERROR') return 'high';
    if (type === 'INSUFFICIENT_BALANCE') return 'high';
    
    // Medium severity
    if (type === 'VALIDATION_ERROR') return 'medium';
    if (type === 'OPERATION_FAILED') return 'medium';
    
    // Low severity (default)
    return 'low';
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Save events to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('error-tracker-events', JSON.stringify({
        sessionId: this.sessionId,
        events: this.events,
      }));
    } catch (error) {
      console.error('Failed to save error events to localStorage:', error);
    }
  }
  
  /**
   * Load events from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('error-tracker-events');
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
      }
    } catch (error) {
      console.error('Failed to load error events from localStorage:', error);
    }
  }
  
  /**
   * Send error to analytics service (Sentry, LogRocket, etc.)
   */
  private sendToAnalytics(event: ErrorEvent): void {
    // Integration with analytics service
    // Example: Sentry.captureException()
    
    // Placeholder for now
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // Google Analytics
      (window as any).gtag('event', 'exception', {
        description: event.message,
        fatal: event.severity === 'critical',
        event_category: event.context,
        event_label: event.operation,
      });
    }
    
    // TODO: Add Sentry integration
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureException(new Error(event.message), {
    //     tags: {
    //       context: event.context,
    //       operation: event.operation,
    //       severity: event.severity,
    //     },
    //     extra: {
    //       gameState: event.gameState,
    //       metadata: event.metadata,
    //     },
    //   });
    // }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();
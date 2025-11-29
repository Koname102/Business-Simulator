// ============================================
// FILE: lib/logger.ts
// PURPOSE: Centralized logging system with context and timestamps
// USAGE: Replace all console.log/error with logger methods
// ============================================

/**
 * Log levels for categorization
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  timestamp: string;
  error?: Error;
}

/**
 * Centralized Logger
 * 
 * Features:
 * - Context-aware logging (know which component/function logged)
 * - Timestamps for all logs
 * - Environment-aware (debug only in dev)
 * - Error tracking with stack traces
 * - Structured data logging
 * 
 * @example
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('SaveManager', 'Saving game to slot 1');
 * logger.error('LoanApproval', 'Failed to approve loan', error);
 * logger.debug('Validation', 'Checking balance', { balance: 1000 });
 */
export const logger = {
  /**
   * Debug logging (development only)
   * Use for: Detailed debugging info, variable dumps, flow tracking
   */
  debug: (context: string, message: string, data?: any): void => {
    if (process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', context, message, data);
      console.debug(`[DEBUG][${entry.context}] ${entry.message}`, data || '');
    }
  },

  /**
   * Info logging
   * Use for: Normal operations, user actions, state changes
   */
  info: (context: string, message: string, data?: any): void => {
    const entry = createLogEntry('info', context, message, data);
    console.log(`[INFO][${entry.context}] ${entry.message}`, data ? data : '');
  },

  /**
   * Warning logging
   * Use for: Potential issues, deprecations, fallbacks used
   */
  warn: (context: string, message: string, data?: any): void => {
    const entry = createLogEntry('warn', context, message, data);
    console.warn(`[WARN][${entry.context}] ${entry.message}`, data ? data : '');
  },

  /**
   * Error logging
   * Use for: Errors, exceptions, critical failures
   */
  error: (context: string, message: string, error?: Error | any, data?: any): void => {
    const entry = createLogEntry('error', context, message, data, error);
    
    console.error(`[ERROR][${entry.context}] ${entry.message}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      data: data || undefined,
      timestamp: entry.timestamp,
    });
  },

  /**
   * Operation logging (info + performance)
   * Use for: Track operation start/end with duration
   */
  operation: (context: string, operation: string): OperationLogger => {
    const startTime = Date.now();
    logger.info(context, `${operation} - Started`);
    
    return {
      success: (message?: string, data?: any) => {
        const duration = Date.now() - startTime;
        logger.info(context, `${operation} - Success (${duration}ms)`, {
          ...data,
          duration,
          message: message || 'Operation completed successfully',
        });
      },
      
      failure: (error: Error | any, data?: any) => {
        const duration = Date.now() - startTime;
        logger.error(context, `${operation} - Failed (${duration}ms)`, error, {
          ...data,
          duration,
        });
      },
    };
  },
};

/**
 * Operation logger interface for tracking operation lifecycle
 */
interface OperationLogger {
  success: (message?: string, data?: any) => void;
  failure: (error: Error | any, data?: any) => void;
}

/**
 * Create structured log entry
 */
function createLogEntry(
  level: LogLevel,
  context: string,
  message: string,
  data?: any,
  error?: Error
): LogEntry {
  return {
    level,
    context,
    message,
    data,
    timestamp: new Date().toISOString(),
    error,
  };
}

/**
 * Context-specific loggers for common use cases
 */
export const loggers = {
  /**
   * Save/Load operations
   */
  saveLoad: {
    save: (slot: number, name: string) => 
      logger.info('SaveLoad', `Saving to slot ${slot}: "${name}"`),
    load: (slot: number) => 
      logger.info('SaveLoad', `Loading from slot ${slot}`),
    autoSave: () => 
      logger.info('SaveLoad', 'Auto-save triggered'),
    error: (operation: string, error: Error) => 
      logger.error('SaveLoad', `${operation} failed`, error),
  },

  /**
   * Fintech operations
   */
  fintech: {
    loanApproved: (loanId: string, amount: number) => 
      logger.info('Fintech', `Loan approved: ${loanId}`, { amount }),
    loanRejected: (loanId: string, reason: string) => 
      logger.info('Fintech', `Loan rejected: ${loanId}`, { reason }),
    repayment: (loanId: string, amount: number) => 
      logger.info('Fintech', `Repayment received: ${loanId}`, { amount }),
    error: (operation: string, error: Error, data?: any) => 
      logger.error('Fintech', `${operation} failed`, error, data),
  },

  /**
   * Insurance operations
   */
  insurance: {
    claimApproved: (claimId: string, amount: number) => 
      logger.info('Insurance', `Claim approved: ${claimId}`, { amount }),
    claimRejected: (claimId: string, reason: string) => 
      logger.info('Insurance', `Claim rejected: ${claimId}`, { reason }),
    premiumCollected: (policyId: string, amount: number) => 
      logger.info('Insurance', `Premium collected: ${policyId}`, { amount }),
    error: (operation: string, error: Error, data?: any) => 
      logger.error('Insurance', `${operation} failed`, error, data),
  },

  /**
   * Investment operations
   */
  investment: {
    invested: (startupId: string, amount: number) => 
      logger.info('Investment', `Invested in startup: ${startupId}`, { amount }),
    exited: (startupId: string, returns: number) => 
      logger.info('Investment', `Exited investment: ${startupId}`, { returns }),
    valuationUpdate: (startupId: string, newValuation: number) => 
      logger.info('Investment', `Valuation updated: ${startupId}`, { newValuation }),
    error: (operation: string, error: Error, data?: any) => 
      logger.error('Investment', `${operation} failed`, error, data),
  },

  /**
   * Validation operations
   */
  validation: {
    failed: (field: string, reason: string, value?: any) => 
      logger.warn('Validation', `Validation failed: ${field}`, { reason, value }),
    error: (operation: string, error: Error) => 
      logger.error('Validation', `${operation} failed`, error),
  },

  /**
   * State operations
   */
  state: {
    updated: (entity: string, action: string, data?: any) => 
      logger.debug('State', `${entity} ${action}`, data),
    error: (operation: string, error: Error) => 
      logger.error('State', `${operation} failed`, error),
  },
};

/**
 * Performance tracking helper
 */
export class PerformanceTracker {
  private startTime: number;
  private context: string;
  private operation: string;

  constructor(context: string, operation: string) {
    this.context = context;
    this.operation = operation;
    this.startTime = Date.now();
    logger.debug(context, `${operation} - Started`);
  }

  end(success: boolean = true, data?: any): void {
    const duration = Date.now() - this.startTime;
    
    if (success) {
      logger.debug(this.context, `${this.operation} - Completed (${duration}ms)`, data);
    } else {
      logger.warn(this.context, `${this.operation} - Failed (${duration}ms)`, data);
    }
  }
}

/**
 * Error tracking helper
 */
export function trackError(
  context: string,
  operation: string,
  error: Error | any,
  additionalData?: any
): void {
  logger.error(context, operation, error, additionalData);
  
  // TODO: In production, send to error tracking service (Sentry, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(context, operation, error, additionalData);
  // }
}

/**
 * Batch logging helper (for multiple related logs)
 */
export class BatchLogger {
  private logs: LogEntry[] = [];
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  add(level: LogLevel, message: string, data?: any): void {
    this.logs.push(createLogEntry(level, this.context, message, data));
  }

  flush(): void {
    this.logs.forEach(entry => {
      switch (entry.level) {
        case 'debug':
          logger.debug(entry.context, entry.message, entry.data);
          break;
        case 'info':
          logger.info(entry.context, entry.message, entry.data);
          break;
        case 'warn':
          logger.warn(entry.context, entry.message, entry.data);
          break;
        case 'error':
          logger.error(entry.context, entry.message, entry.error, entry.data);
          break;
      }
    });
    this.logs = [];
  }
}

/**
 * Export default logger
 */
export default logger;
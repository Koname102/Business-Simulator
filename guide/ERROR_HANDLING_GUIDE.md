# 🛠️ ERROR HANDLING GUIDE FOR DEVELOPERS

## Overview

This guide explains how to properly implement error handling in the Business Simulator Game. Follow these patterns to ensure consistent, robust error handling across the codebase.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Standard Patterns](#standard-patterns)
3. [Logger Usage](#logger-usage)
4. [Guard Functions](#guard-functions)
5. [Error Codes](#error-codes)
6. [User Notifications](#user-notifications)
7. [Common Mistakes](#common-mistakes)
8. [Testing](#testing)

---

## Quick Start

### Basic Error Handling Pattern

```typescript
const handleOperation = async (id: string, amount: number) => {
  try {
    // 1. Input validation
    if (!id) throw new Error('[VAL-001] ID required');
    if (amount <= 0) throw new Error('[VAL-003] Amount must be positive');
    
    // 2. State validation
    if (!company) throw new Error('[STATE-003] Company not initialized');
    
    // 3. Array guard
    const arrayGuard = guardArrayAccess(items, 0, 'Items');
    if (!arrayGuard.isValid) {
      throw new Error('[STATE-005] ' + getFirstErrorMessage(arrayGuard));
    }
    
    // 4. Balance guard
    const balanceGuard = guardBalanceFloor(company.balance, amount);
    if (!balanceGuard.isValid) {
      throw new Error('[STATE-001] ' + getFirstErrorMessage(balanceGuard));
    }
    
    // 5. Log operation start
    const op = logger.operation('Context', 'OperationName');
    
    // 6. Perform operation
    updateBalance(-amount);
    // ... business logic ...
    
    // 7. Log success
    op.success('Operation completed', { id, amount });
    
    // 8. Notify user
    addNotification({
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully',
    });
    
    return true;
    
  } catch (error) {
    // 9. Log error with context
    logger.error('Context', 'Operation failed', error, { id, amount });
    
    // 10. Notify user (strip error code)
    addNotification({
      type: 'error',
      title: 'Operation Failed',
      message: error.message.replace(/^\[.*?\]\s*/, ''),
    });
    
    // 11. Graceful exit
    return false;
  }
};
```

---

## Standard Patterns

### Pattern 1: User-Initiated Operation (Critical)

**When to use:** User clicks button, performs action  
**Behavior:** Show error notification, log error, return false  
**Example:** Approve loan, approve claim, invest in deal

```typescript
const handleUserAction = async (id: string) => {
  try {
    // Validation
    if (!id) throw new Error('[VAL-001] ID required');
    
    // Guards
    const guard = guardArrayAccess(array, 0, 'Context');
    if (!guard.isValid) {
      throw new Error('[STATE-005] ' + getFirstErrorMessage(guard));
    }
    
    // Log start
    const op = logger.operation('Context', 'ActionName');
    
    // Do work
    performAction();
    
    // Log success
    op.success('Completed', { id });
    
    // Notify user
    addNotification({
      type: 'success',
      title: 'Success',
      message: 'Action completed',
    });
    
    return true;
    
  } catch (error) {
    // Log error
    logger.error('Context', 'Action failed', error, { id });
    
    // Notify user (user-friendly message)
    addNotification({
      type: 'error',
      title: 'Action Failed',
      message: error.message.replace(/^\[.*?\]\s*/, ''),
    });
    
    return false;
  }
};
```

---

### Pattern 2: Background Operation (Non-Critical)

**When to use:** Auto-processing, scheduled tasks  
**Behavior:** Log error, skip cycle, NO user notification  
**Example:** Monthly repayment, premium collection, valuation update

```typescript
const handleBackgroundTask = () => {
  try {
    // Do work
    processTask();
    
    // Log success (optional)
    logger.debug('Context', 'Background task completed');
    
  } catch (error) {
    // Log error
    logger.error('Context', 'Background task failed', error);
    
    // ✅ NO user notification (too noisy)
    // ✅ Will retry on next cycle
  }
};
```

---

### Pattern 3: Data Fetching (Read-Only)

**When to use:** Getting data from store, no mutations  
**Behavior:** Return null/empty, log warning  
**Example:** Get pending loans, get active policies

```typescript
const getData = (): Item[] => {
  try {
    const state = useGameStore.getState();
    
    if (!state.company) {
      logger.warn('Context', 'Company not initialized');
      return [];
    }
    
    return state.items || [];
    
  } catch (error) {
    logger.error('Context', 'Failed to get data', error);
    return [];
  }
};
```

---

### Pattern 4: Save/Load Operations

**When to use:** Saving/loading game state  
**Behavior:** Create backup, restore on failure, notify user  
**Example:** Save game, load game, auto-save

```typescript
const handleSave = async (slot: number, name: string) => {
  try {
    // 1. Create backup
    const backup = createBackup(slot);
    
    try {
      // 2. Validate
      const validation = validateSaveData(data);
      if (!validation.isValid) {
        throw new Error('Validation failed');
      }
      
      // 3. Save
      localStorage.setItem(`slot_${slot}`, JSON.stringify(data));
      
      // 4. Clear backup
      clearBackup(slot);
      
      // 5. Log success
      logger.info('SaveManager', 'Save successful', { slot, name });
      
      return true;
      
    } catch (saveError) {
      // 6. Restore backup
      restoreBackup(slot);
      throw saveError;
    }
    
  } catch (error) {
    logger.error('SaveManager', 'Save failed', error, { slot, name });
    
    addNotification({
      type: 'error',
      title: 'Save Failed',
      message: 'Unable to save game. Please try again.',
    });
    
    return false;
  }
};
```

---

## Logger Usage

### Import Logger

```typescript
import { logger } from '@/lib/logger';
```

### Basic Logging

```typescript
// Info (general information)
logger.info('Context', 'Message', { data });

// Error (with error object)
logger.error('Context', 'Message', error, { data });

// Warning (non-critical issues)
logger.warn('Context', 'Message', { data });

// Debug (development only)
logger.debug('Context', 'Message', { data });
```

### Operation Tracking

```typescript
// Start operation
const op = logger.operation('Context', 'OperationName');

// ... do work ...

// Success
op.success('Completed', { result });

// OR Failure
op.failure(error, { details });
```

### Context Guidelines

**Good contexts:**
- 'Fintech' - For fintech operations
- 'Insurance' - For insurance operations
- 'Investment' - For investment operations
- 'SaveManager' - For save/load operations
- 'GameStore' - For store operations

**Bad contexts:**
- 'Function' - Too generic
- 'Error' - Not descriptive
- '' - Empty context

---

## Guard Functions

### guardArrayAccess

**Use before:** Accessing array elements

```typescript
// ✅ CORRECT
const guard = guardArrayAccess(loans, 0, 'Pending Loans');
if (!guard.isValid) {
  throw new Error('[STATE-005] ' + getFirstErrorMessage(guard));
}
const loan = loans[0];

// ❌ WRONG
const loan = loans[0]; // Can crash!
```

### guardBalanceFloor

**Use before:** Deducting from balance

```typescript
// ✅ CORRECT
const guard = guardBalanceFloor(company.balance, amount);
if (!guard.isValid) {
  throw new Error('[STATE-001] ' + getFirstErrorMessage(guard));
}
updateBalance(-amount);

// ❌ WRONG
updateBalance(-amount); // Can go negative!
```

### guardDivisionByZero

**Use before:** Division operations

```typescript
// ✅ CORRECT
const divisionGuard = guardDivisionByZero(divisor, 'Return Multiple');
const result = divisionGuard.isValid ? numerator / divisor : 0;

// ❌ WRONG
const result = numerator / divisor; // Can crash!
```

### validateClaimAmount

**Use for:** Insurance claim validation

```typescript
// ✅ CORRECT
const validation = validateClaimAmount(claim.amount, claim.coverage);
if (!validation.isValid) {
  throw new Error('[VAL-003] ' + getFirstErrorMessage(validation));
}

// ❌ WRONG
if (claim.amount > claim.coverage) { ... } // Incomplete checks
```

---

## Error Codes

### Format

```
[CATEGORY-NUMBER] Message
```

### Categories

- **VAL-xxx:** Validation errors (input, format, range)
- **STATE-xxx:** State integrity errors (balance, null, array)
- **OP-xxx:** Operation errors (fintech, insurance, investment)
- **SAVE-xxx:** Save/load errors (version, corruption, storage)

### Common Error Codes

```typescript
// Validation
'[VAL-001] ID required'
'[VAL-002] Invalid format'
'[VAL-003] Amount out of range'

// State
'[STATE-001] Insufficient balance'
'[STATE-003] Company not initialized'
'[STATE-005] Array out of bounds'

// Operations
'[OP-001] Loan operation failed'
'[OP-002] Claim operation failed'
'[OP-003] Investment operation failed'
```

### Error Code Usage

```typescript
// Internal log (keep code)
logger.error('Context', '[STATE-001] Insufficient balance', error);

// User notification (strip code)
addNotification({
  type: 'error',
  title: 'Error',
  message: error.message.replace(/^\[.*?\]\s*/, ''), // → "Insufficient balance"
});
```

---

## User Notifications

### Import

```typescript
const addNotification = useGameStore((state) => state.addNotification);
```

### Success Notification

```typescript
addNotification({
  type: 'success',
  title: 'Operation Successful',
  message: 'Your action completed successfully',
});
```

### Error Notification

```typescript
addNotification({
  type: 'error',
  title: 'Operation Failed',
  message: error.message.replace(/^\[.*?\]\s*/, ''), // Strip error code
});
```

### Warning Notification

```typescript
addNotification({
  type: 'warning',
  title: 'Warning',
  message: 'This action may have side effects',
});
```

### Info Notification

```typescript
addNotification({
  type: 'info',
  title: 'Information',
  message: 'Processing in background',
});
```

---

## Common Mistakes

### ❌ Mistake 1: Not Using Try-Catch

```typescript
// BAD
const handleAction = () => {
  updateBalance(-amount); // Can crash!
};

// GOOD
const handleAction = () => {
  try {
    updateBalance(-amount);
  } catch (error) {
    logger.error('Context', 'Failed', error);
  }
};
```

### ❌ Mistake 2: Not Validating Before Operations

```typescript
// BAD
const loan = loans[0]; // Can crash if empty!
updateBalance(-loan.amount); // Can go negative!

// GOOD
const guard = guardArrayAccess(loans, 0, 'Loans');
if (!guard.isValid) return;

const balanceGuard = guardBalanceFloor(balance, loans[0].amount);
if (!balanceGuard.isValid) return;

const loan = loans[0];
updateBalance(-loan.amount);
```

### ❌ Mistake 3: Not Logging Errors

```typescript
// BAD
try {
  doWork();
} catch (error) {
  return false; // Silent failure, no debugging info!
}

// GOOD
try {
  doWork();
} catch (error) {
  logger.error('Context', 'Work failed', error, { details });
  return false;
}
```

### ❌ Mistake 4: Generic Error Messages

```typescript
// BAD
throw new Error('Error');
throw new Error('Failed');
throw new Error('Invalid');

// GOOD
throw new Error('[VAL-001] ID is required');
throw new Error('[STATE-001] Insufficient balance');
throw new Error('[VAL-003] Amount must be positive');
```

### ❌ Mistake 5: Showing Error Codes to Users

```typescript
// BAD
addNotification({
  type: 'error',
  message: '[STATE-001] Insufficient balance', // Shows code!
});

// GOOD
addNotification({
  type: 'error',
  message: error.message.replace(/^\[.*?\]\s*/, ''), // "Insufficient balance"
});
```

### ❌ Mistake 6: Too Many User Notifications

```typescript
// BAD (for background tasks)
setInterval(() => {
  try {
    processRepayments();
  } catch (error) {
    addNotification({ type: 'error', ... }); // Every 5 seconds! 😱
  }
}, 5000);

// GOOD
setInterval(() => {
  try {
    processRepayments();
  } catch (error) {
    logger.error('Background', 'Repayment failed', error);
    // NO notification for background tasks
  }
}, 5000);
```

### ❌ Mistake 7: Not Providing Context

```typescript
// BAD
logger.error('', 'Failed', error); // No context!
guardArrayAccess(items, 0, ''); // No context!

// GOOD
logger.error('Fintech', 'Loan approval failed', error, { loanId });
guardArrayAccess(items, 0, 'Pending Loans');
```

---

## Testing

### Unit Test Example

```typescript
import { guardBalanceFloor } from '@/lib/validation';

describe('guardBalanceFloor', () => {
  it('should return valid for sufficient balance', () => {
    const result = guardBalanceFloor(1000000, 500000);
    expect(result.isValid).toBe(true);
  });
  
  it('should return invalid for insufficient balance', () => {
    const result = guardBalanceFloor(100000, 500000);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('STATE-001');
  });
});
```

### Integration Test Example

```typescript
describe('Loan Approval', () => {
  it('should fail with insufficient balance', async () => {
    // Setup
    useGameStore.setState({
      company: { balance: 100000 },
      fintech: { pendingLoans: [{ id: '1', amount: 500000 }] },
    });
    
    // Act
    const result = await handleApproveLoan('1');
    
    // Assert
    expect(result).toBe(false);
    expect(notificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );
  });
});
```

---

## Checklist for New Operations

When adding a new operation, ensure:

- [ ] Wrapped in try-catch block
- [ ] Input validation (null checks, type checks)
- [ ] State validation (company exists, arrays not empty)
- [ ] Guard functions used (balance, array access, division)
- [ ] Logger calls added (operation start, success, error)
- [ ] User notifications (success/error messages)
- [ ] Error codes used (consistent with ERROR_CODES.md)
- [ ] Error codes stripped from user messages
- [ ] Context provided in all logs
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Edge cases tested

---

## Quick Reference

### Guard Function Summary

| Guard | Use Case | Error Code |
|-------|----------|------------|
| `guardArrayAccess` | Before accessing array[i] | STATE-005 |
| `guardBalanceFloor` | Before deducting balance | STATE-001 |
| `guardDivisionByZero` | Before dividing | STATE-004 |
| `validateClaimAmount` | For insurance claims | VAL-003 |

### Logger Call Summary

| Method | Use Case |
|--------|----------|
| `logger.info()` | General information |
| `logger.error()` | Error with context |
| `logger.warn()` | Non-critical warning |
| `logger.debug()` | Development debug info |
| `logger.operation()` | Track operation lifecycle |

### Notification Type Summary

| Type | Use Case | Color |
|------|----------|-------|
| `success` | Operation succeeded | Green |
| `error` | Operation failed | Red |
| `warning` | Potential issue | Yellow |
| `info` | Information only | Blue |

---

## Resources

- **Validation Rules:** See `VALIDATION_RULES.md`
- **Error Codes:** See `ERROR_CODES.md`
- **Logger Implementation:** See `lib/logger.ts`
- **Guard Functions:** See `lib/validation.ts`

---

**Last Updated:** 27 Nov 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team

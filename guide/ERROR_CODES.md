# 🚨 ERROR CODES DOCUMENTATION

## 📋 Overview

This document defines all error codes used in the Business Simulator game, their meanings, and recommended handling strategies.

---

## 📊 Error Code Structure

```
[CATEGORY]-[NUMBER]

Examples:
VAL-001  → Validation error #1
STATE-001 → State integrity error #1
SAVE-001  → Save/Load error #1
OP-001    → Operation error #1
```

---

## 🔴 Error Categories

### VAL-xxx: Validation Errors
Input validation failures, constraint violations

### STATE-xxx: State Integrity Errors
Game state corruption, invalid state transitions

### SAVE-xxx: Save/Load Errors
File operations, data persistence failures

### OP-xxx: Operation Errors
Business logic failures, transaction errors

---

## 📖 Error Codes Reference

### VAL-xxx: Validation Errors

#### VAL-001: Required Field Missing
**Description:** Required field is null, undefined, or empty  
**Common causes:**
- User didn't fill form field
- API returned incomplete data
- State not initialized

**Handling:**
```typescript
// Check
if (!value) {
  throw new Error('[VAL-001] Field is required');
}

// Notify user
addNotification({
  type: 'warning',
  title: 'Input Required',
  message: 'Please fill in all required fields',
});
```

---

#### VAL-002: Invalid Format
**Description:** Input doesn't match expected format  
**Common causes:**
- Email format wrong
- Phone number invalid
- Date format incorrect

**Handling:**
```typescript
// Check
const validation = validateEmail(email);
if (!validation.isValid) {
  throw new Error('[VAL-002] Invalid email format');
}

// Notify user
addNotification({
  type: 'warning',
  title: 'Invalid Format',
  message: 'Please enter a valid email address',
});
```

---

#### VAL-003: Out of Range
**Description:** Value outside acceptable range  
**Common causes:**
- Amount too small/large
- Age out of bounds
- Duration invalid

**Handling:**
```typescript
// Check
if (amount < MIN || amount > MAX) {
  throw new Error(`[VAL-003] Amount must be between ${MIN} and ${MAX}`);
}

// Notify user
addNotification({
  type: 'warning',
  title: 'Invalid Amount',
  message: `Amount must be between Rp ${MIN.toLocaleString()} and Rp ${MAX.toLocaleString()}`,
});
```

---

#### VAL-004: Type Mismatch
**Description:** Wrong data type provided  
**Common causes:**
- String when number expected
- Object when array expected
- Undefined when value expected

**Handling:**
```typescript
// Check
if (typeof value !== 'number') {
  throw new Error('[VAL-004] Expected number, got ' + typeof value);
}

// Notify user
addNotification({
  type: 'error',
  title: 'Invalid Data Type',
  message: 'An unexpected error occurred. Please try again.',
});
```

---

### STATE-xxx: State Integrity Errors

#### STATE-001: Insufficient Balance
**Description:** Not enough balance for operation  
**Common causes:**
- Trying to spend more than available
- Balance calculation error
- Concurrent operations

**Handling:**
```typescript
// Check
const balanceCheck = guardBalanceFloor(balance, deduction);
if (!balanceCheck.isValid) {
  throw new Error('[STATE-001] Insufficient balance');
}

// Notify user
addNotification({
  type: 'error',
  title: 'Insufficient Balance',
  message: `You need Rp ${(deduction - balance).toLocaleString()} more`,
});

// Fallback: Cancel operation
return false;
```

---

#### STATE-002: Invalid State Transition
**Description:** Cannot move from current state to target state  
**Common causes:**
- Loan already approved
- Claim already processed
- Investment already exited

**Handling:**
```typescript
// Check
if (loan.status !== 'pending') {
  throw new Error(`[STATE-002] Cannot approve ${loan.status} loan`);
}

// Notify user
addNotification({
  type: 'error',
  title: 'Invalid Operation',
  message: 'This loan has already been processed',
});

// Fallback: Refresh state
refreshLoans();
```

---

#### STATE-003: Null/Undefined Reference
**Description:** Required object is null or undefined  
**Common causes:**
- Game not initialized
- Data not loaded
- State cleared prematurely

**Handling:**
```typescript
// Check
const company = useGameStore.getState().company;
if (!company) {
  throw new Error('[STATE-003] Company not initialized');
}

// Notify user
addNotification({
  type: 'error',
  title: 'Game Not Ready',
  message: 'Please restart the game',
});

// Fallback: Redirect to home
router.push('/');
```

---

#### STATE-004: Division By Zero
**Description:** Attempting to divide by zero  
**Common causes:**
- Calculating rate with zero duration
- Averaging with zero count
- Formula error

**Handling:**
```typescript
// Check
const check = guardDivisionByZero(divisor, 'CalculateRate');
if (!check.isValid) {
  throw new Error('[STATE-004] Division by zero');
}

// Fallback: Return default value
return 0;
```

---

#### STATE-005: Array Out of Bounds
**Description:** Accessing array index that doesn't exist  
**Common causes:**
- Empty array
- Wrong index
- Off-by-one error

**Handling:**
```typescript
// Check
const check = guardArrayAccess(array, index, 'Loans');
if (!check.isValid) {
  throw new Error('[STATE-005] Invalid array access');
}

// Fallback: Return null
return null;
```

---

#### STATE-006: Future Timestamp
**Description:** Timestamp is in the future  
**Common causes:**
- Clock skew
- Invalid date input
- Time calculation error

**Handling:**
```typescript
// Check
const check = guardTimestamp(timestamp, 'CreatedAt');
if (!check.isValid) {
  throw new Error('[STATE-006] Future timestamp not allowed');
}

// Fallback: Use current time
const validTimestamp = Date.now();
```

---

### SAVE-xxx: Save/Load Errors

#### SAVE-001: Version Incompatible
**Description:** Save file version doesn't match game version  
**Common causes:**
- Old save file
- Wrong game version
- Migration failed

**Handling:**
```typescript
// Check
if (!isVersionCompatible(saveVersion, gameVersion)) {
  throw new Error(`[SAVE-001] Version mismatch: ${saveVersion} vs ${gameVersion}`);
}

// Notify user
addNotification({
  type: 'error',
  title: 'Incompatible Save',
  message: 'This save file is from a different game version',
});

// Fallback: Try migration
const migrated = migrateSaveData(saveData);
```

---

#### SAVE-002: Corrupted Data
**Description:** Save file data is corrupted or invalid  
**Common causes:**
- Partial write
- Storage corruption
- Manual edit

**Handling:**
```typescript
// Check
const validation = validateSaveData(saveData);
if (!validation.isValid) {
  throw new Error('[SAVE-002] Corrupted save data');
}

// Notify user
addNotification({
  type: 'error',
  title: 'Corrupted Save',
  message: 'This save file is corrupted. Check Advanced: Backup Recovery',
});

// Fallback: Try backup restore
const restored = SaveManager.manualRestoreBackup(slot);
```

---

#### SAVE-003: Storage Full
**Description:** localStorage quota exceeded  
**Common causes:**
- Too many saves
- Large save files
- Other apps using storage

**Handling:**
```typescript
// Catch
if (error.name === 'QuotaExceededError') {
  throw new Error('[SAVE-003] Storage full');
}

// Notify user
addNotification({
  type: 'error',
  title: 'Storage Full',
  message: 'Delete old saves to free up space',
});

// Fallback: Delete old autosaves
cleanupOldAutosaves();
```

---

#### SAVE-004: Permission Denied
**Description:** Cannot access localStorage  
**Common causes:**
- Private browsing mode
- Browser settings
- Security policy

**Handling:**
```typescript
// Catch
if (error.name === 'SecurityError') {
  throw new Error('[SAVE-004] Storage permission denied');
}

// Notify user
addNotification({
  type: 'error',
  title: 'Cannot Save',
  message: 'Check browser privacy settings',
});

// Fallback: Use memory-only storage
useFallbackStorage();
```

---

#### SAVE-005: File Not Found
**Description:** Save file doesn't exist  
**Common causes:**
- Wrong slot number
- Save deleted
- Never saved

**Handling:**
```typescript
// Check
if (!saveData) {
  throw new Error('[SAVE-005] Save file not found');
}

// Notify user
addNotification({
  type: 'warning',
  title: 'No Save Found',
  message: 'This slot is empty',
});

// Fallback: Return empty state
return null;
```

---

### OP-xxx: Operation Errors

#### OP-001: Loan Operation Failed
**Description:** Loan approval/rejection/repayment failed  
**Common causes:**
- Validation failure
- Balance insufficient
- State conflict

**Handling:**
```typescript
// Log
logger.error('Fintech', 'Loan operation failed', error, { loanId });

// Notify user
addNotification({
  type: 'error',
  title: 'Loan Operation Failed',
  message: error.message || 'Unable to process loan',
});

// Fallback: Revert state
rollbackLoanOperation(loanId);
```

---

#### OP-002: Claim Operation Failed
**Description:** Claim approval/rejection/payment failed  
**Common causes:**
- Validation failure
- Balance insufficient
- State conflict

**Handling:**
```typescript
// Log
logger.error('Insurance', 'Claim operation failed', error, { claimId });

// Notify user
addNotification({
  type: 'error',
  title: 'Claim Operation Failed',
  message: error.message || 'Unable to process claim',
});

// Fallback: Revert state
rollbackClaimOperation(claimId);
```

---

#### OP-003: Investment Operation Failed
**Description:** Investment/exit/valuation update failed  
**Common causes:**
- Validation failure
- Balance insufficient
- State conflict

**Handling:**
```typescript
// Log
logger.error('Investment', 'Investment operation failed', error, { dealId });

// Notify user
addNotification({
  type: 'error',
  title: 'Investment Failed',
  message: error.message || 'Unable to complete investment',
});

// Fallback: Revert state
rollbackInvestmentOperation(dealId);
```

---

#### OP-004: Network Operation Failed
**Description:** API call or network request failed  
**Common causes:**
- No internet
- Server down
- Timeout

**Handling:**
```typescript
// Retry logic
let retries = 3;
while (retries > 0) {
  try {
    return await apiCall();
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    await delay(1000 * (4 - retries));
  }
}

// Notify user
addNotification({
  type: 'error',
  title: 'Network Error',
  message: 'Check your internet connection',
});

// Fallback: Queue for retry
queueFailedOperation(operation);
```

---

#### OP-005: Concurrent Operation Conflict
**Description:** Two operations tried to modify same data  
**Common causes:**
- Race condition
- Async timing
- Multiple tabs

**Handling:**
```typescript
// Lock mechanism
const lock = await acquireLock('resource-id');
try {
  await performOperation();
} finally {
  releaseLock(lock);
}

// Notify user
addNotification({
  type: 'warning',
  title: 'Operation Conflict',
  message: 'Another operation is in progress',
});

// Fallback: Retry after delay
setTimeout(() => retryOperation(), 1000);
```

---

## 🔄 Handling Strategy Decision Tree

```
Error Occurs
    ↓
Critical Error? ──┬── YES → Try recovery → Notify user → Log error
                  │
                  └── NO → Use fallback → Log warning
                                ↓
                          Fallback works? ──┬── YES → Continue (degrade gracefully)
                                            │
                                            └── NO → Notify user → Minimal mode
```

---

## 📊 Error Severity Levels

### 🔴 CRITICAL (Must Handle)
- STATE-001: Insufficient Balance
- STATE-003: Null Reference
- SAVE-002: Corrupted Data
- OP-001/002/003: Operation Failures

**Action:** Log, notify user, graceful exit

---

### 🟡 WARNING (Should Handle)
- VAL-001/002/003: Validation Errors
- STATE-002: Invalid Transition
- SAVE-001: Version Mismatch

**Action:** Validate early, prevent error

---

### 🟢 INFO (Nice to Handle)
- STATE-004/005/006: Edge Cases
- SAVE-005: File Not Found
- OP-004: Network Errors

**Action:** Use fallbacks, degrade gracefully

---

## 🧪 Testing Error Scenarios

### Validation Errors (VAL-xxx)
```typescript
// Test VAL-001
handleOperation(null); // Should fail validation

// Test VAL-003
handleOperation(-999); // Should fail range check
```

### State Errors (STATE-xxx)
```typescript
// Test STATE-001
setBalance(0);
handleExpense(1000); // Should fail balance check

// Test STATE-003
clearCompany();
handleOperation(); // Should fail null check
```

### Save Errors (SAVE-xxx)
```typescript
// Test SAVE-003
fillLocalStorage();
handleSave(); // Should fail with quota exceeded
```

### Operation Errors (OP-xxx)
```typescript
// Test OP-001
handleApproveLoan('invalid-id'); // Should fail
```

---

## 📝 Best Practices

### 1. Always Log Errors
```typescript
logger.error('Context', 'Operation failed', error, additionalData);
```

### 2. Always Notify User
```typescript
addNotification({
  type: 'error',
  title: 'User-Friendly Title',
  message: 'Clear explanation of what happened',
});
```

### 3. Always Exit Gracefully
```typescript
// Don't crash
return false;

// Or provide fallback
return defaultValue;
```

### 4. Use Error Codes in Logs
```typescript
throw new Error('[STATE-001] Insufficient balance');
// Not: throw new Error('Not enough money');
```

### 5. Provide Recovery Options
```typescript
addNotification({
  type: 'error',
  title: 'Operation Failed',
  message: 'Try deleting old saves to free up space',
  // ^ Recovery suggestion
});
```

---

## 🎯 Summary

**Total Error Codes:** 20+

**Categories:**
- VAL-xxx: 4 codes (Validation)
- STATE-xxx: 6 codes (State Integrity)
- SAVE-xxx: 5 codes (Save/Load)
- OP-xxx: 5 codes (Operations)

**Handling Strategy:**
- Log ALL errors with context
- Notify user with clear message
- Exit gracefully (no crashes)
- Provide fallbacks when possible
- Suggest recovery actions

---

## 📚 Related Documentation

- [Error Handling Patterns](./error-handling-patterns.ts) - Code templates
- [Logger Documentation](./logger.ts) - Logging API
- [Validation Rules](./VALIDATION_RULES.md) - Input constraints

---

**Last Updated:** November 2025  
**Version:** 1.0.0

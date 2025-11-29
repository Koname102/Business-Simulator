# 📘 VALIDATION RULES & CONSTRAINTS

## Overview

This document describes all validation rules, constraints, and guard functions used in the Business Simulator Game to prevent crashes, data corruption, and invalid operations.

---

## Table of Contents

1. [Guard Functions](#guard-functions)
2. [Validation Functions](#validation-functions)
3. [Business Rules](#business-rules)
4. [Error Codes](#error-codes)
5. [Testing Guide](#testing-guide)

---

## Guard Functions

### 1. guardArrayAccess()

**Purpose:** Prevent array out-of-bounds errors and null array crashes

**Location:** `lib/validation.ts`

**Signature:**
```typescript
guardArrayAccess<T>(
  array: T[] | null | undefined,
  index: number,
  context: string
): ValidationResult
```

**Rules:**
- Array must not be null or undefined
- Array must not be empty (length > 0)
- Index must be >= 0
- Index must be < array.length

**Error Codes:**
- `VAL-NULL-001`: Array is null/undefined
- `VAL-EMPTY-001`: Array is empty
- `VAL-INDEX-001`: Index out of bounds

**Usage Examples:**
```typescript
// ✅ CORRECT: Check before accessing array
const guard = guardArrayAccess(loans, 0, 'Pending Loans');
if (!guard.isValid) {
  console.error(getFirstErrorMessage(guard));
  return; // Exit gracefully
}

// Now safe to access
const loan = loans[0];

// ❌ WRONG: Access without checking
const loan = loans[0]; // Can crash if loans is empty!
```

**Test Cases:**
```typescript
// Test 1: Null array
guardArrayAccess(null, 0, 'Test') 
// → isValid: false, error: "Array is null/undefined"

// Test 2: Empty array
guardArrayAccess([], 0, 'Test')
// → isValid: false, error: "Array is empty"

// Test 3: Valid access
guardArrayAccess([1,2,3], 0, 'Test')
// → isValid: true

// Test 4: Index out of bounds
guardArrayAccess([1,2,3], 5, 'Test')
// → isValid: false, error: "Index 5 out of bounds"
```

---

### 2. guardBalanceFloor()

**Purpose:** Prevent negative balance and insufficient funds errors

**Location:** `lib/validation.ts`

**Signature:**
```typescript
guardBalanceFloor(
  currentBalance: number,
  requiredAmount: number,
  minBalance?: number
): ValidationResult
```

**Rules:**
- Current balance must be >= required amount
- Optional: Balance after operation must be >= minimum balance (default: 0)
- Amounts must be positive numbers

**Error Codes:**
- `STATE-001`: Insufficient balance
- `VAL-003`: Invalid amount (negative or NaN)

**Usage Examples:**
```typescript
// ✅ CORRECT: Check before deducting
const guard = guardBalanceFloor(company.balance, loanAmount);
if (!guard.isValid) {
  addNotification({
    type: 'error',
    title: 'Insufficient Balance',
    message: getFirstErrorMessage(guard),
  });
  return;
}

// Now safe to deduct
updateBalance(-loanAmount);

// ❌ WRONG: Deduct without checking
updateBalance(-loanAmount); // Can cause negative balance!
```

**Test Cases:**
```typescript
// Test 1: Sufficient balance
guardBalanceFloor(1000000, 500000)
// → isValid: true

// Test 2: Insufficient balance
guardBalanceFloor(100000, 500000)
// → isValid: false, error: "Insufficient balance"

// Test 3: With minimum balance
guardBalanceFloor(600000, 500000, 100000)
// → isValid: true (600k - 500k = 100k, meets minimum)

// Test 4: Below minimum after operation
guardBalanceFloor(550000, 500000, 100000)
// → isValid: false, error: "Would go below minimum balance"
```

---

### 3. guardDivisionByZero()

**Purpose:** Prevent division by zero crashes

**Location:** `lib/validation.ts`

**Signature:**
```typescript
guardDivisionByZero(
  divisor: number,
  context: string
): ValidationResult
```

**Rules:**
- Divisor must not be 0
- Divisor must be a valid number (not NaN)

**Error Codes:**
- `STATE-004`: Division by zero
- `VAL-004`: Invalid number type

**Usage Examples:**
```typescript
// ✅ CORRECT: Check before dividing
const divisionGuard = guardDivisionByZero(inv.amount, 'Return multiple');
const returnMultiple = divisionGuard.isValid 
  ? newValuation / inv.amount 
  : 0;

// ❌ WRONG: Divide without checking
const returnMultiple = newValuation / inv.amount; // Can crash if amount is 0!
```

**Test Cases:**
```typescript
// Test 1: Valid divisor
guardDivisionByZero(100, 'Test')
// → isValid: true

// Test 2: Zero divisor
guardDivisionByZero(0, 'Test')
// → isValid: false, error: "Cannot divide by zero"

// Test 3: NaN divisor
guardDivisionByZero(NaN, 'Test')
// → isValid: false, error: "Invalid number"
```

---

### 4. validateClaimAmount()

**Purpose:** Validate insurance claim amounts

**Location:** `lib/validation.ts`

**Signature:**
```typescript
validateClaimAmount(
  claimAmount: number,
  coverageAmount: number
): ValidationResult
```

**Rules:**
- Claim amount must be > 0
- Claim amount must be <= coverage amount
- Both must be valid numbers

**Error Codes:**
- `VAL-003`: Invalid claim amount (negative or zero)
- `VAL-003`: Claim exceeds coverage

**Usage Examples:**
```typescript
// ✅ CORRECT: Validate before processing
const validation = validateClaimAmount(claim.claimAmount, claim.coverageAmount);
if (!validation.isValid) {
  addNotification({
    type: 'error',
    title: 'Invalid Claim',
    message: getFirstErrorMessage(validation),
  });
  return;
}

// Now safe to process
processClaim(claim);
```

**Test Cases:**
```typescript
// Test 1: Valid claim
validateClaimAmount(50000000, 100000000)
// → isValid: true

// Test 2: Exceeds coverage
validateClaimAmount(150000000, 100000000)
// → isValid: false, error: "Claim exceeds coverage"

// Test 3: Negative amount
validateClaimAmount(-10000, 100000000)
// → isValid: false, error: "Amount must be positive"

// Test 4: Zero amount
validateClaimAmount(0, 100000000)
// → isValid: false, error: "Amount must be positive"
```

---

## Validation Functions

### 1. validateAmount()

**Purpose:** General amount validation

**Rules:**
- Must be a number (not null, undefined, string)
- Must not be NaN
- Must not be Infinity
- Optional: Must be > 0 (if requirePositive = true)
- Optional: Must be <= max (if max provided)

**Usage:**
```typescript
const validation = validateAmount(amount, true, 1000000000);
if (!validation.isValid) {
  return false;
}
```

---

### 2. validateSaveData()

**Purpose:** Validate save file structure

**Rules:**
- Must have version field
- Must have timestamp
- Must have player object
- Must have company object
- Player must have: id, name, age
- Company must have: id, name, type, balance

**Location:** `lib/save-validation.ts`

---

### 3. isVersionCompatible()

**Purpose:** Check save file version compatibility

**Rules:**
- Save version must match game version (1.0.0)
- Future: Support migration for older versions

**Location:** `lib/save-validation.ts`

---

## Business Rules

### Fintech (P2P Lending)

**Loan Approval:**
- Balance must be >= loan amount
- Loan must be in pending status
- Cannot approve same loan twice

**Loan Repayment:**
- Loan must be active
- Repayment cannot exceed remaining amount
- Monthly payment = total repayment / duration

**Loan Default:**
- Check default probability based on:
  - Credit score (if available)
  - Duration remaining
  - Payment history
  - Difficulty setting

---

### Insurance (Life Insurance)

**Claim Approval:**
- Balance must be >= claim amount
- Claim amount must be <= coverage amount
- Death claims = 100% coverage
- Critical illness/disability = 30-50% coverage

**Premium Collection:**
- Collect monthly from all active policies
- Premium = coverage * age factor * risk multiplier
- Cannot collect twice in same month

**Policy Generation:**
- Age range: 25-65 years
- Coverage: 10M - 100M IDR
- Premium based on age and coverage

---

### Investment (Venture Capital)

**Investment:**
- Balance must be >= investment amount
- Investment must be within deal's min/max range
- Cannot invest in same deal twice

**Exit:**
- Investment must be active
- Exit valuation = current valuation * exit multiplier
- Performance fee = 20% of profit (if profit > 0)

**Valuation Update:**
- Update quarterly
- Random market conditions (-1, 0, +1)
- Cannot go below 0
- Check for startup failure based on:
  - Time since investment
  - Sector performance
  - Difficulty setting

**Management Fee:**
- Collect quarterly
- Fee = 2% annual / 4 quarters = 0.5% per quarter
- Based on total AUM (Assets Under Management)

---

## Error Codes

### VAL-xxx: Validation Errors
- `VAL-001`: Required field missing
- `VAL-002`: Invalid format
- `VAL-003`: Out of range / invalid amount
- `VAL-004`: Type mismatch

### STATE-xxx: State Integrity Errors
- `STATE-001`: Insufficient balance
- `STATE-002`: Invalid state transition
- `STATE-003`: Null/undefined reference
- `STATE-004`: Division by zero
- `STATE-005`: Array out of bounds
- `STATE-006`: Invalid timestamp

### OP-xxx: Operation Errors
- `OP-001`: Loan operation failed
- `OP-002`: Claim operation failed
- `OP-003`: Investment operation failed
- `OP-004`: Network operation failed
- `OP-005`: Concurrent operation conflict

### SAVE-xxx: Save/Load Errors
- `SAVE-001`: Version incompatible
- `SAVE-002`: Corrupted data
- `SAVE-003`: Storage full
- `SAVE-004`: Permission denied
- `SAVE-005`: File not found

---

## Testing Guide

### Unit Test Template

```typescript
describe('guardArrayAccess', () => {
  it('should return invalid for null array', () => {
    const result = guardArrayAccess(null, 0, 'Test');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('VAL-NULL-001');
  });
  
  it('should return invalid for empty array', () => {
    const result = guardArrayAccess([], 0, 'Test');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('VAL-EMPTY-001');
  });
  
  it('should return valid for valid access', () => {
    const result = guardArrayAccess([1, 2, 3], 0, 'Test');
    expect(result.isValid).toBe(true);
  });
});
```

### Integration Test Template

```typescript
describe('Loan Approval Flow', () => {
  it('should reject approval if insufficient balance', async () => {
    // Setup: Company with 100k balance
    const company = { balance: 100000 };
    const loan = { amount: 500000 };
    
    // Act: Try to approve loan
    const result = await handleApproveLoan(loan.id);
    
    // Assert: Should fail
    expect(result).toBe(false);
    expect(notificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );
  });
});
```

### Manual Testing Checklist

**Fintech:**
- [ ] Approve loan with sufficient balance
- [ ] Approve loan with insufficient balance (should fail)
- [ ] Approve loan when no pending loans (should fail gracefully)
- [ ] Reject loan
- [ ] Monthly repayment processing
- [ ] Loan default handling

**Insurance:**
- [ ] Approve claim with sufficient balance
- [ ] Approve claim with insufficient balance (should fail)
- [ ] Approve claim exceeding coverage (should fail)
- [ ] Reject claim
- [ ] Monthly premium collection
- [ ] Policy generation

**Investment:**
- [ ] Invest with sufficient balance
- [ ] Invest with insufficient balance (should fail)
- [ ] Pass on deal
- [ ] Exit investment
- [ ] Quarterly valuation update
- [ ] Startup failure handling
- [ ] Management fee collection

---

## Best Practices

### 1. Always Validate Before Operations
```typescript
// ❌ BAD
updateBalance(-amount);

// ✅ GOOD
const guard = guardBalanceFloor(balance, amount);
if (!guard.isValid) {
  handleError(guard);
  return;
}
updateBalance(-amount);
```

### 2. Provide Context in Validations
```typescript
// ❌ BAD
guardArrayAccess(loans, 0, '');

// ✅ GOOD
guardArrayAccess(loans, 0, 'Pending Loans');
```

### 3. Use Specific Error Messages
```typescript
// ❌ BAD
throw new Error('Invalid');

// ✅ GOOD
throw new Error('[VAL-003] Amount must be between 0 and 1000000000');
```

### 4. Log All Validation Failures
```typescript
// ❌ BAD
if (!valid) return;

// ✅ GOOD
if (!guard.isValid) {
  logger.error('Context', 'Validation failed', null, {
    errors: guard.errors,
    data: { amount, balance }
  });
  return;
}
```

---

## Maintenance

### Adding New Validations

1. **Create validation function** in `lib/validation.ts`
2. **Define error codes** in error codes list
3. **Write unit tests** for all cases
4. **Document rules** in this file
5. **Update ERROR_HANDLING_GUIDE.md**

### Updating Existing Validations

1. **Check all usages** of the validation
2. **Update tests** to cover new cases
3. **Update documentation**
4. **Test thoroughly** in all affected components

---

## References

- Error Codes: See `ERROR_CODES.md`
- Error Handling Guide: See `ERROR_HANDLING_GUIDE.md`
- Implementation: See `lib/validation.ts`
- Tests: See `__tests__/validation.test.ts`

---

**Last Updated:** 27 Nov 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team

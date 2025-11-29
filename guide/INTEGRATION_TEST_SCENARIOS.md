# 🧪 INTEGRATION TEST SCENARIOS

## Overview

This document contains comprehensive integration test scenarios for error handling across all game modules. Use these scenarios to validate that error handling works correctly in real-world usage.

---

## Table of Contents

1. [Fintech (P2P Lending)](#fintech-p2p-lending)
2. [Insurance (Life Insurance)](#insurance-life-insurance)
3. [Investment (Venture Capital)](#investment-venture-capital)
4. [Save/Load System](#saveload-system)
5. [Game Core](#game-core)

---

## Fintech (P2P Lending)

### Scenario 1: Successful Loan Approval
**Test Case:** User approves loan with sufficient balance

**Setup:**
```typescript
company.balance = 10_000_000
pendingLoans = [{
  id: '1',
  amount: 5_000_000,
  borrowerName: 'John Doe',
  interestRate: 15,
  duration: 12,
}]
```

**Actions:**
1. User clicks "Approve" on pending loan
2. System validates balance (should pass)
3. System deducts amount from balance
4. Loan moves to active loans
5. Transaction recorded
6. Notification shown

**Expected Results:**
- ✅ Balance: 5,000,000 (10M - 5M)
- ✅ Active loans: 1
- ✅ Pending loans: 0
- ✅ Success notification shown
- ✅ Console log: `[INFO][Fintech] Loan approved`

**Assertions:**
```typescript
expect(company.balance).toBe(5_000_000);
expect(fintech.activeLoans).toBe(1);
expect(fintech.pendingLoans).toHaveLength(0);
expect(notificationSpy).toHaveBeenCalledWith(
  expect.objectContaining({ type: 'success' })
);
```

---

### Scenario 2: Loan Approval Fails - Insufficient Balance
**Test Case:** User tries to approve loan without enough funds

**Setup:**
```typescript
company.balance = 1_000_000
pendingLoans = [{
  id: '1',
  amount: 5_000_000,
  borrowerName: 'John Doe',
}]
```

**Actions:**
1. User clicks "Approve" on pending loan
2. System validates balance (should fail)
3. Error thrown: `[STATE-001] Insufficient balance`
4. Operation aborted
5. Error notification shown

**Expected Results:**
- ✅ Balance unchanged: 1,000,000
- ✅ Loan still pending
- ✅ Error notification shown
- ✅ Console log: `[ERROR][Fintech] Loan approval failed`

**Assertions:**
```typescript
expect(company.balance).toBe(1_000_000);
expect(fintech.pendingLoans).toHaveLength(1);
expect(notificationSpy).toHaveBeenCalledWith(
  expect.objectContaining({ 
    type: 'error',
    message: expect.stringContaining('Insufficient')
  })
);
```

---

### Scenario 3: Loan Approval Fails - Empty Pending Loans
**Test Case:** System tries to process repayment with no pending loans

**Setup:**
```typescript
company.balance = 10_000_000
pendingLoans = []
```

**Actions:**
1. System tries to access pendingLoans[0]
2. guardArrayAccess fails
3. Error thrown: `[STATE-005] Array is empty`
4. Operation aborted gracefully
5. No crash

**Expected Results:**
- ✅ No crash/error thrown to user
- ✅ Console log: `[ERROR][Fintech] No pending loans`
- ✅ Graceful exit

**Assertions:**
```typescript
expect(fintech.pendingLoans).toHaveLength(0);
expect(loggerSpy).toHaveBeenCalledWith(
  'Fintech',
  expect.stringContaining('empty'),
  expect.any(Error)
);
```

---

### Scenario 4: Monthly Repayment Processing
**Test Case:** Automatic monthly repayment for active loans

**Setup:**
```typescript
company.balance = 5_000_000
activeLoans = [{
  id: '1',
  amount: 10_000_000,
  totalRepayment: 11_500_000,
  paidAmount: 0,
  duration: 12,
  status: 'active',
}]
```

**Actions:**
1. Time advances by 1 month (30 days)
2. System calculates monthly payment: 11,500,000 / 12 = 958,333
3. System adds to company balance
4. Loan's paidAmount updated
5. Transaction recorded

**Expected Results:**
- ✅ Balance: 5,958,333
- ✅ Loan paidAmount: 958,333
- ✅ Transaction recorded
- ✅ If error occurs, skip this cycle (graceful)

**Edge Case - Loan Default:**
```typescript
// If borrower defaults (random based on difficulty)
- ✅ Loan status = 'defaulted'
- ✅ No payment received
- ✅ Default notification shown
```

---

## Insurance (Life Insurance)

### Scenario 5: Successful Claim Approval
**Test Case:** User approves valid death claim

**Setup:**
```typescript
company.balance = 100_000_000
pendingClaims = [{
  id: '1',
  claimAmount: 50_000_000,
  coverageAmount: 100_000_000,
  claimType: 'death',
  policyholderName: 'Alice',
}]
```

**Actions:**
1. User clicks "Approve" on pending claim
2. System validates claim amount <= coverage (passes)
3. System validates balance (passes)
4. System deducts amount from balance
5. Claim moves to history
6. Transaction recorded
7. Notification shown

**Expected Results:**
- ✅ Balance: 50,000,000
- ✅ Pending claims: 0
- ✅ Claim history: 1
- ✅ Success notification
- ✅ Console log: `[INFO][Insurance] Claim approved`

---

### Scenario 6: Claim Approval Fails - Exceeds Coverage
**Test Case:** User tries to approve claim exceeding coverage

**Setup:**
```typescript
company.balance = 200_000_000
pendingClaims = [{
  id: '1',
  claimAmount: 150_000_000,
  coverageAmount: 100_000_000,
}]
```

**Actions:**
1. User clicks "Approve"
2. validateClaimAmount fails
3. Error thrown: `[VAL-003] Claim exceeds coverage`
4. Operation aborted
5. Error notification shown

**Expected Results:**
- ✅ Balance unchanged
- ✅ Claim still pending
- ✅ Error notification
- ✅ Console log: `[ERROR][Insurance] Validation failed`

---

### Scenario 7: Monthly Premium Collection
**Test Case:** Automatic premium collection from policyholders

**Setup:**
```typescript
company.balance = 10_000_000
activePolicies = [
  {
    id: '1',
    coverageAmount: 50_000_000,
    monthlyPremium: 500_000,
    status: 'active',
  },
  {
    id: '2',
    coverageAmount: 100_000_000,
    monthlyPremium: 1_000_000,
    status: 'active',
  },
]
```

**Actions:**
1. Time advances by 1 month
2. System collects from policy 1: 500,000
3. System collects from policy 2: 1,000,000
4. Total collected: 1,500,000
5. Balance updated
6. Transactions recorded

**Expected Results:**
- ✅ Balance: 11,500,000
- ✅ Transactions: 2
- ✅ Insurance stats updated
- ✅ If error occurs, skip and continue (graceful)

---

### Scenario 8: Policy Generation
**Test Case:** Automatic new policy generation

**Setup:**
```typescript
activePolicies = 15 // Below maximum
currentTime = gameTime + 30 days
```

**Actions:**
1. System checks if should generate new policy
2. Random age: 35 years
3. Random coverage: 75,000,000
4. Calculate premium based on age/coverage
5. Create new policy
6. Add to active policies

**Expected Results:**
- ✅ Active policies: 16
- ✅ New policy with valid data
- ✅ Console log: `[INFO][Insurance] Policy generated`
- ✅ If error, skip cycle (no crash)

---

## Investment (Venture Capital)

### Scenario 9: Successful Investment
**Test Case:** User invests in startup deal

**Setup:**
```typescript
company.balance = 500_000_000
dealFlow = [{
  id: '1',
  target: 'TechCorp',
  sector: 'SaaS',
  investmentNeeded: 100_000_000,
  valuation: 400_000_000,
}]
```

**Actions:**
1. User clicks "Invest" on deal
2. System validates balance (passes)
3. System deducts investment
4. Creates investment record
5. Removes deal from flow
6. Updates portfolio
7. Transaction recorded
8. Notification shown

**Expected Results:**
- ✅ Balance: 400,000,000
- ✅ Deal flow: 0
- ✅ Portfolio: 1
- ✅ AUM updated
- ✅ Success notification
- ✅ Console log: `[INFO][Investment] Investment made`

---

### Scenario 10: Quarterly Valuation Update
**Test Case:** Automatic valuation update for portfolio companies

**Setup:**
```typescript
portfolio = [{
  id: '1',
  target: 'TechCorp',
  amount: 100_000_000,
  currentValuation: 100_000_000,
  status: 'active',
  investmentDate: Date.now() - 90 days,
}]
```

**Actions:**
1. Time advances to quarter end
2. System calculates market condition: +1 (good)
3. System calculates valuation change: +30%
4. New valuation: 130,000,000
5. Check for division by zero (guardDivisionByZero)
6. Calculate return multiple: 1.3x
7. Update portfolio
8. Update stats

**Expected Results:**
- ✅ currentValuation: 130,000,000
- ✅ No division by zero crash
- ✅ Return multiple: 1.3x
- ✅ Total return updated
- ✅ Console log: `[INFO][Investment] Valuations updated`

**Edge Case - Startup Failure:**
```typescript
// Random failure check
if (shouldFail) {
  - ✅ Status = 'failed'
  - ✅ Current valuation = 0
  - ✅ Loss recorded
  - ✅ Notification shown
}
```

---

### Scenario 11: Investment Exit
**Test Case:** User exits investment (IPO/acquisition)

**Setup:**
```typescript
company.balance = 200_000_000
portfolio = [{
  id: '1',
  target: 'TechCorp',
  amount: 100_000_000,
  currentValuation: 300_000_000,
  status: 'active',
}]
```

**Actions:**
1. User clicks "Exit" on investment
2. System calculates exit amount: 300,000,000
3. Calculate profit: 200,000,000
4. Calculate performance fee (20% of profit): 40,000,000
5. Final proceeds: 260,000,000
6. Add to balance
7. Update investment status to 'exited'
8. Transaction recorded

**Expected Results:**
- ✅ Balance: 460,000,000 (200M + 260M)
- ✅ Investment status: 'exited'
- ✅ Performance fee: 40,000,000
- ✅ Total return updated
- ✅ Success notification

---

### Scenario 12: Management Fee Collection
**Test Case:** Quarterly management fee (2% annual / 4 quarters)

**Setup:**
```typescript
company.balance = 100_000_000
investment.aum = 1_000_000_000
```

**Actions:**
1. Time advances to quarter end
2. Calculate fee: 1,000,000,000 * 0.02 / 4 = 5,000,000
3. Add to balance
4. Transaction recorded

**Expected Results:**
- ✅ Balance: 105,000,000
- ✅ Fee recorded as income
- ✅ Console log: `[INFO][Investment] Management fee collected`

---

## Save/Load System

### Scenario 13: Successful Save
**Test Case:** User saves game to slot

**Setup:**
```typescript
currentState = {
  player: { name: 'John', level: 5 },
  company: { balance: 10_000_000 },
}
slot = 1
saveName = 'My Progress'
```

**Actions:**
1. User clicks "Save"
2. System creates backup of existing slot 1 (if exists)
3. System creates save data from state
4. System validates save data
5. System saves to localStorage
6. System clears backup
7. Success notification shown

**Expected Results:**
- ✅ Save data in slot 1
- ✅ Backup cleared
- ✅ Success notification
- ✅ Console log: `[INFO][SaveManager] Game saved successfully`

---

### Scenario 14: Save Fails - Restore from Backup
**Test Case:** Save operation fails, system restores backup

**Setup:**
```typescript
existingSlot1 = 'valid save data'
localStorage.setItem = jest.fn().mockImplementation(() => {
  throw new Error('Storage full');
});
```

**Actions:**
1. User clicks "Save"
2. System creates backup of slot 1
3. System attempts save (fails!)
4. System catches error
5. System restores from backup
6. Error notification shown

**Expected Results:**
- ✅ Slot 1 still has original data
- ✅ Error notification shown
- ✅ Console log: `[ERROR][SaveManager] Save failed`
- ✅ Console log: `[INFO][SaveManager] Restored from backup`

---

### Scenario 15: Load with Version Incompatibility
**Test Case:** User loads old save with incompatible version

**Setup:**
```typescript
slot1Data = {
  version: '0.5.0', // Old version
  player: { ... },
  company: { ... },
}
currentVersion = '1.0.0'
```

**Actions:**
1. User clicks "Load" on slot 1
2. System parses save data
3. System validates data
4. System checks version compatibility (fails)
5. Error notification shown
6. Load aborted

**Expected Results:**
- ✅ Current state unchanged
- ✅ Error notification: "Incompatible version"
- ✅ Console log: `[ERROR][SaveManager] Incompatible version`

---

## Game Core

### Scenario 16: Balance Update with Validation
**Test Case:** Update balance with guardBalanceFloor

**Setup:**
```typescript
company.balance = 5_000_000
deductAmount = -3_000_000
```

**Actions:**
1. updateBalance(-3_000_000) called
2. System validates amount type (passes)
3. System checks if expense (yes)
4. guardBalanceFloor(5M, 3M) called
5. Validation passes
6. Balance updated to 2,000,000
7. Stats updated

**Expected Results:**
- ✅ Balance: 2,000,000
- ✅ Total expense: +3,000,000
- ✅ Console log: `[DEBUG][GameStore] Balance updated`

**Failure Case:**
```typescript
// If insufficient balance
guardBalanceFloor fails
- ✅ Balance unchanged
- ✅ Error notification
- ✅ Operation aborted
```

---

### Scenario 17: Pause/Resume Game
**Test Case:** User pauses and resumes game

**Actions:**
1. User clicks "Pause"
2. isPaused set to true
3. Time stops advancing
4. Console log: `[INFO][GameStore] Game paused`
5. User clicks "Resume"
6. isPaused set to false
7. Time resumes
8. Console log: `[INFO][GameStore] Game resumed`

**Expected Results:**
- ✅ Game pauses correctly
- ✅ No operations execute while paused
- ✅ Game resumes correctly

---

## Testing Checklist

### For Each Scenario:
- [ ] Setup test data
- [ ] Execute actions
- [ ] Verify expected results
- [ ] Check console logs (logger calls)
- [ ] Check notifications
- [ ] Verify state changes
- [ ] Test error cases
- [ ] Test edge cases

### Cross-Cutting Concerns:
- [ ] All errors logged with context
- [ ] All user actions have notifications
- [ ] All validations use guard functions
- [ ] No crashes on invalid input
- [ ] Graceful degradation for background tasks
- [ ] Error codes used consistently
- [ ] Error codes stripped from user messages

---

## Automation

### Jest Test Structure

```typescript
describe('Integration: Fintech Loan Approval', () => {
  beforeEach(() => {
    // Setup
    useGameStore.setState({
      company: { balance: 10_000_000 },
      fintech: {
        pendingLoans: [{
          id: '1',
          amount: 5_000_000,
        }],
        activeLoans: 0,
      },
    });
  });
  
  it('should approve loan with sufficient balance', async () => {
    // Act
    const result = await handleApproveLoan('1');
    
    // Assert
    expect(result).toBe(true);
    expect(useGameStore.getState().company.balance).toBe(5_000_000);
    expect(useGameStore.getState().fintech.activeLoans).toBe(1);
  });
  
  it('should fail with insufficient balance', async () => {
    // Setup: Reduce balance
    useGameStore.setState({
      company: { balance: 1_000_000 },
    });
    
    // Act
    const result = await handleApproveLoan('1');
    
    // Assert
    expect(result).toBe(false);
    expect(useGameStore.getState().company.balance).toBe(1_000_000);
  });
});
```

---

**Last Updated:** 27 Nov 2025  
**Version:** 1.0.0  
**Test Coverage Target:** 90%+

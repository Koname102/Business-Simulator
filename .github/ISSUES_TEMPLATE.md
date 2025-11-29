# GitHub Issues Template - Business Simulator

 

Berikut adalah daftar suggested issues yang bisa langsung dibuat di GitHub untuk mengisi Kanban board.

 

**Cara Penggunaan:**

1. Copy paste setiap issue ke GitHub Issues

2. Tambahkan label yang sesuai

3. Assign ke milestone yang tepat

4. Drag ke kolom yang sesuai di Kanban board

 

---

 

## 🔴 CRITICAL BUGS (Prioritas Tinggi)

 

### Issue #1: Save System - Data Corruption on Large Save Files

**Title:** Fix save data corruption for games with extensive history

 

**Description:**

Save files become corrupted when transaction history exceeds certain threshold. This causes load failures and potential data loss.

 

**Steps to Reproduce:**

1. Play any game mode for extended period (100+ turns)

2. Generate large transaction history (200+ transactions)

3. Save the game

4. Try to load - fails or shows corrupted data

 

**Expected Behavior:**

- Save files should handle unlimited transaction history

- No data corruption regardless of file size

 

**Actual Behavior:**

- Save fails or loads with missing data

- Some fields show `undefined` or `null`

 

**Labels:** `bug`, `priority: critical`, `save-system`

**Milestone:** v0.1.0

 

---

 

### Issue #2: Insurance Mode - Claim Processing Bug

**Title:** Insurance claims not processing correctly for expired policies

 

**Description:**

When processing claims for policies that expired within the same turn, the system incorrectly approves/denies claims.

 

**Technical Details:**

- Check `lib/game-logic/life-insurance.ts` around line ~150

- Policy expiration logic may have race condition

- Need to verify claim eligibility checks

 

**Labels:** `bug`, `priority: high`, `insurance-mode`, `game-mechanic`

**Milestone:** v0.1.0

 

---

 

### Issue #3: Fintech Mode - Interest Calculation Error

**Title:** Compound interest calculation incorrect for loans > 12 months

 

**Description:**

Long-term loans (> 12 months) show incorrect interest calculations. The compound interest formula doesn't account for monthly compounding properly.

 

**Expected:**

- Correct compound interest: P * (1 + r/n)^(nt)

- Where n = 12 (monthly compounding)

 

**Actual:**

- Simple interest being calculated instead

- Location: `lib/game-logic/fintech.ts:calculateRepayment()`

 

**Labels:** `bug`, `priority: critical`, `fintech-mode`, `game-balance`

**Milestone:** v0.1.0

 

---

 

## 🐛 BUGS (Medium Priority)

 

### Issue #4: UI - Notification Overflow on Mobile

**Title:** Notifications overflow screen on mobile devices

 

**Description:**

When multiple notifications appear simultaneously on mobile, they overflow the screen and become unreadable.

 

**Suggested Solution:**

- Limit visible notifications to 3

- Add notification queue system

- Add "See all notifications" button

 

**Labels:** `bug`, `priority: medium`, `ui/ux`, `mobile`

**Milestone:** v0.2.0

 

---

 

### Issue #5: Time System - Pause Bug During Auto-Save

**Title:** Game doesn't properly pause during auto-save

 

**Description:**

During auto-save (every 30s), if user presses pause, the game state becomes inconsistent.

 

**Location:** `lib/time-system.ts` + `lib/save-manager.ts`

 

**Labels:** `bug`, `priority: medium`, `game-mechanic`

**Milestone:** v0.1.0

 

---

 

### Issue #6: Character Creation - Name Validation Missing

**Title:** No input validation on character name field

 

**Description:**

Users can create characters with:

- Empty names

- Special characters that break saves

- Extremely long names (> 100 chars)

 

**Acceptance Criteria:**

- [ ] Name length: 2-30 characters

- [ ] Allow letters, numbers, spaces, hyphens

- [ ] No special characters that break JSON

- [ ] Trim whitespace

 

**Labels:** `bug`, `priority: medium`, `enhancement`

**Milestone:** v0.1.0

 

---

 

## ✨ ENHANCEMENTS (Improvements to Existing Features)

 

### Issue #7: Save System - Auto-Save Indicator

**Title:** Add visual indicator when auto-save is in progress

 

**Description:**

Users don't know when the game is auto-saving. Add a subtle indicator (e.g., "Saving..." text or spinner icon).

 

**Suggested Implementation:**

- Small icon in top-right corner

- Toast notification: "Game saved"

- Timestamp of last save

 

**Labels:** `enhancement`, `save-system`, `ui/ux`

**Milestone:** v0.2.0

 

---

 

### Issue #8: Dashboard - Financial Summary Improvements

**Title:** Enhance financial dashboard with graphs and trends

 

**Description:**

Current dashboard only shows current numbers. Add:

- Revenue/expense trend graphs (last 12 months)

- Profit margin visualization

- Comparison to previous periods

- Export to CSV/Excel

 

**Labels:** `enhancement`, `ui/ux`, `feature`

**Milestone:** v0.3.0

 

---

 

### Issue #9: Difficulty Scaling - Dynamic Difficulty

**Title:** Implement adaptive difficulty based on player performance

 

**Description:**

Add optional "adaptive" difficulty that adjusts based on:

- Win/loss rate

- Current cash reserves

- Player level

- Time played

 

**Labels:** `enhancement`, `game-mechanic`, `game-balance`

**Milestone:** v0.3.0

 

---

 

### Issue #10: Investment Mode - Sector Research Feature

**Title:** Add sector research/analysis tool for VC investments

 

**Description:**

Before investing, players should be able to research sectors:

- Sector growth trends

- Risk assessment

- Recent news/events

- Competitive landscape

 

**Labels:** `enhancement`, `investment-mode`, `feature`

**Milestone:** v0.3.0

 

---

 

## 🆕 NEW FEATURES

 

### Issue #11: Tutorial System - Interactive Onboarding

**Title:** Create comprehensive tutorial for new players

 

**Description:**

Build step-by-step interactive tutorial that covers:

- Character & company creation

- Basic gameplay mechanics

- Each business mode walkthrough

- Save/load system

- Tips and strategies

 

**Acceptance Criteria:**

- [ ] Tutorial can be skipped

- [ ] Progress is saved

- [ ] Covers all 3 business modes

- [ ] Takes < 10 minutes to complete

- [ ] Includes visual guides/tooltips

 

**Labels:** `feature`, `priority: high`, `ui/ux`

**Milestone:** v0.2.0

 

---

 

### Issue #12: Achievement System

**Title:** Implement achievement and trophy system

 

**Description:**

Create achievement system with 50+ achievements:

 

**Categories:**

- Financial milestones (reach $1M, $10M, $100M)

- Business-specific achievements

- Speed-run achievements

- Special scenario achievements

 

**Technical Requirements:**

- Store in save file

- Show progress tracking

- Unlock rewards (bonuses, cosmetics)

- Achievement notification UI

 

**Labels:** `feature`, `priority: medium`, `game-mechanic`

**Milestone:** v0.4.0

 

---

 

### Issue #13: Settings Panel

**Title:** Create comprehensive settings/preferences panel

 

**Description:**

Add settings panel with:

- Game speed control (0.5x, 1x, 2x, 5x)

- Sound effects toggle

- Music toggle

- Notification preferences

- Auto-save interval

- Language selection (EN/ID)

- Theme selection (Light/Dark)

 

**Labels:** `feature`, `priority: medium`, `ui/ux`

**Milestone:** v0.2.0

 

---

 

### Issue #14: New Business Type - Retail Store

**Title:** Implement retail business game mode

 

**Description:**

Create new playable business type: Retail Store

 

**Features:**

- Inventory management

- Supplier relationships

- Pricing strategies

- Customer foot traffic simulation

- Seasonal trends

- Marketing campaigns

 

**Game Mechanics:**

- Purchase inventory from suppliers

- Set prices (markup %)

- Track stock levels

- Handle customer demand

- Manage store expenses

 

**Labels:** `feature`, `priority: low`, `game-mechanic`

**Milestone:** v0.3.0

 

---

 

### Issue #15: Leaderboard System

**Title:** Implement global and friend leaderboards

 

**Description:**

Create leaderboard system:

 

**Leaderboard Types:**

- Global top 100 (by net worth)

- Friends leaderboard

- Per business-type leaderboards

- Weekly/Monthly/All-time

 

**Technical Requirements:**

- Backend API for leaderboard data

- Caching for performance

- Anti-cheat measures

- Anonymous/public option

 

**Labels:** `feature`, `priority: low`, `multiplayer`

**Milestone:** v0.5.0

 

---

 

## 🎨 UI/UX IMPROVEMENTS

 

### Issue #16: Mobile Responsiveness - Full Support

**Title:** Make entire game fully responsive for mobile devices

 

**Description:**

Currently desktop-only. Make fully playable on mobile:

 

**Targets:**

- Tablets (iPad, Android tablets)

- Large phones (iPhone Pro Max, etc.)

- Medium phones (standard size)

 

**Requirements:**

- [ ] All buttons touchable (min 44x44px)

- [ ] Text readable without zoom

- [ ] Tables scroll horizontally

- [ ] Forms stack vertically

- [ ] Navigation accessible

- [ ] No horizontal scroll (except tables)

 

**Labels:** `ui/ux`, `priority: high`, `mobile`

**Milestone:** v0.2.0

 

---

 

### Issue #17: Dark Mode Support

**Title:** Implement dark mode theme

 

**Description:**

Add dark mode option with:

- Dark color scheme

- Toggle in settings

- Persists across sessions

- Respects system preference (optional)

 

**Labels:** `ui/ux`, `enhancement`

**Milestone:** v0.2.0

 

---

 

### Issue #18: Accessibility Improvements

**Title:** Improve accessibility for screen readers and keyboard navigation

 

**Description:**

Make game accessible:

- Keyboard navigation for all interactions

- ARIA labels for screen readers

- Focus indicators

- Skip navigation links

- Alt text for all images

- Color contrast (WCAG AA)

 

**Labels:** `ui/ux`, `accessibility`, `priority: medium`

**Milestone:** v0.2.0

 

---

 

### Issue #19: Loading States and Skeletons

**Title:** Add loading states and skeleton screens

 

**Description:**

Replace loading spinners with skeleton screens for better UX:

- Dashboard skeleton

- Table loading states

- Button loading states

- Save/load progress indicators

 

**Labels:** `ui/ux`, `enhancement`

**Milestone:** v0.2.0

 

---

 

### Issue #20: Animation and Transitions

**Title:** Add smooth animations and page transitions

 

**Description:**

Enhance UX with animations:

- Page transitions (fade, slide)

- Number counter animations (revenue, balance)

- Notification slide-in/out

- Hover effects

- Button click feedback

 

**Labels:** `ui/ux`, `enhancement`

**Milestone:** v0.2.0

 

---

 

## ⚡ PERFORMANCE

 

### Issue #21: Performance - Save File Optimization

**Title:** Optimize save file size and load times

 

**Description:**

Current save files can become large (> 5MB). Optimize:

- Compress JSON data

- Remove redundant data

- Paginate transaction history

- Lazy load old data

 

**Target:**

- Save file < 500KB

- Load time < 1 second

 

**Labels:** `performance`, `save-system`

**Milestone:** v0.2.0

 

---

 

### Issue #22: Performance - React Re-render Optimization

**Title:** Reduce unnecessary React re-renders

 

**Description:**

Profile and optimize component re-renders:

- Use React.memo for expensive components

- Optimize Zustand selectors

- Virtualize long lists

- Debounce rapid updates

 

**Labels:** `performance`, `technical-debt`

**Milestone:** v0.2.0

 

---

 

## 🧪 TESTING

 

### Issue #23: Unit Tests - Game Logic Coverage

**Title:** Add comprehensive unit tests for game logic

 

**Description:**

Current test coverage: 0%. Add tests for:

- Fintech calculations (interest, repayment)

- Insurance calculations (premiums, claims)

- Investment calculations (returns, AUM)

- Time system

- Save/load system

 

**Target:** 80%+ code coverage for `lib/` folder

 

**Labels:** `testing`, `technical-debt`, `priority: high`

**Milestone:** v0.1.0

 

---

 

### Issue #24: Integration Tests - E2E Testing

**Title:** Set up E2E testing with Playwright/Cypress

 

**Description:**

Add end-to-end tests for critical user flows:

- Complete game flow (create → play → save → load)

- Each business mode playthrough

- Save/load functionality

- Error scenarios

 

**Labels:** `testing`, `technical-debt`

**Milestone:** v0.2.0

 

---

 

## 📚 DOCUMENTATION

 

### Issue #25: API Documentation

**Title:** Document all API routes and game logic functions

 

**Description:**

Add comprehensive documentation:

- JSDoc comments for all functions

- API route documentation

- Type definitions documentation

- Code examples

 

**Labels:** `documentation`, `priority: medium`

**Milestone:** v0.2.0

 

---

 

### Issue #26: Player Guide / Wiki

**Title:** Create player guide with strategies and tips

 

**Description:**

Build comprehensive player guide:

- How to play each business mode

- Advanced strategies

- FAQ

- Troubleshooting

- Best practices

 

**Labels:** `documentation`, `priority: low`

**Milestone:** v0.3.0

 

---

 

### Issue #27: Contributing Guide

**Title:** Create CONTRIBUTING.md for open-source contributors

 

**Description:**

Document contribution process:

- How to set up dev environment

- Code style guide

- PR process

- Issue reporting guidelines

- Architecture overview

 

**Labels:** `documentation`, `priority: medium`

**Milestone:** v0.2.0

 

---

 

## 🔧 TECHNICAL DEBT

 

### Issue #28: TypeScript - Improve Type Coverage

**Title:** Replace 'any' types with proper type definitions

 

**Description:**

Audit codebase and replace all `any` types:

- Game state types

- API response types

- Function parameter types

- Event handler types

 

**Labels:** `technical-debt`, `priority: medium`

**Milestone:** v0.2.0

 

---

 

### Issue #29: Code Organization - Refactor Large Files

**Title:** Break down large files into smaller modules

 

**Description:**

Some files are > 500 lines. Refactor:

- `gameStore.ts` - split by business type

- Large component files

- Game logic files

 

**Labels:** `technical-debt`, `refactoring`

**Milestone:** v0.2.0

 

---

 

### Issue #30: Error Handling - Global Error Boundary

**Title:** Implement comprehensive error handling

 

**Description:**

Add proper error handling:

- React Error Boundaries

- Try-catch blocks for critical code

- User-friendly error messages

- Error logging (Sentry integration)

- Graceful degradation

 

**Labels:** `technical-debt`, `priority: high`

**Milestone:** v0.1.0

 

---

 

## 🎯 GAME BALANCE

 

### Issue #31: Balance - Fintech Default Rates

**Title:** Rebalance default rates for P2P lending

 

**Description:**

Current default rates may be too high/low:

- Analyze player feedback

- Compare to real-world data

- Adjust risk multipliers per difficulty

- Test extensively

 

**Labels:** `game-balance`, `fintech-mode`

**Milestone:** v0.1.0

 

---

 

### Issue #32: Balance - Insurance Premium Calculations

**Title:** Review and adjust insurance premium formulas

 

**Description:**

Ensure premiums are balanced:

- Neither too profitable nor unprofitable

- Age/health factors realistic

- Claim ratios reasonable

- Difficulty scaling appropriate

 

**Labels:** `game-balance`, `insurance-mode`

**Milestone:** v0.1.0

 

---

 

### Issue #33: Balance - Investment Returns

**Title:** Adjust VC/PE investment return rates

 

**Description:**

Review ROI percentages:

- Compare to industry benchmarks

- Ensure risk/reward is balanced

- Sector-specific returns

- Time-horizon appropriate

 

**Labels:** `game-balance`, `investment-mode`

**Milestone:** v0.1.0

 

---

 

## 📦 INFRASTRUCTURE

 

### Issue #34: CI/CD Pipeline Setup

**Title:** Set up GitHub Actions for CI/CD

 

**Description:**

Implement automated pipeline:

- Lint on every PR

- Run tests on every PR

- Build check

- Auto-deploy to Vercel on merge to main

- Semantic versioning

 

**Labels:** `infrastructure`, `priority: medium`

**Milestone:** v0.2.0

 

---

 

### Issue #35: Database Integration

**Title:** Migrate saves from local storage to database

 

**Description:**

Implement backend database for:

- Cloud saves

- User accounts

- Leaderboards

- Analytics

 

**Options:**

- PostgreSQL (Supabase)

- MongoDB (Atlas)

- Firebase

 

**Labels:** `infrastructure`, `feature`, `priority: low`

**Milestone:** v0.5.0

 

---

 

## 🌐 INTERNATIONALIZATION

 

### Issue #36: i18n Support - Bahasa Indonesia

**Title:** Add Indonesian language support

 

**Description:**

Implement full Indonesian translation:

- All UI text

- Game content

- Error messages

- Tutorial

- Use react-i18next or similar

 

**Labels:** `feature`, `i18n`, `priority: low`

**Milestone:** v0.3.0

 

---

 

### Issue #37: i18n Support - Multi-language Framework

**Title:** Set up internationalization framework

 

**Description:**

Prepare for multiple languages:

- Extract all hardcoded strings

- Create translation files

- Language switcher UI

- Locale-specific formatting (dates, currency)

 

**Labels:** `feature`, `i18n`, `priority: low`

**Milestone:** v0.3.0

 

---

 

## 🎁 QUALITY OF LIFE

 

### Issue #38: Keyboard Shortcuts

**Title:** Expand keyboard shortcut support

 

**Description:**

Add more keyboard shortcuts:

- `Space` - Pause/Resume

- `S` - Quick save

- `L` - Load menu

- `N` - New notification view

- `1, 2, 3` - Switch between dashboard tabs

- `Esc` - Close modals

 

**Labels:** `enhancement`, `ui/ux`, `accessibility`

**Milestone:** v0.2.0

 

---

 

### Issue #39: Export Game Statistics

**Title:** Allow players to export game stats and reports

 

**Description:**

Add export functionality:

- Export to CSV (transactions, history)

- Export to PDF (summary report)

- Screenshot feature

- Share to social media

 

**Labels:** `feature`, `enhancement`

**Milestone:** v0.3.0

 

---

 

### Issue #40: In-Game Notes

**Title:** Allow players to add notes/journal entries

 

**Description:**

Add note-taking feature:

- Free-form text notes

- Attach notes to specific dates

- Search notes

- Export notes

- Notes saved with game

 

**Labels:** `feature`, `enhancement`

**Milestone:** v0.3.0

 

---

 

## 📊 ANALYTICS

 

### Issue #41: Analytics Integration

**Title:** Implement analytics tracking

 

**Description:**

Add analytics to understand player behavior:

- Google Analytics 4

- Track key events:

  - Game starts

  - Business type selection

  - Save/load actions

  - Session duration

  - Drop-off points

 

**Privacy:**

- Anonymous by default

- Opt-in for detailed tracking

- GDPR compliant

 

**Labels:** `infrastructure`, `analytics`

**Milestone:** v0.3.0

 

---

 

## 🔐 SECURITY

 

### Issue #42: Input Validation and Sanitization

**Title:** Add comprehensive input validation

 

**Description:**

Validate all user inputs:

- Character name

- Company name

- Save file names

- Numeric inputs (amounts, etc.)

- Prevent XSS attacks

- SQL injection protection (when DB added)

 

**Labels:** `security`, `priority: high`

**Milestone:** v0.1.0

 

---

 

### Issue #43: Rate Limiting for API Routes

**Title:** Implement rate limiting on API endpoints

 

**Description:**

Prevent abuse of save/load APIs:

- Limit requests per IP

- Implement exponential backoff

- Add CAPTCHA for suspicious activity

 

**Labels:** `security`, `infrastructure`

**Milestone:** v0.2.0

 

---

 

## TOTAL: 43 Issues

 

**Breakdown by Priority:**

- 🔴 Critical: 3 issues

- 🟡 High: 7 issues

- 🟢 Medium: 15 issues

- ⚪ Low: 18 issues

 

**Breakdown by Type:**

- 🐛 Bugs: 6 issues

- ✨ Enhancements: 7 issues

- 🆕 Features: 14 issues

- 🎨 UI/UX: 5 issues

- ⚡ Performance: 2 issues

- 🧪 Testing: 2 issues

- 📚 Documentation: 3 issues

- 🔧 Technical Debt: 4 issues

 

---

 

## Next Steps

 

1. **Create these issues on GitHub** - Copy paste ke GitHub Issues

2. **Add appropriate labels** - Sesuai dengan kategori

3. **Organize in Kanban board** - Drag ke kolom yang sesuai

4. **Prioritize** - Mulai dari critical bugs

5. **Start working** - Ambil issue dari "To Do" dan mulai coding!

 

---

 

**Created:** 2025-11-15

**Last Updated:** 2025-11-15
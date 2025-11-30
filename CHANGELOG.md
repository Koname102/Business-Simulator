# Changelog

All notable changes to Business Simulator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### v0.0.3 - Systems & Depth (Planned)
**Timeline:** 6-8 weeks  
**Status:** Planning

#### Added
- Random market events system (economic boom, recession, interest rate changes)
- Regulatory changes system (new laws, compliance costs, government policies)
- Black swan events (pandemic, banking crisis, government bailout)
- Employee hiring system (CFO, Risk Manager, Analyst)
- Employee management and training system
- Level and XP progression system
- Skill tree foundation (Risk Management, Growth, Efficiency)
- Multiple loan products (Personal, Business, Payday loans)
- Market conditions for investment (bull/bear markets, sector trends)
- Game speed controls and settings menu

#### Enhanced
- Credit scoring system with borrower profiles and credit history
- Claims system with investigation and fraud detection
- Notification preferences and customization
- Auto-save frequency configuration

#### Changed
- N/A

#### Bug Fixed
- N/A

---

## [Released]

### [v0.0.2] - Core Stability - 30-11-2025

**Status:** Released

#### Added
- Comprehensive error handling system across all game modules
- Input validation for all user actions
- Error tracking and analytics system
- Recovery suggestions with actionable guidance
- Notification system with error recovery actions
- TypeScript strict mode enforcement
- ESLint error handling rules
- Edge case testing suite
- Complete documentation for error handling

#### Enhanced
- Save manager with version compatibility checking
- Auto-save manager with configurable intervals
- Save/load menu with backup restoration
- Game store with error prevention on critical functions
- Logger system for better debugging

#### Changed
- Replaced console statements with logger system throughout codebase

#### Bug Fixed
- Null reference errors in game state access
- Array out-of-bounds crashes
- Division by zero in return calculations
- Insufficient balance operations
- Save data corruption issues

---

### [v0.0.1] - Alpha Release - 15-11-2025

**Status:** Released

#### Added
- Character creation system (name and age)
- Company creation system (name, business type, difficulty level)
- Difficulty levels (Easy, Medium, Hard)
- Business type selection (Fintech, Insurance, Investment)
- Time system with game clock and speed controls
- Transaction tracking system
- Notification system
- Game pause and resume functionality
- Fintech lending mode with loan applications and approvals
- Credit score system for borrowers
- Loan repayment and default mechanics
- Life insurance mode with policy generation
- Premium collection system
- Insurance claim approval system
- Venture capital mode with deal flow
- Investment portfolio management
- Exit opportunities with profit calculation
- Management and performance fee system
- Basic stats dashboard for each business type
- Save and load game functionality
- Local storage persistence

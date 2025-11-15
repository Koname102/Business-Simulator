# Changelog - Business Simulator

 

All notable changes to this project will be documented in this file.

 

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

 

---

 

## [Unreleased]

 

### Planned

- Mobile responsiveness improvements

- Additional business types (Retail, Manufacturing)

- Tutorial/onboarding system

- Achievement/trophy system


 

---

 

## [0.0.1] - 2025-11-14

 

### Development Timeline

 

#### **2025-11-07** - Project Initialization

**Added:**


- Character Creation Flow System

- Company Creation Flow System

- Fintech Mechanic System (P2P Lending)

 

**Features:**

- Character customization with name and initial setup

- Business type selection interface

- P2P Lending core mechanics:

  - Loan application system

  - Interest calculation

  - Repayment tracking

  - Default risk management

 

---

 

#### **2025-11-08** - Additional Game Modes

**Added:**

- Life Insurance Mechanic System

- Health Insurance Mechanic System

- Venture Capital Mechanic System

 

**Features:**

- Insurance business mechanics:

  - Policy management

  - Premium collection

  - Claims processing

  - Risk assessment

- Investment/VC mechanics:

  - Portfolio management

  - AUM tracking

  - Sector-based investments (12 sectors)

  - Deal flow simulation

 

---

 

#### **2025-11-09** - Core Systems Enhancement

**Added:**

- ✅ Time/Progression System

  - Game time mechanics

  - Pause/resume functionality

  - Time-based events

 

**Fixed:**

- 🐛 Notification system improvements

- 🐛 Minor fixes in Fintech mechanics

 

**Improved:**

- 📈 Notification display and timing

- 📈 Event handling system

 

---

 

#### **2025-11-10** - Balancing & Performance

**Added:**

- ✅ Basic Economy & Balance system for Fintech

  - Difficulty levels (Easy/Medium/Hard)

  - Starting capital adjustments

  - Default rate configurations

 

**Fixed:**

- 🐛 Game speed optimization

- 🐛 Minor fixes in Fintech mechanics

 

**Improved:**

- ⚡ Performance optimization

- 📈 Game progression pacing

- 📈 Financial calculations accuracy

 

---

 

#### **2025-11-11** - Multi-Mode Balancing & Save System

**Added:**

- ✅ Basic Economy & Balance for Insurance modes

- ✅ Basic Economy & Balance for Investment mode

- ✅ Save & Load System (Initial implementation)

  - Save game state

  - Load previous games

  - Basic save file management

 

**Improved:**

- 📈 Cross-mode game balance

- 📈 Difficulty scaling across all business types

 

---

 

#### **2025-11-12** - Save System Development

**In Progress:**

- 🚧 Save & Load System enhancements

  - Multiple save slots

  - Save metadata (date, time, player info)

  - Save file validation

 

**Technical:**

- Backend API routes for save operations

- Persistent storage implementation

- Save state serialization

 

---

 

#### **2025-11-13** - Architecture Refactoring

**Changed:**

- 🔄 Folder structure reorganization

  - Improved component organization

  - Better separation of concerns

  - Clearer game mode separation

- 🔄 Insurance mechanics refactor: Generic → Life Insurance

  - Specialized life insurance mechanics

  - More realistic policy calculations

  - Better claim processing logic

 

**Improved:**

- 📁 Code organization and maintainability

- 📁 Developer experience

 

---

 

#### **2025-11-14** - Polish & Refinement

**Fixed:**

- 🐛 Minor detail fixes in Life Insurance mechanics

- 🐛 UI/UX improvements for Life Insurance mode

 

**Improved:**

- 📈 Life Insurance calculation accuracy

- 📈 Policy lifecycle management

- 📈 User feedback and notifications

 

---

 

## System Features Summary

 

### 🎮 Current Features (v0.0.1)

 

#### **Core Systems**

1. ✅ **Character Creation Flow**

   - Name customization

   - Initial setup configuration

 

2. ✅ **Company Creation Flow**

   - Business type selection (Fintech/Insurance/Investment)

   - Difficulty level selection

   - Starting capital configuration

 

3. ✅ **Time & Progression System**

   - Dynamic game time

   - Pause/Resume controls

   - Time-based event triggers

 

4. ✅ **Save & Load System**

   - Multiple save slots

   - Auto-save functionality (every 30s)

   - Save metadata tracking

   - Import/Export saves

 

#### **Business Game Modes**

 

5. ✅ **Fintech Mechanic System (P2P Lending)**

   - Loan application processing

   - Credit score evaluation

   - Interest rate calculation

   - Repayment tracking

   - Default risk management

   - Customer relationship tracking

 

6. ✅ **Life Insurance Mechanic System**

   - Policy issuance and management

   - Premium calculation based on age/health

   - Claims processing (death benefits)

   - Policy status tracking

   - Actuarial calculations

 

7. ✅ **Health Insurance Mechanic System**

   - Health policy management

   - Premium collection

   - Medical claims processing

   - Coverage tracking

   - Customer health monitoring

 

8. ✅ **Venture Capital Mechanic System**

   - Investment portfolio management

   - AUM (Assets Under Management) tracking

   - 12-sector investment options

   - Deal evaluation and selection

   - Portfolio returns calculation

   - Market volatility simulation

 

#### **Game Balance & Difficulty**

- ✅ Three difficulty levels (Easy/Medium/Hard)

- ✅ Dynamic starting capital (1.5x - 1.0x multipliers)

- ✅ Adjustable risk parameters

- ✅ Balanced progression curves

 

---

 

## Technical Stack

 

- **Frontend**: Next.js 16.0.1, React 19.2.0, TypeScript 5

- **Styling**: Tailwind CSS 4

- **State Management**: Zustand 5.0.8

- **Linting**: ESLint 9

 

---
 

## Contributors

 

- Development Team

- Built with AI assistance (Claude)

 

---

 

[Unreleased]: https://github.com/Koname102/Business-Simulator/compare/v0.0.1...HEAD

[0.0.1]: https://github.com/Koname102/Business-Simulator/releases/tag/v0.0.1

# BlockPay

> **Decentralized Payroll Streaming on Stacks Blockchain**

BlockPay is a sophisticated, production-ready decentralized payroll system that enables real-time salary streaming with customizable vesting schedules. Employees earn wages every block and can withdraw anytime, eliminating traditional pay period constraints.

[![Tests](https://img.shields.io/badge/tests-29%2F29%20passing-brightgreen)]()
[![Clarity](https://img.shields.io/badge/clarity-2.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## Key Features

- **Real-Time Streaming**: Employees earn salary every block (~10 minutes on Stacks)
- **Non-Custodial**: Funds secured in smart contracts, not held by employers
- **Vesting Schedules**: Support for linear and cliff vesting
- **Bonus Payments**: One-time payments outside regular streams
- **Stream Modifications**: Extend duration or increase amounts mid-stream
- **Emergency Controls**: Global and per-stream pause mechanisms
- **Multi-Token Support**: Pay in STX or any SIP-010 token
- **Batch Operations**: Create multiple streams in a single transaction
- **Complete Audit Trail**: Immutable on-chain history of all transactions

## Table of Contents

- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Architecture

BlockPay consists of 6 interconnected smart contracts:

```
┌─────────────────┐
│   blockpay.clar │  ← Main contract (stream management)
└────────┬────────┘
         │
    ┌────┴────┬──────────┬────────────┐
    │         │          │            │
┌───▼──┐  ┌──▼───┐  ┌───▼────┐  ┌────▼────┐
│access│  │treasury│ │stream  │  │emergency│
│control│ │        │ │-math   │  │-controls│
└──────┘  └────────┘ └────────┘  └─────────┘
              │
         ┌────▼────┐
         │sip-010  │
         │-trait   │
         └─────────┘
```

### Contract Responsibilities

| Contract | Purpose | Lines of Code |
|----------|---------|---------------|
| **blockpay.clar** | Core payroll logic, stream management | 611 |
| **access-control.clar** | Role-based permissions (owner/admin/employer) | 250+ |
| **treasury.clar** | Multi-token vault, balance tracking | 380+ |
| **stream-math.clar** | Vesting calculations, safe math operations | 200+ |
| **emergency-controls.clar** | Circuit breaker, pause mechanisms | 276 |
| **sip-010-trait.clar** | Token standard interface | 30 |

## Smart Contracts

### 1. Access Control
**Role-based permission system** with multi-signature capabilities:
- Owner role (highest authority)
- Admin role (system management)
- Employer role (stream creation)
- Time-locked role changes for security

### 2. Treasury
**Secure multi-token vault** managing all funds:
- Per-employer balance tracking
- Whitelist-based withdrawal authorization
- Comprehensive audit trail
- Emergency withdrawal capabilities

### 3. Stream Math
**Precision calculation engine**:
- Rate-per-block calculations
- Linear vesting support
- Cliff vesting with linear release
- Overflow/underflow protection

### 4. Emergency Controls
**Circuit breaker system**:
- Global system pause
- Per-stream pause controls
- Emergency mode activation
- Admin-only access

### 5. BlockPay (Main Contract)
**Core payroll functionality**:
- Stream creation with vesting
- Real-time withdrawals
- Stream modifications
- Cancellation with refunds
- Batch operations
- Bonus payments

## Installation

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) >= 2.0
- [Node.js](https://nodejs.org/) >= 18.x
- [Git](https://git-scm.com/)

### Clone Repository

```bash
git clone https://github.com/Millburn-Labs/BlockPay.git
cd BlockPay
```

### Install Dependencies

```bash
npm install
```

### Verify Installation

```bash
clarinet check
npm test
```

Expected output:
```
✔ 6 contracts checked
✓ 29 tests passed
```

## Quick Start

### 1. Setup Roles

```clarity
;; Owner adds admin
(contract-call? .access-control add-admin 'ST1ADMIN...)

;; Admin adds employer
(contract-call? .access-control add-employer 'ST1EMPLOYER...)
```

### 2. Deposit Funds

```clarity
;; Employer deposits 10 STX
(contract-call? .treasury deposit-stx u10000000)
```

### 3. Create Salary Stream

```clarity
(contract-call? .blockpay create-stream
  'ST1EMPLOYEE...           ;; employee address
  u1000000                  ;; 1 STX total
  u1000                     ;; 1000 blocks duration (~7 days)
  "linear"                  ;; vesting type
  none                      ;; no cliff
  true                      ;; can modify
  u"Monthly salary")        ;; metadata
```

### 4. Employee Withdraws

```clarity
;; After 100 blocks, employee can withdraw ~0.1 STX
(contract-call? .blockpay withdraw u1)
```

## Usage Examples

### Linear Vesting Stream

```clarity
;; Create a 30-day salary stream with linear vesting
(contract-call? .blockpay create-stream
  employee-address
  u30000000                 ;; 30 STX
  u4320                     ;; ~30 days (4320 blocks)
  "linear"
  none
  true
  u"Monthly salary - January 2024")
```

### Cliff Vesting Stream

```clarity
;; Create a 1-year vesting with 3-month cliff
(contract-call? .blockpay create-stream
  employee-address
  u100000000                ;; 100 STX
  u52560                    ;; ~365 days
  "cliff-linear"
  (some u13140)             ;; 3-month cliff (~90 days)
  false
  u"Annual equity grant")
```

### Batch Stream Creation

```clarity
;; Create multiple streams in one transaction
(contract-call? .blockpay batch-create-streams
  (list employee1 employee2 employee3)
  (list u5000000 u7500000 u10000000)
  (list u4320 u4320 u4320)
  "linear"
  true)
```

### Bonus Payment

```clarity
;; Pay a one-time bonus
(contract-call? .blockpay add-bonus
  employee-address
  u2000000                  ;; 2 STX
  u"Q4 Performance Bonus")
```

### Stream Modification

```clarity
;; Extend stream duration
(contract-call? .blockpay extend-stream
  u1                        ;; stream-id
  u2160)                    ;; add ~15 days

;; Increase stream amount
(contract-call? .blockpay increase-stream-amount
  u1                        ;; stream-id
  u5000000)                 ;; add 5 STX
```

### Emergency Pause

```clarity
;; Pause specific stream
(contract-call? .emergency-controls pause-stream u1)

;; Pause entire system
(contract-call? .emergency-controls pause-system)
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- --grep "Access Control"
```

### Test Coverage

- Access Control (4 tests)
- Treasury Management (4 tests)
- Stream Math (4 tests)
- Emergency Controls (4 tests)
- Stream Creation (4 tests)
- Withdrawals (3 tests)
- Modifications (3 tests)
- Batch Operations (1 test)
- Bonus Payments (2 tests)

**Total: 29/29 tests passing (100%)**

### Contract Verification

```bash
clarinet check
```

Expected warnings: 24 (all are standard "potentially unchecked data" warnings for user inputs - safe and expected)

## Deployment

### Testnet Deployment

```bash
clarinet deployments apply --testnet
```

### Mainnet Deployment

```bash
clarinet deployments apply --mainnet
```

### Post-Deployment Setup

1. **Whitelist BlockPay Contract**
```clarity
(contract-call? .treasury set-whitelisted .blockpay true)
```

2. **Add Initial Admins**
```clarity
(contract-call? .access-control add-admin 'ST1ADMIN...)
```

3. **Configure Emergency Controls**
```clarity
(contract-call? .emergency-controls add-emergency-admin 'ST1ADMIN...)
```

## Security

### Audited Features

- Authorization checks on all state-changing functions
- Overflow protection in all mathematical operations
- Reentrancy prevention (Clarity design)
- Emergency pause mechanisms
- Whitelist-based withdrawal authorization
- Complete audit trail

### Known Limitations

- Maximum 100 withdrawal history entries per employer
- Maximum 50 streams per batch operation
- Maximum 50 pause history entries per stream

### Security Best Practices

1. **Multi-sig for Owner Role**: Use a multi-signature wallet for the contract owner
2. **Regular Monitoring**: Monitor withdrawal patterns and stream modifications
3. **Emergency Contacts**: Maintain a list of emergency admins
4. **Gradual Rollout**: Start with small amounts before scaling
5. **Regular Audits**: Review withdrawal history and system logs

## Gas Costs (Approximate)

| Operation | Cost (STX) |
|-----------|------------|
| Create Stream | ~0.01 |
| Withdraw | ~0.005 |
| Modify Stream | ~0.008 |
| Batch Create (10 streams) | ~0.05 |
| Bonus Payment | ~0.007 |

*Note: Costs vary based on network congestion*

## Development

### Project Structure

```
BlockPay/
├── contracts/              # Smart contracts
│   ├── blockpay.clar
│   ├── access-control.clar
│   ├── treasury.clar
│   ├── stream-math.clar
│   ├── emergency-controls.clar
│   └── sip-010-trait.clar
├── tests/                  # Test files
│   └── blockpay.test.ts
├── deployments/            # Deployment configurations
├── settings/               # Network settings
├── Clarinet.toml          # Clarinet configuration
└── package.json           # Node dependencies
```

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD approach)
3. Implement feature in contracts
4. Run tests: `npm test`
5. Verify contracts: `clarinet check`
6. Submit pull request

## Roadmap

- Multi-signature employer accounts
- Automated tax withholding
- DeFi integration for yield generation
- Mobile app for easy withdrawals
- Analytics dashboard
- Recurring bonus schedules
- Performance-based variable rates
- Cross-chain bridge support

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on [Stacks Blockchain](https://www.stacks.co/)
- Developed with [Clarinet](https://github.com/hirosystems/clarinet)
- Inspired by Sablier and other streaming payment protocols

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Millburn-Labs/BlockPay/issues)
- **Discord**: [Join our community](https://discord.gg/blockpay)
- **Email**: support@blockpay.io

## Links

- **Website**: https://blockpay.io
- **GitHub**: https://github.com/Millburn-Labs/BlockPay
- **Twitter**: [@BlockPayHQ](https://twitter.com/BlockPayHQ)
- **Documentation**: https://docs.blockpay.io

---

**Built with care by Millburn Labs**

*Revolutionizing payroll, one block at a time.*

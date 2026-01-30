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
- [API Reference](#api-reference)
- [Suggested Future Enhancements](#suggested-future-enhancements)
- [Roadmap](#roadmap)
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

## API Reference

### BlockPay Contract Functions

#### Stream Management
- `create-stream` - Create a new salary stream with vesting
- `withdraw` - Withdraw earned amount from a stream
- `extend-stream` - Extend stream duration (if modifiable)
- `increase-stream-amount` - Increase stream total amount (if modifiable)
- `cancel-stream` - Cancel a stream and refund unvested amount
- `batch-create-streams` - Create multiple streams in one transaction
- `add-bonus` - Pay a one-time bonus to an employee

#### Read-Only Queries
- `get-stream` - Get stream details by ID
- `get-employer-streams` - Get all stream IDs for an employer
- `get-employee-streams` - Get all stream IDs for an employee
- `get-earned-amount` - Calculate earned amount for a stream
- `get-withdrawable-amount` - Get withdrawable amount for a stream
- `get-remaining-amount` - Get remaining amount in a stream
- `get-stream-status` - Get current status of a stream
- `get-stream-modifications` - Get modification history for a stream
- `get-next-stream-id` - Get the next available stream ID
- `get-total-streams-created` - Get total number of streams created

### Treasury Contract Functions

#### Deposits & Withdrawals
- `deposit-stx` - Deposit STX to employer balance
- `deposit-token` - Deposit SIP-010 tokens to employer balance
- `withdraw-stx` - Withdraw STX (whitelisted contracts only)
- `withdraw-token` - Withdraw tokens (whitelisted contracts only)

#### Read-Only Queries
- `get-employer-stx-balance` - Get employer's STX balance
- `get-employer-token-balance` - Get employer's token balance
- `get-total-stx-deposits` - Get total STX deposited
- `get-total-stx-withdrawals` - Get total STX withdrawn
- `get-withdrawal-history` - Get withdrawal audit trail

### Access Control Functions

- `add-admin` - Add an admin (owner only)
- `remove-admin` - Remove an admin (owner only)
- `add-employer` - Add an employer (owner/admin)
- `remove-employer` - Remove an employer (owner/admin)
- `is-employer` - Check if principal is an employer
- `is-admin` - Check if principal is an admin

### Emergency Controls Functions

- `pause-system` - Pause entire system (admin only)
- `unpause-system` - Unpause system (admin only)
- `pause-stream` - Pause a specific stream (admin only)
- `unpause-stream` - Unpause a specific stream (admin only)
- `enable-emergency-mode` - Enable emergency mode (admin only)
- `disable-emergency-mode` - Disable emergency mode (owner only)

## Suggested Future Enhancements

The following functions can be added to the contract without breaking existing functionality. These are read-only queries and new public functions that extend capabilities:

### Analytics & Reporting

**Employee Analytics:**
- `get-employee-total-earned` - Total earned across all streams
- `get-employee-total-withdrawable` - Total withdrawable across all active streams
- `get-employee-total-withdrawn` - Total withdrawn across all streams
- `get-employee-active-streams-count` - Count of active streams for an employee

**Employer Analytics:**
- `get-employer-total-committed` - Sum of all active stream amounts
- `get-employer-total-paid` - Total paid to all employees
- `get-employer-active-streams-count` - Count of active streams
- `get-employer-streams-by-status` - Filter streams by status (active/completed/cancelled)

**Global Analytics:**
- `get-average-stream-duration` - Average duration of all streams
- `get-average-stream-amount` - Average amount per stream

### Enhanced Stream Queries

- `get-streams-by-status` - Get all streams with a specific status
- `get-streams-expiring-soon` - Streams expiring within X blocks
- `get-streams-with-low-balance` - Streams with < X% remaining
- `get-stream-progress` - Returns percentage complete (0-100)

### Batch Operations

- `batch-withdraw` - Withdraw from multiple streams in one transaction
- `get-batch-withdrawable` - Get total withdrawable from multiple streams

### Stream Health & Monitoring

- `get-streams-needing-attention` - Returns streams that are:
  - Expiring soon (< 144 blocks)
  - Low balance (< 10% remaining)
  - No withdrawals in last 1000 blocks
- `get-stream-last-activity` - Block height of last withdrawal or modification

### Metadata Management

- `update-stream-metadata` - Update stream metadata (if `can-modify` is true)

### Financial Summaries

- `get-employer-financial-summary` - Returns:
  - Total committed
  - Total paid
  - Active streams count
  - Pending withdrawals estimate
- `get-employee-financial-summary` - Returns:
  - Total earned
  - Total withdrawn
  - Total withdrawable
  - Active streams count

### Time-Based Queries

- `get-streams-created-since` - Streams created after a specific block
- `get-streams-completed-since` - Streams completed after a specific block

*Note: These features are suggestions and have not been implemented yet. They are designed to be non-breaking additions to the existing contract.*

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

### Short-term (Q1-Q2)
- **Analytics & Reporting**: Implement employee and employer analytics functions
- **Batch Withdrawals**: Allow employees to withdraw from multiple streams at once
- **Stream Health Monitoring**: Add functions to identify streams needing attention
- **Enhanced Queries**: Add filtering and search capabilities for streams

### Medium-term (Q3-Q4)
- Multi-signature employer accounts
- Automated tax withholding
- Recurring bonus schedules
- Performance-based variable rates
- Mobile app for easy withdrawals

### Long-term
- DeFi integration for yield generation
- Analytics dashboard (off-chain)
- Cross-chain bridge support
- Multi-currency payroll support

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

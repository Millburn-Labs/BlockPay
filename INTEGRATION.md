# BlockPay Integration Guide

This document provides a comprehensive guide for integrating BlockPay smart contracts into your application using `@stacks/connect` and `@stacks/transactions`.

## Overview

BlockPay now includes integration utilities that make it easy to interact with the smart contracts from web applications. The integration supports:

- **Wallet Authentication** - Using `@stacks/connect` for secure wallet connections
- **Transaction Building** - Using `@stacks/transactions` for programmatic transaction creation
- **Type Safety** - Full TypeScript support for all contract interactions

## Installation

The required packages are already installed:

```bash
npm install @stacks/connect @stacks/transactions
```

## Quick Start

### 1. Import the Client

```typescript
import { BlockPayClient, DEFAULT_CONTRACT_ADDRESSES } from './src/blockpay-client';
import { UserSession, AppConfig } from '@stacks/connect';
```

### 2. Initialize the Client

```typescript
// For testnet
const client = new BlockPayClient('testnet', DEFAULT_CONTRACT_ADDRESSES);

// For mainnet
const client = new BlockPayClient('mainnet', DEFAULT_CONTRACT_ADDRESSES);
```

### 3. Connect Wallet

```typescript
import { showConnect } from '@stacks/connect';

const appConfig: AppConfig = {
  appDetails: {
    name: 'BlockPay',
    icon: 'https://blockpay.io/icon.png',
  },
  redirectTo: '/',
};

const userSession = new UserSession({ appConfig });

// Show connect modal
await showConnect({
  appDetails: appConfig.appDetails,
  redirectTo: '/',
  onFinish: () => {
    console.log('User connected:', userSession.loadUserData());
  },
});
```

### 4. Interact with Contracts

```typescript
// Deposit STX
await client.depositSTX(10_000_000, userSession); // 10 STX

// Create a stream
await client.createStream(
  'ST1EMPLOYEE...',
  1_000_000, // 1 STX
  1000, // 1000 blocks (~7 days)
  'linear',
  undefined, // no cliff
  true, // can modify
  'Monthly salary',
  userSession
);

// Withdraw from stream
await client.withdraw(1, userSession); // Stream ID 1
```

## File Structure

```
src/
├── blockpay-client.ts      # Main client class with all contract methods
├── index.ts                 # Main export file
├── examples/
│   ├── basic-usage.ts      # Basic usage examples
│   └── react-example.tsx   # React component example
└── README.md               # Detailed integration documentation
```

## Key Features

### 1. Wallet Integration

All methods support wallet interaction through `@stacks/connect`:

```typescript
// With wallet (user signs in browser)
await client.createStream(..., userSession);

// Without wallet (programmatic, requires private key)
const tx = await client.createStream(...);
```

### 2. Type Safety

Full TypeScript support with proper types for all parameters:

```typescript
await client.createStream(
  employeeAddress: string,
  totalAmountMicroStx: number,
  durationBlocks: number,
  vestingType: 'linear' | 'cliff-linear',
  cliffBlocks?: number,
  canModify: boolean,
  metadata: string,
  userSession?: UserSession
);
```

### 3. Error Handling

All methods can throw errors - always use try-catch:

```typescript
try {
  await client.createStream(...);
} catch (error) {
  console.error('Error:', error);
  // Handle error
}
```

## Available Methods

### Treasury Functions

- `depositSTX(amountMicroStx, userSession?)` - Deposit STX to treasury
- `getEmployerSTXBalance(employerAddress)` - Get employer balance

### Access Control Functions

- `addAdmin(adminAddress, userSession?)` - Add admin (owner only)
- `addEmployer(employerAddress, userSession?)` - Add employer (admin/owner only)

### Stream Functions

- `createStream(...)` - Create a salary stream
- `withdraw(streamId, userSession?)` - Withdraw from stream
- `extendStream(streamId, additionalBlocks, userSession?)` - Extend duration
- `increaseStreamAmount(streamId, additionalAmount, userSession?)` - Increase amount
- `cancelStream(streamId, userSession?)` - Cancel stream
- `batchCreateStreams(...)` - Create multiple streams
- `addBonus(employeeAddress, amount, metadata, userSession?)` - Add bonus

### Emergency Controls

- `pauseSystem(userSession?)` - Pause entire system
- `unpauseSystem(userSession?)` - Unpause system
- `pauseStream(streamId, userSession?)` - Pause specific stream

## React Integration

See `src/examples/react-example.tsx` for a complete React component:

```tsx
import { BlockPayExample } from './src/examples/react-example';

function App() {
  return <BlockPayExample />;
}
```

## Configuration

### Update Contract Addresses

After deploying contracts, update the addresses:

```typescript
const customAddresses = {
  blockpay: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.blockpay',
  treasury: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.treasury',
  accessControl: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.access-control',
  emergencyControls: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.emergency-controls',
};

const client = new BlockPayClient('testnet', customAddresses);
```

### Network Selection

```typescript
// Testnet (default for development)
const testnetClient = new BlockPayClient('testnet');

// Mainnet (for production)
const mainnetClient = new BlockPayClient('mainnet');
```

## Examples

### Example 1: Complete Workflow

```typescript
import { BlockPayClient } from './src/blockpay-client';
import { UserSession, showConnect } from '@stacks/connect';

// 1. Initialize client
const client = new BlockPayClient('testnet');

// 2. Connect wallet
const userSession = new UserSession({ appConfig });
await showConnect({ appDetails: appConfig.appDetails, redirectTo: '/' });

// 3. Deposit STX
await client.depositSTX(10_000_000, userSession);

// 4. Create stream
await client.createStream(
  'ST1EMPLOYEE...',
  1_000_000,
  1000,
  'linear',
  undefined,
  true,
  'Monthly salary',
  userSession
);

// 5. Employee withdraws
await client.withdraw(1, userSession);
```

### Example 2: Batch Operations

```typescript
await client.batchCreateStreams(
  ['ST1EMP1...', 'ST1EMP2...', 'ST1EMP3...'],
  [5_000_000, 7_500_000, 10_000_000],
  [4320, 4320, 4320],
  'linear',
  true,
  userSession
);
```

### Example 3: Cliff Vesting

```typescript
await client.createStream(
  'ST1EMPLOYEE...',
  100_000_000, // 100 STX
  52560, // ~365 days
  'cliff-linear',
  13140, // 3-month cliff
  false,
  'Annual equity grant',
  userSession
);
```

## Transaction Fees

Approximate fees (in microSTX):
- Deposit: ~1,000
- Create Stream: ~10,000
- Withdraw: ~5,000
- Modify Stream: ~8,000
- Batch Create: ~50,000
- Bonus: ~7,000

*Actual fees may vary based on network conditions.*

## Best Practices

1. **Always validate inputs** before calling contract functions
2. **Handle user cancellations** - Users may cancel in their wallet
3. **Show transaction status** - Display pending/completed states
4. **Error messages** - Provide clear, user-friendly error messages
5. **Network selection** - Use testnet for development
6. **Contract addresses** - Verify addresses match your deployment

## Troubleshooting

### Transaction Fails

- Check user has sufficient STX for fees
- Verify contract addresses are correct
- Ensure user has proper permissions
- Check if system is paused

### Wallet Connection Issues

- Ensure `@stacks/connect` is properly configured
- Check app details (name, icon) are set
- Verify network matches between client and wallet

### Type Errors

- Ensure TypeScript is properly configured
- Check all required types are imported
- Verify package versions are compatible

## Next Steps

1. **Deploy Contracts** - Deploy BlockPay contracts to testnet/mainnet
2. **Update Addresses** - Update contract addresses in your client
3. **Test Integration** - Test all functions on testnet
4. **Build UI** - Create your application UI using the examples
5. **Deploy** - Deploy your application

## Additional Resources

- [BlockPay Main README](./README.md) - Contract documentation
- [@stacks/connect Docs](https://github.com/stacks-network/connect) - Wallet integration
- [@stacks/transactions Docs](https://github.com/stacks-network/stacks.js) - Transaction building
- [Stacks Documentation](https://docs.stacks.co/) - General Stacks docs

## Support

For issues or questions:
- Check the [BlockPay README](./README.md)
- Review contract documentation
- Open an issue on GitHub

---

**Happy Building! 🚀**

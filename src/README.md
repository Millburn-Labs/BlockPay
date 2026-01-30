# BlockPay Integration Guide

This directory contains integration utilities for using BlockPay smart contracts with `@stacks/connect` and `@stacks/transactions`.

## Installation

The required packages are already installed:
- `@stacks/connect` - For wallet authentication and user interactions
- `@stacks/transactions` - For building and broadcasting transactions

## Quick Start

### 1. Basic Usage

```typescript
import { BlockPayClient, DEFAULT_CONTRACT_ADDRESSES } from './blockpay-client';
import { UserSession, AppConfig } from '@stacks/connect';

// Initialize the client
const client = new BlockPayClient('testnet', DEFAULT_CONTRACT_ADDRESSES);

// Connect wallet
const appConfig: AppConfig = {
  appDetails: {
    name: 'BlockPay',
    icon: 'https://blockpay.io/icon.png',
  },
  redirectTo: '/',
};

const userSession = new UserSession({ appConfig });

// Deposit STX
await client.depositSTX(10_000_000, userSession); // 10 STX

// Create a stream
await client.createStream(
  'ST1EMPLOYEE...',
  1_000_000, // 1 STX
  1000, // 1000 blocks
  'linear',
  undefined,
  true,
  'Monthly salary',
  userSession
);
```

### 2. React Integration

See `examples/react-example.tsx` for a complete React component example.

```tsx
import { BlockPayExample } from './examples/react-example';

function App() {
  return <BlockPayExample />;
}
```

### 3. Programmatic Transactions

For building transactions without wallet interaction:

```typescript
// Build transaction
const transaction = await client.createStream(
  employeeAddress,
  amount,
  duration,
  'linear',
  undefined,
  true,
  'Stream',
  undefined // No userSession
);

// Sign and broadcast (you'll need to provide signing logic)
// const signedTx = await signTransaction(transaction, privateKey);
// const result = await broadcastTransaction(signedTx, network);
```

## API Reference

### BlockPayClient

#### Constructor

```typescript
new BlockPayClient(
  network: 'testnet' | 'mainnet',
  contractAddresses?: ContractAddresses,
  appConfig?: AppConfig
)
```

#### Methods

##### Treasury Functions

- `depositSTX(amountMicroStx: number, userSession?: UserSession)` - Deposit STX to treasury
- `getEmployerSTXBalance(employerAddress: string)` - Get employer's STX balance

##### Access Control Functions

- `addAdmin(adminAddress: string, userSession?: UserSession)` - Add an admin (owner only)
- `addEmployer(employerAddress: string, userSession?: UserSession)` - Add an employer (admin/owner only)

##### Stream Functions

- `createStream(...)` - Create a salary stream
- `withdraw(streamId: number, userSession?: UserSession)` - Withdraw from a stream
- `extendStream(streamId: number, additionalBlocks: number, userSession?: UserSession)` - Extend stream duration
- `increaseStreamAmount(streamId: number, additionalAmountMicroStx: number, userSession?: UserSession)` - Increase stream amount
- `cancelStream(streamId: number, userSession?: UserSession)` - Cancel a stream
- `batchCreateStreams(...)` - Create multiple streams in one transaction
- `addBonus(employeeAddress: string, amountMicroStx: number, metadata: string, userSession?: UserSession)` - Add bonus payment

##### Emergency Controls

- `pauseSystem(userSession?: UserSession)` - Pause entire system (admin only)
- `unpauseSystem(userSession?: UserSession)` - Unpause system (admin only)
- `pauseStream(streamId: number, userSession?: UserSession)` - Pause a specific stream (admin only)

## Configuration

### Contract Addresses

Update the contract addresses after deployment:

```typescript
import { BlockPayClient } from './blockpay-client';

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
// Testnet
const testnetClient = new BlockPayClient('testnet');

// Mainnet
const mainnetClient = new BlockPayClient('mainnet');
```

## Examples

See the `examples/` directory for:
- `basic-usage.ts` - Basic usage examples
- `react-example.tsx` - React component example

## Error Handling

All methods can throw errors. Always wrap calls in try-catch blocks:

```typescript
try {
  await client.createStream(...);
} catch (error) {
  console.error('Error creating stream:', error);
  // Handle error appropriately
}
```

## Transaction Fees

Approximate transaction fees (in microSTX):
- Deposit STX: ~1,000
- Create Stream: ~10,000
- Withdraw: ~5,000
- Modify Stream: ~8,000
- Batch Create: ~50,000
- Bonus Payment: ~7,000

*Note: Actual fees may vary based on network conditions.*

## Best Practices

1. **Always validate inputs** before calling contract functions
2. **Handle user cancellations** - Users may cancel transactions in their wallet
3. **Show transaction status** - Display pending/completed states to users
4. **Error messages** - Provide clear error messages to users
5. **Network selection** - Use testnet for development, mainnet for production
6. **Contract addresses** - Always verify contract addresses match your deployment

## Troubleshooting

### Transaction fails

- Check that the user has sufficient STX for fees
- Verify contract addresses are correct
- Ensure user has proper permissions (employer, admin, etc.)
- Check if system is paused

### Wallet connection issues

- Ensure `@stacks/connect` is properly configured
- Check that the app details (name, icon) are set
- Verify network matches between client and wallet

### Type errors

- Ensure TypeScript is properly configured
- Check that all required types are imported
- Verify package versions are compatible

## Support

For issues or questions:
- Check the main [BlockPay README](../README.md)
- Review contract documentation
- Open an issue on GitHub

/**
 * Basic Usage Examples for BlockPay Client
 * 
 * This file demonstrates how to use the BlockPayClient with @stacks/connect
 * and @stacks/transactions to interact with BlockPay smart contracts.
 */

import { BlockPayClient, DEFAULT_CONTRACT_ADDRESSES } from '../blockpay-client';
import { UserSession } from '@stacks/connect';

// Initialize the client
const client = new BlockPayClient('testnet', DEFAULT_CONTRACT_ADDRESSES);

// Example 1: Connect wallet and deposit STX
export async function exampleDepositSTX(userSession: UserSession) {
  try {
    // Deposit 10 STX (10,000,000 microSTX)
    await client.depositSTX(10_000_000, userSession);
    console.log('Deposit transaction initiated');
  } catch (error) {
    console.error('Error depositing STX:', error);
  }
}

// Example 2: Create a salary stream
export async function exampleCreateStream(userSession: UserSession) {
  try {
    const employeeAddress = 'ST1EMPLOYEE123456789012345678901234567890';
    const totalAmount = 1_000_000; // 1 STX in microSTX
    const durationBlocks = 1000; // ~7 days (1000 blocks * ~10 min/block)
    
    await client.createStream(
      employeeAddress,
      totalAmount,
      durationBlocks,
      'linear',
      undefined, // no cliff
      true, // can modify
      'Monthly salary - January 2024',
      userSession
    );
    
    console.log('Stream creation transaction initiated');
  } catch (error) {
    console.error('Error creating stream:', error);
  }
}

// Example 3: Create a stream with cliff vesting
export async function exampleCreateCliffStream(userSession: UserSession) {
  try {
    const employeeAddress = 'ST1EMPLOYEE123456789012345678901234567890';
    const totalAmount = 100_000_000; // 100 STX
    const durationBlocks = 52560; // ~365 days
    const cliffBlocks = 13140; // 3-month cliff (~90 days)
    
    await client.createStream(
      employeeAddress,
      totalAmount,
      durationBlocks,
      'cliff-linear',
      cliffBlocks,
      false, // cannot modify
      'Annual equity grant',
      userSession
    );
    
    console.log('Cliff stream creation transaction initiated');
  } catch (error) {
    console.error('Error creating cliff stream:', error);
  }
}

// Example 4: Withdraw from a stream
export async function exampleWithdraw(userSession: UserSession, streamId: number) {
  try {
    await client.withdraw(streamId, userSession);
    console.log('Withdrawal transaction initiated');
  } catch (error) {
    console.error('Error withdrawing:', error);
  }
}

// Example 5: Batch create streams
export async function exampleBatchCreateStreams(userSession: UserSession) {
  try {
    const employees = [
      'ST1EMPLOYEE123456789012345678901234567890',
      'ST1EMPLOYEE234567890123456789012345678901',
      'ST1EMPLOYEE345678901234567890123456789012',
    ];
    
    const amounts = [
      5_000_000, // 5 STX
      7_500_000, // 7.5 STX
      10_000_000, // 10 STX
    ];
    
    const durations = [4320, 4320, 4320]; // ~30 days each
    
    await client.batchCreateStreams(
      employees,
      amounts,
      durations,
      'linear',
      true,
      userSession
    );
    
    console.log('Batch stream creation transaction initiated');
  } catch (error) {
    console.error('Error creating batch streams:', error);
  }
}

// Example 6: Add bonus payment
export async function exampleAddBonus(userSession: UserSession) {
  try {
    const employeeAddress = 'ST1EMPLOYEE123456789012345678901234567890';
    const bonusAmount = 2_000_000; // 2 STX
    
    await client.addBonus(
      employeeAddress,
      bonusAmount,
      'Q4 Performance Bonus',
      userSession
    );
    
    console.log('Bonus payment transaction initiated');
  } catch (error) {
    console.error('Error adding bonus:', error);
  }
}

// Example 7: Modify stream (extend duration)
export async function exampleExtendStream(
  userSession: UserSession,
  streamId: number
) {
  try {
    const additionalBlocks = 2160; // ~15 days
    
    await client.extendStream(streamId, additionalBlocks, userSession);
    console.log('Stream extension transaction initiated');
  } catch (error) {
    console.error('Error extending stream:', error);
  }
}

// Example 8: Modify stream (increase amount)
export async function exampleIncreaseStreamAmount(
  userSession: UserSession,
  streamId: number
) {
  try {
    const additionalAmount = 5_000_000; // 5 STX
    
    await client.increaseStreamAmount(
      streamId,
      additionalAmount,
      userSession
    );
    
    console.log('Stream amount increase transaction initiated');
  } catch (error) {
    console.error('Error increasing stream amount:', error);
  }
}

// Example 9: Cancel a stream
export async function exampleCancelStream(
  userSession: UserSession,
  streamId: number
) {
  try {
    await client.cancelStream(streamId, userSession);
    console.log('Stream cancellation transaction initiated');
  } catch (error) {
    console.error('Error cancelling stream:', error);
  }
}

// Example 10: Programmatic transaction building (without wallet)
export async function exampleProgrammaticTransaction() {
  try {
    // Build transaction without wallet interaction
    // Note: You'll need to provide a private key for signing
    const transaction = await client.createStream(
      'ST1EMPLOYEE123456789012345678901234567890',
      1_000_000,
      1000,
      'linear',
      undefined,
      true,
      'Programmatic stream',
      undefined // No userSession
    );
    
    // Sign and broadcast the transaction
    // const signedTx = await signTransaction(transaction, privateKey);
    // const result = await broadcastTransaction(signedTx, network);
    
    console.log('Transaction built:', transaction);
  } catch (error) {
    console.error('Error building transaction:', error);
  }
}

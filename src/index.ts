/**
 * BlockPay Integration - Main Export File
 * 
 * This file exports all the necessary components and utilities
 * for integrating BlockPay with your application.
 */

export { BlockPayClient, DEFAULT_CONTRACT_ADDRESSES, NETWORK_CONFIG, APP_CONFIG } from './blockpay-client';
export type { ContractAddresses } from './blockpay-client';

// Re-export commonly used types from @stacks/connect and @stacks/transactions
export type { UserSession, AppConfig } from '@stacks/connect';
export { showConnect, openContractCall, openSTXTransfer } from '@stacks/connect';
export {
  AnchorMode,
  PostConditionMode,
  FungibleConditionCode,
  ClarityValue,
  uintCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  someCV,
  noneCV,
  listCV,
  boolCV,
  contractPrincipalCV,
  standardPrincipalCV,
} from '@stacks/transactions';
export { StacksNetwork, StacksTestnet, StacksMainnet } from '@stacks/network';

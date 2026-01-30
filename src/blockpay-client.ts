/**
 * BlockPay Client - Integration utilities for @stacks/connect and @stacks/transactions
 * 
 * This module provides a high-level interface for interacting with BlockPay smart contracts
 * using Stacks Connect for wallet authentication and @stacks/transactions for transaction building.
 */

import {
  AnchorMode,
  PostConditionMode,
  broadcastTransaction,
  makeContractCall,
  makeStandardSTXPostCondition,
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
  getAddressFromPrivateKey,
  TransactionVersion,
  NetworkVersion,
} from '@stacks/transactions';
import {
  openContractCall,
  openSTXTransfer,
  UserSession,
  showConnect,
  AppConfig,
} from '@stacks/connect';
import { StacksNetwork, StacksTestnet, StacksMainnet } from '@stacks/network';

// Network configuration
export const NETWORK_CONFIG = {
  testnet: {
    network: StacksTestnet,
    version: TransactionVersion.Testnet,
  },
  mainnet: {
    network: StacksMainnet,
    version: TransactionVersion.Mainnet,
  },
};

// Contract addresses (update these after deployment)
export interface ContractAddresses {
  blockpay: string;
  treasury: string;
  accessControl: string;
  emergencyControls: string;
}

// Default contract addresses (for testnet - update after deployment)
export const DEFAULT_CONTRACT_ADDRESSES: ContractAddresses = {
  blockpay: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.blockpay',
  treasury: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.treasury',
  accessControl: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.access-control',
  emergencyControls: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.emergency-controls',
};

// App configuration for Stacks Connect
export const APP_CONFIG: AppConfig = {
  appDetails: {
    name: 'BlockPay',
    icon: 'https://blockpay.io/icon.png',
  },
  redirectTo: '/',
  userSession: undefined, // Will be set by the app
};

/**
 * BlockPay Client Class
 * Provides methods to interact with BlockPay smart contracts
 */
export class BlockPayClient {
  private network: StacksNetwork;
  private contractAddresses: ContractAddresses;
  private appConfig: AppConfig;

  constructor(
    network: 'testnet' | 'mainnet' = 'testnet',
    contractAddresses: ContractAddresses = DEFAULT_CONTRACT_ADDRESSES,
    appConfig: AppConfig = APP_CONFIG
  ) {
    this.network = NETWORK_CONFIG[network].network;
    this.contractAddresses = contractAddresses;
    this.appConfig = appConfig;
  }

  /**
   * Update contract addresses
   */
  setContractAddresses(addresses: Partial<ContractAddresses>) {
    this.contractAddresses = { ...this.contractAddresses, ...addresses };
  }

  /**
   * Update app configuration
   */
  setAppConfig(config: Partial<AppConfig>) {
    this.appConfig = { ...this.appConfig, ...config };
  }

  // ============================================
  // Treasury Functions
  // ============================================

  /**
   * Deposit STX to treasury
   */
  async depositSTX(amountMicroStx: number, userSession?: UserSession) {
    const [address, contractName] = this.contractAddresses.treasury.split('.');
    
    const functionArgs = [uintCV(amountMicroStx)];
    
    if (userSession) {
      // Use Stacks Connect for wallet interaction
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'deposit-stx',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
        },
        onCancel: () => {
          console.log('Transaction cancelled');
        },
      });
    } else {
      // Build transaction directly (for programmatic use)
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'deposit-stx',
        functionArgs,
        senderKey: '', // Must be provided
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 1000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Get employer STX balance
   */
  async getEmployerSTXBalance(employerAddress: string): Promise<ClarityValue> {
    const [address, contractName] = this.contractAddresses.treasury.split('.');
    
    // This would typically be a read-only call via API
    // For now, return a placeholder
    return uintCV(0);
  }

  // ============================================
  // Access Control Functions
  // ============================================

  /**
   * Add an admin (owner only)
   */
  async addAdmin(adminAddress: string, userSession?: UserSession) {
    const [address, contractName] = this.contractAddresses.accessControl.split('.');
    
    const functionArgs = [principalCV(adminAddress)];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'add-admin',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Admin added:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'add-admin',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 1000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Add an employer (admin/owner only)
   */
  async addEmployer(employerAddress: string, userSession?: UserSession) {
    const [address, contractName] = this.contractAddresses.accessControl.split('.');
    
    const functionArgs = [principalCV(employerAddress)];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'add-employer',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Employer added:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'add-employer',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 1000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  // ============================================
  // BlockPay Stream Functions
  // ============================================

  /**
   * Create a salary stream
   */
  async createStream(
    employeeAddress: string,
    totalAmountMicroStx: number,
    durationBlocks: number,
    vestingType: 'linear' | 'cliff-linear' = 'linear',
    cliffBlocks?: number,
    canModify: boolean = true,
    metadata: string = '',
    userSession?: UserSession
  ) {
    const [address, contractName] = this.contractAddresses.blockpay.split('.');
    
    const functionArgs = [
      principalCV(employeeAddress),
      uintCV(totalAmountMicroStx),
      uintCV(durationBlocks),
      stringAsciiCV(vestingType),
      cliffBlocks ? someCV(uintCV(cliffBlocks)) : noneCV(),
      boolCV(canModify),
      stringUtf8CV(metadata),
    ];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'create-stream',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Stream created:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'create-stream',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 10000, // Higher fee for stream creation
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Withdraw earned amount from a stream
   */
  async withdraw(streamId: number, userSession?: UserSession) {
    const [address, contractName] = this.contractAddresses.blockpay.split('.');
    
    const functionArgs = [uintCV(streamId)];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'withdraw',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Withdrawal successful:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'withdraw',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 5000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Extend stream duration
   */
  async extendStream(
    streamId: number,
    additionalBlocks: number,
    userSession?: UserSession
  ) {
    const [address, contractName] = this.contractAddresses.blockpay.split('.');
    
    const functionArgs = [uintCV(streamId), uintCV(additionalBlocks)];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'extend-stream',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Stream extended:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'extend-stream',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 8000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Increase stream amount
   */
  async increaseStreamAmount(
    streamId: number,
    additionalAmountMicroStx: number,
    userSession?: UserSession
  ) {
    const [address, contractName] = this.contractAddresses.blockpay.split('.');
    
    const functionArgs = [uintCV(streamId), uintCV(additionalAmountMicroStx)];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'increase-stream-amount',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Stream amount increased:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'increase-stream-amount',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 8000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Cancel a stream
   */
  async cancelStream(streamId: number, userSession?: UserSession) {
    const [address, contractName] = this.contractAddresses.blockpay.split('.');
    
    const functionArgs = [uintCV(streamId)];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'cancel-stream',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Stream cancelled:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'cancel-stream',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 8000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Batch create streams
   */
  async batchCreateStreams(
    employeeAddresses: string[],
    amounts: number[],
    durations: number[],
    vestingType: 'linear' | 'cliff-linear' = 'linear',
    canModify: boolean = true,
    userSession?: UserSession
  ) {
    const [address, contractName] = this.contractAddresses.blockpay.split('.');
    
    if (employeeAddresses.length !== amounts.length || amounts.length !== durations.length) {
      throw new Error('Arrays must have the same length');
    }
    
    const functionArgs = [
      listCV(employeeAddresses.map(addr => principalCV(addr))),
      listCV(amounts.map(amt => uintCV(amt))),
      listCV(durations.map(dur => uintCV(dur))),
      stringAsciiCV(vestingType),
      boolCV(canModify),
    ];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'batch-create-streams',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Streams created:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'batch-create-streams',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 50000, // Higher fee for batch operations
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Add bonus payment
   */
  async addBonus(
    employeeAddress: string,
    amountMicroStx: number,
    metadata: string = '',
    userSession?: UserSession
  ) {
    const [address, contractName] = this.contractAddresses.blockpay.split('.');
    
    const functionArgs = [
      principalCV(employeeAddress),
      uintCV(amountMicroStx),
      stringUtf8CV(metadata),
    ];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'add-bonus',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Bonus added:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'add-bonus',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 7000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  // ============================================
  // Emergency Controls Functions
  // ============================================

  /**
   * Pause system (admin only)
   */
  async pauseSystem(userSession?: UserSession) {
    const [address, contractName] = this.contractAddresses.emergencyControls.split('.');
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'pause-system',
        functionArgs: [],
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('System paused:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'pause-system',
        functionArgs: [],
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 1000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Unpause system (admin only)
   */
  async unpauseSystem(userSession?: UserSession) {
    const [address, contractName] = this.contractAddresses.emergencyControls.split('.');
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'unpause-system',
        functionArgs: [],
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('System unpaused:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'unpause-system',
        functionArgs: [],
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 1000,
      };
      
      return makeContractCall(txOptions);
    }
  }

  /**
   * Pause a specific stream (admin only)
   */
  async pauseStream(streamId: number, userSession?: UserSession) {
    const [address, contractName] = this.contractAddresses.emergencyControls.split('.');
    
    const functionArgs = [uintCV(streamId)];
    
    if (userSession) {
      await openContractCall({
        contractAddress: address,
        contractName,
        functionName: 'pause-stream',
        functionArgs,
        network: this.network,
        appDetails: this.appConfig.appDetails,
        onFinish: (data) => {
          console.log('Stream paused:', data.txId);
        },
      });
    } else {
      const txOptions = {
        contractAddress: address,
        contractName,
        functionName: 'pause-stream',
        functionArgs,
        senderKey: '',
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        fee: 1000,
      };
      
      return makeContractCall(txOptions);
    }
  }
}

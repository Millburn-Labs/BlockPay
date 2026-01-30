/**
 * React Example Component for BlockPay Integration
 * 
 * This example demonstrates how to integrate BlockPay with a React application
 * using @stacks/connect for wallet authentication.
 */

import React, { useState, useEffect } from 'react';
import {
  UserSession,
  AppConfig,
  showConnect,
  openContractCall,
} from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import { BlockPayClient, DEFAULT_CONTRACT_ADDRESSES } from '../blockpay-client';

// App configuration
const appConfig: AppConfig = {
  appDetails: {
    name: 'BlockPay',
    icon: 'https://blockpay.io/icon.png',
  },
  redirectTo: '/',
  userSession: undefined,
};

// Initialize user session
const userSession = new UserSession({ appConfig });

// Initialize BlockPay client
const blockPayClient = new BlockPayClient('testnet', DEFAULT_CONTRACT_ADDRESSES, appConfig);

export const BlockPayExample: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [streamId, setStreamId] = useState<number>(1);
  const [employeeAddress, setEmployeeAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setIsSignedIn(true);
      setUserData(userSession.loadUserData());
    }
  }, []);

  const handleConnect = async () => {
    await showConnect({
      appDetails: appConfig.appDetails,
      redirectTo: '/',
      onFinish: () => {
        setIsSignedIn(true);
        setUserData(userSession.loadUserData());
      },
      onCancel: () => {
        console.log('User cancelled connection');
      },
    });
  };

  const handleDisconnect = () => {
    userSession.signUserOut();
    setIsSignedIn(false);
    setUserData(null);
  };

  const handleDepositSTX = async () => {
    if (!isSignedIn) {
      alert('Please connect your wallet first');
      return;
    }

    const amountMicroStx = parseFloat(amount) * 1_000_000;
    
    try {
      await blockPayClient.depositSTX(amountMicroStx, userSession);
    } catch (error) {
      console.error('Error depositing STX:', error);
      alert('Error depositing STX. Check console for details.');
    }
  };

  const handleCreateStream = async () => {
    if (!isSignedIn || !employeeAddress || !amount || !duration) {
      alert('Please fill in all fields');
      return;
    }

    const amountMicroStx = parseFloat(amount) * 1_000_000;
    const durationBlocks = parseInt(duration);

    try {
      await blockPayClient.createStream(
        employeeAddress,
        amountMicroStx,
        durationBlocks,
        'linear',
        undefined,
        true,
        'Stream created via BlockPay app',
        userSession
      );
    } catch (error) {
      console.error('Error creating stream:', error);
      alert('Error creating stream. Check console for details.');
    }
  };

  const handleWithdraw = async () => {
    if (!isSignedIn) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await blockPayClient.withdraw(streamId, userSession);
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Error withdrawing. Check console for details.');
    }
  };

  const handleAddBonus = async () => {
    if (!isSignedIn || !employeeAddress || !amount) {
      alert('Please fill in employee address and amount');
      return;
    }

    const amountMicroStx = parseFloat(amount) * 1_000_000;

    try {
      await blockPayClient.addBonus(
        employeeAddress,
        amountMicroStx,
        'Bonus payment',
        userSession
      );
    } catch (error) {
      console.error('Error adding bonus:', error);
      alert('Error adding bonus. Check console for details.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>BlockPay Integration Example</h1>

      {/* Connection Status */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        {isSignedIn ? (
          <div>
            <p>✅ Connected</p>
            <p>Address: {userData?.profile?.stxAddress?.testnet || 'N/A'}</p>
            <button onClick={handleDisconnect}>Disconnect</button>
          </div>
        ) : (
          <div>
            <p>❌ Not Connected</p>
            <button onClick={handleConnect}>Connect Wallet</button>
          </div>
        )}
      </div>

      {/* Deposit STX */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Deposit STX to Treasury</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Amount (STX):
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <button onClick={handleDepositSTX} disabled={!isSignedIn}>
          Deposit STX
        </button>
      </div>

      {/* Create Stream */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Create Salary Stream</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Employee Address:
            <input
              type="text"
              value={employeeAddress}
              onChange={(e) => setEmployeeAddress(e.target.value)}
              placeholder="ST1EMPLOYEE..."
              style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Amount (STX):
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1"
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Duration (blocks):
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="1000"
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <button onClick={handleCreateStream} disabled={!isSignedIn}>
          Create Stream
        </button>
      </div>

      {/* Withdraw */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Withdraw from Stream</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Stream ID:
            <input
              type="number"
              value={streamId}
              onChange={(e) => setStreamId(parseInt(e.target.value))}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <button onClick={handleWithdraw} disabled={!isSignedIn}>
          Withdraw
        </button>
      </div>

      {/* Add Bonus */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Add Bonus Payment</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Employee Address:
            <input
              type="text"
              value={employeeAddress}
              onChange={(e) => setEmployeeAddress(e.target.value)}
              placeholder="ST1EMPLOYEE..."
              style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Amount (STX):
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2"
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <button onClick={handleAddBonus} disabled={!isSignedIn}>
          Add Bonus
        </button>
      </div>
    </div>
  );
};

export default BlockPayExample;

import React, { useState } from 'react';
import './TransactionForm.css';
import { addTransaction } from '../api/blockchain.api';
import SHA256 from 'crypto-js/sha256';
import * as elliptic from 'elliptic';
const EC = new elliptic.ec('secp256k1');


const TransactionForm = ({ privateKey, publicKey, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
    setMessageType('');
  };


const calculateHash = async (fromAddress, toAddress, amount, timestamp) => {
  const message = fromAddress + toAddress + amount + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const signTransaction = async (txData) => {
  if (!privateKey) {
    throw new Error('No private key available. Generate wallet first.');
  }

  try {
    const key = EC.keyFromPrivate(privateKey, 'hex');

    const hashHex = await calculateHash(
      txData.fromAddress,
      txData.toAddress,
      txData.amount,
      txData.timestamp
    );

   
    const signature = key.sign(hashHex).toDER('hex');

    return signature;
  } catch (error) {
    console.error('Signing error:', error);
    throw new Error('Signing failed: ' + error.message);
  }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    if (!privateKey || !publicKey) {
      setMessage('Please generate a wallet first!');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!formData.toAddress || !formData.amount) {
      setMessage('Please fill all fields');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (Number(formData.amount) <= 0) {
      setMessage('Amount must be greater than 0');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (formData.toAddress === publicKey) {
      setMessage('Cannot send transaction to yourself');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const timestamp = Date.now();
      const txData = {
        fromAddress: publicKey,
        toAddress: formData.toAddress,
        amount: Number(formData.amount),
        timestamp,
      };

    
      const signature = await signTransaction(txData);

      const signedTransaction = {
        ...txData,
        signature,
      };

    
      await addTransaction(signedTransaction);

      setMessage('✓ Transaction added and signed successfully!');
      setMessageType('success');
      setFormData({ toAddress: '', amount: '' });
      
      if (onTransactionAdded) {
        onTransactionAdded();
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setMessage(err.message || 'Failed to add transaction');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-card">
      <h2 className="card-title">📝 Create Transaction</h2>
      
      {!privateKey ? (
        <div className="warning-box">
          <span className="warning-icon">⚠️</span>
          <p>Generate a wallet first to send transactions.</p>
        </div>
      ) : (
        <div className="info-box">
          <span className="info-icon">🔐</span>
          <p>
            Signing with wallet: 
            <strong> {publicKey?.slice(0, 10)}...{publicKey?.slice(-6)}</strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="toAddress">Recipient Address</label>
          <input
            type="text"
            id="toAddress"
            name="toAddress"
            value={formData.toAddress}
            onChange={handleChange}
            placeholder="Enter recipient's public key / address"
            disabled={!privateKey}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount to send"
            step="0.01"
            min="0"
            disabled={!privateKey}
            required
          />
        </div>
        
        {message && (
          <div className={`message-box ${messageType}`}>
            {message}
          </div>
        )}
        
        <button 
          type="submit" 
          className={`submit-btn ${(!privateKey || loading) ? 'disabled' : ''}`}
          disabled={!privateKey || loading}
        >
          {loading ? (
            <span className="loading-text">⏳ Signing & Adding...</span>
          ) : (
            '✍️ Sign & Add Transaction'
          )}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
import React, { useState } from 'react';
import './TransactionForm.css';
import { addTransaction } from '../api/blockchain.api';
import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

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

  // Helper: Calculate transaction hash (MUST match backend exactly)
  const calculateHash = (tx) => {
    return tx.fromAddress +
           tx.toAddress +
           tx.amount +
           (tx.timestamp || Date.now());
  };

  // Sign transaction using Web Crypto API with hex private key
 
// Inside TransactionForm.js

const signTransaction = async (tx) => {
  if (!privateKey) throw new Error('No private key available.');

  try {
    // 1. Initialize key from Hex
    const key = ec.keyFromPrivate(privateKey, 'hex'); 
    
    // 2. Hash the data (must match backend exactly)
    const hash = tx.fromAddress + tx.toAddress + tx.amount + tx.timestamp;
    
    // 3. Sign and return DER Hex
    return key.sign(hash).toDER('hex');
  } catch (error) {
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

      // Sign the transaction client-side
      const signature = await signTransaction(txData);

      const signedTransaction = {
        ...txData,
        signature,
      };

      // Send the full signed object
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
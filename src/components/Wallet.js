import React, { useState, useEffect } from 'react';
import { createWallet } from '../api/blockchain.api';
import { fetchBalance } from '../api/blockchain.api';
import './Wallet.css';

const Wallet = ({ onWalletGenerated }) => {
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateNewWallet = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🚀 Generating new wallet...');
      const response = await createWallet();
      console.log('📦 Raw response:', response);
      
      // Handle different response structures
      let pubKey, privKey;
      
      if (response && response.publicKey && response.privateKey) {
        pubKey = response.publicKey;
        privKey = response.privateKey;
      } else if (response && response.data && response.data.publicKey) {
        pubKey = response.data.publicKey;
        privKey = response.data.privateKey;
      } else {
        throw new Error('Invalid response format: ' + JSON.stringify(response));
      }
      
      console.log('✅ Wallet generated successfully');
      console.log('Public key length:', pubKey?.length);
      console.log('Private key length:', privKey?.length);
      
      setPublicKey(pubKey);
      setPrivateKey(privKey);
      
      if (onWalletGenerated) {
        onWalletGenerated(pubKey, privKey);
      }
      
      // Fetch initial balance
      try {
        const balRes = await fetchBalance(pubKey);
        // Drill down: axios.data -> backend.data -> balance
        const actualBalance = balRes.data?.data?.balance ?? 0; 
        setBalance(actualBalance); 
      } catch (err) {
        setBalance(0);
      }
      
    } catch (err) {
      console.error('❌ Wallet generation error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to generate wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  let interval;
      if (publicKey) {
        interval = setInterval(async () => {
          try {
            const balRes = await fetchBalance(publicKey);
            const actualBalance = balRes.data?.data?.balance ?? 0;
            setBalance(actualBalance);
          } catch (err) {
            console.error('Balance fetch error:', err);
          }
        }, 5000);
        return () => clearInterval(interval);
      }
    }, [publicKey]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="wallet-card">
      <div className="wallet-header">
        <h2>💼 Wallet</h2>
        {publicKey && (
          <span className="wallet-badge">Active</span>
        )}
      </div>
      
      {!publicKey ? (
        <div className="wallet-empty">
          <p className="wallet-message">No wallet generated yet</p>
          <button 
            onClick={generateNewWallet} 
            disabled={loading}
            className="generate-btn"
          >
            {loading ? (
              <span className="loading-spinner">⏳ Generating...</span>
            ) : (
              '✨ Generate New Wallet'
            )}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <>
          <div className="wallet-info">
            <div className="info-row">
              <span className="info-label">Address:</span>
              <span className="info-value" title={publicKey}>
                {formatAddress(publicKey)}
              </span>
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(publicKey);
                  alert('Address copied to clipboard!');
                }}
              >
                📋
              </button>
            </div>
            
            <div className="info-row">
              <span className="info-label">Balance:</span>
              <span className="balance-value">{balance} ✨</span>
            </div>
            
            <details className="private-key-details">
              <summary>Private Key (Click to reveal)</summary>
              <p className="private-key-text">{privateKey}</p>
              <small className="warning-text">
                ⚠️ Never share your private key! It's stored only in this session.
              </small>
            </details>
          </div>
          
          <button 
            onClick={generateNewWallet} 
            disabled={loading}
            className="generate-new-btn"
          >
            {loading ? 'Generating...' : '🔄 Generate New Wallet'}
          </button>
        </>
      )}
    </div>
  );
};

export default Wallet;
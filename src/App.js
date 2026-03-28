import React from 'react';
import './App.css';

import BlockchainViewer from './components/BlockchainViewer';
import TransactionForm from './components/TransactionForm';
import StatsPanel from './components/StatsPanel';
import Header from './components/Header';
import Wallet from './components/Wallet';

import useBlockchain from './hooks/useBlockchain';
import { mineBlock } from './api/blockchain.api';

function App() {
  const { chain, stats, loading, error, refresh } = useBlockchain();

  // State for wallet keys — managed at App level so TransactionForm can sign
  const [privateKey, setPrivateKey] = React.useState(null);
  const [publicKey, setPublicKey]   = React.useState(null);
  const [isMining, setIsMining]     = React.useState(false);

  const handleMine = async () => {
    if (isMining) return; // prevent double-clicks
    setIsMining(true);
    try {
      await mineBlock();
      await refresh(); // fetch updated chain + stats — also clears any poll error
    } catch (err) {
      console.error('Mining failed:', err.message);
    } finally {
      setIsMining(false);
    }
  };

  const refreshData = () => { refresh(); };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading Blockchain...</p>
      </div>
    );
  }

  // Suppress transient poll errors while a mine is in flight — the event-loop
  // yield (setImmediate in mineBlock) allows polls to be served, but a race
  // could still produce a brief error before mining completes.
  const displayError = isMining ? null : error;

  return (
    <div className="App">
      <Header />
      <div className="app-container">
        {displayError && (
          <div className="error-banner">
            <p>{displayError}</p>
          </div>
        )}

        <div className="main-content">
          <div className="left-panel">
            <StatsPanel stats={stats} onMine={handleMine} isMining={isMining} />
            <Wallet
              onWalletGenerated={(pubKey, privKey) => {
                setPublicKey(pubKey);
                setPrivateKey(privKey);
              }}
            />
            <TransactionForm
              privateKey={privateKey}
              publicKey={publicKey}
              onTransactionAdded={refreshData}
            />
          </div>

          <div className="right-panel">
            <BlockchainViewer blockchain={chain} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
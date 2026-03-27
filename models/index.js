const { Blockchain, Transaction } = require('./blockchain');
const config = require('../config');
const crypto = require('crypto');

const { difficulty, miningReward, initialMinerAddress } = config.blockchain;

// Initialize the singleton blockchain instance
const blockchain = new Blockchain(difficulty, miningReward);

/**
 * Task 1 Fix: Demo transactions must now be signed to pass Blockchain.addTransaction()
 * Using Node.js built-in crypto to generate PEM keypairs.
 */
if (config.demoData && config.demoData.enabled) {
  try {
    // 1. Generate demo identities
    const generateDemoWallet = () => {
      return crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
    };

    const walletA = generateDemoWallet();
    const walletB = generateDemoWallet();

    // 2. Create and sign demo transactions
    // Transaction 1: A -> B
    const tx1 = new Transaction(walletA.publicKey, walletB.publicKey, 100);
    tx1.signTransaction(walletA.privateKey); // This uses the method we updated in blockchain.js
    blockchain.addTransaction(tx1);

    // Transaction 2: B -> A
    const tx2 = new Transaction(walletB.publicKey, walletA.publicKey, 50);
    tx2.signTransaction(walletB.privateKey);
    blockchain.addTransaction(tx2);

    // 3. Mine the signed transactions into the first block
    blockchain.minePendingTransactions(initialMinerAddress);

    console.log('Blockchain initialized with signed demo data.');
  } catch (error) {
    console.error('Failed to initialize demo data:', error.message);
  }
}

// Export the instances
// Note: walletReady and walletData removed as they relied on unsafe remote code execution
module.exports = { 
  blockchain, 
  Transaction 
};
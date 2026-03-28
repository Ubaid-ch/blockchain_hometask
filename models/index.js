'use strict';

const { Blockchain, Transaction } = require('./blockchain');
const config  = require('../config');
const EC      = require('elliptic').ec;
const ec      = new EC('secp256k1');
const persist = require('../services/persistence.service');
const logger  = require('../utils/logger');

const { difficulty, miningReward, initialMinerAddress } = config.blockchain;


const blockchain = new Blockchain(difficulty, miningReward);


const seedDemoData = async () => {
  if (!(config.demoData && config.demoData.enabled)) return;

  try {
    const generateDemoWallet = () => ec.genKeyPair();

    const walletA = generateDemoWallet();
    const walletB = generateDemoWallet();

    const addrA = walletA.getPublic('hex');
    const addrB = walletB.getPublic('hex');

    const tx1 = new Transaction(addrA, addrB, 100);
    tx1.signTransaction(walletA);
    blockchain.addTransaction(tx1);

    const tx2 = new Transaction(addrB, addrA, 50);
    tx2.signTransaction(walletB);
    blockchain.addTransaction(tx2);

    await blockchain.minePendingTransactions(initialMinerAddress);

    logger.info('Blockchain initialized with signed demo data.');
  } catch (error) {
    logger.error(`Failed to initialize demo data: ${error.message}`);
  }
};


(async () => {
  const saved = await persist.load();

  if (saved) {
    
    const originalChain = blockchain.chain;
    blockchain.chain               = saved.chain;
    blockchain.pendingTransactions = saved.pendingTransactions;

    if (!blockchain.isChainValid()) {
      logger.warn('Persistence: loaded chain failed integrity check — starting fresh');
      blockchain.chain               = originalChain;
      blockchain.pendingTransactions = [];
      await seedDemoData();
    } else {
      
      blockchain.difficulty    = saved.difficulty;
      blockchain.miningReward  = saved.miningReward;
      logger.info('Persistence: blockchain restored from saved state.');
    }
  } else {
    await seedDemoData();
  }
})();



module.exports = { blockchain, Transaction };
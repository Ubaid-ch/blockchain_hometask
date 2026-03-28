const { blockchain } = require('../models');
const { sendSuccess } = require('../utils/response');
const logger  = require('../utils/logger');
const persist = require('../services/persistence.service');

/**
 * POST /api/mine
 *
 * Mines all pending transactions into a new block, then immediately persists
 * the updated chain to disk.
 */
const mineBlock = async (req, res, next) => {
  try {
    const miningRewardAddress = req.body.miningRewardAddress || 'miner1';

    logger.info(`Mining block for reward address: ${miningRewardAddress}`);
    await blockchain.minePendingTransactions(miningRewardAddress);
    logger.info(`Block mined successfully: ${blockchain.getLatestBlock().hash}`);
    
    persist.save(blockchain).catch((err) =>
      logger.error(`Persistence: background save after mine failed — ${err.message}`)
    );

    sendSuccess(res, {
      message: 'Block mined successfully',
      latestBlock: blockchain.getLatestBlock(),
      chainLength: blockchain.chain.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { mineBlock };


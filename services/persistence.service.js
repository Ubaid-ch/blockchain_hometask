'use strict';

/**
 * @fileoverview Blockchain persistence service.
 *
 * Serialises and deserialises the blockchain state to / from a plain JSON file
 * (`blockchain.json`) stored at the project root. All I/O errors are caught so
 * that a missing or corrupt file can never crash the server.
 *
 * File shape:
 * ```json
 * {
 *   "savedAt": "<ISO-8601 timestamp>",
 *   "difficulty": 2,
 *   "miningReward": 100,
 *   "chain": [
 *     {
 *       "timestamp": 1711600000000,
 *       "transactions": [
 *         {
 *           "fromAddress": "<hex public key | null>",
 *           "toAddress":   "<hex public key>",
 *           "amount":      100,
 *           "timestamp":   1711600000000,
 *           "signature":   "<DER hex | empty string>"
 *         }
 *       ],
 *       "previousHash": "0",
 *       "nonce": 42,
 *       "hash": "<sha256 hex>"
 *     }
 *   ],
 *   "pendingTransactions": [ /* same Transaction shape *\/ ]
 * }
 * ```
 */

const fs      = require('fs/promises');
const path    = require('path');
const logger  = require('../utils/logger');
const { Block, Transaction } = require('../models/blockchain');

/** Absolute path to the persistence file. */
const STORE_PATH = path.join(__dirname, '..', 'blockchain.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Rehydrates a plain Transaction object (as parsed from JSON) into a real
 * Transaction class instance so that methods like `isValid()` are available.
 *
 * @param {object} raw - Plain object from JSON.parse
 * @returns {Transaction}
 */
const rehydrateTransaction = (raw) => {
  const tx = new Transaction(raw.fromAddress, raw.toAddress, raw.amount);
  tx.timestamp = raw.timestamp;
  tx.signature = raw.signature;
  return tx;
};

/**
 * Rehydrates a plain Block object into a real Block class instance.
 * Transactions inside the block are also rehydrated.
 *
 * @param {object} raw - Plain object from JSON.parse
 * @returns {Block}
 */
const rehydrateBlock = (raw) => {
  const transactions = (raw.transactions || []).map(rehydrateTransaction);
  const block = new Block(raw.timestamp, transactions, raw.previousHash);
  block.nonce = raw.nonce;
  block.hash  = raw.hash; // restore the already-mined hash as-is
  return block;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Serialises the current blockchain state and writes it to `blockchain.json`.
 * Errors are logged but never re-thrown — a persistence failure must not
 * bring down the server.
 *
 * @param {import('../models/blockchain').Blockchain} blockchain - The live singleton instance.
 * @returns {Promise<void>}
 */
const save = async (blockchain) => {
  try {
    const payload = {
      savedAt:             new Date().toISOString(),
      difficulty:          blockchain.difficulty,
      miningReward:        blockchain.miningReward,
      chain:               blockchain.chain,
      pendingTransactions: blockchain.pendingTransactions,
    };
    await fs.writeFile(STORE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    logger.info(`Persistence: chain saved (${blockchain.chain.length} blocks)`);
  } catch (err) {
    logger.error(`Persistence: save failed — ${err.message}`);
  }
};

/**
 * Reads and deserialises the saved blockchain state from `blockchain.json`.
 *
 * @returns {Promise<{
 *   difficulty:          number,
 *   miningReward:        number,
 *   chain:               Block[],
 *   pendingTransactions: Transaction[]
 * } | null>} The rehydrated state, or `null` if the file does not exist,
 *             cannot be parsed, or contains an obviously invalid structure.
 */
const load = async () => {
  try {
    const raw  = await fs.readFile(STORE_PATH, 'utf8');
    const data = JSON.parse(raw);

    // Minimal structural validation before reconstructing class instances
    if (!Array.isArray(data.chain) || data.chain.length === 0) {
      logger.warn('Persistence: file exists but chain is missing/empty — starting fresh');
      return null;
    }

    const chain               = data.chain.map(rehydrateBlock);
    const pendingTransactions = (data.pendingTransactions || []).map(rehydrateTransaction);

    logger.info(`Persistence: chain loaded (${chain.length} blocks, ${pendingTransactions.length} pending)`);

    return {
      difficulty:          data.difficulty,
      miningReward:        data.miningReward,
      chain,
      pendingTransactions,
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Normal on first run — not an error worth logging at warn level
      logger.info('Persistence: no saved state found — starting fresh');
    } else {
      logger.warn(`Persistence: load failed (${err.message}) — starting fresh`);
    }
    return null;
  }
};

/**
 * Deletes the persistence file.
 * Useful in tests or when a full chain reset is required.
 * A missing file is silently ignored.
 *
 * @returns {Promise<void>}
 */
const clear = async () => {
  try {
    await fs.unlink(STORE_PATH);
    logger.info('Persistence: saved state cleared');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error(`Persistence: clear failed — ${err.message}`);
    }
  }
};

module.exports = { save, load, clear };

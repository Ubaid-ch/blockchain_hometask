const { blockchain, Transaction } = require('../models');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { isValidAddress, isValidAmount, sanitizeAddress, sanitizeAmount } = require('../utils/validator');
const persist  = require('../services/persistence.service');
const logger   = require('../utils/logger');

/**
 * POST /api/transactions
 *
 * Validates, signs, and adds a new transaction to the pending pool, then
 * immediately persists the updated pending queue to disk (Task 2).
 */
const addTransaction = (req, res, next) => {
  try {
    const { fromAddress, toAddress, amount, signature, timestamp } = req.body;

    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }
    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }
    if (!signature || !timestamp) {
      return sendError(res, 'Transaction must be signed with valid timestamp', 400);
    }

    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount)
    );

    transaction.timestamp = timestamp;
    transaction.signature = signature;

    blockchain.addTransaction(transaction);

    persist.save(blockchain).catch((err) =>
      logger.error(`Persistence: background save after transaction failed — ${err.message}`)
    );

    sendCreated(res, {
      message: 'Transaction added to pending pool',
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

const getPendingTransactions = (req, res) => {
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

const getAllTransactions = (req, res) => {
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

module.exports = { addTransaction, getPendingTransactions, getAllTransactions };


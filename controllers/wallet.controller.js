'use strict';

const EC = require('elliptic').ec;
const { sendSuccess, sendError } = require('../utils/response');

const ec = new EC('secp256k1');

/**
 * POST /api/wallets
 *
 * Generates a new secp256k1 key pair and returns both keys as hex strings.
 * The public key (compressed, hex) doubles as the wallet address and is safe
 * to share. The private key is returned **once** — the client must store it
 * securely and must never send it back to the server.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {void}
 */
const generateWallet = (req, res) => {
  try {

    const keyPair = ec.genKeyPair();

    const publicKey = keyPair.getPublic('hex');   
    const privateKey = keyPair.getPrivate('hex');  

    return sendSuccess(res, { publicKey, privateKey }, 201);
  } catch (error) {
    return sendError(res, 'Failed to generate wallet', 500);
  }
};

module.exports = { generateWallet };
const crypto = require('crypto');
const { sendSuccess, sendError } = require('../utils/response');

const generateWallet = (req, res) => {
  try {
    // Generate secp256k1 key pair using Node.js built-in crypto
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });

    // Convert to hex (common format for blockchain addresses)
    const publicKeyHex = publicKey.toString('hex');
    const privateKeyHex = privateKey.toString('hex');

    return sendSuccess(res, {
      publicKey: publicKeyHex,   
      privateKey: privateKeyHex  
    });
  } catch (error) {
    return sendError(res, 'Failed to generate wallet', 500);
  }
};

module.exports = { generateWallet };
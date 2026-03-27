import crypto from 'crypto';
import { sendSuccess, sendError } from '../utils/response.js';

export const generateWallet = (req, res) => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
    });

    // Export to DER buffer, then to Hex string
    const publicKeyHex = publicKey.export({ type: 'spki', format: 'der' }).toString('hex');
    const privateKeyHex = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex');

    return sendSuccess(res, {
      publicKey: publicKeyHex,
      privateKey: privateKeyHex
    });
  } catch (error) {
    return sendError(res, 'Failed to generate wallet', 500);
  }
};
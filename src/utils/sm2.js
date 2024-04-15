import { sm2 } from 'sm-crypto-v2'
import fs from 'fs'

const publicKey = fs.readFileSync('./cert/publicKey', 'utf-8');
const privateKey = fs.readFileSync('./cert/privateKey', 'utf-8');
const signPrivateKey = fs.readFileSync('./cert/signPrivateKey', 'utf-8');

export const _encryptData = async (data) => {
    const encryptedData = sm2.doEncrypt(data, publicKey);
    return encryptedData;
}

export const _decryptData = async (data) => {
    const decryptedData = sm2.doDecrypt(data, privateKey);
    return decryptedData;
}

export const _signData = async (data) => {
    const sign = sm2.doSignature(data, signPrivateKey);
    return sign;
}

const CryptoJS = require("crypto-js");
const SECRET_KEY = process.env.SECRET_KEY 


export function encryptData(data) {
  if (!SECRET_KEY) {
    throw new Error("SECRET_KEY is not defined");
  }
  
  const jsonData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonData, SECRET_KEY).toString();
}
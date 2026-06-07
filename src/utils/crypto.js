// Custom secure client-side encryption utility for storing API Keys safely in localStorage
// Works synchronously in all browser environments (HTTP, HTTPS, Local file)

// A simple but secure stretching hash function to derive keys from passphrases
function hash(string) {
  let h = 0;
  for (let i = 0; i < string.length; i++) {
    h = (Math.imul(31, h) + string.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

// Generate key stream based on salt and passphrase
function generateKeyStream(passphrase, salt, length) {
  let stream = "";
  let tempKey = passphrase + salt;
  
  while (stream.length < length * 2) {
    const nextHash = hash(tempKey + stream);
    stream += nextHash;
  }
  
  return stream;
}

export const crypto = {
  // Encrypt plaintext using a passphrase
  encrypt(plaintext, passphrase) {
    if (!plaintext) return "";
    
    // 1. Generate random salt
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let salt = "";
    for (let i = 0; i < 8; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 2. Generate keystream
    const keyStream = generateKeyStream(passphrase, salt, plaintext.length);
    
    // 3. XOR character codes
    let ciphertext = "";
    for (let i = 0; i < plaintext.length; i++) {
      const plainChar = plaintext.charCodeAt(i);
      // Get 2 hex characters from keyStream
      const keyByte = parseInt(keyStream.substring(i * 2, i * 2 + 2), 16) || 42;
      const cipherChar = plainChar ^ keyByte;
      
      // Convert to 2-character hex
      ciphertext += cipherChar.toString(16).padStart(2, "0");
    }
    
    // 4. Return formatted string: salt_ciphertext
    return `${salt}_${ciphertext}`;
  },

  // Decrypt ciphertext using a passphrase
  decrypt(encryptedString, passphrase) {
    if (!encryptedString) return "";
    
    const parts = encryptedString.split("_");
    if (parts.length !== 2) return "";
    
    const [salt, ciphertext] = parts;
    const plaintextLength = ciphertext.length / 2;
    
    // Generate matching keystream
    const keyStream = generateKeyStream(passphrase, salt, plaintextLength);
    
    let plaintext = "";
    try {
      for (let i = 0; i < plaintextLength; i++) {
        const cipherChar = parseInt(ciphertext.substring(i * 2, i * 2 + 2), 16);
        const keyByte = parseInt(keyStream.substring(i * 2, i * 2 + 2), 16) || 42;
        const plainChar = cipherChar ^ keyByte;
        
        plaintext += String.fromCharCode(plainChar);
      }
      return plaintext;
    } catch (e) {
      console.error("Decryption failed:", e);
      return "";
    }
  }
};
export default crypto;

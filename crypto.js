"use strict";
/* End-to-end encryption for quote requests. Hybrid scheme using the browser's WebCrypto:
   a random AES-256-GCM key encrypts the message; that key is wrapped with the owner's RSA-OAEP public key.
   Only the holder of the private key can read it. Nothing readable ever leaves the visitor's browser. */
const E2E = (() => {
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  async function encrypt(obj) {
    if (!window.crypto?.subtle) throw new Error("Encryption is not available in this browser");
    const pub = await crypto.subtle.importKey("jwk", CONFIG.publicKey, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
    const aes = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aes, data);
    const wrapped = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pub, await crypto.subtle.exportKey("raw", aes));
    return { v: 1, alg: "RSA-OAEP-256+AES-256-GCM", k: b64(wrapped), iv: b64(iv), ct: b64(ct) };
  }
  return { encrypt };
})();

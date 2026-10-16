"use strict";
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
document.getElementById("go").addEventListener("click", async () => {
  const out = document.getElementById("out");
  try {
    const jwk = JSON.parse(document.getElementById("key").value);
    const raw = document.getElementById("msg").value, box = JSON.parse(raw.slice(raw.indexOf("{")));
    const priv = await crypto.subtle.importKey("jwk", jwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
    const aesRaw = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, priv, unb64(box.k));
    const aes = await crypto.subtle.importKey("raw", aesRaw, "AES-GCM", false, ["decrypt"]);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, aes, unb64(box.ct));
    const o = JSON.parse(new TextDecoder().decode(pt));
    out.textContent = Object.entries(o).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("; ") : v}`).join("\n");
  } catch (e) { out.textContent = "Could not decrypt. Check the key and message."; }
});

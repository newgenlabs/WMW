# Going live

## 1. Publish (GitHub Pages, free HTTPS)
1. In the repository on GitHub: **Settings, Pages, Build and deployment, Source: GitHub Actions**.
2. Push to `master` (or run the "Deploy site to GitHub Pages" workflow). The live address appears on the workflow run and under Settings, Pages, for example `https://newgenlabs.github.io/WMW/`.
3. Custom domain: Settings, Pages, Custom domain, then add the DNS records GitHub lists and tick **Enforce HTTPS**.

Pages cannot send custom security headers. The pages carry a Content-Security-Policy and referrer policy as meta tags. For the full header set (HSTS, frame blocking and more) host on Netlify or Cloudflare Pages (uses `_headers`) or Vercel (uses `vercel.json`). No build step is needed: publish the repository root.

## 2. Receiving quote requests (end-to-end encrypted)
Requests are encrypted in the visitor's browser (RSA-OAEP 3072 + AES-256-GCM) with the public key in `config.js`.
- **Private key:** `PRIVATE-KEY-KEEP-SECRET.json` (not committed). Store it in a password manager and delete it from any shared place. Anyone with it can read every request.
- **Reading a request:** open `tools/decrypt.html` from your own computer, paste the private key and the encrypted message.
- **Delivery:** with `formEndpoint` empty, the visitor's email app opens with the encrypted text addressed to `CONFIG.email`. To receive requests without relying on the visitor's email app, set `formEndpoint` to an HTTPS endpoint that stores the posted JSON (Cloudflare Worker, Formspree, Netlify Function). It only ever receives ciphertext.
- To rotate keys, generate a new RSA-OAEP key pair, replace `publicKey` in `config.js`, and keep old private keys to read earlier messages.

## 3. Before launch checklist
- Replace the placeholder phone and email in `config.js` and `.well-known/security.txt`.
- Replace the project descriptions in `projects.js` and products in `catalog.js` with real details.
- Confirm you have permission to show the client project photos.
- Consider self-hosting the fonts to avoid third-party requests (then remove the Google Fonts hosts from the CSP).

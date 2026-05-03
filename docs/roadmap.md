# Roadmap — deferred work

Each item below has enough context to actually execute when picked up. Listed roughly in order of value-to-effort.

---

## 1. DHT-based peer discovery (the real fix for "reload breaks the connection")

**Problem:** WebRTC sessions cannot survive a page reload. Currently the user must manually re-do the invite/answer paste each session. This is the largest UX wart in the app.

**Solution:** Use a public DHT (distributed hash table) so peers can find each other automatically using their stored fingerprints, with no servers we run.

**Approach:**
- Pick a transport. Strongest options:
  - **Hyperswarm** (Holepunch / Pear stack) — DHT-based peer discovery, browser-compatible via `hyperswarm/web` or similar. JS-native.
  - **libp2p** — heavier, more general-purpose. Probably overkill.
  - **Mainline BitTorrent DHT** — works but the JS implementations are less polished for our use case.
- Each peer's identity public key (or its fingerprint) becomes the DHT lookup key.
- On startup, app announces its identity to the DHT and queries for known peers' identities.
- When a hit is found, exchange WebRTC offer/answer through the DHT (DHTs can carry ephemeral signaling).
- Derive session key from static + ephemeral as today.

**Watch for:**
- DHT discovery is asymmetric — both peers must be online and announcing. "Open the app and Alice is already there" only works if Alice has the app open too.
- DHT introduces a new metadata leak: the DHT network sees that two specific identity keys are looking for each other. Smaller surface than a server, but not zero.
- Browser DHT support varies. Hyperswarm has a browser shim but verify it works well in real browsers, not just Node.
- This is a chunky change — probably 200-400 new lines and a small library vendoring exercise. Worth its own focused session.

**Effort:** Large. Probably a full session.

---

## 2. ML-KEM-768 hybrid post-quantum handshake

**Problem:** Current crypto is breakable by future quantum computers via Shor's algorithm on ECDH. "Harvest now, decrypt later" attackers can record traffic today and decrypt in 15-20 years.

**Solution:** Add ML-KEM-768 (NIST FIPS-203, the standardized version of Kyber) as a parallel key-exchange. Combine its shared secret with the existing ECDH outputs via HKDF. If either ECDH or ML-KEM is unbroken, the session key is secure. This is the same hybrid pattern Signal uses (PQXDH).

**Approach:**

Use `@noble/post-quantum` v0.6.1+. It's audited (Cure53), small, and pure JS.

To vendor it inline:

1. Fetch the dependency tree from a CDN (jsdelivr or unpkg). The full set is:
   - `@noble/post-quantum/ml-kem.js` (~20KB)
   - `@noble/post-quantum/_crystals.js` (~8KB)
   - `@noble/post-quantum/utils.js` (~15KB)
   - `@noble/hashes/sha3.js` (~15KB)
   - `@noble/hashes/utils.js` (~20KB)
   - `@noble/hashes/_u64.js` (transitive, small)
   - `@noble/curves/abstract/fft.js` (transitive, used by `_crystals.js`)
2. Strip ESM `import`/`export` syntax. Wrap everything in a single IIFE that exposes `ml_kem768` (and only that) on a namespace like `window.__pq__`.
3. Verify against FIPS-203 reference test vectors (available in the noble repo's `test/` directory). **This step is non-negotiable** — never ship vendored crypto without test-vector verification.
4. Update the protocol:
   - Bump `PROTOCOL_VERSION` from 2 → 3.
   - Inviter generates: ECDH ephemeral keypair + ML-KEM keypair (publishes `mlkemPub` in invite).
   - Accepter calls `ml_kem768.encapsulate(theirMlkemPub)` → gets `(ciphertext, sharedSecretPq)`. Includes ciphertext in answer blob.
   - Inviter calls `ml_kem768.decapsulate(theirMlkemCt, ourMlkemPriv)` → recovers same `sharedSecretPq`.
   - Combine: `ikm = static_DH || ephemeral_DH || sharedSecretPq` (96 bytes), feed to HKDF as before, change the `info` string to `"cmfpu-v3-session-key"`.
5. Old v2 invite/answer blobs no longer work. Document the breaking change in README.

**Watch for:**
- ML-KEM ciphertext is large (~1KB). Invite blobs will grow noticeably.
- ML-KEM uses SHAKE for randomness internally — make sure the vendored SHA-3 module is hooked up correctly.
- Decapsulate doesn't throw on bad input — it returns a wrong-but-valid-looking shared secret. The hybrid construction protects against this (the ECDH halves wouldn't match), but worth being aware of.
- Bundle size will grow by ~50KB. Acceptable.

**Effort:** Medium-large. One focused session, with care.

---

## 3. QR code generation for in-person invite exchange

**Problem:** Sharing the invite blob over Discord/etc. leaks the metadata of "these two people are starting a conversation." For users who care about that, the only fix is in-person exchange. The blob is too long to read aloud.

**Solution:** Generate a QR code in the app for the invite/answer blob. User shows it on screen, friend scans with their phone camera (which has a built-in QR reader).

**Approach:**
- Vendor a small QR encoder. Options:
  - `qr-code-styling` — pretty but heavy.
  - `qrcode-svg` — minimal, ~5KB.
  - Roll one from scratch using `qrcode-generator` (~10KB) — battle-tested, MIT.
- Add a "Show QR" button next to "Copy" in both invite and answer steps.
- Render to an SVG inline in the modal.
- Blob may need to be split into multiple QRs if it exceeds QR's data capacity (~2.9KB for QR version 40 with low error correction). For typical WebRTC SDP sizes, one or two QRs should suffice.

**Watch for:**
- QR scanning needs to happen on a phone with a camera — confirm both peers actually have one available.
- For multi-QR, you need a sequencing scheme so the receiver can stitch them in order.
- A scanner-side flow (browser using `getUserMedia` + a JS QR decoder) would let you scan from another browser — nice to have, not required for v1 of this feature.

**Effort:** Small-medium. Half a session.

---

## 4. Forget / remove individual peer

**Problem:** Currently the only way to remove a peer is "Wipe everything" in About. As peer lists grow, users will want per-peer removal.

**Approach:**
- Add a small "..." menu to each peer-list item.
- Menu items: "Forget this peer" (deletes from `peers` store and `messages` store, removes from in-memory `peers` Map).
- Confirm dialog before deletion.
- About 30 lines of code.

**Effort:** Trivial. 15 minutes.

---

## 5. Polish: non-extractable private key import

**Problem:** Currently `genIdentityKeypair` generates the keypair as `extractable: true` for both halves (the API requires it for the public key to be exportable). The private key is therefore *technically* extractable via `crypto.subtle.exportKey('jwk', privateKey)`. Defense relies on never calling that.

**Solution:** Generate the keypair extractable, immediately re-import the private key as non-extractable, then drop the original CryptoKey reference.

**Approach:**
```js
const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
const pubRaw = await crypto.subtle.exportKey('raw', kp.publicKey);
const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
const privateKey = await crypto.subtle.importKey('jwk', privJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey', 'deriveBits']);
// kp.privateKey reference goes out of scope; privJwk is the only export and is local
```

**Watch for:** the JWK is briefly in memory. Best we can do in a browser. Negligible risk, fixes a cosmetic crypto-hygiene gap.

**Effort:** Trivial. 10 minutes. Worth doing alongside any other crypto change.

---

## 6. Group chat (significant scope)

**Not on the immediate roadmap.** Mentioned for completeness because users always ask. Group chat in an E2E P2P system is a serious design exercise — Signal's Sender Keys, MLS (Messaging Layer Security), etc. Not appropriate to bolt on. Treat as "different product" if requested.

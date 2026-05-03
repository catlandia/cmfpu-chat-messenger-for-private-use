# Crypto and threat model

## Threat model

### What CMFPU protects

| Threat | Defense |
| --- | --- |
| Passive network observer reading messages | E2E encryption with per-session AES-256-GCM |
| Compromise of the bootstrap channel (e.g., Discord) | Only the public key + IP transit; private keys never leave devices |
| Compromise of long-term static private key, *after the fact* | Forward secrecy: ephemeral keys for each session were dropped; past sessions stay sealed |
| Active MITM tampering with invite/answer blobs | Tamper-evident via 8-byte fingerprint check, compared out-of-band |
| Server-side data exfiltration | There is no server in the message path |

### What CMFPU does NOT protect

| Threat | Why we can't / don't |
| --- | --- |
| Endpoint compromise (malware on user's PC) | Out of scope for app-layer crypto |
| Coercion / shoulder surfing | Same |
| Friend choosing to leak the plaintext | Same — they have the key |
| Metadata: that you talked, with whom, when | WebRTC reveals IP-to-IP traffic; bootstrap channel reveals pairing event |
| Quantum computers in the 2030s+ | **Deferred — see [roadmap.md](roadmap.md), the ML-KEM-768 task** |

The threat-model section in the project-root `README.md` is the user-facing version of this. Keep them in sync.

## Primitives in use

| Primitive | Where | Why this one |
| --- | --- | --- |
| ECDH P-256 | Identity keypair + ephemeral keypair | Universally supported by Web Crypto. X25519 would be marginally preferred but isn't supported in *every* browser yet (Safari got it relatively recently). P-256 keeps us compatible everywhere with no security loss for our threat model. |
| HKDF-SHA256 | Combining static_DH and ephemeral_DH into the session key | Standard NIST KDF. Web Crypto has it natively. |
| AES-256-GCM | Message encryption | Standard authenticated encryption. Web Crypto has it natively. Random 12-byte IV per message — fine at our message-rate scale. |
| SHA-256 | Identity fingerprint (8 bytes truncated), file hash (full 32 bytes) | Web Crypto. |

**No third-party crypto libraries.** Everything is Web Crypto. This is deliberate: zero supply-chain risk, zero vendoring problem, zero "did the bundler corrupt the code" concern.

## Key derivation flow (per session)

```
my static priv  ─┐
                 ├──── ECDH ────► dh1 (32 bytes)
their static pub ─┘
                                                ┐
                                                │
my ephem priv  ─┐                               │
                ├──── ECDH ────► dh2 (32 bytes) │
their ephem pub ─┘                              │
                                                ▼
                                       ikm = dh1 || dh2 (64 bytes)
                                                │
                                                ▼
                                       HKDF-SHA256
                                       salt = empty
                                       info = "cmfpu-v2-session-key"
                                                │
                                                ▼
                                       AES-256-GCM key
```

Same derivation runs on both peers; both end up with identical keys without ever transmitting them.

**Why combine static + ephemeral?**
- Static-only would be deterministic and break forward secrecy: same parties always derive same key.
- Ephemeral-only would have no identity binding: anyone could MITM with their own ephemerals, no way to verify identity.
- Combining both: identity is bound (the key is only correct if you have the right static keys), AND past sessions stay safe even if static keys later leak.

This is essentially a simplified X3DH without the prekey bundle. Real X3DH does 3-4 ECDH operations. Ours does 2. Acceptable for our use case (synchronous handshake, both parties online for the round-trip).

## Fingerprint construction

```js
const hash = await crypto.subtle.digest('SHA-256', publicKeyRaw); // 32 bytes
const bytes = new Uint8Array(hash).slice(0, 8);                    // truncate to 8 bytes (64 bits)
return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join(':');
// "ab:cd:ef:12:34:56:78:90"
```

**Why 64 bits?** Compromise: human-readable in one glance, while still computationally expensive to find a collision (2^32 hashes for a generic collision, 2^64 for a targeted preimage). Good enough for "does this fingerprint match what my friend sees" — not good enough for cryptographic identity in higher-stakes settings (Signal uses 512 bits / 60 hex chars for safety numbers).

If raising the bar later: bump to 16 bytes (128 bits) and reformat. Truncated SHA-256 is still SHA-256 properties for the truncated portion — no fancy KDF needed.

## Why no per-message ratcheting

Considered for v0.2, deferred. Reasoning:

- WebRTC data channel is configured `ordered: true`, so out-of-order delivery isn't a concern.
- Sessions are short-lived and bounded by the WebRTC connection lifetime (no persistent session state across reloads).
- We have no group chat where one compromised participant could expose others.
- Per-message ratcheting adds complexity (state machines, key storage, recovery from desync) for marginal gain in this threat model.

Session-level forward secrecy via fresh ephemerals each connect gives us most of the benefit. If we ever add long-lived persistent sessions (e.g., via DHT auto-reconnect that keeps a stable session alive across reloads), revisit this.

## Why no PQ yet

ML-KEM-768 hybrid would protect against "harvest now, decrypt later" attacks by future quantum computers. The blocker is purely engineering: cleanly vendoring `@noble/post-quantum` requires bundling 5+ ESM modules into a single self-contained IIFE while preserving exact algorithm correctness. Doing it sloppily is worse than not doing it (a broken PQ implementation gives false security).

See [roadmap.md](roadmap.md) for the execution plan when picked up.

## Crypto don'ts

- **Don't reuse IVs.** Each `encryptMsg` call generates a fresh random 12-byte IV. AES-GCM is catastrophically broken under IV reuse with the same key. The current code is correct; don't "optimize" it to a counter or anything cute.
- **Don't store the session key persistently.** It's set to `null` on disconnect, which is correct. Saving it to disk would defeat forward secrecy.
- **Don't extract the private identity key.** It's generated as `extractable: true` for `publicKey` (we need to share it) but `privateKey` is also generated extractable due to `genIdentityKeypair` using `true` — this is a small wart. Should ideally be split: generate keypair extractable, immediately re-import private as non-extractable. Currently we rely on never *calling* exportKey on the private key. **Worth fixing in a future polish pass.**
- **Don't roll your own crypto.** When (not if) you're tempted to add a "small" custom primitive, stop. Use Web Crypto or audited libraries.

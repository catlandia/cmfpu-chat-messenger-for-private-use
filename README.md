# CMFPU — Chat Messenger For Private Use

A peer-to-peer end-to-end encrypted chat messenger that lives in a single HTML file.

- No accounts.
- No servers in the message path. (Public STUN servers are used briefly, only for NAT traversal during the WebRTC handshake; they never see message content.)
- No build step. No dependencies. No tracking. No telemetry.
- Cryptographic keys are generated on your device and never leave it.
- Every message is end-to-end encrypted with AES-256-GCM under a per-session key derived from a hybrid (static + ephemeral) ECDH handshake.
- Designed to be **frozen** — you save the file, hash it, and that's the version you keep.

## How to use it

### First launch

1. Open `index.html` in any modern browser. (If WebRTC misbehaves over `file://`, run `python -m http.server 8000` from this folder and open `http://localhost:8000` instead — some browsers' WebRTC stacks dislike `file://` origins.)
2. Pick a display name. The app generates an ECDH keypair locally and stores it in IndexedDB. The private key is marked non-extractable and never leaves your device.
3. Your **8-byte fingerprint** appears in the sidebar (e.g., `ab:cd:ef:12:34:56:78:90`). This is your stable identity. Tell your peers what fingerprint they should expect to see for you, via any second channel (voice call, in person).

### Adding a peer (manual signaling, no server)

WebRTC needs to know how to reach the other side. Without a signaling server we do this by hand — once per peer, ever:

1. **You:** click `+ Add peer` → `Invite someone` → `Generate invite`. Wait a few seconds while the app gathers ICE candidates. Copy the resulting blob.
2. Send the blob to your friend through any text channel — Discord, Signal, email, AirDrop, USB stick, even a printed QR if you want. **The blob is not sensitive in the way a password is** — it contains only your public key (designed to be shared) and your IP address.
3. **Your friend:** opens the app, picks a display name, then `+ Add peer` → `Accept an invite` → pastes your blob → `Generate answer`. Copies their answer blob.
4. Friend sends their answer back to you the same way.
5. **You:** paste their answer into the `Their answer` field → `Connect`.
6. The app derives a fresh per-session symmetric key from both static identities and both ephemeral session keys. Both peers compute the same key locally; nothing secret is transmitted.
7. **Verify fingerprints.** After connecting, both of you should compare the 8-byte fingerprint shown in the chat header. If they match what each of you expects (from step 3 of First Launch), the connection is genuine. If they don't match, somebody tampered with the blobs in transit — disconnect and try a different sharing channel.

### Reconnecting later

Sessions don't persist across reloads — WebRTC connections are inherently single-session. Identity, peer list, and message history all persist; the live connection has to be re-established. To reconnect to a peer, do the invite/answer dance again. New ephemerals are generated, a new session key is derived, past messages remain readable.

This is a real friction point. See "Roadmap" below.

## Threat model

### What CMFPU protects

- **Message confidentiality.** Nobody who isn't holding one of the two private keys can decrypt a message — not your ISP, not Discord (if you used it to share invites), not Cloudflare, not Google, not the operator of any STUN server, not any AI model trained on this code. The math is AES-256 + ECDH on P-256, both standardized and unbroken.
- **Forward secrecy at session granularity.** Each session uses a fresh ephemeral keypair on each side. If your long-term identity private key is compromised tomorrow, the attacker still cannot decrypt past sessions, because the ephemeral private keys for those sessions were dropped when the sessions ended.
- **Tamper-evidence at handshake.** A man-in-the-middle attacker who alters invite/answer blobs in transit will produce a different fingerprint than your friend expects. The 5-second out-of-band fingerprint check catches this.

### What CMFPU does NOT protect against

- **Endpoint compromise.** If malware is reading your IndexedDB or watching your screen, no crypto helps. Same applies to your friend's device.
- **Coercion / shoulder-surfing.** If somebody can see your screen, they can read your messages.
- **Your friend choosing to leak.** They have the plaintext too. Crypto doesn't enforce intent.
- **Metadata: that you're talking, and to whom.** WebRTC traffic itself reveals IP-to-IP communication patterns; the bootstrap channel reveals who you set up a chat with. If you need metadata privacy, you need Tor or onion routing — out of scope here.
- **Quantum computers in the 2030s+.** ECDH on P-256 will be breakable by sufficiently large quantum computers via Shor's algorithm. This means the "harvest now, decrypt later" attack is theoretically viable for highly-motivated adversaries. **Post-quantum (ML-KEM-768 hybrid) is the planned next major upgrade — see Roadmap.**

## Verifying the file you're running

Open the About modal (click the version number in the bottom-right corner). The app computes the SHA-256 hash of the HTML file you have loaded. Compare it against the published hash for this version:

| Version | SHA-256 of `index.html` |
| --- | --- |
| `0.2.1` | `efeb38148d29795387a390d44c9e657e3c808be95dc075dba4842c4db65719fc` |

If they match, you have the canonical file and no one has slipped extra code in.

## Design philosophy

CMFPU is intended to be **shipped, hashed, and forgotten**. There is no auto-update mechanism, no telemetry, no "phone home." If a critical bug is later discovered, a new version will be published with a new hash, but that decision is left to you — you choose when to upgrade by replacing the file. Until then, the file you have is the file you have, forever.

This trades the auto-patch safety net for resistance to malicious-update attacks. It's a deliberate choice, not a missing feature.

## Roadmap

Things deliberately deferred from v0.2 to a focused future release:

- **ML-KEM-768 hybrid post-quantum handshake.** Combine current ECDH with NIST-standardized lattice-based key encapsulation so messages stay sealed even against future quantum computers. Requires careful inline-vendoring of `@noble/post-quantum` and full test coverage with the FIPS-203 reference vectors.
- **QR code generation/scanning** for in-person blob exchange — eliminates the metadata leak of bootstrapping over Discord/etc.
- **DHT-based peer discovery** (Hyperswarm / mainline DHT) so peers can reconnect without redoing the signaling dance every session. Removes the biggest UX friction point. Still no servers run by us; uses a public peer-finding network.

## File layout

```
.
├── index.html      # The entire app — UI, crypto, networking, storage
└── README.md       # This file
```

That's it. There is nothing else.

## License

MIT.

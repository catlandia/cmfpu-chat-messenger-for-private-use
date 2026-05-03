# Design decisions log

The *why* behind every non-obvious choice. Read before changing things — most of these were deliberated.

## Architecture-level

### Single self-contained HTML file
Chosen because the user wants "as close to final as possible" with no auto-update mechanism. A single file the user can save, hash, and trust forever. Splitting into multiple files or adding a build step breaks this property. **Don't add `package.json`, don't add bundlers, don't split into modules.**

### No central server in the message path
Explicit user requirement. The previous incarnation of the project was a Node/Express server with Socket.IO doing fake-E2E (server stored "encrypted" messages). Wiped entirely.

### Public STUN is acceptable; running our own infrastructure is not
STUN doesn't see message content — it just tells your browser what its public IP is. The user accepted this once it was explained. We use Google + Cloudflare public STUN. If both go down, the app degrades to LAN-only, which is a reasonable failure mode.

### WebRTC for transport, manual signaling for setup
WebRTC gives us peer-to-peer data channels with built-in DTLS encryption (a defense-in-depth layer below our AES-GCM). Manual signaling avoids the "we need a signaling server" problem at the cost of UX friction. The friction is acknowledged; the long-term fix is DHT-based discovery (deferred to roadmap).

## Crypto-level

### ECDH P-256 over X25519
P-256 has universal Web Crypto support. X25519 was added to Web Crypto more recently and isn't on every browser version yet. The security difference is negligible for our threat model. **If browser support reaches 100% and you want to switch, it's straightforward** — same Web Crypto interface, just `'X25519'` instead of `{ name: 'ECDH', namedCurve: 'P-256' }`. But don't bother unless there's a compelling reason.

### Hybrid static + ephemeral instead of static-only
Originally the v0.1 design used only static ECDH. This was correct functionally but had no forward secrecy: compromise of a long-term private key would let an attacker re-derive any session key and read all past messages. v0.2 added the ephemeral layer specifically to close this gap.

### Session-level FS, not message-level ratcheting
See [crypto.md](crypto.md) for full reasoning. Short version: ordered channel, short sessions, no group chat, marginal gain for the complexity.

### ML-KEM-768 deferred, not implemented poorly
The user wants post-quantum, but doing it right requires careful inline-vendoring of an audited library. Doing it wrong (homemade lattice crypto) is much worse than not doing it. Documented in [roadmap.md](roadmap.md) with execution plan.

## Storage-level

### IndexedDB instead of localStorage
- IDB can store `CryptoKey` objects directly (structured-cloneable). localStorage can only store strings.
- IDB is the standard for non-trivial structured data in browsers.
- Quota is much higher (gigabytes vs. ~5MB).

### Three separate stores, not one
`identity`, `peers`, `messages` are conceptually distinct. Separate stores let us iterate just one (e.g., `dbAll('peers')` without scanning unrelated keys) and migrate them independently in future schema versions.

### Messages capped at 500 per peer
Arbitrary cap to bound storage growth. Easy to bump if users complain. The cap is enforced on push, not on load — old messages just slide off the front.

### Debounced message persistence (200ms)
Avoids one IDB write per keystroke. 200ms is short enough to feel instant, long enough to batch typical typing bursts.

## UI-level

### Dark theme, no light mode
Simpler, fits the "private/secure" feel better. If users complain, add a CSS variable swap — easy to retrofit.

### Fingerprint shown prominently in sidebar
The fingerprint is the load-bearing security check (defense against MITM). Hiding it would make verification feel optional. **Don't move it to a settings page or About-only location.**

### Clickable version display opens About modal
About modal needs an entry point. A small footer that's easy to find but doesn't add toolbar chrome was the right tradeoff. The corner placement is intentional — out of the way, present but not loud.

### No "Forget peer" button yet
Not implemented in v0.2. Listed as future work. Currently the only way to remove a peer is via "Wipe everything" in About. Acceptable for early versions; should be added when peer-list grows past 5-10 entries in real use.

### Reconnect button in chat header (offline state)
Added in v0.2.1 to surface the re-handshake action when WebRTC drops on reload. The button text uses `↻` (no emoji) to match the muted UI palette. **Don't add a "Auto-reconnect" toggle** — there's nothing to auto-reconnect to without DHT discovery.

## Versioning

### Semantic-ish versioning
- v0.x = pre-release, breaking protocol changes allowed between minor versions.
- Patch bumps (v0.2.1) for UX/bug-fix changes that don't break protocol.
- v1.0 will be reserved for the post-PQ release with a stabilized protocol.

### Protocol version separate from app version
`PROTOCOL_VERSION` is the on-the-wire blob version (currently 2, bumped from 1 when we added ephemeral keys). App version (`VERSION`) bumps independently. **A v0.5 client and v0.6 client with the same `PROTOCOL_VERSION` should interoperate.**

### Hash published in README
Each release's SHA-256 of `index.html` goes in the README's verification table. The About modal shows the live hash so users can compare. **Always update the README hash when shipping a new version** — a stale hash is worse than no hash.

## Things explicitly avoided

- **No analytics, no telemetry.** Not even error reporting. The app should make zero outbound network requests other than WebRTC + STUN.
- **No "Reset password"** flow. There are no passwords. Identity is the keypair. If lost, you create a new identity.
- **No "Forgot fingerprint" recovery.** If a peer's stored public key changes, treat it as a different identity. Don't add fuzzy matching.
- **No code minification.** Fights the "readable, auditable" goal.
- **No dependencies of any kind.** Even via CDN at runtime (it would add a third-party trust point and break offline use).

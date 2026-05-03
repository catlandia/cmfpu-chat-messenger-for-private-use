# Architecture

## File layout

```
.
├── index.html        # The entire app. ~1015 lines, no dependencies, no build step.
├── README.md         # User-facing docs.
└── docs/             # Notes for future-Claude (this folder).
```

That's it. Resist the urge to split. The "single self-contained file you can save and verify by hash" property is load-bearing.

## index.html structure

The file is laid out top-to-bottom as: **HTML structure → inline CSS → inline JavaScript**. Approximate line ranges (will drift; grep to confirm):

| Section | Approx lines | What's there |
| --- | --- | --- |
| `<head>` + inline `<style>` | 1–225 | Dark-theme CSS, layout for screens / sidebar / chat / modals. |
| `<body>` markup | 130–260 | Three "screens" (welcome, main, modals) toggled via `.active` class. |
| Constants & globals | 264–280 | `VERSION`, `PROTOCOL_VERSION`, `ICE_SERVERS`, `DB_NAME`, `DB_VERSION`, `MAX_MESSAGES_PER_PEER`, the in-memory `peers` Map, `identity`, `pendingInvite`. |
| IndexedDB helpers | ~285–340 | `openDB`, `dbGet`, `dbPut`, `dbAll`. Three object stores: `identity`, `peers`, `messages`. |
| Crypto utilities | ~345–435 | base64 ↔ ArrayBuffer, `genIdentityKeypair`, `fingerprintOf`, `deriveSessionKey` (the HKDF combiner), `encryptMsg`, `decryptMsg`, `importPubKeyRaw`. |
| Identity bootstrap | ~440–485 | `loadOrCreateIdentity`, `createIdentity`, `loadStoredPeers`. |
| WebRTC signaling | ~490–610 | `createPC`, `waitForIceComplete`, `generateInvite`, `acceptInvite`, `applyAnswer`. |
| Peer state mgmt | ~615–700 | `registerPeer`, `attachDataChannel`, `pushMessage`, `pushSystemMessage`, `schedulePersist`. |
| UI rendering | ~705–810 | `showScreen`, `renderIdentityHeader`, `renderPeerList`, `selectPeer`, `updateChatHeader`, `renderMessages`, `enableComposer`, `escapeHtml`. |
| UI: send + modals | ~815–890 | `sendMessage`, `openAddPeerModal`, `closeAddPeerModal`, `switchTab`, `resetInviteFlow`, `resetAcceptFlow`, `showError`, `showOk`. |
| Event wiring | ~895–960 | All `addEventListener` calls in one place via `wireListeners()`. |
| About modal | ~965–995 | `computeFileHash` (SHA-256 of self), `openAboutModal`, `wipeEverything`. |
| Bootstrap | ~1000–1015 | `enterMainScreen`, `init`, `DOMContentLoaded` handler. |

When editing, keep this rough order. Crypto next to crypto, UI next to UI.

## Key data structures

**`identity`** (global, populated after `loadOrCreateIdentity` or `createIdentity`):

```js
{
  displayName: string,
  privateKey: CryptoKey,        // ECDH P-256, non-extractable, never leaves the device
  publicKey:  CryptoKey,
  publicKeyRaw: ArrayBuffer,    // SEC1 uncompressed, 65 bytes — used for sharing/fingerprinting
  fingerprint: string,          // 8 bytes of SHA-256(publicKeyRaw), formatted "ab:cd:ef:..."
}
```

**`peers`** (global Map, key = fingerprint):

```js
{
  fingerprint: string,
  name: string,
  publicKeyRaw: ArrayBuffer,
  publicKey: CryptoKey,
  sharedKey: CryptoKey | null,  // session key, null when offline (ephemeral keys discarded)
  pc: RTCPeerConnection | null,
  channel: RTCDataChannel | null,
  status: 'connecting' | 'online' | 'offline',
  messages: Array<{from: 'me'|'them'|'system', text: string, ts: number}>,
}
```

**`pendingInvite`** (global, set during invite flow before the answer comes back):

```js
{ pc: RTCPeerConnection, dataChannel: RTCDataChannel, ephemPriv: CryptoKey }
```

## IndexedDB schema (DB version 2)

| Store | Key | Value |
| --- | --- | --- |
| `identity` | `'self'` | `{ displayName, privateKey: CryptoKey, publicKeyRaw: ArrayBuffer }` |
| `peers` | `fingerprint` (string) | `{ fingerprint, name, publicKeyRaw, addedAt }` |
| `messages` | `fingerprint` (string) | `Array<{from, text, ts}>` (capped at 500, debounced writes) |

**CryptoKey objects can be stored directly in IDB** — they're structured-cloneable. The non-extractable private key keeps that property when stored; the browser holds the actual key material outside JS.

## WebRTC handshake flow (manual signaling)

1. **Inviter** generates `pendingInvite = { pc, dataChannel, ephemPriv }`. Calls `pc.createOffer` → `setLocalDescription` → `waitForIceComplete` (5s safety timeout). Emits invite blob containing static pubkey, ephemeral pubkey, SDP.
2. **Accepter** parses invite, generates own ephemeral, calls `pc.setRemoteDescription` → `pc.createAnswer` → `setLocalDescription` → `waitForIceComplete`. Derives session key. Emits answer blob containing their static pubkey, their ephemeral pubkey, SDP answer.
3. **Inviter** parses answer, calls `pc.setRemoteDescription`. Derives session key (same on both sides via DH math).
4. WebRTC negotiates DTLS, data channel opens, `attachDataChannel` listeners fire `peer.status = 'online'`.

**WebRTC connections cannot survive page reload.** This is a protocol fact. SDPs contain session-bound state (live IPs, expired ICE candidates, DTLS state). The Reconnect button surfaces the re-handshake action; `registerPeer` keys by fingerprint so existing peer records (and message history) are preserved.

## Browser API requirements

- `crypto.subtle` (Web Crypto): ECDH P-256, AES-GCM, HKDF, SHA-256, SHA-256 export of public key as `'raw'`. All universally supported.
- `RTCPeerConnection` with data channels: universally supported.
- `IndexedDB`: universally supported. The app stores `CryptoKey` objects directly (structured-cloneable).
- `navigator.clipboard.writeText`: works in secure contexts. `file://` is treated as secure for clipboard in Chrome/Edge but not always in Firefox — there's a fallback message telling the user to copy manually.
- `fetch(window.location.href)` for self-hash computation: works on `http(s)://`, may be blocked on `file://` depending on browser. Falls back to a clear message.

## Things that look like bugs but are intentional

- `peer.sharedKey` is `null` when a peer is offline. Don't try to reuse it across sessions; the ephemeral private key was already dropped.
- Old v1 invite/answer blobs are rejected by v2 protocol. We don't keep backward compat across protocol versions — each protocol version is a clean break with a documented migration step.
- System messages (`from: 'system'`) are *not* persisted, only chat messages. They're transient session notices ("Connected", "Disconnected") and re-shown only for the current session.
- The composer is `disabled` even with text in it when offline. Send requires both an open data channel AND a derived `sharedKey`.

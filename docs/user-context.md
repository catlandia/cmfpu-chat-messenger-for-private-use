# User context

## What they're building and why

CMFPU = "Chat Messenger For Private Use." The name **is** the thesis. Every design choice should be re-checked against it: does this serve "private chat that I personally control"?

The user wanted to build their own version of something like Signal/Briar/Cwtch — fully aware those exist — because they wanted to own the stack. This is a learning + autonomy project, not a "ship to a million users" project.

## Their stated threat model (in their own words, paraphrased)

- "Total security so even Mythos can't hack the messages" — they treat future AI models as a relevant adversary class. They want math-based protection, not policy-based protection.
- "Truly no servers" — refined during conversation to "no servers we run, no servers in the message path." They accepted public STUN once it was explained that STUN doesn't see message content.
- "Even with fully decompiled, explained code, no one can decrypt" — i.e., Kerckhoffs's principle. Security from keys, not obscurity. They liked this framing once it was explained.
- "Final version, no updates after" — softened to "as close to final as possible" once the patching-vs-malicious-update tradeoff was explained.

## How they collaborate

- **They bounce between options before committing.** Don't take an early "let's do X" as final — they'll often reconsider once they see the implications. Wait until they say "do it" or "screw it, just do X" before you start writing.
- **They commit decisively when given a strong recommendation with the tradeoff stated.** "Here are 5 options" wastes their time. "Do X because Y, the cost is Z, want me to start?" gets a decision. The system-prompt rule about "2-3 sentences with a recommendation and the main tradeoff" works extremely well with this user.
- **They appreciate blunt honesty about limitations.** When you can't do something (browser-test from this env, vendor a complex crypto lib in one turn, preserve WebRTC across reload), say so directly. They respect the limit and adjust.
- **They don't want overselling.** Don't say "perfect, secure, final" when something is "v0.2 with known deferrals." Be honest about what was actually delivered.
- **They write English non-natively** (typos like "yhe", "lacs", "overgive"/hand-over). Don't comment on it; just parse the meaning.
- **Brief is better than thorough** in responses. Get to the point. Long structured responses are fine when the topic warrants it (security explanation, design recommendation), but don't pad routine confirmations.

## Things they explicitly rejected during the design process

- **Central servers in the message path** — flatly no.
- **Mobile/native app for AirTag-style mesh** — they considered it, then chose PC-only. Don't suggest "let's just build a React Native app" unless they bring it up.
- **Auto-update mechanisms** — see "final version" above. Any code that phones home for updates is wrong for this project.
- **Auto-discovery via centralized presence services** — same reason.
- **Vendor obfuscation / minified delivery** — they want the file readable.

## Things they accepted with explanation

- **Public STUN servers** for NAT traversal — once it was clear STUN doesn't see messages, this was fine.
- **Manual signaling friction** for v0.1/v0.2 — accepted as a known limitation; the real fix is DHT discovery, deferred to roadmap.
- **Deferred ML-KEM** — they accepted that doing it carefully later is better than doing it sloppy now.
- **Session-level forward secrecy instead of per-message ratcheting** — accepted as a reasonable scope cut.
- **WebRTC connection cannot survive page reload** — accepted as a protocol-level fact, with the Reconnect button as a UX softener.

## Tone calibration

The user's last several messages were short and decisive ("okay good", "okay thanks", "okay just do whatever you need to do else in the plan"). They're not in a chatty mood; they're shipping. Match that energy in routine responses. Save the longer explanations for when the topic actually requires them (a security misconception worth correcting, a design decision they need to weigh in on).

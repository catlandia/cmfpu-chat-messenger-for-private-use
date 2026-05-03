# Notes for future Claude

This folder is for me, not for users. The user-facing docs live in the project-root `README.md`.

If you (future-me) just got dropped into this repo cold, read in this order:

1. **[user-context.md](user-context.md)** — who you're working with, what they want, how they think about the project. **Read this first; it changes how you should respond.**
2. **[architecture.md](architecture.md)** — code map of `index.html`, the only source file.
3. **[crypto.md](crypto.md)** — what security guarantees the app actually provides, what it doesn't, and why specific primitives were chosen.
4. **[decisions.md](decisions.md)** — design decisions log. The *why* behind every non-obvious choice. Skim before changing things.
5. **[roadmap.md](roadmap.md)** — what's deliberately deferred, with enough context to actually execute when picked up.

The project is intentionally tiny: **one HTML file**, no build step, no dependencies, no servers. If you find yourself wanting to add tooling or split the file into modules, **stop and re-read `user-context.md`** — that's not what this project is.

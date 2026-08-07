# Security Policy

Gethen is currently documentation-only. No supported production version exists.

For future implementation work:

- Treat cell text, clipboard data, protocol requests, and server responses as untrusted input.
- Do not execute HTML or arbitrary expressions from cell values or protocol filters.
- Review runtime dependency licenses and supply-chain risk before adoption.
- Document security-sensitive architecture changes in `docs/architecture/` and, when decision-level, in `docs/adr/`.

Security reporting channels are not established yet. Before public release, define a maintainer contact path and private vulnerability reporting process.

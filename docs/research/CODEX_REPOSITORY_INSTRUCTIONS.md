# Codex Repository Instructions Research

## Status

Completed

## Question

What belongs in root `AGENTS.md`, and when are nested `AGENTS.md` files justified?

## Context

Gethen needs clear guidance for future Codex work without turning `AGENTS.md` into a substitute for architecture, roadmap, or implementation plans.

## Evaluation Criteria

- Official OpenAI/Codex source.
- Clear instruction scope and precedence.
- Practical routing for this repository.

## Evidence

- OpenAI Codex base instructions describe `AGENTS.md` as repository guidance for coding conventions, organization, and test commands. They state that scope is the directory tree rooted at the folder containing the file, deeper files take precedence on conflicts, and direct system/developer/user instructions take precedence over `AGENTS.md`.
- The OpenAI Codex repository documentation notes project docs are discovered from repository root toward the current directory, with `AGENTS.override.md` before `AGENTS.md` when that feature is active.
- An OpenAI Codex issue comment explains that Codex uses filesystem markers such as `.git` to determine project root, and the marker may be used even when Git cannot be invoked.

## Experiments And Benchmarks

No benchmark applies. Repository inspection found no existing `AGENTS.md`.

## Analysis

Root `AGENTS.md` should contain stable workflow and routing instructions. It should not duplicate product vision, architecture, or milestone details because those documents need independent review and ownership. Nested `AGENTS.md` files are justified only when a subtree has materially different commands or conventions.

## Options

- Root-only `AGENTS.md`: best for current documentation-only repo.
- Nested `AGENTS.md`: defer until packages, crates, apps, tests, or benchmarks need different commands.
- Non-standard instruction directories such as `.planning/` or `.memory/`: not used because official sources do not establish them as Codex repository standards.

## Recommendation

Use a concise root `AGENTS.md` with documentation routing and no nested files yet.

## Limitations

Codex behavior can evolve. Re-check official OpenAI/Codex docs when changing instruction strategy.

## Open Questions

- Which build/test commands should be added after the repo foundation milestone?

## References

- "OpenAI Codex base instructions default.md", OpenAI Codex GitHub repository, accessed 2026-08-04, primary, https://github.com/openai/codex/blob/main/codex-rs/protocol/src/prompts/base_instructions/default.md
- "AGENTS.md Discovery", OpenAI Codex GitHub repository, accessed 2026-08-04, primary, https://github.com/openai/codex/blob/main/docs/agents_md.md
- "Repo-root AGENTS.md and .agents/skills are not loaded on session start", OpenAI Codex GitHub issue, accessed 2026-08-04, primary maintainer discussion, https://github.com/openai/codex/issues/25651

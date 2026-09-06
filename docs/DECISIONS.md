# Decisions

This file records the rationale behind architectural and tooling decisions that apply across the repository.
Each decision: **selected**, **rejected alternative**, **rationale**, **cost**.

Project-specific decisions belong in the relevant project's `docs/DECISIONS.md`.

---

## Copying shared code between web and mobile

**Selected:** `types.ts`, `money.ts`, and `enums.ts` are maintained as separate copies in both projects.
**Rejected:** pnpm workspace + `packages/shared`

React Native is sensitive to workspace hoisting due to Metro bundler; configuring `watchFolders` and `extraNodeModules`, aligning TypeScript paths on both sides, and the risk of different behavior in EAS build versus local development add more cost than benefit at this scale.

**Cost:** When a shared file changes, the other copy must be updated manually. In a larger product, `packages/shared` would be the appropriate solution.

---

## Documentation separation

**Selected:** The root `AGENTS.md` contains repository-wide rules; each project has its own `AGENTS.md` for project rules; root `docs/DECISIONS.md` records shared rationales; project `docs/DECISIONS.md` files record project-specific rationales.
**Rejected:** A single large document or a separate repository-wide `ARCHITECTURE.md`

The separation is based on scope and time: repository rules apply everywhere, project rules apply within one project, setup is done once, and decisions were made in the past. Keeping setup details out of `AGENTS.md` preserves its signal.

**Cost:** Each time, the correct document must be chosen; if boundaries become unclear, documents can diverge.

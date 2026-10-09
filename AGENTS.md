# DoorKart / BuyNest engineering guidance

Maintain this existing project; do not rebuild it or refactor unrelated code. Preserve DoorKart branding and existing BuyNest paths, API identifiers, cookies, and storage keys.

## Project map
- `App/BuyNest`: Expo / React Native customer app, Expo Router, TypeScript.
- `Backend`: Express REST API, Prisma, PostgreSQL, TypeScript.
- `Admin/Frontend`: Next.js App Router admin app, Tailwind, TypeScript.
- Each app uses npm and its own lockfile. Read `PROJECT_ARCHITECTURE.md` and applicable nested `AGENTS.md` files before work. Preserve the nested Expo and Next.js guidance.
- Architecture documentation describes a source snapshot, not passing tests or live deployment state. Verify relevant code before relying on it.

## Before editing
- Read affected implementations, imports, callers, frontend consumers, and database relationships.
- Check Git status at the root and affected nested repositories (`Backend`, `Admin/Frontend`). Preserve unrelated tracked and untracked work; do not commit automatically.
- Explain the requirement, affected modules, compatibility risks, approach, and verification plan. Prefer minimal changes using existing helpers and conventions.
- Obtain approval before high-risk, ambiguous, architectural, financial, authentication, or database changes. Simple, low-risk tasks within an approved request may proceed.

## Compatibility and business rules
- Backend prices, totals, stock availability, and order/payment transitions are authoritative. Money is integer paise; shop calendar dates use IST.
- Available stock = physical `stockQuantity` minus `reservedQuantity`. Placement reserves, cancellation releases, and delivery deducts both. Preserve transactions, atomic guards, lock order, and audit records.
- Delivery and cash collection are independent. COD is the only implemented payment method; a refund enum is not a refund implementation.
- Preserve historical order snapshots, request fingerprints, tracking-token authorization, and idempotent retries. A timeout does not prove an order failed; preserve unresolved mobile submissions.
- Customer `Account` and guest `Customer` are separate. Account sign-in does not authorize guest orders or synchronize device-local data.
- Trace mobile and admin consumers before changing API routes, fields, envelopes, or errors. Preserve storage versions and existing backward compatibility.
- Preserve SQL migration constraints as well as Prisma relationships. Never edit generated Prisma output.

## Safety and approval
- Never expose or hardcode secrets, passwords, account tokens, tracking tokens, or private environment values. Do not copy them into documentation or logs.
- Preserve admin authentication, trusted-origin checks, and `SUPER_ADMIN` settings authorization.
- Obtain approval before schema changes or executing migrations; explain existing-data compatibility and recovery. Never reset, truncate, drop, or destructively modify data without explicit approval.
- Obtain approval before dependency installation or major configuration changes; explain other configuration/dependency changes before editing. Use version-matched framework guidance required by nested instructions.
- Review command side effects: Compose startup automatically migrates the database; backend tests migrate temporary PostgreSQL; seed, reset, and admin-creation scripts write data. Do not execute them during read-only discovery or a documentation-only task.
- Do not create or overwrite project-context documents without approval. Do not fix suspected issues unless requested.

## Verification and reporting
- For code changes, run relevant existing typecheck, lint, tests, and build checks when authorized and safe. Review test service/data effects first. Mobile changes also need relevant runtime verification when feasible.
- Do not suppress errors, add `any`, bypass lint, or remove validation merely to pass checks.
- Report exact checks passed, failed, or not run; static review is not runtime testing.
- Summarize files changed, purpose, database/API/mobile/admin impacts, and remaining risks. Documentation-only work requires content/diff review, not starting applications or modifying databases.

## Git Repository, Branch and Commit Safety

- Preserve the existing three-repository structure and duplicate tracking. Do not restructure, move, remove, untrack, or change repository ownership/tracking without explicit approval. This policy does not resolve duplicate tracking.
- Ownership for future development: React Native changes in `App/BuyNest` belong to the BuyNest root repository; backend changes belong to `Backend` (DoorKart-Backend); admin changes belong to `Admin/Frontend` (DoorKart-Frontend); root-level shared configuration and documentation belong to BuyNest root.
- Before editing, identify the owning repository, current branch, HEAD, and staged/unstaged/untracked state. Inspect existing diffs before touching modified files; preserve unrelated work and explain how new changes stay separate.
- The root also tracks backend/admin files as ordinary files. Before every proposed commit or branch operation, identify overlapping paths and inspect the root and affected nested repository. A branch operation in the root can affect nested files; a nested commit does not update root history. Do not silently synchronize duplicate tracking or stage its differences.
- Never create, switch, rename, or delete branches without specific explicit approval. Show repository, proposed branch, verified base, purpose, and the effect on existing changes before requesting approval. Never silently work on an unexpected branch.
- Never stage or commit without explicit approval, including on `main`. Implementation or documentation approval does not authorize staging or committing. Never automatically commit on `main` or amend an existing commit.
- Before requesting commit approval, show: repository; current branch; exact files/hunks to stage; proposed commit message; test results (including checks not run); existing changes excluded; and potential impact on overlapping root tracking, identifying files also tracked by root.
- Then ask exactly: "Do you approve staging and committing ONLY these changes?" Wait for explicit approval. Stage only approved paths/hunks and inspect the staged diff before committing. Never use `git add .`, `git add -A`, or `git commit -a`. If existing and new work cannot safely be separated, ask before proceeding.
- Push permission is separate from commit permission. Before requesting explicit push approval, show repository, branch, remote, target branch, commits, locally known ahead/behind status, and risks. Never force-push without specific approval and an explanation of consequences.
- Never automatically stash, reset, clean, restore/discard user changes, merge, rebase, cherry-pick, amend, force-push, or delete branches. Each such action requires specific approval; read-only status/history/diff checks do not.
- Do not fetch or change Git configuration, remotes, upstreams, credentials, branch protection, or repository settings without specific approval. Never expose credentials in remote URLs.
- Coordinate multi-repository work independently: separate branches, staging lists, change summaries, verification, commit messages, and approvals per repository. Cross-repository commits and pushes are not atomic.

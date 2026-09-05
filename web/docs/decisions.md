# Decisions

This file records the rationale behind architectural and library decisions made in the project.
Each decision: **selected**, **rejected alternative**, **rationale**, **cost**.

When a new decision is made, a heading is added here. The "which libraries did you choose and why" section of the README is written from this file.

---

## Vite

**Selected:** Vite + React + TypeScript
**Rejected:** Next.js

The entire panel is behind authentication and fully client-side; there is no need for SSR or SEO. If Next.js were chosen, almost every file would start with `"use client"`, and since the token can't be read from server components, cookies + middleware would be required — whereas the API expects an `Authorization` header and refresh rotation is handled on the client.

**Cost:** None. If SSR is needed in the future, migration will be required.

---

## TanStack Router

**Selected:** TanStack Router (file-based routing)
**Rejected:** React Router

List filters are kept in the URL; the `validateSearch` schema validates and types them with zod, and `Route.useSearch()` returns a typed object. Since `beforeLoad` runs before render, protected screens never flash for a single frame. Loaders prefetch data with `ensureQueryData`.

**Cost:** Requires generating and committing `routeTree.gen.ts`, plugin ordering constraint (`tanstackRouter()` must come before `react()`), and a longer setup compared to React Router. Moving route files later requires regenerating the produced types.

---

## Axios

**Selected:** Axios + interceptors
**Rejected:** Custom `fetch` wrapper

Single-flight refresh and `ApiError` conversion are handled in one place in the response interceptor; call sites never need to know about `baseURL`, Bearer headers, or error conversion.

**Cost:** ~13 KB bundle. The same dependency will be added again on mobile.
A second instance without interceptors is needed for `/auth/refresh` — otherwise, a 401 from the refresh itself would retrigger the interceptor and cause an infinite loop.
Also, since API error bodies are `text/plain`, Axios's `JSON.parse` attempt fails and `error.response.data` comes as a string; this behavior is handled separately in `errors.ts`.

---

## Auth state: subscribable plain module

**Selected:** `lib/auth-storage` (React-agnostic module) + `useSyncExternalStore`
**Rejected:** React Context, Zustand

The Axios interceptor is not a React module; it needs to synchronously read and write the token, so it can't read from Context. Zustand could be used (`getState()`), but then the library would be called from outside React — meaning it would be used as a plain module. When that module is handwritten, there are zero dependencies and a single source of truth for the token.

**Cost:** `useSyncExternalStore` subscription is set up manually (~30 lines).
No ready-made middleware like `persist`.

---

## Session protection: `_authenticated` pathless layout route

**Selected:** Single `beforeLoad` guard; protected screens under `_authenticated/`
**Rejected:** `<ProtectedRoute>` wrapper component, per-screen guard

The guard lives in a single file; adding a new protected screen is just putting a file in the folder. The same file also contains the panel layout (sidebar + header + `Outlet`), so layout and protection live together. The check is two-stage: `hasSession()` is synchronous and doesn't require a network request, so `/auth/me` isn't called unnecessarily if there's no token; if there is a token, its validity is checked with `meQuery()`, and on a stale token the interceptor attempts refresh.

`_authenticated` does not appear in the URL, so a prefix like `/dashboard/products` was not used — the entire panel is already behind authentication, so a prefix carries no information.

**Cost:** Since the guard contains an `await`, a `defaultPendingComponent` is required. If `queryClient.clear()` is skipped in `useLogout`, `['me']` remains in cache and the guard passes on next login without a network request.

---

## `queryOptions` factory requirement

**Selected:** Query definition is exported as a factory, hook wraps it
**Rejected:** Defining key and `queryFn` directly inside the hook

`beforeLoad` and `loader` cannot call React hooks. If the definition were only inside the hook, the key would have to be manually duplicated at the route layer; the two definitions would diverge over time and two requests would be made for the same data.

**Cost:** One extra line of boilerplate per query.

---

## Preventing the `/auth/me` call after login

**Selected:** When `useLogin()` succeeds, fill the cache with the login response's `user` using `queryClient.setQueryData(meQuery().queryKey, data.user)`
**Rejected:** Do nothing and let the `_authenticated` guard call `/auth/me` again

The login response already contains `user` (`AuthTokens.user`). When the guard calls `ensureQueryData(meQuery())`, if the cache is empty, this causes an unnecessary round-trip; if the cache is filled within `staleTime` (30s), the guard uses the data without fetching from the network.

**Cost:** `useLogin()` now depends on `useQueryClient()` (`useLogout()` already did). The data written to the cache must be typed exactly the same as what `meQuery()`'s `queryFn` returns; if `authService.me` and the login response's `user` shape diverge, the cache will hold inconsistent data.

---

## TanStack Table

**Selected:** shadcn `table` components + `@tanstack/react-table`
**Rejected:** Plain `<Table>` + manually written row loops and pagination controls

Column definitions are centralized in a single file, cell rendering is typed, and the table structure is separated from the screen component. This is a pattern I've used before, so setup and debugging time was short. The table code fits a fixed 4-file template: `data-table-features.tsx` (tableFeatures config), `columns.tsx` (columns), `sortable-header.tsx` (sortable header), `data-table.tsx` (`useTable()` + render) — for a new feature table, the same structure is repeated.

**Cost:** Since pagination and filtering are handled on the API side, the library's data processing layer is not used (`getPaginationRowModel` / `getSortedRowModel`/`filteredRowModel` are not added). Exception for sorting: `rowSortingFeature` is added, but only for state and column API (`column.getIsSorted()`, `column.getToggleSortingHandler()`); since `sortedRowModel` is never added, rows are not re-sorted client-side and sorting remains server-side. Also, the project uses the library's new API (`tableFeatures`, `useTable`); most online examples show the old API, so care is needed when looking for references.

---

## shadcn/ui — `base-vega` style

**Selected:** shadcn/ui, `base-vega` style (Base UI-based)
**Rejected:** Prebuilt UI kit (MUI, Ant Design, Mantine)

Components are copied into the repo, so there's no library dependency or theme override battle; it uses the same mental model as Tailwind. Since the sidebar block came ready-made, panel layout was quick.

**Cost:** Base UI has a different API from the more common Radix-based shadcn examples — it uses a `render` prop and `nativeButton={false}` instead of `asChild`. This difference should be considered when searching for example code. Files under `src/components/ui/` are left as generated by the CLI.

---

## Feature-based folder structure

**Selected:** `src/features/<feature>/{components,hooks}` + `src/api/services/`
**Rejected:** Type-based folder structure (all hooks in `src/hooks/`, all components in `src/components/`)

When working on a feature, only one folder needs to be opened; server-state hooks live in the same domain. `src/components/` is reserved only for app-wide components (sidebar, header, route fallbacks), and `src/hooks/` is for domain-agnostic reusable hooks.

**Cost:** In a small project, the number of folders may seem excessive.

---

## File naming: kebab-case

**Selected:** All files in kebab-case (`route-pending.tsx`, `use-products.ts`)
**Rejected:** Component files in PascalCase

The shadcn CLI generates files in kebab-case, and these files are not manually edited. To avoid having two styles side by side in the project, everything was converted to kebab-case. The exported component name remains PascalCase.

**Cost:** Three files originally written in PascalCase were renamed.

---

## Copying shared code between web and mobile

**Selected:** `types.ts`, `money.ts`, `enums.ts` as separate copies in both projects
**Rejected:** pnpm workspace + `packages/shared`

React Native is sensitive to workspace hoisting due to Metro bundler;
configuring `watchFolders` and `extraNodeModules`, aligning TypeScript paths on both sides, and the risk of different behavior in EAS build vs. local. At this scale, setup cost outweighs the benefit.

**Cost:** If a shared file changes, the other copy must be updated manually. In a real project, `packages/shared` would be the right solution.

---

## Documentation separation

**Selected:** `AGENTS.md` (always-valid rules), `INSTALLATION.md` (setup and pitfalls), `docs/decisions.md` (rationales), `.specs/` (feature plans)
**Rejected:** A single large document or a separate `ARCHITECTURE.md`

The separation is based on time: rules are valid for every task, installation is done once, decisions were made in the past, specs are for the current work. `AGENTS.md` is read every round, so including setup details would reduce its signal. Architectural rules were not moved to a separate file; a separate file would add an extra navigation step each round and the current size of `AGENTS.md` doesn't warrant splitting.

**Cost:** Each time, you must decide which file a piece of information belongs to; if the boundary becomes unclear, the two files may diverge.

---

## Seeing updates from another client in the list

**Selected:** 60-second `refetchInterval` — in `productsQuery()` and `statsQuery()` factories
**Rejected:** Only `refetchOnWindowFocus`; SSE endpoint on .NET side

Scenario: the list is open and the tab is in focus. `refetchOnWindowFocus` is already enabled by default in React Query, but it only works when returning to the tab; it never refreshes a list that's always open — so by itself, it doesn't meet this scenario. SSE would give real-time and the cleanest result, but requires writing a new endpoint on the backend; that's currently out of scope.

The polling setting, due to the § `queryOptions` factory requirement, lives inside the factory; it's not repeated in the route or component. In both factories, the interval is read from `PRODUCTS_REFETCH_INTERVAL_MS` in `lib/constants.ts`, so the table and the summary cards above it refresh in sync. `refetchIntervalInBackground` is left at the default (`false`): when the tab is in the background, the timer stops, and when returning, `refetchOnWindowFocus` takes over.

**Cost:** A focused tab makes ~60 requests per query per hour. An update is visible with up to 60 seconds delay. There's no visual indication for background refresh — the table changes silently (see `ROADMAP.md` § Open decisions).

---

## Open — not decided

**Row click:** Should the entire product row go to details, or should there be a separate action column? This should be decided before starting the detail route.
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

## Error messages: mapped from HTTP status, not the raw API body

**Selected:** `ApiError.message` generated from the HTTP status code via `getErrorMessage(status)` (`errors.ts`), with a URL-based override for `/auth/login`'s `401`
**Rejected:** Showing the API's raw response text directly to the user

The API has no structured error code — only a plain-English `text/plain` body (`api/API.md` § 1.2), so the status code is the only machine-readable signal available. Showing that raw text would put untranslated English in front of end users. Login's `401` needed a special case: `/auth/refresh` runs on a separate, interceptor-free Axios instance, so the only realistic path that reaches the generic `401` branch is `/auth/login` itself (wrong credentials) — the generic "session expired" copy would be nonsensical there, since there is no session yet.

**Cost:** Status-only messages lose some specificity — every `400` shares one message rather than distinguishing "price is negative" from "invalid category," for example. `409` is worded specifically for SKU conflicts because that's the only condition the API documents for that status; if a second `409` case is ever added, this will need revisiting.

---

## Product form: `useForm` lifted to the page, `FormProvider`/`useFormContext` in between

**Selected:** `product-create-form.tsx`/`product-edit-form.tsx` call `useForm()` and wrap `<ProductForm>` in `<FormProvider>`; `ProductForm` reads form state via `useFormContext()`. Server errors are applied with `setError()` inside the mutation's `onError` callback (`applyApiErrorToForm` in `product-form.schema.ts`): a `409` goes to the `sku` field, anything else goes to RHF's `root` error.
**Rejected:** `useForm` local to `ProductForm`, with the mutation's error passed down as a prop and turned into a field/banner message inside `ProductForm` (tried first with a `useEffect` syncing the prop into `setError`, then with a render-derived value — both were awkward substitutes for the page just calling `setError` directly)

The page component already owns the mutation lifecycle (`onSuccess`/`onError`), so calling `setError` directly in `onError` is the natural, imperative place for it — a real event handler, not state synced from a prop. It also unifies client-side zod errors and server-side errors into the same RHF error store (`errors.sku`), so the `sku` field needs no special-casing versus any other field. `productFormSchema`/`ProductFormValues`/`buildProductPayload`/`applyApiErrorToForm` moved to a sibling `product-form.schema.ts` file — `react-refresh/only-export-components` forbids exporting non-component values from a component file, and no `schemas/` folder convention exists elsewhere in the project to justify a bigger restructure.

**Cost:** Two files (`product-create-form.tsx`, `product-edit-form.tsx`) each now call `useForm()` and must remember to call `applyApiErrorToForm` in `onError` — if a future product-form consumer forgets it, server errors silently disappear instead of showing anywhere.

---

## Auth state: plain module with an in-memory cache

**Selected:** `lib/auth-storage` (React-agnostic module, in-memory cache synced to `localStorage`)
**Rejected:** React Context, Zustand

The Axios interceptor and the `_authenticated` guard are not React components; they need to read and write the token synchronously and imperatively (`getAccessToken()`, `hasSession()`), so they can't read from Context. No screen re-renders when the token changes — login and logout both navigate instead — so no subscription mechanism is needed either: not `useSyncExternalStore`, not Zustand's `useStore` hook. A plain module-level cache read directly by callers is sufficient and keeps a single source of truth for the token with zero dependencies.

**Cost:** No ready-made middleware like `persist`. If a future screen needs to reactively re-render on token change, a subscription layer would need to be added on top of this module.

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

## Toast notifications: shadcn's Base UI `toast` component

**Selected:** shadcn's `toast` component (`@/components/ui/toast`, built on `@base-ui/react/toast`)
**Rejected:** `sonner`

The project's shadcn setup is Base UI-based, and shadcn's own guidance is to use its native `toast` primitive for Base UI projects — `sonner` is meant for Radix and React Aria projects. Using the Base UI-native component keeps toasts visually and structurally consistent with the rest of the design system (same `cn`/`Button` conventions) instead of pulling in a separately styled, independent library.

**Cost:** The API is `toast.add({ title, type })` rather than `sonner`'s `toast.success(msg)` / `toast.error(msg)` shorthands, so call sites are slightly more verbose.

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

## Seeing updates from another client in the list

**Selected:** 60-second `refetchInterval` — in `productsQuery()` and `statsQuery()` factories
**Rejected:** Only `refetchOnWindowFocus`; SSE endpoint on .NET side

Scenario: the list is open and the tab is in focus. `refetchOnWindowFocus` is already enabled by default in React Query, but it only works when returning to the tab; it never refreshes a list that's always open — so by itself, it doesn't meet this scenario. SSE would give real-time and the cleanest result, but requires writing a new endpoint on the backend; that's currently out of scope.

The polling setting, due to the § `queryOptions` factory requirement, lives inside the factory; it's not repeated in the route or component. In both factories, the interval is read from `PRODUCTS_REFETCH_INTERVAL_MS` in `lib/constants.ts`, so the table and the summary cards above it refresh in sync. `refetchIntervalInBackground` is left at the default (`false`): when the tab is in the background, the timer stops, and when returning, `refetchOnWindowFocus` takes over.

**Cost:** A focused tab makes ~60 requests per query per hour. An update is visible with up to 60 seconds delay. There's no visual indication for background refresh — the table changes silently (see `ROADMAP.md` § Open decisions).

---

## Price/cost input: manual keyboard + paste masking

**Selected:** `MoneyInput` (`features/products/components/money-input.tsx`) — a fully controlled input using digit arithmetic in `onKeyDown` (shifting kuruş digits from right to left) and full-value normalization through the existing `parseKurus` in `onPaste`, without native `type="number"` or a library.
**Rejected:** A third-party input-mask library (e.g. `react-number-format`); the native `onChange` approach of “extract digits from the typed text” (it conflicts with `parseKurus` semantics for paste: pasting plain `"1234"` produces `12,34` with digit shifting, while `parseKurus` produces `1.234,00`).

Because the user experience is highly specific and relies on the existing `parseKurus`/`formatKurusInput` contract, a small, dependency-free component of roughly 60 lines was preferred over integrating a ready-made library with different formatting/parsing assumptions.

**Cost:** Edge cases—caret position, paste normalization, and select-all on focus—must be manually tested and maintained; it does not benefit from the broad usage and test coverage provided by an established library.

---

## Pagination as a real table feature

**Selected:** Register `rowPaginationFeature` in `data-table-features.tsx` (no `paginatedRowModel`, same reasoning as `rowSortingFeature`), drive it in `manualPagination` mode from `data-table.tsx` via `state: { pagination }` + `onPaginationChange` + `rowCount`, and move rendering of `DataTablePagination` from the route into `DataTable` (passing it the `table` instance) so it reads `page`/`pageCount`/`getCanPreviousPage`/`getCanNextPage` from the table instead of recomputing `Math.ceil(total / pageSize)` independently.
**Rejected:** Keep pagination fully external to the table, as it was — a standalone component computing its own page count from raw `page`/`total`/`pageSize` props.

This mirrors how sorting is already integrated (`manualSorting: true`, `rowSortingFeature` for state/API without a client row model) and follows `@tanstack/table-core`'s documented `manualPagination`/`rowCount` pattern for server-owned pagination. The table becomes the single source of truth for page state instead of two places (the table's internal state and `DataTablePagination`'s own math) silently agreeing by coincidence.

**Cost:** The route no longer renders `<DataTablePagination>` directly; `DataTable` now owns that composition. Pagination navigation is still `<Link search={...}>`-driven (never a plain `onClick`/`table.nextPage()` call), so hover-preload and normal anchor semantics are unchanged.

---

## Open — not decided

**Row click:** Should the entire product row go to details, or should there be a separate action column? This should be decided before starting the detail route.

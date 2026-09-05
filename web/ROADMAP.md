# Roadmap

Planned progress for the `web/` project. See `INSTALLATION.md` for setup details, `AGENTS.md` for rules, `docs/decisions.md` for decision rationales, and the `.specs/` folder for feature-based planning.

---

## Phase 0 — Setup ✅ Completed

Details: `INSTALLATION.md`.

- [x] Vite + React + TypeScript
- [x] Tailwind v4
- [x] Prettier
- [x] shadcn/ui (`base-vega`)
- [x] TanStack Router
- [x] TanStack Query
- [x] `.env.example` + `VITE_API_URL`
- [x] Axios
- [x] shadcn sidebar block
- [x] TanStack Table
- [x] `route-pending`, `route-error-fallback`, `route-not-found` → router defaults
- [x] Component file names converted to kebab-case

## Phase 1 — Auth & HTTP layer 🔄 In progress

**HTTP infrastructure**

- [x] `src/api/axios-client.ts` — single Axios instance (`baseURL: VITE_API_URL`), explicitly throw error if value is missing.
- [x] `src/api/errors.ts` — `ApiError` (`message`, `status`). Error body is obtained as a **string** from `error.response.data`; network error has `status: 0`.
- [x] `src/api/interceptors.ts` — request: Bearer header; response: `ApiError` normalization + single-flight refresh.
- [x] Separate Axios instance without interceptor for refresh calls.

**Session**

- [x] `lib/auth-storage` — read/write/clear token + `hasSession()`.
- [x] `src/api/services/auth.service.ts`
- [x] `src/features/auth/hooks/use-auth.ts` — `meQuery()`, `useLogin()`, `useLogout()`
- [x] `_authenticated.tsx` guard + panel layout (sidebar + header + `Outlet`)
- [x] Login screen (`POST /auth/login`)
- [x] Validation of `useLogout()` sequence: `POST /auth/logout` → clear `auth-storage` → `queryClient.clear()` → `/login`. If `clear()` is skipped, `['me']` remains in cache and guard passes next login without network request.
- [ ] Manual execution of `INSTALLATION.md` § 8 authentication checklist (especially single-flight refresh).

## Phase 2 — Product Catalog 🔄 In progress

**Migration tasks** (must be completed before adding the detail route)

- [x] Move `productsQuery` factory from route file to `src/features/products/hooks/use-products.ts` — detail route and mutations will use the same factory.
- [x] Move `columns` definition to `src/features/products/components/columns.tsx`.
- [x] Move table skeleton under `src/features/products/components/`; row count aligns with `pageSize`.
- [ ] Remove local `ErrorComponent` from route files; use router's `defaultErrorComponent`. `index.tsx` and `$id.tsx` still define local `ErrorComponent`/`pendingComponent` — violates AGENTS.md § Shared route components rule, not cleaned up yet.
- [x] `_authenticated/products.tsx` → `_authenticated/products/index.tsx` + `$id.tsx`. Moving later requires regenerating `routeTree.gen.ts` and link types.

**List**

- [x] Extend `validateSearch` schema: `q`, `categoryId`, `brandId`, `status`, `sort`, `dir`, `page`.
- [x] Pagination links converted to `search={(prev) => ({ ...prev, page })}` format — object form clears filters.
- [x] Search box (debounce) + category/brand filters; `page` resets to 1 on filter change.
- [x] Sorting on column headers (`name` | `price` | `stock` | `updatedAt`).
- [x] Column widths fixed with `meta.className` when needed (table is not `table-fixed` — see `AGENTS.md` § Tables).
- [x] Three states: loading (skeleton `pendingComponent`), error (default fallback), empty (distinguishing filtered/unfiltered).
- [x] Stock badge: `stock === 0` and `stock <= minStock` shown separately.

**Details and updates**

- [x] `productQuery(id)` + `useProduct(id)`; `$id.tsx` loader uses the same factory.
- [x] Edit form (react-hook-form + zod); `costPrice`, `supplierId`, `description` taken from detail and sent back to `PUT /products/{id}`.
- [x] `useUpdateProduct()` — `onSuccess` invalidates `['products']`.
- [ ] Stock update (`PATCH /products/{id}/stock`). Service method (`products.service.ts`) written but wrapping hook (`useUpdateProductStock()`) not yet implemented.

**Creation and deletion** (`AGENTS.md` scoped, replaces the below "Out of scope" note)

- [x] Product creation screen (`product-create-form.tsx`, shared between creation/editing `product-form.tsx`).
- [x] Product deletion with confirmation dialog (`delete-product-dialog.tsx`) — `useDeleteProduct()` invalidates `['products']` afterwards.

## Phase 3 — Lookup data 🔄 In progress

- [x] `categories.service.ts`, `brands.service.ts`
- [x] `categoriesQuery()`, `brandsQuery()` + `useCategories()`, `useBrands()` — used in filter selects.
- [ ] Because they are fixed lists, high `staleTime`. Not yet set in any lookup hook.

Supplier selection was implemented in create/edit form, so `suppliers.service.ts` + `suppliersQuery()`/`useSuppliers()` were written. Separate supplier listing screen still does not exist — only used for the select inside the form.

## Phase 4 — Statistics ✅ Completed

- [x] `stats.service.ts` + `statsQuery()` + `useStats()` — summary from `GET /products/stats` (total, out-of-stock, low stock), shown above product list as `StockSummaryCards`.

## Phase 5 — Delivery

- [ ] Complete `docs/decisions.md` (Phases 0-4 decisions).
- [ ] `README.md` — run steps, assumptions, library rationales, unfinished items.
- [x] Bonus scenario implemented or marked as out of scope in README — 60 sec `refetchInterval` in `productsQuery()` and `statsQuery()` (see `docs/decisions.md`).
- [ ] Check `.env.example` and `.gitignore`; repo works cleanly on fresh clone.

---

## Open decisions

- Visual representation of background refetch and stale-data states is not defined yet (`AGENTS.md` § Loading / Error / Empty covers only three basic states). Because 60 sec polling is added, this is now a visible gap in the list as well: refresh happens silently.

## Out of scope (for now)

- SSR / SEO — project is fully client-side.
- Separate supplier listing screen — `GET /suppliers` is only used for the `supplierId` select inside the form.
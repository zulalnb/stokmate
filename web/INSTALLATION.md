# Web Project Setup

How the `web/` project was set up from scratch (from an empty folder). Each section contains setup commands, created/changed files, and real pitfalls actually encountered in this project.

This file covers **setup and tool configuration**. Architectural rules, layer responsibilities, query key conventions, and UI rules are in `AGENTS.md` and are not repeated here.

---

## 1. Vite + React + TypeScript

**Setup:**

```bash
pnpm create vite@latest web -- --template react-ts
cd web
pnpm install
```

**Created files:** `vite.config.ts`, `tsconfig.json` (solution-style, with `references` pointing to `tsconfig.app.json` + `tsconfig.node.json`), `src/main.tsx`, `index.html`.

**Known pitfall:** Adding `paths`/`baseUrl` to `tsconfig.json` does not affect the actual build due to project references — it must be added to `tsconfig.app.json`, which actually type-checks `src/`. Otherwise, `npx tsc -b` gives a "Cannot find module '@/...'" error; also, Vite/Rollup's own `resolve.alias` must be separately defined in `vite.config.ts` (one does not cover the other).

```jsonc
// tsconfig.app.json — inside compilerOptions
"paths": { "@/*": ["./src/*"] }
```

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

**Verification:** `npx tsc -b` should run without errors. (`npx tsc --noEmit` is **not sufficient alone** — since the root `tsconfig.json` is solution-style, it checks 0 files and gives a false-green result.)

---

## 2. Tailwind v4

**Setup:**

```bash
pnpm add tailwindcss @tailwindcss/vite
```

Add the plugin to `vite.config.ts`, and put `@import "tailwindcss"` in `src/index.css` (shadcn init may do this step automatically, see section 4).

**Verification:** Start `pnpm run dev` and visually check that a Tailwind class (e.g. `p-6`) actually applies its style.

---

## 3. Prettier

**Setup:**

```bash
pnpm add -D prettier prettier-plugin-tailwindcss
```

**`.prettierrc.json`:**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**`.prettierignore`:**

```
dist
dist-ssr
pnpm-lock.yaml
src/routeTree.gen.ts
```

Since `routeTree.gen.ts` is auto-generated, it is excluded both here and in `eslint.config.js`'s `globalIgnores` (see section 5).

**`package.json` scripts:**

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

**Verification:** Run `npx prettier --check .`; only truly unformatted files should be listed, and `routeTree.gen.ts` should not appear in the list.

---

## 4. shadcn/ui

**Prerequisite:** Tailwind v4 must be installed (see section 2).

**Setup:**

```bash
pnpm dlx shadcn@latest init
```

Settings chosen for this project (`components.json`):

```json
{
  "style": "base-vega",
  "tailwind": { "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**To add a component:**

```bash
pnpm dlx shadcn@latest add <component-adı>
```

**Known pitfall:** The shadcn CLI looks for the `@/` alias in the root `tsconfig.json`'s `paths` (not in the `tsconfig.app.json` in the project reference chain). If `paths` is not defined in the root `tsconfig.json`, the CLI cannot resolve the alias and creates a literal `./@/components/ui/...` folder instead of the actual `src/components/ui/`. Therefore, the `@/*` path must be defined in **both** the root `tsconfig.json` **and** `tsconfig.app.json` (see section 1) — they have different consumers: shadcn CLI and the actual build.

**Verification:** Add a component with `pnpm dlx shadcn@latest add skeleton` and check that the file is actually created at `src/components/ui/skeleton.tsx` (there should not be a `./@/` folder in the root directory).

---

## 5. TanStack Router

**Setup:**

```bash
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-plugin @tanstack/react-router-devtools
```

**`vite.config.ts`:**

```ts
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
})
```

**Known pitfall (critical order):** `tanstackRouter(...)` must come **before** `react()` in the plugins list; otherwise, `autoCodeSplitting` will error.

**File structure:**

```
src/routes/
├── __root.tsx              createRootRouteWithContext
├── login.tsx               unprotected
├── _authenticated.tsx      pathless layout route — guard + panel layout
└── _authenticated/
    ├── index.tsx
    └── products/
```

Router defaults are set once in `src/router.ts`:

```ts
createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: RoutePending,
  defaultErrorComponent: RouteErrorFallback,
  defaultNotFoundComponent: RouteNotFound,
})
```

These three components are under `src/components/` (`route-pending.tsx`, `route-error-fallback.tsx`, `route-not-found.tsx`). They are not redefined in route files — exception: a screen-specific skeleton requiring a `pendingComponent` (see AGENTS.md § Common route components).

- Files prefixed with `_` create a **pathless layout route**: It appears as `/products` in the URL, not as `/_authenticated/products`. This structure ensures the guard is in a single place.
- `src/routeTree.gen.ts` — auto-generated by the plugin on every `dev`/`build`. **Do not edit by hand, do not add to `.gitignore`, do commit it** (types depend on it).
- `src/router.ts` — the `createRouter({ routeTree, defaultPreload: 'intent', ... })` instance; `Register` module augmentation is done here.

Guard contents and rules: `AGENTS.md` § Authentication.

**Known pitfall (eslint):** The `only-export-components` rule of `eslint-plugin-react-refresh` complains that each route file contains both a `Route` export and a local component (like `component: RootLayout`). Exporting the component suppresses the rule but breaks `autoCodeSplitting` (since the component is no longer local, it won't be split into a separate chunk). The correct solution: in `eslint.config.js`, add a separate override for `src/routes/**/*.tsx` to disable this rule — **not** exporting the component or using a per-file `eslint-disable` comment.

**Known pitfall (guard + context):** The `beforeLoad` in `_authenticated.tsx` calls `ensureQueryData` via `context.queryClient`. Therefore, `__root.tsx` must be defined with `createRootRouteWithContext<{ queryClient: QueryClient }>()` and `context: { queryClient }` must be passed to `createRouter` (see section 6). Otherwise, `context.queryClient` exists in types but is `undefined` at runtime.

**Known pitfall (redirect):** Do not call `navigate()` inside `beforeLoad`; redirection is done with `throw redirect({ to: '/login' })`. If you `return` the result of `redirect`, the route will continue to load — `throw` is required.

**Known pitfall (pending screen):** Since the guard contains `await`, protected screens will stay pending on first load until `beforeLoad` resolves. If you do not provide a `defaultPendingComponent` to `createRouter`, a blank screen will be shown during this time.

**Verification:**

```bash
npx tsc -b
pnpm run build
```

In the output of `pnpm run build`, there should be a separate chunk for each route under `dist/assets/` (e.g. `routes-*.js`) — proof that code splitting works.

Then manually:

1. Go to `/products` while logged in — it should open.
2. Clear `lib/auth-storage` and refresh the page — should redirect to `/login`.
3. Try `/_authenticated/products` in the URL — should give 404 (pathless route does not appear in the URL).

---

## 6. TanStack Query

**Setup:**

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

**`src/query-client.ts`** — a single `QueryClient` instance:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
})
```

**`main.tsx`** — wrap with `QueryClientProvider`:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/query-client'

;<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

**Router integration:** The `defaultPreloadStaleTime: 0` setting in `router.ts` was set for this reason — to prevent the router's own preload cache from clashing with Query's cache. Add `context: { queryClient }` to the router (`createRootRouteWithContext<{ queryClient: QueryClient }>()`), so both loaders and the `beforeLoad` guard in `_authenticated.tsx` can call `context.queryClient.ensureQueryData(...)`.

**Known pitfall (architecture):** `beforeLoad` and `loader` cannot call React hooks. If the query key and `queryFn` are only defined inside the hook, you have to manually duplicate them in the route layer, and the two definitions will diverge over time — resulting in double requests for the same data. Therefore, export the query definition as a `queryOptions()` factory; both the route and the hook use the same factory. Rule and example: `AGENTS.md` § Architecture.

**Verification:**

```bash
npx tsc -b
pnpm run build
```

Check that devtools only appear in dev mode and are not included in the production build.

---

## 7. Environment variables

**`.env.example`** (committed to the repo):

```
VITE_API_URL=http://localhost:5080
```

**`.env`** (in `.gitignore`) is created by the developer by copying:

```bash
cp .env.example .env
```

**Known pitfall:** If `.env` does not exist, `import.meta.env.VITE_API_URL` silently becomes `undefined` and Axios requests go to the page's own origin — you get a 404 but the error message does not indicate the cause. Explicitly throw an error in `axios-client.ts` if the value is missing.

---

## 8. Axios

**Setup:**

```bash
pnpm add axios
```

**File structure:**

```
src/api/
├── axios-client.ts     single Axios instance
├── interceptors.ts     request/response interceptors
├── errors.ts           ApiError model
└── services/           endpoint calls (see AGENTS.md § API Layer)
```

`src/api/axios-client.ts`:

```ts
axios.create({ baseURL: import.meta.env.VITE_API_URL })
```

**Known pitfall (critical):** The `/auth/refresh` call cannot be made with the instance that has interceptors attached. If the refresh request itself returns 401, the response interceptor is triggered again and the refresh enters an infinite loop. Use a **second instance** created with `axios.create()` without interceptors for refresh. This is the only exception to the "single instance" rule.

**Known pitfall:** Axios's default `transformResponse` first tries to `JSON.parse` the body, and if it fails, returns the raw string. Since API error bodies are `text/plain`, `error.response.data` is a **string** — there is **no** field like `data.message`.

**Known pitfall:** If a retried request is not marked (`config._retry`), a request that returns 401 again after refresh will enter a loop. Each request is retried at most once.

Layer responsibilities, single-flight refresh behavior, and the `ApiError` contract: `AGENTS.md` § API Layer.

**Verification:**

```bash
npx tsc -b
pnpm run build
```

Then manually:

1. When logging in with incorrect credentials, the API's `text/plain` error message is displayed to the user as is.
2. On HTTP errors, the `status` information is preserved via `ApiError.status`.
3. When the API is down (`dotnet run` stopped), network errors are distinguished from API errors (`status: 0` and fallback message).
4. When the access token expires (by waiting 15 minutes or manually corrupting the access token in `lib/auth-storage`), refresh occurs automatically.
5. **Single-flight:** After corrupting the access token, open a screen that triggers multiple queries at once (e.g. list + categories + brands). In the Network tab, verify that the `/auth/refresh` request appears **exactly once**.
6. In the same scenario, pending requests are retried only once each (each endpoint in the Network tab appears at most twice: initial 401 + one retry).
7. When the refresh token is also corrupted, the session is cleared and redirected to the login screen.
8. After logging out, going to a protected address redirects to `/login` — if `queryClient.clear()` is not called in `useLogout`, the `['me']` cache remains and the guard passes without a network request.

---

## 9. shadcn sidebar block

**Setup:**

```bash
pnpm dlx shadcn@latest add sidebar
```

The generated components go under `src/components/`: `app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`, `site-header.tsx`.

Panel layout is set up inside `_authenticated.tsx`; `--sidebar-width` and `--header-height` are passed as inline style to `SidebarProvider`.

Navigation items are defined in `lib/constants.ts` and read by `nav-main.tsx`.

**Known pitfall:** The shadcn CLI generates kebab-case file names. At the start of the project, component files were PascalCase; to avoid mixing styles, all were converted to kebab-case (`RouteErrorFallback.tsx` → `route-error-fallback.tsx`). Rule: AGENTS.md § Code Rules.

**Verification:** Open the panel with `pnpm run dev`; when the sidebar is collapsed and expanded, the content area should not shift, and `SiteHeader` should remain fixed.

---

## 10. TanStack Table

**Setup:**

```bash
pnpm add @tanstack/react-table
pnpm dlx shadcn@latest add table
```

**Known pitfall (API version — critical):** The new API of the library is used in the project: feature set is created with `tableFeatures({})`, columns are defined with `createColumnHelper<typeof features, T>()`, and rendered with `useTable` and `<FlexRender />`.

Most examples on the internet and the shadcn data-table docs show the old API (`useReactTable`, `flexRender`, `getCoreRowModel`). Mixing the two leads to confusing type errors. If unsure, check the types in `node_modules/@tanstack/react-table`.

**Known pitfall (server-side pagination):** The shadcn data-table docs assume client-side pagination. In this project, pagination and sorting are on the API side; do **not** add `getPaginationRowModel()` and `getSortedRowModel()`, and `pageCount` is calculated from `total` (see AGENTS.md § Tables).

**Known pitfall (column width):** With the default `table-auto` layout, column widths are measured by content; as you switch pages, long product names shift all columns. The table is set up with `table-fixed`, and widths are applied to `<th>` from the column definition's `meta.className` (`table-fixed` reads widths only from the first row).

**Verification:** Switch between two different pages; column widths should remain fixed. In the Network tab, there should be only one `GET /products` request per page change.

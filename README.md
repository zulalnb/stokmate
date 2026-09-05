# StokMate

An internal inventory management tool for a small retail chain: head office employees manage the product catalog through a **web panel** (list, search, filter, and update products), while store employees view the same products and update stock levels through a **mobile application**. Both clients use the same .NET API.

## Project structure

```text
api/      Provided .NET 8 Web API — `GET /products/{id}` was added; see API.md
web/      React + TypeScript head office panel
mobile/   React Native (Expo) field application
```

Each subproject contains its own rules and decision documents — they are not repeated here:

- `api/README.md`, `api/API.md` — setup instructions and API reference
- `web/AGENTS.md`, `web/docs/DECISIONS.md`, `web/ROADMAP.md`
- `mobile/AGENTS.md`, `mobile/docs/DECISIONS.md`

## How to run

### API

```bash
cd api
dotnet run --project src/StokMate.Api
```

- Address: `http://localhost:5080`, Swagger: `http://localhost:5080/swagger`
- Data is stored in memory; every `dotnet run` starts with the seed data (80 products, 8 categories, 12 brands, 6 suppliers).
- Test user: `test@ornek.com` / `Test1234!`

See `api/README.md` for details.

### Web

```bash
cd web
cp .env.example .env   # VITE_API_URL=http://localhost:5080
pnpm install
pnpm run dev
```

Validation: `npx tsc -b` (note: **not** `npx tsc --noEmit` — because the root `tsconfig.json` is solution-style, the latter checks 0 files and can produce a falsely green result).

### Mobile

```bash
cd mobile
pnpm install
```

`mobile/.env` is committed to the repository; `EXPO_PUBLIC_API_URL` must be adjusted depending on the target:

| Target | Address |
| --- | --- |
| iOS simulator / web | `http://localhost:5080` |
| Android emulator | `http://10.0.2.2:5080` |
| Physical device | `http://<machine-IP>:5080` (same Wi-Fi network) |

Then:

```bash
pnpm run ios       # or
pnpm run android   # or
pnpm start
```

**APK delivery:** The repository does not contain an EAS/build pipeline. The native Android project has already been generated with `expo prebuild` (`mobile/android/`). For an unsigned release APK:

```bash
cd mobile/android
./gradlew assembleRelease
```

Alternatively, `eas build -p android --profile preview` can be used with an Expo account. The generated APK is not included in this repository and is shared separately.

## Covered features

**Web**

- Login, token storage, automatic session refresh on 401 / redirect to login when the session expires
- Search + category/brand/status filters, sortable and paginated product list
- Product detail screen
- Full edit form — name / price / stock / status (+ API-required `costPrice`, `supplierId`, `description`)
- Product creation and deletion with a confirmation dialog
- Loading / error / empty states
- Stock summary cards (total / out of stock / low stock)

**Mobile**

- Login
- Search + category/brand/status filters, infinite-scroll paginated product list
- Product detail screen
- Stock updates — the primary task for field staff
- Logout

**Bonus (implemented):** The web product list and stock summary automatically refresh every 60 seconds (`refetchInterval`). A stock update made by another client (e.g. the mobile application) therefore appears in the list within at most one minute. Refreshing pauses while the browser tab is in the background. The rationale and rejected alternatives (`refetchOnWindowFocus` alone, SSE) are documented in `web/docs/DECISIONS.md`.

## Decisions

The full rationale is documented in `web/docs/DECISIONS.md` and `mobile/docs/DECISIONS.md` (selected / rejected / rationale / trade-off); only a summary is provided here.

**Web**

- **Vite + React, not Next.js** — the panel is entirely client-side and behind authentication; there is no SSR/SEO requirement. With Next.js, nearly every file would need to start with `"use client"`, and because the token cannot be read from server components, cookies + middleware would also be required.
- **TanStack Router, not React Router** — list filters are stored in the URL; a zod `validateSearch` schema validates and types them, while `beforeLoad` runs before rendering, so a protected screen does not appear even for a single frame.
- **Axios + interceptors, not hand-written fetch** — single-flight refresh and `ApiError` conversion are centralized in the response interceptor; the service layer knows nothing about `baseURL`, Bearer headers, or error conversion.
- **Auth state in a plain module (`useSyncExternalStore`), not Context/Zustand** — the Axios interceptor is not a React component and needs to read and write the token synchronously; Context alone does not provide this, while Zustand would add a dependency for functionality that is not otherwise needed.
- **`queryOptions` factories are mandatory** — route `beforeLoad`/`loader` functions cannot call React hooks. If query keys and `queryFn`s were defined only inside hooks, the route layer would need to duplicate them manually; the two definitions could drift over time and cause duplicate requests for the same data.
- **TanStack Table, not a hand-written table** — pagination and sorting are performed server-side, so the library's data-processing layer (`getPaginationRowModel`, etc.) is not used; it is used only for typed column definitions and rendering.
- **shadcn/ui (`base-vega`), not a ready-made UI kit (MUI/Ant/Mantine)** — components are copied into the repository, avoiding a component-library dependency and theme override battles; it also uses the same mental model as Tailwind.

**Mobile**

- The same HTTP/state architecture as the web client was intentionally carried over: Axios + interceptors + layered `client → services → hooks` separation, with a plain `useSyncExternalStore` module for tokens — for the same reason: the interceptor does not know about React and requires synchronous token access.
- **Route guard: `Stack.Protected`** — Expo Router's declarative guard API; it does not require a separate `(app)/` route group or a wrapper `<ProtectedRoute>` component. `guard={boolean}` handles both visibility and redirection.
- **Token refresh: proactive + reactive hybrid** — the API returns an opaque access token together with an `expiresAt` field (no JWT decoding). With only reactive refresh, the first request after each 15-minute window would unnecessarily receive a 401 before being retried.
- **`expo-secure-store`, native only** — development is mobile-first; session persistence in the web build (`expo start --web`) is intentionally not supported because the web shim does not persist the session.

**Shared**

- No code is shared between web and mobile — `types.ts`, `money.ts`, and `enums.ts` are maintained as separate copies in both projects. React Native/Metro's sensitivity to pnpm workspace hoisting and the cost of aligning `watchFolders`/paths were considered to outweigh the benefits of a `packages/shared` setup at this scale.
- The bonus scenario (showing an update from another client while the list is open) uses `refetchInterval` polling; `refetchOnWindowFocus` alone and SSE were rejected. The rationale is documented in the "Covered features" section above.

## Assumptions

- The API stores data in memory; data is reset whenever the API restarts — this is considered expected behavior during the demo/test.
- `PATCH /products/{id}/stock` is defined in the web service layer and used by mobile; on the web, stock changes are not implemented as a separate quick-update action but through the full product edit form (`PUT /products/{id}`). This satisfies the brief's requirement to update "name/price/stock/status."
- The bonus scenario uses polling (`refetchInterval`); SSE was rejected because it would require adding a new endpoint to the backend.
- The mobile web experience (`expo start --web`) is not a priority: `expo-secure-store`'s web shim does not persist the session in the browser. This is an intentional and documented limitation.

## Notes

- Claude Code was used during development — the brief explicitly allows AI-assisted development.
- Known open points: the 60-second background refresh on the web does not currently have a visual indication; the table updates silently. The planned high `staleTime` for static lists such as categories/brands has not yet been implemented (see **Open decisions** in `web/ROADMAP.md`).
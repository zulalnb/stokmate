# Web Projesi Kurulumu

`web/` projesinin sıfırdan (boş klasörden) nasıl kurulduğu: Vite + React +
TypeScript scaffold, Tailwind v4, shadcn/ui, TanStack Router ve TanStack
Query. Her bölümde kurulum komutları, oluşan/değişen dosyalar ve bu
projede gerçekten karşılaşılmış bilinen tuzaklar var.

---

## 1. Vite + React + TypeScript

**Kurulum:**

```bash
pnpm create vite@latest web -- --template react-ts
cd web
pnpm install
```

**Oluşan dosyalar:** `vite.config.ts`, `tsconfig.json` (solution-style,
`references` ile `tsconfig.app.json` + `tsconfig.node.json`'a işaret eder),
`src/main.tsx`, `index.html`.

**Bilinen tuzak:** `tsconfig.json`'a eklenen `paths`/`baseUrl` proje
referansları yüzünden gerçek derlemeye etki etmez — `src/`'i asıl
type-check eden `tsconfig.app.json`'a **ayrıca** eklenmesi gerekir. Aksi
halde `npx tsc -b` "Cannot find module '@/...'" hatası verir; ayrıca
Vite/Rolldown'ın kendi `resolve.alias`'ı da `vite.config.ts`'te ayrı
tanımlanmalıdır (biri diğerini kapsamaz).

```ts
// tsconfig.app.json — compilerOptions içine
"paths": { "@/*": ["./src/*"] }
```

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // ...
})
```

**Doğrulama:** `npx tsc -b` hatasız çalışmalı. (`npx tsc --noEmit` **tek
başına yeterli değildir** — kök `tsconfig.json` solution-style olduğu için
0 dosya kontrol eder ve sahte-yeşil sonuç verir.)

---

## 2. Tailwind v4

**Kurulum:**

```bash
pnpm add tailwindcss @tailwindcss/vite
```

`vite.config.ts`'e plugin eklenir, `src/index.css`'e `@import "tailwindcss"`
konur (shadcn init bu adımı otomatik de yapabilir, bkz. bölüm 3).

**Doğrulama:** `pnpm run dev` başlatıp bir Tailwind class'ının (örn.
`p-6`) gerçekten stil uyguladığı gözle kontrol edilir.

---

## 3. Prettier

**Kurulum:**

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

`routeTree.gen.ts` otomatik üretildiği için hem burada hem
`eslint.config.js`'in `globalIgnores`'ında hariç tutulur (bkz. bölüm 4).

**`package.json` script'leri:**

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

**Doğrulama:** `npx prettier --check .` çalıştırılır; yalnızca gerçekten
formatlanmamış dosyalar listelenmeli, `routeTree.gen.ts` listede
görünmemeli.

---

## 4. shadcn/ui

**Ön koşul:** Tailwind v4 kurulu olmalı (bkz. bölüm 2).

**Kurulum:**

```bash
pnpm dlx shadcn@latest init
```

Bu projede seçilen ayarlar (`components.json`):

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

**Component eklemek için:**

```bash
pnpm dlx shadcn@latest add <component-adı>
```

**Bilinen tuzak:** shadcn CLI, `@/` alias'ını bulmak için kök
`tsconfig.json`'daki `paths`'e bakar (proje referansları zincirindeki
`tsconfig.app.json`'a değil). Kök `tsconfig.json`'da `paths` tanımlı
değilse, CLI alias'ı çözemez ve gerçek `src/components/ui/` yerine
literal bir `./@/components/ui/...` klasörü oluşturur. Bu yüzden `@/*`
path'i **hem** kök `tsconfig.json`'da **hem** `tsconfig.app.json`'da aynı
anda tanımlı tutulmalı (bkz. bölüm 1) — biri diğerinin yerini tutmaz,
ikisinin farklı tüketicisi var (shadcn CLI vs. gerçek derleme).

**Doğrulama:** `pnpm dlx shadcn@latest add skeleton` gibi bir component
eklenip dosyanın gerçekten `src/components/ui/skeleton.tsx`'te oluştuğu
kontrol edilir (kök dizinde `./@/` diye bir klasör oluşmamalı).

---

## 5. TanStack Router

**Kurulum:**

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

**Bilinen tuzak (kritik sıralama):** `tanstackRouter(...)` plugin listesinde
**`react()`'ten önce** gelmelidir; aksi halde `autoCodeSplitting` hata
verir.

**Dosya yapısı:**

- `src/routes/__root.tsx` — kök route (`createRootRoute`), layout +
  `errorComponent` + `notFoundComponent`.
- `src/routes/*.tsx` — dosya tabanlı route'lar (`createFileRoute`).
- `src/routeTree.gen.ts` — plugin tarafından her `dev`/`build`'de otomatik
  üretilir. **Elle düzenlenmez, `.gitignore`'a eklenmez, commit edilir**
  (tipler buna dayanıyor).
- `src/router.ts` — `createRouter({ routeTree, defaultPreload: 'intent', ... })`
  router instance'ı; `Register` modül augmentation'ı burada yapılır.

**Bilinen tuzak (eslint):** `eslint-plugin-react-refresh`'in
`only-export-components` kuralı, her route dosyasının hem `Route` export'unu
hem de local bir component'i (`component: RootLayout` gibi) barındırmasından
rahatsız olur. Component'i export etmek kuralı susturur ama
`autoCodeSplitting`'i kırar (component artık local olmadığı için ayrı chunk'a
bölünmez). Doğru çözüm: `eslint.config.js`'te `src/routes/**/*.tsx` için bu
kuralı kapatan ayrı bir override — component'i export etmek veya per-dosya
`eslint-disable` yorumu **değil**.

**Doğrulama:**

```bash
npx tsc -b
pnpm run build
```

`pnpm run build` çıktısında `dist/assets/` altında route'a özel ayrı bir
chunk (örn. `routes-*.js`) görülmeli — bu, code splitting'in çalıştığının
kanıtıdır.

---

## 6. TanStack Query

**Kurulum:**

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

**`src/query-client.ts`** — tek bir `QueryClient` instance'ı, varsayılan
`staleTime`/`gcTime` seçenekleriyle:

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

**`main.tsx`** — `QueryClientProvider` ile sarma:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/query-client'

;<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

**TanStack Router entegrasyonu:** `router.ts`'teki
`defaultPreloadStaleTime: 0` ayarı tam olarak bu yüzden önceden
konulmuştu — router'ın kendi preload cache'i Query'nin cache'iyle
çakışmasın diye. Router'a `context: { queryClient }` eklenip route
loader'larının `queryClient.ensureQueryData(...)` çağırabilmesi
sağlanmalı (`createRootRouteWithContext<{ queryClient: QueryClient }>()`).

**Konvansiyonlar** (burada tekrar edilmez, `AGENTS.md`'de tanımlı):

- Query key şekli ve invalidation kuralı → § Kod Kuralları
  (`['products', filters]`, `['product', id]`, `['categories']`,
  `['brands']`, `['stats']`; her mutation sonrası `['products']`
  invalidate edilir).
- Loading/Error/Empty üç durumu → § Her Ekranda Üç Durum.
- Sunucu verisinin yalnızca TanStack Query'de tutulması, Redux/Zustand/
  Context yasağı → § Kod Kuralları.

**Doğrulama:**

```bash
npx tsc -b
pnpm run build
```

Devtools'un yalnızca dev modda göründüğü, production build'e dahil
olmadığı kontrol edilir.

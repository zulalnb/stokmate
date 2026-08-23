# Web Projesi Kurulumu

`web/` projesinin sıfırdan (boş klasörden) nasıl kurulduğu. Her bölümde kurulum komutları, oluşan/değişen dosyalar ve bu projede gerçekten karşılaşılmış bilinen tuzaklar var.

Bu dosya **kurulum ve araç yapılandırmasını** anlatır. Mimari kurallar, katman sorumlulukları, query key konvansiyonları ve UI kuralları `AGENTS.md`'dedir ve burada tekrar edilmez.

---

## 1. Vite + React + TypeScript

**Kurulum:**

```bash
pnpm create vite@latest web -- --template react-ts
cd web
pnpm install
```

**Oluşan dosyalar:** `vite.config.ts`, `tsconfig.json` (solution-style, `references` ile `tsconfig.app.json` + `tsconfig.node.json`'a işaret eder), `src/main.tsx`, `index.html`.

**Bilinen tuzak:** `tsconfig.json`'a eklenen `paths`/`baseUrl` proje referansları yüzünden gerçek derlemeye etki etmez — `src/`'i asıl type-check eden `tsconfig.app.json`'a **ayrıca** eklenmesi gerekir. Aksi halde `npx tsc -b` "Cannot find module '@/...'" hatası verir; ayrıca Vite/Rolldown'ın kendi `resolve.alias`'ı da `vite.config.ts`'te ayrı tanımlanmalıdır (biri diğerini kapsamaz).

```jsonc
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
})
```

**Doğrulama:** `npx tsc -b` hatasız çalışmalı. (`npx tsc --noEmit` **tek başına yeterli değildir** — kök `tsconfig.json` solution-style olduğu için 0 dosya kontrol eder ve sahte-yeşil sonuç verir.)

---

## 2. Tailwind v4

**Kurulum:**

```bash
pnpm add tailwindcss @tailwindcss/vite
```

`vite.config.ts`'e plugin eklenir, `src/index.css`'e `@import "tailwindcss"` konur (shadcn init bu adımı otomatik de yapabilir, bkz. bölüm 4).

**Doğrulama:** `pnpm run dev` başlatıp bir Tailwind class'ının (örn. `p-6`) gerçekten stil uyguladığı gözle kontrol edilir.

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

`routeTree.gen.ts` otomatik üretildiği için hem burada hem `eslint.config.js`'in `globalIgnores`'ında hariç tutulur (bkz. bölüm 5).

**`package.json` script'leri:**

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

**Doğrulama:** `npx prettier --check .` çalıştırılır; yalnızca gerçekten formatlanmamış dosyalar listelenmeli, `routeTree.gen.ts` listede görünmemeli.

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

**Bilinen tuzak:** shadcn CLI, `@/` alias'ını bulmak için kök `tsconfig.json`'daki `paths`'e bakar (proje referansları zincirindeki `tsconfig.app.json`'a değil). Kök `tsconfig.json`'da `paths` tanımlı değilse CLI alias'ı çözemez ve gerçek `src/components/ui/` yerine literal bir `./@/components/ui/...` klasörü oluşturur. Bu yüzden `@/*` path'i **hem** kök `tsconfig.json`'da **hem** `tsconfig.app.json`'da tanımlı tutulmalı (bkz. bölüm 1) — ikisinin farklı tüketicisi var: shadcn CLI ve gerçek derleme.

**Doğrulama:** `pnpm dlx shadcn@latest add skeleton` ile bir component eklenip dosyanın gerçekten `src/components/ui/skeleton.tsx`'te oluştuğu kontrol edilir (kök dizinde `./@/` diye bir klasör oluşmamalı).

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

**Bilinen tuzak (kritik sıralama):** `tanstackRouter(...)` plugin listesinde **`react()`'ten önce** gelmelidir; aksi halde `autoCodeSplitting` hata verir.

**Dosya yapısı:**

```
src/routes/
├── __root.tsx              createRootRouteWithContext
├── login.tsx               korumasız
├── _authenticated.tsx      pathless layout route — guard + panel yerleşimi
└── _authenticated/
    ├── index.tsx
    └── products/
```

Router varsayılanları `src/router.ts`'te bir kez bağlanır:

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

Bu üç bileşen `src/components/` altındadır (`route-pending.tsx`, `route-error-fallback.tsx`, `route-not-found.tsx`). Route dosyalarında tekrar tanımlanmaz — istisna: ekrana özel iskelet gerektiren `pendingComponent` (bkz. AGENTS.md § Ortak route bileşenleri).

- `_` önekli dosya **pathless layout route** üretir: URL'de `/products` olarak görünür, `/_authenticated/products` olarak değil. Guard'ın tek bir yerde durmasını sağlayan yapı budur.
- `src/routeTree.gen.ts` — plugin tarafından her `dev`/`build`'de otomatik üretilir. **Elle düzenlenmez, `.gitignore`'a eklenmez, commit edilir** (tipler buna dayanıyor).
- `src/router.ts` — `createRouter({ routeTree, defaultPreload: 'intent', ... })` instance'ı; `Register` modül augmentation'ı burada yapılır.

Guard'ın içeriği ve kuralları: `AGENTS.md` § Authentication.

**Bilinen tuzak (eslint):** `eslint-plugin-react-refresh`'in `only-export-components` kuralı, her route dosyasının hem `Route` export'unu hem de local bir component'i (`component: RootLayout` gibi) barındırmasından rahatsız olur. Component'i export etmek kuralı susturur ama `autoCodeSplitting`'i kırar (component artık local olmadığı için ayrı chunk'a bölünmez). Doğru çözüm: `eslint.config.js`'te `src/routes/**/*.tsx` için bu kuralı kapatan ayrı bir override — component'i export etmek veya per-dosya `eslint-disable` yorumu **değil**.

**Bilinen tuzak (guard + context):** `_authenticated.tsx` içindeki `beforeLoad`, `context.queryClient` üzerinden `ensureQueryData` çağırır. Bu yüzden `__root.tsx` mutlaka `createRootRouteWithContext<{ queryClient: QueryClient }>()` ile tanımlanmalı ve `createRouter`'a `context: { queryClient }` geçilmelidir (bkz. bölüm 6). Aksi halde `context.queryClient` tipte vardır ama çalışma anında `undefined` gelir.

**Bilinen tuzak (yönlendirme):** `beforeLoad` içinde `navigate()` çağrılmaz; yönlendirme `throw redirect({ to: '/login' })` ile yapılır. `redirect` çağrısının sonucu `return` edilirse route yüklenmeye devam eder — `throw` zorunludur.

**Bilinen tuzak (bekleme ekranı):** Guard `await` içerdiği için korumalı ekranlar ilk açılışta `beforeLoad` çözülene kadar beklemede kalır. `createRouter`'a `defaultPendingComponent` verilmezse bu süre boyunca boş ekran görünür.

**Doğrulama:**

```bash
npx tsc -b
pnpm run build
```

`pnpm run build` çıktısında `dist/assets/` altında route'a özel ayrı bir chunk (örn. `routes-*.js`) görülmeli — code splitting'in çalıştığının kanıtıdır.

Ardından elle:

1. Oturum açıkken `/products` adresine gidilir — açılmalı.
2. `lib/auth-storage` temizlenip sayfa yenilenir — `/login`'e düşmeli.
3. URL'de `/_authenticated/products` denenir — 404 vermeli (pathless route URL'de görünmez).

---

## 6. TanStack Query

**Kurulum:**

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

**`src/query-client.ts`** — tek bir `QueryClient` instance'ı:

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

**Router entegrasyonu:** `router.ts`'teki `defaultPreloadStaleTime: 0` ayarı bu yüzden konuldu — router'ın kendi preload cache'i Query'nin cache'iyle çakışmasın diye. Router'a `context: { queryClient }` eklenir (`createRootRouteWithContext<{ queryClient: QueryClient }>()`), böylece hem loader'lar hem `_authenticated.tsx`'teki `beforeLoad` guard'ı `context.queryClient.ensureQueryData(...)` çağırabilir.

**Bilinen tuzak (mimari):** `beforeLoad` ve `loader` React hook çağıramaz. Query key ve `queryFn` yalnızca hook'un içinde tanımlıysa route katmanında elle ikinci kez yazmak gerekir ve iki tanım zamanla ayrışır — aynı veri için çift istek oluşur. Bu yüzden query tanımı `queryOptions()` fabrikası olarak export edilir; hem route hem hook aynı fabrikayı kullanır. Kural ve örnek: `AGENTS.md` § Mimari.

**Doğrulama:**

```bash
npx tsc -b
pnpm run build
```

Devtools'un yalnızca dev modda göründüğü, production build'e dahil olmadığı kontrol edilir.

---

## 7. Ortam değişkenleri

**`.env.example`** (repoya commit edilir):

```
VITE_API_URL=http://localhost:5080
```

**`.env`** (`.gitignore`'da) geliştirici tarafından kopyalanarak oluşturulur:

```bash
cp .env.example .env
```

**Bilinen tuzak:** `.env` yoksa `import.meta.env.VITE_API_URL` sessizce `undefined` olur ve Axios istekleri sayfanın kendi origin'ine gider — 404 alırsın ama hata mesajı sebebi göstermez. `axios-client.ts` içinde değer yoksa açıkça hata fırlat.

---

## 8. Axios

**Kurulum:**

```bash
pnpm add axios
```

**Dosya yapısı:**

```
src/api/
├── axios-client.ts     tek Axios instance
├── interceptors.ts     request/response interceptor'ları
├── errors.ts           ApiError modeli
└── services/           endpoint çağrıları (bkz. AGENTS.md § API Katmanı)
```

`src/api/axios-client.ts`:

```ts
axios.create({ baseURL: import.meta.env.VITE_API_URL })
```

**Bilinen tuzak (kritik):** `/auth/refresh` çağrısı, interceptor'ın takılı olduğu instance ile yapılamaz. Refresh isteğinin kendisi 401 dönerse response interceptor tekrar devreye girer ve yenileme sonsuz döngüye girer. Yenileme için `axios.create()` ile interceptor'sız **ikinci bir instance** kullanılır. Bu, "tek instance" kuralının tek istisnasıdır.

**Bilinen tuzak:** Axios'un varsayılan `transformResponse`'u gövdeyi önce `JSON.parse` etmeye çalışır, başarısız olursa ham string'i döner. API hata gövdeleri `text/plain` olduğu için `error.response.data` bir **string**'tir — `data.message` gibi bir alan **yoktur**.

**Bilinen tuzak:** Retry edilmiş istek işaretlenmezse (`config._retry`), refresh sonrası tekrar 401 dönen bir istek döngüye girer. Her istek en fazla bir kez retry edilir.

Katman sorumlulukları, single-flight refresh davranışı ve `ApiError` sözleşmesi: `AGENTS.md` § API Katmanı.

**Doğrulama:**

```bash
npx tsc -b
pnpm run build
```

Ardından elle:

1. Yanlış kimlik bilgileriyle giriş yapıldığında API'nin `text/plain` hata mesajının kullanıcıya olduğu gibi gösterildiği.
2. HTTP hatalarında `status` bilgisinin `ApiError.status` üzerinden korunduğu.
3. API kapalıyken (`dotnet run` durdurulmuş) ağ hatasının API hatasından ayırt edildiği (`status: 0` ve fallback mesajı).
4. Access token süresi dolduğunda (15 dk bekleyerek veya `lib/auth-storage`'daki access token'ı elle bozarak) refresh işleminin otomatik gerçekleştiği.
5. **Single-flight:** access token elle bozulup aynı anda birden fazla query tetikleyen bir ekran (örn. liste + kategoriler + markalar) açılır. Network sekmesinde `/auth/refresh` isteğinin **tam olarak bir kez** göründüğü doğrulanır.
6. Aynı senaryoda bekleyen isteklerin yalnızca birer kez retry edildiği (her endpoint Network'te en fazla iki kez: ilk 401 + bir retry).
7. Refresh token da bozulduğunda session'ın temizlendiği ve giriş ekranına yönlendirildiği.
8. Çıkış yapıldıktan sonra korumalı bir adrese gidildiğinde `/login`'e yönlendirildiği — `useLogout` içinde `queryClient.clear()` çağrılmazsa `['me']` cache'de kalır ve guard ağ isteği atmadan geçer.

---

## 9. shadcn sidebar bloğu

**Kurulum:**

```bash
pnpm dlx shadcn@latest add sidebar
```

Üretilen bileşenler `src/components/` altına gelir: `app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`, `site-header.tsx`.

Panel yerleşimi `_authenticated.tsx` içinde kurulur; `--sidebar-width` ve `--header-height` `SidebarProvider`'a inline style ile verilir.

Navigasyon öğeleri `lib/constants.ts`'te tanımlanır ve `nav-main.tsx` tarafından okunur.

**Bilinen tuzak:** shadcn CLI kebab-case dosya adı üretir. Proje başlangıcında component dosyaları PascalCase idi; iki stilin karışmaması için tümü kebab-case'e çevrildi (`RouteErrorFallback.tsx` → `route-error-fallback.tsx`). Kural: AGENTS.md § Kod Kuralları.

**Doğrulama:** `pnpm run dev` ile panel açılır; sidebar daraltılıp genişletildiğinde içerik alanı kaymamalı, `SiteHeader` sabit kalmalı.

---

## 10. TanStack Table

**Kurulum:**

```bash
pnpm add @tanstack/react-table
pnpm dlx shadcn@latest add table
```

**Bilinen tuzak (API sürümü — kritik):** Projede kütüphanenin yeni API'si kullanılıyor: `tableFeatures({})` ile feature seti oluşturulur, `createColumnHelper<typeof features, T>()` ile kolonlar tanımlanır, `useTable` ve `<FlexRender />` ile render edilir.

İnternetteki örneklerin ve shadcn data-table dokümanının büyük çoğunluğu eski API'yi (`useReactTable`, `flexRender`, `getCoreRowModel`) gösterir. İkisi karıştırılırsa tip hataları anlaşılmaz hale gelir. Emin olunmadığında `node_modules/@tanstack/react-table` içindeki tipler okunur.

**Bilinen tuzak (sunucu taraflı sayfalama):** shadcn'in data-table dokümanı client-side sayfalama varsayar. Bu projede sayfalama ve sıralama API tarafında; `getPaginationRowModel()` ve `getSortedRowModel()` **eklenmez**, `pageCount` `total`'dan hesaplanır (bkz. AGENTS.md § Tablolar).

**Bilinen tuzak (kolon genişliği):** Varsayılan `table-auto` yerleşiminde kolon genişlikleri içeriğe göre ölçülür; sayfa değiştikçe uzun ürün adları tüm kolonları kaydırır. Tablo `table-fixed` ile kurulur, genişlikler kolon tanımındaki `meta.className` üzerinden `<th>`'lere uygulanır (`table-fixed`'de genişlik yalnızca ilk satırdan okunur).

**Doğrulama:** İki farklı sayfa arasında gidilip gelinir; kolon genişlikleri sabit kalmalı. Network sekmesinde sayfa değişimi başına tek `GET /products` isteği görülmeli.
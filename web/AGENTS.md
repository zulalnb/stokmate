## Proje

StokMate, küçük bir perakende zincirinin merkez ofis çalışanları için geliştirilmiş dahili stok yönetim panelidir.

Uygulama:

- Vite + React + TypeScript kullanır.
- Tamamen client-side çalışır; SSR ve SEO yoktur.
- Kimlik doğrulamasının arkasında çalışır.
- Server state TanStack Query tarafından yönetilir.
- Routing TanStack Router ile yapılır.
- HTTP istekleri Axios ile yapılır.
- UI shadcn/ui (`base-vega` stili, Base UI tabanlı) + Tailwind ile oluşturulur.
- Tablolar `@tanstack/react-table` ile kurulur.

Teknoloji yığını sabittir. Yeni dependency eklemeden önce kullanıcıdan onay al.

---

## Çalışma Kuralları

- Görev açıkça değiştirmiyorsa mevcut davranışı koru.
- İstenen işin kapsamını genişletme.
- Gelecekte gerekli olacağını düşündüğün kodu önceden yazma.
- Kullanıcı tarafından istenmeyen route, component, hook, utility veya feature oluşturma.
- Her seferinde yalnızca istenen dosya veya ekran üzerinde çalış.
- İlgisiz dosyalara dokunma.
- Bir parça tamamlandığında dur ve kullanıcıya kontrol etmesi için bırak.
- Backend davranışı bilinmiyorsa tahmin yürütme; `api/API.md` dosyasını oku.
- Domain terminolojisi belirsiz veya çelişkiliyse ürün kararı uydurma; kullanıcıdan netleştirme iste.
- Güvenlik kurallarını client tarafında gevşetme.

---

## Dokümantasyon Önceliği

Kod yazmadan önce görevle ilgili dokümantasyonu incele. Öncelik sırası:

1. `.specs/README.md`
2. İlgili `.specs/` dokümanı
3. `api/API.md`
4. Bu dosyadaki kurallar
5. `INSTALLATION.md` (yalnızca kurulum ve araç yapılandırması için)

Spec, koddan önce gelir. API davranışı hakkında varsayım yapma.

Karar gerekçeleri `docs/decisions.md`'dedir. Yeni bir mimari veya kütüphane kararı verildiğinde oraya kısa bir başlık eklenir: seçilen yol, elenen alternatif, gerekçe, bedel.

Bu dosya ile diğer dokümanlar arasında çelişki varsa sessizce seçim yapma; çelişkiyi kullanıcıya bildir.

---

## Mimari

```
Component
  ↓
Feature Hook  (queryOptions fabrikası + useQuery / useMutation)
  ↓
API Service   (yalnızca HTTP çağrısı)
  ↓
Axios Client + Interceptors
  ↓
API
```

Import yönü tek yönlüdür. Bir component `products.service.ts` import ediyorsa mimari bozulmuştur; eksik olan hook veya `queryOptions` fabrikası ilgili feature'a eklenir.

### Component

Component'ler:

- UI render eder ve kullanıcı etkileşimlerini yönetir.
- Feature hook'larını kullanır.
- API service'lerini doğrudan çağırmaz.
- `useQuery` / `useMutation`'ı doğrudan kullanmaz; server-state işlemleri feature hook'ları üzerinden yapılır.
- Axios veya HTTP detaylarını bilmez.

Yanlış:

```ts
productsService.getProducts(filters)
```

Doğru:

```ts
useProducts(filters)
```

### Klasör yapısı

```
src/
├── api/                    axios-client, interceptors, errors, services/
├── components/             uygulama geneli — sidebar, header, route fallback'leri
│   └── ui/                 shadcn bileşenleri (CLI üretir, elle düzenlenmez)
├── features/
│   ├── auth/
│   │   ├── components/
│   │   └── hooks/use-auth.ts
│   └── products/
│       ├── components/     columns.tsx, tabloya özel parçalar
│       └── hooks/use-products.ts
├── hooks/                  feature bağımsız reusable hook'lar
├── lib/                    auth-storage, constants, enums, money, types, utils
└── routes/
```

Bir feature'a ait component `src/components/` altına konmaz; `src/components/` yalnızca birden fazla feature'ın kullandığı veya uygulama geneline ait bileşenler içindir.

`src/hooks/` yalnızca domain'siz reusable hook'lar içindir (`use-debounce.ts`, `use-media-query.ts`). Server-state hook'ları buraya konmaz.

### Query tanımları — `queryOptions` fabrikası zorunlu

Query key ve `queryFn` doğrudan hook'un veya route dosyasının içine yazılmaz. Fabrika ilgili feature'ın `hooks/` dosyasında tanımlanır ve dışa açılır; hook onu sarar:

```ts
// src/features/products/hooks/use-products.ts
export const productsQuery = (filters: ProductFilters) =>
  queryOptions({
    queryKey: ['products', filters],
    queryFn: () => productsService.getProducts(filters),
  })

export function useProducts(filters: ProductFilters) {
  return useQuery(productsQuery(filters))
}
```

Sebebi: route `beforeLoad` ve `loader` fonksiyonları React hook çağıramaz. Bunlar `ensureQueryData(...)` çağırırken aynı fabrikayı kullanır, böylece key ve ayarlar tek yerde kalır:

```ts
loader: ({ context, deps }) => context.queryClient.ensureQueryData(productsQuery(deps)),
```

Aynı query için key veya `queryFn` ikinci bir yerde tekrar yazılmaz; yazılırsa ayarlar zamanla ayrışır ve aynı veri için iki istek oluşur.

### Kapsam — mevcut hook ve fabrika listesi

Web panelinin kapsamı listeleme, detay, oluşturma, güncelleme ve silmedir:

```
meQuery()                 (fabrika — guard'da kullanılır)
useLogin()
useLogout()
productsQuery(filters)    useProducts(filters)
productQuery(id)          useProduct(id)
                          useCreateProduct()
                          useUpdateProduct()
                          useUpdateProductStock()
                          useDeleteProduct()
categoriesQuery()         useCategories()
brandsQuery()             useBrands()
statsQuery()              useStats()
```

Bu liste örnek değil, kapsamdır. Listede olmayan bir hook veya fabrika eklemeden önce kullanıcıya sor.

---

## TanStack Query

Server state yalnızca TanStack Query'de tutulur. Redux, Zustand veya Context tabanlı server-state cache oluşturma.

Query key'leri:

```
['me']
['products', filters]
['product', id]
['categories']
['brands']
['stats']
```

Query key yapısını değiştirme.

Liste filtreleri component state'inde tutulmaz. Şu filtreler URL search parametrelerinde tutulur ve ilgili query'nin key'ine dahil edilir:

```
q  categoryId  brandId  status  page  sort  dir
```

Mutation sonrasında ilgili cache invalidate edilir. Ürün mutation'larından sonra:

```ts
queryClient.invalidateQueries({ queryKey: ['products'] })
```

Invalidation ilgili hook'un `onSuccess`'inde tanımlanır, component içinde değil.

Query veya mutation hata aldığında interceptor tarafından üretilen `ApiError` UI katmanına aktarılır. Mutation hatalarında bildirimi UI katmanı gösterir.

---

## API Katmanı

```
src/api/
├── axios-client.ts
├── interceptors.ts
├── errors.ts
└── services/
    ├── auth.service.ts
    ├── products.service.ts
    ├── categories.service.ts
    ├── brands.service.ts
    └── stats.service.ts
```

### Axios client

`src/api/axios-client.ts` uygulamanın tek Axios instance'ını içerir.

**Tek istisna:** `/auth/refresh` çağrısı, interceptor'sız ayrı bir instance ile yapılır. Aksi halde refresh'in kendi 401'i response interceptor'ı yeniden tetikler ve sonsuz döngü oluşur. Bu istisna dışında yeni instance oluşturma.

### Interceptors

`src/api/interceptors.ts`:

- Request: `/auth/login` ve `/auth/refresh` dışındaki isteklere `Authorization: Bearer <accessToken>` ekler. Token `lib/auth-storage` üzerinden okunur.
- Response: 401 durumunda single-flight refresh yönetir, HTTP hatalarını `ApiError` olarak normalize eder.

401 davranışı:

- Aynı anda birden fazla 401 alınırsa yalnızca **bir** `/auth/refresh` isteği gönderilir; diğer istekler aynı Promise'i bekler.
- Refresh başarılı olursa bekleyen istekler **bir kez** retry edilir. Retry edilmiş istek işaretlenir (`_retry`) ve ikinci kez denenmez.
- Refresh başarısız olursa session temizlenir ve istekler `ApiError` ile başarısız olur.

Token yenileme davranışını feature, component veya route içinde yeniden uygulama.

### Errors

`src/api/errors.ts` standart `ApiError` modelini içerir:

```ts
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
```

API hata gövdeleri `text/plain` döner. Axios başarısız `JSON.parse` sonrası ham string'i bırakır — yani `error.response.data` bir **string**'tir, obje değil. `.message` gibi bir alan okumaya çalışma, tekrar `JSON.parse` etme.

API'nin döndürdüğü metin `ApiError.message` olarak korunur; kendi hata mesajını üretme.

Ağ hatası ile HTTP hatası `error.response` alanının varlığına göre ayırt edilir; ağ hatasında `status: 0` kullanılır ve uygun bir fallback mesajı gösterilir.

Uygulamanın geri kalanında `AxiosError`, `error.response`, `error.config` gibi Axios'a özgü detaylara bağımlı olma.

### Services

Service katmanı yalnızca API operasyonlarını tanımlar. Service'ler:

- React bilmez, hook kullanmaz.
- TanStack Query kullanmaz.
- UI state tutmaz, toast göstermez.
- `try/catch` yazmaz — hata dönüşümü interceptor'ın işidir.
- Kuruş dönüşümü yapmaz; API ne veriyorsa onu geçirir.

Yeni bir endpoint kullanılacaksa sıra: önce service fonksiyonu, sonra `queryOptions` fabrikası + hook, en son component. Üç dosyayı aynı anda yazma; her adımda dur.

---

## Authentication

- Access token 15 dakika geçerlidir.
- Refresh token her yenilemede değişir; eski refresh token geçersiz hale gelir.
- Token saklama, okuma ve temizleme işlemleri yalnızca `lib/auth-storage` üzerinden yapılır.
- 401 refresh mantığı yalnızca response interceptor katmanındadır.

### Oturum koruması — `_authenticated` pathless layout route

Korumalı ekranlar `src/routes/_authenticated/` altında toplanır. Guard tek yerdedir: `src/routes/_authenticated.tsx` içindeki `beforeLoad`.

```ts
beforeLoad: async ({ context }) => {
  if (!hasSession()) {
    throw redirect({ to: '/login' })
  }

  const isSessionValid = await context.queryClient.ensureQueryData(meQuery()).then(
    () => true,
    () => false,
  )

  if (!isSessionValid) {
    throw redirect({ to: '/login' })
  }
},
```

İki aşamalı olmasının sebebi: `hasSession()` senkron ve ağ isteği gerektirmez, token hiç yoksa `/auth/me` çağrısı boşuna atılmaz. Token varsa geçerliliği `meQuery()` ile doğrulanır; token bayatsa interceptor refresh dener, o da başarısız olursa query reddedilir ve kullanıcı `/login`'e yönlendirilir.

Kurallar:

- Yeni korumalı ekran `src/routes/_authenticated/` altına eklenir. Ek guard yazılmaz.
- `ProtectedRoute` benzeri bir component oluşturma; koruma route katmanındadır.
- Component içinde `if (!isAuthenticated) navigate('/login')` gibi yönlendirme yazma.
- `/login` bu ağacın dışındadır (`src/routes/login.tsx`) ve korumalı değildir.
- `meQuery()` yalnızca oturum doğrulama içindir; kullanıcı bilgisini ekranda göstermek gerekirse aynı fabrika `useQuery` ile kullanılır, ikinci bir query tanımlanmaz.

### Giriş

`useLogin()` başarılı olduğunda dönen `user` verisini `meQuery()`'nin cache'ine
(`meQuery().queryKey` ile) yazar. Böylece login sonrası `/products`'a
yönlendirmenin tetiklediği `_authenticated` guard'ı, `staleTime` süresi içinde
cache'i taze bulur ve `GET /auth/me`'yi tekrar çağırmaz.

Cache key'i elle (`['auth', 'me']`) tekrar yazılmaz; `meQuery().queryKey`
kullanılır — key iki yerde tanımlanırsa zamanla ayrışma riski oluşur (bkz. §
Query tanımları).

### Çıkış

`useLogout()`:

1. `POST /auth/logout` çağırır (hata alsa bile akış devam eder).
2. `lib/auth-storage`'ı temizler.
3. `queryClient.clear()` çağırır.
4. `/login`'e yönlendirir.

`queryClient.clear()` atlanamaz: `['me']` cache'de kalırsa `ensureQueryData(meQuery())` ağ isteği atmadan başarılı döner ve guard bir sonraki kullanıcıyı içeri alır.

---

## Routing

Route ağacı:

```
src/routes/
├── __root.tsx              createRootRouteWithContext
├── login.tsx               korumasız
├── _authenticated.tsx      guard + panel yerleşimi
└── _authenticated/
    ├── index.tsx           →  /products'a yönlendirir
    └── products/
        ├── index.tsx       →  /products
        ├── new.tsx         →  /products/new
        └── $id.tsx         →  /products/$id
```

- Korumalı her ekran `_authenticated/` altına konur; başka yere korumalı ekran eklenmez.
- URL'de `_authenticated` görünmez (pathless layout route). Ekran yolları `/products`, `/products/42` biçimindedir; `/dashboard` gibi bir önek kullanılmaz.
- `src/routeTree.gen.ts` otomatik üretilir: elle değiştirme, `.gitignore`'a ekleme, commit edilmelidir.
- Liste filtreleri route'un `validateSearch` şemasında tanımlanır.
- `beforeLoad` ve `loader` fonksiyonları `queryOptions` fabrikalarını kullanır (bkz. § Mimari).
- Yönlendirme `throw redirect({ ... })` ile yapılır; `beforeLoad` içinde `navigate` çağrılmaz.

### Layout

`_authenticated.tsx` hem guard'ı hem panel yerleşimini barındırır: `SidebarProvider` + `AppSidebar` + `SiteHeader` + `Outlet`. Korumalı ekranlar kendi sidebar veya header'ını render etmez, doğrudan içerik döner.

Sidebar navigasyon öğeleri `lib/constants.ts` içinde tanımlanır; `nav-main.tsx` onları okur. Yeni menü öğesi eklemeden önce o ekranın kapsamda olduğunu doğrula.

### Ortak route bileşenleri

`route-pending.tsx`, `route-error-fallback.tsx` ve `route-not-found.tsx` `router.ts`'te `defaultPendingComponent`, `defaultErrorComponent` ve `defaultNotFoundComponent` olarak bir kez bağlanır.

- Route dosyalarında ayrıca `errorComponent` tanımlanmaz; varsayılan yeterlidir.
- `pendingComponent` yalnızca o ekranın içerik şeklini taklit eden bir iskelet gerektiğinde tanımlanır (bkz. § Loading / Error / Empty). İskelet ilgili feature'ın `components/` klasöründe durur, route dosyasında değil.

### Search params ile gezinme

Filtreler eklendikçe `search` nesnesi büyür. Sayfa değiştiren bağlantılar mevcut filtreleri korumak zorundadır:

```tsx
<Link to="." search={(prev) => ({ ...prev, page: prev.page + 1 })} />
```

Nesne biçimi (`search={{ page: 2 }}`) diğer filtreleri siler; kullanma.

---

## Tablolar

Bir feature'ın listesi tabloyla gösterilecekse, dosya yapısı sabit bir
şablonu izler; ürün tablosu bu şablonun referans örneğidir
(`src/features/products/components/`):

```
data-table-features.tsx   tableFeatures({...}) konfigürasyonu — columnMeta tipi ve rowSortingFeature; `features` ve `DataTableFeatures` tipini export eder
columns.tsx                createColumnHelper<DataTableFeatures, T>() ile kurulan `columns` dizisi
sortable-header.tsx        sıralanabilir kolon başlığı — column.getIsSorted() / column.getToggleSortingHandler()
data-table.tsx             useTable() çağrısı + <Table> render ağacı; columns/data/sorting/onSortingChange prop olarak alınır
```

Filtre çubuğu ve sayfalama bu dördün dışında, aynı `components/` klasöründe ayrı dosyalarda durur (ürün için `product-filter-bar.tsx`, `table-pagination.tsx`). Route dosyası yalnızca URL/arama state'ini yönetir ve bu component'lere prop geçirir; `useTable()` çağrısı route dosyasında olmaz.

Projede kütüphanenin yeni API'si kullanılır: `tableFeatures`, `createColumnHelper`, `useTable`, `<FlexRender />`.

**İnternetteki örneklerin ve shadcn data-table dokümanının çoğu eski API'yi (`useReactTable`, `flexRender`, `getCoreRowModel`) gösterir; bu projede geçerli değildir.** Emin olmadığında `node_modules/@tanstack/react-table` içindeki tipleri oku, tahmin etme.

Sayfalama, sıralama ve filtreleme **sunucu taraflıdır**:

- `getPaginationRowModel()` / `getSortedRowModel()` eklenmez (yani `tableFeatures({...})`'a `paginatedRowModel` / `sortedRowModel` slotları geçirilmez); eklenirse API'nin döndürdüğü sayfa ikinci kez sayfalanır ve sıralama yalnızca o sayfa içinde çalışır.
- `rowSortingFeature` yine de eklenir — ama yalnızca *state ve column API'si* için (`state.sorting`, `column.getIsSorted()`, `column.getToggleSortingHandler()`). `sortedRowModel` hiç eklenmediği için satırlar client'ta yeniden sıralanmaz; `useTable`'a geçirilen `state: { sorting }` ve `onSortingChange`, route'un URL güncelleyen handler'ına bağlanır.
- `pageCount` `Math.ceil(total / pageSize)` ile hesaplanır; yanıtta `totalPages` yoktur.
- Sayfa ve sıralama state'i component içinde tutulmaz; `validateSearch` şemasından okunur, `<Link search={...}>` / `navigate({ search: ... })` ile güncellenir. `useState` ile `pagination` veya `sorting` state'i tutma.
- Sıralanabilir kolonlar API'nin kabul ettikleriyle sınırlıdır: `name` | `price` | `stock` | `updatedAt`; yalnızca bu kolonlarda `enableSorting: true` işaretlenir.
- Kolon tanımları `columns.tsx` içinde durur, route dosyasında değil.
- Hücrelerde ham değer gösterilmez: fiyat `formatKurus`, `unit` ve `status` `lib/enums.ts` map'lerinden geçer.
- Kolon genişlikleri yalnızca gerektiğinde kolon tanımındaki `meta.className` üzerinden verilir (taşan bir kolonu `max-w-*` ile sınırlamak, dar bir sayı kolonunu `w-*` ile sabitlemek gibi). Tablo `table-fixed` **değildir**; `meta.className` her kolona değil, yalnızca ihtiyaç duyulana seçici olarak uygulanır. Sayı kolonlarında `tabular-nums` kullanılır.

---

## Money

`price` ve `costPrice` integer kuruş değeridir: `3950` → `39,50 ₺`

Kod tabanının hiçbir yerinde `price / 100` veya `price * 100` yapma. Para dönüşümleri yalnızca `lib/money.ts` içindeki `formatKurus` ve `parseKurus` üzerinden yapılır.

---

## Product update

`PUT /products/{id}` tüm kaydı yeniden yazar ve şu alanları zorunlu ister:

```
costPrice  supplierId  description
```

Edit formu bu değerleri detail endpoint'inden almalı ve kullanıcı değiştirmese bile update request'inde göndermelidir. Aksi halde kayıt sırasında sessizce silinirler.

Backend davranışını tahmin ederek request modeli değiştirme.

---

## Enums

`unit` ve `status` API'den sayısal gelir. UI'da ham sayı gösterme; etiketleri `lib/enums.ts` içindeki `as const` map'lerinden al.

`lib/types.ts` içinde bu alanlar dar union olarak tiplenir (`status: 1 | 2 | 3`), böylece map erişiminde `as keyof typeof` gibi assertion gerekmez.

---

## Pagination

`GET /products` response'unda `totalPages` bulunmaz. Gerektiğinde `Math.ceil(total / pageSize)` ile hesapla. API'nin maksimum `pageSize` değeri `100`'dür.

---

## TypeScript

- `any` ve `as any` kullanma.
- Gereksiz type assertion kullanma. Assertion ihtiyacı doğuyorsa çoğunlukla `lib/types.ts`'teki tip fazla geniştir; tipi daralt.
- Domain tipleri `lib/types.ts` içinde tutulur.
- Aynı tip için ikinci bir paralel model oluşturma.

---

## UI

Kullanıcıya gösterilen tüm metinler **Türkçe**; kod, yorum ve commit mesajları **İngilizce** olmalıdır.

UI metinleri:

- Cümle biçiminde olmalı, gereksiz dolgu içermemeli.
- Butonlar yaptıkları işlemi açıkça adlandırmalı.
- Hata mesajları sorunu ve kullanıcının sonraki adımını açıklamalı.
- Özür dileyen ifadeler kullanılmamalı.

### shadcn `base-vega` stili

Bu projedeki shadcn stili Base UI tabanlıdır. `Button` gibi bileşenler `render` prop'u ve `nativeButton={false}` ile başka bir element olarak render edilir:

```tsx
<Button nativeButton={false} render={<Link to="/products" />}>Ürünler</Button>
```

`asChild` deseni kullanılmaz. `src/components/ui/` altındaki dosyalar CLI tarafından üretilir; elle düzenlenmez, gerekirse yeniden `add` edilir.

### İkonlar

Lucide kullanılır. İkon prop olarak geçirilirken tip `LucideIcon`, değer bileşenin kendisidir (`icon={CircleCheck}`, `icon={<CircleCheck />}` değil). Boyut için `size-4` gibi Tailwind sınıfları kullanılır.

---

## Loading / Error / Empty

Her veri ekranı üç durumu ele almalıdır.

**Loading** — ortalanmış spinner kullanma; gerçek içeriğin yapısını taklit eden shadcn `Skeleton` kullan. Tablo iskeleti gerçek kolon sayısı ve satır yüksekliğiyle örtüşmeli; satır sayısı `pageSize` ile uyumlu olmalı, kolon sayısıyla değil.

**Error** — `ApiError.message` göster, yeniden denemek için `router.invalidate()` çağıran bir "Tekrar dene" butonu koy. Loader'da patlayan query'ler için `useQueryErrorResetBoundary().reset()` de çağrılmalı; aksi halde buton hiçbir şey yapmıyormuş gibi görünür.

**Empty** — filtre varsa sonuç bulunamadığını belirt ve filtreleri temizleme seçeneği sun; filtre yoksa henüz veri bulunmadığını belirt.

`useSuspenseQuery` kullanılan ekranlarda `isPending` hiçbir zaman `true` olmaz; loading durumu route'un `pendingComponent`'i ile ele alınır. Aynı ekranda hem `useSuspenseQuery` hem `isPending` kontrolü yazma.

---

## Forms

Formlar `react-hook-form` + `zod` ile oluşturulur. Validation kurallarını backend davranışından bağımsız uydurma; API sözleşmesi bilinmiyorsa `api/API.md`'yi incele.

---

## Notifications

Bildirimler UI katmanında yönetilir. `sonner` component veya feature seviyesinde kullanılabilir; API service, Axios interceptor veya route guard içinde kullanılmaz.

---

## Kod Kuralları

- Dosya adları **kebab-case**: `app-sidebar.tsx`, `route-pending.tsx`, `use-products.ts`, `columns.tsx`. Export edilen component adı PascalCase kalır. (shadcn CLI kebab-case üretiyor; proje genelinde tek stil için tümü buna uyduruldu.)
- Yorum yazma; isimlendirme açıklayıcı olsun.
- `console.log` bırakma.
- Ham `axios` import etme; tüm istekler `src/api/axios-client.ts` üzerinden gider.

---

## Scope Control

İstenen görev dışında refactor yapma. Kullanıcı yalnızca bir component istediğinde:

- yeni hook oluşturma,
- yeni utility oluşturma,
- yeni route ekleme,
- yeni dependency ekleme,
- architecture değişikliği yapma,
- ilgisiz dosyaları düzenleme.

Bir problem mevcut görev kapsamında çözülmüyorsa kapsamı kendin genişletmek yerine kullanıcıya bildir.

---

## Validation

Her değişiklikten sonra:

```bash
npx tsc -b
```

**`npx tsc --noEmit` kullanma.** Kök `tsconfig.json` solution-style olduğu için 0 dosya kontrol eder ve sahte-yeşil sonuç verir.

Gerektiğinde mevcut script'ler:

```bash
pnpm run lint
pnpm run build
```

Görev yalnızca belirli bir dosyayı etkiliyorsa geniş kapsamlı değişiklik yapma.

---

## Documentation

- Kurulum ve araç yapılandırması: `INSTALLATION.md`
- API sözleşmesi: `api/API.md`
- Karar gerekçeleri: `docs/decisions.md`
- Feature gereksinimleri: `.specs/` altındaki ilgili spec
- Mimari kurallar: bu dosya (§ Mimari)
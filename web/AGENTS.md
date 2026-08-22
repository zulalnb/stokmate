## Proje

StokMate, küçük bir perakende zincirinin merkez ofis çalışanları için geliştirilmiş dahili stok yönetim panelidir.

Uygulama:

- Vite + React + TypeScript kullanır.
- Tamamen client-side çalışır; SSR ve SEO yoktur.
- Kimlik doğrulamasının arkasında çalışır.
- Server state TanStack Query tarafından yönetilir.
- Routing TanStack Router ile yapılır.
- HTTP istekleri Axios ile yapılır.
- UI shadcn/ui + Tailwind ile oluşturulur.

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

### Feature Hooks

Server-state query ve mutation'ları feature'ların `hooks/` klasöründe tut:

```
src/features/
├── products/
│   ├── hooks/
│   │   └── use-products.ts
│   └── components/
├── categories/
│   └── hooks/
│       └── use-categories.ts
├── brands/
│   └── hooks/
│       └── use-brands.ts
└── auth/
    ├── hooks/
    │   └── use-auth.ts
    └── components/
```

Tek hook dosyası, tek React hook anlamına gelmez. Bir feature'ın server-state işlemleri aynı dosyada toplanabilir.

`src/hooks/` yalnızca feature bağımsız reusable hook'lar içindir (`use-debounce.ts`, `use-media-query.ts`, `use-click-outside.ts`). Domain'e ait server-state hook'ları buraya konmaz.

### Query tanımları — `queryOptions` fabrikası zorunlu

Query key ve `queryFn` doğrudan hook'un içine yazılmaz. Önce dışa açık bir `queryOptions` fabrikası tanımlanır, hook yalnızca onu sarar:

```ts
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
loader: ({ context, deps }) =>
  context.queryClient.ensureQueryData(productsQuery(deps)),
```

Aynı query için key veya `queryFn` ikinci bir yerde tekrar yazılmaz; yazılırsa ayarlar zamanla ayrışır ve aynı veri için iki istek oluşur.

### Kapsam — mevcut hook ve fabrika listesi

Web panelinin kapsamı listeleme, detay ve güncellemedir:

```
meQuery()                 (fabrika — guard'da kullanılır)
useLogin()
useLogout()
productsQuery(filters)    useProducts(filters)
productQuery(id)          useProduct(id)
                          useUpdateProduct()
                          useUpdateProductStock()
categoriesQuery()         useCategories()
brandsQuery()             useBrands()
statsQuery()              useStats()
```

Bu liste örnek değil, kapsamdır. Ürün oluşturma ve silme web kapsamında yoktur. Listede olmayan bir hook veya fabrika eklemeden önce kullanıcıya sor.

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
export const Route = createFileRoute('/_authenticated')({
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
  component: () => <Outlet />,
})
```

İki aşamalı olmasının sebebi: `hasSession()` senkron ve ağ isteği gerektirmez, token hiç yoksa `/auth/me` çağrısı boşuna atılmaz. Token varsa geçerliliği `meQuery()` ile doğrulanır; token bayatsa interceptor refresh dener, o da başarısız olursa query reddedilir ve kullanıcı `/login`'e yönlendirilir.

Kurallar:

- Yeni korumalı ekran `src/routes/_authenticated/` altına eklenir. Ek guard yazılmaz.
- `ProtectedRoute` benzeri bir component oluşturma; koruma route katmanındadır.
- Component içinde `if (!isAuthenticated) navigate('/login')` gibi yönlendirme yazma.
- `/login` bu ağacın dışındadır (`src/routes/login.tsx`) ve korumalı değildir.
- `meQuery()` yalnızca oturum doğrulama içindir; kullanıcı bilgisini ekranda göstermek gerekirse aynı fabrika `useQuery` ile kullanılır, ikinci bir query tanımlanmaz.

### Çıkış

`useLogout()`:

1. `POST /auth/logout` çağırır (hata alsa bile akış devam eder).
2. `lib/auth-storage`'ı temizler.
3. `queryClient.clear()` çağırır.
4. `/login`'e yönlendirir.

`queryClient.clear()` atlanamaz: `['me']` cache'de kalırsa `ensureQueryData(meQuery())` ağ isteği atmadan başarılı döner ve guard bir sonraki kullanıcıyı içeri alır.

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

---

## Pagination

`GET /products` response'unda `totalPages` bulunmaz. Gerektiğinde `Math.ceil(total / pageSize)` ile hesapla. API'nin maksimum `pageSize` değeri `100`'dür.

---

## Routing

Route ağacı:

```
src/routes/
├── __root.tsx              layout + errorComponent + notFoundComponent
├── login.tsx               korumasız
├── _authenticated.tsx      guard (bkz. § Authentication)
└── _authenticated/
    ├── index.tsx
    └── dashboard.tsx
```

- Route'lar `src/routes/` altında, TanStack Router file-based routing ile tanımlanır.
- Korumalı her ekran `_authenticated/` altına konur; başka yere korumalı ekran eklenmez.
- `src/routeTree.gen.ts` otomatik üretilir: elle değiştirme, `.gitignore`'a ekleme, commit edilmelidir.
- Liste filtreleri route'un `validateSearch` şemasında tanımlanır.
- String olmayan path parametreleri için mevcut `params.parse` ve `params.stringify` yaklaşımını koru.
- `beforeLoad` ve `loader` fonksiyonları `queryOptions` fabrikalarını kullanır (bkz. § Mimari).
- Yönlendirme `throw redirect({ ... })` ile yapılır; `beforeLoad` içinde `navigate` çağrılmaz.

---

## TypeScript

- `any` ve `as any` kullanma.
- Gereksiz type assertion kullanma.
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

---

## Loading / Error / Empty

Her veri ekranı üç durumu ele almalıdır.

**Loading** — ortalanmış spinner kullanma; gerçek içeriğin yapısını taklit eden shadcn `Skeleton` kullan.

**Error** — `ApiError.message` göster, ilgili query'nin `refetch` fonksiyonunu çağıran "Tekrar dene" butonu koy.

**Empty** — filtre varsa sonuç bulunamadığını belirt ve filtreleri temizleme seçeneği sun; filtre yoksa henüz veri bulunmadığını belirt.

Guard sırasında (`beforeLoad` beklerken) router'ın `defaultPendingComponent`'i devreye girer; korumalı ekranlar bu bekleme için ayrıca kendi loading durumunu yazmaz.

---

## Forms

Formlar `react-hook-form` + `zod` ile oluşturulur. Validation kurallarını backend davranışından bağımsız uydurma; API sözleşmesi bilinmiyorsa `api/API.md`'yi incele.

---

## Notifications

Bildirimler UI katmanında yönetilir. `sonner` component veya feature seviyesinde kullanılabilir; API service, Axios interceptor veya route guard içinde kullanılmaz.

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
- Feature gereksinimleri: `.specs/` altındaki ilgili spec
- Mimari kurallar: bu dosya (§ Mimari)
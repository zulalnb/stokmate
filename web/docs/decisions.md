# Kararlar

Bu dosya, projede verilen mimari ve kütüphane kararlarının gerekçelerini tutar.
Her karar: **seçilen**, **elenen alternatif**, **gerekçe**, **bedel**.

Yeni bir karar verildiğinde buraya bir başlık eklenir. README'nin "hangi kütüphaneleri neden tercih ettiniz" bölümü bu dosyadan yazılır.

---

## Vite

**Seçilen:** Vite + React + TypeScript
**Elenen:** Next.js

Panelin tamamı kimlik doğrulaması arkasında ve tümüyle client-side; SSR ve SEO gereksinimi yok. Next.js seçilseydi neredeyse her dosya `"use client"` ile başlayacak, token sunucu bileşenlerinden okunamadığı için cookie + middleware kurmak gerekecekti — API ise `Authorization` başlığı bekliyor ve refresh rotasyonu client'ta yönetiliyor.

**Bedel:** Yok. İleride SSR gerekirse taşınması gerekir.

---

## TanStack Router

**Seçilen:** TanStack Router (file-based routing)
**Elenen:** React Router

Liste filtreleri URL'de tutuluyor; `validateSearch` şeması bunları zod ile doğrulayıp tipliyor ve `Route.useSearch()` tipli obje döndürüyor. `beforeLoad` render'dan önce çalıştığı için korumalı ekran bir kare bile görünmüyor. Loader'lar `ensureQueryData` ile veriyi önden çekiyor.

**Bedel:** `routeTree.gen.ts` üretimi ve commit edilmesi, plugin sırası kısıtı (`tanstackRouter()` `react()`'ten önce gelmeli), React Router'a göre daha uzun kurulum. Rota dosyalarını sonradan taşımak üretilmiş tipleri yeniden
oluşturmayı gerektiriyor.

---

## Axios

**Seçilen:** Axios + interceptor'lar
**Elenen:** Kendi `fetch` sarmalayıcım

Single-flight refresh ve `ApiError` dönüşümü response interceptor'ında tek yerde toplanıyor; çağrı yerleri `baseURL`, Bearer başlığı ve hata dönüşümünü hiç bilmiyor.

**Bedel:** ~13 KB bundle. Mobil tarafta aynı bağımlılık tekrar eklenecek.
`/auth/refresh` için interceptor'sız ikinci bir instance gerekiyor — aksi halde refresh'in kendi 401'i interceptor'ı yeniden tetikleyip sonsuz döngü yaratıyor.
Ayrıca API hata gövdeleri `text/plain` olduğu için Axios'un `JSON.parse` denemesi başarısız oluyor ve `error.response.data` string olarak geliyor; bu davranış `errors.ts` içinde ayrıca ele alınıyor.

---

## Auth durumu: abone olunabilir düz modül

**Seçilen:** `lib/auth-storage` (React tanımayan modül) + `useSyncExternalStore`
**Elenen:** React Context, Zustand

Axios interceptor bir React modülü değil; token'ı senkron okumak ve yazmak zorunda, Context'ten okuyamaz. Zustand okuyabilirdi (`getState()`) ama o zaman kütüphane React dışından çağrılıyor — yani düz bir modül olarak kullanılıyor demek. O modül elle yazılınca bağımlılık sıfır kalıyor ve token'ın tek bir kaynağı oluyor.

**Bedel:** `useSyncExternalStore` aboneliği elle kuruluyor (~30 satır).
`persist` gibi hazır middleware yok.

---

## Oturum koruması: `_authenticated` pathless layout route

**Seçilen:** Tek `beforeLoad` guard'ı; korumalı ekranlar `_authenticated/` altında
**Elenen:** `<ProtectedRoute>` sarmalayıcı bileşeni, ekran başına guard

Guard tek dosyada duruyor; yeni korumalı ekran eklemek klasöre dosya koymaktan ibaret. Aynı dosya panel yerleşimini de (sidebar + header + `Outlet`) taşıdığı için layout ve koruma birlikte yaşıyor. Kontrol iki aşamalı: `hasSession()` senkron ve ağ isteği gerektirmiyor, token yoksa `/auth/me` boşuna çağrılmıyor; token varsa geçerliliği `meQuery()` ile doğrulanıyor, bayat token'da interceptor refresh deniyor.

URL'de `_authenticated` görünmüyor, bu yüzden `/dashboard/products` gibi bir önek de kullanılmadı — panelin tamamı zaten kimlik doğrulaması arkasında, prefix bilgi taşımıyor.

**Bedel:** Guard `await` içerdiği için `defaultPendingComponent` gerekiyor. `useLogout` içinde `queryClient.clear()` atlanırsa `['me']` cache'de kalıyor ve guard bir sonraki girişte ağ isteği atmadan geçiyor.

---

## `queryOptions` fabrikası zorunluluğu

**Seçilen:** Query tanımı fabrika olarak export edilir, hook onu sarar
**Elenen:** Key ve `queryFn`'i doğrudan hook içinde tanımlamak

`beforeLoad` ve `loader` React hook çağıramıyor. Tanım yalnızca hook içinde olsaydı route katmanında key'i elle ikinci kez yazmak gerekirdi; iki tanım zamanla ayrışır ve aynı veri için iki istek çıkardı.

**Bedel:** Her query için bir satır fazladan boilerplate.

---

## Login sonrası `/auth/me` çağrısının önlenmesi

**Seçilen:** `useLogin()` başarılı olduğunda `queryClient.setQueryData(meQuery().queryKey, data.user)` ile cache'i login cevabındaki `user` ile doldurmak
**Elenen:** Hiçbir şey yapmadan `_authenticated` guard'ının `/auth/me`'yi tekrar çağırmasına izin vermek

Login cevabı zaten `user` içeriyor (`AuthTokens.user`). Guard `ensureQueryData(meQuery())` çağırdığında cache boşsa gereksiz bir round-trip oluşuyordu; `staleTime` (30 sn) içinde cache doldurulunca guard veriyi ağdan çekmeden kullanıyor.

**Bedel:** `useLogin()` artık `useQueryClient()`'a bağımlı (`useLogout()` zaten öyleydi). Cache'e yazılan veri `meQuery()`'nin `queryFn`'inin döneceğiyle birebir aynı şekilde tipli tutulmalı; `authService.me` ile login response'undaki `user` şekli ayrışırsa cache tutarsız veri taşır.

---

## TanStack Table

**Seçilen:** shadcn `table` bileşenleri + `@tanstack/react-table`
**Elenen:** Düz `<Table>` + elle yazılmış satır döngüsü ve sayfalama kontrolleri

Kolon tanımları tek dosyada toplanıyor, hücre render'ı tipli oluyor ve tablo yapısı ekran bileşeninden ayrılıyor. Daha önce çalıştığım bir desen olduğu için kurulum ve hata ayıklama süresi kısaydı. Tablo kodu sabit bir 4 dosyalık şablona oturuyor: `data-table-features.tsx` (tableFeatures config), `columns.tsx` (kolonlar), `sortable-header.tsx` (sıralanabilir başlık), `data-table.tsx` (`useTable()` + render) — yeni bir feature'da tablo gerektiğinde aynı yapı tekrarlanır.

**Bedel:** Sayfalama ve filtreleme API tarafında yapıldığı için kütüphanenin veri işleme katmanı kullanılmıyor (`getPaginationRowModel` / `getSortedRowModel`/`filteredRowModel` eklenmiyor). Sıralama için istisna: `rowSortingFeature` eklendi, ama yalnızca state ve column API'si (`column.getIsSorted()`, `column.getToggleSortingHandler()`) için — `sortedRowModel` hiç eklenmediğinden satırlar client'ta yeniden sıralanmıyor, sıralama hâlâ sunucu tarafında. Ayrıca projede kütüphanenin yeni API'si (`tableFeatures`, `useTable`) kullanılıyor; internetteki örneklerin çoğu eski API'yi gösterdiği için referans ararken dikkat gerekiyor.

---

## shadcn/ui — `base-vega` stili

**Seçilen:** shadcn/ui, `base-vega` stili (Base UI tabanlı)
**Elenen:** Hazır UI kit (MUI, Ant Design, Mantine)

Bileşenler repoya kopyalanıyor, kütüphane bağımlılığı ve tema geçersiz kılma savaşı olmuyor; Tailwind ile aynı zihinsel model kullanılıyor. Sidebar bloğu hazır geldiği için panel yerleşimi kısa sürdü.

**Bedel:** Base UI, Radix tabanlı yaygın shadcn örneklerinden farklı bir API'ye sahip — `asChild` yerine `render` prop'u ve `nativeButton={false}` kullanılıyor. Örnek kod ararken bu fark gözetilmeli. `src/components/ui/` altındaki dosyalar CLI'ın ürettiği haliyle bırakılıyor.

---

## Feature-based klasörleme

**Seçilen:** `src/features/<feature>/{components,hooks}` + `src/api/services/`
**Elenen:** Tip bazlı klasörleme (tüm hook'lar `src/hooks/`, tüm bileşenler `src/components/`)

Bir feature'a dokunurken tek klasör açılıyor; server-state hook'ları kendi domain'iyle aynı yerde duruyor. `src/components/` yalnızca uygulama geneline ait bileşenlere (sidebar, header, route fallback'leri) ayrıldı, `src/hooks/` ise domain'siz reusable hook'lara.

**Bedel:** Küçük projede klasör sayısı fazla görünüyor.

---

## Dosya adlandırma: kebab-case

**Seçilen:** Tüm dosyalar kebab-case (`route-pending.tsx`, `use-products.ts`)
**Elenen:** Component dosyaları PascalCase

shadcn CLI ürettiği dosyaları kebab-case adlandırıyor ve bu dosyalar elle düzenlenmiyor. Projede iki stil yan yana durmasın diye tümü kebab-case'e çevrildi. Export edilen component adı PascalCase kalıyor.

**Bedel:** Başlangıçta PascalCase yazılan üç dosya yeniden adlandırıldı.

---

## Ortak kodun web ve mobile'da kopyalanması

**Seçilen:** `types.ts`, `money.ts`, `enums.ts` iki projede de ayrı kopya
**Elenen:** pnpm workspace + `packages/shared`

React Native, Metro bundler yüzünden workspace hoisting'e karşı hassas;
`watchFolders` ve `extraNodeModules` yapılandırması, TypeScript path'lerinin iki tarafta hizalanması ve EAS build'de lokalden farklı davranma riski var. Bu ölçekte kurulum maliyeti getirisinden fazla.

**Bedel:** Ortak bir dosya değişirse diğer kopyanın elle güncellenmesi gerekiyor. Gerçek projede `packages/shared` doğru çözüm olurdu.

---

## Dokümantasyon ayrımı

**Seçilen:** `AGENTS.md` (sürekli geçerli kurallar), `INSTALLATION.md` (kurulum ve tuzaklar), `docs/decisions.md` (gerekçeler), `.specs/` (feature planları)
**Elenen:** Tek bir büyük doküman veya ayrı bir `ARCHITECTURE.md`

Ayrımın ölçüsü zaman: kural her görevde geçerli, kurulum bir kez yapıldı, karar geçmişte verildi, spec o anki iş için. `AGENTS.md` her turda okunduğu için kurulum detayı konursa sinyal düşüyor. Mimari kurallar ayrı bir dosyaya çıkarılmadı; ayrı dosya her turda fazladan bir yönlendirme adımı ekliyor ve `AGENTS.md` bu boyutta bölünmeyi gerektirmiyor.

**Bedel:** Bir bilginin hangi dosyaya ait olduğuna her seferinde karar vermek gerekiyor; sınır bulanıklaşırsa iki dosya ayrışabilir.

---

## Açık — karar verilmedi

**Bonus senaryo:** Liste açıkken başka bir istemciden gelen güncellemenin görünmesi. Seçenekler: `refetchInterval` ile polling, `refetchOnWindowFocus`, veya .NET tarafına SSE ucu. Karar verildiğinde bu bölüm yukarı taşınır ve `ROADMAP.md` § Açık kararlar güncellenir.

**Satır tıklaması:** Ürün satırının tamamı detaya mı gidecek, yoksa ayrı bir işlem sütunu mu olacak? Detay rotasına başlamadan önce kararlaştırılmalı.
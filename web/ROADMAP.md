# Yol Haritası

`web/` projesinin planlanan ilerleyişi. Kurulum detayları için `INSTALLATION.md`, kurallar için `AGENTS.md`, karar gerekçeleri için `docs/decisions.md`, feature bazlı planlama için `.specs/` klasörüne bakın.

---

## Faz 0 — Kurulum ✅ Tamamlandı

Detaylar: `INSTALLATION.md`.

- [x] Vite + React + TypeScript
- [x] Tailwind v4
- [x] Prettier
- [x] shadcn/ui
- [x] TanStack Router
- [x] TanStack Query
- [x] `.env.example` + `VITE_API_URL`
- [x] Axios
- [x] Route iskeleti: `__root.tsx`, `login.tsx`, `_authenticated.tsx` + `_authenticated/`

## Faz 1 — Auth & HTTP katmanı 🔜 Sırada

**HTTP altyapısı**

- [ ] `src/api/axios-client.ts` — tek Axios instance (`baseURL: VITE_API_URL`), değer yoksa açıkça hata fırlat.
- [ ] `src/api/errors.ts` — `ApiError` (`message`, `status`). Hata gövdesi `error.response.data` üzerinden **string** olarak alınır; ağ hatasında `status: 0`.
- [ ] `src/api/interceptors.ts` — request: `/auth/login` ve `/auth/refresh` dışına Bearer header; response: `ApiError` normalizasyonu + single-flight refresh (eşzamanlı 401'lerde tek `/auth/refresh`, istek başına tek retry, `_retry` bayrağı).
- [ ] Refresh çağrısı için interceptor'sız ayrı Axios instance — "tek instance" kuralının tek istisnası.

**Oturum**

- [ ] `lib/auth-storage` — token okuma/yazma/temizleme + `hasSession()`. React tanımaz; interceptor senkron okur, React `useSyncExternalStore` ile abone olur.
- [ ] `src/api/services/auth.service.ts` — login, refresh, logout, me.
- [ ] `src/features/auth/hooks/use-auth.ts` — `meQuery()` fabrikası, `useLogin()`, `useLogout()`.
- [ ] `useLogout()` sırası: `POST /auth/logout` → `auth-storage` temizle → `queryClient.clear()` → `/login`. `clear()` atlanırsa `['me']` cache'de kalır ve guard bir sonraki girişte ağ isteği atmadan geçer.
- [ ] `_authenticated.tsx` guard'ı: `hasSession()` senkron kontrol → `ensureQueryData(meQuery())` ile doğrulama → başarısızsa `throw redirect({ to: '/login' })`.
- [ ] `createRouter`'a `defaultPendingComponent` — guard `await` içerdiği için ilk açılışta boş ekran görünmesin.
- [ ] Giriş ekranı (`POST /auth/login`).

## Faz 2 — Ürün Kataloğu

- [ ] `src/api/services/products.service.ts` — liste, detay, güncelleme, stok güncelleme. (Oluşturma ve silme web kapsamında değil.)
- [ ] `src/features/products/hooks/use-products.ts` — `productsQuery(filters)`, `productQuery(id)` fabrikaları + `useProducts`, `useProduct`, `useUpdateProduct`, `useUpdateProductStock`.
- [ ] Ürün listesi: filtreler (`q`, `categoryId`, `brandId`, `status`) ve sayfalama/sıralama URL search parametrelerinde, `validateSearch` ile tipli.
- [ ] Route loader'ları `ensureQueryData(productsQuery(...))` ile aynı fabrikayı kullanır — key veya `queryFn` ikinci kez yazılmaz.
- [ ] Üç durum: loading (Skeleton), error (retry butonu), empty (filtreli/filtresiz ayrımı) — `AGENTS.md` § Loading / Error / Empty.
- [ ] Ürün detayı ve düzenleme formu (react-hook-form + zod); `PUT /products/{id}`'e `costPrice`, `supplierId`, `description` alanları detaydan alınıp geri gönderilir.
- [ ] Stok güncelleme (`PATCH /products/{id}/stock`).

## Faz 3 — Lookup verileri

- [ ] `categories.service.ts`, `brands.service.ts`.
- [ ] `categoriesQuery()`, `brandsQuery()` fabrikaları + `useCategories()`, `useBrands()` — filtre ve formlarda kullanım.
- [ ] Sabit listeler olduğu için yüksek `staleTime`.

Tedarikçi listesi yalnızca `PUT` gövdesindeki `supplierId` için gerekiyor; ayrı bir ekranı yok. Formda alan gösterilmeyecekse `suppliers.service.ts` yazılmaz.

## Faz 4 — İstatistikler

- [ ] `stats.service.ts` + `statsQuery()` fabrikası + `useStats()` — `GET /products/stats` ile stok durumu özeti (toplam, tükenen, azalan).

## Faz 5 — Teslim

- [ ] `docs/decisions.md` — Faz 0-4 boyunca verilen kararların gerekçeleri (Vite, TanStack Router, Axios, auth deseni, feature klasörleme).
- [ ] `README.md` — çalıştırma adımları, varsayımlar, kütüphane gerekçeleri (`docs/decisions.md`'den), yetişmeyenler.
- [ ] Bonus senaryo kararı uygulanır veya kapsam dışı olarak README'de belirtilir.

---

## Açık kararlar

- Background-refetch ve stale-data durumlarının görsel karşılığı henüz tanımlı değil (`AGENTS.md` § Loading / Error / Empty yalnızca üç temel durumu kapsıyor).
- `react-hook-form` + `zod` kurulumu henüz yapılmadı — Faz 1/2 form işiyle gelecek.
- Bonus senaryo (liste açıkken başka istemciden gelen güncellemenin görünmesi) için yaklaşım seçilmedi: polling / `refetchOnWindowFocus` / SSE.
- Kullanıcı bilgisinin (`/auth/me`) arayüzde gösterilip gösterilmeyeceği belirsiz. Gösterilecekse `meQuery()` aynı fabrika üzerinden `useQuery` ile kullanılır, ikinci bir query tanımlanmaz.

## Kapsam dışı (şimdilik)

- SSR / SEO — proje tamamen istemci taraflı.
- Ürün oluşturma ve silme — görev web tarafında yalnızca listeleme, detay ve güncelleme istiyor.
- Tedarikçi ekranı — `GET /suppliers` yalnızca `PUT` gövdesi için gerekli.
- Bildirimler (`sonner`) kurulumu — ilk mutation'a ihtiyaç doğduğunda.
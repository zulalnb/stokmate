# Yol Haritası

`web/` projesinin planlanan ilerleyişi. Kurulum detayları için `INSTALLATION.md`, kurallar için `AGENTS.md`, karar gerekçeleri için `docs/decisions.md`, feature bazlı planlama için `.specs/` klasörüne bakın.

---

## Faz 0 — Kurulum ✅ Tamamlandı

Detaylar: `INSTALLATION.md`.

- [x] Vite + React + TypeScript
- [x] Tailwind v4
- [x] Prettier
- [x] shadcn/ui (`base-vega`)
- [x] TanStack Router
- [x] TanStack Query
- [x] `.env.example` + `VITE_API_URL`
- [x] Axios
- [x] shadcn sidebar bloğu
- [x] TanStack Table
- [x] `route-pending`, `route-error-fallback`, `route-not-found` → router varsayılanları
- [x] Component dosya adları kebab-case'e çevrildi

## Faz 1 — Auth & HTTP katmanı 🔄 Devam ediyor

**HTTP altyapısı**

- [x] `src/api/axios-client.ts` — tek Axios instance (`baseURL: VITE_API_URL`), değer yoksa açıkça hata fırlat.
- [x] `src/api/errors.ts` — `ApiError` (`message`, `status`). Hata gövdesi `error.response.data` üzerinden **string** olarak alınır; ağ hatasında `status: 0`.
- [x] `src/api/interceptors.ts` — request: Bearer header; response: `ApiError` normalizasyonu + single-flight refresh.
- [x] Refresh çağrısı için interceptor'sız ayrı Axios instance.

**Oturum**

- [x] `lib/auth-storage` — token okuma/yazma/temizleme + `hasSession()`.
- [x] `src/api/services/auth.service.ts`
- [x] `src/features/auth/hooks/use-auth.ts` — `meQuery()`, `useLogin()`, `useLogout()`
- [x] `_authenticated.tsx` guard'ı + panel yerleşimi (sidebar + header + `Outlet`)
- [x] Giriş ekranı (`POST /auth/login`)
- [ ] `useLogout()` sırasının doğrulanması: `POST /auth/logout` → `auth-storage` temizle → `queryClient.clear()` → `/login`. `clear()` atlanırsa `['me']` cache'de kalır ve guard bir sonraki girişte ağ isteği atmadan geçer.
- [ ] `INSTALLATION.md` § 8 doğrulama listesinin elle çalıştırılması (özellikle single-flight refresh).

## Faz 2 — Ürün Kataloğu 🔜 Sırada

**Taşıma işleri** (detay rotası eklenmeden önce yapılmalı)

- [ ] `productsQuery` fabrikası route dosyasından `src/features/products/hooks/use-products.ts`'e taşınır — detay rotası ve mutation'lar aynı fabrikayı kullanacak.
- [ ] `columns` tanımı `src/features/products/components/columns.tsx`'e taşınır.
- [ ] Tablo iskeleti `src/features/products/components/` altına taşınır; satır sayısı `pageSize` ile uyumlu olur.
- [ ] Route dosyasındaki yerel `ErrorComponent` kaldırılır; router'ın `defaultErrorComponent`'i kullanılır.
- [ ] `_authenticated/products.tsx` → `_authenticated/products/index.tsx` + `$id.tsx`. Sonra taşımak `routeTree.gen.ts` ve link tiplerini yeniden üretmeyi gerektirir.

**Liste**

- [ ] `validateSearch` şeması genişletilir: `q`, `categoryId`, `brandId`, `status`, `sort`, `dir`, `page`.
- [ ] Sayfalama bağlantıları `search={(prev) => ({ ...prev, page })}` biçimine çevrilir — nesne biçimi filtreleri siliyor.
- [ ] Arama kutusu (debounce) + kategori/marka filtreleri; filtre değişiminde `page` 1'e döner.
- [ ] Kolon başlıklarına sıralama (`name` | `price` | `stock` | `updatedAt`).
- [ ] Kolon genişlikleri `meta.className` + `table-fixed` ile sabitlenir.
- [ ] Üç durum: loading (`pendingComponent` iskeleti), error (varsayılan fallback), empty (filtreli/filtresiz ayrımı).
- [ ] Stok rozeti: `stock === 0` ve `stock <= minStock` ayrı gösterilir.

**Detay ve güncelleme**

- [ ] `productQuery(id)` + `useProduct(id)`; `$id.tsx` loader'ı aynı fabrikayı kullanır.
- [ ] Düzenleme formu (react-hook-form + zod); `PUT /products/{id}`'e `costPrice`, `supplierId`, `description` detaydan alınıp geri gönderilir.
- [ ] `useUpdateProduct()` — `onSuccess`'te `['products']` invalidate.
- [ ] Stok güncelleme (`PATCH /products/{id}/stock`).

## Faz 3 — Lookup verileri

- [ ] `categories.service.ts`, `brands.service.ts`
- [ ] `categoriesQuery()`, `brandsQuery()` + `useCategories()`, `useBrands()` — filtre select'lerinde kullanım.
- [ ] Sabit listeler olduğu için yüksek `staleTime`.

Tedarikçi listesi yalnızca `PUT` gövdesindeki `supplierId` için gerekiyor; ayrı ekranı yok. Formda alan gösterilmeyecekse `suppliers.service.ts` yazılmaz.

## Faz 4 — İstatistikler

- [ ] `stats.service.ts` + `statsQuery()` + `useStats()` — `GET /products/stats` özeti (toplam, tükenen, azalan), ürün listesinin üstünde kart olarak.

## Faz 5 — Teslim

- [ ] `docs/decisions.md` tamamlanır (Faz 0-4 kararları).
- [ ] `README.md` — çalıştırma adımları, varsayımlar, kütüphane gerekçeleri, yetişmeyenler.
- [ ] Bonus senaryo uygulanır veya kapsam dışı olarak README'de belirtilir.
- [ ] `.env.example` ve `.gitignore` kontrolü; repo temiz klonda çalışır durumda.

---

## Açık kararlar

- Background-refetch ve stale-data durumlarının görsel karşılığı henüz tanımlı değil (`AGENTS.md` § Loading / Error / Empty yalnızca üç temel durumu kapsıyor).
- `react-hook-form` + `zod` kurulumu henüz yapılmadı — Faz 2 form işiyle gelecek. (`zod` `validateSearch` için zaten kurulu.)
- Bonus senaryo (liste açıkken başka istemciden gelen güncellemenin görünmesi) için yaklaşım seçilmedi: polling / `refetchOnWindowFocus` / SSE.
- Kullanıcı bilgisinin (`/auth/me`) arayüzde gösterilip gösterilmeyeceği belirsiz. Gösterilecekse `meQuery()` aynı fabrika üzerinden `useQuery` ile kullanılır.
- Ürün satırına tıklanınca detaya gitme davranışı: satırın tamamı mı tıklanabilir olacak, yoksa ayrı bir işlem sütunu mu?

## Kapsam dışı (şimdilik)

- SSR / SEO — proje tamamen istemci taraflı.
- Ürün oluşturma ve silme — görev web tarafında yalnızca listeleme, detay ve güncelleme istiyor.
- Tedarikçi ekranı — `GET /suppliers` yalnızca `PUT` gövdesi için gerekli.
- Bildirimler (`sonner`) kurulumu — ilk mutation'a ihtiyaç doğduğunda.
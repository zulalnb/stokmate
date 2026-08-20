# Yol Haritası

`web/` projesinin planlanan ilerleyişi. Kurulum detayları için `INSTALLATION.md`, kurallar için `AGENTS.md`, feature bazlı planlama için `.specs/` klasörüne bakın.

---

## Faz 0 — Kurulum ✅ Tamamlandı

Detaylar: `INSTALLATION.md`.

- [x] Vite + React + TypeScript
- [x] Tailwind v4
- [x] Prettier
- [x] shadcn/ui
- [x] TanStack Router
- [x] TanStack Query

## Faz 1 — Auth & HTTP katmanı 🔜 Sırada

- [ ] `lib/http.ts` — tek `fetch` sarmalayıcı, `ApiError` (`response.text()` ile hata gövdesi okuma, `response.json()` **yasak**).
- [ ] `accessToken`/`refreshToken` akışı, single-flight refresh (aynı anda birden fazla 401'de tek `/auth/refresh` çağrısı).
- [ ] Auth context (yalnızca kimlik doğrulama için — server state değil).
- [ ] Giriş ekranı (`POST /auth/login`).

## Faz 2 — Ürün Kataloğu

- [ ] Ürün listesi: filtreler (`q`, `categoryId`, `brandId`, `status`) ve sayfalama/sıralama URL search parametrelerinde, `validateSearch` ile tipli.
- [ ] Üç durum: loading (Skeleton), error (retry butonu), empty (filtreli/filtresiz ayrımı) — `AGENTS.md` § Her Ekranda Üç Durum.
- [ ] Ürün detayı, oluşturma/düzenleme formu (react-hook-form + zod), `PUT /products/{id}`'in tüm alanları geri gönderme kuralına dikkat.
- [ ] Stok güncelleme (`PATCH /products/{id}/stock`).
- [ ] Query key'leri ve invalidation: `AGENTS.md` - Kod Kuralları'nda zaten tanımlı.

## Faz 3 — Lookup verileri

- [ ] Kategori, marka, tedarikçi listeleri — filtre ve formlarda kullanım.
- [ ] Query key'leri: `['categories']`, `['brands']`.

## Faz 4 — İstatistikler

- [ ] `GET /products/stats` ile stok durumu özeti (toplam, tükenen, azalan).

---

## Açık kararlar

- Background-refetch ve stale-data durumlarının görsel karşılığı henüz tanımlı değil (`AGENTS.md` - Her Ekranda Üç Durum yalnızca loading/error/empty'yi kapsıyor) — bkz. `.specs/web-proje-kurulumu/spec.md` - Açık sorular.
- `react-hook-form` + `zod` kurulumu henüz yapılmadı — Faz 1/2 form işiyle birlikte gelecek.

## Kapsam dışı (şimdilik)

- SSR / SEO — proje tamamen istemci taraflı.
- Bildirimler (`sonner`) kurulumu — ilk mutation'a ihtiyaç doğduğunda.
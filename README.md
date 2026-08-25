# StokMate

Küçük bir perakende zincirinin iç stok yönetim aracı: merkez ofis çalışanları **web panelinden** ürün kataloğunu yönetir (listeler, arar, filtreler, günceller); mağaza personeli ise **mobil uygulamadan** aynı ürünlere bakar ve sahada stok günceller. İkisi de aynı .NET API'yi kullanır.

## Proje yapısı

```
api/      Verilen .NET 8 Web API — dokunulmadı, yalnızca API.md okundu
web/      React + TypeScript merkez ofis paneli
mobile/   React Native (Expo) saha uygulaması
```

Her alt proje kendi kural/gerekçe dokümanlarını taşır — burada tekrar edilmiyor:

- `api/README.md`, `api/API.md` — çalıştırma, uç referansı
- `web/AGENTS.md`, `web/docs/decisions.md`, `web/ROADMAP.md`
- `mobile/AGENTS.md`, `mobile/docs/decisions.md`

## Nasıl çalıştırılır

### API

```bash
cd api
dotnet run --project src/StokMate.Api
```

- Adres: `http://localhost:5080`, Swagger: `http://localhost:5080/swagger`
- Veriler bellek içi tutulur; her `dotnet run` başlangıç verisine döner (80 ürün, 8 kategori, 12 marka, 6 tedarikçi).
- Test kullanıcısı: `test@ornek.com` / `Test1234!`

Detaylar için `api/README.md`.

### Web

```bash
cd web
cp .env.example .env   # VITE_API_URL=http://localhost:5080
pnpm install
pnpm run dev
```

Doğrulama: `npx tsc -b` (dikkat: `npx tsc --noEmit` **değil** — kök `tsconfig.json` solution-style olduğu için 0 dosya kontrol edip sahte-yeşil sonuç verir).

### Mobile

```bash
cd mobile
pnpm install
```

`mobile/.env` repoya committed geliyor; hedefe göre `EXPO_PUBLIC_API_URL` düzeltilmesi gerekir:

| Hedef | Adres |
| --- | --- |
| iOS simülatör / web | `http://localhost:5080` |
| Android emulator | `http://10.0.2.2:5080` |
| Fiziksel cihaz | `http://<makine-IP>:5080` (aynı Wi-Fi ağı) |

Sonra:

```bash
pnpm run ios       # veya
pnpm run android   # veya
pnpm start
```

**APK teslimi:** Repo bir EAS/build pipeline'ı içermiyor. Native Android projesi zaten `expo prebuild` ile üretilmiş durumda (`mobile/android/`), imzasız bir release APK için:

```bash
cd mobile/android
./gradlew assembleRelease
```

kullanılabilir; alternatif olarak bir Expo hesabıyla `eas build -p android --profile preview` de çalışır. Üretilen APK bu repoya dahil değildir, ayrıca paylaşılır.

## Kapsanan özellikler

**Web**
- Giriş, token saklama, 401'de otomatik oturum yenileme / süresi dolunca girişe yönlendirme
- Arama + kategori/marka/durum filtreli, sıralanabilir, sayfalanan ürün listesi
- Ürün detay ekranı
- Tam düzenleme formu — ad / fiyat / stok / durum (+ API'nin zorunlu tuttuğu `costPrice`, `supplierId`, `description`)
- Ürün oluşturma, onay dialoglu silme
- Loading / error / empty durumları
- Stok özeti kartları (toplam / tükenen / kritik stok)

**Mobile**
- Giriş
- Arama + kategori/marka/durum filtreli, infinite-scroll sayfalanan ürün listesi
- Ürün detay ekranı
- Stok güncelleme — saha personelinin asıl işi
- Çıkış

**Bonus (yapıldı):** Web'de liste ve stok özeti 60 saniyede bir kendini tazeliyor (`refetchInterval`) — başka bir istemciden (örn. mobil uygulamadan) gelen bir stok güncellemesi, listede en geç bir dakika içinde görünür. Sekme arka plandayken tazeleme durur. Gerekçe ve elenen alternatifler (`refetchOnWindowFocus` tek başına, SSE) `web/docs/decisions.md`'de kayıtlı.

## Kararlar

Tam gerekçeli kayıtlar `web/docs/decisions.md` ve `mobile/docs/decisions.md`'de (seçilen / elenen / gerekçe / bedel); burada yalnızca özet.

**Web**

- **Vite + React, Next.js değil** — panel tamamen client-side ve kimlik doğrulaması arkasında; SSR/SEO gereksinimi yok. Next.js seçilseydi neredeyse her dosya `"use client"` ile başlayacak, token sunucu bileşenlerinden okunamadığı için cookie + middleware kurmak gerekecekti.
- **TanStack Router, React Router değil** — liste filtreleri URL'de tutuluyor; `validateSearch` şeması zod ile bunları doğrulayıp tipliyor, `beforeLoad` render'dan önce çalıştığı için korumalı ekran bir kare bile görünmüyor.
- **Axios + interceptor'lar, elle yazılmış fetch değil** — single-flight refresh ve `ApiError` dönüşümü response interceptor'ında tek yerde toplanıyor; servis katmanı `baseURL`, Bearer header veya hata dönüşümünü hiç bilmiyor.
- **Auth durumu düz bir modülde (`useSyncExternalStore`), Context/Zustand değil** — axios interceptor bir React bileşeni değil, token'ı senkron okuyup yazabilmesi gerekiyor; Context tek başına bunu sağlamaz, Zustand aynı işi görür ama gereksiz bir bağımlılık eklerdi.
- **`queryOptions` fabrikası zorunlu** — route'ların `beforeLoad`/`loader`'ı React hook çağıramıyor; query key ve `queryFn` yalnızca hook içinde tanımlansaydı route katmanında elle ikinci kez yazmak gerekirdi, iki tanım zamanla ayrışıp aynı veri için iki istek çıkarırdı.
- **TanStack Table, elle yazılmış tablo değil** — sayfalama ve sıralama sunucu tarafında yapıldığı için kütüphanenin veri işleme katmanı (`getPaginationRowModel` vb.) hiç kullanılmıyor; yalnızca tipli kolon tanımı ve render için alındı.
- **shadcn/ui (`base-vega`), hazır bir UI kit (MUI/Ant/Mantine) değil** — bileşenler repoya kopyalanıyor, kütüphane bağımlılığı ve tema geçersiz kılma savaşı olmuyor; Tailwind ile aynı zihinsel model kullanılıyor.

**Mobile**

- Web ile aynı HTTP/state mimarisi bilinçli olarak taşındı: axios + interceptors + katmanlı `client → services → hooks` ayrımı, token için düz bir `useSyncExternalStore` modülü — aynı gerekçeyle, interceptor React'i tanımıyor ve senkron okuma gerekiyor.
- **Route guard: `Stack.Protected`** — expo-router'ın declarative guard API'si; ayrı bir `(app)/` route group veya sarmalayıcı `<ProtectedRoute>` component'i gerekmiyor, `guard={boolean}` hem gösterimi hem yönlendirmeyi kendisi hallediyor.
- **Token refresh: proaktif + reaktif hibrit** — API opaque bir access token + `expiresAt` alanı veriyor (JWT decode yok). Yalnızca reaktif (401 sonrası) olsaydı 15 dakikalık pencere her dolduğunda ilk istek boşuna 401 alıp tekrar denenirdi.
- **`expo-secure-store`, yalnızca native** — mobil öncelikli geliştirme; web build'inde (`expo start --web`) oturum kalıcı olmadığı bilinçli, kayıtlı bir sınır.

**Ortak**

- Web ve mobile arasında kod paylaşımı yok — `types.ts`, `money.ts`, `enums.ts` iki projede de ayrı kopya. React Native/Metro'nun pnpm workspace hoisting'ine hassasiyeti ve `watchFolders`/path hizalama maliyeti, bu ölçekte bir `packages/shared` kurulumunun getirisinden fazla görüldü.
- Bonus senaryo (liste açıkken başka istemciden gelen güncellemenin görünmesi) için `refetchInterval` polling seçildi, `refetchOnWindowFocus` tek başına ve SSE elendi — gerekçe yukarıdaki "Kapsanan özellikler" bölümünde.

## Varsayımlar

- API bellek içi veri tutuyor; her yeniden başlatma verileri sıfırlıyor — demo/test sırasında beklenen davranış olarak kabul edildi.
- `PATCH /products/{id}/stock` hem web servis katmanında tanımlı hem mobilde kullanılıyor; web'de stok değişikliği ayrı bir hızlı-güncelleme değil, tam düzenleme formu (`PUT /products/{id}`) üzerinden yapılıyor — brief'in istediği "ad/fiyat/stok/durum güncelleme" bunu karşılıyor.
- Bonus senaryo için polling (`refetchInterval`) seçildi; SSE backend'e yeni bir uç eklemeyi gerektireceğinden elendi.
- Mobilde web deneyimi (`expo start --web`) öncelik dışı bırakıldı: `expo-secure-store`'un web shim'i boş olduğundan tarayıcıda oturum kalıcı olmuyor. Bilinçli, kayıtlı bir sınır.

## Notlar

- Geliştirme sürecinde Claude Code kullanıldı — brief bunu açıkça serbest bırakıyor.
- Bilinen açık noktalar: web'de arka plan tazelemesinin (60 sn polling) henüz bir görsel karşılığı yok, tablo sessizce güncelleniyor; kategori/marka gibi sabit listeler için planlanan yüksek `staleTime` henüz uygulanmadı (bkz. `web/ROADMAP.md` § Açık kararlar).

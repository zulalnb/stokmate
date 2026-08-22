# Kararlar

Bu dosya, projede verilen mimari ve kütüphane kararlarının gerekçelerini tutar.
Her karar: **seçilen**, **elenen alternatif**, **gerekçe**, **bedel**.

Yeni bir karar verildiğinde buraya bir başlık eklenir. README'nin "hangi
kütüphaneleri neden tercih ettiniz" bölümü bu dosyadan yazılır.

---

## Vite

**Seçilen:** Vite + React + TypeScript
**Elenen:** Next.js

Panelin tamamı kimlik doğrulaması arkasında ve tümüyle client-side; SSR ve SEO
gereksinimi yok. Next.js seçilseydi neredeyse her dosya `"use client"` ile
başlayacak, token'ı sunucu bileşenlerinden okunamadığı için cookie + middleware
kurmak gerekecekti — API ise `Authorization` başlığı bekliyor ve refresh
rotasyonu client'ta yönetiliyor.

**Bedel:** Yok. İleride SSR gerekirse taşınması gerekir.

---

## TanStack Router

**Seçilen:** TanStack Router (file-based)
**Elenen:** React Router

Liste filtreleri URL'de tutuluyor; `validateSearch` şeması bunları zod ile doğrulayıp tipliyor, `useSearch()` tipli obje döndürüyor. `beforeLoad` guard'ı render'dan önce çalıştığı için korumalı ekran bir kare bile görünmüyor.

**Bedel:** `routeTree.gen.ts` üretimi, plugin sırası kısıtı (`react()`'ten önce gelmeli), React Router'a göre daha uzun kurulum.

---

## Axios

**Seçilen:** Axios + interceptor'lar
**Elenen:** Kendi `fetch` sarmalayıcım

Single-flight refresh ve `ApiError` dönüşümü response interceptor'ında tek yerde toplanıyor; çağrı yerleri `baseURL`, Bearer başlığı ve hata dönüşümünü hiç bilmiyor.

**Bedel:** ~13 KB bundle. Mobil tarafta aynı bağımlılık tekrar eklenecek.
Ayrıca `/auth/refresh` için interceptor'sız ikinci bir instance gerekiyor — aksi halde refresh'in kendi 401'i sonsuz döngü yaratıyor.

---

## Auth durumu: abone olunabilir düz modül

**Seçilen:** `lib/auth-storage` (React tanımayan modül) + `useSyncExternalStore`
**Elenen:** React Context, Zustand

Axios interceptor bir React modülü değil; token'ı senkron okumak ve yazmak zorunda. Context'ten okuyamaz. Zustand okuyabilirdi (`getState()`) ama o zaman kütüphane React dışından çağrılıyor, yani düz bir modül olarak kullanılıyor demektir — o modülü kendim yazınca bağımlılık sıfır kalıyor.

**Bedel:** `useSyncExternalStore` aboneliğini elle kurmak gerekiyor (~30 satır).
`persist` gibi hazır middleware yok.

---

## Oturum koruması: `_authenticated` pathless layout route

**Seçilen:** Tek `beforeLoad` guard'ı, korumalı ekranlar `_authenticated/` altında
**Elenen:** `<ProtectedRoute>` sarmalayıcı bileşeni, ekran başına guard

Guard tek dosyada duruyor; yeni korumalı ekran eklemek klasöre dosya koymaktan ibaret. Kontrol iki aşamalı: `hasSession()` senkron ve ağ isteği gerektirmiyor, token yoksa `/auth/me` boşuna çağrılmıyor. Token varsa geçerliliği `meQuery()` ile doğrulanıyor; bayat token'da interceptor refresh deniyor, o da başarısızsa `/login`'e yönlendiriliyor.

**Bedel:** Guard `await` içerdiği için `defaultPendingComponent` gerekiyor.
`useLogout` içinde `queryClient.clear()` atlanırsa `['me']` cache'de kalıyor ve guard bir sonraki girişte ağ isteği atmadan geçiyor.

---

## `queryOptions` fabrikası zorunluluğu

**Seçilen:** Query tanımı fabrika olarak export edilir, hook onu sarar
**Elenen:** Key ve `queryFn`'i doğrudan hook içinde tanımlamak

`beforeLoad` ve `loader` React hook çağıramıyor. Tanım yalnızca hook içinde olsaydı route katmanında key'i elle ikinci kez yazmak gerekirdi; iki tanım zamanla ayrışır ve aynı veri için iki istek çıkardı.

**Bedel:** Her query için bir satır fazladan boilerplate.

---

## Feature-based klasörleme

**Seçilen:** `src/features/<feature>/hooks/` + `src/api/services/`
**Elenen:** Tip bazlı klasörleme (`src/hooks/`, `src/services/` altında hepsi)

Server-state hook'ları kendi domain'iyle aynı yerde duruyor; bir feature'a dokunurken tek klasör açılıyor. `src/hooks/` yalnızca domain'siz reusable hook'lar için ayrıldı (`use-debounce`, `use-media-query`).

**Bedel:** Küçük projede klasör sayısı fazla görünebiliyor.

---

## Ortak kodun web ve mobile'da kopyalanması

**Seçilen:** `types.ts`, `money.ts`, `enums.ts` iki projede de ayrı kopya
**Elenen:** pnpm workspace + `packages/shared`

React Native, Metro bundler yüzünden workspace hoisting'e karşı hassas; `watchFolders` ve `extraNodeModules` yapılandırması, TypeScript path'lerinin iki tarafta hizalanması ve EAS build'de lokalden farklı davranma riski var. Bu ölçekte kurulum maliyeti getirisinden fazla.

**Bedel:** Ortak bir dosya değişirse diğer kopyanın elle güncellenmesi gerekiyor.
Gerçek projede `packages/shared` doğru çözüm olurdu.

---

## Açık — karar verilmedi

**Bonus senaryo:** Liste açıkken başka bir istemciden gelen güncellemenin görünmesi. Seçenekler: `refetchInterval` ile polling, `refetchOnWindowFocus`,
veya .NET tarafına SSE ucu. Karar verildiğinde bu bölüm yukarı taşınır ve `ROADMAP.md` § Açık kararlar güncellenir.

**Kullanıcı bilgisinin arayüzde gösterilmesi:** Guard zaten `/auth/me` çağırıyor. Gösterilecekse aynı `meQuery()` fabrikası `useQuery` ile kullanılır, ikinci bir query tanımlanmaz.
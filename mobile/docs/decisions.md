# Karar Gerekçeleri

Bu dosya, mobile/ için verilen mimari/kütüphane kararlarını kayıt altına alır: seçilen yol, elenen alternatif, gerekçe, bedel.

---

## Axios, web ile aynı mimariyle

**Seçilen yol:** Axios — `src/api/axios-client.ts` (tek instance + `/auth/refresh` için interceptor'sız ikinci instance) + `src/api/interceptors.ts`, `web/src/api/`'deki mimariyle birebir aynı yapı.

**Elenen alternatif:** Elle yazılmış `fetch` wrapper'ı (`src/api/client.ts`) — önceki karardı, kaldırıldı.

**Gerekçe:** Web ile mobile'ın aynı HTTP mimarisini paylaşması istendi; iki platformu bilen bir geliştirici aynı zihinsel modeli (axios-client + interceptors + errors + services) bulsun diye. Mobile'a özgü proaktif refresh kontrolü (`isAccessTokenExpiringSoon`) bilinçli olarak korundu — web'de olmayan bir davranış, ama request interceptor'ın içine taşındı.

**Bedel:** Axios'un mobil bundle'a eklediği ağırlık kabul edildi; karşılığında iki platform arasında kod/davranış paritesi ve tek bir dokümante mimari elde edildi.

---

## Katmanlı mimari: client → services → hooks

**Seçilen yol:** `src/api/{client.ts, errors.ts, services/*.service.ts}` + `src/hooks/*.ts` ayrımı.

**Elenen alternatif:** `expo-data-fetching` skill'inin gösterdiği düz/ad-hoc yapı (her şey tek fonksiyonda).

**Gerekçe:** `web/AGENTS.md`'deki `Component → Hook → Service → API Client` mimarisinden uyarlandı; web'i bilen bir geliştiricinin mobile'da aynı zihinsel modeli bulması, tek yönlü import zorunluluğu ile test edilebilirlik/yeniden kullanılabilirlik.

**Bedel:** Bu, `expo-data-fetching` skill'inin önerdiği bir mimari değil — projeye özgü bir tercih, zorunlu değil, gerekirse değiştirilebilir.

---

## Session state: `useSyncExternalStore` tabanlı elle yazılmış store

**Seçilen yol:** `src/lib/session-store.ts` — `subscribe`/`getSnapshot` ile `useSyncExternalStore` uyumlu, modül seviyeli bir store.

**Elenen alternatifler:**
- React Context (Expo'nun resmi [authentication-rewrites](https://docs.expo.dev/router/advanced/authentication-rewrites/) dokümanının önerdiği `SessionProvider`/`useSession` deseni)
- Zustand
- Session'ı React Query cache'inde tutmak

**Gerekçe:** `src/api/client.ts` bir React bileşeni değil, düz bir modül; access token'ı senkron ve React ağacı dışından okuyabilmesi gerekiyor. Context tek başına bunu sağlamaz. Zustand aynı işi görür ama yeni bağımlılık ekler. React Query cache'i sunucu verisi için tasarlanmıştır; session gibi anlık istemci durumunu oraya koymak amaç dışı kullanım sayılır.

**Bedel:** Expo'nun resmi dokümanındaki hazır `SessionProvider` deseninden sapma; elle yazılmış ~20 satırlık subscribe/notify mantığı bakım yükü.

---

## Route guard: `Stack.Protected`

**Seçilen yol:** `expo-router@57.0.16`'nın declarative `Stack.Protected` guard API'si, doğrudan `src/app/_layout.tsx` içinde.

**Elenen alternatif:** Expo'nun authentication-rewrites dokümanının gösterdiği desen (dokümanın kendisi "SDK 52 ve öncesi" etiketli) — `(app)/_layout.tsx` içinde `<Redirect>` ile manuel yönlendirme, ayrı bir route group gerektiriyor.

**Gerekçe:** `node_modules/expo-router/build/views/Protected.js` üzerinden doğrulandı, kurulu SDK 57'de mevcut. Ekstra `(app)/` route group / nested layout gerektirmiyor; `guard={boolean}` ile hem gösterme hem yönlendirmeyi kendisi hallediyor.

**Bedel:** Expo'nun resmi dokümanı hâlâ eski deseni gösteriyor (versiyon güncellenmemiş) — dışarıdan bakan biri kafası karışabilir.

---

## Token refresh: proaktif + reaktif hibrit

**Seçilen yol:** `expiresAt`'e göre proaktif refresh (`request()` her istekten önce kontrol ediyor) + `401`'de reaktif fallback — ikisi de aynı single-flight `refreshPromise`'ı paylaşıyor.

**Elenen alternatifler:**
- Sadece reaktif (yalnızca `401` sonrası refresh — `web/AGENTS.md`'nin axios interceptor deseni bu)
- Sadece proaktif (`expo-data-fetching` skill'inin `getValidToken` örneği bu — JWT decode varsayıyor)

**Gerekçe:** `expo-data-fetching` skill'i proaktif kontrol öneriyor ama örneği JWT decode varsayıyor. Bizim API'miz opaque token + `expiresAt` alanı veriyor (`api/API.md`), decode gerekmiyor. Sadece reaktif olsaydı 15 dakikalık pencere her dolduğunda ilk istek boşuna `401` alıp tekrar denenirdi. Reaktif fallback ise saat kayması ve erken iptal gibi durumları da kapsıyor.

**Bedel:** İki ayrı mekanizmanın (expiry kontrolü + `401` handling) birlikte bakımı.

---

## Hata ayrıştırma: `response.text()`, `response.json()` değil

**Seçilen yol:** `ApiError`, hata gövdesini `.text()` ile okuyor.

**Elenen alternatif:** `expo-data-fetching` skill'inin `fetchWithErrorHandling` örneği (`.json()` ile okuyor).

**Gerekçe:** `api/API.md` §1.2 — API hata gövdeleri `text/plain` döner, JSON değil; `.json()` çağrısı hata durumunda patlar.

**Bedel:** Skill'in genel örneğinden bilinçli sapma — API'ye özgü bir gerçeklik, genellenemez.

---

## NativeWind (`className`) kullanımı

**Seçilen yol:** Tüm ekranlar (`login`, protected `index`, `ThemedText`, `ThemedView`, root layout) `StyleSheet` yerine NativeWind `className` ile stileniyor; `tailwind.config.js`'e özel renk token'ları eklendi.

**Elenen alternatif:** `StyleSheet` + tema objesi (silinen template ekranlarının orijinal deseni — oradan kopyalanmıştı, kontrol edilmeden).

**Gerekçe:** `babel.config.js`'de `nativewind/babel` + `jsxImportSource: 'nativewind'` zaten kurulu (klasik NativeWind v4, sarmalayıcı bileşen gerektirmiyor); proje bilinçli olarak nativewind/tailwind için kurulmuş (`global.css`, `tailwind.config.js`, `prettier-plugin-tailwindcss`).

**Bedel:** `constants/theme.ts` ve `hooks/use-theme.ts` tamamen silindi (kullanılmaz hale geldi); font-family özelleştirmesi (`Fonts` objesi) basitleştirilip Tailwind'in varsayılan `font-mono`'suna düşürüldü — platforma özgü font stack'i kayboldu, kabul edilen bir fedakarlık.

---

## `expo-secure-store`, sadece native (web fallback yok)

**Seçilen yol:** `refreshToken` yalnızca `expo-secure-store` ile native'de saklanıyor.

**Elenen alternatif:** Expo'nun authentication-rewrites dokümanının önerdiği hibrit (native: `SecureStore`, web: `localStorage`).

**Gerekçe:** Mobil öncelikli; web deneyimi şimdilik kapsam dışı bırakıldı (kullanıcı kararı).

**Bedel:** Web build'inde (`expo start --web`) oturum kalıcı olmaz — `expo-secure-store`'un web shim'i boş (`export default {}`), çağrılırsa runtime hatası verir. Bilinçli, kayıtlı bir eksik; web önceliklenirse ilk yapılacak iş burası.

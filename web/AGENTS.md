# StokMate - Web Paneli

Küçük bir perakende zinciri için geliştirilmiş dahili stok yönetim
paneli. Merkez ofis çalışanları ürün kataloğunu görüntüler, arar,
filtreler ve günceller. Uygulamanın tamamı kimlik doğrulamasının
arkasında çalışır ve tamamen istemci taraflıdır - SSR ve SEO yoktur.

## Teknoloji Yığını

Vite · React · TypeScript · TanStack Query · TanStack Router · shadcn/ui
· Tailwind

**Formlar:** react-hook-form + zod
**Bildirimler:** sonner

## Komutlar

``` bash
pnpm run dev        # geliştirme sunucusu
pnpm run build      # production build
npx tsc --noEmit    # tip kontrolü
pnpm run lint
```

API ayrı çalışır:

``` bash
cd ../api && dotnet run
```

→ http://localhost:5080

Endpoint referansları: `docs/API.md`

## Dil ve iletişim

-   Kod, yorumlar, commit mesajları: **İngilizce**
-   Kullanıcıya gösterilen tüm arayüz metinleri ve dökümantasyon: **Türkçe** (uygulama Türkiye'deki perakende kullanımı içindir)
-   API hata mesajlarını teknik ayrıntı dökmek yerine sorunu ve kullanıcının izleyebileceği sonraki adımı açıkça anlatmalıdır.

------------------------------------------------------------------------

## API Kuralları - Tartışmaya Kapalı

### Hata yanıtları `text/plain` döner, JSON değil.

-   Hata durumunda asla `response.json()` çağırma.
-   Bunun yerine `response.text()` ile gövdeyi oku.
-   Bir `ApiError` fırlat.
-   Kullanıcıya gösterilen hata mesajı API'nin döndürdüğü metin
    olmalıdır; kendi hata mesajını üretme.

### `price` ve `costPrice` tamsayı kuruş değeridir.

`3950` → `39,50 ₺`

Kod tabanında hiçbir yerde float dönüşümü yapma.

Tek dönüşüm noktası:

-   `lib/money.ts`
-   `formatKurus`
-   `parseKurus`

Kodun başka hiçbir yerinde 100'e bölme veya 100 ile çarpma
yapılmamalıdır.

### `PUT /products/{id}` tüm kaydı baştan yazar.

İstek gövdesi `POST /products` ile aynıdır ve şu alanları zorunlu ister:

-   `costPrice`
-   `supplierId`
-   `description`

Düzenleme formu bu alanları detay endpoint'inden okumalı ve kullanıcı
değiştirmese bile aynı değerlerle geri göndermelidir.

Aksi halde kayıt sırasında bu alanlar sessizce silinir.

### `accessToken` 15 dakika geçerlidir, `refreshToken` ise her yenilemede değişir.

Refresh işlemi eski refresh token'ı geçersiz kılar.

`http.ts` dosyasında **single-flight** davranışı korunmalıdır:

-   Aynı anda birden fazla 401 alınırsa yalnızca **bir** `/auth/refresh`
    isteği gönderilir.
-   Diğer istekler aynı Promise'i bekler.

### `unit` ve `status` sayısal gelir.

Etiketler `lib/enums.ts` içindeki `as const` map'lerinden alınmalıdır.

Ham `1`, `2`, `3` değerleri kullanıcı arayüzüne asla çıkmamalıdır.

### `GET /products` yanıtında `totalPages` yoktur.

``` ts
Math.ceil(total / pageSize)
```

şeklinde hesaplanmalıdır.

Sunucu tarafında `pageSize` en fazla `100` olabilir.

------------------------------------------------------------------------

## Kod Kuralları

-   Sunucu verisi yalnızca **TanStack Query** içinde tutulur.
-   Redux, Zustand veya Context tabanlı veri önbelleği kullanılmaz.
-   Context yalnızca kimlik doğrulama için kullanılabilir.
-   Liste filtreleri (`q`, `categoryId`, `brandId`, `page`, `sort`,
    `dir`) component state'inde değil, URL search parametrelerinde
    tutulmalıdır.
-   Query key'leri:
    -   `['products', filters]`
    -   `['product', id]`
    -   `['categories']`
    -   `['brands']`
    -   `['stats']`
-   Her mutation sonrasında `['products']` invalidate edilmelidir.
-   `any` kullanılmaz.
-   Tüm tipler yalnızca `lib/types.ts` içinde tanımlanır.
-   Yorum yazılmaz.
-   İsimlendirme açıklayıcı olmalıdır.
-   Gereksiz `console.log` bırakılmaz.
-   Dosya isimleri:
    -   Component'ler → `PascalCase.tsx`
    -   Diğer dosyalar → `kebab-case.ts`

------------------------------------------------------------------------

## Routing

-   Dosya tabanlı route'lar `src/routes/` altında bulunur.
-   `src/routeTree.gen.ts` otomatik üretilir.
-   Elle düzenlenmez.
-   `.gitignore`'a eklenmez.
-   Commit edilir.
-   Liste filtreleri `validateSearch` şemasında tutulur.
-   String olmayan path parametreleri için `params.parse` ve
    `params.stringify` kullanılır.

------------------------------------------------------------------------

## Arayüz Metinleri

-   Türkçe kullanılmalıdır.
-   Cümle biçiminde yazılmalıdır.
-   Gereksiz dolgu ifadeleri kullanılmaz.
-   Butonlar yaptıkları işlemi adlandırmalıdır.
-   Boş ve hata ekranları ne olduğunu ve sonraki adımı söyler; özür
    dilemez.

------------------------------------------------------------------------

## Her Ekranda Üç Durum

### Loading

-   Ortalanmış spinner kullanılmaz.
-   Gerçek içeriğin şeklini taklit eden shadcn `Skeleton` kullanılır.

### Error

-   `ApiError.message` gösterilir.
-   `refetch` çağıran bir **Tekrar dene** butonu bulunur.

### Empty

Filtre varsa:

-   Sonuç bulunamadığı belirtilir.
-   Filtreleri temizleme seçeneği sunulur.

Filtre yoksa:

-   Henüz ürün bulunmadığı belirtilir.

------------------------------------------------------------------------

## Spec Odaklı Geliştirme

Önemli bir feature veya ekrana başlamadan önce `.specs/README.md`'yi oku.
Spec, koddan önce gelir.

------------------------------------------------------------------------

## Çalışma Şekli

-   Yeni bir bağımlılık eklemeden önce mutlaka sor.
-   Teknoloji yığını sabittir.
-   Her seferinde yalnızca tek bir dosya veya tek bir ekran üzerinde
    çalış.
-   O parça tamamlandığında dur; ben çalıştırıp kontrol edeyim.
-   İlgisiz dosyalara dokunma.
-   API davranışından emin değilsen `docs/API.md` dosyasını oku; tahmin
    yürütme.
-   Her değişiklikten sonra:

``` bash
npx tsc --noEmit
```

komutu hatasız çalışmalıdır.

## Ek yönlendirmeler

- Görev açıkça değiştirmiyorsa mevcut davranışı koru.
- Feature veya refactor kapsamını sessizce genişletme.
- Benden istenmeyen ekran, route, component, hook, utility veya feature ekleme. Her adım için yeni talimat bekle.
- Gelecekte gerekli olacağını düşündüğün kodu önceden yazma.
- Backend davranışı bilinmiyorsa varsayım yapmak yerine `docs/API.md` dosyasını incele veya soru sor.
- Uygulama ile domain terminolojisi çelişiyorsa bunu netleştirilmesi gereken bir ürün kararı olarak ele al.
- Güvenlik sunucuda, kullanılabilirlik ve açık geri bildirim istemcide sağlanır. İkisi de önemlidir.
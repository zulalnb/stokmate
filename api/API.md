# StokMate API — Endpoint Reference

Base URL: `http://localhost:5080`

---

## 1. General Rules

### 1.1 Authentication

**Every endpoint** requires authentication except `POST /auth/login` and `POST /auth/refresh`.

Send the access token with every request in this header:

```
Authorization: Bearer <accessToken>
```

- **accessToken** — valid for 15 minutes. Once expired, endpoints return `401`.
- **refreshToken** — valid for 7 days. Use `POST /auth/refresh` to obtain a new token pair.
- Refreshing applies **rotation**: the `refreshToken` you send is revoked and a new
  `refreshToken` is returned in the response. The old token can never be used again —
  always store the most recent value on the client.

### 1.2 Error responses

> **Important:** error response bodies are **plain text (`text/plain`), not JSON.**
> Read the error message with `response.text()`; do not call `response.json()`.

| Status code | Meaning | Example body |
| --- | --- | --- |
| `400` | Invalid request | `Fiyat negatif olamaz.` |
| `401` | Authentication failed / token invalid | `Erişim anahtarı geçersiz veya süresi dolmuş.` |
| `404` | Record not found | `99 numaralı ürün bulunamadı.` |
| `409` | Conflict with an existing record | `'ICE-1001' stok kodu başka bir üründe kullanılıyor.` |
| `500` | Unexpected error | `Beklenmeyen bir hata oluştu.` |

Successful responses return `application/json`.

> Error messages are returned in Turkish and are intended to be displayed as-is.

### 1.3 Currency

> **`price` and `costPrice` are `int` values in KURUŞ (cents).**
>
> | Field value | Displayed amount |
> | --- | --- |
> | `1999` | 19,99 ₺ |
> | `3950` | 39,50 ₺ |
> | `129900` | 1.299,00 ₺ |
>
> Divide by 100 to display, multiply by 100 when sending to the API.
> Do all calculations in kuruş to avoid rounding loss.

### 1.4 Enum values

Enum fields are transported as **numbers** in JSON.

**`unit`**

| Value | Meaning |
| --- | --- |
| `1` | Piece (Adet) |
| `2` | Kilogram (Kg) |
| `3` | Litre (Lt) |
| `4` | Pack (Paket) |

**`status`**

| Value | Meaning |
| --- | --- |
| `1` | Active (Aktif) |
| `2` | Inactive (Pasif) |
| `3` | Discontinued (Üretim Durduruldu) |

### 1.5 Dates

All dates are **UTC** in ISO 8601 format: `2026-07-17T12:39:31.9060307Z`

---

## 2. Endpoint List

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/auth/login` | — |
| `POST` | `/auth/refresh` | — |
| `POST` | `/auth/logout` | Bearer |
| `GET` | `/auth/me` | Bearer |
| `GET` | `/products` | Bearer |
| `GET` | `/products/stats` | Bearer |
| `POST` | `/products` | Bearer |
| `PUT` | `/products/{id}` | Bearer |
| `PATCH` | `/products/{id}/stock` | Bearer |
| `DELETE` | `/products/{id}` | Bearer |
| `GET` | `/categories` | Bearer |
| `GET` | `/brands` | Bearer |
| `GET` | `/suppliers` | Bearer |

---

## 3. Auth

### 3.1 `POST /auth/login`

Signs in and returns a token pair.

**Request body**

| Field | Type | Required |
| --- | --- | --- |
| `email` | string | yes |
| `password` | string | yes |

```json
{
  "email": "test@ornek.com",
  "password": "Test1234!"
}
```

**Response — `200 OK`**

```json
{
  "accessToken": "50b46b98ee88493e9e5b36d9364a677d",
  "refreshToken": "f46414b28c96418bbb2df92c565cba15",
  "expiresAt": "2026-07-17T12:53:34.0173723Z",
  "user": {
    "id": 1,
    "email": "test@ornek.com",
    "fullName": "Deniz Yılmaz"
  }
}
```

| Field | Description |
| --- | --- |
| `accessToken` | Used in the `Authorization: Bearer` header |
| `refreshToken` | Stored to renew the token pair |
| `expiresAt` | Expiry moment of the `accessToken` (UTC) |
| `user` | The signed-in user |

**Errors**

| Code | Case |
| --- | --- |
| `400` | `email` or `password` empty |
| `401` | Wrong email or password |

---

### 3.2 `POST /auth/refresh`

Exchanges the refresh token for a new token pair.

**Request body**

```json
{
  "refreshToken": "f46414b28c96418bbb2df92c565cba15"
}
```

**Response — `200 OK`**

Same body as `POST /auth/login` (new `accessToken` + new `refreshToken`).

> Store the new `refreshToken` from the response. The old token you sent is revoked
> and returns `401` if reused.

**Errors**

| Code | Case |
| --- | --- |
| `400` | `refreshToken` empty |
| `401` | Token invalid, revoked or expired |

---

### 3.3 `POST /auth/logout`

Ends the session. Revokes the refresh token you send and drops the user's
outstanding access tokens.

**Auth:** `Authorization: Bearer <accessToken>`

**Request body**

```json
{
  "refreshToken": "f46414b28c96418bbb2df92c565cba15"
}
```

**Response — `204 No Content`** (no body)

---

### 3.4 `GET /auth/me`

Returns the signed-in user.

**Auth:** `Authorization: Bearer <accessToken>`

**Response — `200 OK`**

```json
{
  "id": 1,
  "email": "test@ornek.com",
  "fullName": "Deniz Yılmaz"
}
```

---

## 4. Products

### 4.1 `GET /products`

Filters, sorts and paginates products.

**Query parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `q` | string | — | Search term |
| `categoryId` | int | — | Category filter |
| `brandId` | int | — | Brand filter |
| `status` | int | — | Status filter (`1` \| `2` \| `3`) |
| `page` | int | `1` | Page number (starts at 1) |
| `pageSize` | int | `20` | Records per page. Max `100`; larger values are clamped to `100` |
| `sort` | string | `name` | `name` \| `price` \| `stock` \| `updatedAt` |
| `dir` | string | `asc` | `asc` \| `desc` |

All parameters are optional and can be combined.

**Example request**

```
GET /products?q=cola&categoryId=1&sort=price&dir=desc&page=1&pageSize=20
Authorization: Bearer <accessToken>
```

**Response — `200 OK`**

```json
{
  "items": [
    {
      "id": 1,
      "name": "Coca-Cola 1 L Pet",
      "sku": "ICE-1001",
      "barcode": "8690637010011",
      "imageUrl": "https://picsum.photos/seed/1/400/400",
      "categoryId": 1,
      "categoryName": "İçecek",
      "brandId": 6,
      "brandName": "Coca-Cola",
      "price": 3950,
      "stock": 240,
      "minStock": 40,
      "unit": 1,
      "status": 1,
      "isFeatured": true,
      "updatedAt": "2026-07-17T12:37:56.2270349Z"
    }
  ],
  "total": 80,
  "page": 1,
  "pageSize": 20
}
```

| Field | Type | Description |
| --- | --- | --- |
| `items` | array | Products on the current page |
| `total` | int | **Total** number of records matching the filters (before pagination) |
| `page` | int | Current page |
| `pageSize` | int | Records per page |

> The response contains no `totalPages` — compute it as `Math.ceil(total / pageSize)`.

**Product fields**

| Field | Type | Description |
| --- | --- | --- |
| `id` | int | |
| `name` | string | Product name |
| `sku` | string | Stock code (unique) |
| `barcode` | string | Barcode |
| `imageUrl` | string | Image URL |
| `categoryId` / `categoryName` | int / string | Category |
| `brandId` / `brandName` | int / string | Brand |
| `price` | int | Sale price — **KURUŞ** (`3950` = 39,50 ₺) |
| `stock` | int | Current stock |
| `minStock` | int | Low-stock threshold |
| `unit` | int | Unit (see 1.4) |
| `status` | int | Status (see 1.4) |
| `isFeatured` | bool | Whether the product is featured |
| `updatedAt` | string | Last update (UTC) |

> Note: `costPrice`, `supplierId` and `description` are **not** returned by this
> endpoint, but are required by `POST` and `PUT`. See 4.4.

---

### 4.2 `GET /products/stats`

Stock status summary.

**Response — `200 OK`**

```json
{
  "total": 80,
  "outOfStock": 10,
  "lowStock": 14
}
```

| Field | Description |
| --- | --- |
| `total` | Total number of products |
| `outOfStock` | Products that are out of stock (`stock == 0`) |
| `lowStock` | Products at or below the threshold (`stock <= minStock` and `stock > 0`) |

---

### 4.3 `POST /products`

Creates a new product.

**Request body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | |
| `sku` | string | yes | Must be unique |
| `barcode` | string | no | |
| `categoryId` | int | yes | An existing category |
| `brandId` | int | yes | An existing brand |
| `supplierId` | int | yes | An existing supplier |
| `price` | int | yes | **KURUŞ**, cannot be negative |
| `costPrice` | int | yes | **KURUŞ**, cannot be negative |
| `stock` | int | yes | Cannot be negative |
| `minStock` | int | yes | Cannot be negative |
| `unit` | int | yes | `1` \| `2` \| `3` \| `4` |
| `status` | int | yes | `1` \| `2` \| `3` |
| `description` | string | no | |
| `isFeatured` | bool | no | Defaults to `false` |

```json
{
  "name": "Ülker Çikolatalı Gofret 36 g",
  "sku": "ATI-2001",
  "barcode": "8690504019999",
  "categoryId": 5,
  "brandId": 1,
  "supplierId": 1,
  "price": 1999,
  "costPrice": 1200,
  "stock": 150,
  "minStock": 30,
  "unit": 1,
  "status": 1,
  "description": "Fındık parçacıklı çikolatalı gofret.",
  "isFeatured": false
}
```

**Response — `201 Created`**

The created product, in the same shape as the product fields in `GET /products`.
`imageUrl` is assigned automatically server-side.

```json
{
  "id": 81,
  "name": "Ülker Çikolatalı Gofret 36 g",
  "sku": "ATI-2001",
  "barcode": "8690504019999",
  "imageUrl": "https://picsum.photos/seed/81/400/400",
  "categoryId": 5,
  "categoryName": "Atıştırmalık",
  "brandId": 1,
  "brandName": "Ülker",
  "price": 1999,
  "stock": 150,
  "minStock": 30,
  "unit": 1,
  "status": 1,
  "isFeatured": false,
  "updatedAt": "2026-07-17T12:39:30.3470686Z"
}
```

**Errors**

| Code | Case |
| --- | --- |
| `400` | Required field empty, negative amount/stock, invalid enum, or `categoryId`/`brandId`/`supplierId` not found |
| `409` | `sku` already used by another product |

---

### 4.4 `PUT /products/{id}`

Updates **all** fields of a product. The body is identical to `POST /products` —
you must send the fields you are not changing with their current values too.

`updatedAt` is refreshed automatically server-side.

> **Data-loss risk:** `costPrice`, `supplierId` and `description` are required here
> but are not returned by `GET /products`. Read them from the product detail
> response and send them back unchanged, or saving will overwrite them.

**Path parameter**

| Parameter | Type |
| --- | --- |
| `id` | int |

**Request body**

```json
{
  "name": "Coca-Cola 1 L Pet",
  "sku": "ICE-1001",
  "barcode": "8690637010011",
  "categoryId": 1,
  "brandId": 6,
  "supplierId": 1,
  "price": 4250,
  "costPrice": 2850,
  "stock": 200,
  "minStock": 40,
  "unit": 1,
  "status": 1,
  "description": "Güncellenmiş açıklama.",
  "isFeatured": true
}
```

**Response — `200 OK`**

The updated product (same shape as the product fields in 4.1).

**Errors**

| Code | Case |
| --- | --- |
| `400` | Invalid field (see 4.3) |
| `404` | Product not found |
| `409` | `sku` already used by another product |

---

### 4.5 `PATCH /products/{id}/stock`

Updates the stock quantity only. `updatedAt` is refreshed automatically.

**Request body**

| Field | Type | Description |
| --- | --- | --- |
| `stock` | int | New stock value. Cannot be negative |

```json
{
  "stock": 7
}
```

**Response — `200 OK`**

The updated product (same shape as the product fields in 4.1).

**Errors**

| Code | Case |
| --- | --- |
| `400` | `stock` is negative |
| `404` | Product not found |

---

### 4.6 `DELETE /products/{id}`

Deletes a product.

**Response — `204 No Content`** (no body)

**Errors**

| Code | Case |
| --- | --- |
| `404` | Product not found |

---

## 5. Lookups

Fixed lists used in product forms and filters.

### 5.1 `GET /categories`

**Response — `200 OK`**

```json
[
  { "id": 1, "name": "İçecek", "slug": "icecek", "sortOrder": 1 },
  { "id": 2, "name": "Kahvaltılık", "slug": "kahvaltilik", "sortOrder": 2 }
]
```

Categories are returned sorted by `sortOrder`. There are 8 categories in total.

---

### 5.2 `GET /brands`

**Response — `200 OK`**

```json
[
  { "id": 6, "name": "Coca-Cola" },
  { "id": 8, "name": "Doğadan" }
]
```

Brands are returned sorted by name. There are 12 brands in total.

---

### 5.3 `GET /suppliers`

**Response — `200 OK`**

```json
[
  {
    "id": 1,
    "name": "Anadolu Gıda Dağıtım A.Ş.",
    "contactName": "Mehmet Yılmaz",
    "phone": "0212 555 1010",
    "email": "siparis@anadolugida.com.tr",
    "city": "İstanbul"
  }
]
```

Suppliers are returned sorted by name. There are 6 suppliers in total.
# StokMate API — Complete Endpoint Reference

Base URL: `http://localhost:5080`

---

## 1. General Rules

### 1.1 Authentication

All endpoints **except** `POST /auth/login` and `POST /auth/refresh` require authentication.

Send the access token in the following header with every request:

```text
Authorization: Bearer <accessToken>
```

- **accessToken** — valid for 15 minutes. Endpoints return `401` when it expires.
- **refreshToken** — valid for 7 days. Use `POST /auth/refresh` to obtain a new token pair.
- **Rotation** is applied during refresh: the used `refreshToken` is revoked and a new `refreshToken` is returned in the response. The old token cannot be used again — always store the latest value returned by the server on the client.

### 1.2 Error Responses

> **Important:** Error response bodies are **plain text (`text/plain`), not JSON.**
> Read the body with `response.text()` when handling errors; do not call `response.json()`.

| Status Code | Meaning | Example Body |
| --- | --- | --- |
| `400` | Invalid request | `Price cannot be negative.` |
| `401` | Authentication failed / invalid token | `Access token is invalid or expired.` |
| `404` | Record not found | `Product with ID 99 not found.` |
| `409` | Conflict with an existing record | `SKU 'ICE-1001' is already used by another product.` |
| `500` | Unexpected error | `An unexpected error occurred.` |

Successful responses return `application/json`.

### 1.3 Currency

> **`price` and `costPrice` fields are `int` values in KURUŞ (Turkish cents).**
>
> | Field Value | Displayed Amount |
> | --- | --- |
> | `1999` | ₺19.99 |
> | `3950` | ₺39.50 |
> | `129900` | ₺1,299.00 |
>
> Divide by 100 when displaying values on the screen and multiply by 100 when sending them to the API.
> Perform calculations in kuruş to avoid losing fractional values.

### 1.4 Enum Values

Enum fields are transmitted as **numbers** in JSON.

**`unit`**

| Value | Meaning |
| --- | --- |
| `1` | Piece |
| `2` | Kg |
| `3` | Liter |
| `4` | Package |

**`status`**

| Value | Meaning |
| --- | --- |
| `1` | Active |
| `2` | Inactive |
| `3` | Production Stopped |

### 1.5 Dates

All dates are in **UTC** and use ISO 8601 format:

```text
2026-07-17T12:39:31.9060307Z
```

---

## 2. Endpoint List

| Method | Path | Authorization |
| --- | --- | --- |
| `POST` | `/auth/login` | — |
| `POST` | `/auth/refresh` | — |
| `POST` | `/auth/logout` | Bearer |
| `GET` | `/auth/me` | Bearer |
| `GET` | `/products` | Bearer |
| `GET` | `/products/{id}` | Bearer |
| `GET` | `/products/stats` | Bearer |
| `POST` | `/products` | Bearer |
| `PUT` | `/products/{id}` | Bearer |
| `PATCH` | `/products/{id}/stock` | Bearer |
| `DELETE` | `/products/{id}` | Bearer |
| `GET` | `/categories` | Bearer |
| `GET` | `/brands` | Bearer |
| `GET` | `/suppliers` | Bearer |

---

## 3. Authentication

### 3.1 `POST /auth/login`

Logs in the user and returns a token pair.

**Request Body**

| Field | Type | Required |
| --- | --- | --- |
| `email` | string | Yes |
| `password` | string | Yes |

```json
{
  "email": "test@example.com",
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
    "email": "test@example.com",
    "fullName": "Deniz Yılmaz"
  }
}
```

| Field | Description |
| --- | --- |
| `accessToken` | Used in the `Authorization: Bearer` header |
| `refreshToken` | Stored for refreshing the tokens |
| `expiresAt` | Expiration time of the `accessToken` (UTC) |
| `user` | Authenticated user |

**Errors**

| Code | Condition |
| --- | --- |
| `400` | `email` or `password` is empty |
| `401` | Invalid email or password |

---

### 3.2 `POST /auth/refresh`

Exchanges the refresh token for a new token pair.

**Request Body**

```json
{
  "refreshToken": "f46414b28c96418bbb2df92c565cba15"
}
```

**Response — `200 OK`**

Same response body as `POST /auth/login` (new `accessToken` + new `refreshToken`).

> Store the new `refreshToken` returned in the response. The old token you submitted is revoked and will return `401` if used again.

**Errors**

| Code | Condition |
| --- | --- |
| `400` | `refreshToken` is empty |
| `401` | Token is invalid, revoked, or expired |

---

### 3.3 `POST /auth/logout`

Logs out the user. Revokes the submitted refresh token and invalidates the user's active access tokens.

**Authorization:** `Authorization: Bearer <accessToken>`

**Request Body**

```json
{
  "refreshToken": "f46414b28c96418bbb2df92c565cba15"
}
```

**Response — `204 No Content`**

No response body.

---

### 3.4 `GET /auth/me`

Returns information about the currently authenticated user.

**Authorization:** `Authorization: Bearer <accessToken>`

**Response — `200 OK`**

```json
{
  "id": 1,
  "email": "test@example.com",
  "fullName": "Deniz Yılmaz"
}
```

---

## 4. Products

### 4.1 `GET /products`

Filters, sorts, and paginates products.

**Query Parameters**

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `q` | string | — | Search term |
| `categoryId` | int | — | Category filter |
| `brandId` | int | — | Brand filter |
| `status` | int | — | Status filter (`1` \| `2` \| `3`) |
| `page` | int | `1` | Page number (starts at 1) |
| `pageSize` | int | `20` | Number of records per page. Maximum `100`; larger values are reduced to `100` |
| `sort` | string | `name` | `name` \| `price` \| `stock` \| `updatedAt` |
| `dir` | string | `asc` | `asc` \| `desc` |

All parameters are optional and can be combined.

**Example Request**

```text
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
      "categoryName": "Beverages",
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
| `total` | int | **Total** number of records matching the filters, before pagination |
| `page` | int | Current page |
| `pageSize` | int | Number of records per page |

**Product Fields**

| Field | Type | Description |
| --- | --- | --- |
| `id` | int | |
| `name` | string | Product name |
| `sku` | string | SKU (unique) |
| `barcode` | string | Barcode |
| `imageUrl` | string | Image URL |
| `categoryId` / `categoryName` | int / string | Category |
| `brandId` / `brandName` | int / string | Brand |
| `price` | int | Selling price — **KURUŞ** (`3950` = ₺39.50) |
| `stock` | int | Current stock |
| `minStock` | int | Critical stock threshold |
| `unit` | int | Unit (see 1.4) |
| `status` | int | Status (see 1.4) |
| `isFeatured` | bool | Whether the product is featured |
| `updatedAt` | string | Last update timestamp (UTC) |

---

### 4.2 `GET /products/{id}`

Returns all fields of a single product, including `costPrice`, `supplierId`, and `description`, which are required for the edit form.

**Path Parameter**

| Parameter | Type |
| --- | --- |
| `id` | int |

**Response — `200 OK`**

```json
{
  "id": 1,
  "name": "Coca-Cola 1 L Pet",
  "sku": "ICE-1001",
  "barcode": "8690637010011",
  "imageUrl": "https://picsum.photos/seed/1/400/400",
  "categoryId": 1,
  "categoryName": "Beverages",
  "brandId": 6,
  "brandName": "Coca-Cola",
  "supplierId": 1,
  "price": 3950,
  "costPrice": 2650,
  "stock": 240,
  "minStock": 40,
  "unit": 1,
  "status": 1,
  "description": "500 ml glass bottle.",
  "isFeatured": true,
  "updatedAt": "2026-07-17T12:37:56.2270349Z"
}
```

In addition to the product fields listed in 4.1:

| Field | Type | Description |
| --- | --- | --- |
| `supplierId` | int | Supplier |
| `costPrice` | int | Cost price — **KURUŞ** |
| `description` | string | Product description (empty string if not provided) |

**Errors**

| Code | Condition |
| --- | --- |
| `404` | Product not found |

---

### 4.3 `GET /products/stats`

Returns a summary of the current stock status.

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
| `outOfStock` | Number of products with no stock (`stock == 0`) |
| `lowStock` | Number of products at or below the critical threshold (`stock <= minStock` and `stock > 0`) |

---

### 4.4 `POST /products`

Creates a new product.

**Request Body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | |
| `sku` | string | Yes | Must be unique |
| `barcode` | string | No | |
| `categoryId` | int | Yes | Must reference an existing category |
| `brandId` | int | Yes | Must reference an existing brand |
| `supplierId` | int | Yes | Must reference an existing supplier |
| `price` | int | Yes | **KURUŞ**, cannot be negative |
| `costPrice` | int | Yes | **KURUŞ**, cannot be negative |
| `stock` | int | Yes | Cannot be negative |
| `minStock` | int | Yes | Cannot be negative |
| `unit` | int | Yes | `1` \| `2` \| `3` \| `4` |
| `status` | int | Yes | `1` \| `2` \| `3` |
| `description` | string | No | |
| `isFeatured` | bool | No | Defaults to `false` |

```json
{
  "name": "Ülker Chocolate Wafer 36 g",
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
  "description": "Chocolate wafer with hazelnut pieces.",
  "isFeatured": false
}
```

**Response — `201 Created`**

Returns the created product in the same format as the product fields in `GET /products`.

`imageUrl` is automatically assigned by the server.

```json
{
  "id": 81,
  "name": "Ülker Chocolate Wafer 36 g",
  "sku": "ATI-2001",
  "barcode": "8690504019999",
  "imageUrl": "https://picsum.photos/seed/81/400/400",
  "categoryId": 5,
  "categoryName": "Snacks",
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

| Code | Condition |
| --- | --- |
| `400` | Required field is empty, amount/stock is negative, enum is invalid, or `categoryId`/`brandId`/`supplierId` does not exist |
| `409` | `sku` is already used by another product |

---

### 4.5 `PUT /products/{id}`

Updates **all** fields of a product. The request body is the same as `POST /products` — unchanged fields must also be sent with their current values.

`updatedAt` is automatically refreshed by the server.

**Path Parameter**

| Parameter | Type |
| --- | --- |
| `id` | int |

**Request Body**

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
  "description": "Updated description.",
  "isFeatured": true
}
```

**Response — `200 OK`**

Returns the updated product in the same format as the product fields in 4.1.

**Errors**

| Code | Condition |
| --- | --- |
| `400` | Invalid field (see 4.4) |
| `404` | Product not found |
| `409` | `sku` is already used by another product |

---

### 4.6 `PATCH /products/{id}/stock`

Updates only the stock quantity. `updatedAt` is automatically refreshed.

**Request Body**

| Field | Type | Description |
| --- | --- | --- |
| `stock` | int | New stock value. Cannot be negative |

```json
{
  "stock": 7
}
```

**Response — `200 OK`**

Returns the updated product in the same format as the product fields in 4.1.

**Errors**

| Code | Condition |
| --- | --- |
| `400` | `stock` is negative |
| `404` | Product not found |

---

### 4.7 `DELETE /products/{id}`

Deletes a product.

**Response — `204 No Content`**

No response body.

**Errors**

| Code | Condition |
| --- | --- |
| `404` | Product not found |

---

## 5. Lookup Lists

Static lists used by product forms and filters.

### 5.1 `GET /categories`

**Response — `200 OK`**

```json
[
  { "id": 1, "name": "Beverages", "slug": "icecek", "sortOrder": 1 },
  { "id": 2, "name": "Breakfast", "slug": "kahvaltilik", "sortOrder": 2 }
]
```

Categories are returned sorted by `sortOrder`.

There are 8 categories in total.

---

### 5.2 `GET /brands`

**Response — `200 OK`**

```json
[
  { "id": 6, "name": "Coca-Cola" },
  { "id": 8, "name": "Doğadan" }
]
```

Brands are returned sorted alphabetically by name.

There are 12 brands in total.

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
    "city": "Istanbul"
  }
]
```

Suppliers are returned sorted alphabetically by name.

There are 6 suppliers in total.
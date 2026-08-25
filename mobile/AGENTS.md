# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

## API

Backend `api/API.md` dosyasında dokümante edilmiştir. Backend davranışı bilinmiyorsa tahmin yürütme; `api/API.md`'yi oku.

Kullanılacak uçlar:

| Method | Path |
| --- | --- |
| `POST` | `/auth/login` |
| `POST` | `/auth/refresh` |
| `POST` | `/auth/logout` |
| `GET` | `/auth/me` |
| `GET` | `/products` |
| `GET` | `/products/{id}` |
| `GET` | `/products/stats` |
| `PATCH` | `/products/{id}/stock` |
| `GET` | `/categories` |
| `GET` | `/brands` |
| `GET` | `/suppliers` |

`POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` **kullanılmaz**.

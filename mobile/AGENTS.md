# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

## API

The backend is documented in the `api/API.md` file. If the backend behavior is unknown, do not make assumptions; read `api/API.md`.

Endpoints to use:

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

`POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` **are not used**.
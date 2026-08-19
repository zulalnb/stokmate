# StokMate API

A .NET 8 Web API built for the StokMate case study.
Data is held in memory — no database setup, connection string or migrations required.

## Requirements

- **.NET SDK 8.0 or later**

The project targets `net8.0`, but thanks to the `RollForward` setting it also runs
without issues on machines that only have .NET 9 or .NET 10 installed. To check your
installed version:

```bash
dotnet --version
```

## Running

From the solution folder (the same directory as `StokMate.sln`):

```bash
dotnet run --project src/StokMate.Api
```

One command is enough. On first run the packages are restored, then the API starts and
the sample data is seeded automatically.

> If you use Visual Studio or Rider, just open `StokMate.sln` and run it directly.

### Project structure

```
StokMate/
├── StokMate.sln
├── README.md · API.md
└── src/
    └── StokMate.Api/     → API project (Controllers · Services · Data · Auth · Models · Common)
```

| | Address |
| --- | --- |
| API root | `http://localhost:5080` |
| **Swagger UI** | **`http://localhost:5080/swagger`** |
| OpenAPI schema | `http://localhost:5080/swagger/v1/swagger.json` |

The port is fixed at `5080`.

## Test user

| Email | Password |
| --- | --- |
| `test@ornek.com` | `Test1234!` |

Sign in with `POST /auth/login` and send the returned `accessToken` on subsequent
requests in the `Authorization: Bearer <accessToken>` header.

In Swagger UI you can paste the `accessToken` into the **Authorize** button at the top
right and try every endpoint straight from the browser.

## About the data

- Data is stored in an in-memory database.
- Sample data is re-seeded every time the application starts: **80 products, 8 categories, 12 brands, 6 suppliers**.
- **All changes are lost when the application stops.** Records you create, update or
delete are not persisted; restarting the API returns you to the initial data set.
- Product images come from `picsum.photos`, so an internet connection is needed for them to load.

## Access from a mobile device / emulator

`localhost` points at the phone or the emulator **itself**, not at your development
machine. When connecting from a physical device or an emulator you therefore need to use
**your machine's local IP address**.

| Environment | Address to use |
| --- | --- |
| Web (browser on the same machine) | `http://localhost:5080` |
| iOS simulator | `http://localhost:5080` |
| Android emulator | `http://10.0.2.2:5080` |
| Physical device (iOS / Android) | `http://<MACHINE_IP>:5080` |

To find your local IP address:

- **Windows:** `ipconfig` → the "IPv4 Address" line (e.g. `192.168.1.25`)
- **macOS / Linux:** `ifconfig` or `ip addr`

Example: `http://192.168.1.25:5080`

Things to watch out for:

- The device and the computer must be on the **same Wi-Fi network**.
- The API listens on all network interfaces; no extra server-side configuration is needed.
- On first run Windows Firewall may ask for permission — allow it for private networks.
- CORS is fully open; you will not hit origin restrictions from the browser.
- The API serves over **HTTP only** (there is no HTTPS). To reach `http://` addresses you
may need `usesCleartextTraffic` on Android and an ATS setting on iOS.

## API documentation

For all endpoints, fields, enum values and example requests/responses, see
**[API.md](API.md)**.
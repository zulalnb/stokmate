# StokMate API

A **.NET 8 Web API** built for a stock management case study.

Data is stored in memory — no database setup, connection configuration, or migrations are required.

## Requirements

- **.NET SDK 8.0 or later**

The project targets `net8.0`, but thanks to the `RollForward` setting, it also runs without issues on machines that have only .NET 9 or .NET 10 installed.

To check the installed version:

```bash
dotnet --version
```

## Running the API

From the solution directory (the same directory containing `StokMate.sln`):

```bash
dotnet run --project src/StokMate.Api
```

That's all you need. On the first run, the required packages are restored, then the API starts and sample data is loaded automatically.

> If you are using Visual Studio or Rider, simply open `StokMate.sln` and run the project directly.

### Project Structure

```text
api/
├── StokMate.sln
├── README.md · API.md
└── src/
    └── StokMate.Api/     → API project (Controllers · Services · Data · Auth · Models · Common)
```

| | URL |
| --- | --- |
| API root | `http://localhost:5080` |
| **Swagger UI** | **`http://localhost:5080/swagger`** |
| OpenAPI schema | `http://localhost:5080/swagger/v1/swagger.json` |

Port `5080` is fixed.

## Test User

| Email | Password |
| --- | --- |
| `test@example.com` | `Test1234!` |

Sign in using `POST /auth/login`, then send the returned `accessToken` in the following header for subsequent requests:

```text
Authorization: Bearer <accessToken>
```

You can also test all endpoints directly from the browser by pasting the `accessToken` into the **Authorize** button in the top-right corner of the Swagger UI.

## Data

- Data is stored in an in-memory database.
- Sample data is reloaded every time the application starts: **80 products, 8 categories, 12 brands, and 6 suppliers**.
- **All changes are lost when the application shuts down.** Records you add, update, or delete are not persisted. Restarting the API restores the initial sample data.
- Product images are served through `picsum.photos`; an internet connection is required for the images to load.

## Mobile Device / Emulator Access

`localhost` refers to the **device or emulator itself**, not the computer running the API. Therefore, when connecting from a physical device or emulator, you need to use your machine's local IP address.

| Environment | Address to Use |
| --- | --- |
| Web (browser on the same machine) | `http://localhost:5080` |
| iOS Simulator | `http://localhost:5080` |
| Android Emulator | `http://10.0.2.2:5080` |
| Physical Device (iOS / Android) | `http://<MACHINE_IP>:5080` |

To find your local IP address:

- **Windows:** Run `ipconfig` → look for the **IPv4 Address** line (e.g. `192.168.1.25`)
- **macOS / Linux:** Run `ifconfig` or `ip addr`

Example:

```text
http://192.168.1.25:5080
```

### Things to Keep in Mind

- The device and computer **must be connected to the same Wi-Fi network**.
- The API listens on all network interfaces; no additional server-side configuration is required.
- On the first run, Windows Firewall may ask for permission — allow access for private networks.
- CORS is completely open; you should not encounter origin restrictions when accessing the API from a browser.
- The API is served over **HTTP only** (HTTPS is not configured). Android may require `usesCleartextTraffic` to access `http://` addresses, while iOS may require an appropriate ATS configuration.

## API Documentation

For all endpoints, fields, enum values, and example requests/responses, see **[API.md](API.md)**.
# Smart Solar Energy Management API

## Endpoints

- GET `/`
- GET `/api/electricity/current`
- POST `/api/electricity/price` with `{"pricePerKWh":0.20}`
- POST `/api/telemetry`
- GET `/api/telemetry/latest`
- GET `/api/summary`
- GET `/api/weather?lat=...&lon=...`

The electricity API is our own configurable/mock tariff.
The weather endpoint fetches current weather through Open-Meteo.

## Run

```bash
npm install
npm start
```

Server:
`http://localhost:3000`

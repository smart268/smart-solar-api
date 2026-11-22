
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =====================================
// ELECTRICITY PRICE DEMO
// Demo prices only - not a real tariff feed
// =====================================

const DEMO_LOW_PRICE = 0.18;
const DEMO_HIGH_PRICE = 0.60;
const PRICE_CHANGE_INTERVAL = 3 * 60 * 1000; // 3 minutes

let isHighPrice = false;

let electricity = {
  currency: "SAR",
  pricePerKWh: DEMO_LOW_PRICE,
  updatedAt: new Date().toISOString()
};

// Automatically alternate between low and high prices.
setInterval(() => {
  isHighPrice = !isHighPrice;

  electricity.pricePerKWh = isHighPrice
    ? DEMO_HIGH_PRICE
    : DEMO_LOW_PRICE;

  electricity.updatedAt = new Date().toISOString();

  console.log("-------------------------------------");
  console.log("Electricity demo price changed!");
  console.log(`New price: ${electricity.pricePerKWh} SAR/kWh`);
  console.log(`Updated at: ${electricity.updatedAt}`);
  console.log("-------------------------------------");
}, PRICE_CHANGE_INTERVAL);

// =====================================
// TELEMETRY
// =====================================

let latestTelemetry = {
  temperature: null,
  humidity: null,
  voltage: null,
  current: null,
  power: null,
  energyKWh: null,
  heartRate: null,
  spo2: null,
  ldr1: null,
  ldr2: null,
  ldr3: null,
  ldr4: null,
  relay: null,
  servoX: null,
  servoY: null,
  mode: "AUTO",
  receivedAt: null
};

// =====================================
// ROOT
// =====================================

app.get("/", (req, res) => {
  res.json({
    project: "Smart Solar Energy Management System",
    status: "online"
  });
});

// =====================================
// GET CURRENT ELECTRICITY PRICE
// =====================================

app.get("/api/electricity/current", (req, res) => {
  res.json(electricity);
});

// =====================================
// MANUALLY SET ELECTRICITY PRICE
// =====================================

app.post("/api/electricity/price", (req, res) => {
  const price = Number(req.body?.pricePerKWh);

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({
      error: "pricePerKWh must be a non-negative number"
    });
  }

  electricity.pricePerKWh = price;
  electricity.updatedAt = new Date().toISOString();

  console.log(
    `Electricity price manually set to: ${electricity.pricePerKWh} SAR/kWh`
  );

  res.json(electricity);
});

// =====================================
// RECEIVE TELEMETRY FROM ESP32
// =====================================

app.post("/api/telemetry", (req, res) => {
  latestTelemetry = {
    ...latestTelemetry,
    ...(req.body || {}),
    receivedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    receivedAt: latestTelemetry.receivedAt
  });
});

// =====================================
// GET LATEST TELEMETRY
// =====================================

app.get("/api/telemetry/latest", (req, res) => {
  res.json(latestTelemetry);
});

// =====================================
// SUMMARY
// =====================================

app.get("/api/summary", (req, res) => {
  const energyKWh = Number(latestTelemetry.energyKWh);
  const validEnergy =
    Number.isFinite(energyKWh) && energyKWh >= 0;

  res.json({
    energyKWh: validEnergy ? energyKWh : null,
    electricityPricePerKWh: electricity.pricePerKWh,
    currency: electricity.currency,
    estimatedSaving: validEnergy
      ? energyKWh * electricity.pricePerKWh
      : null,
    telemetryReceivedAt: latestTelemetry.receivedAt
  });
});

// =====================================
// WEATHER API - OPEN-METEO
// =====================================

app.get("/api/weather", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({
      error:
        "Provide lat and lon, e.g. /api/weather?lat=24.7136&lon=46.6753"
    });
  }

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lon)}` +
      "&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,weather_code" +
      "&timezone=auto";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Weather provider returned ${response.status}`
      );
    }

    const weather = await response.json();

    res.json({
      source: "Open-Meteo",
      latitude: weather.latitude,
      longitude: weather.longitude,
      timezone: weather.timezone,
      current: weather.current
    });
  } catch (error) {
    console.error("Weather API error:", error.message);

    res.status(502).json({
      error: "Weather service unavailable",
      details: error.message
    });
  }
});

// =====================================
// START SERVER
// =====================================

app.listen(PORT, () => {
  console.log(
    `Smart Solar API running on http://localhost:${PORT}`
  );

  console.log(
    `Initial electricity price: ${electricity.pricePerKWh} SAR/kWh`
  );

  console.log(
    "Demo price will alternate between 0.18 and 0.60 every 3 minutes."
  );
});

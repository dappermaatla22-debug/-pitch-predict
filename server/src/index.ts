import "dotenv/config";
import express from "express";
import cors from "cors";
import { leaguesRouter } from "./routes/leagues.js";
import { fixturesRouter } from "./routes/fixtures.js";
import { teamsRouter } from "./routes/teams.js";
import { predictionsRouter } from "./routes/predictions.js";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3001",
  "https://localhost",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/leagues", leaguesRouter);
app.use("/api/fixtures", fixturesRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/predictions", predictionsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Pitch Predict API running on port ${PORT}`);
});

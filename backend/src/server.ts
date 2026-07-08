import "dotenv/config";
import express from "express";
import cors from "cors";
import importRouter from "./routes/import.route";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { logger } from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 5000;

// Set up CORS using environmental configuration to prevent localhost leaks
const allowedOrigin = process.env.ALLOWED_ORIGIN;
const corsOptions: cors.CorsOptions = {
  origin: allowedOrigin ? allowedOrigin : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Main importer API routing
app.use("/api", importRouter);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    aiProvider: process.env.GEMINI_API_KEY || process.env.AI_API_KEY 
      ? "Gemini" 
      : process.env.ANTHROPIC_API_KEY 
      ? "Claude" 
      : process.env.GROQ_API_KEY 
      ? "Groq" 
      : "None configured"
  });
});

// Global central error handler middleware
app.use(errorHandler);

// Listen on configured port
app.listen(PORT, () => {
  logger.info(`Express server boot complete. Listening on port: ${PORT}`);
  if (allowedOrigin) {
    logger.info(`CORS configured for origin: ${allowedOrigin}`);
  } else {
    logger.warn("CORS configured to allow any origin (*). For production, set ALLOWED_ORIGIN.");
  }
});

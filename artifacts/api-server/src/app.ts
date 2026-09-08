import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { registerRoutes } from "./routes/routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://m.stripe.network", "https://js.stripe.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "https://api.stripe.com", "https://m.stripe.network"],
      fontSrc: ["'self'", "https://m.stripe.network", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com", "https://m.stripe.network"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const exactOrigins = [
      "https://adaptalyfe-5a1d3.web.app",
      "https://adaptalyfe-5a1d3.firebaseapp.com",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "https://localhost",
      "capacitor://localhost",
      "ionic://localhost",
      "https://workspace.barrettrchl.repl.co",
      "https://adaptalyfe-db-production.up.railway.app",
      "https://app.getadaptalyfeapp.com",
    ];
    const allowedSuffixes = [".replit.dev", ".replit.co", ".railway.app", ".up.railway.app"];

    if (
      exactOrigins.includes(origin) ||
      (origin.startsWith("https://") && allowedSuffixes.some((suffix) => origin.endsWith(suffix)))
    ) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Adaptalyfe-Client"],
  exposedHeaders: ["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"],
  preflightContinue: false,
  optionsSuccessStatus: 200,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use("/api/auth", authLimiter);
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.use("/api", router);
await registerRoutes(app);

export default app;

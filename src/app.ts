import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import prayerDebtRouter from "./routes/prayerDebtRoutes";
import webhookRouter from "./routes/webhookRoutes";
import duaRouter from "./routes/duaRoutes";
import aiRouter from "./routes/aiRoutes";
import goalRouter from "./routes/goalRoutes";
import glossaryRouter from "./routes/glossaryRoutes";
import prayerCalendarRouter from "./routes/prayerCalendarRoutes";
import friendsRouter from "./routes/friendsRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*"
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Prayer Debt Calculator API",
    version: "1.0.0",
    endpoints: {
      prayerDebt: "/api/prayer-debt",
      webhooks: "/api/webhooks",
      duas: "/api/duas",
      ai: "/api/ai",
      goals: "/api/goals",
      glossary: "/api/glossary",
      prayerCalendar: "/api/prayer-calendar",
      friends: "/api/friends"
    }
  });
});

app.use("/api/prayer-debt", prayerDebtRouter);
app.use("/api/webhooks", webhookRouter);
app.use("/api/duas", duaRouter);
app.use("/api/ai", aiRouter);
app.use("/api/goals", goalRouter);
app.use("/api/glossary", glossaryRouter);
app.use("/api/prayer-calendar", prayerCalendarRouter);
app.use("/api/friends", friendsRouter);

app.use(errorHandler);

export default app;



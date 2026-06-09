import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { verifyDatabaseConnection } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(
        `${req.method} ${req.path} ${res.statusCode} (${Date.now() - start}ms)`,
      );
    }
  });

  next();
});

(async () => {
  try {
    await verifyDatabaseConnection();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }

  await registerRoutes(httpServer, app);

  app.use(
    (err: any, _req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) {
        return next(err);
      }

      console.error(err);

      res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
      });
    },
  );

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = Number(process.env.PORT) || 7815;

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();
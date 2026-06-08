import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import {
  getDatabaseConnectionInfo,
  getDatabaseHost,
  verifyDatabaseConnection,
} from "./db";

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

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

function logDatabaseUrlHint() {
  const url = process.env.DATABASE_URL!;
  const host = getDatabaseHost(url);
  const info = getDatabaseConnectionInfo(url);
  console.log(
    `Database target: host=${info.host} port=${info.port} user=${info.user}`,
  );
  if (host.startsWith("db.") && host.endsWith(".supabase.co")) {
    console.error(
      "DATABASE_URL uses Supabase direct host (db.*.supabase.co). " +
        "On Render, use the Session pooler URL from Supabase, e.g. " +
        "postgres.PROJECT_REF@aws-1-REGION.pooler.supabase.com:5432/postgres?sslmode=require",
    );
  }
  if (host === "localhost" || host === "127.0.0.1") {
    console.error(
      "DATABASE_URL points to localhost. Set the Supabase Session pooler URL in Render Environment.",
    );
  }
}

(async () => {
  logDatabaseUrlHint();
  try {
    await verifyDatabaseConnection();
  } catch (err) {
    console.error("Database connection failed at startup:", err);
    console.error(
      "Auth routes will not work until DATABASE_URL is fixed on Render. " +
        "Use the same Session pooler URL that worked for npm run db:push locally.",
    );
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "7815", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

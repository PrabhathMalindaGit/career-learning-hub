import "dotenv/config";
import { createServer, type Server } from "node:http";
import mongoose from "mongoose";
import { app } from "./app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";
import { env } from "./config/env.js";
import { initializeJobSystem } from "./jobs/job.system.js";
import {
  markJobSystemReady,
  markShuttingDown,
  markStorageReady,
} from "./modules/health/runtimeReadiness.js";
import { initializePrivateStorage } from "./modules/assets/storage/storage.factory.js";
import {
  logger,
  serializeErrorForLog,
} from "./shared/logger.js";

async function closeHttpServer(
  server: Server,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });

    server.closeIdleConnections?.();
  });
}

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await initializePrivateStorage();
  markStorageReady();

  const jobSystem = await initializeJobSystem();
  markJobSystemReady();

  const server = createServer(app);
  server.requestTimeout =
    env.SERVER_REQUEST_TIMEOUT_MS;
  server.headersTimeout =
    env.SERVER_HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout =
    env.SERVER_KEEP_ALIVE_TIMEOUT_MS;
  server.maxRequestsPerSocket = 1_000;

  let shuttingDown = false;

  async function shutdown(
    reason: string,
    exitCode = 0,
  ): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    markShuttingDown();

    logger.info("server.shutdown.started", {
      reason,
      exitCode,
    });

    const forceTimer = setTimeout(() => {
      logger.error("server.shutdown.forced", {
        reason,
        timeoutMs: env.SHUTDOWN_TIMEOUT_MS,
      });
      server.closeAllConnections?.();
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);
    forceTimer.unref();

    try {
      const shutdownResults = await Promise.allSettled([
        closeHttpServer(server),
        jobSystem.stop(),
      ]);
      const rejected = shutdownResults.find(
        (
          result,
        ): result is PromiseRejectedResult =>
          result.status === "rejected",
      );

      if (rejected) {
        throw rejected.reason;
      }

      if (mongoose.connection.readyState !== 0) {
        await disconnectDatabase();
      }

      clearTimeout(forceTimer);
      logger.info("server.shutdown.completed", {
        reason,
        exitCode,
      });
      process.exit(exitCode);
    } catch (error) {
      clearTimeout(forceTimer);
      logger.error("server.shutdown.failed", {
        reason,
        ...serializeErrorForLog(error),
      });
      server.closeAllConnections?.();
      process.exit(1);
    }
  }

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM", 0);
  });
  process.once("SIGINT", () => {
    void shutdown("SIGINT", 0);
  });
  process.once("unhandledRejection", (error) => {
    logger.error("process.unhandled-rejection", {
      ...serializeErrorForLog(error),
    });
    void shutdown("unhandledRejection", 1);
  });
  process.once("uncaughtException", (error) => {
    logger.error("process.uncaught-exception", {
      ...serializeErrorForLog(error),
    });
    void shutdown("uncaughtException", 1);
  });

  server.on("clientError", (error, socket) => {
    logger.warn("http.client-error", {
      ...serializeErrorForLog(error),
    });

    if (socket.writable) {
      socket.end(
        "HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n",
      );
    }
  });

  server.on("error", (error) => {
    logger.error("server.http-error", {
      ...serializeErrorForLog(error),
    });
  });

  server.listen(env.PORT, () => {
    logger.info("server.started", {
      port: env.PORT,
      environment: env.NODE_ENV,
      storageDriver: env.ASSET_STORAGE_DRIVER,
      jobsEnabled: env.JOB_WORKER_ENABLED,
      aiProvider: env.AI_DEFAULT_PROVIDER,
      aiConfigured: Boolean(env.GEMINI_API_KEY),
      trustProxyHops: env.TRUST_PROXY_HOPS,
    });
  });
}

bootstrap().catch(async (error) => {
  logger.error("server.startup.failed", {
    ...serializeErrorForLog(error),
  });

  if (mongoose.connection.readyState !== 0) {
    await disconnectDatabase().catch(
      (disconnectError: unknown) => {
        logger.error(
          "database.disconnect-after-startup-failure.failed",
          {
            ...serializeErrorForLog(
              disconnectError,
            ),
          },
        );
      },
    );
  }

  process.exit(1);
});

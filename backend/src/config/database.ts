import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../shared/logger.js";

export interface DatabaseConnectionOptions {
  autoIndex?: boolean;
  autoCreate?: boolean;
}

export async function connectDatabase(
  options: DatabaseConnectionOptions = {},
): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: options.autoIndex ?? !env.isProduction,
    autoCreate: options.autoCreate ?? true,
  });
  logger.info("database.connected", {
    databaseName: mongoose.connection.name,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

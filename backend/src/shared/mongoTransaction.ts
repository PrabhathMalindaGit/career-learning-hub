import mongoose, { type ClientSession } from "mongoose";

export async function withMongoTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    let value: T | undefined;

    await session.withTransaction(async () => {
      value = await operation(session);
    });

    if (value === undefined) {
      throw new Error("The MongoDB transaction completed without a result.");
    }

    return value;
  } finally {
    await session.endSession();
  }
}

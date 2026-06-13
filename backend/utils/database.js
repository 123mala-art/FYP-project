import mongoose from "mongoose";

const CONNECTED = 1;
const CONNECTING = 2;

export function isDatabaseReady(connection = mongoose.connection) {
  return connection.readyState === CONNECTED;
}

export function databaseUnavailablePayload() {
  return {
    success: false,
    message: "Database unavailable. Check the backend MONGO_URI value in Vercel.",
  };
}

export async function waitForDatabaseReady({
  connection = mongoose.connection,
  timeoutMs = Number(process.env.DB_READY_TIMEOUT_MS || 5000),
} = {}) {
  if (connection.readyState === CONNECTED) return true;
  if (connection.readyState !== CONNECTING) return false;

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      connection.off("connected", onConnected);
      connection.off("open", onConnected);
      connection.off("error", onFailed);
      connection.off("disconnected", onFailed);
      resolve(value);
    };

    const onConnected = () => finish(true);
    const onFailed = () => finish(false);
    const timer = setTimeout(() => finish(connection.readyState === CONNECTED), timeoutMs);

    connection.once("connected", onConnected);
    connection.once("open", onConnected);
    connection.once("error", onFailed);
    connection.once("disconnected", onFailed);
  });
}

export function requireDatabase() {
  return async (_req, res, next) => {
    if (await waitForDatabaseReady()) {
      return next();
    }

    return res.status(503).json(databaseUnavailablePayload());
  };
}

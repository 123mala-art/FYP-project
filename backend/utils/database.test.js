import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  databaseUnavailablePayload,
  isDatabaseReady,
  waitForDatabaseReady,
} from "./database.js";

function fakeConnection(readyState) {
  const connection = new EventEmitter();
  connection.readyState = readyState;
  return connection;
}

test("isDatabaseReady returns true only for connected state", () => {
  assert.equal(isDatabaseReady(fakeConnection(1)), true);
  assert.equal(isDatabaseReady(fakeConnection(0)), false);
  assert.equal(isDatabaseReady(fakeConnection(2)), false);
});

test("waitForDatabaseReady returns false when disconnected", async () => {
  assert.equal(await waitForDatabaseReady({ connection: fakeConnection(0), timeoutMs: 1 }), false);
});

test("waitForDatabaseReady resolves true when a connecting database opens", async () => {
  const connection = fakeConnection(2);
  const wait = waitForDatabaseReady({ connection, timeoutMs: 100 });

  queueMicrotask(() => {
    connection.readyState = 1;
    connection.emit("connected");
  });

  assert.equal(await wait, true);
});

test("databaseUnavailablePayload is safe for clients", () => {
  assert.deepEqual(databaseUnavailablePayload(), {
    success: false,
    message: "Database unavailable. Check the backend MONGO_URI value in Vercel.",
  });
});

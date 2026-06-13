import test from "node:test";
import assert from "node:assert/strict";
import {
  executeViaWandbox,
  formatWandboxOutput,
  getWandboxInfrastructureError,
  normalizeEscapedNewlines,
} from "./wandbox.js";

test("normalizeEscapedNewlines converts double-escaped code", () => {
  assert.equal(normalizeEscapedNewlines("print('hi')\\nprint('bye')"), "print('hi')\nprint('bye')");
});

test("formatWandboxOutput prefers runtime output", () => {
  assert.equal(formatWandboxOutput({ program_output: "hello\n" }), "hello\n");
});

test("formatWandboxOutput includes compiler/runtime errors", () => {
  assert.equal(
    formatWandboxOutput({
      compiler_error: "SyntaxError\n",
      program_error: "Traceback\n",
    }),
    "Traceback\nSyntaxError\n"
  );
});

test("getWandboxInfrastructureError detects container failures", () => {
  assert.match(
    getWandboxInfrastructureError({
      compiler_error: "Error: OCI runtime error: crun: clone: Resource temporarily unavailable\n",
    }),
    /OCI runtime error/
  );
});

test("executeViaWandbox posts compiler, code, stdin, and options", async () => {
  let requestBody;
  const fetchImpl = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      async json() {
        return { program_output: "ok\n" };
      },
    };
  };

  const output = await executeViaWandbox({
    compiler: "cpython-3.10.15",
    code: "print(input())",
    input: "ahtasham",
    options: "-O2",
    maxRetries: 0,
    fetchImpl,
  });

  assert.equal(output, "ok\n");
  assert.deepEqual(requestBody, {
    compiler: "cpython-3.10.15",
    code: "print(input())",
    options: "-O2",
    stdin: "ahtasham",
    save: false,
  });
});

test("executeViaWandbox retries Wandbox infrastructure failures", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return {
      ok: true,
      async json() {
        if (calls === 1) {
          return {
            compiler_error: "Error: OCI runtime error: crun: clone: Resource temporarily unavailable\n",
          };
        }

        return { program_output: "ok\n" };
      },
    };
  };

  const output = await executeViaWandbox({
    compiler: "nodejs-20.17.0",
    code: "console.log('ok')",
    maxRetries: 1,
    retryDelayMs: 0,
    fetchImpl,
  });

  assert.equal(output, "ok\n");
  assert.equal(calls, 2);
});

import fetch from "node-fetch";

export const DEFAULT_WANDBOX_URL = "https://wandbox.org/api/compile.json";
export const DEFAULT_WANDBOX_RETRY_DELAY_MS = 500;

export function normalizeEscapedNewlines(code) {
  if (typeof code !== "string") return "";

  if (!code.includes("\n") && code.includes("\\n")) {
    return code.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  }

  return code;
}

export function formatWandboxOutput(data) {
  const output = [
    data.program_output,
    data.program_error,
    data.compiler_output,
    data.compiler_error,
    data.stderr,
  ]
    .filter(Boolean)
    .join("");

  return output || "✅ Executed successfully (no output)";
}

export function getWandboxInfrastructureError(data) {
  const message = [...new Set([
    data.compiler_error,
    data.compiler_message,
    data.program_error,
    data.program_message,
    data.stderr,
  ]
    .filter(Boolean)
    .map((entry) => entry.trim()))]
    .join("\n");

  if (/OCI runtime error|Resource temporarily unavailable|container.*unavailable/i.test(message)) {
    return message;
  }

  return "";
}

export async function executeViaWandbox({
  compiler,
  code,
  input = "",
  options = "",
  url = process.env.WANDBOX_URL || DEFAULT_WANDBOX_URL,
  maxRetries = Number(process.env.WANDBOX_MAX_RETRIES || 3),
  retryDelayMs = Number(process.env.WANDBOX_RETRY_DELAY_MS || DEFAULT_WANDBOX_RETRY_DELAY_MS),
  fetchImpl = fetch,
}) {
  let attempt = 0;
  let lastErr;
  const normalizedCode = normalizeEscapedNewlines(code);

  while (attempt <= maxRetries) {
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiler,
          code: normalizedCode,
          options,
          stdin: input || "",
          save: false,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}${text ? ` ${text}` : ""}`);
      }

      const data = await response.json();
      const infrastructureError = getWandboxInfrastructureError(data);
      if (infrastructureError) {
        throw new Error(infrastructureError);
      }

      return formatWandboxOutput(data);
    } catch (err) {
      lastErr = err;
      attempt += 1;
      console.warn(`Wandbox attempt ${attempt} failed: ${err.message}`);

      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }
  }

  throw lastErr;
}

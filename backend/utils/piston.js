import fetch from "node-fetch";

export async function executePistonWithRetry(payload, maxRetries = 3) {
  const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston/execute";
  const PISTON_TOKEN = process.env.PISTON_TOKEN || null;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Piston attempt ${attempt}/${maxRetries} -> ${PISTON_URL}`);

      const headers = { "Content-Type": "application/json" };
      if (PISTON_TOKEN) headers["Authorization"] = `Bearer ${PISTON_TOKEN}`;

      const response = await fetch(PISTON_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const data = await response.json();
      console.log("✅ Piston execution successful");
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Piston attempt ${attempt} failed: ${err.message}`);

      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

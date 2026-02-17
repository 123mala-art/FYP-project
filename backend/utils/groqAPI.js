import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = {
  primary: "llama-3.3-70b-versatile",
  fallback: "llama-3.1-8b-instant",
  alternative: "mixtral-8x7b-32768"
};

export async function queryGroqAPI(query, apiKey) {
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  let modelToUse = GROQ_MODELS.primary;
  let attemptCount = 0;
  const maxAttempts = 2;

  while (attemptCount < maxAttempts) {
    try {
      console.log(`🔄 Attempting with model: ${modelToUse}`);

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: "You are a helpful coding assistant specialized in Python, JavaScript, C++, HTML, and CSS. Provide clear, concise answers with code examples when relevant. Format code in markdown with proper syntax highlighting. Keep responses under 500 words."
            },
            {
              role: "user",
              content: query
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || "No response from AI";
        console.log(`✅ AI Response sent successfully using model: ${modelToUse}`);
        return answer;
      }

      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Groq API Error (${modelToUse}):`, response.status, errorData);

      if (response.status === 400 && errorData.error?.message?.includes("model")) {
        console.log("⚠️ Model not available, trying fallback...");
        modelToUse = GROQ_MODELS.fallback;
        attemptCount++;
        continue;
      }

      break;
    } catch (fetchError) {
      console.error(`❌ Fetch error with ${modelToUse}:`, fetchError.message);
      attemptCount++;
      if (attemptCount < maxAttempts) {
        modelToUse = GROQ_MODELS.fallback;
        continue;
      }
      throw fetchError;
    }
  }

  throw new Error("All Groq API attempts failed");
}

export function generateSmartFallback(query) {
  const lowerQuery = query.toLowerCase();

  // Python examples
  if (lowerQuery.includes("python")) {
    if (lowerQuery.includes("loop")) {
      return `Python Loops:\n\`\`\`python\nfor i in range(5):\n    print(i)\n\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n\`\`\``;
    }
    if (lowerQuery.includes("function")) {
      return `Python Functions:\n\`\`\`python\ndef greet(name):\n    return f"Hello, {name}!"\n\nsquare = lambda x: x ** 2\n\`\`\``;
    }
  }

  // JavaScript examples
  if (lowerQuery.includes("javascript") || lowerQuery.includes("js")) {
    if (lowerQuery.includes("array")) {
      return `JavaScript Arrays:\n\`\`\`javascript\nlet arr = [1, 2, 3];\nlet doubled = arr.map(x => x * 2);\nlet evens = arr.filter(x => x % 2 === 0);\n\`\`\``;
    }
  }

  return "I'd love to help! Ask me about Python, JavaScript, C++, HTML, or CSS with specific questions.";
}

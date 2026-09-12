// pages/api/generate-quiz.js
// Takes a topic (e.g. "career planning for students") and asks Gemini
// to generate a small set of poll-ready multiple-choice questions.

const { GoogleGenAI } = require("@google/genai");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { topic, numQuestions = 3 } = req.body;

  if (!topic || !topic.trim()) {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "GEMINI_API_KEY is not set in .env" });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are helping a teacher create a live quiz for their class.
Topic: "${topic}"

Generate exactly ${numQuestions} multiple-choice questions about this topic.
Each question must have exactly 4 short answer options, and exactly one of
them must be correct.

Respond with ONLY valid JSON, no markdown formatting, no backticks, no extra text.
Use exactly this structure:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0
    }
  ]
}
"correctIndex" is the 0-based index (0, 1, 2, or 3) of the correct option in the "options" array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const text = response.text;

    // Clean up in case the model wraps the JSON in markdown fences anyway
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Gemini quiz generation error:", err);
    res.status(500).json({ error: "Failed to generate quiz. Check your API key and try again." });
  }
}

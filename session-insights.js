// pages/api/session-insights.js
// Takes a session code, gathers all its poll results, and asks Gemini
// to produce a short human-readable summary + weak-area callouts.
// Usage: POST /api/session-insights { code: "AB12CD" }

const { GoogleGenAI } = require("@google/genai");
const prisma = require("../../lib/prisma");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Session code is required" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "GEMINI_API_KEY is not set in .env" });
    return;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { code },
      include: {
        participants: true,
        polls: {
          include: {
            options: {
              include: { responses: true },
            },
          },
        },
        questions: true,
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.polls.length === 0) {
      res.status(200).json({ summary: "No polls were launched in this session, so there's no data to summarize yet." });
      return;
    }

    // Build a compact plain-text description of the session's data for the model.
    const pollLines = session.polls
      .map((poll) => {
        const totalVotes = poll.options.reduce((sum, o) => sum + o.responses.length, 0);
        const optionLines = poll.options
          .map((o) => {
            const pct = totalVotes > 0 ? Math.round((o.responses.length / totalVotes) * 100) : 0;
            return `   - "${o.text}": ${o.responses.length} votes (${pct}%)`;
          })
          .join("\n");
        return `Poll: "${poll.question}" (${totalVotes} total responses)\n${optionLines}`;
      })
      .join("\n\n");

    const dataSummary = `Session title: "${session.title}"
Total participants: ${session.participants.length}
Total polls: ${session.polls.length}
Total questions asked by participants: ${session.questions.length}

Poll-by-poll results:
${pollLines}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are helping a teacher/trainer understand how their live session went, based on poll results.

Here is the raw data from the session:
${dataSummary}

Write a short, useful summary for the host in plain language, covering:
1. Overall engagement (how many participated, general vibe)
2. Any topic/question where responses were split or suggest confusion (a "weak area") -- name it plainly if one clearly exists, or say results looked confident/clear if not
3. One practical suggestion for what the host might want to revisit or follow up on next session

Keep it to 4-6 short sentences, friendly and direct, no headers or bullet points -- just a short paragraph a busy teacher can read in 10 seconds.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.status(200).json({ summary: response.text.trim() });
  } catch (err) {
    console.error("Session insights generation error:", err);
    res.status(500).json({ error: "Failed to generate insights. Please try again." });
  }
}

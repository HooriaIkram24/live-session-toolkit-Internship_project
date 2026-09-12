// pages/api/session-attendance.js
// Returns every participant in a session with their join time and how
// many of the session's polls they actually responded to (engagement rate).
// Usage: /api/session-attendance?code=AB12CD

const prisma = require("../../lib/prisma");

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: "Missing session code" });
    return;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { code },
      include: {
        polls: { select: { id: true } },
        participants: {
          orderBy: { joinedAt: "asc" },
          include: {
            responses: { select: { id: true } },
            questions: { select: { id: true } },
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const totalPolls = session.polls.length;

    const participants = session.participants.map((p) => {
      const answered = p.responses.length;
      const rate = totalPolls > 0 ? Math.round((answered / totalPolls) * 100) : 0;
      return {
        id: p.id,
        name: p.name || "Anonymous",
        email: p.email,
        joinedAt: p.joinedAt,
        pollsAnswered: answered,
        totalPolls,
        participationRate: rate,
        questionsAsked: p.questions.length,
      };
    });

    res.status(200).json({
      title: session.title,
      code: session.code,
      totalPolls,
      totalParticipants: participants.length,
      participants,
    });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
}

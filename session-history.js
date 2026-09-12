// pages/api/session-history.js
// Returns a list of all past sessions (for the default host), with a
// quick summary of each: title, code, date, poll count, participant count.

const prisma = require("../../lib/prisma");

export default async function handler(req, res) {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { polls: true, participants: true },
        },
      },
    });

    const summary = sessions.map((s) => ({
      code: s.code,
      title: s.title,
      createdAt: s.createdAt,
      pollCount: s._count.polls,
      participantCount: s._count.participants,
    }));

    res.status(200).json({ sessions: summary });
  } catch (err) {
    console.error("Error fetching session history:", err);
    res.status(500).json({ error: "Failed to fetch session history" });
  }
}

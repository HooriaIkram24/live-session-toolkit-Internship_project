// pages/history.js
// SESSION HISTORY
// Lists every past session with a quick summary, linking to its full
// results page. This is what turns one-off polls into trackable history.

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/session-history")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSessions(data.sessions);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load session history");
        setLoading(false);
      });
  }, []);

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">📋 Session History</h1>
        <p className="text-slate-400 text-sm mt-1">All your past sessions, in one place</p>
      </div>

      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to dashboard
      </Link>

      {loading && <p className="text-slate-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <p className="text-slate-500">No sessions yet — go create one!</p>
      )}

      <div className="w-full max-w-2xl flex flex-col gap-3">
        {sessions.map((s) => (
          <Link
            key={s.code}
            href={`/results/${s.code}`}
            className="bg-white rounded-xl shadow p-5 flex items-center justify-between hover:shadow-md transition"
          >
            <div>
              <p className="font-semibold text-slate-800">{s.title}</p>
              <p className="text-sm text-slate-400">{formatDate(s.createdAt)} · Code: {s.code}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{s.pollCount} poll{s.pollCount !== 1 ? "s" : ""}</p>
              <p>{s.participantCount} participant{s.participantCount !== 1 ? "s" : ""}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

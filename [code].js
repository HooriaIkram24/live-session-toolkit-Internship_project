// pages/results/[code].js
// HOST-FACING RESULTS PAGE
// Shows every poll from a session, with vote counts AND exactly which
// participant (name/email) chose which option -- plus an AI-generated
// summary of how the session went.
 
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
 
export default function SessionResults() {
  const router = useRouter();
  const { code } = router.query;
 
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
 
  const [insights, setInsights] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
 
  useEffect(() => {
    if (!code) return;
    fetch(`/api/session-results?code=${code}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load results");
        setLoading(false);
      });
  }, [code]);
 
  async function generateInsights() {
    setInsightsLoading(true);
    setInsightsError("");
    setInsights("");
    try {
      const res = await fetch("/api/session-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (json.error) {
        setInsightsError(json.error);
      } else {
        setInsights(json.summary);
      }
    } catch (err) {
      setInsightsError("Failed to generate insights.");
    } finally {
      setInsightsLoading(false);
    }
  }
 
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading results...</div>;
  }
 
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }
 
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">📊 {data.title}</h1>
        <p className="text-slate-400 text-sm mt-1">Session code: {data.code}</p>
        <a href={`/attendance/${data.code}`} className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          🙋 View Attendance →
        </a>
      </div>
 
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">🤖 AI Session Insights</h2>
          <button
            onClick={generateInsights}
            disabled={insightsLoading}
            className="text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition"
          >
            {insightsLoading ? "Generating..." : "✨ Generate Insights"}
          </button>
        </div>
        {insightsError && <p className="text-sm text-red-500">{insightsError}</p>}
        {insights && <p className="text-slate-700 leading-relaxed">{insights}</p>}
        {!insights && !insightsError && !insightsLoading && (
          <p className="text-sm text-slate-400">Click the button to get an AI summary of how this session went.</p>
        )}
      </div>
 
      {data.polls.length === 0 && (
        <p className="text-slate-500">No polls were launched in this session yet.</p>
      )}
 
      {data.polls.map((poll) => (
        <div key={poll.id} className="bg-white rounded-xl shadow p-6 w-full max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{poll.question}</h2>
 
          <div className="flex flex-col gap-4">
            {poll.options.map((opt) => (
              <div
                key={opt.id}
                className={
                  opt.isCorrect
                    ? "border-2 border-green-500 bg-green-50 rounded-lg p-4"
                    : "border border-slate-200 rounded-lg p-4"
                }
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-slate-700 flex items-center gap-2">
                    {opt.text}
                    {opt.isCorrect && (
                      <span className="text-xs font-semibold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
                        ✓ Correct answer
                      </span>
                    )}
                  </p>
                  <span className="text-sm text-indigo-600 font-semibold">{opt.votes} vote{opt.votes !== 1 ? "s" : ""}</span>
                </div>
                {opt.voters.length > 0 ? (
                  <ul className="text-sm text-slate-500 flex flex-wrap gap-2">
                    {opt.voters.map((v, i) => (
                      <li key={i} className="bg-slate-100 rounded-full px-3 py-1">
                        {v.name}{v.email ? ` (${v.email})` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-300 italic">No one chose this option</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
// pages/index.js
// HOST DASHBOARD
// Flow: create a session -> get a join code + QR -> launch polls (manual or AI-generated) -> see live results.
 
import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";
import PollForm from "../components/PollForm";
import LiveResults from "../components/LiveResults";
import AiQuizGenerator from "../components/AiQuizGenerator";
import AiQuizGeneration from "../components/AiQuizGeneration";
import QandAPanel from "../components/QandAPanel";
 
export default function Home() {
  const [socket, setSocket] = useState(null);
  const [title, setTitle] = useState("");
  const [sessionCode, setSessionCode] = useState(null);
  const [activePoll, setActivePoll] = useState(null);
 
  useEffect(() => {
    const s = getSocket();
    setSocket(s);
 
    s.on("results-updated", (poll) => {
      setActivePoll(poll);
    });
 
    return () => {
      s.off("results-updated");
    };
  }, []);
 
  function createSession(e) {
    e.preventDefault();
    if (!socket) return;
    socket.emit("host:create-session", { title: title || "My Live Session" }, ({ code }) => {
      setSessionCode(code);
    });
  }
 
  function launchPoll({ question, options, type, correctIndex }) {
    if (!socket || !sessionCode) return;
    socket.emit("host:launch-poll", { sessionCode, question, options, type, correctIndex });
  }
 
  useEffect(() => {
    if (!socket) return;
    socket.on("poll-launched", (poll) => setActivePoll(poll));
    return () => socket.off("poll-launched");
  }, [socket]);
 
  return (
    <div className="min-h-screen flex flex-col items-center gap-8 py-12 px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800">🎓 Live Session Toolkit</h1>
        <a href="/history" className="text-sm text-indigo-600 hover:underline">
          📋 View History
        </a>
      </div>
 
      {!sessionCode ? (
        <form onSubmit={createSession} className="session-create-box bg-white rounded-xl shadow p-6 flex flex-col gap-4 w-full max-w-md">
          <h2 className="text-lg font-semibold text-slate-800">Start a new session</h2>
          <input
            type="text"
            placeholder="Session title (e.g. Friday Leadership Circle)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition"
          >
            Create Session
          </button>
        </form>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center gap-3 w-full max-w-md">
            <p className="text-slate-500 text-sm">Participants join at</p>
            <p className="text-2xl font-bold tracking-widest text-indigo-600">{sessionCode}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/qrcode?code=${sessionCode}`} alt="Join QR code" className="w-40 h-40" />
            <p className="text-xs text-slate-400 break-all">
              {typeof window !== "undefined" && `${window.location.origin}/join/${sessionCode}`}
            </p>
            <a
              href={`/results/${sessionCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline"
            >
              📊 View who chose what →
            </a>
          </div>
 
          <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl">
            <PollForm onLaunch={launchPoll} />
            <AiQuizGenerator onLaunch={launchPoll} />
            <AiQuizGeneration socket={socket} sessionCode={sessionCode} />
          </div>
 
          {activePoll && <LiveResults poll={activePoll} />}
 
          <QandAPanel socket={socket} sessionCode={sessionCode} />
        </>
      )}
    </div>
  );
}
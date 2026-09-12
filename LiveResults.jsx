// components/LiveResults.jsx
// Shows the current poll's question and a live-updating bar chart of votes.

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function LiveResults({ poll }) {
  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const chartData = poll.options.map((o) => ({ name: o.text, votes: o.votes }));

  return (
    <div className="bg-white rounded-xl shadow p-6 w-full max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">{poll.question}</h2>
      <p className="text-sm text-slate-500 mb-4">{totalVotes} response{totalVotes !== 1 ? "s" : ""}</p>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={140} />
            <Tooltip />
            <Bar dataKey="votes" fill="#4f46e5" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

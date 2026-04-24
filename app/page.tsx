"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const entries = input.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: entries }),
      });
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setError("❌ API call failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function renderTree(obj, indent = 0) {
    return Object.entries(obj).map(([key, val]) => (
      <div key={key} style={{ marginLeft: indent * 20 }}>
        <span className="text-green-400 font-bold">📦 {key}</span>
        {Object.keys(val).length > 0 && renderTree(val, indent + 1)}
      </div>
    ));
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-400 mb-2">
            🌳 BFHL Tree Visualizer
          </h1>
          <p className="text-gray-400">SRM Full Stack Challenge — Round 1</p>
        </div>

        {/* Input */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 shadow-lg">
          <label className="block text-sm text-gray-400 mb-2 font-semibold">
            Enter node edges (comma separated)
          </label>
          <textarea
            className="w-full bg-gray-800 text-white rounded-xl p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            placeholder='e.g. A->B, A->C, B->D, hello, 1->2'
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold py-3 rounded-xl transition-all text-lg"
          >
            {loading ? "Processing..." : "🚀 Submit"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900 border border-red-500 text-red-200 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">

            {/* Identity */}
            <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
              <h2 className="text-blue-400 font-bold text-lg mb-3">👤 Identity</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-400">User ID</p>
                  <p className="font-mono text-white">{result.user_id}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-400">Email</p>
                  <p className="font-mono text-white">{result.email_id}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-400">Roll Number</p>
                  <p className="font-mono text-white">{result.college_roll_number}</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
              <h2 className="text-blue-400 font-bold text-lg mb-3">📊 Summary</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-green-900 rounded-xl p-3 text-center">
                  <p className="text-green-300 text-2xl font-bold">{result.summary.total_trees}</p>
                  <p className="text-gray-400">Total Trees</p>
                </div>
                <div className="bg-red-900 rounded-xl p-3 text-center">
                  <p className="text-red-300 text-2xl font-bold">{result.summary.total_cycles}</p>
                  <p className="text-gray-400">Total Cycles</p>
                </div>
                <div className="bg-blue-900 rounded-xl p-3 text-center">
                  <p className="text-blue-300 text-2xl font-bold">{result.summary.largest_tree_root}</p>
                  <p className="text-gray-400">Largest Tree Root</p>
                </div>
              </div>
            </div>

            {/* Hierarchies */}
            <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
              <h2 className="text-blue-400 font-bold text-lg mb-4">🌲 Hierarchies</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.hierarchies.map((h, i) => (
                  <div key={i} className={`rounded-xl p-4 ${h.has_cycle ? "bg-red-950 border border-red-700" : "bg-gray-800 border border-gray-700"}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-white text-lg">Root: {h.root}</span>
                      {h.has_cycle
                        ? <span className="bg-red-700 text-xs px-2 py-1 rounded-full">🔄 CYCLE</span>
                        : <span className="bg-green-700 text-xs px-2 py-1 rounded-full">✅ depth: {h.depth}</span>
                      }
                    </div>
                    {!h.has_cycle && (
                      <div className="font-mono text-sm bg-gray-900 rounded-lg p-3">
                        {renderTree(h.tree)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invalid + Duplicates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
                <h2 className="text-red-400 font-bold text-lg mb-3">❌ Invalid Entries</h2>
                {result.invalid_entries.length === 0
                  ? <p className="text-gray-500 text-sm">None</p>
                  : result.invalid_entries.map((e, i) => (
                    <span key={i} className="inline-block bg-red-900 text-red-200 text-xs font-mono px-2 py-1 rounded mr-2 mb-2">{e}</span>
                  ))
                }
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
                <h2 className="text-yellow-400 font-bold text-lg mb-3">⚠️ Duplicate Edges</h2>
                {result.duplicate_edges.length === 0
                  ? <p className="text-gray-500 text-sm">None</p>
                  : result.duplicate_edges.map((e, i) => (
                    <span key={i} className="inline-block bg-yellow-900 text-yellow-200 text-xs font-mono px-2 py-1 rounded mr-2 mb-2">{e}</span>
                  ))
                }
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
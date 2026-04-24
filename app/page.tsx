"use client";

import React, { useState } from "react";

// Typed interfaces for the expected data structures
interface HierarchyNode {
  [key: string]: HierarchyNode;
}

interface Hierarchy {
  root: string;
  tree: HierarchyNode;
  depth?: number;
  has_cycle?: boolean;
}

interface Summary {
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string | null;
}

interface ApiResult {
  user_id: string;
  email_id: string;
  college_roll_number: string;
  hierarchies: Hierarchy[];
  invalid_entries: string[];
  duplicate_edges: string[];
  summary: Summary;
}

export default function Home() {
  const [inputVal, setInputVal] = useState<string>(
    "A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->"
  );
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Filter, map and trim valid components natively
    const edges = inputVal.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: edges }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
      }

      const data: ApiResult = await res.json();
      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fully typed recursive function
  const renderTree = (obj: HierarchyNode, indent = 0): React.ReactNode => {
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;

    return (
      <div 
        className={`flex flex-col gap-[6px] ${
          indent > 0 ? "pl-5 border-l-[1.5px] border-emerald-900/50 ml-1 mt-1.5" : "mt-2"
        }`}
      >
        {keys.map((key) => (
          <div key={key} className="flex flex-col">
            <div className="flex items-center">
              <div className="px-3 py-1 bg-gray-900/80 ring-1 ring-white/10 rounded-lg text-sm font-semibold tracking-wide text-emerald-300 shadow-sm backdrop-blur-sm transition-colors hover:bg-gray-800">
                {key}
              </div>
            </div>
            {renderTree(obj[key], indent + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-xs font-semibold uppercase tracking-wider ring-1 ring-blue-700/50 mb-2">
            SRM Full Stack Round 1
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text pb-2">
            Tree Hierarchy Processor
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Input directed edges to visualize hierarchical trees, detect cycles, and identify duplicate or invalid entries seamlessly.
          </p>
        </header>

        <form 
          onSubmit={handleSubmit} 
          className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4"
        >
          <label htmlFor="edges" className="block text-sm font-medium text-gray-300">
            Node Relationships (Comma-separated)
          </label>
          <textarea
            id="edges"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            rows={4}
            className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-transparent transition-all shadow-inner font-mono text-sm leading-relaxed whitespace-pre-wrap select-auto"
            placeholder="e.g., A->B, A->C, B->D"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl font-medium tracking-wide transition-all duration-300 ${
                loading
                  ? "bg-blue-600/50 text-white/50 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Construct Trees"
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 text-red-400">
            <p className="font-medium inline-flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-center shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between z-10">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Authenticated</p>
                    <p className="text-gray-100 font-semibold">{result.user_id}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{result.email_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Roll Number</p>
                    <p className="inline-flex px-3 py-1.5 rounded-lg bg-gray-950/80 text-gray-300 font-mono text-sm border border-gray-800 shadow-inner">
                      {result.college_roll_number}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg text-center gap-1">
                  <p className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Trees</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 drop-shadow-sm">{result.summary.total_trees}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg text-center gap-1">
                  <p className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Cycles</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-red-400 drop-shadow-sm">{result.summary.total_cycles}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg text-center gap-1">
                  <p className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Largest Root</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 drop-shadow-sm">{result.summary.largest_tree_root || "-"}</p>
                </div>
              </div>
            </div>

            {(result.invalid_entries.length > 0 || result.duplicate_edges.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.invalid_entries.length > 0 && (
                  <div className="bg-orange-950/20 border border-orange-900/30 rounded-2xl p-5 shadow-lg">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Invalid Entries
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.invalid_entries.map((entry, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded-md text-xs font-mono shadow-sm">
                          {entry === "" ? "<empty string>" : entry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.duplicate_edges.length > 0 && (
                  <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-2xl p-5 shadow-lg">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-yellow-400 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Duplicate Edges
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.duplicate_edges.map((edge, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 rounded-md text-xs font-mono shadow-sm">
                          {edge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.hierarchies.length > 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Generated Hierarchies
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 border border-gray-800/80 p-5 rounded-3xl bg-gray-950/50 shadow-inner">
                  {result.hierarchies.map((h, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg hover:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
                      <div className="flex items-start justify-between mb-4 border-b border-gray-800/80 pb-4">
                        <div>
                          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Root Node</p>
                          <p className="text-2xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors uppercase">{h.root}</p>
                        </div>
                        {h.has_cycle ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-950/80 text-red-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-red-900/50 shadow-inner mt-1">
                            Cycle
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-emerald-900/40 shadow-inner mt-1">
                            Depth: {h.depth}
                          </span>
                        )}
                      </div>

                      <div className="flex-grow flex flex-col items-start overflow-x-auto custom-scrollbar pr-2 pb-2">
                        {h.has_cycle ? (
                          <div className="flex-grow flex items-center justify-center w-full min-h-[120px]">
                            <div className="text-center px-4 py-3 bg-red-950/20 rounded-xl border border-red-900/20">
                              <p className="text-red-400/80 text-sm font-medium tracking-wide">
                                Cyclic Dependency
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full">
                            {Object.keys(h.tree).length > 0 ? (
                              renderTree(h.tree)
                            ) : (
                              <div className="px-3 py-1 bg-gray-900/80 ring-1 ring-white/10 rounded-lg text-sm font-semibold tracking-wide text-emerald-300 shadow-sm inline-block mt-2">
                                {h.root}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
      `}} />
    </main>
  );
}
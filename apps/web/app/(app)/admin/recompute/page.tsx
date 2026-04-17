"use client";
import { useState } from "react";

export default function RecomputePage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    const res = await fetch("/api/v1/gap-analysis/recompute", { method: "POST" });
    const body = await res.json();
    setBusy(false);
    setResult(JSON.stringify(body.data, null, 2));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Recompute gap analysis</h1>
      <div className="card p-5 space-y-3">
        <p className="text-sm text-ink-700">
          Recomputes opportunity score, gap level, and recommendation for every product
          using the current localization status and heuristic weights.
        </p>
        <button className="btn btn-primary" onClick={run} disabled={busy}>
          {busy ? "Recomputing…" : "Run for all products"}
        </button>
        {result && <pre className="text-xs bg-surface-50 p-3 rounded-lg overflow-auto">{result}</pre>}
      </div>
    </div>
  );
}

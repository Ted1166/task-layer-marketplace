"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import ActiveSessionPanel from "@/components/ActiveSessionPanel";
import { CATEGORY_LABEL, CATEGORY_COLOR } from "@/lib/categories";

interface AgentDetail {
  id: string;
  address: string;
  name: string;
  category: string;
  description: string;
  registeredAt: string;
  liveMetricLabel: string;
  liveMetricValue: string;
  trustScore: {
    score: number;
    identityReputationScore: number;
    sessionComplianceScore: number;
    communityReportScore: number;
  } | null;
  sessions: {
    id: string;
    spendCap: number;
    spent: number;
    expiresAt: string;
    exceededCap: boolean;
    actedAfterExp: boolean;
    revoked: boolean;
    activities: { id: string; txHash: string; chain: string; amountUsd: number; createdAt: string }[];
  }[];
  reports: { summary: string; verified: boolean; createdAt: string }[];
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [spendCap, setSpendCap] = useState("500");
  const [durationDays, setDurationDays] = useState("7");
  const [hiring, setHiring] = useState(false);

  function refetch() {
    fetch(`/api/agents/${id}`)
      .then((r) => r.json())
      .then(setAgent);
  }

  useEffect(refetch, [id]);

  async function hireAgent() {
    setHiring(true);
    await fetch(`/api/agents/${id}/hire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spendCap: Number(spendCap), durationDays: Number(durationDays) }),
    });
    setHiring(false);
    refetch();
  }

  async function revokeSession(sessionId: string) {
    await fetch(`/api/sessions/${sessionId}/revoke`, { method: "POST" });
    refetch();
  }

  async function executeSession(sessionId: string): Promise<string | null> {
    const res = await fetch(`/api/sessions/${sessionId}/execute`, { method: "POST" });
    const data = await res.json();
    refetch();
    if (!res.ok) return data.error || "Action failed";
    return null;
  }

  async function submitReport() {
    if (reportText.trim().length < 10) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: id, summary: reportText }),
    });
    setReportText("");
    setReportSent(true);
    refetch();
  }

  if (!agent) return <p className="text-sm text-muted">Loading…</p>;

  const activeSession = agent.sessions.find(
    (s) => !s.revoked && new Date(s.expiresAt) > new Date()
  );

  return (
    <div>
      <Link href="/" className="text-sm text-muted hover:text-primary">
        ← back to catalog
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <span className={`inline-block rounded border px-2 py-0.5 text-xs font-data ${CATEGORY_COLOR[agent.category]}`}>
            {CATEGORY_LABEL[agent.category]}
          </span>
          <h1 className="mt-2 text-xl font-medium">{agent.name}</h1>
          <p className="mt-1 text-sm font-data text-muted">{agent.address}</p>
        </div>
      </div>

      <p className="mt-4 max-w-xl text-sm text-muted leading-relaxed">{agent.description}</p>

      {activeSession && (
        <div className="mt-6 max-w-xl">
          <ActiveSessionPanel session={activeSession} onRevoke={revokeSession} onExecute={executeSession} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {agent.trustScore && <ScoreBreakdown breakdown={agent.trustScore} />}

        <div className="rounded border border-border bg-panel p-5">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-sm text-muted">{agent.liveMetricLabel}</span>
            <span className="text-2xl font-data">{agent.liveMetricValue}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-xs text-muted">Spend cap ($)</label>
              <input
                type="number"
                value={spendCap}
                onChange={(e) => setSpendCap(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-ink px-2 py-1.5 text-sm font-data"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Duration (days)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-ink px-2 py-1.5 text-sm font-data"
              />
            </div>
          </div>
          <button
            onClick={hireAgent}
            disabled={hiring}
            className="w-full rounded border border-primary py-2 text-sm hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {hiring ? "Hiring…" : "Hire this agent"}
          </button>
          <p className="mt-2 text-xs text-muted">
            Creates a spend-capped session tracked in this marketplace. Not yet a live Altana
            Keystore session — see the implementation plan for that scope.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium mb-3">Session compliance history</h2>
        <div className="rounded border border-border bg-panel divide-y divide-border">
          {agent.sessions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No sessions yet.</p>
          ) : (
            agent.sessions.map((s) => {
              const expired = new Date(s.expiresAt) < new Date();
              const active = !s.revoked && !expired;
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-data text-muted">
                    cap ${s.spendCap.toLocaleString()} · spent ${s.spent.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-3">
                    {s.exceededCap || s.actedAfterExp ? (
                      <span className="text-risk text-xs">violation flagged</span>
                    ) : s.revoked ? (
                      <span className="text-muted text-xs">revoked</span>
                    ) : expired ? (
                      <span className="text-muted text-xs">expired</span>
                    ) : (
                      <span className="text-verified text-xs">within limits</span>
                    )}
                    {active && (
                      <button
                        onClick={() => revokeSession(s.id)}
                        className="text-xs text-risk hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium mb-3">Community reports</h2>
        <div className="rounded border border-border bg-panel divide-y divide-border mb-4">
          {agent.reports.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No reports filed.</p>
          ) : (
            agent.reports.map((r, i) => (
              <div key={i} className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={r.verified ? "text-risk text-xs" : "text-muted text-xs"}>
                    {r.verified ? "verified" : "pending verification"}
                  </span>
                </div>
                <p className="text-muted">{r.summary}</p>
              </div>
            ))
          )}
        </div>

        <div className="rounded border border-border bg-panel p-4">
          <label className="text-xs text-muted">Report an issue with this agent</label>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            className="mt-2 w-full rounded border border-border bg-ink px-3 py-2 text-sm"
            rows={3}
            placeholder="Describe what happened, and link a transaction as evidence if you have one."
          />
          <button
            onClick={submitReport}
            className="mt-2 rounded border border-primary px-3 py-1.5 text-sm hover:bg-primary/10 transition-colors"
          >
            Submit report
          </button>
          {reportSent && <p className="mt-2 text-xs text-verified">Submitted — pending verification.</p>}
        </div>
      </div>
    </div>
  );
}

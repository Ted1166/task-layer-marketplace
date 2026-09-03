"use client";

import { useEffect, useState } from "react";
import AgentCard, { AgentCardData } from "@/components/AgentCard";
import CategoryFilter from "@/components/CategoryFilter";

export default function CatalogPage() {
  const [category, setCategory] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = category ? `?category=${category}` : "";
    fetch(`/api/agents${qs}`)
      .then((r) => r.json())
      .then((data) => setAgents(data.agents))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-medium">Browse agents</h1>
        <p className="mt-1 text-sm text-muted">
          Every listing carries a trust score built from onchain identity, session compliance, and
          verified community reports.
        </p>
      </div>

      <div className="mb-6">
        <CategoryFilter active={category} onChange={setCategory} />
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading agents…</p>
      ) : agents.length === 0 ? (
        <p className="text-sm text-muted">No agents in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      )}
    </div>
  );
}

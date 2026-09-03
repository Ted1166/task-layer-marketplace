import Link from "next/link";
import TrustBadge from "./TrustBadge";
import { CATEGORY_LABEL, CATEGORY_COLOR } from "@/lib/categories";

export interface AgentCardData {
    id: string;
    name: string;
    category: string;
    description: string;
    liveMetricLabel: string;
    liveMetricValue: string;
    trustScore: number | null;
}

export default function AgentCard({ agent }: { agent: AgentCardData }) {
    return (
        <Link
            href={`/agents/${agent.id}`}
            className="block rounded border border-border bg-panel p-5 hover:border-primary/40 hover:bg-panel2 transition-colors"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-data ${CATEGORY_COLOR[agent.category]}`}>
                        {CATEGORY_LABEL[agent.category]}
                    </span>
                    <h3 className="mt-2 text-base font-medium">{agent.name}</h3>
                </div>
                <TrustBadge score={agent.trustScore} />
            </div>
            <p className="mt-2 text-sm text-muted leading-relaxed">{agent.description}</p>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted">{agent.liveMetricLabel}</span>
                <span className="font-data">{agent.liveMetricValue}</span>
            </div>
        </Link>
    );
}
interface Breakdown {
    score: number;
    identityReputationScore: number;
    sessionComplianceScore: number;
    communityReportScore: number;
}

function Bar({ label, value, weight }: { label: string; value: number; weight: string }) {
    return (
        <div>
            <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-muted">
                    {label} <span className="font-data">({weight})</span>
                </span>
                <span className="font-data">{value.toFixed(0)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-verified/70" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

export default function ScoreBreakdown({ breakdown }: { breakdown: Breakdown }) {
    return (
        <div className="rounded border border-border bg-panel p-5">
            <div className="flex items-baseline justify-between mb-4">
                <span className="text-sm text-muted">Trust score</span>
                <span className="text-2xl font-data">{breakdown.score.toFixed(1)}</span>
            </div>
            <div className="space-y-3">
                <Bar label="Identity & reputation" value={breakdown.identityReputationScore} weight="40%" />
                <Bar label="Session compliance" value={breakdown.sessionComplianceScore} weight="35%" />
                <Bar label="Community reports" value={breakdown.communityReportScore} weight="25%" />
            </div>
        </div>
    );
}

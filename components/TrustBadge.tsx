function tier(score: number): { label: string; className: string } {
    if (score >= 80) return { label: "verified", className: "text-verified border-verified/40 bg-verified/10" };
    if (score >= 55) return { label: "caution", className: "text-caution border-caution/40 bg-caution/10" };
    return { label: "risk", className: "text-risk border-risk/40 bg-risk/10" };
}

export default function TrustBadge({ score }: { score: number | null }) {
    if (score === null) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs font-data text-muted">
                unscored
            </span>
        );
    }
    const t = tier(score);
    return (
        <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-data ${t.className}`}>
            {score.toFixed(1)} · {t.label}
        </span>
    );
}

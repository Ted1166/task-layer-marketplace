"use client";

import { useEffect, useState } from "react";

interface Activity {
    id: string;
    txHash: string;
    chain: string;
    amountUsd: number;
    createdAt: string;
}

interface Session {
    id: string;
    spendCap: number;
    spent: number;
    expiresAt: string;
    revoked: boolean;
    exceededCap: boolean;
    actedAfterExp: boolean;
    activities: Activity[];
}

function formatRemaining(ms: number): string {
    if (ms <= 0) return "expired";
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
}

export default function ActiveSessionPanel({
    session,
    onRevoke,
    onExecute,
}: {
    session: Session;
    onRevoke: (id: string) => void;
    onExecute: (id: string) => Promise<string | null>; // returns an error message, or null on success
}) {
    const [remaining, setRemaining] = useState(() => new Date(session.expiresAt).getTime() - Date.now());
    const [executing, setExecuting] = useState(false);
    const [executeError, setExecuteError] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(new Date(session.expiresAt).getTime() - Date.now());
        }, 30000);
        return () => clearInterval(interval);
    }, [session.expiresAt]);

    const expired = remaining <= 0;
    const violation = session.exceededCap || session.actedAfterExp;
    const spendPct = Math.min(100, (session.spent / session.spendCap) * 100);

    async function handleExecute() {
        setExecuting(true);
        setExecuteError(null);
        const error = await onExecute(session.id);
        if (error) setExecuteError(error);
        setExecuting(false);
    }

    return (
        <div className="rounded border border-verified/40 bg-verified/5 p-5">
            <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-verified" />
                </span>
                <span className="text-sm font-medium text-verified">Session active</span>
                <span className="text-xs text-muted font-data ml-auto">{formatRemaining(remaining)}</span>
            </div>

            <div className="mb-3">
                <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="text-muted">Spend usage</span>
                    <span className="font-data">
                        ${session.spent.toLocaleString()} / ${session.spendCap.toLocaleString()}
                    </span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                        className={`h-full ${violation ? "bg-risk" : "bg-verified"}`}
                        style={{ width: `${spendPct}%` }}
                    />
                </div>
            </div>

            {violation && (
                <p className="text-xs text-risk mb-3">
                    This session has exceeded its declared limits — this is exactly the kind of event our
                    trust score's session-compliance signal is built to catch.
                </p>
            )}

            <div className="flex gap-2 mb-3">
                <button
                    onClick={handleExecute}
                    disabled={executing || expired}
                    className="flex-1 rounded border border-primary py-1.5 text-sm hover:bg-primary/10 transition-colors disabled:opacity-40"
                >
                    {executing ? "Signing on testnet…" : "Run real agent action"}
                </button>
                <button
                    onClick={() => onRevoke(session.id)}
                    disabled={expired}
                    className="flex-1 rounded border border-risk/60 text-risk py-1.5 text-sm hover:bg-risk/10 transition-colors disabled:opacity-40"
                >
                    Revoke session
                </button>
            </div>

            {executeError && <p className="text-xs text-risk mb-3">{executeError}</p>}

            {session.activities.length > 0 && (
                <div className="border-t border-verified/20 pt-3 mt-3">
                    <p className="text-xs text-muted mb-2">On-chain activity (real signed testnet transactions)</p>
                    <div className="space-y-1.5">
                        {session.activities.map((a) => (
                            <a
                                key={a.id}
                                href={`https://testnet.bscscan.com/tx/${a.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-xs font-data hover:text-primary transition-colors"
                            >
                                <span className="text-muted truncate max-w-[180px]">{a.txHash}</span>
                                <span>${a.amountUsd.toFixed(2)}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

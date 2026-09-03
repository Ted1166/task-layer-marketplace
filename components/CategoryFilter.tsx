"use client";

import { CATEGORIES, CATEGORY_LABEL } from "@/lib/categories";

export default function CategoryFilter({
    active,
    onChange,
}: {
    active: string | null;
    onChange: (category: string | null) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={() => onChange(null)}
                className={`rounded border px-3 py-1.5 text-sm transition-colors ${active === null ? "border-primary text-primary" : "border-border text-muted hover:text-primary"
                    }`}
            >
                All categories
            </button>
            {CATEGORIES.map((c) => (
                <button
                    key={c}
                    onClick={() => onChange(c)}
                    className={`rounded border px-3 py-1.5 text-sm transition-colors ${active === c ? "border-primary text-primary" : "border-border text-muted hover:text-primary"
                        }`}
                >
                    {CATEGORY_LABEL[c]}
                </button>
            ))}
        </div>
    );
}

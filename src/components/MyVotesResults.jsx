import React from "react";
import { CRITERIA, COUNTRY_CODES } from "../constants";
import ReactCountryFlag from 'react-country-flag';

const scoreColor = (score) => {
    const n = parseFloat(score);
    if (isNaN(n)) return 'var(--text3)';
    if (n >= 8) return 'var(--cyan)';
    if (n >= 5) return 'var(--gold)';
    return 'var(--text3)';
};

const rankStyle = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-dim';
};

const MyVotesResults = ({ activeContest, myScores, currentUser }) => {
    if (!activeContest || !currentUser) return null;

    const fmt = (v) => {
        if (v === undefined) return "-";
        const n = parseFloat(v);
        return Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1);
    };

    const votedContestants = Object.keys(myScores);
    if (votedContestants.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text3)' }}>Tap a country to start rating.</p>
            </div>
        );
    }

    const sorted = activeContest.contestants
        .filter(c => myScores[c.id])
        .sort((a, b) => (parseFloat(myScores[b.id]?.overall) || 0) - (parseFloat(myScores[a.id]?.overall) || 0));

    const avgScore = sorted.length > 0
        ? (sorted.reduce((sum, c) => sum + (parseFloat(myScores[c.id]?.overall) || 0), 0) / sorted.length).toFixed(1)
        : '0';

    return (
        <div className="max-w-xl mx-auto pb-4">
            {/* Stats header */}
            <div className="flex items-center justify-between mb-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span
                    className="font-mono text-xs"
                    style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: 'var(--text)' }}
                >
                    VOTED {sorted.length} / {activeContest.contestants.length}
                </span>
                <span
                    className="font-mono text-xs"
                    style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: scoreColor(avgScore) }}
                >
                    AVG {avgScore}
                </span>
            </div>

            <div>
                {sorted.map((contestant, idx) => {
                    const overall = fmt(myScores[contestant.id]?.overall);
                    const rank = idx + 1;

                    return (
                        <div
                            key={contestant.id}
                            className="contestant-row voted animate-slide-up"
                            style={{ animationDelay: `${idx * 25}ms` }}
                        >
                            <div className="flex items-center gap-2 min-w-0 py-2.5 pl-3 flex-1">
                                <span
                                    className={`font-mono text-sm font-bold w-6 text-center flex-shrink-0 ${rankStyle(rank)}`}
                                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                                >
                                    {rank}
                                </span>
                                {contestant.country && COUNTRY_CODES[contestant.country] && (
                                    <ReactCountryFlag countryCode={COUNTRY_CODES[contestant.country]} svg style={{ width: '1.2em', height: '1.2em' }} title={contestant.country} />
                                )}
                                <span className="font-display text-sm truncate flex-1" style={{ fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase' }}>
                                    {contestant.country || contestant.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 pr-3 flex-shrink-0">
                                {CRITERIA.map(c => (
                                    <span
                                        key={c.id}
                                        className="w-6 text-center text-[10px] tabular-nums"
                                        style={{ color: 'var(--text3)', fontFamily: '"JetBrains Mono", monospace' }}
                                    >
                                        {fmt(myScores[contestant.id]?.[c.id])}
                                    </span>
                                ))}
                                <span
                                    className="font-mono text-sm font-bold tabular-nums min-w-[2rem] text-right"
                                    style={{ fontFamily: '"JetBrains Mono", monospace', color: scoreColor(overall) }}
                                >
                                    {overall}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyVotesResults;

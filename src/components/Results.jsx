import React, { useState } from "react";
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

const Results = ({ activeContest, currentUser, handleDeleteVote, allScores, memberIds, reactions, lastChanged }) => {
    const [selectedContestant, setSelectedContestant] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'overall', direction: 'desc' });

    const fmt = (score) => {
        if (score === "-") return "-";
        const n = parseFloat(score);
        return Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1);
    };

    const getFilteredScores = (cid) => {
        const scores = allScores[cid] || {};
        if (!memberIds) return scores;
        const out = {};
        for (const [uid, data] of Object.entries(scores)) {
            if (memberIds.includes(uid)) out[uid] = data;
        }
        return out;
    };

    const getAvg = (cid, key) => {
        let t = 0, c = 0;
        Object.values(getFilteredScores(cid)).forEach(s => {
            if (s[key] !== undefined) { t += parseFloat(s[key]); c++; }
        });
        return c > 0 ? fmt(t / c) : "-";
    };

    const getOverall = (cid) => getAvg(cid, 'overall');

    const getRank = (cid) => {
        const sorted = activeContest.contestants
            .map(c => ({ id: c.id, s: parseFloat(getOverall(c.id)) || 0 }))
            .sort((a, b) => b.s - a.s);
        return sorted.findIndex(c => c.id === cid) + 1;
    };

    const handleSort = (key) => setSortConfig(p => p.key === key ? { key, direction: p.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'desc' });

    const handleDelete = (e, uid, cid) => {
        e.stopPropagation();
        if (currentUser?.isAdmin && window.confirm("Delete this vote?")) handleDeleteVote(uid, activeContest.id, cid);
    };

    if (!activeContest?.contestants?.length) return <div className="p-4 text-center text-sm" style={{ color: 'var(--text3)' }}>No contestants.</div>;
    if (!allScores || Object.keys(allScores).length === 0) return <div className="p-4 text-center text-sm" style={{ color: 'var(--text3)' }}>No scores yet.</div>;

    const sorted = [...activeContest.contestants].sort((a, b) => {
        const getValue = c => {
            const s = sortConfig.key === 'overall' ? getOverall(c.id) : getAvg(c.id, sortConfig.key);
            const p = parseFloat(s);
            return isNaN(p) ? null : p;
        };
        const sa = getValue(a);
        const sb = getValue(b);
        if (sa === null && sb === null) return 0;
        if (sa === null) return 1;
        if (sb === null) return -1;
        return sortConfig.direction === 'asc' ? sa - sb : sb - sa;
    });

    const sortOptions = [{ key: 'overall', label: 'OVERALL' }, ...CRITERIA.map(c => ({ key: c.id, label: c.label.toUpperCase().split(' ')[0] }))];

    return (
        <div className="max-w-xl mx-auto pb-4">
            {/* Sort controls */}
            <div className="flex items-center gap-3 mb-3 overflow-x-auto pb-1 no-scrollbar">
                {sortOptions.map(s => (
                    <button
                        key={s.key}
                        onClick={() => handleSort(s.key)}
                        className="font-display flex-shrink-0 transition-colors"
                        style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '2px',
                            color: sortConfig.key === s.key ? 'var(--pink)' : 'var(--text3)',
                            borderBottom: sortConfig.key === s.key ? '2px solid var(--pink)' : '2px solid transparent',
                            paddingBottom: '4px',
                            background: 'none',
                            border: 'none',
                            borderBottomStyle: 'solid',
                            borderBottomWidth: '2px',
                            borderBottomColor: sortConfig.key === s.key ? 'var(--pink)' : 'transparent',
                        }}
                    >
                        {s.label} {sortConfig.key === s.key && (sortConfig.direction === 'asc' ? '\u2191' : '\u2193')}
                    </button>
                ))}
            </div>

            <div>
                {sorted.map((contestant) => {
                    const rank = getRank(contestant.id);
                    const overall = getOverall(contestant.id);
                    const isOpen = selectedContestant === contestant.id;
                    const filtered = getFilteredScores(contestant.id);
                    const voterCount = Object.keys(filtered).length;

                    return (
                        <div key={contestant.id}>
                            <div
                                className={`contestant-row ${overall !== '-' ? 'voted' : ''}`}
                                onClick={() => setSelectedContestant(isOpen ? null : contestant.id)}
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
                                    <div className="flex-1 min-w-0">
                                        <span className="font-display text-sm truncate block" style={{ fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase' }}>
                                            {contestant.country || contestant.name}
                                        </span>
                                        {voterCount > 0 && (
                                            <span className="font-mono text-[10px]" style={{ color: 'var(--text3)', fontFamily: '"JetBrains Mono", monospace' }}>
                                                {voterCount} vote{voterCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 pr-3 flex-shrink-0">
                                    {CRITERIA.map(c => (
                                        <span key={c.id} className="w-7 text-center text-[10px] tabular-nums hidden sm:inline-block" style={{ color: 'var(--text3)', fontFamily: '"JetBrains Mono", monospace' }}>
                                            {fmt(getAvg(contestant.id, c.id))}
                                        </span>
                                    ))}
                                    <span
                                        className="font-mono text-sm font-bold tabular-nums min-w-[2rem] text-right"
                                        style={{ fontFamily: '"JetBrains Mono", monospace', color: scoreColor(overall) }}
                                    >
                                        {overall}
                                    </span>
                                    <svg
                                        className="w-3.5 h-3.5 transition-transform duration-200 ml-1"
                                        style={{ color: 'var(--text3)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="animate-slide-up p-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                                    <div className="flex items-center gap-2 mb-2 uppercase tracking-wider" style={{ fontSize: '9px', color: 'var(--text3)' }}>
                                        <span className="flex-1">Voter</span>
                                        {CRITERIA.map(c => <span key={c.id} className="w-7 text-center">{c.label.substring(0, 3)}</span>)}
                                        <span className="w-9 text-center">Total</span>
                                        {currentUser?.isAdmin && <span className="w-5" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        {Object.entries(filtered)
                                            .sort((a, b) => (parseFloat(b[1].overall) || 0) - (parseFloat(a[1].overall) || 0))
                                            .map(([uid, scores]) => (
                                                <div key={uid} className="flex items-center gap-2 py-1.5 px-1 transition-colors" style={{ borderRadius: 0 }}>
                                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                        {scores.voterPhotoURL ? (
                                                            <img src={scores.voterPhotoURL} alt="" className="w-4 h-4 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] flex-shrink-0" style={{ background: 'var(--surface-hover)', color: 'var(--text3)' }}>
                                                                {(scores.voterName || uid)?.[0]}
                                                            </div>
                                                        )}
                                                        <span className="text-[11px] truncate" style={{ color: 'var(--text2)' }}>{scores.voterName || uid}</span>
                                                    </div>
                                                    {CRITERIA.map(c => (
                                                        <span key={c.id} className="w-7 text-center text-[11px] tabular-nums" style={{ color: 'var(--text3)', fontFamily: '"JetBrains Mono", monospace' }}>
                                                            {fmt(scores[c.id])}
                                                        </span>
                                                    ))}
                                                    <span className="w-9 text-center text-[11px] font-semibold tabular-nums" style={{ color: scoreColor(scores.overall), fontFamily: '"JetBrains Mono", monospace' }}>
                                                        {fmt(scores.overall)}
                                                    </span>
                                                    {currentUser?.isAdmin && (
                                                        <button onClick={(e) => handleDelete(e, uid, contestant.id)} className="w-5 h-5 flex items-center justify-center transition-colors" style={{ color: 'rgba(239,68,68,0.3)' }}>
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Results;

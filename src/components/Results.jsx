import React, { useState } from "react";
import { CRITERIA } from "../constants";
import ReactCountryFlag from 'react-country-flag';

const countryCodeMap = {
    'Iceland': 'IS', 'Poland': 'PL', 'Slovenia': 'SI', 'Estonia': 'EE', 'Ukraine': 'UA',
    'Sweden': 'SE', 'Portugal': 'PT', 'Norway': 'NO', 'Belgium': 'BE', 'Azerbaijan': 'AZ',
    'San Marino': 'SM', 'Albania': 'AL', 'Netherlands': 'NL', 'Croatia': 'HR', 'Cyprus': 'CY',
    'Australia': 'AU', 'Montenegro': 'ME', 'Ireland': 'IE', 'Latvia': 'LV', 'Armenia': 'AM',
    'Austria': 'AT', 'United Kingdom': 'GB', 'Greece': 'GR', 'Lithuania': 'LT', 'Malta': 'MT',
    'Georgia': 'GE', 'France': 'FR', 'Denmark': 'DK', 'Czechia': 'CZ', 'Luxembourg': 'LU',
    'Israel': 'IL', 'Germany': 'DE', 'Serbia': 'RS', 'Finland': 'FI', 'Spain': 'ES',
    'Switzerland': 'CH', 'Italy': 'IT'
};

const RankBadge = ({ rank }) => {
    const cls = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-default';
    return <span className={`inline-flex w-6 h-6 rounded-full text-[11px] font-bold items-center justify-center flex-shrink-0 ${cls}`}>{rank}</span>;
};

const scoreColor = (score) => {
    const n = parseFloat(score);
    if (isNaN(n)) return 'text-white/20';
    if (n >= 8) return 'text-esc-gold';
    if (n >= 6) return 'text-esc-blue';
    return 'text-white/50';
};

const Results = ({ activeContest, currentUser, handleDeleteVote, allScores, memberIds }) => {
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

    if (!activeContest?.contestants?.length) return <div className="p-4 text-center text-white/30 text-sm">No contestants.</div>;
    if (!allScores || Object.keys(allScores).length === 0) return <div className="p-4 text-center text-white/30 text-sm">No scores yet.</div>;

    const sorted = [...activeContest.contestants].sort((a, b) => {
        const getValue = c => {
            const s = sortConfig.key === 'overall' ? getOverall(c.id) : getAvg(c.id, sortConfig.key);
            const p = parseFloat(s);
            return isNaN(p) ? null : p;
        };
        const sa = getValue(a);
        const sb = getValue(b);
        // Push unvoted entries to bottom regardless of sort direction
        if (sa === null && sb === null) return 0;
        if (sa === null) return 1;
        if (sb === null) return -1;
        return sortConfig.direction === 'asc' ? sa - sb : sb - sa;
    });

    return (
        <div className="max-w-xl mx-auto pb-4">
            {/* Sort chips */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                <span className="text-[10px] text-white/15 uppercase tracking-wider flex-shrink-0 mr-1">Sort</span>
                {[{ key: 'overall', label: 'Overall' }, ...CRITERIA.map(c => ({ key: c.id, label: c.label.split(' ')[0] }))].map(s => (
                    <button key={s.key} onClick={() => handleSort(s.key)}
                        className={`text-[11px] px-2 py-1 rounded-md flex-shrink-0 transition-colors ${sortConfig.key === s.key ? 'bg-esc-accent/15 text-esc-accent-light' : 'bg-white/5 text-white/25'}`}>
                        {s.label} {sortConfig.key === s.key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                ))}
            </div>

            <div className="space-y-1">
                {sorted.map((contestant) => {
                    const rank = getRank(contestant.id);
                    const overall = getOverall(contestant.id);
                    const isOpen = selectedContestant === contestant.id;
                    const filtered = getFilteredScores(contestant.id);
                    const voterCount = Object.keys(filtered).length;

                    return (
                        <div key={contestant.id} className={`glass rounded-xl overflow-hidden transition-all ${isOpen ? 'ring-1 ring-esc-accent/20' : ''}`}>
                            <div className="p-2.5 flex items-center gap-2 cursor-pointer hover:bg-white/[0.03] transition-colors active:bg-white/[0.06]"
                                onClick={() => setSelectedContestant(isOpen ? null : contestant.id)} style={{ minHeight: 48 }}>
                                <RankBadge rank={rank} />
                                {contestant.country && countryCodeMap[contestant.country] && (
                                    <ReactCountryFlag countryCode={countryCodeMap[contestant.country]} svg style={{ width: '1.2em', height: '1.2em' }} title={contestant.country} />
                                )}
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-white text-sm truncate block">{contestant.country || contestant.name}</span>
                                    {voterCount > 0 && <span className="text-[10px] text-white/15">{voterCount} vote{voterCount !== 1 ? 's' : ''}</span>}
                                </div>
                                <div className="flex gap-1 mr-1">
                                    {CRITERIA.map(c => (
                                        <span key={c.id} className="w-6 text-center text-[10px] text-white/25 tabular-nums hidden sm:inline-block">{fmt(getAvg(contestant.id, c.id))}</span>
                                    ))}
                                </div>
                                <span className={`font-bold text-sm tabular-nums min-w-[2rem] text-right ${scoreColor(overall)}`}>{overall}</span>
                                <svg className={`w-3.5 h-3.5 text-white/10 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {isOpen && (
                                <div className="border-t border-white/5 p-3 animate-slide-up">
                                    <div className="flex items-center gap-2 mb-2 text-[9px] text-white/15 uppercase tracking-wider">
                                        <span className="flex-1">Voter</span>
                                        {CRITERIA.map(c => <span key={c.id} className="w-7 text-center">{c.label.substring(0, 3)}</span>)}
                                        <span className="w-9 text-center">Total</span>
                                        {currentUser?.isAdmin && <span className="w-5" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        {Object.entries(filtered)
                                            .sort((a, b) => (parseFloat(b[1].overall) || 0) - (parseFloat(a[1].overall) || 0))
                                            .map(([uid, scores]) => (
                                                <div key={uid} className="flex items-center gap-2 py-1.5 px-1 rounded-md hover:bg-white/[0.03] transition-colors">
                                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                        {scores.voterPhotoURL ? (
                                                            <img src={scores.voterPhotoURL} alt="" className="w-4 h-4 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full bg-esc-surface flex items-center justify-center text-[8px] text-white/25 flex-shrink-0">{(scores.voterName || uid)?.[0]}</div>
                                                        )}
                                                        <span className="text-[11px] text-white/50 truncate">{scores.voterName || uid}</span>
                                                    </div>
                                                    {CRITERIA.map(c => <span key={c.id} className="w-7 text-center text-[11px] text-white/30 tabular-nums">{fmt(scores[c.id])}</span>)}
                                                    <span className={`w-9 text-center text-[11px] font-semibold tabular-nums ${scoreColor(scores.overall)}`}>{fmt(scores.overall)}</span>
                                                    {currentUser?.isAdmin && (
                                                        <button onClick={(e) => handleDelete(e, uid, contestant.id)} className="w-5 h-5 flex items-center justify-center text-red-400/30 hover:text-red-400 rounded transition-colors">
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

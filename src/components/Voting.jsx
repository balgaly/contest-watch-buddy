import React, { useState, useEffect, useRef } from 'react';
import { CRITERIA, COUNTRY_CODES } from '../constants';
import ReactCountryFlag from 'react-country-flag';

const Voting = ({ activeContest, updateScore, getScore, allScores, user, reactions, lastChanged }) => {
    const [tempScores, setTempScores] = useState({});
    const [confirmation, setConfirmation] = useState('');
    const [expandedContestant, setExpandedContestant] = useState(null);
    const [unsavedChanges, setUnsavedChanges] = useState({});
    const [flashId, setFlashId] = useState(null);
    const flashTimerRef = useRef(null);

    useEffect(() => {
        const fetchScores = async () => {
            const allSavedScores = {};
            for (const contestant of activeContest.contestants) {
                const savedScores = {};
                let hasAnyScores = false;
                for (const criterion of CRITERIA) {
                    const score = await getScore(contestant.id, criterion.id);
                    if (score > 0) { savedScores[criterion.id] = score; hasAnyScores = true; }
                }
                const overall = await getScore(contestant.id, 'overall');
                if (overall > 0) { savedScores['overall'] = overall; hasAnyScores = true; }
                if (hasAnyScores) allSavedScores[contestant.id] = savedScores;
            }
            setTempScores(allSavedScores);
            setUnsavedChanges({});
        };
        fetchScores();
    }, [activeContest.contestants, getScore]);

    // Flash animation when other users update scores
    useEffect(() => {
        if (!lastChanged || !user) return;
        const { contestantId } = lastChanged;
        // Only flash for changes by other users
        const scores = allScores?.[contestantId];
        if (!scores) return;
        const changedByOther = Object.keys(scores).some(uid => uid !== user.id);
        if (changedByOther) {
            setFlashId(contestantId);
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            flashTimerRef.current = setTimeout(() => setFlashId(null), 800);
        }
    }, [lastChanged, allScores, user]);

    const handleScoreSelect = (contestantId, criterionId, value) => {
        setTempScores(prev => {
            const current = prev[contestantId] || {};
            const newScores = { ...current, [criterionId]: value };
            let overall = 0, hasAll = true;
            CRITERIA.forEach(c => {
                if (newScores[c.id] !== undefined) overall += newScores[c.id] * c.weight;
                else hasAll = false;
            });
            if (hasAll) newScores['overall'] = overall;
            setUnsavedChanges(p => ({ ...p, [contestantId]: true }));
            return { ...prev, [contestantId]: newScores };
        });
    };

    const saveScores = async (contestantId) => {
        const scores = tempScores[contestantId];
        if (!scores) return false;
        if (!CRITERIA.every(c => scores[c.id] !== undefined)) { alert('Please rate all criteria'); return false; }
        for (const criterion of CRITERIA) await updateScore(contestantId, criterion.id, scores[criterion.id]);
        await updateScore(contestantId, 'overall', scores['overall']);
        const name = activeContest.contestants.find(c => c.id === contestantId)?.country || activeContest.contestants.find(c => c.id === contestantId)?.name;
        setConfirmation(`${name} saved`);
        setTimeout(() => setConfirmation(''), 2000);
        setUnsavedChanges(p => { const n = { ...p }; delete n[contestantId]; return n; });
        return true;
    };

    const handleToggleExpand = async (contestantId) => {
        if (expandedContestant === contestantId) {
            if (unsavedChanges[contestantId]) { if (!(await saveScores(contestantId))) return; }
            setExpandedContestant(null);
        } else {
            setExpandedContestant(contestantId);
        }
    };

    // Floating emoji reactions for a contestant
    const getContestantReactions = (contestantId) => {
        if (!reactions) return [];
        return reactions.filter(r => r.contestantId === contestantId);
    };

    if (!activeContest?.contestants?.length) {
        return <div className="p-4 text-center text-sm" style={{ color: 'var(--text3)' }}>No contestants available.</div>;
    }

    const scoreColor = (val) => {
        if (val >= 8) return 'var(--cyan)';
        if (val >= 5) return 'var(--gold)';
        return 'var(--text3)';
    };

    return (
        <div className="max-w-xl mx-auto pb-4">
            <div>
                {activeContest.contestants
                    .sort((a, b) => (a.order || parseInt(a.id)) - (b.order || parseInt(b.id)))
                    .map((contestant) => {
                        const isExpanded = expandedContestant === contestant.id;
                        const hasScore = tempScores[contestant.id]?.overall;
                        const isUnsaved = unsavedChanges[contestant.id];
                        const isFlashing = flashId === contestant.id;
                        const contestantReactions = getContestantReactions(contestant.id);

                        return (
                            <div key={contestant.id} className="relative">
                                {/* Contestant row */}
                                <div
                                    className={`contestant-row ${hasScore ? 'voted' : ''} ${isFlashing ? 'flash-update' : ''}`}
                                    onClick={() => handleToggleExpand(contestant.id)}
                                    style={{
                                        borderLeft: isExpanded ? '4px solid var(--pink)' : undefined,
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 py-3 pl-3 flex-1">
                                        <span
                                            className="font-mono text-xs w-5 text-right flex-shrink-0"
                                            style={{ color: 'var(--text3)', fontFamily: '"JetBrains Mono", monospace' }}
                                        >
                                            {contestant.order || contestant.id}
                                        </span>
                                        {contestant.country && COUNTRY_CODES[contestant.country] && (
                                            <ReactCountryFlag
                                                countryCode={COUNTRY_CODES[contestant.country]}
                                                svg
                                                style={{ width: '1.3em', height: '1.3em' }}
                                                title={contestant.country}
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <span
                                                className="font-display text-sm truncate block"
                                                style={{ fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase' }}
                                            >
                                                {contestant.country || contestant.name}
                                            </span>
                                            {contestant.country && contestant.name !== contestant.country && (
                                                <span className="text-[11px] truncate block" style={{ color: 'var(--text2)' }}>
                                                    {contestant.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pr-3 flex-shrink-0">
                                        {hasScore && (
                                            <span
                                                className="font-mono text-sm font-bold tabular-nums"
                                                style={{
                                                    fontFamily: '"JetBrains Mono", monospace',
                                                    color: isUnsaved ? 'var(--gold)' : scoreColor(tempScores[contestant.id].overall),
                                                }}
                                            >
                                                {tempScores[contestant.id].overall.toFixed(1)}
                                            </span>
                                        )}
                                        <svg
                                            className="w-4 h-4 transition-transform duration-200"
                                            style={{
                                                color: 'var(--text3)',
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            }}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Floating reactions */}
                                {contestantReactions.length > 0 && (
                                    <div className="absolute right-12 top-2 pointer-events-none">
                                        {contestantReactions.slice(-3).map((r, i) => (
                                            <span key={r.id || i} className="emoji-float inline-block text-lg" style={{ animationDelay: `${i * 0.2}s` }}>
                                                {r.emoji}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Voting panel */}
                                {isExpanded && (
                                    <div className="panel-expand" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                                        <div className="p-4">
                                            <div className="text-[10px] mb-4 flex items-center gap-1.5" style={{ color: 'var(--text3)' }}>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Auto-saves when you close
                                            </div>

                                            <div className="space-y-5">
                                                {CRITERIA.map(criterion => {
                                                    const score = tempScores[contestant.id]?.[criterion.id];
                                                    return (
                                                        <div key={criterion.id}>
                                                            <div className="flex justify-between items-baseline mb-2.5">
                                                                <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>{criterion.label}</span>
                                                                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{(criterion.weight * 100).toFixed(0)}%</span>
                                                            </div>
                                                            <div className="grid grid-cols-10 gap-1">
                                                                {[1,2,3,4,5,6,7,8,9,10].map(v => (
                                                                    <button
                                                                        key={v}
                                                                        onClick={(e) => { e.stopPropagation(); handleScoreSelect(contestant.id, criterion.id, v); }}
                                                                        className="aspect-square text-xs font-bold transition-all active:scale-90"
                                                                        style={{
                                                                            borderRadius: 0,
                                                                            minHeight: 36,
                                                                            fontFamily: '"JetBrains Mono", monospace',
                                                                            fontWeight: 600,
                                                                            background: score === v
                                                                                ? 'linear-gradient(135deg, #ff2d87, #7c3aed)'
                                                                                : 'var(--surface-hover)',
                                                                            color: score === v ? '#fff' : 'var(--text3)',
                                                                        }}
                                                                    >
                                                                        {v}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {tempScores[contestant.id]?.overall && (
                                                    <div className="flex justify-center pt-1">
                                                        <div className="text-center">
                                                            <div
                                                                className="text-[10px] uppercase tracking-wider mb-0.5"
                                                                style={{ color: 'var(--text3)', letterSpacing: '2px' }}
                                                            >
                                                                OVERALL
                                                            </div>
                                                            <div
                                                                className="font-mono text-2xl font-bold tabular-nums"
                                                                style={{
                                                                    fontFamily: '"JetBrains Mono", monospace',
                                                                    fontWeight: 700,
                                                                    color: scoreColor(tempScores[contestant.id].overall),
                                                                }}
                                                            >
                                                                {tempScores[contestant.id].overall.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            {confirmation && (
                <div
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-sm font-medium animate-slide-up"
                    style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        borderRadius: 0,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {confirmation}
                </div>
            )}
        </div>
    );
};

export default Voting;

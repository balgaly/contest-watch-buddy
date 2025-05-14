// components/Voting.jsx
import React, { useState, useEffect } from 'react';
import { CRITERIA } from '../constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import ReactCountryFlag from 'react-country-flag';

const countryCodeMap = {
    'Iceland': 'IS',
    'Poland': 'PL',
    'Slovenia': 'SI',
    'Estonia': 'EE',
    'Ukraine': 'UA',
    'Sweden': 'SE',
    'Portugal': 'PT',
    'Norway': 'NO',
    'Belgium': 'BE',
    'Azerbaijan': 'AZ',
    'San Marino': 'SM',
    'Albania': 'AL',
    'Netherlands': 'NL',
    'Croatia': 'HR',
    'Cyprus': 'CY',
    'Australia': 'AU',
    'Montenegro': 'ME',
    'Ireland': 'IE',
    'Latvia': 'LV',
    'Armenia': 'AM',
    'Austria': 'AT',
    'United Kingdom': 'GB',
    'Greece': 'GR',
    'Lithuania': 'LT',
    'Malta': 'MT',
    'Georgia': 'GE',
    'France': 'FR',
    'Denmark': 'DK',
    'Czechia': 'CZ',
    'Luxembourg': 'LU',
    'Israel': 'IL',
    'Germany': 'DE',
    'Serbia': 'RS',
    'Finland': 'FI'
};

const Voting = ({ activeContest, currentContestant, updateScore, getScore, setCurrentContestant }) => {
    const [tempScores, setTempScores] = useState({});
    const [confirmation, setConfirmation] = useState('');
    const [expandedContestant, setExpandedContestant] = useState(null);
    const [unsavedChanges, setUnsavedChanges] = useState({});

    // Initialize scores when component loads and when scores change
    useEffect(() => {
        const fetchScores = async () => {
            const allSavedScores = {};
            for (const contestant of activeContest.contestants) {
                const savedScores = {};
                let hasAnyScores = false;
                for (const criterion of CRITERIA) {
                    const score = await getScore(contestant.id, criterion.id);
                    if (score > 0) {
                        savedScores[criterion.id] = score;
                        hasAnyScores = true;
                    }
                }
                const overall = await getScore(contestant.id, 'overall');
                if (overall > 0) {
                    savedScores['overall'] = overall;
                    hasAnyScores = true;
                }
                if (hasAnyScores) {
                    allSavedScores[contestant.id] = savedScores;
                }
            }
            setTempScores(allSavedScores);
            setUnsavedChanges({});
        };
        fetchScores();
    }, [activeContest.contestants, getScore]);

    const handleScore = (contestantId, criterionId, delta) => {
        setTempScores(prev => {
            const currentScores = prev[contestantId] || {};
            const currentValue = currentScores[criterionId] || 0;
            let newValue = Math.max(1, Math.min(10, currentValue + delta));
            
            const newScores = {
                ...currentScores,
                [criterionId]: newValue
            };

            // Calculate overall score
            let overall = 0;
            let hasAllScores = true;
            CRITERIA.forEach(criterion => {
                if (newScores[criterion.id] !== undefined) {
                    overall += newScores[criterion.id] * criterion.weight;
                } else {
                    hasAllScores = false;
                }
            });
            if (hasAllScores) {
                newScores['overall'] = overall;
            }

            // Mark as having unsaved changes
            setUnsavedChanges(prev => ({
                ...prev,
                [contestantId]: true
            }));

            return {
                ...prev,
                [contestantId]: newScores
            };
        });
    };

    const saveScores = async (contestantId) => {
        const scores = tempScores[contestantId];
        if (!scores) return false;

        // Check if all criteria have scores
        const hasAllScores = CRITERIA.every(criterion => scores[criterion.id] !== undefined);
        if (!hasAllScores) {
            alert('Please rate all criteria before closing');
            return false;
        }

        // Submit all scores
        for (const criterion of CRITERIA) {
            await updateScore(contestantId, criterion.id, scores[criterion.id]);
        }
        await updateScore(contestantId, 'overall', scores['overall']);

        setConfirmation(`Scores for ${activeContest.contestants.find(c => c.id === contestantId)?.name} saved successfully!`);
        setTimeout(() => setConfirmation(''), 3000);

        // Clear unsaved changes flag for this contestant
        setUnsavedChanges(prev => {
            const next = { ...prev };
            delete next[contestantId];
            return next;
        });

        return true;
    };

    const handleToggleExpand = async (contestantId) => {
        if (expandedContestant === contestantId) {
            // If we're closing a panel and there are unsaved changes, save them
            if (unsavedChanges[contestantId]) {
                const success = await saveScores(contestantId);
                if (!success) {
                    // Don't close the panel if saving failed
                    return;
                }
            }
            setExpandedContestant(null);
        } else {
            setExpandedContestant(contestantId);
        }
    };

    if (!activeContest?.contestants?.length) {
        return (
            <div className="p-4">
                <p>No contestants available for this contest.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="space-y-2">
                {activeContest.contestants
                    .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                    .map(contestant => (
                        <div key={contestant.id} className="bg-white rounded-lg shadow overflow-hidden">
                            {/* Contestant Header - Always visible */}
                            <div 
                                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-cyan-50 transition-colors ${
                                    expandedContestant === contestant.id ? 'bg-cyan-50' : ''
                                }`}
                                onClick={() => handleToggleExpand(contestant.id)}
                            >
                                <div className="flex items-center gap-2">
                                    {contestant.country && countryCodeMap[contestant.country] && (
                                        <ReactCountryFlag
                                            countryCode={countryCodeMap[contestant.country]}
                                            svg
                                            style={{ width: '1.5em', height: '1.5em' }}
                                            title={contestant.country}
                                        />
                                    )}
                                    <span className="font-medium text-cyan-900">{contestant.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {tempScores[contestant.id]?.overall && (
                                        <span className={`px-2 py-1 rounded text-sm font-semibold bg-cyan-50 text-cyan-700 min-w-[4rem] text-center ${unsavedChanges[contestant.id] ? 'border border-yellow-400 bg-yellow-50' : ''}`}>
                                            {tempScores[contestant.id].overall.toFixed(2)}
                                            {unsavedChanges[contestant.id] && '*'}
                                        </span>
                                    )}
                                    <svg 
                                        className={`w-5 h-5 text-cyan-600 transition-transform ${expandedContestant === contestant.id ? 'transform rotate-180' : ''}`}
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>                            {/* Voting Panel - Expands below the contestant */}
                            {expandedContestant === contestant.id && (                                <div className="border-t border-cyan-100 p-4 bg-gradient-to-b from-cyan-50/50 to-white">
                                    <div className="mb-4 bg-cyan-50 border border-cyan-200 rounded-lg p-2 flex items-center gap-2 text-cyan-700">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs">Changes are automatically saved when you close this panel</span>
                                    </div>
                                    <div className="space-y-6">
                                        {CRITERIA.map(criterion => {
                                            const score = tempScores[contestant.id]?.[criterion.id];
                                            return (
                                                <div key={criterion.id} className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-sm font-medium text-cyan-900">
                                                            {criterion.label}
                                                            <span className="ml-1 text-xs text-cyan-600">
                                                                (Weight: {criterion.weight * 100}%)
                                                            </span>
                                                        </label>
                                                        <div className="flex items-center gap-2 min-w-[140px] justify-end">
                                                            <button
                                                                onClick={() => handleScore(contestant.id, criterion.id, -1)}
                                                                className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 flex items-center justify-center flex-shrink-0"
                                                                disabled={!score || score <= 1}
                                                            >
                                                                -
                                                            </button>
                                                            <div className="w-12 text-center font-bold text-lg text-cyan-700 tabular-nums">
                                                                {score || '-'}
                                                            </div>
                                                            <button
                                                                onClick={() => handleScore(contestant.id, criterion.id, 1)}
                                                                className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 flex items-center justify-center flex-shrink-0"
                                                                disabled={score >= 10}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-cyan-600">{criterion.description}</p>
                                                </div>
                                            );
                                        })}

                                        {/* Overall Score Display */}
                                        {tempScores[contestant.id]?.overall && (
                                            <div className="mt-4 flex justify-center">
                                                <div className={`w-full max-w-[200px] px-4 py-3 rounded-lg text-center ${unsavedChanges[contestant.id] ? 'bg-yellow-50 border border-yellow-200' : 'bg-cyan-50'}`}>
                                                    <div className="text-sm font-medium text-cyan-700">Overall Score</div>
                                                    <div className="text-2xl font-bold text-cyan-900 tabular-nums">
                                                        {tempScores[contestant.id].overall.toFixed(2)}
                                                        {unsavedChanges[contestant.id] && <span className="text-yellow-600">*</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
            </div>

            {/* Confirmation Message */}
            {confirmation && (
                <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded shadow-lg">
                    {confirmation}
                </div>
            )}
        </div>
    );
};

export default Voting;

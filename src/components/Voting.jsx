// components/Voting.jsx
import React, { useState, useEffect, useRef } from 'react';
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
    'Cyprus': 'CY'
};

const Voting = ({ activeContest, currentContestant, updateScore, getScore, setCurrentContestant }) => {
    const [scores, setScores] = useState({});
    const [confirmation, setConfirmation] = useState('');
    const formRef = useRef(null);
    const [highlight, setHighlight] = useState(false);

    const formatScore = (score) => {
        if (!score) return score;
        const numScore = parseFloat(score);
        return Number.isInteger(numScore) ? numScore.toString() : numScore.toFixed(2);
    };

    useEffect(() => {
        const fetchScores = async () => {
            if (currentContestant) {
                const newScores = {};
                for (const criterion of CRITERIA) {
                    newScores[criterion.id] = await getScore(currentContestant, criterion.id);
                }
                newScores['overall'] = await getScore(currentContestant, 'overall');
                console.log('Fetched scores:', newScores);
                setScores(newScores);
            }
        };
        fetchScores();
    }, [currentContestant, getScore]);

    useEffect(() => {
        if (currentContestant && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setHighlight(true);
            setTimeout(() => setHighlight(false), 800);
        }
    }, [currentContestant]);

    const handleScoreChange = (contestantId, criterionId, value) => {
        const newScores = {
            ...scores,
            [criterionId]: parseFloat(value)
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

        setScores(newScores);
        updateScore(contestantId, criterionId, value);
        if (hasAllScores) {
            updateScore(contestantId, 'overall', overall);
        }
    };

    const handleSendScores = async () => {
        if (currentContestant) {
            console.log('Sending scores:', scores);
            for (const criterion of CRITERIA) {
                await updateScore(currentContestant, criterion.id, scores[criterion.id] || 0);
            }
            await updateScore(currentContestant, 'overall', scores['overall'] || 0);
            setConfirmation('Scores sent successfully!');
            setTimeout(() => setConfirmation(''), 3000);
        }
    };

    if (!activeContest || !activeContest.contestants || activeContest.contestants.length === 0) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Voting</h2>
                <p>No contestants available for this contest. Please check the contest data.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto w-full">
            {/* Contestant List */}
            <div className="bg-white rounded-lg shadow p-4 mb-4 md:mb-0 md:col-span-1">
                <h2 className="text-xl font-bold mb-4 text-center md:text-left">Contestants</h2>
                <ul className="space-y-2">
                    {[...activeContest.contestants]
                        .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                        .map(contestant => (
                        <li
                            key={contestant.id}
                            className={`text-purple-800 font-medium cursor-pointer hover:underline px-3 py-2 rounded transition-all duration-150 ${currentContestant === contestant.id ? 'bg-purple-200' : 'hover:bg-purple-100'}`}
                            onClick={() => setCurrentContestant(contestant.id)}
                        >
                            {contestant.country && countryCodeMap[contestant.country] && (
                                <ReactCountryFlag
                                    countryCode={countryCodeMap[contestant.country]}
                                    svg
                                    style={{
                                        width: '1.2em',
                                        height: '1.2em',
                                        marginRight: '0.3em',
                                        verticalAlign: 'middle'
                                    }}
                                    title={contestant.country}
                                />
                            )}
                            {contestant.name}
                        </li>
                    ))}
                </ul>
            </div>
            {/* Voting Form */}
            <div ref={formRef} className={`bg-white rounded-lg shadow p-4 md:col-span-2 w-full transition-all duration-500 ${highlight ? 'ring-2 ring-purple-400' : ''}`}>
                {/* Sticky header for selected song on mobile */}
                {currentContestant && (
                    <div className="sticky top-0 z-10 bg-white pb-2 mb-4 border-b border-purple-200 flex items-center justify-center md:justify-start">
                        <span className="font-bold text-purple-800 text-lg flex items-center">
                            {(() => {
                                const contestant = activeContest.contestants.find(c => c.id === currentContestant);
                                return (
                                    <>
                                        {contestant?.country && countryCodeMap[contestant.country] && (
                                            <ReactCountryFlag
                                                countryCode={countryCodeMap[contestant.country]}
                                                svg
                                                style={{
                                                    width: '1.5em',
                                                    height: '1.5em',
                                                    marginRight: '0.5em',
                                                    verticalAlign: 'middle'
                                                }}
                                                title={contestant.country}
                                            />
                                        )}
                                        {contestant?.name}
                                    </>
                                );
                            })()}
                        </span>
                    </div>
                )}
                {currentContestant ? (
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-center md:text-left">
                            Rate: {
                                (() => {
                                    const contestant = activeContest.contestants.find(c => c.id === currentContestant);
                                    return (
                                        <>
                                            {contestant?.country && countryCodeMap[contestant.country] && (
                                                <ReactCountryFlag
                                                    countryCode={countryCodeMap[contestant.country]}
                                                    svg
                                                    style={{
                                                        width: '1.5em',
                                                        height: '1.5em',
                                                        marginRight: '0.5em',
                                                        verticalAlign: 'middle'
                                                    }}
                                                    title={contestant.country}
                                                />
                                            )}
                                            {contestant?.name}
                                        </>
                                    );
                                })()
                            }
                        </h2>
                        {CRITERIA.map(criterion => (
                            <div key={criterion.id} className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {criterion.label} (1-10) <span className="text-xs text-gray-500">Weight: {criterion.weight * 100}%</span>
                                </label>
                                <p className="text-xs text-gray-600 mb-2">{criterion.description}</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={scores[criterion.id] || 1}
                                        onChange={(e) => handleScoreChange(currentContestant, criterion.id, e.target.value)}
                                        className="w-full h-3 md:h-2 rounded-lg appearance-none bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        style={{ accentColor: '#a78bfa', touchAction: 'none' }}
                                    />
                                    <span className="text-lg font-bold w-10 text-center">
                                        {scores[criterion.id] || 1}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {/* Overall Score */}
                        <div className="mt-8 p-4 bg-purple-200 rounded-lg text-center">
                            <h3 className="font-medium text-purple-900">Weighted Overall Score:</h3>
                            <div className="text-2xl font-bold mt-1">
                                {scores['overall']
                                    ? formatScore(scores['overall'])
                                    : 'Rate all categories to see overall score'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Formula: (Song Quality × 40%) + (Staging × 25%) + (Vocal Quality × 35%)
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-500 text-center">
                        Tap a contestant's name to rate them
                    </div>
                )}
            </div>
        </div>
    );
};

export default Voting;

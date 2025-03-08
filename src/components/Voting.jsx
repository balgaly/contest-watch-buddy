// components/Voting.jsx
import React, { useState, useEffect } from 'react';
import { CRITERIA } from '../constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const Voting = ({ activeContest, currentContestant, updateScore, getScore, setCurrentContestant }) => {
    const [scores, setScores] = useState({});
    const [confirmation, setConfirmation] = useState('');

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contestant List */}
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold mb-4">Contestants</h2>
                <ul className="space-y-2">
                    {activeContest.contestants.map(contestant => (
                        <li
                            key={contestant.id}
                            className={`text-purple-800 font-medium cursor-pointer hover:underline ${currentContestant === contestant.id ? 'bg-purple-200 p-1 rounded' : ''}`}
                            onClick={() => setCurrentContestant(contestant.id)}
                        >
                            {contestant.name}
                        </li>
                    ))}
                </ul>
            </div>
            {/* Voting Form */}
            <div className="bg-white rounded-lg shadow p-4 md:col-span-2">
                {currentContestant ? (
                    <div>
                        <h2 className="text-xl font-bold mb-4">
                            Rate: {activeContest.contestants.find(c => c.id === currentContestant)?.name}
                        </h2>
                        {CRITERIA.map(criterion => (
                            <div key={criterion.id} className="mb-6">
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
                                        className="w-full"
                                    />
                                    <span className="text-lg font-bold w-8 text-center">
                                        {scores[criterion.id] || 1}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {/* Overall Score */}
                        <div className="mt-8 p-4 bg-purple-200 rounded-lg">
                            <h3 className="font-medium text-purple-900">Weighted Overall Score:</h3>
                            <div className="text-2xl font-bold mt-1">
                                {scores['overall']
                                    ? scores['overall'].toFixed(1)
                                    : 'Rate all categories to see overall score'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Formula: (Song Quality × 40%) + (Staging × 25%) + (Vocal Quality × 35%)
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Click on a contestant's name to rate them
                    </div>
                )}
            </div>
        </div>
    );
};

export default Voting;

// components/Voting.jsx
import React from 'react';
import { CRITERIA } from '../constants';

const Voting = ({ activeContest, currentContestant, updateScore, getScore, setCurrentContestant }) => {
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
                                        value={getScore(currentContestant, criterion.id) || 1}
                                        onChange={(e) => updateScore(currentContestant, criterion.id, e.target.value)}
                                        className="w-full"
                                    />
                                    <span className="text-lg font-bold w-8 text-center">
                                        {getScore(currentContestant, criterion.id) || 1}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {/* Overall Score */}
                        <div className="mt-8 p-4 bg-purple-200 rounded-lg">
                            <h3 className="font-medium text-purple-900">Weighted Overall Score:</h3>
                            <div className="text-2xl font-bold mt-1">
                                {getScore(currentContestant, 'overall')
                                    ? getScore(currentContestant, 'overall').toFixed(1)
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

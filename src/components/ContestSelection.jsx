// components/ContestSelection.jsx
import React, { useState } from 'react';

const ContestSelection = ({ contests, activeContestId, switchContest }) => {
    const [selectedContestId, setSelectedContestId] = useState(activeContestId);

    const handleSubmit = () => {
        switchContest(selectedContestId);
    };

    return (
        <div className="min-h-screen bg-cyan-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-cyan-900 mb-6 text-center">Select Contest</h1>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="contest-select" className="block text-sm font-medium text-gray-700 mb-2">
                            Choose a Contest
                        </label>
                        <select
                            id="contest-select"
                            className="w-full p-3 border rounded text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            value={selectedContestId}
                            onChange={e => setSelectedContestId(e.target.value)}
                        >
                            {contests.map(contest => (
                                <option key={contest.id} value={contest.id}>
                                    {contest.name} ({contest.contestants.length} contestants)
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full py-3 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    >
                        Switch to Selected Contest
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContestSelection;

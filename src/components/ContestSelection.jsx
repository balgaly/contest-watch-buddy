// components/ContestSelection.jsx
import React from 'react';

const ContestSelection = ({ contests, activeContestId, switchContest, goBack }) => {
    return (
        <div className="min-h-screen bg-purple-200 p-4">
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-purple-900">Select Contest</h1>
                    <button onClick={goBack} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        Back
                    </button>
                </div>
                <ul className="space-y-2 mb-6">
                    {contests.map(contest => (
                        <li key={contest.id} className="border rounded p-3">
                            <div className="flex justify-between items-center">
                                <span>
                                    {contest.name}
                                    {contest.id === activeContestId && <span className="ml-2 text-green-600 text-xs">(Current)</span>}
                                </span>
                                <button
                                    onClick={() => switchContest(contest.id)}
                                    className="px-3 py-1 bg-purple-200 text-purple-900 rounded hover:bg-purple-300"
                                >
                                    Select
                                </button>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">{contest.contestants.length} contestants</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ContestSelection;

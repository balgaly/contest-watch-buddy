// components/Results.jsx
import React from 'react';
import { CRITERIA } from '../constants';

const Results = ({ activeContest, getAverageScore, getContestantRank, toggleContestantDetails, selectedContestant, users, allScores, currentUser, handleEditVote }) => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold mb-4">Results</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Contestant
                                </th>
                                {CRITERIA.map(criterion => (
                                    <th key={criterion.id} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        {criterion.label}
                                    </th>
                                ))}
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Overall
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {activeContest.contestants
                                .sort((a, b) => getAverageScore(b.id, 'overall') - getAverageScore(a.id, 'overall'))
                                .map(contestant => {
                                    const rank = getContestantRank(contestant.id);
                                    const isSelected = selectedContestant === contestant.id;
                                    return (
                                        <React.Fragment key={contestant.id}>
                                            <tr
                                                className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-purple-200' : ''}`}
                                                onClick={() => toggleContestantDetails(contestant.id)}
                                            >
                                                <td className="px-3 py-4 whitespace-nowrap">
                                                    {contestant.name}
                                                    {rank === 1 && <span className="ml-2" title="1st Place">🏆</span>}
                                                    {rank === 2 && <span className="ml-2" title="2nd Place">🥈</span>}
                                                    {rank === 3 && <span className="ml-2" title="3rd Place">🥉</span>}
                                                    <span className="ml-2">{isSelected ? '▼' : '▶'}</span>
                                                </td>
                                                {CRITERIA.map(criterion => (
                                                    <td key={criterion.id} className="px-3 py-4 whitespace-nowrap">
                                                        {getAverageScore(contestant.id, criterion.id).toFixed(1)}
                                                    </td>
                                                ))}
                                                <td className="px-3 py-4 whitespace-nowrap font-medium text-purple-900">
                                                    {getAverageScore(contestant.id, 'overall').toFixed(1)}
                                                </td>
                                            </tr>
                                            {isSelected && (
                                                <tr>
                                                    <td colSpan={CRITERIA.length + 2} className="bg-purple-200 p-0">
                                                        <div className="p-4">
                                                            <h3 className="font-medium text-purple-900 mb-3">
                                                                Individual Votes for {contestant.name}
                                                            </h3>
                                                            <div className="bg-white rounded shadow overflow-hidden">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-gray-100">
                                                                        <tr>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                                                                Voter
                                                                            </th>
                                                                            {CRITERIA.map(criterion => (
                                                                                <th key={criterion.id} className="px-3 py-2 text-center text-xs font-medium text-gray-600">
                                                                                    {criterion.label}
                                                                                </th>
                                                                            ))}
                                                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">
                                                                                Overall
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-200">
                                                                        {users.map(user => {
                                                                            const userScores = allScores[user.id]?.[activeContest.id]?.[contestant.id.toString()] || {};
                                                                            return (
                                                                                <tr key={user.id} className="hover:bg-gray-50">
                                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                                                        {user.name} {user.isAdmin && <span className="text-purple-800">👑</span>}
                                                                                    </td>
                                                                                    {CRITERIA.map(criterion => (
                                                                                        <td key={criterion.id} className="px-3 py-2 text-center text-sm">
                                                                                            {userScores[criterion.id] || '-'}
                                                                                            {currentUser?.isAdmin && (
                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        handleEditVote(user.id, activeContest.id, contestant.id, criterion.id)
                                                                                                    }
                                                                                                    className="ml-1 text-blue-500 text-xs"
                                                                                                    title="Edit Vote"
                                                                                                >
                                                                                                    Edit
                                                                                                </button>
                                                                                            )}
                                                                                        </td>
                                                                                    ))}
                                                                                    <td className="px-3 py-2 text-center text-sm font-medium">
                                                                                        {userScores.overall ? userScores.overall.toFixed(1) : '-'}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}

                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium text-purple-900 mb-2">Scoring Formula</h3>
                <p className="text-sm">
                    The overall score is calculated using these weights:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                    <li>• Song Quality: <strong>40%</strong> - Melody, lyrics, composition</li>
                    <li>• Staging: <strong>25%</strong> - Visual presentation, choreography, lighting</li>
                    <li>• Vocal Quality: <strong>35%</strong> - Vocal ability, delivery, performance skill</li>
                </ul>
            </div>
        </div>
    );
};

export default Results;

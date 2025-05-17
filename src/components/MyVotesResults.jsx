import React, { useEffect, useState } from "react";
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

const MyVotesResults = ({ activeContest, allScores, currentUser }) => {
    const [myScores, setMyScores] = useState({});
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [nonVotingUsers, setNonVotingUsers] = useState([]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!activeContest || !currentUser) return;
        console.log("Getting scores for user:", currentUser.name, currentUser.id);
        console.log("Active contest:", activeContest.id);
        
        // Access scores through the correct path: allScores[currentUser.id][activeContest.id][contestantId]
        const scores = {};
        if (allScores[currentUser.id]?.[activeContest.id]) {
            activeContest.contestants.forEach(contestant => {
                const contestantScores = allScores[currentUser.id][activeContest.id][contestant.id];
                if (contestantScores) {
                    scores[contestant.id] = contestantScores;
                }
            });
        }
        console.log("Found my scores:", scores);
        setMyScores(scores);
    }, [activeContest, allScores, currentUser]);

    useEffect(() => {
        // Check for non-voting users in Semi Final 1
        if (activeContest?.id === 'euro2025sf1') {
            const usersWhoVoted = new Set();
            
            // Get all users who have voted in SF1
            Object.entries(allScores).forEach(([userId, contestScores]) => {
                if (contestScores['euro2025sf1'] && Object.keys(contestScores['euro2025sf1']).length > 0) {
                    usersWhoVoted.add(userId);
                }
            });

            // Get all users who haven't voted
            const nonVoting = Object.entries(allScores)
                .filter(([userId]) => !usersWhoVoted.has(userId))
                .map(([userId, scores]) => scores[Object.keys(scores)[0]]?.voterName || userId);

            setNonVotingUsers(nonVoting);
        }
    }, [activeContest, allScores]);

    if (!activeContest || !currentUser) return null;

    const getScore = (contestantId, criterionId) => {
        const score = myScores[contestantId]?.[criterionId];
        if (score === undefined) return "-";
        const numScore = parseFloat(score);
        return Number.isInteger(numScore) ? numScore.toFixed(0) : numScore.toFixed(2);
    };

    const getOverall = (contestantId) => {
        const score = myScores[contestantId]?.overall;
        if (score === undefined) return "-";
        const numScore = parseFloat(score);
        return Number.isInteger(numScore) ? numScore.toFixed(0) : numScore.toFixed(2);
    };

    const votedContestants = Object.keys(myScores);
    if (votedContestants.length === 0) {
        return (
            <div className="p-4 text-center text-cyan-800">
                <p>You have not voted for any contestants yet.</p>
            </div>
        );
    }

    // Show list of non-voting users if we're in Semi Final 1
    if (activeContest.id === 'euro2025sf1' && nonVotingUsers.length > 0) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4 text-cyan-900">Users who haven't voted yet:</h2>
                <div className="bg-white rounded-lg shadow-md p-4 border border-cyan-200">
                    <ul className="list-disc pl-5 space-y-1">
                        {nonVotingUsers.map((userName, index) => (
                            <li key={index} className="text-cyan-800">{userName}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    // Get voted contestants and sort by overall score descending
    const sortedContestants = activeContest.contestants
        .filter(c => myScores[c.id])  // Only show contestants with scores
        .sort((a, b) => {
            const aScore = parseFloat(getOverall(a.id)) || 0;
            const bScore = parseFloat(getOverall(b.id)) || 0;
            return bScore - aScore;  // Sort descending
        });

    // Responsive: show cards on mobile, table on desktop
    if (windowWidth < 640) {
        // Mobile card view
        return (
            <div className="p-2">
                {sortedContestants.map(contestant => (
                    <div key={contestant.id} className="bg-gradient-to-r from-white to-cyan-50 rounded-lg shadow-md mb-2 flex flex-col border border-cyan-100">
                        <div className="flex items-center justify-between px-2 py-1.5 min-h-[44px]">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {contestant.country && countryCodeMap[contestant.country] && (
                                    <ReactCountryFlag
                                        countryCode={countryCodeMap[contestant.country]}
                                        svg
                                        style={{ width: '1.5em', height: '1.5em' }}
                                        title={contestant.country}
                                    />
                                )}
                                <span className="font-medium text-cyan-900 truncate">{contestant.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex gap-1 mr-1">
                                    {CRITERIA.map(criterion => (
                                        <span key={criterion.id} className="w-7 px-0.5 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs font-semibold text-center" title={criterion.label}>
                                            {getScore(contestant.id, criterion.id)}
                                        </span>
                                    ))}
                                </div>
                                <span className={`px-2 py-1 rounded font-extrabold text-[15px] shadow-sm border border-cyan-200 bg-white ${parseFloat(getOverall(contestant.id)) >= 8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : parseFloat(getOverall(contestant.id)) >= 6 ? 'text-cyan-700' : 'text-cyan-800'} text-center block`}
                                    style={{ width: 44 }}
                                >
                                    {getOverall(contestant.id)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Desktop table view
    return (
        <div className="p-2 sm:p-4">
            <div className="overflow-x-auto w-full">
                <table className="min-w-[320px] w-full max-w-full border-collapse text-xs sm:text-sm">
                    <thead>
                        <tr className="bg-gradient-to-r from-cyan-50 to-cyan-100">
                            <th className="border border-cyan-200 px-2 sm:px-4 py-2 text-left text-cyan-900">Contestant</th>
                            <th className="border border-cyan-200 px-2 sm:px-4 py-2 text-center text-cyan-900">Criteria Scores</th>
                            <th className="border border-cyan-200 px-2 sm:px-4 py-2 text-center text-cyan-900 w-20">Overall</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedContestants.map(contestant => (
                            <tr key={contestant.id} className="border-b border-cyan-100 bg-white">
                                <td className="px-2 sm:px-4 py-2 border-x border-cyan-200">
                                    <div className="flex items-center gap-2">
                                        {contestant.country && countryCodeMap[contestant.country] && (
                                            <ReactCountryFlag
                                                countryCode={countryCodeMap[contestant.country]}
                                                svg
                                                style={{ width: '1.2em', height: '1.2em' }}
                                                title={contestant.country}
                                            />
                                        )}
                                        <span className="font-medium text-cyan-900">{contestant.name}</span>
                                    </div>
                                </td>
                                <td className="px-2 sm:px-4 py-2 border-x border-cyan-200">
                                    <div className="flex justify-center gap-1">
                                        {CRITERIA.map(criterion => (
                                            <span key={criterion.id} className="w-7 px-0.5 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs font-semibold text-center" title={criterion.label}>
                                                {getScore(contestant.id, criterion.id)}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-2 sm:px-4 py-2 text-center font-bold border-x border-cyan-200">
                                    <span className={`px-2 py-1 rounded font-extrabold text-[15px] shadow-sm border border-cyan-200 bg-white ${parseFloat(getOverall(contestant.id)) >= 8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : parseFloat(getOverall(contestant.id)) >= 6 ? 'text-cyan-700' : 'text-cyan-800'} text-center block`}
                                        style={{ width: 44 }}
                                    >
                                        {getOverall(contestant.id)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyVotesResults;

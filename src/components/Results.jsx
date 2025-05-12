import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { CRITERIA } from "../constants";
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

const Results = ({ activeContest }) => {
    const [allScores, setAllScores] = useState({});
    const [selectedContestant, setSelectedContestant] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voterNames, setVoterNames] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'overall', direction: 'desc' });

    // Fetch scores from Firestore
    const fetchScores = async () => {
        if (!activeContest) {
            console.log("❌ No active contest available");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            console.log("📡 Fetching scores for contest:", activeContest.id);
            const scoresData = {};
            const contestantsRef = collection(db, "contests", activeContest.id, "contestants");
            const contestantsSnapshot = await getDocs(contestantsRef);
            console.log("Found contestants:", contestantsSnapshot.docs.length);

            // Parallelize fetching scores for all contestants
            await Promise.all(contestantsSnapshot.docs.map(async (contestantDoc) => {
                const contestantId = contestantDoc.id;
                scoresData[contestantId] = {};
                const scoresRef = collection(db, "contests", activeContest.id, "contestants", contestantId, "scores");
                const scoresSnapshot = await getDocs(scoresRef);
                scoresSnapshot.forEach((scoreDoc) => {
                    const scoreData = scoreDoc.data();
                    scoresData[contestantId][scoreDoc.id] = scoreData;
                });
            }));

            setAllScores(scoresData);
        } catch (error) {
            console.error("🔥 Error fetching scores:", error);
            setError("Unable to load scores. Please check your connection and permissions.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch voter names from Firestore
    const fetchVoterNames = async () => {
        const voterNames = {};
        try {
            console.log("📡 Fetching voter names from Firestore...");
            const usersSnapshot = await getDocs(collection(db, "users"));
            if (usersSnapshot.empty) {
                console.warn("⚠️ No users found in Firestore.");
            }
            usersSnapshot.forEach((doc) => {
                const userData = doc.data();
                if (userData && userData.name) {
                    voterNames[doc.id] = userData.name;
                } else {
                    console.warn(`⚠️ Missing name for user ID: ${doc.id}`);
                }
            });
        } catch (error) {
            console.error("🔥 Error fetching voter names:", error);
        }
        return voterNames;
    };

    // Update the voter names when scores change
    useEffect(() => {
        const loadVoterNames = async () => {
            try {
                const names = {};
                // Get names from scores data since it's more reliable
                Object.entries(allScores).forEach(([contestantId, contestantScores]) => {
                    Object.entries(contestantScores).forEach(([userId, scoreData]) => {
                        if (scoreData.voterName) {
                            names[userId] = scoreData.voterName;
                        }
                    });
                });
                setVoterNames(names);
            } catch (error) {
                console.error("Error loading voter names:", error);
            }
        };
        loadVoterNames();
    }, [allScores]);

    useEffect(() => {
        fetchScores();
    }, [activeContest]);

    const formatScore = (score) => {
        if (score === "-") return "-";
        const numScore = parseFloat(score);
        return Number.isInteger(numScore) ? numScore.toString() : numScore.toFixed(2);
    };

    // Get average score per criterion
    const getAverageScore = (contestantId, criterionId) => {
        let total = 0;
        let count = 0;

        Object.values(allScores[contestantId] || {}).forEach((userScores) => {
            if (userScores[criterionId] !== undefined) {
                total += parseFloat(userScores[criterionId]);
                count++;
            }
        });

        return count > 0 ? formatScore(total / count) : "-";
    };

    // Get overall average score for contestant
    const getOverallScore = (contestantId) => {
        let total = 0;
        let count = 0;

        Object.values(allScores[contestantId] || {}).forEach((userScores) => {
            if (userScores.overall !== undefined) {
                total += parseFloat(userScores.overall);
                count++;
            }
        });

        return count > 0 ? formatScore(total / count) : "-";
    };

    // Toggle detailed votes for a contestant
    const toggleContestantDetails = (contestantId) => {
        setSelectedContestant(selectedContestant === contestantId ? null : contestantId);
    };

    // Get contestant rank
    const getContestantRank = (contestantId) => {
        const sortedContestants = Object.keys(allScores).sort((a, b) => {
            const overallScoreA = getOverallScore(a);
            const overallScoreB = getOverallScore(b);
            return overallScoreB - overallScoreA;
        });
        return sortedContestants.indexOf(contestantId) + 1;
    };

    // Function to handle sorting
    const handleSort = (key) => {
        setSortConfig((prevConfig) => {
            if (prevConfig.key === key) {
                // Toggle direction if the same column is clicked
                return { key, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' }; // Default to descending
        });
    };

    // Sort contestants based on sortConfig
    const sortedContestants = [...activeContest.contestants].sort((a, b) => {
        if (sortConfig.key === 'overall') {
            const scoreA = parseFloat(getOverallScore(a.id));
            const scoreB = parseFloat(getOverallScore(b.id));
            return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        } else {
            const scoreA = parseFloat(getAverageScore(a.id, sortConfig.key));
            const scoreB = parseFloat(getAverageScore(b.id, sortConfig.key));
            return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        }
    });

    const getVoterName = (userId, scores) => {
        // First try to get the name from the score data
        if (scores.voterName) {
            return scores.voterName;
        }
        // Fall back to the voter names state
        return voterNames[userId] || userId;
    };

    if (loading) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Results</h2>
                <p>Loading scores...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Results</h2>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                    <button 
                        onClick={fetchScores}
                        className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!activeContest || !Array.isArray(activeContest.contestants) || activeContest.contestants.length === 0) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Results</h2>
                <p>No contestants available for this contest. Please check the contest data.</p>
            </div>
        );
    }

    if (!allScores || Object.keys(allScores).length === 0) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Results</h2>
                <p>No scores available. Please ensure voting has been completed.</p>
            </div>
        );
    }

    // Mobile card view for results
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
        return (
            <div className="p-2">
                <h2 className="text-xl font-bold mb-4 text-center">Results</h2>
                {sortedContestants.map((contestant, idx) => {
                    const position = idx + 1;
                    const isOpen = selectedContestant === contestant.id;
                    return (
                        <div key={contestant.id} className="bg-white rounded-lg shadow mb-3 p-3 flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-block w-7 h-7 rounded-full text-white text-center font-bold text-base flex items-center justify-center ${position === 1 ? 'bg-yellow-400' : position === 2 ? 'bg-gray-400' : position === 3 ? 'bg-orange-400' : 'bg-purple-400'}`}>{position}</span>
                                    {contestant.country && countryCodeMap[contestant.country] && (
                                        <ReactCountryFlag
                                            countryCode={countryCodeMap[contestant.country]}
                                            svg
                                            style={{ width: '1.3em', height: '1.3em', marginRight: '0.3em', verticalAlign: 'middle' }}
                                            title={contestant.country}
                                        />
                                    )}
                                    <span className="font-bold text-purple-900 text-base">{contestant.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Overall</div>
                                        <div className="text-xl font-bold text-purple-700">{getOverallScore(contestant.id)}</div>
                                    </div>
                                    <button
                                        className={`ml-2 w-7 h-7 flex items-center justify-center rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-base focus:outline-none focus:ring-2 focus:ring-purple-300 transition-transform ${isOpen ? 'rotate-45' : ''}`}
                                        aria-label={isOpen ? 'Hide Details' : 'Show Details'}
                                        onClick={() => toggleContestantDetails(contestant.id)}
                                    >
                                        <span style={{fontWeight:'normal',fontSize:'1.2em',lineHeight:'1em'}}>{isOpen ? '−' : '+'}</span>
                                    </button>
                                </div>
                            </div>
                            {isOpen && (
                                <div className="mt-3">
                                    <div className="mb-2">
                                        <div className="font-semibold text-purple-800 mb-1">Average by Criteria</div>
                                        <ul>
                                            {CRITERIA.map(criterion => (
                                                <li key={criterion.id} className="flex justify-between text-sm mb-1">
                                                    <span>{criterion.label}</span>
                                                    <span className="font-mono">{getAverageScore(contestant.id, criterion.id)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-purple-800 mb-1">Individual Votes</div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border border-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="px-2 py-1 border">Voter</th>
                                                        {CRITERIA.map(criterion => (
                                                            <th key={criterion.id} className="px-2 py-1 border">{criterion.label}</th>
                                                        ))}
                                                        <th className="px-2 py-1 border">Overall</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(allScores[contestant.id] || {}).map(([userId, scores]) => (
                                                        <tr key={userId}>
                                                            <td className="px-2 py-1 border">{scores.voterIsAdmin ? <span className="font-bold">{getVoterName(userId, scores)}</span> : getVoterName(userId, scores)}</td>
                                                            {CRITERIA.map(criterion => (
                                                                <td key={criterion.id} className="px-2 py-1 border text-center">{scores[criterion.id] !== undefined ? formatScore(scores[criterion.id]) : '-'}</td>
                                                            ))}
                                                            <td className="px-2 py-1 border text-center font-bold">{scores.overall !== undefined ? formatScore(scores.overall) : '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-4">
            <h2 className="text-xl font-bold mb-4 text-center sm:text-left">Results</h2>
            {Object.keys(allScores).length === 0 ? (
                <p>No results available.</p>
            ) : (
                <div className="overflow-x-auto w-full">
                    <table className="min-w-[600px] w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-gray-300 px-2 sm:px-4 py-2">Contestant</th>
                                {CRITERIA.map((criterion) => (
                                    <th
                                        key={criterion.id}
                                        className="border border-gray-300 px-2 sm:px-4 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort(criterion.id)}
                                    >
                                        {criterion.label} {sortConfig.key === criterion.id && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                    </th>
                                ))}
                                <th
                                    className="border border-gray-300 px-2 sm:px-4 py-2 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('overall')}
                                >
                                    Overall {sortConfig.key === 'overall' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedContestants.map((contestant) => (
                                <React.Fragment key={contestant.id}>
                                    <tr
                                        className="hover:bg-gray-100 cursor-pointer"
                                        onClick={() => toggleContestantDetails(contestant.id)}
                                    >
                                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                            {contestant.country && countryCodeMap[contestant.country] && (
                                                <ReactCountryFlag
                                                    countryCode={countryCodeMap[contestant.country]}
                                                    svg
                                                    style={{
                                                        width: '1.2em',
                                                        height: '1.2em',
                                                        marginRight: '0.5em',
                                                        verticalAlign: 'middle'
                                                    }}
                                                    title={contestant.country}
                                                />
                                            )}
                                            {contestant.name}
                                            {getContestantRank(contestant.id) === 1 && <span className="ml-2" title="1st Place">🏆</span>}
                                            {getContestantRank(contestant.id) === 2 && <span className="ml-2" title="2nd Place">🥈</span>}
                                            {getContestantRank(contestant.id) === 3 && <span className="ml-2" title="3rd Place">🥉</span>}
                                        </td>
                                        {CRITERIA.map((criterion) => (
                                            <td key={criterion.id} className="border border-gray-300 px-2 sm:px-4 py-2 text-center">
                                                {getAverageScore(contestant.id, criterion.id)}
                                            </td>
                                        ))}
                                        <td className="border border-gray-300 px-2 sm:px-4 py-2 font-bold text-center">
                                            {getOverallScore(contestant.id)}
                                        </td>
                                    </tr>

                                    {/* Detailed Individual Scores */}
                                    {selectedContestant === contestant.id && (
                                        <tr>
                                            <td colSpan={CRITERIA.length + 2} className="bg-purple-50 p-2 sm:p-4">
                                                <h3 className="font-medium text-purple-800 mb-2 text-center sm:text-left">
                                                    {contestant.country && countryCodeMap[contestant.country] && (
                                                        <ReactCountryFlag
                                                            countryCode={countryCodeMap[contestant.country]}
                                                            svg
                                                            style={{
                                                                width: '1.2em',
                                                                height: '1.2em',
                                                                marginRight: '0.5em',
                                                                verticalAlign: 'middle'
                                                            }}
                                                            title={contestant.country}
                                                        />
                                                    )}
                                                    Individual Scores for {contestant.name}
                                                </h3>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-[500px] w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="border border-gray-300 px-2 sm:px-4 py-2">Voter</th>
                                                                {CRITERIA.map((criterion) => (
                                                                    <th key={criterion.id} className="border border-gray-300 px-2 sm:px-4 py-2 text-center">
                                                                        {criterion.label}
                                                                    </th>
                                                                ))}
                                                                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center">Overall</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(allScores[contestant.id] || {}).map(([userId, scores]) => (
                                                                <tr key={userId}>
                                                                    <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                                                        {scores.voterIsAdmin ? <span className="font-bold">{getVoterName(userId, scores)}</span> : getVoterName(userId, scores)}
                                                                    </td>
                                                                    {CRITERIA.map((criterion) => (
                                                                        <td key={criterion.id} className="border border-gray-300 px-2 sm:px-4 py-2 text-center">
                                                                            {scores[criterion.id] !== undefined ? formatScore(scores[criterion.id]) : "-"}
                                                                        </td>
                                                                    ))}
                                                                    <td className="border border-gray-300 px-2 sm:px-4 py-2 text-center font-bold">
                                                                        {scores.overall !== undefined ? formatScore(scores.overall) : "-"}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Results;

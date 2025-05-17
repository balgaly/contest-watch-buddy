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
    'Finland': 'FI',
    'Spain': 'ES',
    'Switzerland': 'CH',
    'Italy': 'IT'
};

const Results = ({ activeContest, currentUser, handleDeleteVote }) => {
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
    }, [activeContest]);    const formatScore = (score) => {
        if (score === "-") return "-";
        const numScore = parseFloat(score);
        return Number.isInteger(numScore) ? numScore.toFixed(0) : numScore.toFixed(2);
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
        const getSortableScore = (score) => {
            const parsed = parseFloat(score);
            return isNaN(parsed) ? 0 : parsed;
        };
        if (sortConfig.key === 'overall') {
            const scoreA = getSortableScore(getOverallScore(a.id));
            const scoreB = getSortableScore(getOverallScore(b.id));
            return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        } else {
            const scoreA = getSortableScore(getAverageScore(a.id, sortConfig.key));
            const scoreB = getSortableScore(getAverageScore(b.id, sortConfig.key));
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

    // Handle delete click (admin only)
    const handleDelete = (e, userId, contestantId) => {
        e.stopPropagation();
        if (currentUser?.isAdmin && window.confirm("Are you sure you want to delete this vote?")) {
            handleDeleteVote(userId, activeContest.id, contestantId);
        }
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
        // Always sort by overall score, descending
        const sortedByOverall = [...sortedContestants].sort((a, b) => {
            const scoreA = parseFloat(getOverallScore(a.id));
            const scoreB = parseFloat(getOverallScore(b.id));
            return scoreB - scoreA;
        });        return (
            <div className="p-2">
                {sortedByOverall.map((contestant, idx) => {
                    const position = idx + 1;
                    const isOpen = selectedContestant === contestant.id;
                    const overallScore = getOverallScore(contestant.id);
                    return (
                        <div key={contestant.id} className={`bg-gradient-to-r from-white to-cyan-50 rounded-lg shadow-md mb-2 flex flex-col border border-cyan-100 ${isOpen ? 'shadow-lg' : ''}`}>
                            <div className="flex items-center justify-between px-2 py-1.5 min-h-[44px]" onClick={() => toggleContestantDetails(contestant.id)}>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className={`flex-shrink-0 inline-flex w-5 h-5 rounded-full text-white text-sm items-center justify-center shadow-sm ${position === 1 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' : position === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' : position === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-gradient-to-br from-cyan-400 to-cyan-500'}`}>{position}</span>
                                    {contestant.country && countryCodeMap[contestant.country] && (
                                        <>
                                            <ReactCountryFlag
                                                countryCode={countryCodeMap[contestant.country]}
                                                svg
                                                style={{ width: '1.5em', height: '1.5em' }}
                                                title={contestant.country}
                                            />
                                            <span className="font-medium text-cyan-900">{contestant.country}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Criteria scores as fixed-width pills for alignment */}
                                    <div className="flex gap-1 mr-1">
                                        {CRITERIA.map(criterion => (
                                            <span key={criterion.id} className="w-7 px-0.5 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs font-semibold text-center" title={criterion.label}>
                                                {formatScore(getAverageScore(contestant.id, criterion.id))}
                                            </span>
                                        ))}
                                    </div>
                                    {/* Emphasized overall score, fixed width for alignment */}
                                    <span className={`px-2 py-1 rounded font-extrabold text-[15px] shadow-sm border border-cyan-200 bg-white ${parseFloat(overallScore) >= 8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : parseFloat(overallScore) >= 6 ? 'text-cyan-700' : 'text-cyan-800'} text-center block`}
                                        style={{ width: 44 }}
                                    >
                                        {overallScore}
                                    </span>
                                    <button
                                        className={`w-6 h-6 flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-200 ${isOpen ? 'rotate-180 bg-cyan-100' : ''}`}
                                        aria-label={isOpen ? 'Hide Details' : 'Show Details'}
                                    >
                                        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            {isOpen && (
                                <div className="px-2 py-1.5 border-t border-cyan-100 bg-white bg-opacity-60">
                                    <div className="text-xs">
                                        <div className="space-y-1">
                                            {Object.entries(allScores[contestant.id] || {})
                                                .sort((a, b) => {
                                                    const scoreA = parseFloat(a[1].overall);
                                                    const scoreB = parseFloat(b[1].overall);
                                                    return scoreB - scoreA;
                                                })
                                                .map(([userId, scores]) => (
                                                    <div key={userId} className="flex items-center gap-1.5 hover:bg-cyan-50 p-1 rounded transition-colors">
                                                        <span className={`${scores.voterIsAdmin ? "font-medium text-cyan-900" : "text-cyan-800"} flex-1`}>
                                                            {getVoterName(userId, scores)}
                                                        </span>
                                                        <div className="flex gap-1 mr-1">
                                                            {CRITERIA.map(criterion => (
                                                                <span key={criterion.id} className="w-7 px-0.5 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs font-semibold text-center" title={criterion.label}>
                                                                    {formatScore(scores[criterion.id])}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className={`px-2 py-1 rounded font-extrabold text-[15px] shadow-sm border border-cyan-200 bg-white ${parseFloat(scores.overall) >= 8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : parseFloat(scores.overall) >= 6 ? 'text-cyan-700' : 'text-cyan-800'} text-center block`}
                                                            style={{ width: 44 }}
                                                        >
                                                            {formatScore(scores.overall)}
                                                        </span>
                                                        {currentUser?.isAdmin && (
                                                            <button
                                                                onClick={(e) => handleDelete(e, userId, contestant.id)}
                                                                className="w-6 h-6 flex items-center justify-center text-lg text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors"
                                                                title="Delete vote"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }    return (
        <div className="p-2 sm:p-4">
            {Object.keys(allScores).length === 0 ? (
                <p>No results available.</p>
            ) : (
                <div className="overflow-x-auto w-full">
                    <table className="min-w-[600px] w-full border-collapse text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-gradient-to-r from-cyan-50 to-cyan-100">
                                <th className="border border-cyan-200 px-2 sm:px-4 py-2 text-left text-cyan-900">Contestant</th>
                                <th className="border border-cyan-200 px-2 sm:px-4 py-2 text-center text-cyan-900">Individual Criteria</th>
                                <th
                                    className="border border-cyan-200 px-2 sm:px-4 py-2 cursor-pointer hover:bg-cyan-100 text-center text-cyan-900 w-20"
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
                                        className={`border-b border-cyan-100 hover:bg-cyan-50 cursor-pointer transition-colors ${selectedContestant === contestant.id ? 'bg-cyan-50' : 'bg-white'}`}
                                        onClick={() => toggleContestantDetails(contestant.id)}
                                    >
                                        <td className="px-2 sm:px-4 py-2 border-x border-cyan-200">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex w-5 h-5 rounded-full text-white text-sm items-center justify-center shadow-sm ${getContestantRank(contestant.id) === 1 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' : getContestantRank(contestant.id) === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' : getContestantRank(contestant.id) === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-gradient-to-br from-cyan-400 to-cyan-500'}`}>{getContestantRank(contestant.id)}</span>
                                                {contestant.country && countryCodeMap[contestant.country] && (
                                                    <>
                                                        <ReactCountryFlag
                                                            countryCode={countryCodeMap[contestant.country]}
                                                            svg
                                                            style={{
                                                                width: '1.2em',
                                                                height: '1.2em'
                                                            }}
                                                            title={contestant.country}
                                                        />
                                                        <span className="font-medium text-cyan-900">{contestant.country}</span>
                                                    </>
                                                )}
                                                <span className="font-medium text-cyan-900">{contestant.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 border-x border-cyan-200">
                                            <div className="flex justify-center gap-1">
                                                {CRITERIA.map((criterion) => (
                                                    <span
                                                        key={criterion.id}
                                                        className="w-7 px-0.5 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs font-semibold text-center"
                                                        title={criterion.label}
                                                    >
                                                        {getAverageScore(contestant.id, criterion.id)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-center font-bold border-x border-cyan-200">
                                            <span
                                                className={`px-2 py-1 rounded font-extrabold text-[15px] shadow-sm border border-cyan-200 bg-white ${parseFloat(getOverallScore(contestant.id)) >= 8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : parseFloat(getOverallScore(contestant.id)) >= 6 ? 'text-cyan-700' : 'text-cyan-800'} text-center block`}
                                                style={{ width: 44 }}
                                            >
                                                {getOverallScore(contestant.id)}
                                            </span>
                                        </td>
                                    </tr>

                                    {/* Detailed Individual Scores */}
                                    {selectedContestant === contestant.id && (
                                        <tr>
                                            <td colSpan={3} className="bg-cyan-50 p-2 sm:p-4 border border-cyan-200">
                                                <h3 className="font-medium text-cyan-900 mb-2">
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
                                                <div className="space-y-1">
                                                    {Object.entries(allScores[contestant.id] || {})
                                                        .sort((a, b) => {
                                                            const scoreA = parseFloat(a[1].overall);
                                                            const scoreB = parseFloat(b[1].overall);
                                                            return scoreB - scoreA;
                                                        })
                                                        .map(([userId, scores]) => (
                                                            <div key={userId} className="flex items-center gap-1.5 hover:bg-cyan-50 p-1 rounded transition-colors">
                                                                <span className={scores.voterIsAdmin ? "font-medium text-cyan-900" : "text-cyan-800"}>
                                                                    {getVoterName(userId, scores)}
                                                                </span>
                                                                <div className="flex gap-1 mr-1">
                                                                    {CRITERIA.map(criterion => (
                                                                        <span key={criterion.id} className="w-7 px-0.5 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs font-semibold text-center" title={criterion.label}>
                                                                            {formatScore(scores[criterion.id])}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <span className={`px-2 py-1 rounded font-extrabold text-[15px] shadow-sm border border-cyan-200 bg-white ${parseFloat(scores.overall) >= 8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : parseFloat(scores.overall) >= 6 ? 'text-cyan-700' : 'text-cyan-800'} text-center block`}
                                                                    style={{ width: 44 }}
                                                                >
                                                                    {formatScore(scores.overall)}
                                                                </span>
                                                                {currentUser?.isAdmin && (
                                                                    <button
                                                                        onClick={(e) => handleDelete(e, userId, contestant.id)}
                                                                        className="w-6 h-6 flex items-center justify-center text-lg text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors"
                                                                        title="Delete vote"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
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

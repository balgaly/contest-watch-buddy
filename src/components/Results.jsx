import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { CRITERIA } from "../constants";

const Results = ({ activeContest }) => {
    const [allScores, setAllScores] = useState({});
    const [selectedContestant, setSelectedContestant] = useState(null);

    // Fetch scores from Firestore
    const fetchScores = async () => {
        if (!activeContest) return;

        console.log("📡 Fetching scores from Firestore...");

        const scoresData = {};
        const contestantsRef = collection(db, "contests", activeContest.id, "contestants");
        const contestantsSnapshot = await getDocs(contestantsRef);

        for (const contestantDoc of contestantsSnapshot.docs) {
            const contestantId = contestantDoc.id;
            scoresData[contestantId] = {};

            const scoresRef = collection(db, "contests", activeContest.id, "contestants", contestantId, "scores");
            const scoresSnapshot = await getDocs(scoresRef);

            scoresSnapshot.forEach((scoreDoc) => {
                scoresData[contestantId][scoreDoc.id] = scoreDoc.data();
            });
        }

        console.log("✅ Scores fetched successfully:", scoresData);
        setAllScores(scoresData);
    };

    useEffect(() => {
        fetchScores();
    }, [activeContest]);

    const formatScore = (score) => {
        return score % 1 === 0 ? score.toFixed(0) : score.toFixed(2);
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

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Results</h2>
            {Object.keys(allScores).length === 0 ? (
                <p>No results available.</p>
            ) : (
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-300 px-4 py-2">Contestant</th>
                            {CRITERIA.map((criterion) => (
                                <th key={criterion.id} className="border border-gray-300 px-4 py-2">
                                    {criterion.label}
                                </th>
                            ))}
                            <th className="border border-gray-300 px-4 py-2">Overall</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeContest.contestants.map((contestant) => (
                            <React.Fragment key={contestant.id}>
                                <tr
                                    className="hover:bg-gray-100 cursor-pointer"
                                    onClick={() => toggleContestantDetails(contestant.id)}
                                >
                                    <td className="border border-gray-300 px-4 py-2">
                                        {contestant.name}
                                        {getContestantRank(contestant.id) === 1 && <span className="ml-2" title="1st Place">🏆</span>}
                                        {getContestantRank(contestant.id) === 2 && <span className="ml-2" title="2nd Place">🥈</span>}
                                        {getContestantRank(contestant.id) === 3 && <span className="ml-2" title="3rd Place">🥉</span>}
                                    </td>
                                    {CRITERIA.map((criterion) => (
                                        <td key={criterion.id} className="border border-gray-300 px-4 py-2 text-center">
                                            {getAverageScore(contestant.id, criterion.id)}
                                        </td>
                                    ))}
                                    <td className="border border-gray-300 px-4 py-2 font-bold text-center">
                                        {getOverallScore(contestant.id)}
                                    </td>
                                </tr>

                                {/* Detailed Individual Scores */}
                                {selectedContestant === contestant.id && (
                                    <tr>
                                        <td colSpan={CRITERIA.length + 2} className="bg-purple-50 p-4">
                                            <h3 className="font-medium text-purple-800 mb-2">
                                                Individual Scores for {contestant.name}
                                            </h3>
                                            <table className="w-full border-collapse border border-gray-300">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border border-gray-300 px-4 py-2">Voter</th>
                                                        {CRITERIA.map((criterion) => (
                                                            <th key={criterion.id} className="border border-gray-300 px-4 py-2 text-center">
                                                                {criterion.label}
                                                            </th>
                                                        ))}
                                                        <th className="border border-gray-300 px-4 py-2 text-center">Overall</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(allScores[contestant.id] || {}).map(([userId, scores]) => (
                                                        <tr key={userId}>
                                                            <td className="border border-gray-300 px-4 py-2">
                                                                {scores.voterName || userId} {scores.voterIsAdmin && <span className="text-purple-800">👑</span>}
                                                            </td>
                                                            {CRITERIA.map((criterion) => (
                                                                <td key={criterion.id} className="border border-gray-300 px-4 py-2 text-center">
                                                                    {scores[criterion.id] !== undefined ? scores[criterion.id] : "-"}
                                                                </td>
                                                            ))}
                                                            <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                                                                {scores.overall !== undefined ? scores.overall.toFixed(2) : "-"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Results;

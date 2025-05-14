// components/LoginScreen.jsx
import React, { useEffect } from 'react';

const LoginScreen = ({
    username,
    setUsername,
    password,
    setPassword,
    showAdminLogin,
    setShowAdminLogin,
    loginError,
    handleLogin,
    contests,
    activeContestId,
    switchContest
}) => {
    useEffect(() => {
        // Load cached username when component mounts
        const cachedUsername = localStorage.getItem('lastUsername');
        if (cachedUsername && !username) {
            setUsername(cachedUsername);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-cyan-900 mb-6">
                    Contest Watch Buddy
                </h1>
                <div className="space-y-4">
                    <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">
                            Select Contest
                        </label>
                        {contests && contests.length > 0 ? (
                            <select
                                value={activeContestId}
                                onChange={(e) => switchContest(e.target.value)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                            >
                                {contests.map(contest => (
                                    <option key={contest.id} value={contest.id}>
                                        {contest.name} ({contest.contestants.length} contestants)
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-500">
                                Loading contests...
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                            placeholder="Enter your name"
                        />
                    </div>
                    {showAdminLogin && (
                        <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">
                                Admin Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                                placeholder="Enter admin password"
                            />
                        </div>
                    )}
                    {loginError && <div className="text-red-500 text-sm">{loginError}</div>}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleLogin}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-lg py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-cyan-600"
                        >
                            {showAdminLogin ? 'Login as Admin' : 'Join Watch Party'}
                        </button>
                        {showAdminLogin ? (
                            <button
                                onClick={() => {
                                    setShowAdminLogin(false);
                                    setPassword('');
                                }}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAdminLogin(true)}
                                className="px-4 py-2 text-lg text-cyan-700 hover:text-cyan-800"
                            >
                                Admin
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;

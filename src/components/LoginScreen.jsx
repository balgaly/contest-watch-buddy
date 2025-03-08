// components/LoginScreen.jsx
import React from 'react';

const LoginScreen = ({
    username,
    setUsername,
    password,
    setPassword,
    showAdminLogin,
    setShowAdminLogin,
    loginError,
    handleLogin
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-purple-900 mb-6">
                    Contest Watch Buddy
                </h1>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                            placeholder="Enter your name"
                        />
                    </div>
                    {showAdminLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Enter admin password"
                            />
                        </div>
                    )}
                    {loginError && <div className="text-red-500 text-sm">{loginError}</div>}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleLogin}
                            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                                className="px-4 py-2 text-purple-800 hover:text-purple-900"
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

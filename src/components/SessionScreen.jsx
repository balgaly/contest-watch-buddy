// components/SessionScreen.jsx
import React from 'react';

const SessionScreen = ({ resumeSession, clearSession, isAdmin }) => {
    return (
        <div className="min-h-screen bg-purple-200 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
                <h1 className="text-2xl font-bold text-purple-900 mb-4">Session Detected</h1>
                <p className="mb-6 text-gray-700">
                    Would you like to resume your previous session?
                </p>
                <div className="flex space-x-4 justify-center">
                    <button
                        onClick={resumeSession}
                        className="bg-purple-800 text-white py-2 px-4 rounded hover:bg-purple-900"
                    >
                        Resume Session
                    </button>
                    {isAdmin && (
                        <button
                            onClick={clearSession}
                            className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                        >
                            Clear Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionScreen;

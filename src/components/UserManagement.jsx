// components/UserManagement.jsx
import React from 'react';

const UserManagement = ({ users, currentUser, switchUser, deleteUser, goBack }) => {
    return (
        <div className="min-h-screen bg-cyan-100 p-4">
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-cyan-900">Manage Users</h1>
                    <button onClick={goBack} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        Back
                    </button>
                </div>
                {users.length > 0 ? (
                    <ul className="space-y-2 mb-6">
                        {users.map(user => (
                            <li key={user.id} className="border rounded p-3 flex justify-between items-center">
                                <span>
                                    {user.name} {user.isAdmin && <span className="text-cyan-700">👑</span>}
                                </span>
                                <div className="flex space-x-2">
                                    {currentUser?.isAdmin && !user.isAdmin && (
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                        >
                                            Remove
                                        </button>
                                    )}
                                    {!currentUser?.isAdmin && user.id !== currentUser?.id && (
                                        <button
                                            onClick={() => switchUser(user.id)}
                                            className="px-2 py-1 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700"
                                        >
                                            Switch to
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">No users found.</p>
                )}
            </div>
        </div>
    );
};

export default UserManagement;

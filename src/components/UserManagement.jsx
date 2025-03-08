// components/UserManagement.jsx
import React from 'react';

const UserManagement = ({ users, currentUser, switchUser, deleteUser, goBack, addUser }) => {
    const [newUserName, setNewUserName] = React.useState('');
    const [isAdmin, setIsAdmin] = React.useState(false);

    const handleAddUser = () => {
        if (newUserName.trim() !== '') {
            addUser({ name: newUserName, isAdmin });
            setNewUserName('');
            setIsAdmin(false);
        }
    };

    return (
        <div className="min-h-screen bg-purple-200 p-4">
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-purple-900">Manage Users</h1>
                    <button onClick={goBack} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        Back
                    </button>
                </div>
                {users.length > 0 ? (
                    <ul className="space-y-2 mb-6">
                        {users.map(user => (
                            <li key={user.id} className="border rounded p-3 flex justify-between items-center">
                                <span>
                                    {user.name} {user.isAdmin && <span className="text-purple-800">👑</span>}
                                    {user.id === currentUser?.id && <span className="ml-2 text-green-600 text-xs">(Current)</span>}
                                </span>
                                <div className="flex space-x-2">
                                    <button onClick={() => switchUser(user.id)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                        Switch
                                    </button>
                                    <button onClick={() => deleteUser(user.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded" disabled={users.length <= 1}>
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 mb-6">No users yet</p>
                )}
                <div className="mb-6">
                    <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Enter user name"
                        className="w-full mb-2 p-2 border rounded"
                    />
                    <div className="flex items-center mb-2">
                        <input
                            type="checkbox"
                            checked={isAdmin}
                            onChange={(e) => setIsAdmin(e.target.checked)}
                            className="mr-2"
                        />
                        <label>Admin</label>
                    </div>
                    <button onClick={handleAddUser} className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                        Add User
                    </button>
                </div>
                <button onClick={goBack} className="w-full bg-purple-800 text-white py-2 px-4 rounded hover:bg-purple-900">
                    Back to Main
                </button>
            </div>
        </div>
    );
};

export default UserManagement;

import React from 'react';

const UserManagement = ({ users, currentUser, deleteUser, goBack }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>MANAGE USERS</h1>
          <button
            onClick={goBack}
            className="px-3 py-1.5 text-sm transition-colors"
            style={{ background: 'var(--surface)', color: 'var(--text2)', borderRadius: 0, minHeight: 36 }}
          >
            Back
          </button>
        </div>
        {users.length > 0 ? (
          <div>
            {users.map(user => (
              <div key={user.id} className="flex justify-between items-center py-3 px-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--surface-hover)', color: 'var(--text3)' }}>
                      {user.name?.[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block" style={{ color: 'var(--text)' }}>
                      {user.name}
                      {user.isAdmin && <span className="ml-1.5 text-[10px]" style={{ color: 'var(--gold)' }}>Admin</span>}
                    </span>
                    {user.id === currentUser?.id && <span className="text-[10px]" style={{ color: 'var(--text3)' }}>You</span>}
                  </div>
                </div>
                {currentUser?.isAdmin && !user.isAdmin && user.id !== currentUser?.id && (
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-2.5 py-1 text-xs transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 0, minHeight: 32 }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm" style={{ color: 'var(--text3)' }}>No users found.</div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

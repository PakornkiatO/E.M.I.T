function LobbyPage({ username, onlineUsers, allUsers, groups = [], censorWords = [], onLogout, onStartChat, onCreateGroup, onOpenGroup, onAddCensorWord, onRemoveCensorWord }) {
    const styles = {
        container: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            padding: '20px',
        },
        box: {
            background: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            width: '100%',
            maxWidth: '500px',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '2px solid #eee',
        },
        title: {
            color: '#333',
            fontSize: '28px',
            margin: '0',
        },
        userInfo: {
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
        },
        username: {
            color: '#666',
            fontWeight: '600',
            fontSize: '16px',
        },
        logoutButton: {
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.3s, transform 0.3s',
        },
        section: {
            marginBottom: '30px',
        },
        sectionTitle: {
            color: '#333',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '15px',
            marginTop: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        headerActions: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        userCount: {
            background: '#667eea',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
        },
        createGroupBtn: {
            padding: '8px 12px',
            background: '#e6f0ff',
            border: '1px solid #667eea',
            color: '#333',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
        },
        usersList: {
            listStyle: 'none',
            padding: '0',
            margin: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        },
        userItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: '#f8f9ff',
            borderRadius: '8px',
            border: '2px solid #eee',
            transition: 'all 0.3s',
        },
        userItemHover: {
            background: '#f0f2ff',
            borderColor: '#667eea',
        },
        currentUser: {
            background: '#e8f0ff',
            borderColor: '#667eea',
            fontWeight: '600',
        },
        onlineIndicator: {
            fontSize: '16px',
            animation: 'pulse 2s infinite',
        },
        userNameText: {
            color: '#333',
            fontWeight: '500',
            flex: '1',
        },
        youBadge: {
            background: '#667eea',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
        },
        noUsersMessage: {
            textAlign: 'center',
            color: '#999',
            padding: '20px',
            background: '#f5f5f5',
            borderRadius: '8px',
            fontSize: '14px',
        },
    };

    return (
        <>
            <style>{`
                * {
                    box-sizing: border-box;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
                button:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: translateY(-2px);
                }
                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                .user-item:hover {
                    background: #f0f2ff !important;
                    border-color: #667eea !important;
                    cursor: pointer;
                }
            `}</style>

            <div style={styles.container}>
                <div style={styles.box}>
                    {/* Header */}
                    <div style={styles.header}>
                        <h1 style={styles.title}>💬 Chat Application</h1>
                        <div style={styles.userInfo}>
                            <span style={styles.username}>👤 {username}</span>
                            <button
                                onClick={onLogout}
                                style={styles.logoutButton}
                                onMouseEnter={(e) => {
                                    e.target.style.opacity = '0.9';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.opacity = '1';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>

                    {/* Online Users Section */}
                    {/* <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>
                            🟢 Online Users
                            <span style={styles.userCount}>{onlineUsers.length}</span>
                        </h2>
                        {onlineUsers.length === 0 ? (
                            <div style={styles.noUsersMessage}>
                                No users online at the moment
                            </div>
                        ) : (
                            <ul style={styles.usersList}>
                                {onlineUsers.map((user) => (
                                    <li
                                        key={user.socketId}
                                        style={{
                                            ...styles.userItem,
                                            ...(user.username === username ? styles.currentUser : {}),
                                        }}
                                        className="user-item"
                                    >
                                        <span style={styles.onlineIndicator}>🟢</span>
                                        <span style={styles.userNameText}>{user.username}</span>
                                        {user.username === username && (
                                            <span style={styles.youBadge}>(You)</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div> */}

                    {/* All Users Section */}
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>
                            👥 All Users
                            <span style={styles.userCount}>{allUsers.length}</span>
                        </h2>
                        {allUsers.length === 0 ? (
                            <div style={styles.noUsersMessage}>
                                No users found
                            </div>
                        ) : (
                            <ul style={styles.usersList}>
                                {allUsers.map((user) => {
                                    const isOnline = onlineUsers.some(u => u.username === user);
                                    return (
                                        <li
                                            key={user}
                                            style={{
                                                ...styles.userItem,
                                                ...(user === username ? styles.currentUser : {}),
                                                background: isOnline ? '#e8f0ff' : '#f5f5f5',
                                                borderColor: isOnline ? '#667eea' : '#ddd',
                                            }}
                                            className="user-item"
                                            onClick={() => {
                                                if (user !== username && typeof onStartChat === 'function') {
                                                    onStartChat(user);
                                                }
                                            }}
                                        >
                                            <span style={styles.onlineIndicator}>
                                                {isOnline ? '🟢' : '⚫'}
                                            </span>
                                            <span style={styles.userNameText}>{user}</span>
                                            {user === username && (
                                                <span style={styles.youBadge}>(You)</span>
                                            )}
                                            <span style={{
                                                fontSize: '12px',
                                                color: isOnline ? '#667eea' : '#999',
                                                fontWeight: '600',
                                            }}>
                                                {isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Groups Section */}
                    <div style={styles.section}>
                        <div style={{ ...styles.sectionTitle, justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                🧑‍🤝‍🧑 Groups
                                <span style={styles.userCount}>{groups.length}</span>
                            </div>
                            <div style={styles.headerActions}>
                                <button
                                    style={styles.createGroupBtn}
                                    onClick={() => {
                                        if (typeof onCreateGroup !== 'function') return;
                                        const name = window.prompt('Group name');
                                        if (name && name.trim()) onCreateGroup(name.trim());
                                    }}
                                >
                                    + Create Group
                                </button>
                            </div>
                        </div>
                        {groups.length === 0 ? (
                            <div style={styles.noUsersMessage}>No groups yet</div>
                        ) : (
                            <ul style={styles.usersList}>
                                {groups.map((g) => {
                                    const isMember = Array.isArray(g.members) && g.members.includes(username);
                                    return (
                                        <li key={g._id || g.id || g.name} style={{ ...styles.userItem }} className="user-item"
                                            onClick={() => {
                                                if (typeof onOpenGroup === 'function') onOpenGroup(g);
                                            }}
                                        >
                                            <span style={styles.userNameText}>{g.name}</span>
                                            <span style={{ fontSize: 12, color: isMember ? '#667eea' : '#999', fontWeight: 600 }}>
                                                {Array.isArray(g.members) ? `${g.members.length} members` : ''} {isMember ? '• Joined' : ''}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                                        {/* Censorship Admin Section */}
                                        <div style={styles.section}>
                                                <h2 style={styles.sectionTitle}>🚫 Censored Words <span style={styles.userCount}>{censorWords.length}</span></h2>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                                                                    <input id="censor-new-word" placeholder="Add word" style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: 6 }}
                                                             onKeyDown={(e) => {
                                                                 if (e.key === 'Enter') {
                                                                     const val = e.currentTarget.value.trim();
                                                                     if (val) {
                                                                                                     if (typeof onAddCensorWord === 'function') onAddCensorWord(val);
                                                                         e.currentTarget.value='';
                                                                     }
                                                                 }
                                                             }} />
                                                        <button style={{ padding: '10px 16px', background: '#ffe8e8', border: '1px solid #ffb4b4', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                                                            onClick={() => {
                                                                const inp = document.getElementById('censor-new-word');
                                                                if (!inp) return;
                                                                const val = inp.value.trim();
                                                                                            if (val && typeof onAddCensorWord === 'function') {
                                                                                                onAddCensorWord(val);
                                                                    inp.value='';
                                                                }
                                                            }}>Add</button>
                                                </div>
                                                {censorWords.length === 0 ? (
                                                    <div style={styles.noUsersMessage}>No censored words</div>
                                                ) : (
                                                    <ul style={styles.usersList}>
                                                        {censorWords.map(w => (
                                                            <li key={w} style={{ ...styles.userItem, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontWeight: 600 }}>{w}</span>
                                                                <button style={{ padding: '4px 10px', background: '#fff1f1', border: '1px solid #ffb4b4', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                                                                                                        onClick={() => {
                                                                                                            if (typeof onRemoveCensorWord === 'function') onRemoveCensorWord(w);
                                                                                                        }}>Remove</button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Words are matched case-insensitively as whole words.</p>
                                        </div>
                </div>
            </div>
        </>
    );
}

export default LobbyPage;

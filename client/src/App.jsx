import { useState, useEffect } from 'react';
import LoginPage from './pages/loginPage';
import LobbyPage from './pages/lobbyPage';
import ChatPage from './pages/chatPage';
import GroupChatPage from './pages/groupChatPage';
import { jwtDecode } from 'jwt-decode';
import socket from './socket/socket';
import axios from 'axios';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);
  const [, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [forceLogoutMessage, setForceLogoutMessage] = useState('');
  const [groups, setGroups] = useState([]);
  const [peer, setPeer] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [censorItems, setCensorItems] = useState([]); // [{_id, word}]
  const censorWords = censorItems.map(w => w.word);

  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        handleLogout();
      }
    }
  }, [token]);

  useEffect(() => {
    console.log('Online users updated:', onlineUsers);
  }, [onlineUsers]);

  // Fetch all users from database and setup periodic refresh
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const API_URL = `http://${window.location.hostname}:3001/api/auth`;
        const response = await axios.get(`${API_URL}/users`);
        const newUsers = response.data.users || [];
        
        // Check for deleted users by comparing with previous state
        setAllUsers(prevUsers => {
          const deletedUsers = prevUsers.filter(u => !newUsers.includes(u));
          
          // Emit deleted user events for any users that disappeared
          deletedUsers.forEach(deletedUser => {
            console.log('Detected deleted user:', deletedUser);
            
            // If current user was deleted, force logout
            if (deletedUser === username) {
              setForceLogoutMessage('🔐 Your account has been deleted. Please login again.');
              setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setToken(null);
                setUsername(null);
                setIsOnline(false);
                setForceLogoutMessage('');
              }, 3000);
            }
          });
          
          return newUsers;
        });
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    // Fetch immediately
    fetchAllUsers();
    
    // Fetch every 3 seconds to detect deletions
    const interval = setInterval(fetchAllUsers, 3000);
    
    return () => clearInterval(interval);
  }, [username]);

  // Setup socket listeners for real-time updates (users & groups)
  useEffect(() => {
    const onUsersUpdated = (data) => {
      // Update user list in real-time when new user registers or is deleted
      console.log('Users updated from server:', data.users);
      setAllUsers(data.users || []);
    };

    const onUserDeleted = (data) => {
      // Handle when a user is deleted from database
      console.log('User deleted:', data.deletedUsername);
      
      // If the current user was deleted, force logout
      if (data.deletedUsername === username) {
        setForceLogoutMessage('🔐 Your account has been deleted. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          setToken(null);
          setUsername(null);
          setIsOnline(false);
          setForceLogoutMessage('');
        }, 3000);
      }
      
      // Remove from all users list
      setAllUsers(prevUsers => prevUsers.filter(u => u !== data.deletedUsername));
    };

    const onGroupsUpdated = (data) => {
      if (Array.isArray(data?.groups)) setGroups(data.groups);
    };

    socket.on('users_updated', onUsersUpdated);
    socket.on('user_deleted', onUserDeleted);
    socket.on('groups_updated', onGroupsUpdated);

    return () => {
      socket.off('users_updated', onUsersUpdated);
      socket.off('user_deleted', onUserDeleted);
      socket.off('groups_updated', onGroupsUpdated);
    };
  }, [username]);
  // connect socket on page visit
  useEffect(() => {
    // Only connect when authenticated
    if (token && username && socket.disconnected) {
      socket.connect();
    }

    const onConnect = () => {
      // if user already logged in (has token), notify server to mark as online
      if (token && username) {
        socket.emit('user_connected', { username });
        setIsOnline(true);
      }
    };

    const onOnlineUsers = (users) => {
      // users is array of { socketId, username }
      const isNowOnline = users.some(u => u.username === username);
      setIsOnline(isNowOnline);
      // you could store users list if needed
      setOnlineUsers(users);
    };

    const onForceLogout = (data) => {
      // server forced this socket to logout because user logged in elsewhere
      console.log('Received force_logout', data);
      setForceLogoutMessage('🔐 Your account was logged in from another device. Please login again.');
      // clear auth and reload to show login page after a short delay
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setToken(null);
        setUsername(null);
        setIsOnline(false);
        setForceLogoutMessage('');
      }, 3000);
    };

    socket.on('connect', onConnect);
    socket.on('online_users', onOnlineUsers);
    socket.on('force_logout', onForceLogout);

    return () => {
      socket.off('connect', onConnect);
      socket.off('online_users', onOnlineUsers);
      socket.off('force_logout', onForceLogout);
    };
  }, [token, username]);

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (err) {
      return true;
    }
  };

  const handleAuth = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    // if socket already connected, emit; otherwise the connect handler will emit
    if (socket.connected) {
      socket.emit('user_connected', { username: newUsername });
      setIsOnline(true);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    setIsOnline(false);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    if (socket.connected) socket.emit('user_disconnected');
    // Fully disconnect to avoid lingering connections after logout
    if (socket.connected) socket.disconnect();
  };

  // Fetch groups periodically when authenticated
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchGroups = async () => {
      try {
        const API_URL = `http://${window.location.hostname}:3001/api/chat/groups`;
        const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        const list = res.data?.groups || [];
        if (!cancelled) {
          setGroups(list);
          // If active group was deleted, auto exit
          if (activeGroup && !list.some(g => g._id === activeGroup._id)) {
            setActiveGroup(null);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    fetchGroups();
    const id = setInterval(fetchGroups, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token, activeGroup]);

  // Fetch censor words and subscribe to updates
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchWords = async () => {
      try {
        const API_URL = `http://${window.location.hostname}:3001/api/chat/censor`;
        const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled) setCensorItems(res.data?.words || []);
      } catch (e) { /* ignore */ }
    };
    fetchWords();
    const onCensorUpdated = (data) => {
      if (Array.isArray(data?.words)) setCensorItems(data.words.map(w => ({ _id: w._id, word: w.word || w })));
    };
    socket.on('censor_updated', onCensorUpdated);
    const id = setInterval(fetchWords, 10000); // occasional refresh
    return () => { cancelled = true; clearInterval(id); socket.off('censor_updated', onCensorUpdated); };
  }, [token]);

  if (!token) {
    return <LoginPage onAuth={handleAuth} />;
  }

  return (
    <>
      {forceLogoutMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            <h2 style={{ color: '#c33', marginTop: 0, fontSize: '24px' }}>Session Ended</h2>
            <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
              {forceLogoutMessage}
            </p>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: 0 }}>Redirecting to login...</p>
          </div>
        </div>
      )}
      {peer && !activeGroup && (
        <ChatPage
          me={username}
          peer={peer}
          token={token}
          censorWords={censorWords}
          onBack={() => setPeer(null)}
        />
      )}
      {activeGroup && !peer && (
        <GroupChatPage
          me={username}
          group={activeGroup}
          token={token}
          censorWords={censorWords}
          onBack={() => setActiveGroup(null)}
        />
      )}
      {!peer && !activeGroup && (
        <LobbyPage 
          username={username} 
          onlineUsers={onlineUsers}
          allUsers={allUsers}
          groups={groups}
          censorWords={censorWords}
          onAddCensorWord={async (word) => {
            try {
              const API_URL = `http://${window.location.hostname}:3001/api/chat/censor`;
              await axios.post(API_URL, { word }, { headers: { Authorization: `Bearer ${token}` } });
            } catch (e) {
              alert(e?.response?.data?.message || 'Failed to add word');
            }
          }}
          onRemoveCensorWord={async (word) => {
            try {
              const item = censorItems.find(w => (w.word || '').toLowerCase() === (word || '').toLowerCase());
              if (!item?._id) return;
              const API_URL = `http://${window.location.hostname}:3001/api/chat/censor/${item._id}`;
              await axios.delete(API_URL, { headers: { Authorization: `Bearer ${token}` } });
            } catch (e) {
              alert(e?.response?.data?.message || 'Failed to remove word');
            }
          }}
          onLogout={handleLogout}
          onStartChat={(u) => setPeer(u)}
          onCreateGroup={async (groupName) => {
            try {
              const API_URL = `http://${window.location.hostname}:3001/api/chat/groups`;
              await axios.post(API_URL, { name: groupName }, { headers: { Authorization: `Bearer ${token}` } });
            } catch (e) {
              alert(e?.response?.data?.message || 'Failed to create group');
            }
          }}
          onOpenGroup={(group) => {
            if (!group.members.includes(username)) {
              // join first via REST
              const API_URL = `http://${window.location.hostname}:3001/api/chat/groups/${group._id}/join`;
              axios.post(API_URL, {}, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                  setActiveGroup(res.data.group);
                })
                .catch(err => {
                  alert(err?.response?.data?.message || 'Failed to join group');
                });
            } else {
              setActiveGroup(group);
            }
          }}
        />
      )}
    </>
  );
}

export default App;

import { useState, useEffect } from 'react';
import LoginPage from './pages/loginPage';
import LobbyPage from './pages/lobbyPage';
import ChatPage from './pages/chatPage';
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
  const [peer, setPeer] = useState(null);

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

  // Setup socket listeners for real-time updates (listen from the start)
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

    socket.on('users_updated', onUsersUpdated);
    socket.on('user_deleted', onUserDeleted);

    return () => {
      socket.off('users_updated', onUsersUpdated);
      socket.off('user_deleted', onUserDeleted);
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
      {peer ? (
        <ChatPage
          me={username}
          peer={peer}
          token={token}
          onBack={() => setPeer(null)}
        />
      ) : (
        <LobbyPage 
          username={username} 
          onlineUsers={onlineUsers}
          allUsers={allUsers}
          onLogout={handleLogout}
          onStartChat={(u) => setPeer(u)}
        />
      )}
    </>
  );
}

export default App;

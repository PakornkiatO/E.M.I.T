import { useState, useEffect } from 'react';
import LoginPage from './pages/logginPage';
import { jwtDecode } from 'jwt-decode';
import socket from './socket/socket';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        handleLogout();
      }
    }
  }, [token]);
  // connect socket on page visit
  useEffect(() => {
    if (!socket.connected) {
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
      // setOnlineUsers(users);
    };

    const onForceLogout = (data) => {
      // server forced this socket to logout because user logged in elsewhere
      console.log('Received force_logout', data);
      // clear auth and reload to show login page
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setToken(null);
      setUsername(null);
      setIsOnline(false);
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
  };

  if (!token) {
    return <LoginPage onAuth={handleAuth} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>💬 Chat Application</h1>
        <div className="user-info">
          <span>👤 {username}</span>
          <button onClick={handleLogout} className="logout-btn">
            ออกจากระบบ
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;

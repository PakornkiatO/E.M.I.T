import { useState, useEffect, use } from 'react';
import LoginPage from './pages/logginPage';
import { jwtDecode } from 'jwt-decode';
import socket from './socket/socket';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);

  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        handleLogout();
      }
    }
  }, [token]);

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

  const connectSocket = () => {
    if (!socket.connected) {
      socket.data = { username };
      socket.connect();
    }
  };

  const disconnectSocket = () => {
    if (socket.connected) {
      socket.disconnect();
    }
  };

  const handleAuth = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);

    connectSocket();
  };

  const handleLogout = () => {
    disconnectSocket();
    setToken(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');

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

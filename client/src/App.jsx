import { useState, useEffect } from 'react';
// import socket from './socket/socket';
import LoginPage from './pages/logginPage';
import { jwtDecode } from 'jwt-decode';

function App() {
  // const [message, setMessage] = useState("");
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);

  useEffect(() => {
    // Check if token is expired when app loads
    if (token) {
      const isExpired = isTokenExpired(token);
      if (isExpired) {
        handleLogout();
      }
    }
  }, []);

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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setToken(null);
    setUsername(null);
  };

  // const sendMessage = () => {
  //   if (message.trim() !== "") {
  //     socket.emit("send_message", { message });
  //     setMessage(""); // clear input after sending
  //   }
  // };

  if (!token) {
    return <LoginPage onAuth={handleAuth} />;
  }

  return (
    // <div className="App">
    //   <input
    //     placeholder="Messages"
    //     value={message}
    //     onChange={(e) => setMessage(e.target.value)}
    //   />
    //   <button onClick={sendMessage}>Send</button>
    // </div>
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

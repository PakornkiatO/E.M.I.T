import { useState } from 'react';
import socket from './socket/socket';
import LoginPage from './pages/logginPage';

function App() {
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);

  const handleAuth = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("send_message", { message });
      setMessage(""); // clear input after sending
    }
  };

  if (!token) {
    return <LoginPage onAuth={handleAuth} />;
  }

  return (
    <div className="App">
      <input
        placeholder="Messages"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;

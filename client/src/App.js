import { useState } from 'react';
import './App.css';
import io from 'socket.io-client';

const socket = io.connect("http://localhost:3001");

function App() {
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("send_message", { message });
      setMessage(""); // clear input after sending
    }
  };

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

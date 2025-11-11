import { io } from "socket.io-client";

// Create a single socket instance but don't connect automatically.
// We'll call socket.connect() explicitly after successful auth to avoid duplicate connections.
const socket = io(`http://${window.location.hostname}:3001`, {
    autoConnect: false,
});

export default socket;
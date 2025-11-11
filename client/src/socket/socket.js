import { io } from "socket.io-client";

const socket = io.connect(`http://${window.location.hostname}:3001`);

export default socket;
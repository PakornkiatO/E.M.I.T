const express = require("express");
const http = require("http");
const {Server} = require("socket.io");
const https = require("https");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoute = require("./routes/authRoute");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const onlineUsers = new Map();

const io = new Server(server, {
    cors:{
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("✅ New socket connected:", socket.id);
    // send current online users to the newly connected socket
    const usersNow = Array.from(onlineUsers.entries()).map(([socketId, username]) => ({ socketId, username }));
    socket.emit('online_users', usersNow);

    // client notifies it's logged-in and ready to be marked online
    socket.on('user_connected', (data) => {
        const username = data && data.username ? data.username : null;
        if (!username) return;

        // Enforce single active session per username
        // Find any existing sockets for this username and force them to logout
        const prevSockets = [];
        for (const [sId, user] of onlineUsers.entries()) {
            if (user === username && sId !== socket.id) prevSockets.push(sId);
        }

        for (const prevId of prevSockets) {
            const prevSocket = io.sockets.sockets.get(prevId);
            if (prevSocket) {
                try {
                    // inform client it's been logged out elsewhere
                    prevSocket.emit('force_logout', { reason: 'logged_in_elsewhere' });
                } catch (err) {
                    // ignore
                }
                try { prevSocket.disconnect(true); } catch (e) {}
            }
            onlineUsers.delete(prevId);
        }

        // register this socket as the active one for username
        onlineUsers.set(socket.id, username);
        console.log(`👤 User connected: ${username} (Socket ID: ${socket.id})`);
        console.log(`📊 Total online users: ${onlineUsers.size}`);

        const updated = Array.from(onlineUsers.entries()).map(([socketId, username]) => ({ socketId, username }));
        io.emit('online_users', updated);
    });

    // explicit disconnect request from client (logout)
    socket.on('user_disconnected', () => {
        const username = onlineUsers.get(socket.id);
        if (username) {
            onlineUsers.delete(socket.id);
            console.log(`👤 User disconnected: ${username}`);
            console.log(`📊 Total online users: ${onlineUsers.size}`);

            const updated = Array.from(onlineUsers.entries()).map(([socketId, username]) => ({ socketId, username }));
            io.emit('online_users', updated);
        }
    });

    // handle socket close (tab closed, connection lost)
    socket.on('disconnect', () => {
        const username = onlineUsers.get(socket.id);
        if (username) {
            onlineUsers.delete(socket.id);
            console.log(`👤 User disconnected (disconnect): ${username} (Socket ID: ${socket.id})`);
            console.log(`📊 Total online users: ${onlineUsers.size}`);

            const updated = Array.from(onlineUsers.entries()).map(([socketId, username]) => ({ socketId, username }));
            io.emit('online_users', updated);
        } else {
            console.log(`❌ Disconnected: ${socket.id}`);
        }
    });
});

app.use("/api/auth", authRoute);

function getPublicIp() {
    return new Promise((resolve) => {
        https.get('https://api.ipify.org?format=json', (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.ip || 'localhost');
                } catch (err) {
                    resolve('localhost');
                }
            });
        }).on('error', () => resolve('localhost'));
    });
}

server.listen(3001, async () => {
    const ip = await getPublicIp();
    console.log(`🚀 Server is running on http://${ip}:3001`);
});
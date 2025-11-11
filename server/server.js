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
    onlineUsers.set(socket.id, socket.data.username);
    console.log(`📊 Total online users: ${onlineUsers.size}`);

    socket.on("disconnect", () => {
        console.log(`❌ Disconnected: ${socket.id}`);
        console.log(`👤 User disconnected: ${onlineUsers[socket.id]} (Socket ID: ${socket.id})`);
        onlineUsers.delete(socket.id);
        console.log(`📊 Total online users: ${onlineUsers.size}`);
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